import React from 'react'
import ReactDOM from 'react-dom/client'
import App from 'src/app/App.jsx'
import './index.css'
// Auth pages' stylesheet is imported here (not only in AuthShell) so its position
// in the cascade is fixed. Loaded lazily with the login chunk, it landed after
// whatever CSS was already on the page and lost to it, e.g. right after logout.
import 'src/core/pages/auth/auth.css'

const container = document.getElementById('root');
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Public pages (home, blog, legal, support) are prerendered at build time by
// scripts/prerender.mjs, so #root already holds their HTML: hydrate it rather
// than throw it away. Every other route is served the empty app shell
// (dist/app.html) and renders client-side exactly as before.
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
