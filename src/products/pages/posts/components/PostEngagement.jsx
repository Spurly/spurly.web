import { useEffect } from 'react';
import { Button } from 'src/core/primitives';
import { usePostEngagement } from 'src/products/posts/hooks/usePostEngagement.js';
import { relativeTime } from 'src/shared/utils/outreach.js';

const who = (a) => a?.name || 'Someone on LinkedIn';

function Person({ author, children }) {
  return (
    <li className="flex flex-col gap-0.5 py-2 border-b border-[var(--ui-border-hairline)] last:border-b-0">
      <div className="flex items-baseline gap-2">
        {author?.profileUrl
          ? <a href={author.profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--ui-text-primary)] hover:underline">{who(author)}</a>
          : <span className="font-medium text-[var(--ui-text-primary)]">{who(author)}</span>}
        {author?.headline && <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] truncate">{author.headline}</span>}
      </div>
      {children}
    </li>
  );
}

/** Comments and reactions on one post, loaded when this opens. Shared by Your posts and the lead drawer. */
export function PostEngagement({ socialId }) {
  const { comments, reactions, loadComments, loadReactions } = usePostEngagement(socialId);
  useEffect(() => { loadComments(); loadReactions(); }, [loadComments, loadReactions]);

  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <section aria-label="Reactions">
        <h4 className="ui-micro !text-[var(--ui-text-secondary)] mb-1">Reactions{reactions.total != null ? ` · ${reactions.total}` : ''}</h4>
        {reactions.loaded && reactions.items.length === 0 && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">No reactions yet.</p>}
        <ul>
          {reactions.items.map((r, i) => (
            <Person key={`${r.author?.providerId || i}-${i}`} author={r.author}>
              <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] capitalize">{r.type}</span>
            </Person>
          ))}
        </ul>
        {reactions.cursor && <Button size="sm" variant="ghost" onClick={() => loadReactions(reactions.cursor)} loading={reactions.loading}>Load more</Button>}
        {reactions.loading && !reactions.loaded && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">Loading…</p>}
      </section>
      <section aria-label="Comments">
        <h4 className="ui-micro !text-[var(--ui-text-secondary)] mb-1">Comments{comments.total != null ? ` · ${comments.total}` : ''}</h4>
        {comments.loaded && comments.items.length === 0 && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">No comments yet.</p>}
        <ul>
          {comments.items.map((c, i) => (
            <Person key={c.id || i} author={c.author}>
              <p className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] whitespace-pre-wrap break-words">{c.text}</p>
              <span className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">{c.createdAt ? relativeTime(c.createdAt) : c.dateLabel}</span>
            </Person>
          ))}
        </ul>
        {comments.cursor && <Button size="sm" variant="ghost" onClick={() => loadComments(comments.cursor)} loading={comments.loading}>Load more</Button>}
        {comments.loading && !comments.loaded && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">Loading…</p>}
      </section>
    </div>
  );
}
