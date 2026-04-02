import mongoose from 'mongoose';


const OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true, // snapshot at time of order (product name may change later)
    },
    sku: {
        type: String,
        required: true, // snapshot
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
    },
    sellingPrice: {
        type: Number,
        required: true, // snapshot at time of order
    },
    costPrice: {
        type: Number,
        required: true, // for profit calculation
    },
    subtotal: {
        type: Number,
        required: true, // quantity * sellingPrice
    },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        // auto-generated before save (see pre-save hook below)
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: (arr) => arr.length > 0,
            message: "Order must have at least one item",
        },
    },
    subtotal: {
        type: Number,
        required: true, // sum of all item subtotals before tax/discount
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true, // subtotal - discount + tax
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" },
    },
    orderStatus: {
        type: String,
        enum: [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "RETURNED",
            "REFUNDED",
        ],
        default: "PENDING",
    },
    paymentStatus: {
        type: String,
        enum: ["UNPAID", "PAID", "FAILED", "REFUNDED"],
        default: "UNPAID",
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "ONLINE", "WALLET", "UPI", "CARD"],
        default: "COD",
    },
    paymentReference: {
        type: String,
        default: null, // razorpay / stripe payment id
    },
    note: {
        type: String,
        default: "",
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancelReason: {
        type: String,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // staff/admin who processed it
    },
}, { timestamps: true });


OrderSchema.pre("save", async function () {
    if (this.isNew && !this.orderNumber) {
        try {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const count = await mongoose.model("Order").countDocuments();
            this.orderNumber = `ORD-${today}-${String(count + 1).padStart(4, "0")}`;
        } catch (err) {
            this.orderNumber = `ORD-${Date.now()}`;
        }
    }
});

// Indexes
OrderSchema.index({ user: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;