/**
 * Return a copy of an entity instance with `patch` applied.
 *
 * Exists because rows in this app are CLASS instances (`Profile`, ...), not
 * plain objects, and `{ ...row, notes }` would quietly demote one to a plain
 * object — dropping its prototype and every method or getter the entity
 * defines. That failure is invisible until something calls a method on the
 * patched row, which is the worst kind of bug to ship. `Object.create` on the
 * original's prototype keeps the instance an instance.
 *
 * `raw` is patched alongside because several call sites (CSV export, the
 * outreach push path) read `row.raw ?? row` and would otherwise export the
 * pre-edit value.
 *
 * Returns the SAME reference when there is nothing to do, so callers can use
 * it inside a setState updater without forcing a re-render.
 *
 * @template T
 * @param {T} entity
 * @param {Object} patch
 * @returns {T}
 */
export function patchEntity(entity, patch) {
  if (!entity || typeof entity !== 'object' || !patch) return entity;

  const updated = Object.assign(Object.create(Object.getPrototypeOf(entity)), entity, patch);
  if (updated.raw && typeof updated.raw === 'object') {
    updated.raw = { ...updated.raw, ...patch };
  }
  return updated;
}
