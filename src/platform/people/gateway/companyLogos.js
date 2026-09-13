import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Company Logos Gateway
 * Resolves company display names to web domains, which the UI turns into logo
 * image URLs. See src/platform/people/hooks/companyLogo.js for the store that batches
 * these calls.
 */
class CompanyLogosGateway {
  /**
   * POST /companies/logos  Body: { names: string[] }
   *
   * @param {string[]} names
   * @returns {Promise<Object<string,string>>} name -> domain, resolved only
   */
  async getLogos(names) {
    const res = await apiGateway.post('/companies/logos', { names });
    // res.data is the standard { success, message, data, status } envelope.
    return res?.data?.data?.logos ?? {};
  }
}

export const companyLogosGateway = new CompanyLogosGateway();
export default companyLogosGateway;
