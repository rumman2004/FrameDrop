# 📸 FrameDrop

> A modern, full-stack photo sharing platform built for photographers.
> Upload, share, and manage your photo sessions with beautiful UI and secure access controls.

![FrameDrop Banner](https://img.shields.io/badge/FrameDrop-Photo%20Sharing-violet?style=for-the-badge&logo=camera)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20CDN-3448C5?style=for-the-badge&logo=cloudinary)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

FrameDrop is a full-stack web application that allows photographers to:

- Upload batches of photos and create shareable sessions
- Share secure, PIN-protected or public links with clients
- Set expiry times on shared sessions
- Manage their entire portfolio from a clean dashboard
- Admins can oversee all users, sessions, and platform analytics

The platform is designed to be **fast**, **secure**, and **beautiful** — with a dark-mode UI,
animated profile cards, tilt effects, and a fully responsive layout.

---

## ✨ Features

### 👤 Authentication
- JWT-based login and registration
- Persistent sessions via localStorage
- Secure password hashing with bcrypt
- Role-based access (User / Admin)

### 📁 File Sharing
- Upload up to 50 files per session
- Cloudinary CDN for fast, optimised image delivery
- PIN-protected share links
- Configurable session expiry
- Public or private share modes

### 🖼️ Profile
- Animated 3D tilt profile card
- Avatar upload with instant preview
- Live Cloudinary upload
- Fallback initials avatar

### 📊 Dashboard
- Session stats (total, active, expired)
- Quick share creation
- Session management (view, delete)

### 🛡️ Admin Panel
- User management (activate / deactivate)
- Platform-wide session overview
- Analytics dashboard
- Activity logs

### 🎨 UI / UX
- Fully dark-mode interface
- Animated profile card with pointer-reactive tilt
- Sweeping glare effects
- Responsive — mobile + desktop
- Accessible (aria labels, keyboard nav)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| Bcrypt | Password hashing |
| Multer | File upload handling |
| Cloudinary SDK | Image storage + CDN |
| Node-cron | Scheduled cleanup jobs |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend + Backend deployment |
| MongoDB Atlas | Managed cloud database |
| Cloudinary | Image hosting and transformation |

---

## 📁 Project Structure


```Folder
framedrop/
│
├── Server/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, avatar upload
│   │   ├── shareController.js     # Create, get, delete shares
│   │   └── adminController.js     # Admin dashboard logic
│   ├── jobs/
│   │   └── cleanupJob.js          # Cron job — deletes expired sessions
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   ├── adminAuth.js           # Admin-only middleware
│   │   └── upload.js              # Multer + Cloudinary config
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── ShareSession.js        # Share session schema
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── share.js               # /api/share/*
│   │   └── admin.js               # /api/admin/*
│   ├── server.js                  # Express app entry point
│   └── vercel.json                # Vercel serverless config
│
├── clint/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx         # Top navigation bar
│   │   │   │   └── UploadModal.jsx    # File upload modal
│   │   │   └── ui/
│   │   │       ├── ProfileCard.jsx    # Animated 3D profile card
│   │   │       ├── ContactCard.jsx    # User contact card
│   │   │       └── Card.jsx           # Base card component
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── hooks/
│   │   │   └── useAuth.js             # Auth context consumer hook
│   │   ├── lib/
│   │   │   ├── api.js                 # Axios instance
│   │   │   └── avatarUrl.js           # Safe avatar URL utility
│   │   ├── pages/
│   │   │   ├── Profile.jsx            # Profile page
│   │   │   ├── Dashboard.jsx          # User dashboard
│   │   │   ├── Login.jsx              # Login page
│   │   │   ├── Register.jsx           # Register page
│   │   │   ├── Share.jsx              # Public share view
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       └── AdminAnalytics.jsx
│   │   ├── App.jsx                    # Routes + layout
│   │   └── main.jsx                   # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```
---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Cloudinary account
- Vercel account (for deployment)

---

### 1. Clone the repository

```bash
git clone https://github.com/rumman2004/framedrop.git
cd framedrop
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster.mongodb.net/framedrop
JWT_SECRET=your-super-secret-jwt-key-change-this
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Start the backend dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend `.env`

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ✅ | Port to run the server on (default 5000) |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Your Cloudinary API secret |

### Frontend `.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Full URL to backend API including `/api` |

> ⚠️ `VITE_API_URL` must end with `/api` and have **no trailing slash**
> 
> ✅ Correct: `https://framedrop-api.vercel.app/api`  
> ❌ Wrong:   `https://framedrop-api.vercel.app/api/`  
> ❌ Wrong:   `https://framedrop-api.vercel.app`

---

## 📡 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Create a new account |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user info |
| `PATCH` | `/api/auth/avatar` | ✅ | Upload profile picture |

#### POST `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/...",
    "isAdmin": false
  }
}
```

---

### Share Routes — `/api/share`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/share` | ✅ | Create a new share session |
| `GET` | `/api/share/my` | ✅ | Get all your share sessions |
| `GET` | `/api/share/session/:id` | ✅ | Get one session (owner view) |
| `DELETE` | `/api/share/:id` | ✅ | Delete a session |
| `GET` | `/api/share/:token` | ❌ | Get public share (client view) |
| `POST` | `/api/share/:token/verify` | ❌ | Verify PIN for protected share |

