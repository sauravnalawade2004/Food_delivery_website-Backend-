import express from "express";
import authMiddleware from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminauth.js";
import {
    placeOrder,
    getAllOrders,
    getMyOrders,
    getOrderAnalytics,
    getOrderById,
    updatePaymentStatus,
    updateOrderStatus,
    verifyPayment,
} from "../controllers/ordercontroller.js";
import Order from "../models/ordermodel.js";

const orderRouter = express.Router();

// GET /app/order/list  → list all orders (most recent first)
orderRouter.get("/list", adminAuthMiddleware, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email phone")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error in admin order list:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch orders" });
    }
});

// POST /app/order/status  → update status of a single order
orderRouter.post("/status", adminAuthMiddleware, async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body;

        if (!orderId || !orderStatus) {
            return res.status(400).json({ success: false, message: "orderId and orderStatus are required" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.orderStatus = orderStatus;
        await order.save();

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Error in admin order status update:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to update order status" });
    }
});

// ─── Customer-facing routes ───────────────────────────────────────────────────
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", authMiddleware, verifyPayment);
orderRouter.get("/myorders", authMiddleware, getMyOrders);
orderRouter.get("/analytics/sales", authMiddleware, getOrderAnalytics);

orderRouter.get("/all", authMiddleware, getAllOrders);

orderRouter.get("/:id", authMiddleware, getOrderById);
orderRouter.patch("/status/:id", authMiddleware, updateOrderStatus);
orderRouter.patch("/payment/:id", authMiddleware, updatePaymentStatus);

export default orderRouter;