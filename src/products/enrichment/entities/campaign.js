/**
 * An enrichment campaign, as the UI reads it.
 *
 * Thin pass-through, same reasoning as the outreach `Campaign` entity it
 * mirrors: the server response carries `_id`, `name`, `leadIds`, `counts`,
 * `status` and more, all read directly by the pages today. `raw` is the
 * escape hatch for anything not worth naming here.
 */
function createEnrichmentCampaign(data = {}) {
  return { ...data, raw: data };
}

export const EnrichmentCampaign = {
  fromResponse(data) {
    return data ? createEnrichmentCampaign(data) : null;
  },
  fromList(list = []) {
    return list.map(EnrichmentCampaign.fromResponse);
  },
};

export default EnrichmentCampaign;
