/**
 * Parser for the public site's content files (src/products/pages/website/content/**.md).
 * Plain ESM, no dependencies, no classes. Pure functions only, so tests can import it.
 *
 * A content file is YAML-subset frontmatter + a small Markdown subset:
 *   ## h2   ### h3   paragraphs   - ul   1. ol   | tables |   > quote   ![alt](src)
 *   inline: **bold**  *italic*  `code`  [text](href)
 * Raw HTML is rejected on purpose: pages stay data, rendered by React templates.
 */

export const TEMPLATES = ['article', 'product', 'solutions', 'comparison', 'pricing', 'tool', 'page'];
const REQUIRED = ['title', 'description', 'path', 'date', 'template'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------- frontmatter

function scalar(raw) {
  const v = raw.trim();
  if (v === '') return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((s) => scalar(s)).filter((s) => s !== '');
  }
  return v;
}

function keyValue(line) {
  const m = line.match(/^([A-Za-z_][\w-]*):(?:\s+(.*))?$/);
  return m ? [m[1], m[2] ?? ''] : null;
}

/** Parses the YAML subset: `key: value`, inline `[a, b]`, block lists of scalars
 *  (`- x`) and block lists of objects (`- q: ...` / `  a: ...`). */
export function parseFrontmatter(text, file = 'content') {
  const data = {};
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i += 1; continue; }
    const kv = keyValue(line);
    if (!kv) throw new Error(`${file}: cannot read frontmatter line "${line}"`);
    const [key, rest] = kv;
    if (rest !== '') { data[key] = scalar(rest); i += 1; continue; }
    // Block list under `key:`
    const items = [];
    i += 1;
    while (i < lines.length && /^\s+-\s/.test(lines[i])) {
      const first = lines[i].replace(/^\s+-\s+/, '');
      const okv = keyValue(first);
      if (okv) {
        const obj = { [okv[0]]: scalar(okv[1]) };
        i += 1;
        while (i < lines.length && /^\s{2,}[A-Za-z_]/.test(lines[i]) && !/^\s+-\s/.test(lines[i])) {
          const inner = keyValue(lines[i].trim());
          if (!inner) throw new Error(`${file}: cannot read frontmatter line "${lines[i]}"`);
          obj[inner[0]] = scalar(inner[1]);
          i += 1;
        }
        items.push(obj);
      } else {
        items.push(scalar(first));
        i += 1;
      }
    }
    data[key] = items;
  }
  return data;
}

// --------------------------------------------------------------------- inline

