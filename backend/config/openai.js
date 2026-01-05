import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Check if using OpenRouter API key (starts with sk-or-)
const isOpenRouter = process.env.OPENAI_API_KEY?.startsWith('sk-or-');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Use OpenRouter base URL if using OpenRouter key
    baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    defaultHeaders: isOpenRouter ? {
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'AI Productivity App'
    } : undefined
});

export default openai;
