import dotenv from 'dotenv';
dotenv.config();
import { AdminUser } from './models/AdminUsermodel.js';
import { ConnectDB } from './config/db.js';

/**
 * ADMIN SEEDING SCRIPT
 * 
 * Usage: node seed-admin.js
 * This script adds initial admin users to the database
 */

const adminUsers = [
    {
        name: "Rajesh Kumar",
        phoneNumber: "9876543210",
        role: "manager",
        isActive: true
    },
    {
        name: "Priya Singh",
        phoneNumber: "9123456789",
        role: "staff",
        isActive: true
    },
    {
        name: "Amit Patel",
        phoneNumber: "8765432109",
        role: "staff",
        isActive: true
    },
    {
        name: "Admin User",
        phoneNumber: "9000000000",
        role: "superadmin",
        isActive: true
    }
];

const seedAdminUsers = async () => {
    try {
        // Connect to database
        await ConnectDB();
        console.log('✓ Connected to database');

        // Check if admin users already exist
        const existingUsers = await AdminUser.countDocuments();
        
        if (existingUsers > 0) {
            console.log(`\nDatabase already has ${existingUsers} admin user(s)`);
            console.log('Skipping seed to avoid duplicates.\n');
            process.exit(0);
        }

        // Insert admin users
        const result = await AdminUser.insertMany(adminUsers);
        
        console.log('\n✓ Admin users successfully seeded!\n');
        console.log('📋 Added Users:');
        console.log('─'.repeat(60));
        
        result.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name}`);
            console.log(`   Phone: ${user.phoneNumber}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.isActive ? '✓ Active' : '✗ Inactive'}`);
            console.log('');
        });

        console.log('─'.repeat(60));
        console.log('\n🔐 LOGIN CREDENTIALS:\n');
        
        adminUsers.forEach(user => {
            console.log(`${user.role.toUpperCase()}: ${user.phoneNumber} (${user.name})`);
        });

        console.log('\n💡 OTP will be logged to console during login in development mode.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin users:', error.message);
        if (error.code === 11000) {
            console.error('Duplicate phone number detected. Please ensure all phone numbers are unique.');
        }
        process.exit(1);
    }
};

// Run the seed
seedAdminUsers();
