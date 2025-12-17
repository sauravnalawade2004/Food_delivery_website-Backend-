import express from "express";
import { addtocart,removeFromCart,getCart } from "../controllers/cartcontroller.js";
import authMiddleware from "../middleware/auth.js";


const cartRouter = express.Router();

cartRouter.post("/add",authMiddleware, addtocart);
cartRouter.post("/remove",authMiddleware, removeFromCart);
cartRouter.post("/get",authMiddleware, getCart);

export default cartRouter;
   




