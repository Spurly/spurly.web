import { useState } from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { SparkIcon } from 'src/core/icons';
import { useLeadPosts } from 'src/products/posts/hooks/useLeadPosts.js';
import { COMMENT_MAX } from 'src/products/posts/constants/constants.js';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { PostEngagement } from 'src/products/pages/posts/components/PostEngagement.jsx';

function PostCard({ post, state }) {
  const { like, comment, draft, liked, commented, busy, drafts, setDraftText } = state;
  const [composing, setComposing] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);
  const id = post.socialId;
  const working = busy[id];
  const text = drafts[id] ?? '';

  return (
    <li className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-3">
      <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mb-1">
        {post.createdAt ? relativeTime(post.createdAt) : post.dateLabel}
        {post.isRepost ? ' · repost' : ''}
        {' · '}{post.reactionCount ?? 0} reactions · {post.commentCount ?? 0} comments
      </p>
      <p className="whitespace-pre-wrap break-words text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] line-clamp-5">{post.text || '(no text)'}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="ghost" leadingIcon={<ThumbsUp size={12} />} onClick={() => like(id)} loading={working === 'like'} disabled={Boolean(working) || liked.has(id)}>
          {liked.has(id) ? 'Liked' : 'Like'}
        </Button>
        <Button size="sm" variant="ghost" leadingIcon={<MessageSquare size={12} />} onClick={() => setComposing((v) => !v)} disabled={commented.has(id)}>
          {commented.has(id) ? 'Commented' : 'Comment'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowEngagement((v) => !v)}>{showEngagement ? 'Hide' : 'See activity'}</Button>
      </div>
      {composing && !commented.has(id) && (
        <div className="mt-2 flex flex-col gap-1.5">
          <textarea
            rows={3}
            value={text}
            maxLength={COMMENT_MAX}
            onChange={(e) => setDraftText(id, e.target.value)}
            placeholder="Write a comment…"
            aria-label="Comment"
            disabled={working === 'comment'}
            className="w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2.5 py-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)]"
          />
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{text.length}/{COMMENT_MAX} · the draft is yours to edit; nothing posts until you press Post</span>
            <Button size="sm" variant="ghost" leadingIcon={<SparkIcon size={12} />} onClick={() => draft(id, post.text)} loading={working === 'draft'} disabled={Boolean(working) || !post.text}>Draft with AI</Button>
            <Button size="sm" variant="primary" onClick={() => comment(id, text)} loading={working === 'comment'} disabled={Boolean(working) || !text.trim()}>Post</Button>
          </div>
        </div>
      )}
      {showEngagement && <PostEngagement socialId={id} />}
    </li>
  );
}

/**
 * A lead's recent posts, with like / comment / AI-drafted comment. Read from
 * LinkedIn only when asked. Every like or comment is a visible action that counts
 * toward a daily limit; a limit comes back as a plain sentence.
 */
export function LeadPosts({ lead }) {
  const state = useLeadPosts(lead._id);
  const { posts, load } = state;
  return (
    <section className="px-5 pt-[22px]" aria-label="Their posts">
      <h3 className="ui-micro !text-[var(--ui-text-secondary)] mb-2.5">Their posts</h3>
      {!posts.loaded ? (
        <Button size="sm" variant="ghost" onClick={load} loading={posts.loading} disabled={posts.loading}>Show recent posts</Button>
      ) : posts.items.length === 0 ? (
        <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">No recent posts found.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">{posts.items.map((p) => <PostCard key={p.socialId} post={p} state={state} />)}</ul>
      )}
    </section>
  );
}
