import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Input } from 'src/ui/primitives';
import { useNewSequencePage } from 'src/products/hub/sequences/hooks/useNewSequencePage.js';
import { SequenceStepBuilder } from './components/SequenceStepBuilder.jsx';
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
 */
export function NewSequencePage() {
  const { name, setName, steps, setSteps, creating, validationError, canCreate, create } = useNewSequencePage();

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      actions={<Button disabled={!canCreate} loading={creating} onClick={create}>{t.createButton}</Button>}
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/sequences" className="inline-flex items-center gap-1 text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> {t.allSequences}
        </Link>

        <SectionCard title={t.nameSectionTitle}>
          <div className="px-[var(--ui-pad-lg)] py-4">
            <Input
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              aria-label="Sequence name"
            />
          </div>
        </SectionCard>

        <SectionCard title={t.stepsSectionTitle} noPadding>
          <SequenceStepBuilder steps={steps} onChange={setSteps} />
        </SectionCard>

        {validationError && (
          <p className="text-[var(--ui-t-label)] text-[var(--ui-danger-fg)]">{validationError}</p>
        )}
      </div>
    </DashboardLayout>
  );
}

export default NewSequencePage;
