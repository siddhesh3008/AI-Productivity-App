import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Session from '../models/Session.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { protect } from '../middleware/auth.js';
import { forgotPasswordRateLimit } from '../middleware/rateLimit.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Access Token
const generateAccessToken = (id, tokenVersion = 0) => {
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m',
    });
};

// Generate JWT Refresh Token
const generateRefreshToken = (id, refreshTokenVersion = 0) => {
    return jwt.sign({ id, refreshTokenVersion, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    });
};

// Helper to create tokens and session
const createAuthTokens = async (user, req) => {
    const accessToken = generateAccessToken(user._id, user.tokenVersion || 0);
    const refreshToken = generateRefreshToken(user._id, user.refreshTokenVersion || 0);

    // Create session
    await Session.createSession(user._id, refreshToken, req);

    return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            provider: 'local',
        });

        if (user) {
            // Create tokens
            const { accessToken, refreshToken } = await createAuthTokens(user, req);

            // Send verification email (async, don't wait)
            EmailVerificationToken.createToken(user._id).then(({ rawToken }) => {
                emailService.sendVerificationEmail(user.email, rawToken, user.name);
            }).catch(err => console.error('Failed to send verification email:', err.message));

            // Send welcome email (async)
            emailService.sendWelcomeEmail(user.email, user.name).then(() => {
                User.findByIdAndUpdate(user._id, { welcomeEmailSent: true }).exec();
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                provider: user.provider,
                emailVerified: user.emailVerified,
                preferences: user.preferences,
                token: accessToken,
                refreshToken,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user has password (may be OAuth only)
        if (!user.password) {
            return res.status(401).json({
                message: 'This account uses Google login. Please use "Continue with Google".',
                provider: user.provider
            });
        }

        if (await user.matchPassword(password)) {
            const { accessToken, refreshToken } = await createAuthTokens(user, req);

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                provider: user.provider,
                googleId: user.googleId ? true : false,
                emailVerified: user.emailVerified,
                preferences: user.preferences,
                token: accessToken,
                refreshToken,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/google
// @desc    Login or register with Google
// @access  Public
router.post('/google', async (req, res) => {
    console.log('[Google Auth] Route hit');
    try {
        const { credential, code, access_token } = req.body;

        // Debug logging
        console.log('[Google Auth] Received - credential:', !!credential, 'code:', !!code, 'access_token:', !!access_token);

        if (!credential && !code && !access_token) {
            console.log('[Google Auth] No credentials provided');
            return res.status(400).json({ message: 'Google credential, code, or access_token is required' });
        }

        let payload;

        // Handle ID Token (from One Tap or implicit flow)
        if (credential) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch (err) {
                console.error('[Google Auth] ID token verification error:', err.message);
                return res.status(401).json({ message: 'Invalid Google token' });
            }
        }
        // Handle Authorization Code (from OAuth2 popup flow)
        else if (code) {
            try {
                // Exchange code for tokens
                const { tokens } = await googleClient.getToken({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: 'postmessage', // Required for popup flow
                });

                // Verify the ID token from the response
                const ticket = await googleClient.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch (err) {
                console.error('[Google Auth] Code exchange error:', err.message);
                return res.status(401).json({ message: 'Invalid Google authorization code' });
            }
        }
        // Handle Access Token (from token client)
        else if (access_token) {
            try {
                console.log('[Google Auth] Fetching user info with access_token (length:', access_token.length, ')');
                // Fetch user info from Google using access token
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                });
                const userInfo = response.data;
                console.log('[Google Auth] User info received:', userInfo.email);

                payload = {
                    sub: userInfo.sub,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                };
            } catch (err) {
                console.error('[Google Auth] Access token error:', err.message);
                if (err.response) {
                    console.error('[Google Auth] Google API response:', err.response.status, err.response.data);
                }
                return res.status(401).json({ message: 'Invalid Google access token', details: err.message });
            }
        }

        if (!payload || !payload.email) {
            console.error('[Google Auth] No valid payload extracted');
            return res.status(400).json({ message: 'Could not extract user info from Google' });
        }

        console.log('[Google Auth] Payload extracted:', { email: payload.email, sub: payload.sub });

        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists
        console.log('[Google Auth] Looking for existing user...');
        let user;
        try {
            user = await User.findOne({
                $or: [{ googleId }, { email }]
            });
            console.log('[Google Auth] Existing user found:', !!user);
        } catch (dbErr) {
            console.error('[Google Auth] Database lookup error:', dbErr.message);
            return res.status(500).json({ message: 'Database error during user lookup' });
        }

        if (user) {
            // User exists - update Google info if needed
            console.log('[Google Auth] Updating existing user...');
            try {
                if (!user.googleId) {
                    user.googleId = googleId;
                    user.provider = 'google';
                }
                if (picture && !user.avatar) {
                    user.avatar = picture;
                }
                // Google accounts are pre-verified
                if (!user.emailVerified) {
                    user.verifyEmail();
                }
                await user.save();
                console.log('[Google Auth] User updated successfully');
            } catch (saveErr) {
                console.error('[Google Auth] User save error:', saveErr.message);
                return res.status(500).json({ message: 'Database error during user update' });
            }
        } else {
            // Create new user
            console.log('[Google Auth] Creating new user...');
            try {
                user = await User.create({
                    name,
                    email,
                    googleId,
                    provider: 'google',
                    avatar: picture || '',
                    emailVerified: true, // Google emails are verified
                    emailVerifiedAt: new Date(),
                });
                console.log('[Google Auth] New user created:', user._id.toString());

                // Send welcome email (async, don't wait)
                emailService.sendWelcomeEmail(user.email, user.name).catch(err =>
                    console.error('Failed to send welcome email:', err.message)
                );
            } catch (createErr) {
                console.error('[Google Auth] User creation error:', createErr.message);
                return res.status(500).json({ message: 'Database error during user creation' });
            }
        }

        // Generate tokens
        console.log('[Google Auth] Creating tokens for user:', user._id.toString());
        try {
            const accessToken = jwt.sign(
                { id: user._id, tokenVersion: user.tokenVersion || 0 },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '15m' }
            );
            const refreshToken = jwt.sign(
                { id: user._id, refreshTokenVersion: user.refreshTokenVersion || 0, type: 'refresh' },
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
            );

            console.log('[Google Auth] Tokens created, sending response');

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                provider: user.provider,
                googleId: true,
                emailVerified: user.emailVerified,
                preferences: user.preferences,
                token: accessToken,
                refreshToken,
            });
        } catch (tokenErr) {
            console.error('[Google Auth] Token generation error:', tokenErr.message);
            return res.status(500).json({ message: 'Error generating authentication tokens' });
        }
    } catch (error) {
        console.error('[Google Auth] Unexpected error:', error.message);
        console.error('[Google Auth] Stack:', error.stack);
        res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
});

