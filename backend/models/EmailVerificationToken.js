import mongoose from 'mongoose';
import crypto from 'crypto';

const emailVerificationTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        used: {
            type: Boolean,
            default: false,
        },
        usedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-expire tokens after their expiration date
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create a new verification token
emailVerificationTokenSchema.statics.createToken = async function (userId) {
    // Invalidate any existing tokens for this user
    await this.updateMany(
        { userId, used: false },
        { used: true, usedAt: new Date() }
    );

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create token document
    await this.create({
        userId,
        token: hashedToken,
    });

    return { rawToken };
};

// Validate a verification token
emailVerificationTokenSchema.statics.validateToken = async function (rawToken) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const tokenDoc = await this.findOne({
        token: hashedToken,
        used: false,
        expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
        return { valid: false, error: 'Invalid or expired verification token' };
    }

    // Get the user
    const User = mongoose.model('User');
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
        return { valid: false, error: 'User not found' };
    }

    return { valid: true, tokenDoc, user };
};

// Mark token as used
emailVerificationTokenSchema.statics.markAsUsed = async function (tokenId) {
    await this.findByIdAndUpdate(tokenId, {
        used: true,
        usedAt: new Date(),
    });
};

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);

export default EmailVerificationToken;
