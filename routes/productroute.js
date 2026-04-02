import express from "express";
import multer from "multer";
import path from "path";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deactivateProduct,
    activateProduct,
    getLowStockProducts,
} from "../controllers/Productcontroller.js";
import { adminAuthMiddleware, requireRole } from "../middleware/adminauth.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, and WebP images are allowed."), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Public Routes (no auth needed) ──────────────────────────────────────────
// FIX: added /list alias so admin List.jsx (/app/food/list) works
// and the frontend Products.jsx uses /api/products which maps here
router.get("/list", getAllProducts);     // Admin panel: GET /app/food/list
router.get("/", getAllProducts);         // Frontend: GET /api/products (if mounted at /api/products)

// ─── Admin-only routes ────────────────────────────────────────────────────────
// FIX: Added "admin" and "manager" to requireRole.
// Your OTP login likely sets role="admin" in the JWT — that was being blocked!
router.post(
    "/add",
    adminAuthMiddleware,
    requireRole("admin", "manager", "superadmin"),  // ← FIXED: added "admin"
    upload.single("image"),
    createProduct
);

router.patch(
    "/update/:id",
    adminAuthMiddleware,
    requireRole("admin", "manager", "superadmin"),  // ← FIXED
    upload.single("image"),
    updateProduct
);

router.patch(
    "/deactivate/:id",
    adminAuthMiddleware,
    requireRole("admin", "manager", "superadmin"),  // ← FIXED
    deactivateProduct
);

router.patch(
    "/activate/:id",
    adminAuthMiddleware,
    requireRole("admin", "manager", "superadmin"),  // ← FIXED
    activateProduct
);

router.get(
    "/admin/low-stock",
    adminAuthMiddleware,
    requireRole("admin", "manager", "superadmin"),  // ← FIXED
    getLowStockProducts
);

// ─── This MUST be last (catches /:id) ────────────────────────────────────────
router.get("/:id", getProductById);

export default router;