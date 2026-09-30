import hubCompanyGateway from '../gateway/company.js';
import { COMPANY_EVENTS } from '../constants/constants.js';

async function getCompany(eventEmitter, identifier, options) {
  try {
    const data = await hubCompanyGateway.getCompany(identifier, options);
    eventEmitter.emit(COMPANY_EVENTS.GET_COMPANY_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(COMPANY_EVENTS.GET_COMPANY_FAILURE, error);
  }
}

const hubCompanyController = { getCompany };
export default hubCompanyController;
