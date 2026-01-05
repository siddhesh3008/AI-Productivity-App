import mongoose from 'mongoose';
import crypto from 'crypto';

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        refreshToken: {
            type: String,
            required: true,
            select: false, // Don't include by default in queries
        },
        deviceInfo: {
            browser: { type: String, default: 'Unknown' },
            os: { type: String, default: 'Unknown' },
            device: { type: String, default: 'Unknown' },
        },
        ipAddress: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-expire sessions after 30 days of inactivity
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Create a new session with hashed refresh token
sessionSchema.statics.createSession = async function (userId, refreshToken, req) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Parse user agent for device info
    const userAgent = req?.headers?.['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);

    const session = await this.create({
        userId,
        refreshToken: hashedToken,
        deviceInfo,
        ipAddress: req?.ip || req?.connection?.remoteAddress || '',
        userAgent,
    });

    return session;
};

// Validate refresh token and return session
sessionSchema.statics.validateRefreshToken = async function (refreshToken) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await this.findOne({
        refreshToken: hashedToken,
        isActive: true,
    }).select('+refreshToken');

    if (!session) {
        return { valid: false, error: 'Invalid or expired session' };
    }

    // Update last active
    session.lastActive = new Date();
    await session.save();

    return { valid: true, session };
};

// Revoke a specific session
sessionSchema.statics.revokeSession = async function (sessionId, userId) {
    const session = await this.findOne({ _id: sessionId, userId });
    if (!session) {
        return { success: false, error: 'Session not found' };
    }

    session.isActive = false;
    await session.save();

    return { success: true };
};

// Revoke all sessions for a user except current
sessionSchema.statics.revokeAllExcept = async function (userId, currentSessionId) {
    await this.updateMany(
        { userId, _id: { $ne: currentSessionId }, isActive: true },
        { isActive: false }
    );
};

// Revoke all sessions for a user
sessionSchema.statics.revokeAll = async function (userId) {
    await this.updateMany({ userId, isActive: true }, { isActive: false });
};

// Get all active sessions for a user
sessionSchema.statics.getActiveSessions = async function (userId) {
    return this.find({ userId, isActive: true })
        .select('-refreshToken')
        .sort({ lastActive: -1 });
};

// Helper function to parse user agent
function parseUserAgent(ua) {
    const result = {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Desktop',
    };

    if (!ua) return result;

    // Detect browser
    if (ua.includes('Firefox')) result.browser = 'Firefox';
    else if (ua.includes('Edg')) result.browser = 'Edge';
    else if (ua.includes('Chrome')) result.browser = 'Chrome';
    else if (ua.includes('Safari')) result.browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) result.browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) result.os = 'Windows';
    else if (ua.includes('Mac OS')) result.os = 'macOS';
    else if (ua.includes('Linux')) result.os = 'Linux';
    else if (ua.includes('Android')) result.os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) result.os = 'iOS';

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android')) result.device = 'Mobile';
    else if (ua.includes('Tablet') || ua.includes('iPad')) result.device = 'Tablet';

    return result;
}

const Session = mongoose.model('Session', sessionSchema);

export default Session;
