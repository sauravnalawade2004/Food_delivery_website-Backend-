import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: ["customer", "staff", "admin", "superadmin"],
        required: true,
    },
    action: {
        type: String,
        enum: [
            // Product actions
            "PRODUCT_CREATED",
            "PRODUCT_UPDATED",
            "PRODUCT_DELETED",
            "PRODUCT_ACTIVATED",
            "PRODUCT_DEACTIVATED",
            // Inventory actions
            "STOCK_ADJUSTED",
            "STOCK_PURCHASE_ADDED",
            "STOCK_DAMAGE_RECORDED",
            // Order actions
            "ORDER_CREATED",
            "ORDER_STATUS_UPDATED",
            "ORDER_CANCELLED",
            "ORDER_REFUNDED",
            // User actions
            "USER_CREATED",
            "USER_UPDATED",
            "USER_DEACTIVATED",
            "USER_ROLE_CHANGED",
            // Auth actions
            "LOGIN",
            "LOGOUT",
            "PASSWORD_CHANGED",
            "PASSWORD_RESET",
            // System actions
            "SETTINGS_UPDATED",
            "REPORT_EXPORTED",
        ],
        required: true,
    },
    entity: {
        type: String,
        enum: ["Product", "Order", "User", "Inventory", "System"],
        required: true,
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null, // the document that was affected
    },
    description: {
        type: String,
        required: true, // human-readable summary of what happened
    },
    before: {
        type: mongoose.Schema.Types.Mixed,
        default: null, // snapshot of data before change
    },
    after: {
        type: mongoose.Schema.Types.Mixed,
        default: null, // snapshot of data after change
    },
    ipAddress: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Indexes for fast audit queries
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);