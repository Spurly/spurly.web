import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Profile Photos Gateway
 * Resolves LinkedIn profile URLs to avatar images Spurly hosts. See
 * src/core/people/hooks/profilePhoto.js for the store that batches these calls.
 */

/**
 * POST /profile-photos/resolve  Body: { profiles: string[] }
 *
 * @param {string[]} profileUrls
 * @returns {Promise<Object<string,string>>} profileUrl -> image url, resolved only
 */
async function getPhotos(profileUrls) {
  const res = await apiGateway.post('/profile-photos/resolve', { profiles: profileUrls });
  // res.data is the standard { success, message, data, status } envelope.
  return res?.data?.data?.photos ?? {};
}

const profilePhotosGateway = { getPhotos };
export default profilePhotosGateway;
