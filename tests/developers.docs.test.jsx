// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CONTENT_META } from 'src/products/pages/website/content/content.meta.generated.js';
import { CONTENT_BODIES } from 'src/products/pages/website/content/content.bodies.generated.js';
import { OPENAPI, operations } from 'src/products/pages/developers/openapi.js';
import { endpointsWithTag } from 'src/products/pages/developers/Endpoint.jsx';
import { samplesFor } from 'src/products/pages/developers/samples.js';
import Endpoint from 'src/products/pages/developers/Endpoint.jsx';
import { docsNav } from 'src/products/pages/developers/nav.js';

/** The developer docs: every embed resolves, every endpoint and event is documented somewhere. */

const docs = CONTENT_META.filter((p) => p.template === 'docs');
const embeds = docs.flatMap((p) => (CONTENT_BODIES[p.path] || []).filter((b) => b.type === 'embed').map((b) => ({ ...b, page: p.path })));

describe('developer docs', () => {
  it('has pages in every sidebar section, overview first', () => {
    const nav = docsNav();
    expect(nav.map((s) => s.name)).toEqual(['Get started', 'Guides', 'API reference', 'Webhooks', 'Resources']);
    expect(nav[0].pages[0].path).toBe('/developers');
  });

  it.each(embeds.map((e) => [`${e.page} ::${e.name} ${e.arg}`, e]))('%s resolves', (_label, e) => {
    if (e.name === 'endpoint') expect(operations().some((op) => op.operationId === e.arg)).toBe(true);
    if (e.name === 'endpoints') expect(endpointsWithTag(e.arg).length).toBeGreaterThan(0);
    if (e.name === 'schema') expect(OPENAPI.components.schemas[e.arg]).toBeTruthy();
    if (e.name === 'event') expect(OPENAPI.webhooks[e.arg]).toBeTruthy();
  });

  it('documents every endpoint on a reference page', () => {
    const shown = new Set();
    for (const e of embeds) {
      if (e.name === 'endpoint') shown.add(e.arg);
      if (e.name === 'endpoints') endpointsWithTag(e.arg).forEach((op) => shown.add(op.operationId));
    }
    expect(operations().map((op) => op.operationId).filter((id) => !shown.has(id))).toEqual([]);
  });

  it('documents every object and every event', () => {
    const schemas = new Set(embeds.filter((e) => e.name === 'schema').map((e) => e.arg));
    expect(['Account', 'LinkedinConnection', 'Chat', 'Message', 'Attachment', 'Reaction', 'Event', 'Error'].filter((s) => !schemas.has(s))).toEqual([]);
    expect(embeds.some((e) => e.name === 'events')).toBe(true);
  });

  it.each(operations().map((op) => [op.operationId, op]))('%s has curl, Node.js and Python samples with a real URL', (_id, op) => {
    const samples = samplesFor(op);
    expect(samples.map((s) => s.id)).toEqual(['curl', 'node', 'python']);
    for (const s of samples) {
      expect(s.code).toContain('https://api.getspurly.com/v1');
      expect(s.code).not.toMatch(/\{(accountId|chatId|messageId|attachmentId)\}/);
    }
  });

  it('renders an endpoint with its parameters, body and responses', () => {
    const html = renderToString(<MemoryRouter><Endpoint operationId="connectLinkedin" /></MemoryRouter>);
    expect(html).toContain('/accounts/{accountId}/linkedin/connect');
    expect(html).toContain('endUserIp');
    expect(html).toContain('422');
    expect(html).toContain('curl');
  });

  it('every endpoint documents 401 and 429', () => {
    for (const op of operations()) {
      expect(Object.keys(op.responses)).toEqual(expect.arrayContaining(['401', '429']));
    }
  });
});
