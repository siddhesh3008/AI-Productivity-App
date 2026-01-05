# 🚀 AI-Powered Productivity App

<div align="center">

**A production-ready, full-stack AI productivity application with intelligent task management, smart notes, and a personal AI assistant.**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?logo=openai&logoColor=white)](https://openai.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Live Demo](https://ai-productivity-app-ivory.vercel.app/) · [Features](#-key-features) · [Tech Stack](#%EF%B8%8F-tech-stack) · [Getting Started](#-quick-start) · [API Docs](./API_DOCUMENTATION.md)

</div>

---

## 📋 Executive Summary

AI Productivity App is a **production-ready SaaS application** demonstrating enterprise-grade architecture, security best practices, and modern AI integration. Built with React, Node.js, and MongoDB, it showcases:

- 🔐 **Enterprise Security**: JWT + Refresh Token rotation, Google OAuth 2.0, rate limiting, session management
- 🤖 **AI Integration**: OpenAI GPT-3.5 for intelligent note summarization, task prioritization, and personal assistance
- 📱 **Modern UX**: Responsive design, dark/light themes, real-time notifications, lazy loading
- ⚡ **Production Optimized**: 82KB gzipped bundle, code splitting, SEO meta tags, proper error handling

---

## ✨ Key Features

### 🔐 Authentication & Security
| Feature | Description |
|---------|-------------|
| **JWT + Refresh Tokens** | Secure authentication with 15-min access tokens and 30-day refresh token rotation |
| **Google OAuth 2.0** | One-click sign-in/sign-up with Google accounts |
| **Email Verification** | Verified email addresses with magic link tokens |
| **Password Reset** | Secure password recovery with rate-limited email delivery |
| **Session Management** | View and revoke active sessions across devices |
| **Account Linking** | Link/unlink Google account to existing email account |

### 📝 Smart Notes
- **AI-Generated Summaries**: Automatic 2-3 sentence summaries
- **Smart Tags**: AI categorizes notes with relevant tags
- **AI Rewrite Options**: Polish, convert to bullets, or shorten content
- **Full-text Search**: Find notes instantly

### ✅ Intelligent Task Manager
- **AI Priority Scoring**: Impact, effort, and urgency analysis
- **Focus Mode**: AI breaks tasks into actionable steps with motivation tips
- **Category Filtering**: Work, Study, Personal categories
- **Due Date Tracking**: Never miss deadlines

### 🤖 AI Productivity Assistant
- **Context-Aware Chat**: Understands your tasks and notes
- **Weekly Summaries**: AI-generated productivity insights
- **Priority Suggestions**: Smart recommendations on what to tackle next
- **Natural Language CRUD**: Create/update/delete tasks and notes via chat

### 🔔 Notification System
- Real-time notification bell with unread count
- Task due reminders
- Welcome messages for new users
- Mark as read functionality

### ⚙️ Comprehensive Settings
- **Profile Management**: Update name, email, avatar
- **Security**: Change password, set password for OAuth users
- **Connected Accounts**: Link/unlink Google
- **Preferences**: Theme, language, notification settings
- **Account Management**: Session control, account deletion

### 🎨 Modern UI/UX
- **Dark/Light Mode**: System preference detection + manual toggle
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Glassmorphism Design**: Modern aesthetic with smooth animations
- **Accessible**: Proper contrast ratios and keyboard navigation

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library with hooks and Suspense |
| Vite | Fast build tool with HMR |
| TailwindCSS | Utility-first styling |
| React Router 6 | Client-side routing |
| Axios | HTTP client with interceptors |
| Lucide React | Modern icon library |
| React Hot Toast | Notification toasts |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | JavaScript runtime |
| Express.js | Web framework |
| MongoDB Atlas | NoSQL database |
| Mongoose | ODM for MongoDB |
| JWT | Access & refresh token auth |
| bcryptjs | Password hashing |
| Nodemailer | Email delivery |
| Google Auth Library | OAuth 2.0 integration |
| OpenAI SDK | GPT-3.5 Turbo integration |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Render | Backend hosting (free tier) |
| Vercel | Frontend hosting (free tier) |
| MongoDB Atlas | Database (free tier) |
| Google Cloud | OAuth 2.0 provider |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- OpenAI API key
- Google Cloud OAuth credentials (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/AI_Powered_Productivity_App.git
cd AI_Powered_Productivity_App

# Install all dependencies
npm run install:all

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials

# Start development servers
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 📁 Architecture

```
AI_Powered_Productivity_App/
├── backend/
│   ├── config/           # Database & OpenAI configuration
│   ├── middleware/       # Auth & rate limiting middleware
│   ├── models/           # Mongoose schemas (User, Note, Task, Session, Notification)
│   ├── routes/           # RESTful API endpoints
│   ├── services/         # AI service & email service
│   └── server.js         # Express entry point
├── frontend/
│   ├── public/           # Static assets (favicon, og-image)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React Context (Auth, Theme, Notification)
│   │   ├── pages/        # Page components (lazy loaded)
│   │   └── utils/        # API client & helpers
│   └── index.html        # Entry HTML with SEO meta tags
├── DEPLOYMENT.md         # Step-by-step deployment guide
├── API_DOCUMENTATION.md  # Complete API reference
└── README.md
```

---

## 🔐 Security Implementation

| Security Measure | Implementation |
|-----------------|----------------|
| Password Hashing | bcrypt with salt rounds |
| Token Security | Short-lived access tokens (15m), rotating refresh tokens |
| Session Invalidation | Password change invalidates all sessions |
| Rate Limiting | Forgot password: 3/email, 10/IP per 15 min |
| CORS | Configured for specific origins |
| Input Validation | express-validator on all endpoints |
| XSS Prevention | React's built-in escaping |

---

## 📝 Resume-Ready Bullet Points

```
• Built a full-stack SaaS productivity application using React, Node.js, Express, and MongoDB 
  with AI-powered features serving intelligent task and note management

• Implemented enterprise-grade authentication with JWT access/refresh token rotation, 
  Google OAuth 2.0, email verification, and secure password reset flow

• Integrated OpenAI GPT-3.5 API for automatic note summarization, smart tagging, 
  content rewriting, task prioritization, and natural language task management

• Designed RESTful APIs with Express.js including rate limiting, input validation, 
  and comprehensive error handling following security best practices

• Built responsive, accessible UI with React 18, TailwindCSS, and code splitting 
  achieving 82KB gzipped bundle with lazy loading optimization

• Implemented real-time notification system, session management, and multi-provider 
  authentication with account linking capabilities

• Deployed production application on Vercel (frontend) and Render (backend) with 
  MongoDB Atlas, demonstrating DevOps and cloud deployment skills
```

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Summary:**
- **Backend**: Deploy to Render (free tier)
- **Frontend**: Deploy to Vercel (free tier)
- **Database**: MongoDB Atlas (free tier)

---

## 📄 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment
- [MongoDB Setup](./MONGODB_SETUP.md) - Database configuration
- [Quick Start](./QUICK_START.md) - Getting started guide

---

## 👨‍💻 Author

**Siddhesh Haldankar**

Full-stack developer passionate about building AI-powered applications with modern technologies.

---

<div align="center">

**⭐ Star this repository if you found it helpful! ⭐**

Made with ❤️ and ☕

</div>
