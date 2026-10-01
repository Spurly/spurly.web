import { Mail } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { useLeadInmail } from 'src/products/inbox/hooks/useLeadInmail.js';
import { INMAIL_TEXT_MAX, INMAIL_SUBJECT_MAX } from 'src/products/inbox/constants/constants.js';

/**
 * Send an InMail to someone you are not connected to. Uses an InMail credit and
 * counts toward a daily limit; a limit or a missing credit comes back as a plain
 * sentence. Hidden for 1st-degree connections (a normal message does that).
 */
export function LeadInmail({ lead }) {
  const { open, setOpen, subject, setSubject, text, setText, sending, sent, send } = useLeadInmail(lead._id);
  if (lead.connectionDegree === 1) return null;
  const input = 'w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-primary)]';

  return (
    <section className="px-5 pt-[22px]" aria-label="InMail">
      <h3 className="ui-micro !text-[var(--ui-text-secondary)] mb-2.5">InMail</h3>
      {!open ? (
        <Button size="sm" variant="ghost" leadingIcon={<Mail size={13} />} onClick={() => setOpen(true)}>
          {sent ? 'Send another InMail' : 'Send an InMail'}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <input className={`${input} h-8`} value={subject} maxLength={INMAIL_SUBJECT_MAX} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" aria-label="InMail subject" disabled={sending} />
          <textarea className={`${input} py-1.5`} rows={5} value={text} maxLength={INMAIL_TEXT_MAX} onChange={(e) => setText(e.target.value)} placeholder="Write your message…" aria-label="InMail" disabled={sending} />
          <div className="flex items-center gap-2">
            <span className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)] flex-1">{text.length}/{INMAIL_TEXT_MAX} · uses an InMail credit</span>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={send} loading={sending} disabled={sending || !text.trim()}>Send</Button>
          </div>
        </div>
      )}
    </section>
  );
}
