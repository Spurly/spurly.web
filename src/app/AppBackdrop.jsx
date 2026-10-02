import { useLocation } from 'react-router-dom';
import SiteBackdrop from 'src/products/pages/website/components/SiteBackdrop.jsx';

// Ribbons drift on public + auth pages; inside the signed-in app they are a
// still frame so tables and inboxes never compete with motion.
const LIVE = /^\/($|privacy|terms|support|blog|signup|login|forgot-password|reset-password)/;

export function AppBackdrop() {
  const { pathname } = useLocation();
  return <SiteBackdrop still={!LIVE.test(pathname)} />;
}