// @route   POST /api/auth/google/link
// @desc    Link Google account to existing user
// @access  Private
router.post('/google/link', protect, async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify Google token
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const { sub: googleId, email } = payload;

        // Check if Google ID is already linked to another account
        const existingGoogleUser = await User.findOne({ googleId });
        if (existingGoogleUser && existingGoogleUser._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({ message: 'This Google account is already linked to another user' });
        }

        // Verify email matches
        if (email !== req.user.email) {
            return res.status(400).json({ message: 'Google email does not match your account email' });
        }

        // Update user
        const user = await User.findById(req.user._id);
        user.googleId = googleId;
        if (!user.emailVerified) {
            user.verifyEmail();
        }
        await user.save();

        res.json({
            message: 'Google account linked successfully',
            googleId: true,
            emailVerified: user.emailVerified,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/google/unlink
// @desc    Unlink Google account
// @access  Private
router.post('/google/unlink', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!user.googleId) {
            return res.status(400).json({ message: 'No Google account linked' });
        }

        // Check if user has password (can't unlink if it's their only auth method)
        if (!user.password) {
            return res.status(400).json({
                message: 'Cannot unlink Google. Please set a password first.'
            });
        }

        user.googleId = '';
        user.provider = 'local';
        await user.save();

        res.json({ message: 'Google account unlinked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public (with valid refresh token)
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        // Validate session
        const { valid, session } = await Session.validateRefreshToken(refreshToken);
        if (!valid) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        // Get user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check refresh token version
        if (decoded.refreshTokenVersion !== undefined &&
            decoded.refreshTokenVersion < user.refreshTokenVersion) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user._id, user.tokenVersion);

        res.json({
            token: newAccessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Token refresh failed' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider,
            googleId: user.googleId ? true : false,
            emailVerified: user.emailVerified,
            preferences: user.preferences,
            createdAt: user.createdAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const validation = await EmailVerificationToken.validateToken(token);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.error });
        }

        const { tokenDoc, user } = validation;

        // Mark email as verified
        user.verifyEmail();
        await user.save();

        // Mark token as used
        await EmailVerificationToken.markAsUsed(tokenDoc._id);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Create new token
        const { rawToken } = await EmailVerificationToken.createToken(user._id);

        // Send email
        await emailService.sendVerificationEmail(user.email, rawToken, user.name);

        res.json({ message: 'Verification email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send verification email' });
    }
});

