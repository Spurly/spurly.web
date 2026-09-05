import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Undo2, X, RefreshCw, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePopperPosition } from 'src/ui/primitives/Popper';
import { useToast } from 'src/ui/primitives';
import personalizationController, {
  describeError,
  TONES,
} from 'src/products/leadgen/personalization/controller.js';
import { useAiStatus } from './useAiStatus.js';

/**
 * The single AI control, used on both the Templates page and the campaign
 * message editor.
 *
 * ONE button, two behaviours, chosen by what's already in the box:
 *   empty  -> writes a message from the user's saved Settings context
 *   filled -> improves what they wrote, keeping every {{token}}
 *
 * The server makes that decision, so this component doesn't branch on it — it
 * sends whatever is in the box. Two buttons ("Write" / "Improve") would be a
 * mode the user has to think about for no benefit, since only one is ever
 * applicable.
 *
 * What it writes is a TEMPLATE: one message for the whole campaign, with
 * {{tokens}} that the extension fills per recipient at send time. There is no
 * per-person generation, which is why one review covers the whole send.
 *
 * Props:
 *   content     — current text in the box
 *   type        — 'CONNECTION_REQUEST' | 'DIRECT_MESSAGE'
 *   templateId  — saved template id, when editing one
 *   maxLength   — parent's character cap, so a result can't overflow the field
 *   disabled    — parent-owned (e.g. while saving or sending)
 *   onApply     — (newContent) => void
 */
