import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button, Input, useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { hubSequencesApi } from './api.js';
import { SequenceStepBuilder } from './SequenceStepBuilder.jsx';
import { makeStep, stepsError } from './stepTypes.js';

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
  const [name, setName] = useState('');
  const [steps, setSteps] = useState(() => [makeStep('connect')]);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const validationError = stepsError(steps);
  const canCreate = name.trim().length > 0 && !validationError && !creating;

  const create = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const sequence = await hubSequencesApi.createSequence({ name: name.trim(), steps });
      if (!sequence?._id) throw new Error('Sequence was not created');
      toast.success('Sequence created. Enroll leads from the leads page, then start it here.');
      navigate(`/hub/sequences/${sequence._id}`);
    } catch (err) {
      toast.error(getToastError(err, 'Could not create that sequence'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout
      title="New sequence"
      subtitle="A linear list of steps, run against whoever you enroll."
      actions={<Button disabled={!canCreate} loading={creating} onClick={create}>Create sequence</Button>}
    >
      <div className="flex flex-col gap-4">
        <Link to="/hub/sequences" className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:underline">
          <ArrowLeft size={13} aria-hidden="true" /> All sequences
        </Link>

        <SectionCard title="Name">
          <div className="px-[var(--ui-pad-lg)] py-4">
            <Input
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cold outreach — founders"
              aria-label="Sequence name"
            />
          </div>
        </SectionCard>

        <SectionCard title="Steps" noPadding>
          <SequenceStepBuilder steps={steps} onChange={setSteps} />
        </SectionCard>

        {validationError && (
          <p className="text-[12px] text-[var(--red)]">{validationError}</p>
        )}
      </div>
    </DashboardLayout>
  );
}

export default NewSequencePage;
