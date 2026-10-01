import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Checkbox } from 'src/core/primitives';
import { ExternalIcon } from 'src/core/icons';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { MAX_AUTHORS_PER_IMPORT } from 'src/products/discover/constants/constants.js';
import { authorsFromPosts, snippet } from 'src/products/discover/format.js';
import { discoverStrings } from '../strings.js';

const t = discoverStrings.posts;

function ago(post) {
  const rel = relativeTime(post.postedAt);
  if (!rel) return post.postedAgo || '';
  return rel === 'just now' ? rel : `${rel} ago`;
}

/**
 * Post results with a checkbox per person author. Company-page authors cannot
 * be imported as people, so they have no checkbox. A person who wrote several
 * posts on the page is selected once (by member id).
 */
export function PostList({ posts, importing, onImport, keywords }) {
  const [selected, setSelected] = useState(() => new Set());

  const selectable = useMemo(() => posts.filter((p) => p.author?.providerId && !p.author.isCompany), [posts]);
  const allSelected = selectable.length > 0 && selectable.every((p) => selected.has(p.author.providerId));
  const tooMany = selected.size > MAX_AUTHORS_PER_IMPORT;

  const toggle = (providerId) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(providerId)) next.delete(providerId);
    else next.add(providerId);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map((p) => p.author.providerId)));

  const submit = () => {
    const chosen = authorsFromPosts(posts.filter((p) => selected.has(p.author?.providerId)));
    const unique = [...new Map(chosen.map((a) => [a.providerId, a])).values()];
    onImport(unique, keywords);
    setSelected(new Set());
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--ui-border)]">
        <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleAll} label={t.selectAll} disabled={selectable.length === 0} />
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
              {tooMany ? t.tooMany(MAX_AUTHORS_PER_IMPORT) : t.selected(selected.size)}
            </span>
          )}
          <Button size="sm" variant="primary" onClick={submit} loading={importing} disabled={selected.size === 0 || tooMany}>
            {importing ? t.importing : t.importAuthors}
          </Button>
        </div>
      </div>
      <ul>
        {posts.map((post) => {
          const author = post.author ?? {};
          const canSelect = Boolean(author.providerId) && !author.isCompany;
          return (
            <li key={post.socialId} className="flex items-start gap-3 px-4 py-3.5 border-b border-[var(--ui-border)] last:border-b-0">
              <div className="pt-1 w-4 shrink-0">
                {canSelect && (
                  <Checkbox
                    checked={selected.has(author.providerId)}
                    onChange={() => toggle(author.providerId)}
                    aria-label={`Select ${author.name || 'author'}`}
                  />
                )}
              </div>
              <Avatar src={author.profilePictureUrl} name={author.name || '?'} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[var(--ui-text-primary)]">{author.name || 'LinkedIn member'}</span>
                  {author.isCompany && <Badge tone="neutral">{t.companyAuthor}</Badge>}
                  {post.jobPosting && <Badge tone="info">{t.hiring}</Badge>}
                  <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{ago(post)}</span>
                </div>
                {author.headline && <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">{author.headline}</p>}
                <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)] mt-1">{snippet(post.text)}</p>
                <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] mt-1 flex items-center gap-2">
                  <span>{t.reactions(post.reactions)}</span>
                  <span>{t.comments(post.comments)}</span>
                  {post.shareUrl && (
                    <a href={post.shareUrl} target="_blank" rel="noreferrer noopener" aria-label="Open post on LinkedIn" className="hover:text-[var(--ui-accent-fg)]">
                      <ExternalIcon size={12} />
                    </a>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="px-4 py-3 text-[length:var(--ui-t-meta)] text-[var(--ui-text-quaternary)] border-t border-[var(--ui-border)]">{t.note}</p>
    </div>
  );
}
