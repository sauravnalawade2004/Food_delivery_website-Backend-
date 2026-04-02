import mongoose from "mongoose";
import { Product } from "../models/Productmodel.js";


let Inventory = null;
let logAction  = null;

try {
    const invModule   = await import("../models/inventrymodel.js"); // Corrected file path
    Inventory         = invModule.Inventory;
} catch {
    console.warn("[ProductController] inventoryModel not found — ledger entries will be skipped.");
}

try {
    const auditModule = await import("../services/auditservices.js"); // Corrected file path
    logAction         = auditModule.logAction;
} catch {
    console.warn("[ProductController] auditService not found — audit logs will be skipped.");
}

// ─── Create Product (simplified for admin panel)
export const createProduct = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Product image is required. Make sure you selected a file.",
            });
        }

        const {
            name,
            description = "",
            price,       // form sends "price"
            costPrice,
            category,
            sku,
            openingStock = "0",      // FIX: was being ignored — now read from form
            lowStockThreshold = "10",
            unit = "pcs",
            isActive = "true",
        } = req.body;

        const sellingPriceNum = Number(price);
        const costPriceNum = Number(costPrice);

        if (!name?.trim()) throw new Error("Product name is required.");
        if (!sku?.trim()) throw new Error("SKU is required.");
        if (!category) throw new Error("Category is required.");
        if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
            throw new Error("Valid selling price is required.");
        }
        if (isNaN(costPriceNum) || costPriceNum <= 0) {
            throw new Error("Valid cost price is required.");
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            image: req.file.filename,
            category,
            sku: sku.trim().toUpperCase(),
            // keep both price and sellingPrice in sync
            price: sellingPriceNum,
            sellingPrice: sellingPriceNum,
            costPrice: costPriceNum,
            // FIX: was hardcoded to 0 — now uses openingStock from the form
            currentStock: Number(openingStock) || 0,
            lowStockThreshold: Number(lowStockThreshold) || 10,
            unit: unit || "pcs",
            isActive: isActive === "true",
        });

        res
            .status(201)
            .json({ success: true, message: "Product added successfully.", product });
    } catch (error) {
        console.error("Error in createProduct:", error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `A product with this ${field} already exists. Please use a different ${field}.`,
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get All Products ─────────────────────────────────────────────────────────
export const getAllProducts = async (req, res) => {
    try {
        const {
            page      = 1,
            limit     = 20,
            category,
            isActive,
            lowStock,
            search,
            sortBy    = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = {};
        if (category)        query.category = category;
        // FIX: req.query values are always strings, never undefined when not sent
        // Use truthiness check instead — empty string is falsy, "true"/"false" are truthy
        if (isActive)        query.isActive = isActive === "true";
        if (lowStock === "true") query.$expr = { $lte: ["$currentStock", "$lowStockThreshold"] };
        if (search) {
            query.$or = [
                { name:     { $regex: search, $options: "i" } },
                { sku:      { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        console.log("Query:", query); // Log the query for debugging

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

        const [products, total] = await Promise.all([
            Product.find(query).sort(sort).skip(skip).limit(Number(limit)),
            Product.countDocuments(query),
        ]);

        console.log("Products fetched:", products); // Log the fetched products

        res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
    } catch (error) {
        console.error("Error in getAllProducts:", error); // Log the error details
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get Single Product ────────────────────────────────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Update Product ────────────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const before = product.toObject();

        // Map price → sellingPrice
        if (req.body.price && !req.body.sellingPrice) {
            req.body.sellingPrice = Number(req.body.price);
            delete req.body.price;
        }

        // Never allow direct stock change here
        delete req.body.currentStock;

        // New image uploaded?
        if (req.file) req.body.image = req.file.filename;

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (logAction && req.user) {
            await logAction({
                performedBy: req.user.id,
                role:        req.user.role,
                action:      "PRODUCT_UPDATED",
                entity:      "Product",
                entityId:    updated._id,
                description: `Product updated: ${updated.name}`,
                before,
                after:       updated.toObject(),
                req,
            });
        }

        res.status(200).json({ success: true, product: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Deactivate Product ────────────────────────────────────────────────────────
export const deactivateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product deactivated", product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Activate Product ─────────────────────────────────────────────────────────
export const activateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product activated", product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Low Stock Products 
export const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            isActive: true,
            $expr: { $lte: ["$currentStock", "$lowStockThreshold"] },
        }).select("name sku currentStock lowStockThreshold unit category");
        res.status(200).json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};