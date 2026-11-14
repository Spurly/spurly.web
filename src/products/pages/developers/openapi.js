/**
 * The Spurly LinkedIn API description. One spec, the organisation API (/v2),
 * defined in openapi.v2.js. This module is the lookup layer the docs render from
 * (operations, $ref resolution); scripts/buildOpenApi.mjs publishes the spec as
 * /developers/openapi.v2.json.
 *
 * Keep openapi.v2.js in step with spurly.backend src/products/hub/gateway.
 */

import { OPENAPI_V2 } from './openapi.v2.js';

export const OPENAPI = OPENAPI_V2;

/** Every operation, in document order, with its path and method. */
export function operations() {
  const spec = OPENAPI_V2;
  const out = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (item[method]) out.push({ path, method, server: spec.servers[0].url, version: 'v2', ...item[method] });
    }
  }
  return out;
}

/** Kept so callers need not change; there is one spec now. */
export function allOperations() {
  return operations();
}

export function operationById(id) {
  return allOperations().find((op) => op.operationId === id) || null;
}

/** Resolve a local `$ref` ("#/components/...") to its object. */
export function resolveRef(node) {
  if (!node || typeof node !== 'object' || !node.$ref) return node;
  const parts = node.$ref.replace(/^#\//, '').split('/');
  let cur = OPENAPI_V2;
  for (const p of parts) cur = cur?.[p];
  return cur ? { ...cur, ...(cur.$ref ? resolveRef(cur) : {}) } : null;
}

export function refName(node) {
  return node?.$ref ? node.$ref.split('/').pop() : null;
}
