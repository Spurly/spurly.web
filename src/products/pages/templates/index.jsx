import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, FileText, AlertCircle, UserPlus, MessageSquare } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { useMessageTemplates } from 'src/products/templates/hooks/useMessageTemplates.js';
import { TEMPLATE_TYPES } from 'src/products/templates/controller/templates.js';
import { TEMPLATE_EVENTS } from 'src/products/templates/constants/constants.js';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { TemplateEditor } from './components/TemplateEditor.jsx';
import { TemplateCard } from './components/TemplateCard.jsx';
import { templatesStrings as t } from './strings.js';

/**
 * Templates — reusable copy for the two outreach actions.
 *
 * These are the same /api/message-templates records the Chrome extension's
 * Templates tab reads, so anything created here is immediately pickable when
 * sending from the extension, and vice versa. The campaign detail page pulls
 * from this list too (see components/TemplatePickerModal.jsx).
 *
 * Layout is master/detail: type tabs + list on the left, editor on the right.
 */

const TABS = [
  { id: TEMPLATE_TYPES.CONNECTION, label: t.tabs.connection.label, icon: UserPlus, blurb: t.tabs.connection.blurb },
  { id: TEMPLATE_TYPES.MESSAGE, label: t.tabs.message.label, icon: MessageSquare, blurb: t.tabs.message.blurb },
];

