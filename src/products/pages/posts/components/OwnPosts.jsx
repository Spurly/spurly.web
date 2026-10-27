import { useState } from 'react';
import { CalendarClock, FileText } from 'lucide-react';
import { Badge, Button, EmptyState } from 'src/core/primitives';
import { absoluteTime } from 'src/shared/utils/outreach.js';
import { PostEngagement } from './PostEngagement.jsx';
import { PostMedia } from './PostMedia.jsx';

const STATUS = {
  scheduled: { tone: 'info', label: 'Scheduled' },
  publishing: { tone: 'warning', label: 'Publishing' },
  published: { tone: 'success', label: 'Published' },
  failed: { tone: 'danger', label: 'Failed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
};

const COLLAPSED_CHARS = 220;
const COLLAPSED_LINES = 4;
const GRID = 'grid gap-4 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 items-start';
const DISPLAY = 'font-[family-name:var(--ui-font-display)]';

/** "in 3h" / "in 2d" for a scheduled time (the shared relativeTime only looks backwards). */
function untilTime(value) {
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'any moment';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.floor(hours / 24)}d`;
}

const dayKey = (value) => { const d = new Date(value); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const clock = (value) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** "Today" / "Tomorrow" / "Fri, 30 Oct": the heading a day of scheduled posts sits under. */
function dayLabel(value) {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (dayKey(value) === dayKey(now)) return 'Today';
  if (dayKey(value) === dayKey(tomorrow)) return 'Tomorrow';
  return new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** The first line is the hook; it leads the card in the display face, the rest is body copy. */
function splitHook(text) {
  const lines = (text || '').split('\n');
  const i = lines.findIndex((l) => l.trim());
  if (i === -1) return { hook: '', rest: '' };
  return { hook: lines[i].trim(), rest: lines.slice(i + 1).join('\n').trim() };
}

function PostText({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const long = text.length > COLLAPSED_CHARS || text.split('\n').length > COLLAPSED_LINES;
  return (
    <div>
      <p className={`whitespace-pre-wrap break-words text-[length:var(--ui-t-control)] leading-[1.6] text-[var(--ui-text-secondary)] ${long && !expanded ? 'line-clamp-4' : ''}`}>{text}</p>
      {long && (
        <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="mt-1 !px-0">
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}

function Counts({ metrics }) {
  if (!metrics || metrics.fetchedAt == null) return null;
  const parts = [['reaction', metrics.reactions], ['comment', metrics.comments], ['repost', metrics.reposts]]
    .filter(([, n]) => typeof n === 'number')
    .map(([label, n]) => `${n} ${label}${n === 1 ? '' : 's'}`);
  if (parts.length === 0) return null;
  return <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">{parts.join(' · ')}</p>;
}

/** When it goes out: a lit chip with the clock time and a countdown, for what is queued. */
function WhenChip({ post }) {
  if (post.status === 'scheduled' && post.scheduledFor) {
    return (
      <span className="inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] text-[length:var(--ui-t-label)] font-medium tabular-nums shadow-[inset_0_0_0_1px_var(--ui-accent-border)]">
        <CalendarClock size={13} aria-hidden="true" />
        {clock(post.scheduledFor)}
        <span className="opacity-70">· {untilTime(post.scheduledFor)}</span>
      </span>
    );
  }
  const status = STATUS[post.status] ?? STATUS.failed;
  const when = post.publishedAt || post.createdAt;
  return (
    <>
      <Badge tone={status.tone} dot>{status.label}</Badge>
      {when && <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">{absoluteTime(when)}</span>}
    </>
  );
}

function PostCard({ post, cancelling, onCancel }) {
  const [open, setOpen] = useState(false);
  const scheduled = post.status === 'scheduled';
  const { hook, rest } = splitHook(post.text);
  const busy = cancelling.has(post._id);
  return (
    <li className={`group flex flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-card)] transition-[border-color,transform] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:-translate-y-px ${post.status === 'cancelled' ? 'opacity-70' : ''}`}>
      {post.mediaKind && <PostMedia post={post} cover />}
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <WhenChip post={post} />
        </div>
        {hook
          ? <h4 className={`${DISPLAY} m-0 text-[length:var(--ui-t-heading)] leading-[1.25] tracking-[-0.01em] text-[var(--ui-text-primary)] break-words`}>{hook}</h4>
          : !post.mediaKind && <p className="text-[var(--ui-text-tertiary)]">(No text)</p>}
        <PostText text={rest} />
        {post.status === 'published' && <Counts metrics={post.metrics} />}
        {post.status === 'failed' && post.lastError && <p role="alert" className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{post.lastError}</p>}
        {scheduled && post.lastError && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">{post.lastError}</p>}
        {(scheduled || (post.status === 'published' && post.socialId)) && (
          <div className="flex items-center gap-2 pt-2.5 mt-0.5 border-t border-[var(--ui-border)]">
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">{scheduled ? absoluteTime(post.scheduledFor) : ''}</span>
            <span className="flex-1" />
            {scheduled && <Button size="sm" variant="ghost" onClick={() => onCancel(post)} loading={busy} disabled={busy}>Cancel</Button>}
            {post.status === 'published' && post.socialId && <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? 'Hide activity' : 'Comments & reactions'}</Button>}
          </div>
        )}
        {open && <PostEngagement socialId={post.socialId} />}
      </div>
    </li>
  );
}

function Group({ title, count, children }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h3 className="m-0 flex items-baseline gap-2.5">
        <span className={`${DISPLAY} text-[length:var(--ui-t-heading)] tracking-[-0.01em] text-[var(--ui-text-primary)]`}>{title}</span>
        <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] tabular-nums">{count} {count === 1 ? 'post' : 'posts'}</span>
        <span className="flex-1 h-px bg-[var(--ui-border)]" aria-hidden="true" />
      </h3>
      <ul className={`${GRID} m-0 p-0 list-none`}>{children}</ul>
    </section>
  );
}

export function OwnPosts({ posts, cancelling, onCancel }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        compact
        icon={<FileText size={22} />}
        title="No posts yet"
        hint="Posts you publish or schedule here will be listed. Posts made directly on LinkedIn are not shown."
      />
    );
  }
  // Next to go out first, grouped by day; everything else keeps the server's newest-first order.
  const upcoming = posts.filter((p) => p.status === 'scheduled').sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  const history = posts.filter((p) => p.status !== 'scheduled');
  const days = [];
  upcoming.forEach((p) => {
    const key = dayKey(p.scheduledFor);
    const last = days[days.length - 1];
    if (last?.key === key) last.posts.push(p);
    else days.push({ key, label: dayLabel(p.scheduledFor), posts: [p] });
  });
  const card = (p) => <PostCard key={p._id} post={p} cancelling={cancelling} onCancel={onCancel} />;
  return (
    <div className="flex flex-col gap-7">
      {days.map((d) => <Group key={d.key} title={d.label} count={d.posts.length}>{d.posts.map(card)}</Group>)}
      {history.length > 0 && <Group title={upcoming.length ? 'History' : 'Your posts'} count={history.length}>{history.map(card)}</Group>}
    </div>
  );
}