/** Inline Markdown -> array of strings and {t, ...} nodes. */
export function parseInline(src) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push(buf); buf = ''; } };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && i + 1 < src.length) { buf += src[i + 1]; i += 2; continue; }
    if (c === '`') {
      const end = src.indexOf('`', i + 1);
      if (end > i) { flush(); out.push({ t: 'code', text: src.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (c === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end > i + 2) { flush(); out.push({ t: 'strong', children: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (c === '*' || (c === '_' && (i === 0 || /\W/.test(src[i - 1])))) {
      const end = src.indexOf(c, i + 1);
      if (end > i + 1 && src[i + 1] !== ' ') { flush(); out.push({ t: 'em', children: parseInline(src.slice(i + 1, end)) }); i = end + 1; continue; }
    }
    if (c === '[') {
      const m = src.slice(i).match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
      if (m) { flush(); out.push({ t: 'link', href: m[2], children: parseInline(m[1]) }); i += m[0].length; continue; }
    }
    buf += c;
    i += 1;
  }
  flush();
  return out;
}

export function inlineText(nodes) {
  return nodes.map((n) => (typeof n === 'string' ? n : n.text ?? inlineText(n.children))).join('');
}

export function slugify(text) {
  return text.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// --------------------------------------------------------------------- blocks

function tableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** Markdown body -> array of blocks. */
export function parseBlocks(body, file = 'content') {
  const lines = body.replace(/\r/g, '').split('\n');
  const blocks = [];
  const seenIds = new Set();
  let i = 0;
  const isBlank = (l) => l.trim() === '';
  const startsBlock = (l) => /^(#{2,3}\s|[-*]\s|\d+\.\s|>\s?|\||!\[)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i += 1; continue; }
    if (/^\s*</.test(line)) throw new Error(`${file}: raw HTML is not allowed (line "${line.slice(0, 40)}")`);
    if (/^#\s/.test(line)) throw new Error(`${file}: use ## for headings; the page title is the only H1`);

    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const inline = parseInline(h[2].trim());
      let id = slugify(inlineText(inline)) || 'section';
      for (let n = 2; seenIds.has(id); n += 1) id = `${slugify(inlineText(inline))}-${n}`;
      seenIds.add(id);
      blocks.push({ type: h[1].length === 2 ? 'h2' : 'h3', id, inline });
      i += 1; continue;
    }

    if (/^\|/.test(line) && /^\|?\s*:?-{2,}/.test(lines[i + 1] || '')) {
      const head = tableCells(line).map(parseInline);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(tableCells(lines[i]).map(parseInline)); i += 1; }
      for (const r of rows) if (r.length !== head.length) throw new Error(`${file}: table row has ${r.length} cells, header has ${head.length}`);
      blocks.push({ type: 'table', head, rows });
      continue;
    }

    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (img) { blocks.push({ type: 'image', alt: img[1], src: img[2] }); i += 1; continue; }

    if (/^>\s?/.test(line)) {
      const parts = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { parts.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      blocks.push({ type: 'quote', inline: parseInline(parts.join(' ').trim()) });
      continue;
    }

    const list = line.match(/^([-*]|\d+\.)\s+/);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        let text = lines[i].replace(re, '');
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) { text += ' ' + lines[i].trim(); i += 1; }
        items.push(parseInline(text.trim()));
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }

    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && (para.length === 0 || !startsBlock(lines[i]))) { para.push(lines[i].trim()); i += 1; }
    blocks.push({ type: 'p', inline: parseInline(para.join(' ')) });
  }
  return blocks;
}

export function blocksText(blocks) {
  const t = [];
  for (const b of blocks) {
    if (b.inline) t.push(inlineText(b.inline));
    if (b.items) b.items.forEach((it) => t.push(inlineText(it)));
    if (b.head) { b.head.forEach((c) => t.push(inlineText(c))); b.rows.forEach((r) => r.forEach((c) => t.push(inlineText(c)))); }
  }
  return t.join(' ');
}

// ----------------------------------------------------------------- whole file

/** One content file -> { meta, body }. Throws on anything malformed. */
export function parseContentFile(text, file = 'content') {
  const m = text.replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing --- frontmatter --- block`);
  const meta = parseFrontmatter(m[1], file);
  for (const k of REQUIRED) if (meta[k] === undefined || meta[k] === '') throw new Error(`${file}: frontmatter is missing "${k}"`);
  if (!TEMPLATES.includes(meta.template)) throw new Error(`${file}: template "${meta.template}" is not one of ${TEMPLATES.join(', ')}`);
  if (!/^\/[a-z0-9\-/]*$/.test(meta.path) || (meta.path !== '/' && meta.path.endsWith('/'))) throw new Error(`${file}: path "${meta.path}" must be lowercase, start with / and not end with /`);
  for (const k of ['date', 'updated']) if (meta[k] !== undefined && !DATE.test(String(meta[k]))) throw new Error(`${file}: "${k}" must be YYYY-MM-DD`);
  if (meta.faq) for (const f of meta.faq) if (!f || !f.q || !f.a) throw new Error(`${file}: every faq item needs q and a`);
  if (meta.template === 'comparison') {
    // Competitor facts need a date checked and at least one source (content rule 4).
    if (!DATE.test(String(meta.checked || ''))) throw new Error(`${file}: a comparison page needs "checked: YYYY-MM-DD"`);
    if (!Array.isArray(meta.sources) || !meta.sources.length || meta.sources.some((x) => !x || !x.name || !/^https?:\/\//.test(x.url || ''))) {
      throw new Error(`${file}: a comparison page needs "sources:" with name and an http(s) url for each`);
    }
  }
  if (meta.related !== undefined && !Array.isArray(meta.related)) throw new Error(`${file}: "related" must be a list of paths, e.g. [/pricing, /product/inbox]`);
  const body = parseBlocks(m[2], file);
  const words = blocksText(body).split(/\s+/).filter(Boolean).length;
  return {
    meta: {
      ...meta,
      updated: meta.updated || meta.date,
      readTime: meta.readTime || `${Math.max(1, Math.round(words / 220))} min read`,
      words,
    },
    body,
  };
}