export function TemplatesPage() {
  const { user } = useAuth();
  const senderName = (user?.name || '').split(' ')[0] || '';

  const [type, setType] = useState(TEMPLATE_TYPES.CONNECTION);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // template object | 'new' | null
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const {
    templates,
    loading,
    error,
    eventEmitter,
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
      ? templates.filter((tpl) =>
          [tpl.name, tpl.content, tpl.description].some((v) => (v || '').toLowerCase().includes(q)),
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
  }, [type]);

  const handleSubmit = (payload) => {
    const isEdit = editing && editing !== 'new';
    setSaving(true);

    const successEvent = isEdit ? TEMPLATE_EVENTS.UPDATE_SUCCESS : TEMPLATE_EVENTS.CREATE_SUCCESS;
    const failureEvent = isEdit ? TEMPLATE_EVENTS.UPDATE_FAILURE : TEMPLATE_EVENTS.CREATE_FAILURE;

    eventEmitter.once(successEvent, () => {
      setSaving(false);
      setEditing(null);
      toast.success(isEdit ? t.toasts.updated : t.toasts.created);
    });
    eventEmitter.once(failureEvent, (err) => {
      setSaving(false);
      toast.error(getToastError(err, t.toasts.saveErrorFallback));
    });

    if (isEdit) {
      update(editing._id, payload);
    } else {
      create(payload);
    }
  };

  // `confirm()` is a UI-dialog promise, not a network call — the
  // no-async-in-components rule is about controller error handling, so
  // awaiting it here (and nowhere else in this handler) is fine.
  const handleDelete = async (template) => {
    const ok = await confirm({
      title: `Delete "${template.name}"?`,
      description: t.confirmDelete.descriptionSuffix,
      confirmLabel: t.confirmDelete.confirmLabel,
    });
    if (!ok) return;

    eventEmitter.once(TEMPLATE_EVENTS.DELETE_SUCCESS, () => {
      if (editing && editing !== 'new' && editing._id === template._id) setEditing(null);
      toast.success(`Deleted "${template.name}"`);
    });
    eventEmitter.once(TEMPLATE_EVENTS.DELETE_FAILURE, (err) => {
      toast.error(getToastError(err, t.toasts.deleteErrorFallback));
    });
    remove(template._id);
  };

  const handleDuplicate = (template) => {
    eventEmitter.once(TEMPLATE_EVENTS.DUPLICATE_SUCCESS, (copy) => {
      setEditing(copy);
      toast.success(t.toasts.duplicated);
    });
    eventEmitter.once(TEMPLATE_EVENTS.DUPLICATE_FAILURE, (err) => {
      toast.error(getToastError(err, t.toasts.duplicateErrorFallback));
    });
    duplicate(template._id, `${template.name} (copy)`.slice(0, 100));
  };

  const handleFavorite = (template) => {
    eventEmitter.once(TEMPLATE_EVENTS.TOGGLE_FAVORITE_SUCCESS, () => {
      toast.success(template.isFavorite ? t.toasts.removedFavorite : t.toasts.addedFavorite);
    });
    eventEmitter.once(TEMPLATE_EVENTS.TOGGLE_FAVORITE_FAILURE, (err) => {
      toast.error(getToastError(err, t.toasts.favoriteErrorFallback));
    });
    toggleFavorite(template);
  };

  const activeTab = TABS.find((tab) => tab.id === type);
  const editingId = editing && editing !== 'new' ? editing._id : null;

  return (
    <DashboardLayout title={t.pageTitle} subtitle={t.pageSubtitle}>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Left: type tabs + list */}
        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          {/* Toolbar */}
          <div className="shrink-0 px-[var(--ui-pad-lg)] pt-[var(--ui-pad-lg)] pb-4 border-b border-[var(--ui-border-hairline)] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className="inline-flex p-1 rounded-[var(--ui-radius-lg)] gap-1"
                style={{ background: 'var(--ui-surface-sunken)' }}
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = type === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setType(tab.id)}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-md)] text-[var(--ui-t-body)] font-medium transition-colors ${
                        active
                          ? 'text-[var(--ui-accent-fg)]'
                          : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
                      }`}
                      style={active ? { background: 'var(--ui-surface-card)', boxShadow: 'var(--ui-shadow-sm)' } : undefined}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setEditing('new')}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] font-medium text-white transition-colors hover:brightness-95"
                style={{ background: 'var(--ui-accent)' }}
              >
                <Plus size={15} /> {t.newTemplate}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[340px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-tertiary)]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full h-9 pl-9 pr-3 bg-[var(--ui-surface-sunken)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] transition-colors"
                />
              </div>
              <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)] truncate">
                {activeTab?.blurb}
              </p>
            </div>
          </div>

          {/* Load failure only — kept inline because the list behind it is
              empty, and an empty list with no explanation reads as "you have no
              templates". Action failures are toasts. */}
          {error && (
            <div
              className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-body)]"
              style={{ background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)' }}
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto px-[var(--ui-pad-lg)] py-4">
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[86px] rounded-[var(--ui-radius-lg)] animate-pulse"
                    style={{ background: 'var(--ui-surface-sunken)' }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                <div
                  className="w-12 h-12 rounded-[var(--ui-radius-lg)] grid place-items-center"
                  style={{ background: 'var(--ui-accent-tint)' }}
                >
                  <FileText size={22} style={{ color: 'var(--ui-accent)' }} />
                </div>
                <div>
                  <p className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">
                    {search ? t.emptySearch : t.emptyAll}
                  </p>
                  <p className="text-[var(--ui-t-body)] text-[var(--ui-text-secondary)] mt-1 max-w-[380px]">
                    {search
                      ? t.emptySearchHint
                      : `Create a ${type === TEMPLATE_TYPES.CONNECTION ? 'connection note' : 'message'} template to reuse it across campaigns and the extension.`}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => setEditing('new')}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)] font-medium text-white"
                    style={{ background: 'var(--ui-accent)' }}
                  >
                    <Plus size={15} /> {t.newTemplate}
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
                    onOpen={() => setEditing(template)}
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
            className="w-[420px] xl:w-[480px] shrink-0 overflow-y-auto p-[var(--ui-pad-lg)]"
            style={{ borderLeft: '1px solid var(--ui-border-hairline)', background: 'var(--ui-surface-card)' }}
          >
            <h2 className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] mb-1">
              {editing === 'new' ? t.editor.newHeading : t.editor.editHeading}
            </h2>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-5">
              {type === TEMPLATE_TYPES.CONNECTION ? t.editor.connectionSubtitle : t.editor.messageSubtitle}
            </p>
            <TemplateEditor
              type={type}
              template={editing === 'new' ? null : editing}
              saving={saving}
              senderName={senderName}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          </aside>
        )}
      </div>
    </DashboardLayout>
  );
}
