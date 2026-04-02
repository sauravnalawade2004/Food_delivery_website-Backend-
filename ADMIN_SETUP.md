/**
 * ADMIN USER SEEDING GUIDE
 * 
 * This file contains instructions on how to add staff/manager users to the admin system.
 * Run this in MongoDB directly or use a seeding script.
 */

// ─── Step 1: Connect to MongoDB ───────────────────────────────────────────

// Use the correct database
use your_database_name

// ─── Step 2: Insert Admin Users ───────────────────────────────────────────

// Sample admin users to insert
db.adminusers.insertMany([
    {
        name: "Rajesh Kumar",
        phoneNumber: "9876543210",
        role: "manager",
        otp: null,
        otpExpires: null,
        isVerified: true,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Priya Singh",
        phoneNumber: "9123456789",
        role: "staff",
        otp: null,
        otpExpires: null,
        isVerified: true,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Amit Patel",
        phoneNumber: "8765432109",
        role: "staff",
        otp: null,
        otpExpires: null,
        isVerified: true,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Admin User",
        phoneNumber: "9000000000",
        role: "superadmin",
        otp: null,
        otpExpires: null,
        isVerified: true,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
])

// ─── Step 3: Verify Inserted Data ────────────────────────────────────────

db.adminusers.find()

// ─── Step 4: Query by Phone Number ───────────────────────────────────────

db.adminusers.findOne({ phoneNumber: "9876543210" })

// ─── Step 5: Update Admin User ───────────────────────────────────────────

db.adminusers.updateOne(
    { phoneNumber: "9876543210" },
    { 
        $set: { 
            isActive: false 
        } 
    }
)

// ─── Step 6: Delete Admin User ──────────────────────────────────────────

db.adminusers.deleteOne({ phoneNumber: "9000000000" })

/**
 * LOGIN FLOW EXPLANATION:
 * 
 * 1. User enters 10-digit phone number on login page
 * 2. Frontend sends POST to /admin/auth/send-otp
 * 3. Backend validates phoneNumber exists in AdminUser collection
 * 4. Backend generates 6-digit OTP and logs it to console
 * 5. Frontend shows OTP input field
 * 6. User enters OTP
 * 7. Frontend sends POST to /admin/auth/verify-otp
 * 8. Backend verifies OTP matches stored value and hasn't expired
 * 9. If valid:
 *    - Clear OTP from database
 *    - Create JWT token with user's role
 *    - Return token to frontend
 * 10. Frontend stores token in localStorage
 * 11. Based on role:
 *     - "staff": Show only Orders page
 *     - "manager": Show Add, List, Orders pages
 *     - "superadmin": Show all pages
 * 
 * PERMISSIONS:
 * - Staff: Can view orders only
 * - Manager: Can add products, view product list, view orders
 * - Superadmin: Full access to all features
 */

/**
 * TEST LOGIN CREDENTIALS:
 * 
 * Manager (Full Access):
 * Phone: 9876543210
 * Role: manager
 * 
 * Staff (Orders Only):
 * Phone: 9123456789
 * Role: staff
 * 
 * Admin:
 * Phone: 8765432109
 * Role: staff
 * 
 * Superadmin:
 * Phone: 9000000000
 * Role: superadmin
 */