#### POST `/api/share` (multipart/form-data)

files[]    — up to 50 image files
title      — session title (string)
pin        — optional 4-digit PIN
expiresIn  — hours until expiry (number)

---

### Admin Routes — `/api/admin`

> All admin routes require a valid JWT from an admin account.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform-wide statistics |
| `GET` | `/api/admin/users` | List all users |
| `PATCH` | `/api/admin/users/:id/toggle` | Activate / deactivate user |
| `GET` | `/api/admin/sessions` | List all share sessions |
| `GET` | `/api/admin/logs` | Activity logs |

---

## 🌍 Deployment

### Deploy Backend to Vercel

1. Push your backend to a GitHub repository

2. Go to [vercel.com](https://vercel.com) → **New Project** → import the backend repo

3. Add all environment variables in **Settings → Environment Variables**

4. Make sure `vercel.json` exists in your backend root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

5. Deploy — your API will be live at `https://your-backend.vercel.app`

---

### Deploy Frontend to Vercel

1. Push your frontend to a GitHub repository

2. Go to [vercel.com](https://vercel.com) → **New Project** → import the frontend repo

3. Set the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add environment variable:

VITE_API_URL = https://your-backend.vercel.app/api

5. Deploy — your app will be live at `https://your-frontend.vercel.app`

---

### Post-deployment checklist


□ Backend health check passes:
GET https://your-backend.vercel.app/api/health → { "status": "ok" }
□ Frontend loads without blank screen
□ Login / Register works
□ Avatar upload works
□ Share session creation works
□ Public share link is accessible without login
□ Admin panel accessible with admin account

---

## 🖼️ Screenshots

### Dashboard
> Clean overview of all share sessions with active/expired stats

### Profile Page
> Animated 3D tilt card with avatar upload and account details

### Share View
> Public-facing gallery view with optional PIN protection

### Admin Panel
> Full platform management — users, sessions, analytics

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes
   ```bash
   git commit -m "feat: add your feature"
   ```
4. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

### Commit message format


feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, no logic change
refactor: code restructure
chore:    build / config changes

---

## 🐛 Common Issues

### "Route not found" on deployed backend

- Check `vercel.json` has the `/(.*) → server.js` rewrite rule
- Make sure `NODE_ENV=production` is set in Vercel env vars
- Verify `VITE_API_URL` ends with `/api` and no trailing slash

### Avatar not loading after upload

- Check Cloudinary credentials are correct in backend env vars
- Verify `VITE_API_URL` points to the correct backend
- Check browser console for CORS or mixed-content errors

### CORS errors in browser

- Make sure `app.options('*', cors(corsOptions))` is in `server.js`
- Verify the backend is not using `credentials: true` with a static `'*'` origin

### Images not showing (Google avatar 403)

- All `<img>` tags for avatars must have `referrerPolicy="no-referrer"`

---

## 📄 License

This project is licensed under the **MIT License**.


MIT License
Copyright (c) 2024 FrameDrop
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👨‍💻 Author

Built with ❤️ for photographers who deserve better tools.

[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/rumman2004)

---

*FrameDrop — Drop the frame. Share the moment.*
