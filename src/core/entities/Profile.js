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
