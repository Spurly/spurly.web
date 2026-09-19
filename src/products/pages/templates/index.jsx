import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, UserPlus, MessageSquare } from 'lucide-react';
import { PlusIcon, SearchIcon, TemplateIcon, CloseIcon } from 'src/core/icons';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { useAuth } from 'src/core/auth/hooks/useAuth.js';
import { useMessageTemplates } from 'src/products/templates/hooks/useMessageTemplates.js';
import { TEMPLATE_TYPES } from 'src/products/templates/controller/templates.js';
import { TEMPLATE_EVENTS } from 'src/products/templates/constants/constants.js';
import { Button, EmptyState, IconButton, Input, PageTabs, useToast, useConfirm } from 'src/core/primitives';
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
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={
        <Button variant="primary" leadingIcon={<PlusIcon size={14} strokeWidth={2} />} onClick={() => setEditing('new')}>
          {t.newTemplate}
        </Button>
      }
      tabs={
        <PageTabs
          tabs={TABS.map((tab) => ({ id: tab.id, label: tab.label, count: tab.id === type && !loading ? templates.length : undefined }))}
          activeTab={type}
          onTabChange={setType}
        />
      }
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          <div className="shrink-0 flex items-center gap-3 min-h-[var(--ui-band)] px-[var(--ui-card-x)] border-b border-[var(--ui-neutral-150)]">
            <Input
              size="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              leadingIcon={<SearchIcon size={14} strokeWidth={2} />}
              className="w-[260px] [&>input]:w-full"
            />
            <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] truncate">
              {activeTab?.blurb}
            </p>
          </div>

          {/* Load failure only — the list behind it is empty, and an empty list
              with no explanation reads as "you have no templates". */}
          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-[var(--ui-radius-md)] bg-[var(--ui-danger-tint)] text-[var(--ui-danger-fg)] text-[length:var(--ui-t-control)]">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[112px] rounded-[var(--ui-radius-lg)] bg-[var(--ui-neutral-150)] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<TemplateIcon size={22} strokeWidth={1.6} />}
                title={search ? t.emptySearch : t.emptyAll}
                hint={
                  search
                    ? t.emptySearchHint
                    : `Create a ${type === TEMPLATE_TYPES.CONNECTION ? 'connection note' : 'message'} template to reuse it across campaigns and the extension.`
                }
                action={
                  !search ? (
                    <Button variant="primary" leadingIcon={<PlusIcon size={14} strokeWidth={2} />} onClick={() => setEditing('new')}>
                      {t.newTemplate}
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className={`grid grid-cols-1 ${editing ? '' : 'xl:grid-cols-2'} gap-3`}>
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

        {/* Right: the editor, as an inspector (same shape as the sequence builder's). */}
        {editing && (
          <aside className="w-[420px] xl:w-[460px] shrink-0 flex flex-col min-h-0 border-l border-[var(--ui-border)] bg-[var(--ui-surface-card)]">
            <div className="shrink-0 flex items-center justify-between h-12 px-4 border-b border-[var(--ui-neutral-150)]">
              <span className="ui-micro !text-[var(--ui-text-secondary)]">
                {editing === 'new' ? t.editor.newHeading : t.editor.editHeading}
              </span>
              <IconButton size="sm" variant="ghost" label="Close" icon={<CloseIcon size={14} strokeWidth={2.2} />} onClick={() => setEditing(null)} className="!w-7 !h-7" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] mb-4">
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
            </div>
          </aside>
        )}
      </div>
    </DashboardLayout>
  );
}
