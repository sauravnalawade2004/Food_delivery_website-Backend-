import express from "express";
import { sendAdminOTP, verifyAdminOTP, adminLogout, getAdminProfile } from "../controllers/adminauthcontroller.js";
import { adminAuthMiddleware, requireRole } from "../middleware/adminauth.js";

const adminAuthRouter = express.Router();

// Public routes
adminAuthRouter.post("/send-otp", sendAdminOTP);
adminAuthRouter.post("/verify-otp", verifyAdminOTP);

// Protected routes
adminAuthRouter.post("/logout", adminAuthMiddleware, adminLogout);
adminAuthRouter.get("/profile", adminAuthMiddleware, getAdminProfile);

export default adminAuthRouter;
