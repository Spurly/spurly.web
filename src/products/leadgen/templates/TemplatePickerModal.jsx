import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Star, FileText, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from 'src/platform/auth/useAuth.js';
import { useMessageTemplates } from 'src/products/leadgen/templates/useMessageTemplates.js';
import { TYPE_FOR_ACTION } from 'src/products/leadgen/templates/controller.js';
import { previewTemplate } from 'src/shared/utils/templateTokens.js';
import { TemplateEditor } from 'src/products/leadgen/templates/TemplateEditor.jsx';

/**
 * Pick a saved template to drop into a campaign's note / message fields.
 *
 * Reads the same /api/message-templates records as the extension's picker, so
 * the two surfaces always offer the same list. Choosing one FILLS the campaign
 * textarea — it stays fully editable afterwards, and {{tokens}} are preserved
 * so the extension can personalise them per recipient at send time.
 *
 * Props:
 *   action    — 'connection' | 'message'
 *   onPick    — (template) => void
 *   onClose   — () => void
 *   maxLength — campaign field cap; content beyond it is flagged as trimmed
 */
export function TemplatePickerModal({ action, onPick, onClose, maxLength }) {
  const type = TYPE_FOR_ACTION[action];
  const { user } = useAuth();
  const senderName = (user?.name || '').split(' ')[0] || '';

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const dialogRef = useRef(null);

  const { templates, loading, error, create } = useMessageTemplates({ type });

  // Esc closes — a modal that can only be dismissed by mouse is a papercut.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (creating) setCreating(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [creating, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? templates.filter((t) =>
          [t.name, t.content, t.description].some((v) => (v || '').toLowerCase().includes(q)),
        )
      : templates;
    return [...list].sort((a, b) => {
      if (!!b.isFavorite !== !!a.isFavorite) return b.isFavorite ? 1 : -1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }, [templates, search]);

  const handleCreate = async (payload) => {
    setSaving(true);
    setFormError(null);
    try {
      const created = await create(payload);
      // Creating from here almost always means "and use it now".
      onPick(created);
    } catch (err) {
      setFormError(err.message || 'Could not save the template');
      setSaving(false);
    }
  };

  const isConnection = action === 'connection';

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => {
        // mousedown, not click: a text selection that ends outside the dialog
        // would otherwise close it mid-drag.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={creating ? 'New template' : 'Choose a template'}
        className="relative w-full max-w-[560px] max-h-[min(680px,90vh)] flex flex-col rounded-[var(--ui-radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-[var(--ui-pad-lg)] pt-[var(--ui-pad-lg)] pb-4 border-b border-[var(--separator)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {creating ? (
              <button
                onClick={() => {
                  setCreating(false);
                  setFormError(null);
                }}
                className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                aria-label="Back to template list"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div
                className="w-9 h-9 rounded-[var(--ui-radius-lg)] grid place-items-center shrink-0"
                style={{ background: 'var(--accent-tint)' }}
              >
                <FileText size={17} style={{ color: 'var(--brand-purple)' }} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[14px] font-medium text-[var(--text-primary)] tracking-[-0.012em] truncate">
                {creating
                  ? `New ${isConnection ? 'connection note' : 'message'} template`
                  : `Choose a ${isConnection ? 'connection note' : 'message'}`}
              </h2>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {creating
                  ? 'It will be saved and applied to this campaign.'
                  : 'The text is copied in — you can edit it before sending.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 grid place-items-center rounded-[var(--ui-radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {creating ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-[var(--ui-pad-lg)] py-5">
            <TemplateEditor
              type={type}
              saving={saving}
              error={formError}
              senderName={senderName}
              onSubmit={handleCreate}
              onCancel={() => {
                setCreating(false);
                setFormError(null);
              }}
            />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-[var(--ui-pad-lg)] pt-4 pb-3 shrink-0">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  autoFocus
                  className="w-full h-9 pl-9 pr-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-[var(--ui-pad-lg)] pb-4">
              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[13px] mb-3"
                  style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[72px] rounded-[var(--ui-radius-lg)] animate-pulse"
                      style={{ background: 'var(--surface-sunken)' }}
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">
                    {search ? 'No templates match your search' : 'No templates yet'}
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                    {search
                      ? 'Try a different search term.'
                      : 'Create one here, or on the Templates page.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((template) => {
                    const willTrim = maxLength > 0 && (template.content || '').length > maxLength;
                    return (
                      <button
                        key={template._id}
                        type="button"
                        onClick={() => onPick(template)}
                        className="text-left rounded-[var(--ui-radius-lg)] p-3.5 transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--border-hairline)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                            {template.name}
                          </span>
                          {template.isFavorite && (
                            <Star
                              size={12}
                              style={{ color: 'var(--amber)', fill: 'var(--amber)' }}
                              className="shrink-0"
                            />
                          )}
                          {willTrim && (
                            <span
                              className="ml-auto shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded-[var(--ui-radius-sm)]"
                              style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
                            >
                              Will be trimmed
                            </span>
                          )}
                        </div>
                        {/* Preview with sample data — closer to what actually
                            goes out than the raw {{token}} form. */}
                        <p
                          className="text-[12px] text-[var(--text-secondary)] mt-1 leading-snug"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {previewTemplate(
                            template.content,
                            senderName ? { sender: senderName, senderName } : {},
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-[var(--ui-pad-lg)] py-4 border-t border-[var(--separator)] flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setFormError(null);
                  setCreating(true);
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium transition-colors"
                style={{
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <Plus size={15} /> New template
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