// @route   GET /api/auth/sessions
// @desc    Get all active sessions
// @access  Private
router.get('/sessions', protect, async (req, res) => {
    try {
        const sessions = await Session.getActiveSessions(req.user._id);

        // Mark current session
        const currentToken = req.headers.authorization?.split(' ')[1];

        res.json({
            sessions: sessions.map(session => ({
                _id: session._id,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                lastActive: session.lastActive,
                createdAt: session.createdAt,
                isCurrent: false, // Will be determined on frontend
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Revoke a specific session
// @access  Private
router.delete('/sessions/:sessionId', protect, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await Session.revokeSession(sessionId, req.user._id);
        if (!result.success) {
            return res.status(404).json({ message: result.error });
        }

        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/sessions/revoke-all
// @desc    Revoke all sessions except current
// @access  Private
router.post('/sessions/revoke-all', protect, async (req, res) => {
    try {
        const { exceptCurrent } = req.body;

        if (exceptCurrent) {
            // Need to find current session ID
            // For simplicity, we'll invalidate all and user needs to re-login
            const user = await User.findById(req.user._id);
            user.invalidateAllRefreshTokens();
            await user.save();
            await Session.revokeAll(req.user._id);
        } else {
            await Session.revokeAll(req.user._id);
        }

        res.json({ message: 'All sessions revoked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPasswordRateLimit, async (req, res) => {
    try {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Always return generic message (don't reveal if email exists)
        const genericMessage = 'If an account exists with that email, a password reset link has been sent.';

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log('[Forgot Password] Request for non-existent email');
            return res.json({ message: genericMessage });
        }

        // Check if user registered via OAuth only (no password)
        if (user.provider !== 'local' && !user.password) {
            console.log('[Forgot Password] OAuth-only user attempted password reset');
            return res.json({ message: genericMessage });
        }

        // Generate reset token using new model
        const { rawToken } = await PasswordResetToken.createToken(user._id, ipAddress);

        // Send email
        try {
            await emailService.sendPasswordResetEmail(user.email, rawToken, user.name);
            console.log('[Forgot Password] Reset email sent successfully');
            res.json({ message: genericMessage });
        } catch (err) {
            console.error('[Forgot Password] Failed to send email:', err.message);
            res.status(500).json({ message: 'Email could not be sent. Please try again.' });
        }
    } catch (error) {
        console.error('[Forgot Password] Error:', error.message);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Validate token using new model
        const validation = await PasswordResetToken.validateToken(token);

        if (!validation.valid) {
            console.log('[Reset Password] Invalid token attempt');
            return res.status(400).json({ message: validation.error });
        }

        const { tokenDoc, user } = validation;

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Set new password
        user.password = password;

        // Invalidate all existing sessions
        user.invalidateAllSessions();
        user.invalidateAllRefreshTokens();

        await user.save();

        // Revoke all sessions
        await Session.revokeAll(user._id);

        // Mark token as used
        await PasswordResetToken.markAsUsed(tokenDoc._id);

        console.log('[Reset Password] Password reset successful, all sessions invalidated');
        res.json({
            message: 'Password reset successful. Please login with your new password.',
            sessionInvalidated: true
        });
    } catch (error) {
        console.error('[Reset Password] Error:', error.message);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email, avatar } = req.body;

        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name || user.name;
            user.avatar = avatar !== undefined ? avatar : user.avatar;

            // Only allow email change if local auth
            if (email && user.provider === 'local' && email !== user.email) {
                // Check if new email already exists
                const emailExists = await User.findOne({ email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                user.email = email;
                user.emailVerified = false; // Require re-verification

                // Send new verification email
                EmailVerificationToken.createToken(user._id).then(({ rawToken }) => {
                    emailService.sendVerificationEmail(user.email, rawToken, user.name);
                }).catch(err => console.error('Failed to send verification email:', err.message));
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                provider: updatedUser.provider,
                googleId: updatedUser.googleId ? true : false,
                emailVerified: updatedUser.emailVerified,
                preferences: updatedUser.preferences,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
    try {
        const { theme, notifications, language } = req.body;

        const user = await User.findById(req.user._id);

        if (user) {
            if (theme) user.preferences.theme = theme;
            if (language) user.preferences.language = language;
            if (notifications) {
                user.preferences.notifications = {
                    ...user.preferences.notifications,
                    ...notifications,
                };
            }

            const updatedUser = await user.save();

            res.json({
                preferences: updatedUser.preferences,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change password (for logged in users)
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user uses OAuth only
        if (!user.password && user.provider !== 'local') {
            // User wants to set a password (currently OAuth only)
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }
            user.password = newPassword;
            await user.save();
            return res.json({ message: 'Password set successfully' });
        }

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;

        // Invalidate all other sessions
        user.invalidateAllSessions();

        await user.save();

        // Generate new token with updated version for current session
        const newToken = generateAccessToken(user._id, user.tokenVersion);

        res.json({
            message: 'Password changed successfully',
            token: newToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/set-password
// @desc    Set password for OAuth users
// @access  Private
router.post('/set-password', protect, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (user.password) {
            return res.status(400).json({ message: 'Password already set. Use change password instead.' });
        }

        user.password = password;
        user.provider = 'local'; // Now they can use both methods
        await user.save();

        res.json({ message: 'Password set successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, async (req, res) => {
    try {
        const { password, confirmation } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For local accounts, verify password
        if (user.password) {
            if (!password) {
                return res.status(400).json({ message: 'Password required to delete account' });
            }
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Password is incorrect' });
            }
        } else {
            // For OAuth-only accounts, require confirmation text
            if (confirmation !== 'DELETE') {
                return res.status(400).json({ message: 'Please type DELETE to confirm account deletion' });
            }
        }

        // Delete user's sessions
        await Session.deleteMany({ userId: user._id });

        // Delete user's password reset tokens
        await PasswordResetToken.deleteMany({ userId: user._id });

        // Delete email verification tokens
        await EmailVerificationToken.deleteMany({ userId: user._id });

        // Delete user and associated data
        await user.deleteOne();

        // TODO: Also delete user's tasks, notes, notifications

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
