import sessionsApi from 'src/core/gateway/sessionsApi.js';
import profilesApi from 'src/core/gateway/profilesApi.js';

/**
 * Import Controller
 * Orchestrates the CSV-import save flow for spurly.web, mirroring the
 * extension's enrich path: create a session, then batch-save the parsed
 * profiles into it in 'enrich' mode.
 *
 * The backend batch endpoint requires an existing session, so unlike the
 * extension (which reuses a local/active session) the web always creates a
 * fresh session per import.
 */
class ImportController {
  /**
   * @param {Object} args
   * @param {string} args.sessionName    Name for the new session (required).
   * @param {string} [args.description]  Optional session description.
   * @param {Array}  args.profiles       Enrich-mode profile objects to save.
   * @returns {Promise<{ sessionId, savedCount, failedCount, totalCount }>}
   * @throws {Error} with a user-readable message on any failure.
   */
  async importProfiles({ sessionName, description, profiles }) {
    const name = sessionName?.trim();
    if (!name) throw new Error('Session name is required');
    if (!Array.isArray(profiles) || profiles.length === 0) {
      throw new Error('No profiles to import');
    }

    // 1. Create the session.
    const sessionRes = await sessionsApi.createSession({ name, description });
    if (!sessionRes?.success || !sessionRes?.data?._id) {
      throw new Error(sessionRes?.message || 'Failed to create session');
    }
    const sessionId = sessionRes.data._id;

    // 2. Batch-save the profiles into it (enrich mode).
    const saveRes = await profilesApi.batchSaveProfiles(sessionId, profiles, 'enrich');
    if (!saveRes?.success) {
      throw new Error(saveRes?.message || 'Failed to save imported profiles');
    }

    const d = saveRes.data || {};
    return {
      sessionId,
      sessionName: name,
      savedCount: d.savedCount ?? profiles.length,
      failedCount: d.failedCount ?? 0,
      totalCount: d.totalCount ?? profiles.length,
    };
  }
}

export default new ImportController();
