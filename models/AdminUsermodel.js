import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v); // 10 digit phone number
            },
            message: 'Phone number must be 10 digits'
        }
    },
    role: {
        type: String,
        enum: ['staff', 'manager', 'superadmin'],
        default: 'staff',
        required: true
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on every save
adminUserSchema.pre('save', async function() {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
});

export const AdminUser = mongoose.model('AdminUser', adminUserSchema);
