import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Platform-level gateway for "import into a Hub audience".
 *
 * Lives in platform, not inside either product, on purpose: the leadgen
 * products (People, Import) need to hand a batch of already-captured
 * profiles to Hub's lead store, but the architecture boundary forbids one
 * product importing another directly (see eslint.boundaries.config.js — a
 * product may depend on shared/ui/platform and only its OWN product's
 * modules). This thin wrapper around `POST /hub/searches/import` is the
 * shared surface both sides are allowed to call, mirroring how the backend
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
