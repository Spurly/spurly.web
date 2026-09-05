/**
 * Template token vocabulary.
 *
 * A campaign stores ONE note/body for every recipient. The extension's
 * background worker (`fillTemplate` in spurly.extension/src/background/
 * background.js) substitutes {{token}} placeholders per member right before the
 * send, so this list must stay in step with the token map over there —
 * otherwise the web app offers a chip that silently resolves to nothing.
 *
 * Unknown tokens are STRIPPED at send time rather than sent verbatim: mailing
 * someone "Hi {{industry}}" is worse than mailing them "Hi".
 */

/** Insertable chips, in the order they're offered. */
export const TEMPLATE_TOKENS = [
  { token: '{{firstName}}', label: 'First name', sample: 'Priya' },
  { token: '{{lastName}}', label: 'Last name', sample: 'Sharma' },
  { token: '{{fullName}}', label: 'Full name', sample: 'Priya Sharma' },
  { token: '{{company}}', label: 'Company', sample: 'Acme' },
  { token: '{{title}}', label: 'Job title', sample: 'Head of Design' },
  { token: '{{location}}', label: 'Location', sample: 'Bengaluru' },
  { token: '{{sender}}', label: 'Your first name', sample: 'You' },
];

/**
 * Every token the send-time filler understands, including the aliases that
 * aren't offered as chips ({{name}}, {{companyName}}, {{jobTitle}},
 * {{senderName}}). Used to tell a real token from a typo when previewing.
 */
const SAMPLE_VALUES = {
  name: 'Priya',
  firstName: 'Priya',
  lastName: 'Sharma',
  fullName: 'Priya Sharma',
  company: 'Acme',
  companyName: 'Acme',
  title: 'Head of Design',
  jobTitle: 'Head of Design',
  location: 'Bengaluru',
  sender: 'You',
  senderName: 'You',
};

// Built fresh per call — a shared /g regex carries `lastIndex` between calls,
// which makes exec() loops skip matches on every other invocation.
const tokenRegex = () => /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Render a template the way the extension will at send time, using sample
 * recipient data. Purely for the editor preview — the real fill happens in the
 * extension against each member's snapshot.
 *
 * @param {string} content
 * @param {Object} [values] - override sample values, e.g. { sender: 'Sarthak' }
 * @returns {string}
 */
export function previewTemplate(content, values = {}) {
  if (!content) return '';
  const map = { ...SAMPLE_VALUES, ...values };
  return String(content)
    .replace(tokenRegex(), (_match, key) =>
      Object.prototype.hasOwnProperty.call(map, key) ? map[key] : '',
    )
    // Tidy the gaps a stripped token leaves behind — same cleanup the
    // extension applies, so the preview matches what actually goes out.
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.!?])/g, '$1')
    .trim();
}

/**
 * Build a `previewTemplate` value map from a real recipient — a campaign
 * member or a Person row — so a preview shows what that individual will
 * actually receive rather than placeholder data.
 *
 * Mirrors the extension's per-member mapping: `name` is the FIRST name, and the
 * aliases ({{companyName}}, {{jobTitle}}, …) resolve to the same values.
 *
 * @param {Object} person - { name, company, title, location }
 * @param {string} [senderName] - the signed-in user's first name
 */
export function previewValuesFor(person = {}, senderName = '') {
  const fullName = (person.name || '').trim();
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ');
  const company = person.company || '';
  const title = person.title || '';

  return {
    name: firstName,
    firstName,
    lastName,
    fullName,
    company,
    companyName: company,
    title,
    jobTitle: title,
    location: person.location || '',
    sender: senderName,
    senderName,
  };
}

/**
 * Tokens present in the content that the sender doesn't know how to fill.
 * Surfaced as a warning in the editor so a typo like {{firstname}} is caught
 * before it silently disappears from a hundred invitations.
 *
 * @param {string} content
 * @returns {string[]} unique unknown token names
 */
export function findUnknownTokens(content) {
  if (!content) return [];
  const re = tokenRegex();
  const found = new Set();
  let match = re.exec(content);
  while (match !== null) {
    if (!Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, match[1])) {
      found.add(match[1]);
    }
    match = re.exec(content);
  }
  return Array.from(found);
}

/**
 * Insert `token` into `text` at [start, end), returning the new text and the
 * caret position that should follow it.
 *
 * @returns {{ text: string, caret: number }}
 */
export function insertTokenAt(text, token, start, end) {
  const safeStart = Number.isInteger(start) ? start : text.length;
  const safeEnd = Number.isInteger(end) ? end : safeStart;
  return {
    text: text.slice(0, safeStart) + token + text.slice(safeEnd),
    caret: safeStart + token.length,
  };
}
