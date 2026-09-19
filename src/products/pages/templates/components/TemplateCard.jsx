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
      className={`group text-left rounded-[var(--ui-radius-lg)] px-4 py-3.5 border cursor-pointer transition-[border-color,box-shadow,background-color] duration-[var(--ui-dur-fast)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ${
        active
          ? 'bg-[var(--ui-accent-wash)] border-[var(--ui-accent-border)] shadow-[inset_2px_0_0_var(--ui-accent)]'
          : 'bg-[var(--ui-surface-card)] border-[var(--ui-border)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)] truncate">
              {template.name}
            </h3>
            {template.isFavorite && (
              <Star size={13} style={{ color: 'var(--ui-warning)', fill: 'var(--ui-warning)' }} className="shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)] mt-0.5 truncate">
              {template.description}
            </p>
          )}
          <p
            className="text-[length:var(--ui-t-control)] text-[var(--ui-text-body)] mt-1.5 leading-[1.55]"
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
            <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] mt-2 tabular-nums">
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
      className={`w-7 h-7 grid place-items-center rounded-[var(--ui-radius-sm)] transition-colors ${
        danger
          ? 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-danger-fg)] hover:bg-[var(--ui-danger-tint)]'
          : 'text-[var(--ui-text-tertiary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-hover)]'
      }`}
    >
      {children}
    </button>
  );
}
