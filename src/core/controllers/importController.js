import importedLeadsApi from 'src/core/gateway/importedLeadsApi.js';

/**
 * Import Controller
 *
 * Orchestrates the CSV-import save flow for spurly.web. Parsed rows go into
 * the IMPORTED LEADS staging area — not straight into People. Staging is free;
 * the user then enriches the rows they care about (visiting each profile via
 * the extension) and promotes the finished ones into People, which is where
 * the PROFILE_CARD charge and the daily capture limit apply.
 */
class ImportController {
  /**
   * @param {Object} args
   * @param {Array}  args.profiles   Parsed rows: { name, title, company, location, profileUrl, ... }
   * @param {string} [args.sourceFile] Original filename, shown in the staging table.
   * @returns {Promise<{ savedCount, failedCount, totalCount, importBatchId }>}
   * @throws {Error} with a user-readable message on any failure.
   */
  async importProfiles({ profiles, sourceFile = '' }) {
    if (!Array.isArray(profiles) || profiles.length === 0) {
      throw new Error('No profiles to import');
    }

    // Staging requires a profileUrl on every row (it's the dedupe key); drop
    // rows without one rather than failing the whole import.
    const valid = profiles.filter((p) => p?.profileUrl && p.profileUrl.toString().trim());
    const droppedForUrl = profiles.length - valid.length;
    if (valid.length === 0) {
      throw new Error('None of the rows had a LinkedIn profile URL');
    }

    const res = await importedLeadsApi.stageLeads(valid, sourceFile);
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to import leads');
    }

    const d = res.data || {};
    // `inserted` + `updated` is what actually landed in staging. A row that
    // matched an existing staged lead unchanged counts as saved too — it IS
    // in the staging list, which is all this number is telling the user.
    const saved = (d.inserted ?? 0) + (d.updated ?? 0);

    return {
      savedCount: saved || valid.length,
      failedCount: droppedForUrl + (d.skipped ?? 0),
      totalCount: profiles.length,
      importBatchId: d.importBatchId || null,
    };
  }
}

export default new ImportController();
