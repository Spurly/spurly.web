/** Plain mappers from the API shapes to what the UI reads. */

export function toToken(raw) {
  return {
    id: raw.id,
    name: raw.name,
    display: raw.display,
    scopes: raw.scopes ?? [],
    createdAt: raw.createdAt ?? null,
    lastUsedAt: raw.lastUsedAt ?? null,
    expiresAt: raw.expiresAt ?? null,
    expired: Boolean(raw.expired),
  };
}

export function toConnectedApp(raw) {
  return {
    id: raw.id,
    name: raw.name || raw.clientId || 'Unknown app',
    scopes: raw.scopes ?? [],
    connectedAt: raw.connectedAt ?? null,
    lastUsedAt: raw.lastUsedAt ?? null,
  };
}

export function toActivityRow(raw) {
  return {
    id: raw.id,
    tool: raw.tool,
    scope: raw.scope,
    ok: Boolean(raw.ok),
    errorCode: raw.errorCode ?? null,
    clientName: raw.clientName ?? null,
    ms: raw.ms ?? 0,
    at: raw.at ?? null,
  };
}
