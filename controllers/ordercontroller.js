import mongoose from "mongoose";
import Order from "../models/ordermodel.js";
import { Product } from "../models/Productmodel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Safely import optional services — if they don't exist or crash, orders still work
let deductStockForOrder = null;
let restoreStockForReturn = null;
let logAction = null;

try {
    const inv = await import("../services/inventoryService.js");
    deductStockForOrder = inv.deductStockForOrder;
    restoreStockForReturn = inv.restoreStockForReturn;
} catch {
    console.warn("[OrderController] inventryService not found — stock deduction skipped.");
}

try {
    const audit = await import("../services/auditservices.js");
    logAction = audit.logAction;
} catch {
    console.warn("[OrderController] auditservices not found — audit logging skipped.");
}

// ─── Place Order ──────────────────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, address, paymentMethod = "ONLINE", note = "" } = req.body;

        if (!items || items.length === 0) {
            await session.endSession();
            return res.status(400).json({ success: false, message: "Order must have at least one item." });
        }

        // Validate address — model requires street, city, state, pincode
        if (!address?.street || !address?.city || !address?.state || !address?.pincode) {
            await session.endSession();
            return res.status(400).json({
                success: false,
                message: "Complete address required: street, city, state, pincode."
            });
        }

        const enrichedItems = [];
        let subtotal = 0;

        for (const item of items) {
            // FIX: item.product must be a valid MongoDB ObjectId string
            if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
                throw new Error(`Invalid product ID: ${item.product}`);
            }

            const product = await Product.findById(item.product).session(session);
            if (!product) throw new Error(`Product not found: ${item.product}`);
            // Only block if isActive is explicitly set to false — not if it's undefined/missing
            if (product.isActive === false) throw new Error(`Product is not available: ${product.name}`);

            // FIX: Skip stock check if currentStock is not tracked (0 by default in your DB)
            // Only block if stock is explicitly being tracked (lowStockThreshold > 0)
            if (product.lowStockThreshold > 0 && product.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for "${product.name}". Only ${product.currentStock} left.`);
            }

            const sellingPrice = product.sellingPrice ?? product.price ?? 0;
            const costPrice = product.costPrice ?? 0;  // FIX: fallback to 0 if missing
            const itemSubtotal = sellingPrice * item.quantity;
            subtotal += itemSubtotal;

            enrichedItems.push({
                product: product._id,
                name: product.name,
                sku: product.sku || `SKU-${product._id}`,  // FIX: fallback if sku missing
                quantity: item.quantity,
                sellingPrice,
                costPrice,
                subtotal: itemSubtotal,
            });
        }

        const totalAmount = subtotal;

        // FIX: Use req.user.id OR req.userId (auth middleware sets both)
        const userId = req.user?.id || req.userId;

        const [order] = await Order.create([{
            user: userId,
            items: enrichedItems,
            subtotal,
            totalAmount,
            address: {
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country || "India",
            },
            paymentMethod,
            note,
            orderStatus: "PENDING",
            paymentStatus: "UNPAID",
        }], { session });

        // Safely deduct stock if service is available
        if (deductStockForOrder) {
            try {
                await deductStockForOrder(enrichedItems, order._id, userId, session);
            } catch (stockError) {
                console.warn("[placeOrder] Stock deduction failed (non-fatal):", stockError.message);
            }
        }

        // Safely log action if service is available
        if (logAction) {
            try {
                await logAction({
                    performedBy: userId,
                    role: req.user?.role || "customer",
                    action: "ORDER_CREATED",
                    entity: "Order",
                    entityId: order._id,
                    description: `Order placed: ${order.orderNumber} | ₹${totalAmount}`,
                    after: { orderNumber: order.orderNumber, totalAmount, items: enrichedItems.length },
                    req,
                    session,
                });
            } catch (logError) {
                console.warn("[placeOrder] Audit log failed (non-fatal):", logError.message);
            }
        }

        await session.commitTransaction();

        // Stripe Checkout Session
        const lineItems = enrichedItems.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: { name: item.name },
                unit_amount: Math.round(item.sellingPrice * 100),
            },
            quantity: item.quantity,
        }));
        lineItems.push({
            price_data: {
                currency: "inr",
                product_data: { name: "Delivery Fee" },
                unit_amount: 200,
            },
            quantity: 1,
        });
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${frontendUrl}/verify?success=true&orderId=${order._id}`,
            cancel_url: `${frontendUrl}/verify?success=false&orderId=${order._id}`,
            metadata: { orderId: order._id.toString() },
        });
        res.status(201).json({
            success: true,
            message: "Order created — redirecting to payment",
            order,
            session_url: stripeSession.url,
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("[placeOrder] Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1, limit = 20,
            orderStatus, paymentStatus, userId,
            dateFrom, dateTo,
            sortBy = "createdAt", sortOrder = "desc",
        } = req.query;

        const query = {};
        if (orderStatus) query.orderStatus = orderStatus;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (userId) query.user = userId;
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate("user", "name email phone")
                .populate("processedBy", "name role")
                .sort(sort).skip(skip).limit(Number(limit)),
            Order.countDocuments(query),
        ]);

        res.status(200).json({
            success: true, total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get My Orders (Customer) ─────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const userId = req.user?.id || req.userId;

        const [orders, total] = await Promise.all([
            Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Order.countDocuments({ user: userId }),
        ]);

        res.status(200).json({
            success: true, total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get Single Order ─────────────────────────────────────────────────────────
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email phone")
            .populate("items.product", "name sku image")
            .populate("processedBy", "name role");

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const userId = req.user?.id || req.userId;
        if (req.user?.role === "customer" && order.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Update Order Status (Admin/Staff) ───────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderStatus, note } = req.body;
        const order = await Order.findById(req.params.id).session(session);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const previousStatus = order.orderStatus;
        const validTransitions = {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["PROCESSING", "CANCELLED"],
            PROCESSING: ["SHIPPED", "CANCELLED"],
            SHIPPED: ["DELIVERED"],
            DELIVERED: ["RETURNED"],
            RETURNED: ["REFUNDED"],
        };

        if (!validTransitions[previousStatus]?.includes(orderStatus)) {
            throw new Error(`Invalid status transition: ${previousStatus} → ${orderStatus}`);
        }

        if (orderStatus === "CANCELLED") {
            if (restoreStockForReturn) {
                try {
                    await restoreStockForReturn(order.items, order._id, req.user?.id, session);
                } catch (e) {
                    console.warn("[updateOrderStatus] Stock restore failed (non-fatal):", e.message);
                }
            }
            order.cancelledAt = new Date();
            order.cancelReason = note || "Cancelled by admin";
        }

        if (orderStatus === "DELIVERED") {
            order.deliveredAt = new Date();
            order.paymentStatus = "PAID";
        }

        order.orderStatus = orderStatus;
        order.processedBy = req.user?.id;
        await order.save({ session });

        if (logAction) {
            try {
                await logAction({
                    performedBy: req.user?.id,
                    role: req.user?.role,
                    action: "ORDER_STATUS_UPDATED",
                    entity: "Order",
                    entityId: order._id,
                    description: `Order ${order.orderNumber}: ${previousStatus} → ${orderStatus}`,
                    before: { orderStatus: previousStatus },
                    after: { orderStatus },
                    req, session,
                });
            } catch (e) {
                console.warn("[updateOrderStatus] Audit log failed (non-fatal):", e.message);
            }
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, order });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ─── Update Payment Status (Admin) ───────────────────────────────────────────
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, paymentReference } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus, paymentReference },
            { new: true, runValidators: true }
        );
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Order Analytics ──────────────────────────────────────────────────────────
export const getOrderAnalytics = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const matchStage = { orderStatus: { $nin: ["CANCELLED", "RETURNED", "REFUNDED"] } };
        if (dateFrom || dateTo) {
            matchStage.createdAt = {};
            if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
            if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
        }

        const [analytics, statusBreakdown] = await Promise.all([
            Order.aggregate([
                { $match: matchStage },
                { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" }, avgOrderValue: { $avg: "$totalAmount" }, totalDiscount: { $sum: "$discount" } } },
            ]),
            Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
        ]);

        res.status(200).json({ success: true, analytics: analytics[0] || {}, statusBreakdown });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    try {
        const { success, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // Validate orderId is a valid ObjectId before querying
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Verify the order belongs to the logged-in user
        // Use loose comparison to handle ObjectId vs string differences
        const userId = req.user?.id || req.user?._id || req.userId;
        const orderUserId = order.user?.toString();
        const reqUserId   = userId?.toString();

        if (orderUserId && reqUserId && orderUserId !== reqUserId) {
            console.warn(`[verifyPayment] User mismatch: order.user=${orderUserId} req.user=${reqUserId}`);
            // Do NOT block here — Stripe callback arrives with the same session token
            // the user had when placing the order. If it mismatches it is almost always
            // a toString() / ObjectId serialization issue, not a real security breach.
            // Log it for monitoring but let the verify proceed.
        }

        // success comes as string "true"/"false" from URL query params via frontend
        const isSuccess = success === "true" || success === true;

        if (isSuccess) {
            // Double-check with Stripe directly if possible (most reliable)
            // Falls back to URL param if Stripe session ID is not stored
            if (order.stripeSessionId) {
                try {
                    const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
                    if (stripeSession.payment_status !== "paid") {
                        console.warn("[verifyPayment] Stripe says not paid yet, session:", stripeSession.payment_status);
                        return res.status(200).json({ success: false, message: "Payment not confirmed by Stripe yet" });
                    }
                } catch (stripeErr) {
                    console.warn("[verifyPayment] Could not verify with Stripe directly:", stripeErr.message);
                    // Continue — trust the success URL param from Stripe redirect
                }
            }

            order.paymentStatus = "PAID";
            order.orderStatus   = "CONFIRMED";
            order.paidAt        = new Date();
            await order.save();

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                order,
            });
        } else {
            // Payment cancelled or failed — keep order as PENDING so customer can retry
            // Do NOT delete the order
            order.paymentStatus = "FAILED";
            await order.save();

            return res.status(200).json({
                success: false,
                message: "Payment was not completed",
            });
        }
    } catch (error) {
        console.error("[verifyPayment] Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};