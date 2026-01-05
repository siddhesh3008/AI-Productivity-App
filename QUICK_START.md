# Quick Start Guide

## Prerequisites Checklist

Before you begin, make sure you have:

- ✅ **Node.js** (v18+) - [Download here](https://nodejs.org/)
- ✅ **MongoDB Atlas** account - [Sign up free](https://www.mongodb.com/cloud/atlas/register)
- ✅ **OpenAI API Key** - You already have one!

## 5-Minute Setup

### 1. Set Up MongoDB Atlas

If you haven't already:
1. Follow [MONGODB_SETUP.md](./MONGODB_SETUP.md) to create your database
2. Get your connection string
3. It should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### 2. Configure Backend
```bash
cd backend
```

Create `.env` file and add:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=super_secret_jwt_key_change_this
JWT_EXPIRE=7d
OPENAI_API_KEY=<your_openai_key>
CLIENT_URL=http://localhost:5173
```

**Note:** The OpenAI key has already been provided to you!

### 3. Configure Frontend
```bash
cd ../frontend
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

**Option A: Run Everything Together** (Recommended)
```bash
cd ..  # Go to root directory
npm run dev
```

**Option B: Run Separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 5. Access the App
- Open your browser
- Go to: **http://localhost:5173**
- Create an account and start using!

## First Steps in the App

1. ��� **Sign Up** - Create your account
2. 📝 **Create a Note** - Watch AI generate summary and tags automatically
3. ✅ **Add a Task** - Try the AI priority scoring
4. 🤖 **Chat with AI Assistant** - Ask "Suggest priorities"
5. ⚡ **Try Focus Mode** - Click on any task to break it down

## Troubleshooting

### Backend won't start?
- Check if MongoDB URI is correct
- Verify OpenAI API key is valid
- Make sure port 5000 is not in use

### Frontend shows API errors?
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend/.env
- Look at browser console for errors

### MongoDB connection failed?
- Verify IP is whitelisted in Atlas
- Check username/password in connection string
- Make sure cluster is active

### AI features not working?
- Verify OpenAI API key is correct
- Check if you have API credits
- Look at backend console for error messages

## Need Help?

Check out the full documentation:
- [README.md](./README.md) - Complete documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [MONGODB_SETUP.md](./MONGODB_SETUP.md) - Database setup

## What's Next?

Explore the features:
- Try different AI rewrite styles for notes
- Use AI priority scoring for tasks
- Activate Focus Mode to break down complex tasks
- Chat with the AI Assistant for productivity insights
- Toggle between light and dark themes

---

**🎉 You're all set! Happy productivity!**
