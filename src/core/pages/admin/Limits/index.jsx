import { useState, useEffect, useCallback, useMemo } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import adminController from 'src/core/admin/controller/admin.js';
import { ADMIN_EVENTS } from 'src/core/admin/constants/constants.js';
import { Loader, AlertCircle, Trash2 } from 'lucide-react';
import { AdminLayout } from 'src/core/pages/admin/components/AdminLayout';
import { Button, IconButton, useToast } from 'src/core/primitives';
import { getToastError, getApiErrorMessage } from 'src/shared/utils/apiError';

const FIELDS = ['hour', 'day', 'week'];
const SEC = 1000;
const INPUT =
  'px-2 py-1.5 border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-card)] text-[var(--ui-text-primary)] focus:outline-none';

const fmtGap = (ms) => {
  if (!ms) return '0s';
  if (ms >= 3600 * SEC) return `${ms / (3600 * SEC)}h`;
  if (ms >= 60 * SEC) return `${ms / (60 * SEC)}m`;
  return `${ms / SEC}s`;
};

const globalFor = (overrides, action) => overrides.find((o) => o.scope === 'global' && o.action === action);

function draftsFrom(data) {
  const next = {};
  data.registry.forEach((r) => {
    const o = globalFor(data.overrides, r.action);
    next[r.action] = {
      hour: String(o?.hour ?? r.hour),
      day: String(o?.day ?? r.day),
      week: String(o?.week ?? r.week),
      minGapSec: String((o?.minGapMs ?? r.minGapMs) / SEC),
    };
  });
  return next;
}

/**
 * Sending limits admin. One registry sets every limit for every plan; this
 * page edits the global values and per-user overrides. The backend clamps any
 * value above the registry's hard max, so the max is shown next to each row.
 * No async/await or try/catch here: calls go through adminController, which
 * reports back over the event emitter.
 */
