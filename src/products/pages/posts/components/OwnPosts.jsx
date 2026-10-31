import { useState } from 'react';
import { Badge, Button } from 'src/core/primitives';
import { absoluteTime } from 'src/shared/utils/outreach.js';
import { PostEngagement } from './PostEngagement.jsx';

const STATUS = {
  scheduled: { tone: 'neutral', label: 'Scheduled' },
  publishing: { tone: 'neutral', label: 'Publishing' },
  published: { tone: 'success', label: 'Published' },
  failed: { tone: 'danger', label: 'Failed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
};

function PostRow({ post, cancelling, onCancel }) {
  const [open, setOpen] = useState(false);
  const status = STATUS[post.status] ?? STATUS.failed;
  const when = post.status === 'scheduled' ? post.scheduledFor : post.publishedAt || post.createdAt;
  return (
    <li className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Badge tone={status.tone} dot>{status.label}</Badge>
        {post.mediaKind && <Badge tone="neutral">{post.mediaKind}</Badge>}
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">{when ? absoluteTime(when) : ''}</span>
        <span className="flex-1" />
        {post.status === 'scheduled' && <Button size="sm" variant="ghost" onClick={() => onCancel(post)} loading={cancelling.has(post._id)} disabled={cancelling.has(post._id)}>Cancel</Button>}
        {post.status === 'published' && post.socialId && <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? 'Hide activity' : 'Comments & reactions'}</Button>}
      </div>
      <p className="whitespace-pre-wrap break-words text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] line-clamp-6">{post.text || (post.mediaName ? `(${post.mediaName})` : '')}</p>
      {post.status === 'failed' && post.lastError && (
        <p role="alert" className="mt-2 text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{post.lastError}</p>
      )}
      {post.status === 'scheduled' && post.lastError && <p className="mt-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{post.lastError}</p>}
      {open && <PostEngagement socialId={post.socialId} />}
    </li>
  );
}

export function OwnPosts({ posts, cancelling, onCancel }) {
  if (posts.length === 0) return <p className="text-[var(--ui-text-secondary)]">Posts you publish or schedule here will be listed. Posts made directly on LinkedIn are not shown.</p>;
  return <ul className="flex flex-col gap-3">{posts.map((p) => <PostRow key={p._id} post={p} cancelling={cancelling} onCancel={onCancel} />)}</ul>;
}
