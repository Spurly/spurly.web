/**
 * An enrichment campaign, as the UI reads it.
 *
 * Thin pass-through, same reasoning as the outreach `Campaign` entity it
 * mirrors: the server response carries `_id`, `name`, `leadIds`, `counts`,
 * `status` and more, all read directly by the pages today. `raw` is the
 * escape hatch for anything not worth naming here.
 */
export class EnrichmentCampaign {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new EnrichmentCampaign(data) : null;
  }

  static fromList(list = []) {
    return list.map(EnrichmentCampaign.fromResponse);
  }
}

export default EnrichmentCampaign;
