import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Profile Photos API Client
 * Resolves LinkedIn profile URLs to avatar images Spurly hosts. See
 * src/platform/people/profilePhoto.js for the store that batches these calls.
 */
class ProfilePhotosApi {
  /**
   * POST /profile-photos/resolve  Body: { profiles: string[] }
   *
   * @param {string[]} profileUrls
   * @returns {Promise<Object<string,string>>} profileUrl -> image url, resolved only
   */
  async getPhotos(profileUrls) {
    const res = await apiGateway.post('/profile-photos/resolve', { profiles: profileUrls });
    // res.data is the standard { success, message, data, status } envelope.
    return res?.data?.data?.photos ?? {};
  }
}

const profilePhotosApi = new ProfilePhotosApi();
export default profilePhotosApi;
