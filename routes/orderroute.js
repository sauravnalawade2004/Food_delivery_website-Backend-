import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateSatus, userOrder, verifyOrder } from "../controllers/ordercontroller.js";
import orderModel from "../models/ordermodel.js";


const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder)
orderRouter.post("/verify",verifyOrder)
orderRouter.post("/userorders",authMiddleware,userOrder)
orderRouter.get("/list",listOrders)
orderRouter.post("/status",updateSatus)


export default orderRouter;