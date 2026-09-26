import React from 'react'
import ReactDOM from 'react-dom/client'
import App from 'src/app/App.jsx'
import './index.css'

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
