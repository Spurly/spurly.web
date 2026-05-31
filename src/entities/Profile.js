/**
 * Profile Entity
 * Represents a captured LinkedIn profile
 */

export class Profile {
  constructor(data) {
    this._id = data._id || data.id;
    this.name = data.name || 'Unknown';
    this.title = data.title || '';
    this.company = data.company || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.linkedinUrl = data.linkedinUrl || data.linkedin || '';
    this.location = data.location || '';
    this.timeInRole = data.timeInRole || '';
    this.enrichmentStatus = data.enrichmentStatus || 'pending';
    this.aiScore = data.aiScore || 0;
    this.aiGrade = data.aiGrade || 'Pending';
    this.avatar = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name || 'profile'}`;
    this.capturedOn = data.capturedOn || new Date().toLocaleDateString();
    this.source = data.source || 'LinkedIn';
    this.status = data.status || 'new';
    this.badges = data.badges || [];
    this.aiSummary = data.aiSummary || '';
    this.keySignals = data.keySignals || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromResponse(data) {
    return new Profile(data);
  }

  static fromResponseArray(dataArray) {
    return dataArray.map(item => Profile.fromResponse(item));
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      title: this.title,
      company: this.company,
      email: this.email,
      phone: this.phone,
      linkedinUrl: this.linkedinUrl,
      location: this.location,
      timeInRole: this.timeInRole,
      enrichmentStatus: this.enrichmentStatus,
      aiScore: this.aiScore,
      aiGrade: this.aiGrade,
      avatar: this.avatar,
      capturedOn: this.capturedOn,
      source: this.source,
      status: this.status,
      badges: this.badges,
      aiSummary: this.aiSummary,
      keySignals: this.keySignals,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Profiles Response Entity
 * Response from profiles endpoints
 */
export class ProfilesResponse {
  constructor(data) {
    this.success = data.success;
    this.message = data.message;
    this.data = data.data;
    this.pagination = data.pagination;
    this.status = data.status;
  }

  static fromResponse(data) {
    return new ProfilesResponse(data);
  }

  getProfiles() {
    const profiles = this.data?.profiles || this.data || [];
    return Array.isArray(profiles) ? Profile.fromResponseArray(profiles) : [];
  }

  getPagination() {
    return this.pagination || {
      limit: 0,
      skip: 0,
      total: 0,
      pages: 0,
      hasMore: false,
    };
  }
}
