import mongoose from "mongoose";
import { Product } from "../models/Productmodel.js";
import { Inventory } from "../models/inventrymodel.js";
import { AuditLog } from "../models/Auditlogmodel.js";

/**
 * Core inventory service — handles all stock movements transactionally.
 * Every function runs inside a MongoDB session to prevent race conditions.
 */

// ─── Reduce stock when an order is placed ─────────────────────────────────────
export const deductStockForOrder = async (items, orderId, performedBy, session) => {
    for (const item of items) {
        const product = await Product.findById(item.product).session(session);

        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        if (!product.isActive) {
            throw new Error(`Product is inactive: ${product.name}`);
        }
        if (product.currentStock < item.quantity) {
            throw new Error(
                `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`
            );
        }

        const stockBefore = product.currentStock;
        const stockAfter = stockBefore - item.quantity;

        // Update snapshot
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { currentStock: -item.quantity } },
            { session, new: true }
        );

        // Ledger entry
        await Inventory.create([{
            product: item.product,
            type: "SALE",
            quantity: -item.quantity,
            stockBefore,
            stockAfter,
            referenceId: orderId,
            referenceModel: "Order",
            note: `Stock deducted for order ${orderId}`,
            performedBy,
        }], { session });
    }
};

// ─── Add stock back when order is cancelled/returned ─────────────────────────
export const restoreStockForReturn = async (items, orderId, performedBy, session) => {
    for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) throw new Error(`Product not found: ${item.product}`);

        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + item.quantity;

        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { currentStock: item.quantity } },
            { session }
        );

        await Inventory.create([{
            product: item.product,
            type: "RETURN",
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            referenceId: orderId,
            referenceModel: "Order",
            note: `Stock restored for cancelled/returned order ${orderId}`,
            performedBy,
        }], { session });
    }
};

// ─── Manual stock adjustment (admin/superadmin) ───────────────────────────────
export const adjustStock = async ({ productId, type, quantity, note, performedBy }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).session(session);
        if (!product) throw new Error("Product not found");

        const allowedTypes = ["OPENING", "PURCHASE", "DAMAGE", "ADJUSTMENT"];
        if (!allowedTypes.includes(type)) throw new Error(`Invalid adjustment type: ${type}`);

        const isDeduction = ["DAMAGE"].includes(type);
        const actualQty = isDeduction ? -Math.abs(quantity) : Math.abs(quantity);

        const newStock = product.currentStock + actualQty;
        if (newStock < 0) throw new Error("Stock cannot go below zero");

        const stockBefore = product.currentStock;
        const stockAfter = newStock;

        await Product.findByIdAndUpdate(
            productId,
            { $set: { currentStock: stockAfter } },
            { session }
        );

        const ledgerEntry = await Inventory.create([{
            product: productId,
            type,
            quantity: actualQty,
            stockBefore,
            stockAfter,
            note: note || `Manual ${type} adjustment`,
            performedBy,
        }], { session });

        // Audit log
        await AuditLog.create([{
            performedBy,
            role: "admin",
            action: "STOCK_ADJUSTED",
            entity: "Inventory",
            entityId: ledgerEntry[0]._id,
            description: `${type} adjustment: ${product.name} | ${stockBefore} → ${stockAfter}`,
            before: { stock: stockBefore },
            after: { stock: stockAfter },
        }], { session });

        await session.commitTransaction();
        return ledgerEntry[0];
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// ─── Get full stock ledger for a product ─────────────────────────────────────
export const getProductLedger = async (productId, { page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [ledger, total] = await Promise.all([
        Inventory.find({ product: productId })
            .populate("performedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Inventory.countDocuments({ product: productId }),
    ]);

    return {
        ledger,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
        },
    };
};

// ─── Get all low stock products ───────────────────────────────────────────────
export const getLowStockProducts = async () => {
    return await Product.find({
        isActive: true,
        $expr: { $lte: ["$currentStock", "$lowStockThreshold"] },
    }).select("name sku currentStock lowStockThreshold unit category");
};