import { useState } from 'react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, Input, Dialog } from 'src/core/primitives';
import { SendingAsChip } from 'src/core/org/components/SendingAsChip.jsx';
import { useSendingAs } from 'src/core/org/hooks/useSendingAs.js';
import { useNewSequencePage } from 'src/products/sequences/hooks/useNewSequencePage.js';
import { SequenceTreeBuilder } from './components/SequenceTreeBuilder.jsx';
import { StopRulesButton } from './components/StopRulesButton.jsx';
import { SendFromControl } from './components/SendFromControl.jsx';
import { sequencesStrings } from './strings.js';

const t = sequencesStrings.new;

/**
 * Build a new sequence.
 *
 * Unlike a campaign (created instantly from a lead selection, nothing to
 * configure up front), the backend requires at least one valid step to save
 * a sequence at all — see stepTypes.js#validateSteps on the backend, which
 * rejects an empty steps array. So this page is entirely local state until
 * "Create sequence" is pressed; nothing is sent, and no lead is touched,
 * until then. Enrolling leads happens afterward, from the leads page.
 *
 * The page itself is just the step canvas — naming happens in a small
 * dialog shown when "Create sequence" is pressed, once there's something
 * worth naming, rather than an always-visible field competing with the
 * canvas for space above the fold.
 */
export function NewSequencePage() {
  const { name, setName, steps, setSteps, creating, validationError, canCreate, create, inbox, exit, setExit, recentContact, setRecentContact, isOrg, pool, canPool, poolBlocked } = useNewSequencePage();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const sending = useSendingAs();

  const openNameDialog = () => {
    if (!canCreate || sending.needsPick) return;
    setNameDialogOpen(true);
  };

  const handleConfirm = async () => {
    await create();
  };

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      layout="fill"
      actions={<Button disabled={!canCreate || sending.needsPick} title={sending.needsPick ? 'Pick an account in "Acting as" first.' : poolBlocked ? t.sendFromBlocked : undefined} loading={creating} onClick={openNameDialog}>{t.createButton}</Button>}
    >
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 flex-wrap">
            <SendingAsChip />
            {canPool && <SendFromControl pool={pool} />}
          </div>
          <StopRulesButton exit={exit} onChange={setExit} inbox={inbox} isOrg={isOrg} recentContact={recentContact} onRecentContactChange={setRecentContact} />
        </div>

        {validationError && (
          <p className="shrink-0 text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]">{validationError}</p>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-sm)]">
          <SequenceTreeBuilder steps={steps} onChange={setSteps} inbox={inbox} className="flex-1 min-h-[420px]" />
        </div>
      </div>

      <Dialog
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
        title={t.nameDialogTitle}
        description={t.nameDialogDescription}
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setNameDialogOpen(false)}>{t.nameDialogCancel}</Button>
            <Button disabled={!name.trim() || creating} loading={creating} onClick={handleConfirm}>
              {t.nameDialogConfirm}
            </Button>
          </>
        )}
      >
        <Input
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim() && !creating) handleConfirm();
          }}
          placeholder={t.namePlaceholder}
          aria-label="Sequence name"
        />
      </Dialog>
    </DashboardLayout>
  );
}

export default NewSequencePage;
