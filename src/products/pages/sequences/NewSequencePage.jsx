import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { SectionCard } from 'src/core/primitives/SectionCard';
import { Button, Input, Dialog } from 'src/core/primitives';
import { useNewSequencePage } from 'src/products/sequences/hooks/useNewSequencePage.js';
import { SequenceFlowBuilder } from './components/SequenceFlowBuilder.jsx';
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
  const { name, setName, steps, setSteps, creating, validationError, canCreate, create } = useNewSequencePage();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const openNameDialog = () => {
    if (!canCreate) return;
    setNameDialogOpen(true);
  };

  const handleConfirm = async () => {
    await create();
  };

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={<Button disabled={!canCreate} loading={creating} onClick={openNameDialog}>{t.createButton}</Button>}
    >
      <div className="flex flex-col h-full min-h-0 gap-3">
        <Link to="/hub/sequences" className="shrink-0 inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> {t.allSequences}
        </Link>

        {validationError && (
          <p className="shrink-0 text-[var(--ui-t-label)] text-[var(--ui-danger-fg)]">{validationError}</p>
        )}

        <SectionCard
          title={t.stepsSectionTitle}
          noPadding
          className="flex-1 min-h-0 flex flex-col"
          bodyClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <SequenceFlowBuilder steps={steps} onChange={setSteps} />
        </SectionCard>
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
