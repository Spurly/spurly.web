import { useEffect, useState } from 'react';
import { useToast } from 'src/ui/primitives';
import personalizationController, {
  describeError,
} from 'src/products/hub/personalization/controller/personalization.js';

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
 */
export function useAiContextTab() {
  const toast = useToast();

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
    let alive = true;

    personalizationController
      .getContext()
      .then((data) => {
        if (!alive) return;
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
      })
      .catch((err) => {
        if (!alive) return;
        setError(describeError(err, "Couldn't load your AI context"));
        toast.error(describeError(err, "Couldn't load your AI context"));
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

  const dirty = Object.keys(EMPTY).some((key) => form[key] !== saved[key]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;

    setSaving(true);

    try {
      // Send only what changed — a partial save keeps the request honest about
      // the user's intent and avoids clobbering a field edited in another tab.
      const patch = {};
      for (const key of Object.keys(EMPTY)) {
        if (form[key] !== saved[key]) patch[key] = form[key];
      }

      const data = await personalizationController.saveContext(patch);
      setSaved(form);
      setPreview(data.preview || '');
      toast.success('Context saved');
    } catch (err) {
      toast.error(describeError(err, "Couldn't save your AI context"));
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, preview, loading, saving, error, dirty, handleSave };
}
