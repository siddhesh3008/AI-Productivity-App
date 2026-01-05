import nodemailer from 'nodemailer';

// Transporter instance (created lazily)
let transporter = null;

// Create transporter - using environment variables
const getTransporter = () => {
    // Return cached transporter if already created
    if (transporter) return transporter;

    // For Gmail/SMTP
    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('📧 Email service: Using SMTP -', process.env.SMTP_HOST);
        return transporter;
    }

    // Fallback: Console log emails (development only)
    console.log('📧 Email service: Using console mode (no SMTP configured)');
    transporter = {
        sendMail: async (options) => {
            console.log('📧 Email would be sent:');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('---');
            return { messageId: 'dev-mode-' + Date.now() };
        },
    };
    return transporter;
};

// Helper to send email
const sendEmail = async (mailOptions) => {
    return await getTransporter().sendMail(mailOptions);
};

// Get the FROM address from environment or default
const getFromAddress = () => {
    return process.env.SMTP_FROM || process.env.EMAIL_FROM || 'AI Productivity <noreply@aiproductivity.app>';
};

const emailService = {
    /**
     * Send password reset email
     * @param {string} email - Recipient email address
     * @param {string} resetToken - Raw reset token (will be in URL)
     * @param {string} userName - User's name for personalization
     */
    async sendPasswordResetEmail(email, resetToken, userName) {
        // Build reset URL - NEVER log the resetToken
        const appDomain = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${appDomain}/reset-password/${resetToken}`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: 'Password Reset Request - AI Productivity',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="color: #374151; font-size: 16px;">Hi ${userName || 'there'},</p>
                        <p style="color: #374151; font-size: 16px;">
                            We received a request to reset your password for your AI Productivity account.
                            Click the button below to set a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #14b8a6, #0d9488); 
                                      color: white; 
                                      padding: 14px 30px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            ⏰ This link will expire in <strong>10 minutes</strong>.
                        </p>
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">
                                ⚠️ <strong>Didn't request this?</strong><br>
                                If you didn't request a password reset, please ignore this email. 
                                Your password will remain unchanged and this link will expire automatically.
                                If you're concerned about your account security, you can change your password from settings.
                            </p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            AI Productivity App - Stay organized, stay productive
                        </p>
                        <p style="color: #9ca3af; font-size: 11px; text-align: center;">
                            This is an automated email. Please do not reply.
                        </p>
                    </div>
                </div>
            `,
            text: `
Password Reset Request

Hi ${userName || 'there'},

We received a request to reset your password for your AI Productivity account.

Visit this link to set a new password:
${resetUrl}

⏰ This link expires in 10 minutes.

⚠️ Didn't request this?
If you didn't request a password reset, please ignore this email.
Your password will remain unchanged and this link will expire automatically.

---
AI Productivity App - Stay organized, stay productive
            `.trim(),
        };

        try {
            const info = await sendEmail(mailOptions);
            // Log success without exposing token
            console.log('[Email] Password reset email sent to:', email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[Email] Error sending password reset email:', error.message);
            throw error;
        }
    },

    /**
     * Send email verification email
     * @param {string} email - Recipient email address
     * @param {string} verificationToken - Raw verification token
     * @param {string} userName - User's name for personalization
     */
    async sendVerificationEmail(email, verificationToken, userName) {
        const appDomain = process.env.CLIENT_URL || 'http://localhost:5173';
        const verifyUrl = `${appDomain}/verify-email/${verificationToken}`;

        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: 'Verify Your Email - AI Productivity',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #14b8a6, #6366f1); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">📧 Verify Your Email</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="color: #374151; font-size: 16px;">Hi ${userName || 'there'},</p>
                        <p style="color: #374151; font-size: 16px;">
                            Thanks for signing up for AI Productivity! Please verify your email address to complete your registration and unlock all features.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verifyUrl}" 
                               style="background: linear-gradient(135deg, #14b8a6, #6366f1); 
                                      color: white; 
                                      padding: 14px 30px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            ⏰ This link will expire in <strong>24 hours</strong>.
                        </p>
                        <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="color: #0369a1; font-size: 14px; margin: 0;">
                                💡 <strong>Why verify?</strong><br>
                                Verifying your email helps us keep your account secure and ensures you can recover your password if needed.
                            </p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            AI Productivity App - Stay organized, stay productive
                        </p>
                    </div>
                </div>
            `,
            text: `
Verify Your Email

Hi ${userName || 'there'},

Thanks for signing up for AI Productivity! Please verify your email address to complete your registration.

Click this link to verify:
${verifyUrl}

⏰ This link expires in 24 hours.

---
AI Productivity App - Stay organized, stay productive
            `.trim(),
        };

        try {
            const info = await sendEmail(mailOptions);
            console.log('[Email] Verification email sent to:', email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[Email] Error sending verification email:', error.message);
            throw error;
        }
    },

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(email, userName) {
        const mailOptions = {
            from: getFromAddress(),
            to: email,
            subject: 'Welcome to AI Productivity! 🎉',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #14b8a6, #f59e0b); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to AI Productivity!</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="color: #374151; font-size: 18px;">Hi ${userName}!</p>
                        <p style="color: #374151; font-size: 16px;">
                            We're thrilled to have you on board. Your AI-powered productivity journey starts now!
                        </p>
                        <h3 style="color: #0d9488; margin-top: 25px;">Here's what you can do:</h3>
                        <ul style="color: #374151; font-size: 15px; line-height: 1.8;">
                            <li>📝 <strong>Smart Notes</strong> - Create notes with AI-generated summaries and tags</li>
                            <li>✅ <strong>Task Management</strong> - Organize tasks with AI priority scoring</li>
                            <li>🤖 <strong>AI Assistant</strong> - Get personalized productivity insights</li>
                            <li>📅 <strong>Schedule</strong> - Plan your day with natural language</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard" 
                               style="background: linear-gradient(135deg, #14b8a6, #0d9488); 
                                      color: white; 
                                      padding: 14px 30px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold;
                                      display: inline-block;">
                                Go to Dashboard
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            AI Productivity App - Stay organized, stay productive
                        </p>
                    </div>
                </div>
            `,
            text: `
Welcome to AI Productivity!

Hi ${userName}!

We're thrilled to have you on board. Your AI-powered productivity journey starts now!

Here's what you can do:
- Smart Notes - Create notes with AI-generated summaries and tags
- Task Management - Organize tasks with AI priority scoring
- AI Assistant - Get personalized productivity insights
- Schedule - Plan your day with natural language

Visit ${process.env.CLIENT_URL}/dashboard to get started!
            `.trim(),
        };

        try {
            const info = await sendEmail(mailOptions);
            console.log('[Email] Welcome email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[Email] Error sending welcome email:', error.message);
            // Don't throw - welcome email is not critical
            return { success: false, error: error.message };
        }
    },
};

export default emailService;

