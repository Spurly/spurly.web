/** Default per-channel outreach state for a person we've never reached. */
function emptyChannel() {
  return { status: 'none', lastSentAt: null, lastCampaignId: null, count: 0, lastError: '' };
}

/**
 * Rows captured before outreach tracking existed have no `outreach` field, so
 * fill in the "never contacted" shape rather than leaking undefined into the UI.
 */
function normalizeOutreach(outreach) {
  return {
    status: outreach?.status ?? 'none',
    connection: { ...emptyChannel(), ...(outreach?.connection ?? {}) },
    message: { ...emptyChannel(), ...(outreach?.message ?? {}) },
    lastTouchedAt: outreach?.lastTouchedAt ?? null,
  };
}

/**
 * Profile entity — represents a captured LinkedIn lead.
 * Wraps raw backend responses so the UI has a stable shape.
 */
export class Profile {
  constructor(data = {}) {
    this._id = data._id ?? data.id ?? null;
    this.name = data.name ?? '';
    this.title = data.title ?? '';
    this.company = data.company ?? '';
    this.location = data.location ?? '';
    this.headline = data.headline ?? '';
    this.email = data.email ?? '';
    this.phone = data.phone ?? '';
    this.currentCompany = data.currentCompany ?? data.company ?? '';
    this.skills = (data.skills ?? []).map((s) => (typeof s === 'string' ? s : s?.name ?? ''));
    this.avatar = data.avatar ?? '';
    this.enrichmentStatus = data.enrichmentStatus ?? data._captureStatus ?? 'new';
    this.aiScore = data.aiScore ?? null;
    this.capturedOn = data.capturedOn ?? data.createdAt ?? '';
    this.source = data.source ?? 'linkedin';
    this.linkedInUrl = data.linkedInUrl ?? data.profileUrl ?? '';
    this.connectionDegree = data.connectionDegree ?? null;
    // When LinkedIn says you connected, per its "Connected on <date>" line.
    // Present on connections; null on leads who aren't confirmed connections.
    this.connectedAt = data.connectedAt ?? null;
    // Outreach rollup derived server-side from the OutreachEvent log. Always
    // present in shape so the table can render a pill without null-checking.
    this.outreach = normalizeOutreach(data.outreach);
    // Keep the original payload for anything not explicitly mapped.
    this.raw = data;
  }

  static fromResponse(data) {
    return new Profile(data);
  }

  static fromList(list = []) {
    return list.map((item) => Profile.fromResponse(item));
  }
}
