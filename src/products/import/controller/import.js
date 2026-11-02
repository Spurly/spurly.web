import importGateway from '../gateway/import.js';
import { IMPORT_EVENTS, LOOKUP_EVENTS } from '../constants/constants.js';

/**
 * Import Controller
 *
 * Orchestrates the CSV-import save flow for spurly.web. Parsed rows go into
 * the IMPORTED LEADS staging area — not straight into the Hub. Staging is
 * free; sending the rows the user wants queues them for import
 * (2026-09-18) — each one is resolved through LinkedIn (Unipile) BEFORE it
 * lands in the Hub's own lead dataset, so a lead only ever reaches Hub
 * Leads already sendable. A row leaves staging on its own once that
 * resolve finishes; failed ones stay behind for the user to retry.
 *
 * try/catch and async/await live here (and in the gateway) only. Every
 * method takes the caller's `eventEmitter` first and reports the outcome by
 * emitting an event instead of returning/throwing.
 */

/** The fields the backend keeps — UI-only keys (_id, _needsLookup…) stay here. */
const ROW_FIELDS = ['profileUrl', 'name', 'firstName', 'lastName', 'company', 'title', 'location', 'headline', 'email', 'phone', 'website'];

/**
 * The CSV import, fully automatic (2026-11-02): one call. Rows with a
 * LinkedIn URL go straight to the Hub; rows with a name + company are found
 * on LinkedIn and every confirmed match follows them into the same Hub
 * audience. Emits IMPORT_SUCCESS with { sentToHub, finding, skipped,
 * duplicates, audience }, or IMPORT_FAILURE with the raw error.
 */
async function importProfiles(eventEmitter, { profiles = [], lookupRows = [], sourceFile = '' }) {
  try {
    const rows = [...(profiles || []), ...(lookupRows || [])].map((r) =>
      Object.fromEntries(ROW_FIELDS.map((k) => [k, r?.[k] ?? ''])),
    );
    if (rows.length === 0) {
      throw new Error('None of the rows had a LinkedIn profile URL, or a name and company to find one with');
    }
    const res = await importGateway.autoImport(rows, sourceFile);
    if (!res?.success) throw new Error(res?.message || 'Failed to import leads');
    const d = res.data || {};
    eventEmitter.emit(IMPORT_EVENTS.IMPORT_SUCCESS, {
      sentToHub: d.sentToHub ?? 0,
      finding: d.finding ?? 0,
      skipped: d.skipped ?? 0,
      duplicates: d.duplicates ?? 0,
      audience: d.audience || null,
    });
  } catch (error) {
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

/**
 * Emits PROMOTE_SUCCESS with { queued, audience }, or PROMOTE_FAILURE with a
 * message. `audienceName` is optional — passed through as typed; the server
 * falls back to a dated default when it's blank. Queuing does not move
 * anything into the Hub itself — see this file's header.
 */
async function promoteLeads(eventEmitter, ids, audienceName) {
  try {
    const res = await importGateway.promoteLeads(ids, audienceName);
    if (!res?.success) throw new Error(res?.message || 'Could not send those leads');
    eventEmitter.emit(IMPORT_EVENTS.PROMOTE_SUCCESS, {
      queued: res.data?.queued || 0,
      audience: res.data?.audience || null,
    });
  } catch (error) {
    eventEmitter.emit(IMPORT_EVENTS.PROMOTE_FAILURE, error?.message || 'Could not send those leads');
  }
}

/**
 * Emits RETRY_SUCCESS with { reset }, or RETRY_FAILURE with a message.
 * Resets failed rows back to 'pending' so they show up ready to re-send.
 */
async function retryLeads(eventEmitter, ids) {
  try {
    const res = await importGateway.retryLeads(ids);
    if (!res?.success) throw new Error(res?.message || 'Could not reset those leads');
    eventEmitter.emit(IMPORT_EVENTS.RETRY_SUCCESS, { reset: res.data?.reset || 0 });
  } catch (error) {
    eventEmitter.emit(IMPORT_EVENTS.RETRY_FAILURE, error?.message || 'Could not reset those leads');
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

/* ── Find profiles (LinkedIn URL lookup) ────────────────────────────── */

/** Emits LOOKUP LOAD_SUCCESS with { rows, stats, pagination }, or LOAD_FAILURE. */
async function loadLookups(eventEmitter, { status, search, limit, skip } = {}) {
  try {
    const res = await importGateway.getLookups({ status, search, limit, skip });
    if (!res?.success) throw new Error(res?.message || 'Could not load profile lookups');
    eventEmitter.emit(LOOKUP_EVENTS.LOAD_SUCCESS, {
      rows: res.data?.rows || [],
      stats: res.data?.stats || null,
      pagination: res.data?.pagination || { total: 0, limit, skip: 0 },
    });
  } catch (error) {
    eventEmitter.emit(LOOKUP_EVENTS.LOAD_FAILURE, error?.message || 'Could not load profile lookups');
  }
}

/** Emits PICK_SUCCESS with { id, staged }, or PICK_FAILURE with a message. */
async function pickLookup(eventEmitter, id, profileUrls) {
  try {
    const res = await importGateway.pickLookup(id, profileUrls);
    if (!res?.success) throw new Error(res?.message || 'Could not add that person');
    eventEmitter.emit(LOOKUP_EVENTS.PICK_SUCCESS, { id, staged: res.data?.staged || 1 });
  } catch (error) {
    eventEmitter.emit(LOOKUP_EVENTS.PICK_FAILURE, error?.response?.data?.message || error?.message || 'Could not add that person');
  }
}

/** Emits DISMISS_SUCCESS with { dismissed }, or DISMISS_FAILURE. */
async function dismissLookups(eventEmitter, { ids, status } = {}) {
  try {
    const res = await importGateway.dismissLookups({ ids, status });
    if (!res?.success) throw new Error(res?.message || 'Could not skip those');
    eventEmitter.emit(LOOKUP_EVENTS.DISMISS_SUCCESS, { dismissed: res.data?.dismissed || 0 });
  } catch (error) {
    eventEmitter.emit(LOOKUP_EVENTS.DISMISS_FAILURE, error?.message || 'Could not skip those');
  }
}

/** Emits RETRY_SUCCESS with { requeued }, or RETRY_FAILURE. */
async function retryLookups(eventEmitter, ids) {
  try {
    const res = await importGateway.retryLookups(ids);
    if (!res?.success) throw new Error(res?.message || 'Could not search again');
    eventEmitter.emit(LOOKUP_EVENTS.RETRY_SUCCESS, { requeued: res.data?.requeued || 0 });
  } catch (error) {
    eventEmitter.emit(LOOKUP_EVENTS.RETRY_FAILURE, error?.message || 'Could not search again');
  }
}

const importController = {
  importProfiles,
  loadLeads,
  promoteLeads,
  retryLeads,
  deleteLeads,
  loadLookups,
  pickLookup,
  dismissLookups,
  retryLookups,
};
export default importController;