export function AdminLimitsPage() {
  const toast = useToast();
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const [data, setData] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingAction, setSavingAction] = useState(null);
  const [userForm, setUserForm] = useState({ userId: '', action: 'connect', hour: '', day: '', week: '', note: '' });
  const [userSaving, setUserSaving] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [switching, setSwitching] = useState(false);

  const fetchLimits = useCallback(() => {
    adminController.getLimits(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    function onLoaded(next) {
      setData(next);
      setDrafts(draftsFrom(next));
      setLoading(false);
      setError('');
    }
    function onLoadFailed(err) {
      setError(getApiErrorMessage(err, 'Failed to load limits'));
      toast.error(getToastError(err, "Couldn't load limits"));
      setLoading(false);
    }
    function onSaved() {
      setSavingAction(null);
      setUserSaving(false);
      toast.success('Limits saved');
      fetchLimits();
    }
    function onSaveFailed(err) {
      setSavingAction(null);
      setUserSaving(false);
      toast.error(getToastError(err, "Couldn't save the limit"));
    }
    function onCleared() {
      toast.success('Override removed');
      fetchLimits();
    }
    function onClearFailed(err) {
      toast.error(getToastError(err, "Couldn't remove the override"));
    }

    eventEmitter.on(ADMIN_EVENTS.GET_LIMITS_SUCCESS, onLoaded);
    eventEmitter.on(ADMIN_EVENTS.GET_LIMITS_FAILURE, onLoadFailed);
    eventEmitter.on(ADMIN_EVENTS.SET_LIMIT_OVERRIDE_SUCCESS, onSaved);
    eventEmitter.on(ADMIN_EVENTS.SET_LIMIT_OVERRIDE_FAILURE, onSaveFailed);
    function onSwitched(res) {
      setSwitching(false);
      setConfirmOff(false);
      toast.success(res?.enforcement?.enforced === false ? 'Caps are off for every user' : 'Caps are on');
      fetchLimits();
    }
    function onSwitchFailed(err) {
      setSwitching(false);
      toast.error(getToastError(err, "Couldn't change the limits switch"));
    }

    eventEmitter.on(ADMIN_EVENTS.SET_LIMIT_ENFORCEMENT_SUCCESS, onSwitched);
    eventEmitter.on(ADMIN_EVENTS.SET_LIMIT_ENFORCEMENT_FAILURE, onSwitchFailed);
    eventEmitter.on(ADMIN_EVENTS.CLEAR_LIMIT_OVERRIDE_SUCCESS, onCleared);
    eventEmitter.on(ADMIN_EVENTS.CLEAR_LIMIT_OVERRIDE_FAILURE, onClearFailed);
    fetchLimits();
    return () => {
      eventEmitter.off(ADMIN_EVENTS.GET_LIMITS_SUCCESS, onLoaded);
      eventEmitter.off(ADMIN_EVENTS.GET_LIMITS_FAILURE, onLoadFailed);
      eventEmitter.off(ADMIN_EVENTS.SET_LIMIT_OVERRIDE_SUCCESS, onSaved);
      eventEmitter.off(ADMIN_EVENTS.SET_LIMIT_OVERRIDE_FAILURE, onSaveFailed);
      eventEmitter.off(ADMIN_EVENTS.SET_LIMIT_ENFORCEMENT_SUCCESS, onSwitched);
      eventEmitter.off(ADMIN_EVENTS.SET_LIMIT_ENFORCEMENT_FAILURE, onSwitchFailed);
      eventEmitter.off(ADMIN_EVENTS.CLEAR_LIMIT_OVERRIDE_SUCCESS, onCleared);
      eventEmitter.off(ADMIN_EVENTS.CLEAR_LIMIT_OVERRIDE_FAILURE, onClearFailed);
    };
  }, [eventEmitter, toast, fetchLimits]);

  const edit = (action, field, value) => setDrafts((prev) => ({ ...prev, [action]: { ...prev[action], [field]: value } }));

  const isDirty = (r) => {
    const d = drafts[r.action];
    const o = globalFor(data.overrides, r.action);
    return (
      !!d &&
      (d.hour !== String(o?.hour ?? r.hour) ||
        d.day !== String(o?.day ?? r.day) ||
        d.week !== String(o?.week ?? r.week) ||
        d.minGapSec !== String((o?.minGapMs ?? r.minGapMs) / SEC))
    );
  };

  const saveGlobal = (r) => {
    const d = drafts[r.action];
    const body = { scope: 'global', action: r.action };
    for (const f of FIELDS) {
      const v = Number(d[f]);
      if (!Number.isInteger(v) || v < 0) {
        setError(`${r.label}: ${f} must be a whole number of 0 or more`);
        return;
      }
      body[f] = v;
    }
    const gap = Number(d.minGapSec);
    if (!Number.isFinite(gap) || gap < 0) {
      setError(`${r.label}: gap must be 0 or more seconds`);
      return;
    }
    body.minGapMs = Math.round(gap * SEC);
    setError('');
    setSavingAction(r.action);
    adminController.setLimitOverride(eventEmitter, body);
  };

  const saveUser = () => {
    const body = { scope: 'user', userId: userForm.userId.trim(), action: userForm.action };
    if (userForm.note.trim()) body.note = userForm.note.trim();
    if (!body.userId) {
      setError('Enter the user id for a per-user override');
      return;
    }
    for (const f of FIELDS) {
      if (userForm[f] !== '') {
        const v = Number(userForm[f]);
        if (!Number.isInteger(v) || v < 0) {
          setError(`${f} must be a whole number of 0 or more`);
          return;
        }
        body[f] = v;
      }
    }
    setError('');
    setUserSaving(true);
    adminController.setLimitOverride(eventEmitter, body);
    setUserForm((f) => ({ ...f, userId: '', hour: '', day: '', week: '', note: '' }));
  };

  const enforced = data?.enforcement?.enforced !== false;
  const changeEnforcement = (next) => {
    setSwitching(true);
    adminController.setLimitEnforcement(eventEmitter, next);
  };

  const userOverrides = data ? data.overrides.filter((o) => o.scope === 'user') : [];

  return (
    <AdminLayout title="Sending limits" subtitle="One registry for every plan" layout="page">
      <div className="p-[var(--ui-pad-lg)] max-w-5xl flex flex-col gap-6">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader className="animate-spin text-[var(--ui-accent)]" size={28} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-danger-border,var(--ui-border))] text-[var(--ui-danger-fg)]">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            <div
              className={`p-4 rounded-[var(--ui-radius-md)] border flex flex-wrap items-center justify-between gap-3 ${
                enforced
                  ? 'border-[var(--ui-border-hairline)] bg-[var(--ui-surface-card)]'
                  : 'border-[var(--ui-warning-fg)] bg-[var(--ui-surface-card)]'
              }`}
            >
              <div className="max-w-2xl">
                <div className="font-medium text-[var(--ui-text-primary)]">
                  {enforced ? 'Caps are on' : 'Caps are OFF for every user'}
                </div>
                <p className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                  {enforced
                    ? 'Turning caps off removes the connect and message backstop for every user. Sends are still spaced randomly, with quiet hours as each user set them. Usage is still recorded so you can analyse it. LinkedIn can restrict accounts that send this much.'
                    : 'Nothing is being capped right now; sends are still spaced. Usage is still recorded. Turn caps back on once the new numbers are set.'}
                </p>
              </div>
              {enforced && !confirmOff && (
                <Button variant="secondary" onClick={() => setConfirmOff(true)}>
                  Turn all caps off
                </Button>
              )}
              {enforced && confirmOff && (
                <div className="flex items-center gap-2">
                  <Button variant="primary" loading={switching} onClick={() => changeEnforcement(false)}>
                    Yes, turn off for everyone
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmOff(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              {!enforced && (
                <Button variant="primary" loading={switching} onClick={() => changeEnforcement(true)}>
                  Turn limits back on
                </Button>
              )}
            </div>

            <p className="text-[var(--ui-text-secondary)] text-[length:var(--ui-t-body)]">
              Only connection requests and messages are capped, as a silent backstop near LinkedIn's own limit. Every
              other action is paced only: random gaps and quiet hours, no cap. Edit a row to change it for all users.
              Values above the hard max are clamped. Changes apply within about a minute.
            </p>

            <div className="overflow-x-auto border border-[var(--ui-border-hairline)] rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-card)]">
              <table className="w-full min-w-[720px] text-[length:var(--ui-t-label)]">
                <thead>
                  <tr className="text-left text-[var(--ui-text-tertiary)]">
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Hour</th>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">Week</th>
                    <th className="px-4 py-3 font-medium">Min gap (s)</th>
                    <th className="px-4 py-3 font-medium">Default / max</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.registry.map((r) => {
                    const o = globalFor(data.overrides, r.action);
                    const d = drafts[r.action] || {};
                    return (
                      <tr key={r.action} className="border-t border-[var(--ui-border-hairline)]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--ui-text-primary)]">{r.label}</div>
                          <code className="text-[var(--ui-text-quaternary)]">{r.action}</code>
                          {o && <span className="ml-2 text-[var(--ui-warning-fg)]">overridden</span>}
                        </td>
                        {r.capped ? (
                          FIELDS.map((f) => (
                            <td key={f} className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                aria-label={`${r.label} ${f}`}
                                value={d[f] ?? ''}
                                onChange={(e) => edit(r.action, f, e.target.value)}
                                className={`w-20 ${INPUT}`}
                              />
                            </td>
                          ))
                        ) : (
                          <td colSpan={FIELDS.length} className="px-4 py-3 text-[var(--ui-text-tertiary)]">
                            Paced only, no cap
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            aria-label={`${r.label} minimum gap in seconds`}
                            value={d.minGapSec ?? ''}
                            onChange={(e) => edit(r.action, 'minGapSec', e.target.value)}
                            className={`w-20 ${INPUT}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-[var(--ui-text-tertiary)]">
                          {r.capped ? (
                            <>
                              {r.hour}/{r.day}/{r.week}, {fmtGap(r.minGapMs)}
                              <br />
                              max {r.max.hour}/{r.max.day}/{r.max.week}
                            </>
                          ) : (
                            <>gap {fmtGap(r.minGapMs)}</>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={savingAction === r.action}
                              disabled={!isDirty(r)}
                              onClick={() => saveGlobal(r)}
                            >
                              Save
                            </Button>
                            {o && (
                              <IconButton
                                label="Reset to default"
                                onClick={() => adminController.clearLimitOverride(eventEmitter, o._id)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h2 className="text-[length:var(--ui-t-title)] font-semibold text-[var(--ui-text-primary)]">Per-user overrides</h2>
            <div className="p-4 border border-[var(--ui-border-hairline)] rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-card)] flex flex-wrap items-end gap-3">
              <label className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                User id
                <input
                  value={userForm.userId}
                  onChange={(e) => setUserForm({ ...userForm, userId: e.target.value })}
                  className={`block w-56 mt-1 ${INPUT}`}
                />
              </label>
              <label className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                Action
                <select
                  value={userForm.action}
                  onChange={(e) => setUserForm({ ...userForm, action: e.target.value })}
                  className={`block mt-1 ${INPUT}`}
                >
                  {data.registry.map((r) => (
                    <option key={r.action} value={r.action}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {FIELDS.map((f) => (
                <label key={f} className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] capitalize">
                  {f}
                  <input
                    type="number"
                    min="0"
                    value={userForm[f]}
                    onChange={(e) => setUserForm({ ...userForm, [f]: e.target.value })}
                    className={`block w-20 mt-1 ${INPUT}`}
                  />
                </label>
              ))}
              <label className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
                Note
                <input
                  value={userForm.note}
                  onChange={(e) => setUserForm({ ...userForm, note: e.target.value })}
                  className={`block w-48 mt-1 ${INPUT}`}
                />
              </label>
              <Button variant="primary" loading={userSaving} onClick={saveUser}>
                Add override
              </Button>
              <p className="basis-full text-[length:var(--ui-t-label)] text-[var(--ui-text-quaternary)]">
                Leave a field blank to keep the registry value for it.
              </p>
            </div>

            {userOverrides.length > 0 && (
              <div className="overflow-x-auto border border-[var(--ui-border-hairline)] rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-card)]">
                <table className="w-full min-w-[560px] text-[length:var(--ui-t-label)]">
                  <thead>
                    <tr className="text-left text-[var(--ui-text-tertiary)]">
                      <th className="px-4 py-2 font-medium">User</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                      <th className="px-4 py-2 font-medium">Hour / day / week</th>
                      <th className="px-4 py-2 font-medium">Note</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {userOverrides.map((o) => (
                      <tr key={o._id} className="border-t border-[var(--ui-border-hairline)]">
                        <td className="px-4 py-2 font-mono">{o.userId}</td>
                        <td className="px-4 py-2">{o.action}</td>
                        <td className="px-4 py-2">
                          {o.hour ?? '–'} / {o.day ?? '–'} / {o.week ?? '–'}
                        </td>
                        <td className="px-4 py-2 text-[var(--ui-text-tertiary)]">{o.note || ''}</td>
                        <td className="px-4 py-2">
                          <IconButton label="Remove override" onClick={() => adminController.clearLimitOverride(eventEmitter, o._id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminLimitsPage;
