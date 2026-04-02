import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            "OPENING",    // first stock entry
            "PURCHASE",   // supplier restocking
            "SALE",       // stock reduced by customer order
            "RETURN",     // customer return — stock added back
            "DAMAGE",     // expired / broken stock written off
            "ADJUSTMENT", // manual admin correction
            "TRANSFER",   // inter-location stock transfer (future use)
        ],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        // positive = stock added, negative = stock removed
    },
    stockBefore: {
        type: Number,
        required: true,
    },
    stockAfter: {
        type: Number,
        required: true,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        // orderId for SALE/RETURN, purchaseId for PURCHASE, etc.
    },
    referenceModel: {
        type: String,
        enum: ["Order", "Purchase", null],
        default: null,
        // enables dynamic populate on referenceId
    },
    note: {
        type: String,
        trim: true,
        default: "",
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    location: {
        type: String,
        default: "MAIN", // future multi-warehouse support
    },
}, { timestamps: true });

// Indexes for fast ledger queries
InventorySchema.index({ product: 1, createdAt: -1 });
InventorySchema.index({ type: 1 });
InventorySchema.index({ referenceId: 1 });
InventorySchema.index({ performedBy: 1 });

export const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);