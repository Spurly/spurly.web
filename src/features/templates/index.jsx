import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Star,
  Copy,
  Trash2,
  FileText,
  UserPlus,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from 'src/components/DashboardLayout';
import { useAuth } from 'src/hooks/useAuth.js';
import { useMessageTemplates } from 'src/hooks/useMessageTemplates.js';
import { TEMPLATE_TYPES } from 'src/core/controllers/messageTemplatesController.js';
import { TemplateEditor } from './TemplateEditor.jsx';

/**
 * Templates — reusable copy for the two outreach actions.
 *
 * These are the same /api/message-templates records the Chrome extension's
 * Templates tab reads, so anything created here is immediately pickable when
 * sending from the extension, and vice versa. The campaign detail page pulls
 * from this list too (see TemplatePickerModal).
 *
 * Layout is master/detail: type tabs + list on the left, editor on the right.
 */

const TABS = [
  {
    id: TEMPLATE_TYPES.CONNECTION,
    label: 'Connection notes',
    icon: UserPlus,
    blurb: 'The note attached to a LinkedIn invitation.',
  },
  {
    id: TEMPLATE_TYPES.MESSAGE,
    label: 'Messages',
    icon: MessageSquare,
    blurb: 'Sent to people you’re already connected with.',
  },
];

export function TemplatesPage() {
  const { user } = useAuth();
  const senderName = (user?.name || '').split(' ')[0] || '';

  const [type, setType] = useState(TEMPLATE_TYPES.CONNECTION);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // template object | 'new' | null
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const {
    templates,
    loading,
    error,
    create,
    update,
    remove,
    duplicate,
    toggleFavorite,
  } = useMessageTemplates({ type });

  // Search is applied client-side: the page loads up to 100 templates at once,
  // so filtering locally is instant and avoids a request per keystroke.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? templates.filter((t) =>
          [t.name, t.content, t.description].some((v) => (v || '').toLowerCase().includes(q)),
        )
      : templates;
    // Favorites first, then most recently updated.
    return [...list].sort((a, b) => {
      if (!!b.isFavorite !== !!a.isFavorite) return b.isFavorite ? 1 : -1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }, [templates, search]);

  // Switching type must not leave the editor pointed at a template that is no
  // longer in the list.
  useEffect(() => {
    setEditing(null);
    setFormError(null);
    setActionError(null);
  }, [type]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing && editing !== 'new') {
        await update(editing._id, payload);
      } else {
        await create(payload);
      }
      setEditing(null);
    } catch (err) {
      setFormError(err.message || 'Could not save the template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete "${template.name}"? This can't be undone.`)) return;
    setActionError(null);
    try {
      await remove(template._id);
      if (editing && editing !== 'new' && editing._id === template._id) setEditing(null);
    } catch (err) {
      setActionError(err.message || 'Could not delete the template');
    }
  };

  const handleDuplicate = async (template) => {
    setActionError(null);
    try {
      const copy = await duplicate(template._id, `${template.name} (copy)`.slice(0, 100));
      setEditing(copy);
    } catch (err) {
      setActionError(err.message || 'Could not duplicate the template');
    }
  };

  const handleFavorite = async (template) => {
    setActionError(null);
    try {
      await toggleFavorite(template);
    } catch (err) {
      setActionError(err.message || 'Could not update favorite');
    }
  };

  const activeTab = TABS.find((t) => t.id === type);
  const editingId = editing && editing !== 'new' ? editing._id : null;

  return (
    <DashboardLayout
      title="Templates"
      subtitle="Reusable copy for connection notes and messages."
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Left: type tabs + list */}
        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          {/* Toolbar */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-[var(--separator)] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className="inline-flex p-1 rounded-[12px] gap-1"
                style={{ background: 'var(--surface-sunken)' }}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = type === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setType(tab.id)}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[13px] font-semibold transition-all ${
                        active
                          ? 'text-[var(--brand-purple)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                      style={active ? { background: 'var(--surface-card)', boxShadow: 'var(--shadow-sm)' } : undefined}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />

              <button
                onClick={() => {
                  setFormError(null);
                  setEditing('new');
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--brand-purple)' }}
              >
                <Plus size={15} /> New template
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[340px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full h-9 pl-9 pr-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[10px] text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all"
                />
              </div>
              <p className="text-[12.5px] text-[var(--text-tertiary)] truncate">
                {activeTab?.blurb}
              </p>
            </div>
          </div>

          {(error || actionError) && (
            <div
              className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px]"
              style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
            >
              <AlertCircle size={14} className="shrink-0" />
              {actionError || error}
            </div>
          )}

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[86px] rounded-[14px] animate-pulse"
                    style={{ background: 'var(--surface-sunken)' }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                <div
                  className="w-12 h-12 rounded-[14px] grid place-items-center"
                  style={{ background: 'var(--accent-tint)' }}
                >
                  <FileText size={22} style={{ color: 'var(--brand-purple)' }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {search ? 'No templates match your search' : 'No templates yet'}
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-[380px]">
                    {search
                      ? 'Try a different search term.'
                      : `Create a ${type === TEMPLATE_TYPES.CONNECTION ? 'connection note' : 'message'} template to reuse it across campaigns and the extension.`}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => setEditing('new')}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-semibold text-white"
                    style={{ background: 'var(--brand-purple)' }}
                  >
                    <Plus size={15} /> New template
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filtered.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    active={editingId === template._id}
                    onOpen={() => {
                      setFormError(null);
                      setEditing(template);
                    }}
                    onFavorite={() => handleFavorite(template)}
                    onDuplicate={() => handleDuplicate(template)}
                    onDelete={() => handleDelete(template)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: editor rail */}
        {editing && (
          <aside
            className="w-[420px] xl:w-[480px] shrink-0 overflow-y-auto p-6"
            style={{ borderLeft: '1px solid var(--separator)', background: 'var(--surface-raised)' }}
          >
            <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
              {editing === 'new' ? 'New template' : 'Edit template'}
            </h2>
            <p className="text-[12.5px] text-[var(--text-secondary)] mb-5">
              {type === TEMPLATE_TYPES.CONNECTION
                ? 'Attached to the invitation. Keep it under 200 characters.'
                : 'Sent as a LinkedIn message to your connections.'}
            </p>
            <TemplateEditor
              type={type}
              template={editing === 'new' ? null : editing}
              saving={saving}
              error={formError}
              senderName={senderName}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditing(null);
                setFormError(null);
              }}
            />
          </aside>
        )}
      </div>
    </DashboardLayout>
  );
}

function TemplateCard({ template, active, onOpen, onFavorite, onDuplicate, onDelete }) {
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
      className="group text-left rounded-[14px] p-4 cursor-pointer transition-all hover:-translate-y-px focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
      style={{
        background: active ? 'var(--accent-tint)' : 'var(--surface-card)',
        border: `1px solid ${active ? 'var(--brand-purple)' : 'var(--border-hairline)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
              {template.name}
            </h3>
            {template.isFavorite && (
              <Star size={13} style={{ color: 'var(--amber)', fill: 'var(--amber)' }} className="shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-[12.5px] text-[var(--text-tertiary)] mt-0.5 truncate">
              {template.description}
            </p>
          )}
          <p
            className="text-[13px] text-[var(--text-secondary)] mt-1.5 leading-snug"
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
            <p className="text-[11.5px] text-[var(--text-tertiary)] mt-2 tabular-nums">
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
              style={template.isFavorite ? { color: 'var(--amber)', fill: 'var(--amber)' } : undefined}
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
      className={`w-8 h-8 grid place-items-center rounded-[9px] transition-colors ${
        danger
          ? 'text-[var(--text-tertiary)] hover:text-[var(--red)] hover:bg-[var(--red-tint)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      {children}
    </button>
  );
}
