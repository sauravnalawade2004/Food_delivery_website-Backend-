import jwt from "jsonwebtoken";

// Admin/Staff authorization middleware (must be used after authMiddleware)
const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user exists and has admin/staff role
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Allow both admin and staff roles
        const allowedRoles = ["admin", "staff", "superadmin"];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin/Staff role required."
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Authorization error"
        });
    }
};

export default adminMiddleware;
