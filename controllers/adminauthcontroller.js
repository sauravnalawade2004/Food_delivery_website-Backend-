import { AdminUser } from "../models/AdminUsermodel.js";
import jwt from "jsonwebtoken";

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP to Admin ───────────────────────────────────────────────────────
export const sendAdminOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Validate phone number format
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Valid 10-digit phone number is required"
            });
        }

        // Check if admin user exists with this phone number
        const adminUser = await AdminUser.findOne({ phoneNumber });
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: "Phone number not registered as admin"
            });
        }

        if (!adminUser.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact administrator."
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        // Save OTP to database
        adminUser.otp = otp;
        adminUser.otpExpires = otpExpires;
        await adminUser.save();

        // IMPORTANT: In production, send OTP via SMS/Email service
        // For now, we'll log it to console (as requested)
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 OTP for Admin Login:`);
        console.log(`Phone: ${phoneNumber}`);
        console.log(`OTP: ${otp}`);
        console.log(`Role: ${adminUser.role}`);
        console.log(`Name: ${adminUser.name}`);
        console.log(`Expires in: 5 minutes`);
        console.log(`${'='.repeat(50)}\n`);

        res.status(200).json({
            success: true,
            message: "OTP sent to your registered phone number",
            // In development only - remove in production
            developmentOTP: otp
        });
    } catch (error) {
        console.error("Error in sendAdminOTP:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─── Verify OTP and Login ────────────────────────────────────────────────────
export const verifyAdminOTP = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        // Validate inputs
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Valid phone number is required"
            });
        }

        if (!otp || otp.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Valid 6-digit OTP is required"
            });
        }

        // Find admin user
        const adminUser = await AdminUser.findOne({ phoneNumber });
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found"
            });
        }

        if (!adminUser.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        // Check if OTP exists and is not expired
        if (!adminUser.otp) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (new Date() > adminUser.otpExpires) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP."
            });
        }

        // Verify OTP
        if (adminUser.otp !== otp) {
            return res.status(401).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // OTP verified - Clear OTP and create token
        adminUser.otp = null;
        adminUser.otpExpires = null;
        adminUser.isVerified = true;
        adminUser.lastLogin = new Date();
        await adminUser.save();

        // Create JWT token
        const token = jwt.sign(
            {
                id: adminUser._id,
                phoneNumber: adminUser.phoneNumber,
                role: adminUser.role,
                name: adminUser.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: adminUser._id,
                name: adminUser.name,
                phoneNumber: adminUser.phoneNumber,
                role: adminUser.role
            }
        });
    } catch (error) {
        console.error("Error in verifyAdminOTP:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const adminLogout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ─── Get Admin Profile ───────────────────────────────────────────────────────
export const getAdminProfile = async (req, res) => {
    try {
        const adminUser = await AdminUser.findById(req.admin.id).select('-otp -otpExpires');
        
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            admin: adminUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
