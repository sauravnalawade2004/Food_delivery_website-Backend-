import dotenv from 'dotenv';
dotenv.config();
import { AdminUser } from './models/AdminUsermodel.js';
import { ConnectDB } from './config/db.js';

const checkAdminUsers = async () => {
    try {
        await ConnectDB();
        console.log('✓ Connected to database\n');

        // Drop the entire AdminUser collection to clear indexes
        try {
            await AdminUser.collection.drop();
            console.log('🗑️  Dropped AdminUser collection\n');
        } catch (err) {
            if (err.code !== 26) { // 26 = namespace not found
                throw err;
            }
        }

        // Insert fresh test users
        const testUsers = [
            {
                name: "Rajesh Kumar",
                phoneNumber: "9876543210",
                role: "manager",
                isActive: true,
                isVerified: true
            },
            {
                name: "Priya Singh",
                phoneNumber: "9123456789",
                role: "staff",
                isActive: true,
                isVerified: true
            },
            {
                name: "Amit Patel",
                phoneNumber: "8765432109",
                role: "staff",
                isActive: true,
                isVerified: true
            },
            {
                name: "Admin User",
                phoneNumber: "9000000000",
                role: "superadmin",
                isActive: true,
                isVerified: true
            }
        ];

        const insertResult = await AdminUser.insertMany(testUsers);
        console.log(`✅ Inserted ${insertResult.length} new admin users\n`);

        // Verify users were inserted
        const allUsers = await AdminUser.find({});
        console.log('📋 Current Admin Users in Database:\n');
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. Phone: ${user.phoneNumber} | Name: ${user.name} | Role: ${user.role} | Active: ${user.isActive}`);
        });

        console.log(`\n✨ Total users: ${allUsers.length}\n`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkAdminUsers();
