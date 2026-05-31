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
    this.email = data.email ?? '';
    this.avatar = data.avatar ?? '';
    this.enrichmentStatus = data.enrichmentStatus ?? 'new';
    this.aiScore = data.aiScore ?? null;
    this.capturedOn = data.capturedOn ?? '';
    this.source = data.source ?? 'linkedin';
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
