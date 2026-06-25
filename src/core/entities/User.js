/**
 * User Entity
 * Represents the User model from backend
 */

export class User {
  constructor(data) {
    this._id = data._id;
    this.name = data.name;
    this.email = data.email;
    this.linkedinProfile = data.linkedinProfile;
    this.profilePicture = data.profilePicture;
    this.companyName = data.companyName;
    this.sector = data.sector;
    this.location = data.location;
    this.teamSize = data.teamSize;
    this.tier = data.tier || 'free';
    this.creditBalance = data.creditBalance ?? 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromResponse(data) {
    return new User(data);
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      linkedinProfile: this.linkedinProfile,
      profilePicture: this.profilePicture,
      companyName: this.companyName,
      sector: this.sector,
      location: this.location,
      teamSize: this.teamSize,
      tier: this.tier,
      creditBalance: this.creditBalance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Auth Response Entity
 * Response from auth endpoints
 */
export class AuthResponse {
  constructor(data) {
    this.success = data.success;
    this.message = data.message;
    this.data = data.data;
    this.status = data.status;
  }

  static fromResponse(data) {
    return new AuthResponse(data);
  }

  getUser() {
    return this.data?.user ? User.fromResponse(this.data.user) : null;
  }

  getToken() {
    return this.data?.token || null;
  }
}
