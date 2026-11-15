/**
 * Pure helpers for the Journey view: what to show on a step, which lead bubbles survive the sender filter, what needs
 * attention. No React, no network. The server sends the numbers (flow-state); this only slices and words them.
 */

/** The pseudo-step that holds leads enrolled but not yet at their first step (same id the server uses). */
export const START_NODE = '__start';

const STATUS_ORDER = { failed: 0, waiting: 1, active: 2 };

/** The accounts a sequence sends from, for the filter chips: the pool's senders when there are several, else whoever shows on a bubble. */
export function senderChoices(flow) {
  const out = new Map();
  for (const s of flow?.senders ?? []) out.set(String(s.accountId), { id: String(s.accountId), name: s.name || '', state: s.state || '' });
  for (const node of Object.values(flow?.nodes ?? {})) {
    for (const lead of node.leads ?? []) {
      const id = lead.sender?.orgAccountId;
      if (id && !out.has(id)) out.set(id, { id, name: lead.sender.name || '', state: '' });
    }
    for (const id of Object.keys(node.bySender ?? {})) if (!out.has(id)) out.set(id, { id, name: '', state: '' });
  }
  return [...out.values()];
}

/** Counts at a step: everyone, or only the leads one account works. `passed` is not split by account (the server counts history once). */
export function nodeSummary(node, senderId = null) {
  if (!node) return { active: 0, waiting: 0, failed: 0, here: 0, passed: { done: 0, skipped: 0 } };
  const src = senderId ? (node.bySender?.[senderId] ?? {}) : node.here;
  const active = src.active ?? 0;
  const waiting = src.waiting ?? 0;
  const failed = src.failed ?? 0;
  return { active, waiting, failed, here: active + waiting + failed, passed: node.passed ?? { done: 0, skipped: 0 } };
}

/** The bubbles to draw at a step: the sender filter applied, trouble first, then waiting, then moving. */
export function bubblesFor(node, senderId = null) {
  const leads = (node?.leads ?? []).filter((l) => !senderId || l.sender?.orgAccountId === senderId);
  return [...leads].sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));
}

/** Leads at this step that are not drawn (the server caps bubbles per step, and a filter hides some more). */
export function hiddenAt(node, senderId = null) {
  return Math.max(nodeSummary(node, senderId).here - bubblesFor(node, senderId).length, 0);
}

/** Attention items for the banner. With a sender selected only that account's paced items stay; failures and pauses are sequence-wide. */
export function attentionFor(flow, senderId = null) {
  return (flow?.attention ?? []).filter((a) => a.kind !== 'paced' || !senderId || a.sender?.orgAccountId === senderId);
}

/** Is anyone still moving through the tree? The view polls while this is true, even when the sequence is paused (positions stay live). */
export function hasMovers(flow) {
  return Object.values(flow?.nodes ?? {}).some((n) => (n.here?.active ?? 0) + (n.here?.waiting ?? 0) > 0);
}

