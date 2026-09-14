import { Sparkles, AlertTriangle } from 'lucide-react';
import { SectionCard } from 'src/ui/primitives/SectionCard';
import { Button } from 'src/ui/primitives';
import { CONTEXT_FIELDS, TONES } from 'src/products/leadgen/personalization/controller/personalization.js';
import { useAiContextTab } from 'src/products/leadgen/settings/hooks/useAiContextTab.js';
import { settingsStrings as t } from '../strings.js';

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
  'w-full px-4 py-3 bg-[var(--ui-surface-sunken)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] ' +
  'text-[var(--ui-t-body)] leading-relaxed text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] ' +
  'focus:outline-none focus:border-[var(--ui-accent)] focus:shadow-[var(--ui-focus-ring)] ' +
  'transition-colors resize-none disabled:opacity-50';

export function AiContextTab() {
  const { form, setForm, preview, loading, saving, error, dirty, handleSave } = useAiContextTab();

  if (loading) {
    return (
      <SectionCard title={t.aiContext.sectionTitle}>
        <p className="text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.aiContext.loading}</p>
      </SectionCard>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <SectionCard title={t.aiContext.sectionTitle}>
        <div className="flex flex-col gap-5">
          <p className="text-[var(--ui-t-body)] leading-relaxed text-[var(--ui-text-secondary)]">
            {t.aiContext.intro}
          </p>

          {CONTEXT_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <label className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] tracking-[-0.006em]">
                  {field.label}
                </label>
                <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">
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

              <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">{field.help}</p>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] tracking-[-0.006em]">
              {t.aiContext.defaultToneLabel}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, defaultTone: tone.value }))}
                  disabled={saving}
                  className="px-3 h-8 rounded-[var(--ui-radius-md)] text-[var(--ui-t-label)] font-medium transition-colors disabled:opacity-50"
                  style={
                    form.defaultTone === tone.value
                      ? { background: 'var(--ui-accent-tint-strong)', color: 'var(--ui-accent)' }
                      : { background: 'var(--ui-surface-sunken)', color: 'var(--ui-text-secondary)' }
                  }
                >
                  {tone.label}
                </button>
              ))}
            </div>
            <p className="text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
              {t.aiContext.defaultToneHint}
            </p>
          </div>

          {error && (
            <p
              className="flex items-start gap-2 text-[var(--ui-t-body)] font-medium px-3 py-2.5 rounded-[var(--ui-radius-lg)]"
              style={{ background: 'var(--ui-danger-tint)', color: 'var(--ui-danger)' }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-px" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!dirty || saving}>
              {saving ? t.aiContext.saving : t.aiContext.save}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Showing the assembled prompt turns an opaque settings form into
          something the user can predict and debug. */}
      <SectionCard title={t.aiContext.previewTitle}>
        {preview ? (
          <pre
            className="px-4 py-3 rounded-[var(--ui-radius-lg)] text-[var(--ui-t-label)] leading-relaxed whitespace-pre-wrap font-sans"
            style={{
              background: 'var(--ui-surface-sunken)',
              border: '1px dashed var(--ui-border)',
              color: 'var(--ui-text-secondary)',
            }}
          >
            {preview}
          </pre>
        ) : (
          <p className="inline-flex items-start gap-2 text-[var(--ui-t-body)] text-[var(--ui-text-secondary)]">
            <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--ui-accent)' }} />
            {t.aiContext.previewEmpty}
          </p>
        )}
      </SectionCard>
    </form>
  );
}

export default AiContextTab;
