import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import sequenceController from '../controller/sequence.js';
import { makeStep, stepsError } from '../stepTypes.js';

/**
 * State for the new-sequence page: local-only until "Create sequence" is
 * pressed, matching the backend's own requirement that a sequence needs at
 * least one valid step to save at all.
 */
export function useNewSequencePage() {
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
      const sequence = await sequenceController.createSequence({ name: name.trim(), steps });
      if (!sequence?._id) throw new Error('Sequence was not created');
      toast.success('Sequence created. Enroll leads from the leads page, then start it here.');
      navigate(`/hub/sequences/${sequence._id}`);
    } catch (err) {
      toast.error(getToastError(err, 'Could not create that sequence'));
    } finally {
      setCreating(false);
    }
  };

  return { name, setName, steps, setSteps, creating, validationError, canCreate, create };
}
