import { Star, Copy, Trash2 } from 'lucide-react';

/**
 * One row in the templates list — name, favorite star, content preview, usage
 * count, and the hover-revealed row actions (favorite / duplicate / delete).
 *
 * Pulled out of index.jsx: it's the largest single piece of that page and has
 * no state of its own, just callbacks the page already owns.
 */
export function TemplateCard({ template, active, onOpen, onFavorite, onDuplicate, onDelete }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group text-left rounded-[var(--ui-radius-lg)] p-4 cursor-pointer transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
      style={{
        background: active ? 'var(--ui-accent-tint)' : 'var(--ui-surface-card)',
        border: `1px solid ${active ? 'var(--ui-accent)' : 'var(--ui-border-hairline)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] truncate">
              {template.name}
            </h3>
            {template.isFavorite && (
              <Star size={13} style={{ color: 'var(--ui-warning)', fill: 'var(--ui-warning)' }} className="shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5 truncate">
              {template.description}
            </p>
          )}
          <p
            className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1.5 leading-snug"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {template.content}
          </p>
          {template.usageCount > 0 && (
            <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-2 tabular-nums">
              Used {template.usageCount} time{template.usageCount === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {/* Row actions — always in the DOM (so they're keyboard reachable),
            revealed on hover/focus to keep the card calm. */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <IconAction
            label={template.isFavorite ? 'Remove favorite' : 'Mark favorite'}
            onClick={stop(onFavorite)}
          >
            <Star
              size={15}
              style={template.isFavorite ? { color: 'var(--ui-warning)', fill: 'var(--ui-warning)' } : undefined}
            />
          </IconAction>
          <IconAction label="Duplicate" onClick={stop(onDuplicate)}>
            <Copy size={15} />
          </IconAction>
          <IconAction label="Delete" danger onClick={stop(onDelete)}>
            <Trash2 size={15} />
          </IconAction>
        </div>
      </div>
    </div>
  );
}

function IconAction({ label, children, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] transition-colors ${
        danger
          ? 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-danger-fg)] hover:bg-[var(--ui-danger-tint)]'
          : 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-hover)]'
      }`}
    >
      {children}
    </button>
  );
}
