# Spurly Web Platform

React-based web platform for lead management and analytics. Built with Vite, React 19, and Tailwind CSS.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment setup
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run development server
```bash
npm run dev
```

The app will start at `http://localhost:5173`

## Project Structure

```
src/
├── pages/          # Page components (Login, Dashboard, etc)
├── components/     # Reusable components
├── hooks/          # Custom React hooks
├── context/        # Context providers (Auth, etc)
├── services/       # API & external services
├── utils/          # Utility functions
└── index.css       # Tailwind styles
```

## Tech Stack

- **React 19.2.6** — UI library
- **Vite 8** — Build tool
- **Tailwind CSS 4.3** — Styling
- **React Router DOM** — Routing
- **Axios** — HTTP client

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Features

- ✅ Authentication (Login page with email & LinkedIn OAuth)
- ✅ Protected routes
- ✅ Auto token refresh on API calls
- ✅ Auth context for global state
- ✅ Responsive design with Tailwind

## Next Steps

- Build lead management dashboard
- Add sessions page
- Implement profile capture UI
- Add analytics & reporting
- Team collaboration features
