# Deployment Guide - AI Productivity App

This guide covers deploying your AI Productivity App using **Render** (backend) and **Vercel** (frontend) - both offer generous free tiers.

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub repository with your code pushed
- [ ] MongoDB Atlas database set up (you already have this)
- [ ] Google OAuth credentials configured
- [ ] OpenAI API key

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com) and sign up (free)
2. Connect your GitHub account

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `ai-productivity-api` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 3: Add Environment Variables
In Render dashboard, go to **Environment** tab and add:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars
JWT_REFRESH_EXPIRE=30d
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=https://your-app-name.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=AI Productivity <your_email@gmail.com>
```

### Step 4: Deploy
Click **"Create Web Service"** - Render will automatically build and deploy.

Your backend URL will be: `https://ai-productivity-api.onrender.com`

> ⚠️ **Note**: Free tier instances spin down after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Connect your GitHub account

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 3: Add Environment Variables
In Vercel dashboard, go to **Settings** → **Environment Variables**:

```
VITE_API_URL=https://ai-productivity-api.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 4: Deploy
Click **"Deploy"** - Vercel will build and deploy automatically.

Your frontend URL will be: `https://your-app-name.vercel.app`

---

## Part 3: Post-Deployment Configuration

### Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   - `https://your-app-name.vercel.app`
5. Add to **Authorized redirect URIs**:
   - `https://your-app-name.vercel.app`
6. **Publish your app** in OAuth consent screen (to allow any user to login)

### Update MongoDB Atlas Network Access
1. Go to MongoDB Atlas → **Network Access**
2. Add IP: `0.0.0.0/0` (allow all IPs for Render's dynamic IPs)
   - Or use Render's static IP add-on for better security

### Update Backend CORS
Ensure your backend's `CLIENT_URL` environment variable matches your Vercel URL exactly.

---

## Pricing Summary

| Service | Free Tier Includes |
|---------|-------------------|
| **Render** | 750 hours/month, auto-deploy, SSL |
| **Vercel** | Unlimited deployments, SSL, CDN, 100GB bandwidth |
| **MongoDB Atlas** | 512MB storage, shared cluster |
| **Google OAuth** | Completely free, unlimited users |
| **OpenAI API** | Pay-per-use (~$0.002 per 1K tokens for GPT-3.5) |

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `package.json` has correct `start` script

### CORS errors
- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- Check for trailing slashes (they matter!)

### Google login not working
- Ensure production URLs are added to Google OAuth credentials
- Verify `GOOGLE_CLIENT_ID` is set in both frontend AND backend
- Make sure OAuth consent screen is published

### Database connection issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access allows Render's IPs

---

## Auto-Deployment

Both Render and Vercel support automatic deployments:
- Push to `main` branch → automatic redeploy
- Preview deployments for pull requests (Vercel)

---

## Custom Domain (Optional)

Both platforms support custom domains on free tiers:
1. Add your domain in dashboard settings
2. Update DNS records as instructed
3. SSL certificates are automatic
