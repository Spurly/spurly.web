/* Spec descriptions use `code` spans only; render them without a markdown
   library. Everything is text, so React escapes it. */
export default function InlineText({ text = "" }) {
  const parts = String(text).split(/(`[^`]+`)/g);
  return parts.map((part, i) => (part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={i}>{part.slice(1, -1)}</code> : part));
}
