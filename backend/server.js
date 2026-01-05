import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';

// Load env vars
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('Please check your .env file and add the missing variables.');
    console.error('See .env.example for reference.');
    process.exit(1);
}

// Optional env vars warning
const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'OPENAI_API_KEY'];
const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables (some features may not work):');
    missingOptional.forEach(envVar => console.warn(`   - ${envVar}`));
}

// Connect to database
connectDB();

// Route imports
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
import taskRoutes from './routes/tasks.js';
import assistantRoutes from './routes/assistant.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Productivity App API is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {},
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