export const initialsOf = (name = '') => {
  const words = String(name).replace(/\./g, '').trim().split(/\s+/).filter(Boolean);
  return words.length ? (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() : '?';
};

/** "in 5 min", "2 h ago", "tomorrow, 9:30 am": when the next action is due, in words. */
export function dueText(date, now = new Date()) {
  if (!date) return '';
  const t = new Date(date);
  if (Number.isNaN(t.getTime())) return '';
  const mins = Math.round((t.getTime() - now.getTime()) / 60000);
  const abs = Math.abs(mins);
  const span = abs < 1 ? 'a moment' : abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.floor(abs / 60)} h${abs % 60 ? ` ${abs % 60} min` : ''}` : `${Math.round(abs / 1440)} d`;
  return mins >= 0 ? `in ${span}` : `${span} ago`;
}

/** One line for a bubble's tooltip and the drawer header. */
export function statusWord(lead) {
  if (lead.waitReason === 'awaiting-acceptance') return 'held until accepted';
  return lead.status === 'active' ? 'moving' : lead.status;
}

/** The branches of the split steps ("a", "b"), for the branch filter. Empty when the sequence has no A/B split. */
export function splitBranches(steps) {
  const splits = new Set((steps ?? []).filter((s) => s.type === 'split').map((s) => s.id));
  return [...new Set((steps ?? []).filter((s) => s.parentId && splits.has(s.parentId) && s.branch).map((s) => s.branch))].sort((x, y) => (x === 'yes' ? -1 : y === 'yes' ? 1 : x.localeCompare(y)));
}

/** A split's two sides are stored as yes/no; people know them as A and B. */
export const splitLetter = (branch) => ({ yes: 'A', no: 'B' }[branch] || String(branch).slice(0, 1).toUpperCase());

/** The ids of the steps that sit inside `branch` of any split (the child and everything below it). */
export function stepsOnBranch(steps, branch) {
  const list = steps ?? [];
  const byId = new Map(list.map((s) => [s.id, s]));
  const splits = new Set(list.filter((s) => s.type === 'split').map((s) => s.id));
  const inside = new Set();
  for (const s of list) {
    let cur = s;
    while (cur) {
      if (cur.parentId && splits.has(cur.parentId) && cur.branch === branch) { inside.add(s.id); break; }
      cur = cur.parentId ? byId.get(cur.parentId) : null;
    }
  }
  return inside;
}

/** Whether a bubble matches the status filter ('' = everyone). "stuck" is a lead that is held back for a reason. */
export function matchesStatus(lead, status) {
  if (!status) return true;
  return lead.status === status;
}

/** Per-step lines for the overview: who entered, who passed, who is still here or failed. In tree order, with the branch named. */
export function stepRows(steps, flow) {
  const rows = [];
  const splitIds = new Set((steps ?? []).filter((x) => x.type === 'split').map((x) => x.id));
  for (const s of steps ?? []) {
    const letter = s.branch ? (splitIds.has(s.parentId) ? splitLetter(s.branch) : s.branch === 'yes' ? 'Y' : s.branch === 'no' ? 'N' : s.branch.slice(0, 1).toUpperCase()) : '';
    const n = flow?.nodes?.[s.id];
    if (!n) { rows.push({ id: s.id, type: s.type, branch: letter, entered: 0, passed: 0, skipped: 0, here: 0, failed: 0 }); continue; }
    const here = (n.here?.active ?? 0) + (n.here?.waiting ?? 0) + (n.here?.failed ?? 0);
    const passed = n.passed?.done ?? 0;
    const skipped = n.passed?.skipped ?? 0;
    rows.push({ id: s.id, type: s.type, branch: letter, entered: passed + skipped + here, passed, skipped, here, failed: n.here?.failed ?? 0 });
  }
  return rows;
}

const PACED = { 'daily-cap': 'the daily limit was reached', 'weekly-cap': 'the weekly limit was reached', 'hourly-cap': 'the hourly limit was reached', 'too-soon': 'waiting out the gap between actions', 'quiet-hours': 'outside working hours' };

/** Why a lead is not moving, in words, from the stored `waitReason` (same wording as the Journey drawer). */
export function waitReasonWords(reason) {
  if (!reason) return '';
  if (reason === 'wait:fixed') return 'Waiting for the set delay to pass';
  if (reason === 'wait:acceptance') return 'Waiting for the invitation to be accepted';
  if (reason === 'wait:reply') return 'Waiting for a reply';
  if (reason === 'awaiting-acceptance') return 'Message held until the invitation is accepted';
  if (reason === 'backoff') return 'Retrying shortly after a temporary error';
  if (reason.startsWith('paced:')) { const why = reason.slice(6); return `Paced: ${PACED[why] || why.replace(/-/g, ' ')}`; }
  return reason;
}

/**
 * Flow warnings: a message that follows a connection request with nothing between that waits for the invitation.
 * The engine now holds such a message until the invitation is accepted (up to 7 days), so this is advice, not an error:
 * an explicit wait makes the pause visible on the journey. Each hit says where to insert the wait (before the message).
 */
export function messageAfterConnectLints(steps) {
  const list = steps ?? [];
  const lists = new Map();
  for (const s of list) {
    const key = `${s.parentId || ''}|${s.branch || ''}`;
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key).push(s);
  }
  const out = [];
  for (const items of lists.values()) {
    let sinceConnect = false;
    items.forEach((s, index) => {
      if (s.type === 'connect') sinceConnect = true;
      else if (['wait', 'wait_for', 'condition', 'split'].includes(s.type)) sinceConnect = false;
      else if (s.type === 'message' && sinceConnect) {
        out.push({ stepId: s.id, parentId: s.parentId || null, branch: s.branch || null, index });
        sinceConnect = false;
      }
    });
  }
  return out;
}
