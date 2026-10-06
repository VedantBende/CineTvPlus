# 🎨 CineTv+ Frontend

This directory contains the user-facing React application for **CineTv+**, built with modern web technologies to deliver a premium, Netflix-inspired cinematic streaming experience.

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: React 18 powered by **Vite** for blazing fast HMR and optimized production builds.
- **Styling**: **Tailwind CSS** for strictly utility-first, responsive, and highly customizable UI design (including robust Light/Dark mode support).
- **State Management**: **Zustand** for lightweight, boilerplate-free global state (Auth state, Media browsing state).
- **Authentication**: **@clerk/clerk-react** for secure, drop-in user management, social logins, and JWT session handling.
- **Routing**: **React Router DOM** (v6) for seamless client-side navigation.
- **Network Requests**: Native `fetch` API structured intuitively via utility singletons.

---

## 🏗️ Core Functionalities

### 1. Interactive Media Explorer
Integrates with our backend proxy to dynamically fetch TMDB catalog data. Features distinct horizontal scroll rows for *Trending*, *Top Rated*, *Now Playing*, and *Popular* media.

### 2. Access Gate
A custom gatekeeping UI component built to handle the "Pending" user state. Fresh signups are held here globally until an Admin explicitly grants network access through the dashboard. Users are automatically notified via **email** once their access status reflects a change.

### 3. Progressive Admin Dashboard
A dedicated admin route protected by Role-Based Access Control (RBAC). It features dynamic stat cards, real-time user filtering (Name/Email), status categorization, and visually polished sliding drawers for managing user network access (Approve/Reject/Revoke).

### 4. Advanced Interactive Video Player
Powered by scalable architecture, the Video Player integrates proxy abstractions securely handling dynamic stream structures:
- **Multi-Server UI**: Users pick and freely toggle between multiple abstracted servers (Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta) safely storing their preference for fallback streaming capability.
- **TV Controls & URL Sync**: Features intuitive Season & Episode modal selectors natively modifying query parameters synchronously so deep-linking TV shows simply works.

### 5. Seamless Onboarding & States
- To protect UX, all fresh engagements on the watch-route load a mandatory "Before You Start" onboard flow safely persisting acknowledgement tokens directly to the `localStorage` minimizing database fetches.
- Progress and history optimistically mutate Zustand states while flushing to backend gracefully.

### 6. Progressive Web App (PWA) Integration
- **Installable Experience**: Fully configured as a PWA, allowing users to install CineTv+ directly to their devices via a custom, theme-integrated "Install App" button in the Navbar.
- **Workbox Caching**: Implements targeted caching strategies (`CacheFirst` for assets/images, `NetworkFirst` for APIs) while strictly bypassing the service worker for video playback routes (`NetworkOnly`) to prevent streaming interruptions.
- **Offline & Update UI**: Includes custom React components to notify users when they lose internet connection (`OfflineIndicator`) and gracefully prompt them when a new app version is ready (`UpdatePrompt`).

### 7. Watch Providers Integration
A dedicated `ProviderPage` and interactive `ProvidersRow` to help users discover exactly where their favorite content is available to stream across various platforms. Includes specialized caching via Zustand to ensure fast subsequent loads.

### 8. Continue Watching
A dynamic `ContinueWatching` component that fetches user's watch history seamlessly and presents a responsive carousel to resume playback right from the home screen, utilizing optimistic UI updates for instant interaction feedback.

### 9. AniTv+ Mode & Video Transitions
- **AniTv+ Mode**: A dedicated mode for Anime content, completely powered by the robust AniList GraphQL API.
- **Video Transitions**: Toggling between CineTv+ and AniTv+ modes triggers a stunning, full-screen video animation tailored for desktop and mobile orientations.
- **Zero-Wait Mode Swapping**: While the transition video plays, the application intelligently fetches and renders the new mode's data completely hidden in the background, resulting in a perfect 0-loading-screen switch.

### 10. Live TV Experience
A dedicated offering of 1,000+ live television channels globally. 
- **Virtualized Rendering**: Implements infinite scrolling and DOM virtualization to render thousands of channels with zero lag.
- **State Persistence**: Heavily utilizes Zustand (`mediaStore`) to cache the entire channel catalog, ensuring instant load times when navigating back and forth.
- **Native Embedded Player**: Bypasses complex DRM/ClearKey issues by seamlessly wrapping the provider's native iframe, enhanced with a custom, theme-aware UI overlay.

---

## ⚙️ Local Development Setup

### Prerequisites
Make sure you have Node.js (v18+) installed.

1. **Install Dependencies**:
```bash
npm install
```

2. **Environment Variables**:
Create a `.env` file at the root of the `frontend/` directory:
```env
# Clerk Authentication Keys
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Backend API Resolution (Use /api to leverage Vite's local proxy)
VITE_API_URL=/api

# TMDB Configuration (used for movie/TV metadata)
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
VITE_TMDB_BACKDROP_BASE_URL=https://image.tmdb.org/t/p/original

# Video Playback Proxy URLs (Intentional Obfuscation abstractions)
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

3. **Start the Development Server**:
```bash
npm run dev
```
The frontend will start on `http://localhost:3000`. By default, Vite is configured (`vite.config.js`) to seamlessly proxy `/api` requests over to `http://127.0.0.1:5000` assuming your backend is running simultaneously.

---

## 📦 Build & Deployment (Vercel)

To compile the application for production:
```bash
npm run build
```

**Deploying to Vercel**:
When deploying this frontend explicitly via Vercel, ensure you bind `VITE_API_URL` directly to your live production backend (e.g., `https://your-backend.onrender.com/api`) in Vercel's Environment Variables dashboard so API requests route correctly over the public internet.

---

## 👨‍💻 Maintainer

Created and maintained by **Vedant Bende**.
- [GitHub Profile](https://github.com/VedantBende)
- [LinkedIn Profile](https://www.linkedin.com/in/vedant-bende-3aa28b2a8/)
