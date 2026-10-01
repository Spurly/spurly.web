import { useRef, useState } from 'react';
import { Image as ImageIcon, Send } from 'lucide-react';
import { Button } from 'src/core/primitives';
import { POST_MAX, POST_MEDIA } from 'src/products/posts/constants/constants.js';

const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * New post: text, optionally scheduled, or with ONE image or video (media posts
 * go out now only: there is no stored file to send later). Render with a `key`
 * that changes after a successful post, so the form resets.
 */
export function Composer({ publishing, onPublish, onPublishMedia }) {
  const [text, setText] = useState('');
  const [when, setWhen] = useState('');
  // Fixed when the form mounts (the key remounts it per post): reading the clock during render is impure.
  const [minWhen] = useState(() => toLocalInput(new Date(Date.now() + 5 * 60 * 1000)));
  const [media, setMedia] = useState(null); // { kind, file }
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const pick = (kind) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) { setMedia({ kind, file }); setWhen(''); }
  };

  const scheduling = Boolean(when) && !media;
  const canSubmit = !publishing && (media ? true : Boolean(text.trim())) && text.length <= POST_MAX;

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (media) onPublishMedia({ text, kind: media.kind, file: media.file });
    else onPublish({ text, when: when ? new Date(when).toISOString() : '' });
  };

  return (
    <form onSubmit={submit} className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] p-4 flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={POST_MAX}
        placeholder="What do you want to talk about?"
        aria-label="Post text"
        className="w-full resize-y rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-3 py-2.5 text-[length:var(--ui-t-control)] leading-[1.6] text-[var(--ui-text-primary)] focus:outline-none focus:border-[var(--ui-accent)]"
      />
      {media && (
        <div className="flex items-center gap-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
          <ImageIcon size={13} aria-hidden="true" />
          <span className="truncate">{media.file.name}</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMedia(null)}>Remove</Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={imageRef} type="file" hidden accept={POST_MEDIA.image.accept} onChange={pick('image')} />
        <input ref={videoRef} type="file" hidden accept={POST_MEDIA.video.accept} onChange={pick('video')} />
        <Button type="button" size="sm" variant="ghost" leadingIcon={<ImageIcon size={13} />} onClick={() => imageRef.current?.click()} disabled={publishing}>Image</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => videoRef.current?.click()} disabled={publishing}>Video</Button>
        <label className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
          Schedule
          <input
            type="datetime-local"
            value={when}
            min={minWhen}
            disabled={publishing || Boolean(media)}
            onChange={(e) => setWhen(e.target.value)}
            className="h-8 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2 text-[var(--ui-text-primary)] disabled:opacity-50"
          />
        </label>
        <span className="flex-1" />
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] tabular-nums">{text.length}/{POST_MAX}</span>
        <Button type="submit" size="sm" variant="primary" loading={publishing} disabled={!canSubmit} leadingIcon={<Send size={13} />}>
          {scheduling ? 'Schedule' : 'Post now'}
        </Button>
      </div>
      {media && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">A post with an image or video is published right away and cannot be scheduled.</p>}
    </form>
  );
}
