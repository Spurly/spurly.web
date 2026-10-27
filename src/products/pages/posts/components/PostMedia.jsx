import { useState } from 'react';
import { Image as ImageIcon, Play, Video } from 'lucide-react';
import { Dialog, Skeleton } from 'src/core/primitives';
import { usePostMedia } from 'src/products/posts/hooks/usePostMedia.js';

const COVER_FRAME = 'relative block w-full h-[176px] overflow-hidden border-b border-[var(--ui-border)] bg-[var(--ui-surface-sunken)]';
const MEDIA_FRAME = 'relative block w-full overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-sunken)]';

/** Shown when there is nothing to display: a post sent straight from the browser keeps no copy of its file, and a deleted file is gone. */
function MediaPlaceholder({ kind, name, note }) {
  const Icon = kind === 'video' ? Video : ImageIcon;
  return (
    <div className="flex items-center gap-3 rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-sunken)] px-3 py-2.5">
      <span className="grid place-items-center w-9 h-9 shrink-0 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-card)] text-[var(--ui-text-tertiary)]" aria-hidden="true"><Icon size={16} /></span>
      <div className="min-w-0">
        <p className="truncate text-[length:var(--ui-t-control)] text-[var(--ui-text-body)]">{name || (kind === 'video' ? 'Video' : 'Image')}</p>
        <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{note}</p>
      </div>
    </div>
  );
}

/** Card header when the preview cannot load: the file name on a quiet tile, never a raw error. */
function CoverFallback({ kind, name }) {
  const Icon = kind === 'video' ? Video : ImageIcon;
  return (
    <div className="flex h-[176px] w-full flex-col items-center justify-center gap-2 border-b border-[var(--ui-border)] bg-gradient-to-br from-[var(--ui-accent-wash)] to-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]">
      <span className="grid place-items-center w-10 h-10 rounded-full bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)]" aria-hidden="true"><Icon size={18} /></span>
      <span className="max-w-[80%] truncate text-[length:var(--ui-t-label)]">{name || (kind === 'video' ? 'Video' : 'Image')}</span>
    </div>
  );
}

/** The real file, fetched only while the dialog is open (it mounts when opened). */
function MediaViewer({ assetId, kind, name, onClose }) {
  const { url, status, reason } = usePostMedia(assetId, 'file');
  return (
    <Dialog open onClose={onClose} title={name || (kind === 'video' ? 'Video' : 'Image')} size="xl">
      {status === 'loading' && <Skeleton width="100%" height={320} />}
      {status === 'failed' && <p role="alert" className="text-[var(--ui-text-secondary)]">{reason || 'Could not load this file.'}</p>}
      {status === 'ready' && (kind === 'video'
        ? <video src={url} controls autoPlay playsInline className="w-full max-h-[70vh] rounded-[var(--ui-radius-md)] bg-black" />
        : <img src={url} alt={name || 'Post image'} className="w-full max-h-[70vh] object-contain rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-sunken)]" />)}
    </Dialog>
  );
}

function StoredMedia({ post, cover }) {
  const { url, status, reason } = usePostMedia(post.assetId, 'preview');
  const [viewing, setViewing] = useState(false);
  const isVideo = post.mediaKind === 'video';

  if (status === 'loading') return <Skeleton width="100%" height={cover ? 176 : 220} />;
  if (status === 'failed' && cover) return <CoverFallback kind={post.mediaKind} name={post.mediaName} />;
  if (status === 'failed') return <MediaPlaceholder kind={post.mediaKind} name={post.mediaName} note={reason ? `Preview unavailable: ${reason}` : 'Preview unavailable'} />;
  return (
    <>
      {/* A thumbnail that opens a viewer is not a text button; Button's chrome would fight the image. */}
      {/* eslint-disable-next-line no-restricted-syntax */}
      <button
        type="button"
        onClick={() => setViewing(true)}
        aria-label={isVideo ? 'Play video' : 'View full image'}
        className={`${cover ? COVER_FRAME : MEDIA_FRAME} group cursor-zoom-in focus-visible:outline-2 focus-visible:outline-[var(--ui-accent)]`}
      >
        <img src={url} alt={post.mediaName || 'Post image'} loading="lazy" className={cover ? 'block w-full h-full object-cover' : 'block w-full max-h-[420px] object-contain'} />
        {isVideo && (
          <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25" aria-hidden="true">
            <span className="grid place-items-center w-12 h-12 rounded-full bg-black/60 text-white"><Play size={20} fill="currentColor" /></span>
          </span>
        )}
      </button>
      {viewing && <MediaViewer assetId={post.assetId} kind={post.mediaKind} name={post.mediaName} onClose={() => setViewing(false)} />}
    </>
  );
}

/** The image or video on a post: the stored file when there is one, else an honest placeholder. */
export function PostMedia({ post, cover = false }) {
  if (post.assetId) return <StoredMedia post={post} cover={cover} />;
  if (post.mediaKind && cover) return <CoverFallback kind={post.mediaKind} name={post.mediaName} />;
  if (post.mediaKind) return <MediaPlaceholder kind={post.mediaKind} name={post.mediaName} note="Sent straight from your browser, so no preview is kept" />;
  return null;
}
