import jwt from "jsonwebtoken";

// Admin Authentication Middleware
export const adminAuthMiddleware = async (req, res, next) => {
    try {
        // Accept token from custom header `token` or Authorization header
        const token = req.headers.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach decoded admin payload to both `req.admin` and `req.user`
            // so that existing controllers/middlewares that rely on `req.user`
            // (e.g. inventory & audit services) continue to work for admins.
            req.admin = decoded;
            req.user = decoded;
            req.userId = decoded.id;

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token expired. Please login again."
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Error in adminAuthMiddleware:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// Role-based Authorization Middleware
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};
