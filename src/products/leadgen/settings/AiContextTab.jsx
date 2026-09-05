import { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { SectionCard } from 'src/ui/compat/SectionCard';
import { Button, useToast } from 'src/ui/primitives';
import personalizationController, {
  CONTEXT_FIELDS,
  TONES,
  describeError,
} from 'src/products/leadgen/personalization/controller.js';

/**
 * "Context for Spurly" — what the user tells the AI about their business, once.
 *
 * Every AI-written message is grounded in this. Without it the model can only
 * produce competent-but-generic outreach, because it has nothing true to say.
 *
 * Three deliberate choices:
 *
 * 1. NOTHING IS REQUIRED. An empty context still generates, just blandly.
 *    Putting a mandatory form between someone and their first useful output is
 *    how features go unused.
 *
 * 2. SAVE IS EXPLICIT, not per-keystroke. These are paragraphs people rewrite
 *    while thinking; autosaving each pause would fire a dozen requests and make
 *    a half-formed thought feel committed.
 *
 * 3. THE PROMPT PREVIEW IS SHOWN. A settings form that invisibly changes what a
 *    model does is unpredictable in a way users can't debug. Showing the exact
 *    text the model receives turns it into something they can reason about.
 */

const FIELD_CLASS =
  'w-full px-4 py-3 bg-[var(--surface-sunken)] border border-[var(--border-default)] rounded-[var(--ui-radius-lg)] ' +
  'text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
  'focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--ui-focus-ring)] ' +
  'transition-colors resize-none disabled:opacity-50';

const EMPTY = {
  whatWeDo: '',
  targetAudience: '',
  outreachGoal: '',
  voiceRules: '',
  defaultTone: 'professional',
};

export function AiContextTab() {
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

  if (loading) {
    return (
      <SectionCard title="Context for Spurly">
        <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
      </SectionCard>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <SectionCard title="Context for Spurly">
        <div className="flex flex-col gap-5">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Spurly uses this whenever it writes a connection note or message for you. Fill in what
            you can — everything is optional, but the more you give it, the less generic the
            writing. Nothing here is ever sent to the people you contact.
          </p>

          {CONTEXT_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.006em]">
                  {field.label}
                </label>
                <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                  {form[field.key].length}/{field.max}
                </span>
              </div>

              <textarea
                value={form[field.key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field.key]: e.target.value.slice(0, field.max) }))
                }
                placeholder={field.placeholder}
                rows={field.rows}
                disabled={saving}
                className={FIELD_CLASS}
              />

              <p className="text-[12px] text-[var(--text-tertiary)]">{field.help}</p>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.006em]">
              Default tone
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, defaultTone: tone.value }))}
                  disabled={saving}
                  className="px-3 h-8 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors disabled:opacity-50"
                  style={
                    form.defaultTone === tone.value
                      ? { background: 'var(--accent-tint-2)', color: 'var(--brand-purple)' }
                      : { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }
                  }
                >
                  {tone.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)]">
              You can still pick a different tone for any single message.
            </p>
          </div>

          {error && (
            <p
              className="flex items-start gap-2 text-[13px] font-medium px-3 py-2.5 rounded-[var(--ui-radius-lg)]"
              style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-px" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save context'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Showing the assembled prompt turns an opaque settings form into
          something the user can predict and debug. */}
      <SectionCard title="What the AI sees">
        {preview ? (
          <pre
            className="px-4 py-3 rounded-[var(--ui-radius-lg)] text-[12px] leading-relaxed whitespace-pre-wrap font-sans"
            style={{
              background: 'var(--surface-sunken)',
              border: '1px dashed var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            {preview}
          </pre>
        ) : (
          <p className="inline-flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
            <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--brand-purple)' }} />
            Nothing yet. Until you fill something in, Spurly writes from a blank slate — correct
            English, but it can&apos;t say anything true about you.
          </p>
        )}
      </SectionCard>
    </form>
  );
}

export default AiContextTab;
