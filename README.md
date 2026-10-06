# ⚠️ Educational Purpose Only

**This project is built strictly for educational and demonstration purposes.**

It does **NOT** promote, support, or encourage any form of illegal activity.

All movie and TV show related data (such as titles, posters, and metadata) is publicly fetched from third-party APIs (such as TMDB). **This application does NOT host, store, or distribute any copyrighted media content.**

The platform enables users to explore and interact with media content through third-party integrations and embedded sources for demonstration purposes only. The servers only store user-related data such as account information, preferences, watch history, and favorites.

---

# 🍿 CineTv+

A full-stack, OTT-style streaming platform designed to provide a premium cinematic browsing experience. Built with a modern tech stack, CineTv+ features secure authentication, an admin-controlled access system, and deep integration with the TMDB API for rich, dynamic media exploring.

---

## ✨ Features

- **Robust Authentication & Sync**: Seamless email and social login via Clerk, instantly synced with a custom MongoDB backend.
- **Admin-Controlled Access Gate**: New users are placed behind a "Request Access" gate upon signup. An administrative layer must manually approve, reject, or revoke network access.
- **Time-Based Access Management**: Administrators can grant users temporary platform access (e.g., 24 Hours, 7 Days, 1 Year). An automated backend cron job perfectly synchronizes with the database to seamlessly revoke access at the exact moment of expiry.
- **📧 Email Notification System**: Users receive automatic, branded email updates when their access status changes (Approved, Rejected, Revoked, or Auto-Expired), ensuring they stay informed about their account status.
- **Dynamic Media Browsing**: Explore thousands of movies and TV shows securely via the TMDB API, featuring Trending, Popular, Now Playing, and Top Rated sections.
- **Watch Providers Integration**: Discover exactly where your favorite movies and shows are available to stream across different platforms.
- **Personalized Watchlists**: Save and manage a persistent list of favorites scoped directly to your account.
- **Watch History & Continue Watching**: Automatically tracks the content you interact with for easy resume viewing right from the home screen.
- **Admin Dashboard**: A dedicated, role-based control panel to monitor platform metrics and moderate the user base.
- **Light & Dark Modes**: Complete styling overhauls specifically crafted for both light mode enthusiasts and dark cinematic experiences.
- **AniTv+ Mode**: A dedicated Anime-centric viewing mode toggled seamlessly via the Navbar, completely powered by the robust AniList GraphQL API.
- **Graceful Maintenance Mode**: If third-party services (like AniList) experience downtime, the platform gracefully intercepts the failure and displays a branded, non-intrusive "Service Notice" maintenance screen rather than generic error traces.
- **Holographic Video Transitions**: Toggling between CineTv+ and AniTv+ modes triggers a stunning, full-screen video animation tailored for desktop and mobile orientations. 
- **Zero-Wait Mode Swapping**: While the transition video plays, the application intelligently fetches and renders the new mode's data completely hidden in the background, resulting in a perfect 0-loading-screen switch.
- **📡 Live TV Integration**: Browse and stream over 1,000+ live television channels globally. Features an ultra-fast virtualized grid, category-based filtering, state caching via Zustand, and native DRM player embedding for smooth playback without third-party lag.
- **📱 Progressive Web App (PWA)**: Installable as a standalone app with offline support, intelligent caching, and a custom UI update prompt.

### 📱 Progressive Web App (PWA) Architecture
- Built using `vite-plugin-pwa` with Workbox for advanced service worker management.
- **Intelligent Caching Strategies**:
  - `NetworkOnly` for video streaming routes to ensure uninterrupted playback with zero regression.
  - `CacheFirst` for static assets, fonts, and TMDB images.
  - `NetworkFirst` for dynamic backend and TMDB API requests with offline fallbacks.
- **Custom Installation UI**: Overrides the default intrusive browser banner with a sleek, native-feeling "Install App" Navbar integration.
- **Update Management**: Graceful `prompt` update strategy notifies users of new versions via a toast instead of forcefully reloading during media playback.

### 🎬 Multi-Server Streaming System
- Users can choose between multiple streaming servers.
- Improves reliability and playback success with manual fallback capability.
- **Servers:**
  - Server Alpha → Fast & Reliable
  - Server Beta → Premium
  - Server Gamma → FHD · Fast
  - Server Delta → Standard · Fast
  - Server Epsilon → Enhanced · Reliable
  - Server Zeta → Alternative Source
  - Server Eta → Alternative Source

### 🔐 First-Time Player Selection
- Users must select a server before playback for a personalized experience.
- Selection is securely saved locally to prevent repetitive prompts.

### ⚙️ Environment-Based Player Configuration
- All player URLs are stored entirely in environment variables.
- Promotes clean architecture with no hardcoded domains, making it highly scalable and easy to switch or update players dynamically.

### 📺 Advanced TV Show Controls
- Includes custom Season selector and Episode selector tools.
- Dynamic playback updates natively without full frame reloads.
- Supports native URL synchronization.

