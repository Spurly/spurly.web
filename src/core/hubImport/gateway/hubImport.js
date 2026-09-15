import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Platform-level gateway for "import into a Hub audience".
 *
 * Lives in platform rather than inside the Hub product's own modules: this
 * thin wrapper around `POST /hub/searches/import` mirrors how the backend
 * keeps Hub's own module isolated from `platform/people` and instead shares
 * only through `platform/*`.
 *
 * Returns the raw created search/audience row — just `{ _id, name, mode,
 * status, ... }` — callers here only need the id to link to `/hub/leads`.
 */
class HubImportGateway {
  async createManualAudience({ name, seeds }) {
    const res = await apiGateway.post('/hub/searches/import', { name, seeds });
    return res.data?.data?.search ?? null;
  }
}

export const hubImportGateway = new HubImportGateway();
export default hubImportGateway;
