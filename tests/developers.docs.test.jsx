// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CONTENT_META } from 'src/products/pages/website/content/content.meta.generated.js';
import { CONTENT_BODIES } from 'src/products/pages/website/content/content.bodies.generated.js';
import { OPENAPI, allOperations } from 'src/products/pages/developers/openapi.js';
import { OPENAPI_V2 } from 'src/products/pages/developers/openapi.v2.js';
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
    expect(nav.map((s) => s.name)).toEqual(['Get started', 'Guides', 'API reference', 'Webhooks', 'Resources', 'v2: Get started', 'v2: Guides', 'v2: API reference', 'v2: Webhooks']);
    expect(nav[0].pages[0].path).toBe('/developers');
    expect(nav.find((s) => s.name === 'v2: Get started').pages[0].path).toBe('/developers/v2');
  });

  it.each(embeds.map((e) => [`${e.page} ::${e.name} ${e.arg}`, e]))('%s resolves', (_label, e) => {
    if (e.name === 'endpoint') expect(allOperations().some((op) => op.operationId === e.arg)).toBe(true);
    if (e.name === 'endpoints') expect(endpointsWithTag(e.arg).length).toBeGreaterThan(0);
    if (e.name === 'schema') expect(OPENAPI.components.schemas[e.arg] || OPENAPI_V2.components.schemas[e.arg]).toBeTruthy();
    if (e.name === 'event') expect(OPENAPI.webhooks[e.arg]).toBeTruthy();
  });

  it('documents every endpoint on a reference page', () => {
    const shown = new Set();
    for (const e of embeds) {
      if (e.name === 'endpoint') shown.add(e.arg);
      if (e.name === 'endpoints') endpointsWithTag(e.arg).forEach((op) => shown.add(op.operationId));
    }
    expect(allOperations().map((op) => op.operationId).filter((id) => !shown.has(id))).toEqual([]);
  });

  it('documents every object and every event', () => {
    const schemas = new Set(embeds.filter((e) => e.name === 'schema').map((e) => e.arg));
    expect(['Account', 'LinkedinConnection', 'Chat', 'Message', 'Attachment', 'Reaction', 'Event', 'Error'].filter((s) => !schemas.has(s))).toEqual([]);
    expect(embeds.some((e) => e.name === 'events')).toBe(true);
  });

  it.each(allOperations().map((op) => [op.operationId, op]))('%s has curl, Node.js and Python samples with a real URL', (_id, op) => {
    const samples = samplesFor(op);
    expect(samples.map((s) => s.id)).toEqual(['curl', 'node', 'python']);
    for (const s of samples) {
      expect(s.code).toContain(op.version === 'v2' ? 'https://api.getspurly.com/v2' : 'https://api.getspurly.com/v1');
      expect(s.code).not.toMatch(/\{(orgId|accountId|chatId|messageId|attachmentId|postId|invitationId|identifier)\}/);
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
    for (const op of allOperations()) {
      expect(Object.keys(op.responses)).toEqual(expect.arrayContaining(['401', '429']));
    }
  });

  it('documents every /v2 object and event', () => {
    const schemas = new Set(embeds.filter((e) => e.name === 'schema').map((e) => e.arg));
    expect(['V2Org', 'V2Account', 'V2ConnectState', 'V2Chat', 'V2Message', 'V2Usage', 'V2Event', 'V2Error', 'V2MessageCreatedEvent', 'V2MessageUpdatedEvent', 'V2AccountEvent'].filter((s) => !schemas.has(s))).toEqual([]);
  });

  it('keeps /v2 names apart from /v1 and has no duplicate operation ids', () => {
    const names = [...Object.keys(OPENAPI_V2.components.schemas), ...Object.keys(OPENAPI_V2.components.parameters), ...Object.keys(OPENAPI_V2.components.responses)];
    expect(names.filter((n) => !n.startsWith('V2'))).toEqual([]);
    const ids = allOperations().map((op) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('renders a /v2 endpoint against the /v2 base URL', () => {
    const html = renderToString(<MemoryRouter><Endpoint operationId="v2ConnectAccount" /></MemoryRouter>);
    expect(html).toContain('/orgs/{orgId}/accounts/connect');
    expect(html).toContain('api.getspurly.com/v2/orgs/');
    expect(html).toContain('409');
  });

  it('never names the outside services behind LinkedIn in /v2 docs or either spec', () => {
    const vendor = /unipile|dexkor/i;
    expect(JSON.stringify(OPENAPI_V2)).not.toMatch(vendor);
    expect(JSON.stringify(OPENAPI)).not.toMatch(vendor);
    const v2Pages = docs.filter((p) => p.path === '/developers/v2' || p.path.startsWith('/developers/v2/'));
    expect(v2Pages.length).toBeGreaterThan(10);
    for (const p of v2Pages) {
      expect(JSON.stringify([p, CONTENT_BODIES[p.path]])).not.toMatch(vendor);
    }
  });
});
