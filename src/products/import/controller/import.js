import importGateway from '../gateway/import.js';
import { IMPORT_EVENTS } from '../constants/constants.js';

/**
 * Import Controller
 *
 * Orchestrates the CSV-import save flow for spurly.web. Parsed rows go into
 * the IMPORTED LEADS staging area — not straight into the Hub. Staging is
 * free; the user promotes the rows they want into the Hub's own lead
 * dataset (where the PROFILE_CARD charge and the daily capture limit
 * apply), enriched or not — enrichment now happens on the Hub side after
 * promotion, not while a lead sits in staging.
 *
 * try/catch and async/await live here (and in the gateway) only. Every
 * method takes the caller's `eventEmitter` first and reports the outcome by
 * emitting an event instead of returning/throwing.
 */

/**
 * Emits IMPORT_SUCCESS with { savedCount, failedCount, totalCount,
 * importBatchId }, or IMPORT_FAILURE with a user-readable message.
 */
async function importProfiles(eventEmitter, { profiles, sourceFile = '' }) {
  try {
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

    const res = await importGateway.stageLeads(valid, sourceFile);
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to import leads');
    }

    const d = res.data || {};
    // `inserted` + `updated` is what actually landed in staging. A row that
    // matched an existing staged lead unchanged counts as saved too — it IS
    // in the staging list, which is all this number is telling the user.
    const saved = (d.inserted ?? 0) + (d.updated ?? 0);

    eventEmitter.emit(IMPORT_EVENTS.IMPORT_SUCCESS, {
      savedCount: saved || valid.length,
      failedCount: droppedForUrl + (d.skipped ?? 0),
      totalCount: profiles.length,
      importBatchId: d.importBatchId || null,
    });
  } catch (error) {
    // Raw error (not just its message) so callers can run it through
    // apiError.js's status-aware toast/inline copy, same as before this
    // controller existed.
    eventEmitter.emit(IMPORT_EVENTS.IMPORT_FAILURE, error);
  }
}

/**
 * The staging table always loads its page of leads and the status counts
 * together — orchestrating that pairing here is exactly what this layer is
 * for (see loadInboxPage in the inbox controller for the same shape).
 * Emits LOAD_SUCCESS with { leads, pagination, stats }, or LOAD_FAILURE.
 */
async function loadLeads(eventEmitter, { limit, skip, search, enrichStatus } = {}) {
  try {
    const [listRes, statsRes] = await Promise.all([
      importGateway.getLeads({ limit, skip, search, enrichStatus }),
      importGateway.getStats(),
    ]);
    if (!listRes?.success) throw new Error(listRes?.message || 'Could not load imported leads');
    eventEmitter.emit(IMPORT_EVENTS.LOAD_SUCCESS, {
      leads: listRes.data?.leads || [],
      pagination: listRes.data?.pagination || { total: 0, limit, skip: 0 },
      stats: statsRes?.success ? statsRes.data || { total: 0, byStatus: {} } : null,
    });
  } catch (error) {
    eventEmitter.emit(IMPORT_EVENTS.LOAD_FAILURE, error?.message || 'Could not load imported leads');
  }
}

/** Emits PROMOTE_SUCCESS with { promoted }, or PROMOTE_FAILURE with a message. */
async function promoteLeads(eventEmitter, ids) {
  try {
    const res = await importGateway.promoteLeads(ids);
    if (!res?.success) throw new Error(res?.message || 'Could not move those leads');
    eventEmitter.emit(IMPORT_EVENTS.PROMOTE_SUCCESS, { promoted: res.data?.promoted || 0 });
  } catch (error) {
    eventEmitter.emit(IMPORT_EVENTS.PROMOTE_FAILURE, error?.message || 'Could not move those leads');
  }
}

/** Emits DELETE_SUCCESS with { deleted }, or DELETE_FAILURE with a message. */
async function deleteLeads(eventEmitter, ids) {
  try {
    const res = await importGateway.deleteLeads(ids);
    if (!res?.success) throw new Error(res?.message || 'Could not delete those leads');
    eventEmitter.emit(IMPORT_EVENTS.DELETE_SUCCESS, { deleted: res.data?.deleted || 0 });
  } catch (error) {
    eventEmitter.emit(IMPORT_EVENTS.DELETE_FAILURE, error?.message || 'Could not delete those leads');
  }
}

const importController = { importProfiles, loadLeads, promoteLeads, deleteLeads };
export default importController;
