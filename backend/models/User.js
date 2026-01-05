import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            required: function () {
                // Password required only for local auth (not OAuth)
                return this.provider === 'local';
            },
            minlength: 6,
            select: false,
        },
        avatar: {
            type: String,
            default: '',
        },
        provider: {
            type: String,
            enum: ['local', 'google', 'microsoft', 'apple'],
            default: 'local',
        },
        providerId: {
            type: String,
            default: '',
        },
        // Google OAuth specific
        googleId: {
            type: String,
            default: '',
            sparse: true, // Allow null/empty but enforce uniqueness when set
        },
        // Email verification
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifiedAt: {
            type: Date,
            default: null,
        },
        preferences: {
            theme: {
                type: String,
                enum: ['light', 'dark', 'system'],
                default: 'system',
            },
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                taskReminders: { type: Boolean, default: true },
            },
            language: {
                type: String,
                default: 'en',
            },
        },
        // Token version for session invalidation (increment to force logout on all devices)
        tokenVersion: {
            type: Number,
            default: 0,
        },
        // Refresh token version (increment to invalidate all refresh tokens)
        refreshTokenVersion: {
            type: Number,
            default: 0,
        },
        // Legacy fields (kept for backward compatibility, will be removed in future)
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        welcomeEmailSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified and exists
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token (legacy method - kept for backward compatibility)
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Invalidate all existing sessions by incrementing token version
userSchema.methods.invalidateAllSessions = function () {
    this.tokenVersion = (this.tokenVersion || 0) + 1;
};

// Invalidate all refresh tokens by incrementing refresh token version
userSchema.methods.invalidateAllRefreshTokens = function () {
    this.refreshTokenVersion = (this.refreshTokenVersion || 0) + 1;
};

// Mark email as verified
userSchema.methods.verifyEmail = function () {
    this.emailVerified = true;
    this.emailVerifiedAt = new Date();
};

const User = mongoose.model('User', userSchema);

export default User;