export function AiWriteButton({
  content = '',
  type,
  templateId = null,
  maxLength = 2000,
  disabled = false,
  onApply,
}) {
  const { available, quota, loading: statusLoading, failed, failure, status, refresh } =
    useAiStatus();

  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [previousContent, setPreviousContent] = useState(null);

  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  /**
   * The panel is positioned with `position: fixed` in a portal rather than
   * `absolute` next to the trigger.
   *
   * An absolutely-positioned panel is clipped by the campaign rail, which is an
   * `overflow-y-auto` scroll container only ~380px wide — narrower than the
   * panel itself. Anchoring right-0 to a button near the rail's left edge sent
   * the panel off the left side, where the container cut it in half.
   *
   * usePopperPosition solves exactly this: viewport coordinates, flip when the
   * preferred side doesn't fit, shift along the cross axis to stay on screen,
   * and recomputation on scroll from any ancestor.
   */
  const position = usePopperPosition({
    anchorRef: triggerRef,
    floatingRef: panelRef,
    placement: 'bottom',
    offset: 8,
    open,
  });
  /** The exact text we last wrote, so a manual edit is distinguishable from ours. */
  const lastAppliedRef = useRef(null);

  // Any manual edit invalidates the undo target — restoring text the user has
  // since built on top of would destroy their work rather than the AI's.
  useEffect(() => {
    if (previousContent !== null && content !== lastAppliedRef.current) {
      setPreviousContent(null);
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const hasContent = Boolean(content?.trim());
  const outOfQuota = quota ? quota.remaining <= 0 : false;
  const effectiveTone = tone || status?.defaultTone || 'professional';
  const contextConfigured = status?.contextConfigured !== false;

  const run = async (regenerate = false) => {
    setBusy(true);

    try {
      const draft = await personalizationController.compose({
        content,
        type,
        templateId,
        tone: effectiveTone,
        instruction,
        regenerate,
      });

      setPreviousContent(content);
      lastAppliedRef.current = draft.text;
      onApply(draft.text.slice(0, maxLength));
      setOpen(false);
      refresh();
      toast.success(regenerate ? 'Rewritten' : 'Draft written', {
        description: 'Undo is available next to the button.',
      });
    } catch (err) {
      toast.error(describeError(err, regenerate ? "Couldn't rewrite this" : "Couldn't write a draft"));
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (previousContent === null) return;
    onApply(previousContent);
    setPreviousContent(null);
    lastAppliedRef.current = null;
  };

  // Hidden when no provider is configured — an always-disabled button
  // advertising a feature the deployment doesn't have is worse than no button.
  // A FAILED status check is different and says so, since that's a bug.
  if (!statusLoading && !available && !failed) return null;

  if (failed) {
    return (
      <span
        className="shrink-0 whitespace-nowrap text-[12px]"
        style={{ color: 'var(--amber)' }}
        title={failure || ''}
      >
        AI unavailable
      </span>
    );
  }

  /**
   * Kept to one word.
   *
   * This sits in the campaign rail, which is ~380px wide and already carries
   * Preview, Template and a character counter. "Write with AI" wrapped to three
   * lines there and broke the row. The sparkle icon carries the "AI" meaning, so
   * the word is redundant anyway — and the panel that opens says it explicitly.
   */
  const label = busy ? 'Working…' : hasContent ? 'Improve' : 'Write';

  return (
    <div className="relative inline-flex shrink-0 items-center gap-2">
      {previousContent !== null && (
        <button
          type="button"
          onClick={undo}
          className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Undo2 size={12} />
          Undo
        </button>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || busy}
        title={outOfQuota ? "You've used today's AI quota" : undefined}
        className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
      >
        <Sparkles size={12} />
        {label}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 w-[290px] max-w-[calc(100vw-1rem)] p-3 rounded-[var(--ui-radius-lg)] flex flex-col gap-3"
            style={{
              left: position.x,
              top: position.y,
              // Hidden until the first measurement lands, so it never flashes
              // at 0,0 before the popper has placed it.
              visibility: position.ready ? 'visible' : 'hidden',
              background: 'var(--surface-raised, var(--surface-sunken))',
              border: '1px solid var(--border-default)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            }}
          >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {hasContent ? 'Improve this message' : 'Write a message'}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Without context the output is competent but says nothing true, so
              point at the fix rather than letting them discover it themselves. */}
          {!contextConfigured && (
            <Link
              to="/dashboard/settings"
              className="flex items-start gap-2 px-2.5 py-2 rounded-[var(--ui-radius-md)] text-[12px] leading-relaxed"
              style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
            >
              <Settings2 size={13} className="shrink-0 mt-px" />
              <span>
                Tell Spurly what you do in Settings → AI context. Without it this will be generic.
              </span>
            </Link>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-[var(--text-secondary)]">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className="px-2.5 h-7 rounded-[var(--ui-radius-md)] text-[12px] font-medium transition-colors"
                  style={
                    effectiveTone === t.value
                      ? { background: 'var(--accent-tint-2)', color: 'var(--brand-purple)' }
                      : { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-[var(--text-secondary)]">
              Anything specific? <span className="text-[var(--text-tertiary)]">— optional</span>
            </label>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, 300))}
              placeholder="e.g. shorter, mention we're hiring"
              className="w-full h-9 px-3 rounded-[var(--ui-radius-lg)] text-[13px] bg-[var(--surface-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--text-tertiary)]">
            {hasContent
              ? 'Your {{tokens}} are kept exactly as they are. You can undo straight after.'
              : 'It writes one message with {{tokens}}, filled in per person when the campaign sends.'}
          </p>

          <div className="flex items-center justify-between gap-2">
            {quota ? (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {quota.remaining} left today
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {previousContent !== null && (
                <button
                  type="button"
                  onClick={() => run(true)}
                  disabled={disabled || busy || outOfQuota}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--ui-radius-md)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                >
                  <RefreshCw size={12} />
                  Try again
                </button>
              )}
              <button
                type="button"
                onClick={() => run(false)}
                disabled={disabled || busy || outOfQuota}
                className="h-8 px-3 rounded-[var(--ui-radius-sm)] text-[13px] font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand-purple)' }}
              >
                {busy ? 'Working…' : hasContent ? 'Improve' : 'Write'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default AiWriteButton;