### 🌐 Smart URL Sync
- Season & episode markers are flawlessly reflected in the URL parameters.
- Deep linking supported natively (easily share specific episodes with others).
- Page refresh automatically preserves the state.

### 🎨 Enhanced User Experience
- Clean, Netflix-inspired OTT-style interface.
- Smooth CSS animations and micro-interactions.
- Seamless player switching without full page reloads.

### 🧠 First-Time User Onboarding
- A mandatory "Before You Start" popup blocks streaming until explicitly accepted.
- Handled via local storage to ensure it is shown strictly only once.
- Helps users avoid issues safely by summarizing:
  - Browser recommendation (Brave)
  - Ad awareness tips (prevention)
  - Server switching guidance (resolution)

---

## 📧 Email Notification System

The platform features a robust, automated email notification system to maintain transparency with users regarding their access requests.

- **Overview**: Non-intrusive notifications sent directly to the user's registered email.
- **Triggers**:
  - **Approved**: A welcome email with immediate access to the platform.
  - **Rejected**: A professional notification regarding the application status.
  - **Revoked**: Security notification when access has been removed by an admin.
- **How it Works**:
  1. Admin takes an action in the Dashboard.
  2. The custom **Gmail API** utility is triggered via HTTPS.
  3. The email is delivered via **Google REST API (Port 443)**, ensuring it bypasses all cloud firewall blocks (like Render's SMTP blocks).

---

## 💻 Tech Stack

### 🎨 Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS 
- **State Management**: Zustand (Auth, Media, UI state)
- **Routing**: React Router DOM
- **Authentication**: Clerk

### ⚙️ Backend
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Email Service**: Google Gmail API (REST)
- **Security**: Helmet, CORS configurations for strict origin allowance, IPv4 prioritization

### ☁️ APIs & Deployment
- **External Data**: TMDB API (The Movie Database)
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render

---

## 🏗️ Project Architecture

CineTv+ utilizes a classic decoupled Client-Server architecture:
1. **Frontend (React)**: Handles all UI visualization, complex state management, and user interaction.
2. **Backend (Express)**: Acts as a secure intermediary layer, guarding the database and protecting sensitive API keys (like TMDB).
3. **Database (MongoDB)**: Stores immutable user records, access statuses (pending/approved/revoked), time-based access durations, and user preferences (Watchlists/History).

*Data Flow*: The frontend sends authenticated REST requests using Clerk's JWT tokens. The Express backend validates these tokens before fulfilling requests. When an admin modifies a user's status, the backend triggers the **Gmail API** utility to send a real-time notification via **HTTPS (Port 443)**.
*Architecture Flow*: Admin Dashboard → Express Backend → Google Gmail API (REST) → User Inbox

---

## 📂 Folder Structure

```text
cinetv-plus/
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI elements (Navbar, Cards, Modals)
│   │   ├── pages/        # Route-level components (Home, AccessGate, AdminPage)
│   │   ├── store/        # Zustand global state (authStore, mediaStore)
│   │   └── utils/        # Axios interceptors, TMDB fetching logic, helpers
│   ├── .env              # Local frontend environment variables
│   └── vite.config.js    # Vite configuration & development proxy
└── backend/
    ├── config/           # Database connections (db.js)
    ├── controllers/      # Route request/response logic 
    ├── middleware/       # JWT verifications, Role-checking, Rate limiters
    ├── models/           # Mongoose schemas (User.js)
    ├── routes/           # Express API endpoints
    ├── .env              # Sensitive backend secrets
    └── server.js         # Backend entry point
```

---

## 🚀 Installation & Setup

### 1. Fork and Clone the repository

1. Click the **Fork** button at the top right of this repository to create a copy under your account.
2. Clone your forked repository:
```bash
git clone https://github.com/your-username/cinetvplus.git
cd cinetvplus
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
FRONTEND_URL=http://localhost:3000
# TMDB API domain (used in Content Security Policy for metadata requests)
# Provided by default as it is used to fetch movie/TV metadata from TMDB.
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Email Notification System (Gmail API - Firewall Proof)
# This uses the Google REST API (Port 443) which is NOT blocked by Render.
GMAIL_USER=your_gmail_account
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REFRESH_TOKEN=your_google_refresh_token

# External Service Proxy URLs (Content Security Policy)
PLAYER_ALPHA_BASE_URL=disabled
PLAYER_ALPHA_EMBED_MOVIE=disabled
PLAYER_ALPHA_EMBED_TV=disabled
PLAYER_BETA_BASE_URL=disabled
PLAYER_BETA_WILDCARD_URL=disabled
PLAYER_BETA_EMBED_URL=disabled
PLAYER_GAMMA_BASE_URL=disabled
PLAYER_GAMMA_EMBED_MOVIE=disabled
PLAYER_GAMMA_EMBED_TV=disabled
PLAYER_DELTA_EPSILON_BASE_URL=disabled

# Anime Server
OTAKU_1_URL=disabled
OTAKU_2_URL=disabled
OTAKU_3_URL=disabled
OTAKU_ORIGIN=disabled
```
Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=/api

# TMDB Configuration (used for movie/TV metadata)
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
VITE_TMDB_BACKDROP_BASE_URL=https://image.tmdb.org/t/p/original

# Video Playback Proxy Config (intentionally non-functional)
VITE_PLAYER_ALPHA_MOVIE=disabled
VITE_PLAYER_ALPHA_TV=disabled
VITE_PLAYER_BETA_MOVIE=disabled
VITE_PLAYER_BETA_TV=disabled
VITE_PLAYER_GAMMA_MOVIE=disabled
VITE_PLAYER_GAMMA_TV=disabled
VITE_PLAYER_GAMMA_ORIGIN=disabled
VITE_PLAYER_DELTA_MOVIE=disabled
VITE_PLAYER_DELTA_TV=disabled
VITE_PLAYER_EPSILON_MOVIE=disabled
VITE_PLAYER_EPSILON_TV=disabled
VITE_PLAYER_DELTA_EPSILON_ORIGIN=disabled
VITE_PLAYER_ZETA_MOVIE=disabled
VITE_PLAYER_ZETA_TV=disabled
VITE_PLAYER_ETA_MOVIE=disabled
VITE_PLAYER_ETA_TV=disabled

# TMDB Cast Image
VITE_TMDB_CAST_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w185

# Transition Videos
VITE_TRANSITION_VIDEO_DESKTOP_TO_ANIME=your_desktop_video_url
VITE_TRANSITION_VIDEO_DESKTOP_TO_STANDARD=your_desktop_video_url
VITE_TRANSITION_VIDEO_MOBILE_TO_ANIME=your_mobile_video_url
VITE_TRANSITION_VIDEO_MOBILE_TO_STANDARD=your_mobile_video_url

# Otaku Link
VITE_OTAKU_LIST_URL=your_link

# Live TV API
VITE_LIVETV_API_URL=your_link
```
Start the frontend development server:
```bash
npm run dev
```

---

## 🌍 Deployment

- **Backend (Render)**: The Backend/ directory is deployed as a Web Service on Render. The FRONTEND_URL environment variable is strictly set to the Vercel app domain to enforce secure CORS policies. The proxy streaming variables (PLAYER_ALPHA_BASE_URL, etc.) map securely into Helmet's Content Security Policy.
- **Frontend (Vercel)**: The Frontend/ directory is deployed seamlessly via Vercel. VITE_API_URL points directly to the live Render backend URL (https://your-backend.onrender.com/api). Requires setting all VITE_PLAYER_... environment variables inside the Vercel dashboard.

---

## 🎮 Usage Guide

1. **Register**: Sign up using the Clerk-powered authentication screen.
2. **Request Access**: Upon registration, your account is immediately flagged as "Pending". You will be directed to the Access Gate screen.
3. **Admin Approval**: An administrative account must log in, navigate to the Admin Dashboard, and manually "Approve" your account.
4. **Cinematic Experience**: Once approved (you will receive an **email confirmation**), refresh your page to explore TMDB catalogs, manage your Watchlist across devices, and utilize the full UI!
5. **Streaming Onboarding**: On your first visit to a Watch Page, you will be required to acknowledge the Onboarding guidance popup and select a server (Alpha, Beta, Gamma, Delta, or Epsilon). Users can switch servers manually anytime.
6. **TV Navigation**: TV shows feature dynamic season/episode selectors that effortlessly sync deep-links directly down to your URL bar natively!

---

## 🔒 Security & Access Control

- **Role-Based Middlewares**: Express routes verifying `role === 'admin'` before allowing data mutations to sensitive endpoints (like modifying other users' access statuses).
- **Hardened Preflights**: The production backend enforces an explicit loopback array rejecting any traffic that does not originate organically from the authenticated Vercel frontend.
- **Token Verification**: Database mutations verify Clerk session tokens natively on the backend to prevent malicious client-side data tampering.

---

## 🔮 Future Improvements

- **Real-time Metrics**: Integrating Socket.io or Server-Sent Events (SSE) to display live active user counts on the Admin Dashboard natively.
- **Cine-AI Recommendations**: Training custom ML vector embeddings on a user's Watchlist history to recommend un-discovered, highly relevant TMDB entries.
- **Advanced Caching**: Storing aggressively fetched TMDB grids on a Redis layer to cut backend compute costs and drastically decrease Time-To-First-Byte (TTFB).

---

## 👨‍💻 Author & Maintainer

Created and maintained by **Vedant Bende**.
- [GitHub](https://github.com/VedantBende)
- [Portfolio](https://vedantbende.vercel.app/)
- [LinkedIn](https://www.linkedin.com/in/vedant-bende-3aa28b2a8/)
