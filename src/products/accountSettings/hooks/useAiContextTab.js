import { useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import { useToast } from 'src/core/primitives';
import personalizationController, {
  describeError,
} from 'src/products/personalization/controller/personalization.js';
import { PERSONALIZATION_EVENTS } from 'src/products/personalization/constants/constants.js';

const EMPTY = {
  whatWeDo: '',
  targetAudience: '',
  outreachGoal: '',
  voiceRules: '',
  defaultTone: 'professional',
};

/**
 * State for the "Context for Spurly" tab. Moved out of the tab component
 * unchanged, including the load-error-stays-on-screen / save-error-toasts
 * distinction (see the comment this carried in the page).
 *
 * `personalizationController` reports over `eventEmitter` instead of
 * returning/throwing, so this hook has no async/await or try/catch of its
 * own.
 */
export function useAiContextTab() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /* Load failures only. A failed load leaves the form empty and misleading —
     it would look like a blank context rather than an unread one — so that one
     stays on screen. Save failures are transient and go to the toast. */
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleContextSuccess(data) {
      const next = {
        whatWeDo: data.whatWeDo || '',
        targetAudience: data.targetAudience || '',
        outreachGoal: data.outreachGoal || '',
        voiceRules: data.voiceRules || '',
        defaultTone: data.defaultTone || 'professional',
      };
      setForm(next);
      setSaved(next);
      setPreview(data.preview || '');
      setLoading(false);
    }
    function handleContextFailure(err) {
      setError(describeError(err, "Couldn't load your AI context"));
      toast.error(describeError(err, "Couldn't load your AI context"));
      setLoading(false);
    }

    eventEmitter.on(PERSONALIZATION_EVENTS.CONTEXT_SUCCESS, handleContextSuccess);
    eventEmitter.on(PERSONALIZATION_EVENTS.CONTEXT_FAILURE, handleContextFailure);
    personalizationController.getContext(eventEmitter);

    return () => {
      eventEmitter.off(PERSONALIZATION_EVENTS.CONTEXT_SUCCESS, handleContextSuccess);
      eventEmitter.off(PERSONALIZATION_EVENTS.CONTEXT_FAILURE, handleContextFailure);
    };
  }, [eventEmitter, toast]);

  const dirty = Object.keys(EMPTY).some((key) => form[key] !== saved[key]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);

    // Send only what changed — a partial save keeps the request honest about
    // the user's intent and avoids clobbering a field edited in another tab.
    const patch = {};
    for (const key of Object.keys(EMPTY)) {
      if (form[key] !== saved[key]) patch[key] = form[key];
    }
    const nextForm = form;

    eventEmitter.once(PERSONALIZATION_EVENTS.SAVE_CONTEXT_SUCCESS, (data) => {
      setSaving(false);
      setSaved(nextForm);
      setPreview(data.preview || '');
      toast.success('Context saved');
    });
    eventEmitter.once(PERSONALIZATION_EVENTS.SAVE_CONTEXT_FAILURE, (err) => {
      setSaving(false);
      toast.error(describeError(err, "Couldn't save your AI context"));
    });

    personalizationController.saveContext(eventEmitter, patch);
  };

  return { form, setForm, preview, loading, saving, error, dirty, handleSave };
}
