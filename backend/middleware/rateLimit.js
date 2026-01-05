/**
 * Rate limiting middleware for forgot-password endpoint
 * Uses in-memory storage (for production, use Redis)
 */

// In-memory store for rate limiting
const rateLimitStore = {
    byEmail: new Map(),
    byIp: new Map(),
};

// Configuration
const RATE_LIMIT_CONFIG = {
    email: {
        maxRequests: 3,
        windowMinutes: 15,
    },
    ip: {
        maxRequests: 10,
        windowMinutes: 15,
    },
};

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const cleanupWindow = 60 * 60 * 1000; // 1 hour

    for (const [key, data] of rateLimitStore.byEmail.entries()) {
        if (now - data.firstRequest > cleanupWindow) {
            rateLimitStore.byEmail.delete(key);
        }
    }

    for (const [key, data] of rateLimitStore.byIp.entries()) {
        if (now - data.firstRequest > cleanupWindow) {
            rateLimitStore.byIp.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Check if rate limit is exceeded
 */
const isRateLimited = (store, key, config) => {
    const now = Date.now();
    const windowMs = config.windowMinutes * 60 * 1000;

    const data = store.get(key);

    if (!data) {
        // First request
        store.set(key, {
            count: 1,
            firstRequest: now,
        });
        return false;
    }

    // Check if window has expired
    if (now - data.firstRequest > windowMs) {
        // Reset window
        store.set(key, {
            count: 1,
            firstRequest: now,
        });
        return false;
    }

    // Within window - check count
    if (data.count >= config.maxRequests) {
        return true;
    }

    // Increment count
    data.count++;
    return false;
};

/**
 * Rate limiting middleware for forgot-password
 * Limits by both email and IP address
 */
export const forgotPasswordRateLimit = (req, res, next) => {
    const email = req.body.email?.toLowerCase()?.trim();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Check IP rate limit first
    if (isRateLimited(rateLimitStore.byIp, ip, RATE_LIMIT_CONFIG.ip)) {
        // Log without sensitive data
        console.log(`[Rate Limit] IP rate limit exceeded: ${ip.substring(0, 10)}...`);

        // Return generic message (don't reveal rate limiting details)
        return res.status(200).json({
            message: 'If an account exists with that email, a password reset link has been sent.',
        });
    }

    // Check email rate limit if email provided
    if (email) {
        if (isRateLimited(rateLimitStore.byEmail, email, RATE_LIMIT_CONFIG.email)) {
            // Log without exposing full email
            const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
            console.log(`[Rate Limit] Email rate limit exceeded: ${maskedEmail}`);

            // Return same generic message
            return res.status(200).json({
                message: 'If an account exists with that email, a password reset link has been sent.',
            });
        }
    }

    next();
};

/**
 * Get rate limit status (for debugging/monitoring)
 */
export const getRateLimitStatus = () => ({
    emailEntries: rateLimitStore.byEmail.size,
    ipEntries: rateLimitStore.byIp.size,
});

export default forgotPasswordRateLimit;
