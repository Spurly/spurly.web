import { useRef, useState } from 'react';
import { Download, Paperclip, Smile } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { REACTION_CHOICES, MEDIA_KINDS } from 'src/products/inbox/constants/constants.js';

/**
 * Pieces of a message the plain text bubble does not cover (plan M3): received
 * attachments, reactions, the read tick, the reaction picker and the attach
 * menu. Presentational only: every action is a callback from useThread.
 */

const KIND_LABEL = { voice: 'Voice note', video: 'Video', image: 'Image', audio: 'Audio' };

const sizeLabel = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export function Attachments({ message, onOpen }) {
  const list = Array.isArray(message.attachments) ? message.attachments : [];
  if (list.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-col gap-1.5">
      {list.map((a, i) => (
        <li key={a.id || `${a.name}-${i}`}>
          <Button
            size="sm"
            variant="ghost"
            disabled={!a.downloadable}
            onClick={() => onOpen(message._id, a)}
            title={a.downloadable ? 'Download' : 'Not available to download'}
            leadingIcon={<Download size={12} aria-hidden="true" />}
          >
            {a.name || KIND_LABEL[a.kind] || 'Attachment'}{sizeLabel(a.size) ? ` · ${sizeLabel(a.size)}` : ''}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function Reactions({ message }) {
  const list = Array.isArray(message.reactions) ? message.reactions : [];
  if (list.length === 0) return null;
  const counts = list.reduce((acc, r) => {
    const entry = acc.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    entry.count += 1;
    entry.mine = entry.mine || Boolean(r.isMe);
    return acc.set(r.emoji, entry);
  }, new Map());
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {[...counts.values()].map((r) => (
        <span
          key={r.emoji}
          className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-[var(--ui-radius-pill)] border text-[length:var(--ui-t-micro)] ${r.mine ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-tint)]' : 'border-[var(--ui-border)] bg-[var(--ui-surface-card)]'}`}
        >
          {r.emoji}{r.count > 1 ? <span className="tabular-nums">{r.count}</span> : null}
        </span>
      ))}
    </div>
  );
}

/** "Seen" only where LinkedIn told us so; absence says nothing (we do not infer a read). */
export function SeenTick({ message }) {
  if (!message.isSender || !message.seenAt) return null;
  return <span title={`Seen ${new Date(message.seenAt).toLocaleString()}`}> · Seen</span>;
}

export function ReactionPicker({ message, onReact, disabled }) {
  const [open, setOpen] = useState(false);
  if (String(message.unipileMessageId ?? '').startsWith('local:')) return null;
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="React to this message"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center w-5 h-5 rounded-full text-[var(--ui-text-quaternary)] hover:text-[var(--ui-text-primary)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <Smile size={12} />
      </button>
      {open && (
        <span className="absolute z-10 bottom-6 left-0 flex gap-0.5 p-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-btn-shadow)]">
          {REACTION_CHOICES.map((emoji) => (
            <Button key={emoji} size="sm" variant="ghost" onClick={() => { setOpen(false); onReact(message._id, emoji); }}>
              {emoji}
            </Button>
          ))}
        </span>
      )}
    </span>
  );
}

export function AttachMenu({ onPick, disabled }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const [kind, setKind] = useState('attachment');
  const current = MEDIA_KINDS.find((k) => k.kind === kind);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="Attach a file"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center w-7 h-7 rounded-[var(--ui-radius-sm)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] disabled:opacity-50"
      >
        <Paperclip size={14} />
      </button>
      {open && (
        <span className="absolute z-20 bottom-9 left-0 flex flex-col w-44 p-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-btn-shadow)]">
          {MEDIA_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => { setKind(k.kind); setOpen(false); setTimeout(() => inputRef.current?.click(), 0); }}
              className="text-left px-2.5 py-1.5 rounded-[var(--ui-radius-sm)] text-[length:var(--ui-t-label)] hover:bg-[var(--ui-surface-hover)]"
            >
              {k.label}
            </button>
          ))}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={current?.accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(kind, file);
        }}
      />
    </span>
  );
}
