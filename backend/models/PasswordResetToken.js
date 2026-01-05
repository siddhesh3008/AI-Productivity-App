import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index - automatically delete expired tokens after 24 hours
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

// Static method to create a new reset token
passwordResetTokenSchema.statics.createToken = async function (userId, ipAddress = null) {
    // Invalidate any existing unused tokens for this user
    await this.updateMany(
        { userId, used: false },
        { used: true, usedAt: new Date() }
    );

    // Generate secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash token for storage (never store raw token)
    const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    // Create token document with 10 minute expiry
    const tokenDoc = await this.create({
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        ipAddress,
    });

    // Return raw token (to be sent in email) - NEVER log this
    return {
        rawToken,
        tokenDoc,
    };
};

// Static method to validate and consume a token
passwordResetTokenSchema.statics.validateToken = async function (rawToken) {
    // Hash the provided token
    const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

    // Find token that exists, not expired, and not used
    const tokenDoc = await this.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
        used: false,
    }).populate('userId');

    if (!tokenDoc) {
        return { valid: false, error: 'Invalid or expired reset token' };
    }

    return { valid: true, tokenDoc, user: tokenDoc.userId };
};

// Static method to mark token as used
passwordResetTokenSchema.statics.markAsUsed = async function (tokenId) {
    await this.findByIdAndUpdate(tokenId, {
        used: true,
        usedAt: new Date(),
    });
};

// Static method to count recent requests for rate limiting
passwordResetTokenSchema.statics.countRecentRequests = async function (userId, minutes = 15) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return await this.countDocuments({
        userId,
        createdAt: { $gte: since },
    });
};

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
