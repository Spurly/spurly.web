import { STEP_TYPES, TREE_STEP_TYPES, STEP_TYPE_MAP, BRANCHING_TYPES, stepError } from './stepTypes.js';

/**
 * v2 (tree) sequence model for the builder: pure functions over the same flat `steps[]` array the backend stores
 * (`id`, optional `parentId` + `branch`, document order). Mirror of the server's tree.js / conditions.js; the server is
 * still the real gate. Nothing here touches React.
 */

export const MAX_DEPTH = 4;
export const MAX_NODES = 40;
const ID_RE = /^[A-Za-z0-9_-]{1,24}$/;

export const isTreeSequence = (sequence) => sequence?.schemaVersion === 2;
export const isBranching = (node) => BRANCHING_TYPES.includes(node?.type);

/* ---------------------------- catalog ---------------------------- */

/** The checks a condition can use (all read data Spurly already has; none calls LinkedIn). Mirror of conditions.js. */
export const CHECK_GROUPS = [
  { id: 'connection', label: 'Connection', checks: [
    { value: 'is_connected', label: 'Is connected (1st degree)', params: [] },
    { value: 'invitation_pending', label: 'Invitation is pending', params: [] },
    { value: 'other_account_holds', label: 'Another account holds this lead', params: [] },
  ] },
  { id: 'profile', label: 'Profile', checks: [
    { value: 'profile_field', label: 'Profile field matches…', params: [] },
    { value: 'enrichment_done', label: 'Lead is enriched', params: [] },
    { value: 'lead_premium', label: 'Lead has Premium', params: [] },
  ] },
  { id: 'reply', label: 'Reply', needsInbox: true, checks: [
    { value: 'replied', label: 'Has replied', params: [{ key: 'withinDays', label: 'within days (optional)', min: 1, max: 365, optional: true }] },
  ] },
  { id: 'result', label: 'Result', checks: [
    { value: 'step_result', label: 'An earlier step…', params: [] },
  ] },
  { id: 'sender', label: 'Sending limits', checks: [
    { value: 'limit_reached', label: 'A sending limit is reached…', params: [] },
  ] },
  { id: 'activity', label: 'Activity', checks: [
    { value: 'lead_has_recent_posts', label: 'Lead has posted recently (needs a “Check recent posts” step first)', params: [] },
  ] },
  { id: 'time', label: 'Time', checks: [
    { value: 'weekday', label: 'Today is one of these weekdays', params: [] },
    { value: 'hour_window', label: 'It is between these hours', params: [] },
    { value: 'days_since_enrolled', label: 'Days since enrolled is more than', params: [{ key: 'gt', label: 'days', min: 0, max: 365 }] },
  ] },
];

export const PROFILE_FIELDS = [['title', 'Title'], ['headline', 'Headline'], ['company', 'Company'], ['industry', 'Industry'], ['location', 'Location']];
export const PROFILE_MATCHES = [['contains', 'contains'], ['equals', 'equals']];
export const LIMIT_ACTIONS = [['connect', 'Connection requests'], ['message', 'Messages']];
export const LIMIT_WINDOWS = [['daily', 'today'], ['weekly', 'this week']];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const RESULT_OPTIONS = [['done', 'was done'], ['skipped', 'was skipped'], ['failed', 'failed']];
export const EVENT_OPTIONS = [
  { value: 'accepted', label: 'The lead accepts the invitation', needsInbox: false },
  { value: 'replied', label: 'The lead replies', needsInbox: true },
];

/** Groups/events available to this org. An inbox-off org has no reply data, so the Reply group and reply event are left out. */
export const availableCheckGroups = ({ inbox = true } = {}) => CHECK_GROUPS.filter((g) => inbox || !g.needsInbox);
export const availableEvents = ({ inbox = true } = {}) => EVENT_OPTIONS.filter((e) => inbox || !e.needsInbox);
const INBOX_CHECKS = CHECK_GROUPS.filter((g) => g.needsInbox).flatMap((g) => g.checks.map((c) => c.value));

export const checkLabel = (check) => CHECK_GROUPS.flatMap((g) => g.checks).find((c) => c.value === check)?.label ?? check;

/* ---------------------------- ids and nodes ---------------------------- */

export function newNodeId(steps) {
  const used = new Set((steps || []).map((s) => s.id));
  let n = 1;
  while (used.has(`s${n}`)) n += 1;
  return `s${n}`;
}

/** A fresh node (with its id) for the builder. */
export function makeNode(type, steps = []) {
  const def = STEP_TYPE_MAP[type] ?? STEP_TYPES[0];
  const config = JSON.parse(JSON.stringify(def.defaultConfig ?? {}));
  return { id: newNodeId(steps), type: def.value, config, delayDays: 0 };
}

/** Give every id-less step an id (a flat list becomes a linear tree), keeping existing ids. */
export function withIds(steps) {
  const out = [];
  for (const st of steps || []) out.push(st.id ? st : { ...st, id: newNodeId([...(steps || []), ...out]) });
  return out;
}

/* ---------------------------- structure ---------------------------- */

export function listOf(steps, parentId = null, branch = null) {
  return (steps || []).filter((n) => (parentId ? n.parentId === parentId && n.branch === branch : !n.parentId));
}

/** Preorder nested form: { node, yes: [...], no: [...] } per entry. */
function nest(steps, parentId = null, branch = null) {
  return listOf(steps, parentId, branch).map((node) => ({
    node,
    yes: isBranching(node) ? nest(steps, node.id, 'yes') : [],
    no: isBranching(node) ? nest(steps, node.id, 'no') : [],
  }));
}

function flatten(entries, parentId = null, branch = null) {
  const out = [];
  for (const { node, yes, no } of entries) {
    const clean = { ...node };
    delete clean.parentId;
    delete clean.branch;
    out.push(parentId ? { ...clean, parentId, branch } : clean);
    if (isBranching(node)) out.push(...flatten(yes, node.id, 'yes'), ...flatten(no, node.id, 'no'));
  }
  return out;
}

function listInNested(entries, parentId, branch) {
  if (!parentId) return entries;
  const stack = [...entries];
  while (stack.length) {
    const e = stack.pop();
    if (e.node.id === parentId) return branch === 'yes' ? e.yes : e.no;
    stack.push(...e.yes, ...e.no);
  }
  return null;
}

export function descendantsOf(steps, id) {
  const out = [];
  const walk = (pid) => {
    for (const n of steps) if (n.parentId === pid) { out.push(n.id); walk(n.id); }
  };
  walk(id);
  return out;
}

export function depthOf(steps, id) {
  let depth = 0;
  let cur = steps.find((n) => n.id === id);
  while (cur?.parentId) { depth += 1; cur = steps.find((n) => n.id === cur.parentId); }
  return depth;
}

/** Depth of the nodes that sit directly in the list (parentId, branch): 0 at the top level. */
export const listDepth = (steps, parentId = null) => (parentId ? depthOf(steps, parentId) + 1 : 0);

/** How many levels of nesting sit below a node (0 for a node with nothing inside). */
export function heightOf(steps, id) {
  const base = depthOf(steps, id);
  return descendantsOf(steps, id).reduce((max, d) => Math.max(max, depthOf(steps, d) - base), 0);
}

/* ---------------------------- edits (all return a new array) ---------------------------- */

/**
 * Insert a new node of `type` into the list (parentId, branch) at `index` (default: the end).
 * A branching node inserted before other steps takes those steps into its Yes branch, so nothing becomes unreachable.
 */
export function addNode(steps, { parentId = null, branch = null, index }, type) {
  if (insertBlocker(steps, { parentId, branch, index }, type)) return steps;
  const nested = nest(steps);
  const list = listInNested(nested, parentId, branch);
  if (!list) return steps;
  const at = index == null ? list.length : Math.max(0, Math.min(index, list.length));
  const node = makeNode(type, steps);
  const entry = { node, yes: [], no: [] };
  if (isBranching(node)) entry.yes = list.splice(at, list.length - at);
  list.splice(at, 0, entry);
  return flatten(nested);
}

/**
 * Why a node of `type` cannot be inserted at `where`, in words, or null when it can. Same limits the server enforces
 * (40 nodes, 4 levels deep). A branching node inserted before other steps takes them into its Yes branch, which pushes
 * them one level deeper, so that has to fit too.
 */
export function insertBlocker(steps, { parentId = null, branch = null, index }, type) {
  if ((steps || []).length >= MAX_NODES) return `A sequence can have at most ${MAX_NODES} steps`;
  const depth = listDepth(steps, parentId);
  // The server counts ancestors: a step in a list deeper than MAX_DEPTH is refused whatever its type.
  if (depth > MAX_DEPTH) return `Branches can be nested at most ${MAX_DEPTH} deep`;
  if (!BRANCHING_TYPES.includes(type)) return null;
  if (depth >= MAX_DEPTH) return `Branches can be nested at most ${MAX_DEPTH} deep`;
  const list = listOf(steps, parentId, branch);
  const at = index == null ? list.length : Math.max(0, Math.min(index, list.length));
  for (const taken of list.slice(at)) {
    if (depth + 1 + heightOf(steps, taken.id) > MAX_DEPTH) return `Branches can be nested at most ${MAX_DEPTH} deep`;
  }
  return null;
}

/** Where a moved node really lands: `index` counts the target list as it is now, including the node itself when it moves within one list. */
function landingIndex(steps, node, { parentId = null, branch = null, index }) {
  const sameList = (node.parentId || null) === (parentId || null) && (node.branch || null) === (branch || null);
  const target = listOf(steps.filter((n) => n.id !== node.id), parentId, branch);
  const from = sameList ? listOf(steps, parentId, branch).findIndex((n) => n.id === node.id) : -1;
  const raw = index == null ? target.length : index;
  const adjusted = sameList && raw > from ? raw - 1 : raw;
  return { at: Math.max(0, Math.min(adjusted, target.length)), target, sameList, from };
}

/**
 * Why `id` cannot be dropped at `where`, in words, or null when it can. A node carries everything inside it, so a move
 * must not land inside its own subtree, must keep every branching node last in its list, and must fit within the depth limit.
 */
export function moveBlocker(steps, id, where) {
  const node = (steps || []).find((n) => n.id === id);
  if (!node) return 'That step no longer exists';
  const { parentId = null, branch = null } = where;
  if (parentId) {
    const parent = steps.find((n) => n.id === parentId);
    if (!parent || !isBranching(parent)) return 'Steps can only sit inside a condition, wait or split';
    if (branch !== 'yes' && branch !== 'no') return 'Pick the Yes or No side';
    if (parentId === id || descendantsOf(steps, id).includes(parentId)) return 'A step cannot move inside itself';
  }
  const { at, target, sameList, from } = landingIndex(steps, node, where);
  if (sameList && at === from) return 'It is already there';
  const after = [...target.slice(0, at), node, ...target.slice(at)];
  if (after.some((n, k) => isBranching(n) && k < after.length - 1)) return 'Nothing can follow a condition, wait or split';
  if (listDepth(steps, parentId) + heightOf(steps, id) > MAX_DEPTH) return `Branches can be nested at most ${MAX_DEPTH} deep`;
  return null;
}

export const canMoveTo = (steps, id, where) => moveBlocker(steps, id, where) === null;

/** Move a node (with everything inside it) to any valid list and position, including another branch. Returns the same array when the move is not allowed. */
export function moveNodeTo(steps, id, where) {
  if (moveBlocker(steps, id, where)) return steps;
  const node = steps.find((n) => n.id === id);
  const { at } = landingIndex(steps, node, where);
  const nested = nest(steps);
  const source = listInNested(nested, node.parentId || null, node.branch || null);
  const [entry] = source.splice(source.findIndex((e) => e.node.id === id), 1);
  listInNested(nested, where.parentId || null, where.branch || null).splice(at, 0, entry);
  return flatten(nested);
}

export function removeNode(steps, id) {
  const drop = new Set([id, ...descendantsOf(steps, id)]);
  return steps.filter((n) => !drop.has(n.id));
}

export function updateNode(steps, id, next) {
  return steps.map((n) => (n.id === id ? { ...next, id: n.id, ...(n.parentId ? { parentId: n.parentId, branch: n.branch } : {}) } : n));
}

/** A step can move up or down inside its own list, unless that would put a branching node before another step. */
export function canMove(steps, id, dir) {
  const node = steps.find((n) => n.id === id);
  if (!node) return false;
  const siblings = listOf(steps, node.parentId || null, node.branch || null);
  const i = siblings.findIndex((n) => n.id === id);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return false;
  const next = siblings.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return !next.some((n, k) => isBranching(n) && k < next.length - 1);
}

export function moveNode(steps, id, dir) {
  if (!canMove(steps, id, dir)) return steps;
  const node = steps.find((n) => n.id === id);
  const nested = nest(steps);
  const list = listInNested(nested, node.parentId || null, node.branch || null);
  const i = list.findIndex((e) => e.node.id === id);
  [list[i], list[i + dir]] = [list[i + dir], list[i]];
  return flatten(nested);
}

/* ---------------------------- validation (mirror of the server) ---------------------------- */

export const hasPostsStep = (steps) => (steps || []).some((n) => n.type === 'check_recent_posts');

function conditionError(config, { inbox, ids, postsStep = true }) {
  const c = config || {};
  const checks = Array.isArray(c.checks) ? c.checks : [];
  if (checks.length < 1) return 'Pick at least one check';
  if (checks.length > 3) return 'A condition can combine at most 3 checks';
  for (const item of checks) {
    if (!item?.check) return 'Pick a check';
    if (!inbox && INBOX_CHECKS.includes(item.check)) return 'Reply checks are not available: replies are tracked in your partner’s app';
    const p = item.params || {};
    switch (item.check) {
      case 'replied':
        if (p.withinDays != null && p.withinDays !== '' && !(Number.isInteger(Number(p.withinDays)) && Number(p.withinDays) >= 1 && Number(p.withinDays) <= 365)) return 'Reply window must be 1 to 365 days';
        break;
      case 'step_result':
        if (!p.stepId) return 'Pick which step to look at';
        if (!ids.has(p.stepId)) return 'That step no longer exists';
        if (!['done', 'skipped', 'failed'].includes(p.result)) return 'Pick a result';
        break;
      case 'profile_field':
        if (!PROFILE_FIELDS.some(([v]) => v === p.field)) return 'Pick a profile field';
        if (!PROFILE_MATCHES.some(([v]) => v === p.match)) return 'Pick contains or equals';
        if (typeof p.value !== 'string' || !p.value.trim()) return 'Type the text to match';
        break;
      case 'lead_has_recent_posts':
        if (!postsStep) return 'Add a “Check recent posts” step before this condition';
        break;
      case 'limit_reached':
        if (!LIMIT_ACTIONS.some(([v]) => v === p.action)) return 'Pick connection requests or messages';
        if (!LIMIT_WINDOWS.some(([v]) => v === p.window)) return 'Pick today or this week';
        break;
      case 'weekday':
        if (!Array.isArray(p.days) || p.days.length === 0) return 'Pick at least one weekday';
        break;
      case 'hour_window':
        if (!(Number.isInteger(p.from) && Number.isInteger(p.to) && p.from >= 0 && p.to <= 24 && p.from < p.to)) return 'Pick a start hour before the end hour';
        break;
      case 'days_since_enrolled':
        if (!(Number.isInteger(p.gt) && p.gt >= 0 && p.gt <= 365)) return 'Enter 0 to 365 days';
        break;
      default:
        break;
    }
  }
  return null;
}

export function nodeError(step, { inbox = true, ids = new Set(), postsStep = true } = {}) {
  const config = step?.config || {};
  switch (step?.type) {
    case 'condition': return conditionError(config, { inbox, ids, postsStep });
    case 'wait_for':
      if (!['accepted', 'replied'].includes(config.event)) return 'Pick an event';
      if (config.event === 'replied' && !inbox) return 'Reply waits are not available: replies are tracked in your partner’s app';
      if (!(Number.isInteger(config.maxDays) && config.maxDays >= 1 && config.maxDays <= 90)) return 'Wait 1 to 90 days at most';
      return null;
    case 'split':
      if (!(Number.isInteger(config.ratio ?? 50) && (config.ratio ?? 50) >= 1 && (config.ratio ?? 50) <= 99)) return 'The split must be 1 to 99 percent';
      return null;
    case 'check_recent_posts':
      if (!(Number.isInteger(config.withinDays ?? 30) && (config.withinDays ?? 30) >= 1 && (config.withinDays ?? 30) <= 365)) return 'Enter 1 to 365 days';
      return null;
    default:
      return stepError(step);
  }
}

/** First problem with a whole v2 tree, in words, or null. Same rules as the server's validateTree + per-node checks. */
export function treeError(steps, { inbox = true } = {}) {
  if (!Array.isArray(steps) || steps.length === 0) return 'A sequence needs at least one step';
  if (steps.length > MAX_NODES) return `A sequence can have at most ${MAX_NODES} steps`;
  const byId = new Map();
  for (const n of steps) {
    if (!n.id || !ID_RE.test(n.id)) return 'Every step needs an id';
    if (byId.has(n.id)) return `Duplicate step id: ${n.id}`;
    byId.set(n.id, n);
  }
  for (const n of steps) {
    if (!n.parentId) continue;
    const parent = byId.get(n.parentId);
    if (!parent) return 'A step points at a parent that does not exist';
    if (!isBranching(parent)) return 'Steps can only sit inside a condition, wait or split';
    if (n.branch !== 'yes' && n.branch !== 'no') return 'A step is missing its Yes or No side';
    if (depthOf(steps, n.id) > MAX_DEPTH) return `Branches can be nested at most ${MAX_DEPTH} deep`;
  }
  const lists = new Map();
  for (const n of steps) {
    const key = n.parentId ? `${n.parentId}/${n.branch}` : '';
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key).push(n);
  }
  for (const list of lists.values()) {
    for (let i = 0; i < list.length - 1; i += 1) {
      if (isBranching(list[i])) return 'Nothing can follow a condition, wait or split: put the next steps inside its Yes or No side';
    }
  }
  const ids = new Set(steps.map((n) => n.id));
  const order = steps;
  for (let i = 0; i < order.length; i += 1) {
    const err = nodeError(order[i], { inbox, ids, postsStep: hasPostsStep(steps) });
    if (err) return `Step ${i + 1}: ${err}`;
  }
  return null;
}

/**
 * What to call the two sides of a branching node on the canvas. The data only knows 'yes' and 'no'; these are display
 * names over them. `tone` picks the pill colour: yes/no are green/red, a/b (an A/B split) are neutral.
 */
const CHECK_SIDES = {
  is_connected: ['Connected', 'Not connected'],
  invitation_pending: ['Pending', 'Not pending'],
  other_account_holds: ['Held elsewhere', 'Not held'],
  enrichment_done: ['Enriched', 'Not enriched'],
  lead_premium: ['Premium', 'Not premium'],
  replied: ['Replied', 'No reply'],
  lead_has_recent_posts: ['Posted lately', 'No recent post'],
  limit_reached: ['Limit reached', 'Under limit'],
};

export function branchLabels(node) {
  const config = node?.config || {};
  let yes = 'Yes';
  let no = 'No';
  let tones = ['yes', 'no'];
  if (node?.type === 'wait_for') {
    [yes, no] = config.event === 'replied' ? ['Replied', 'No reply'] : ['Accepted', 'Not accepted'];
  } else if (node?.type === 'split') {
    const ratio = Number.isInteger(config.ratio) ? config.ratio : 50;
    yes = `A · ${ratio}%`;
    no = `B · ${100 - ratio}%`;
    tones = ['a', 'b'];
  } else if (node?.type === 'condition' && (config.checks || []).length === 1 && CHECK_SIDES[config.checks[0]?.check]) {
    [yes, no] = CHECK_SIDES[config.checks[0].check];
  }
  return { yes: { text: yes, tone: tones[0] }, no: { text: no, tone: tones[1] } };
}

/** Action steps a "step result" condition can look at (everything that is not itself branching). */
export const actionNodes = (steps) => (steps || []).filter((n) => !isBranching(n));

/** Does the tree branch on replies? (Then the reply auto-stop is off by default, server side.) */
export const usesReply = (steps) => (steps || []).some((n) => (n.type === 'wait_for' && n.config?.event === 'replied')
  || (n.type === 'condition' && (n.config?.checks || []).some((c) => c.check === 'replied')));

/* ---------------------------- summaries ---------------------------- */

export function conditionSummary(config) {
  const checks = config?.checks || [];
  if (!checks.length) return 'No check yet';
  const word = config?.op === 'any' ? ' or ' : ' and ';
  return checks.map((c) => {
    const p = c.params || {};
    switch (c.check) {
      case 'replied': return p.withinDays ? `replied within ${p.withinDays}d` : 'has replied';
      case 'step_result': return p.stepId ? `step ${p.stepId} ${p.result || '…'}` : 'an earlier step…';
      case 'profile_field': return p.field ? `${p.field} ${p.match || 'contains'} “${p.value || '…'}”` : 'a profile field…';
      case 'lead_has_recent_posts': return 'has posted recently';
      case 'limit_reached': return p.action ? `${p.action === 'message' ? 'message' : 'connection'} limit reached ${p.window === 'weekly' ? 'this week' : 'today'}` : 'a sending limit…';
      case 'weekday': return (p.days || []).length ? (p.days || []).map((d) => WEEKDAYS[d]).join('/') : 'weekday…';
      case 'hour_window': return Number.isInteger(p.from) ? `${p.from}:00–${p.to}:00` : 'hours…';
      case 'days_since_enrolled': return `enrolled more than ${p.gt ?? '…'}d ago`;
      default: return checkLabel(c.check).toLowerCase();
    }
  }).join(word);
}

export function nodeSummary(step) {
  const config = step?.config || {};
  switch (step?.type) {
    case 'condition': return `If ${conditionSummary(config)}`;
    case 'wait_for':
      return `${config.event === 'replied' ? 'Waits for a reply' : 'Waits for acceptance'}, up to ${config.maxDays ?? 3} day(s). Event → Yes, deadline → No`;
    case 'check_recent_posts': return `Looks at their latest post (within ${config.withinDays ?? 30} days) and remembers the answer`;
    case 'split': return `${config.ratio ?? 50}% Yes / ${100 - (config.ratio ?? 50)}% No`;
    default: return '';
  }
}

export { TREE_STEP_TYPES };

/** Exit rules (D58). Reply is only meaningful where Spurly reads the inbox. */
export const EXIT_RULES = [
  { key: 'onReply', label: 'Stop when the lead replies', needsInbox: true, hint: 'Hands the conversation to you. Off by default if the sequence branches on replies.' },
  { key: 'onAccepted', label: 'Stop when the lead accepts the invitation', needsInbox: false },
  { key: 'onOtherAccount', label: 'Stop if another account of the organization takes the lead', needsInbox: false, orgOnly: true, hideWhenManaged: true },
];
/**
 * `inbox: false` marks a partner-managed org: its replies live in the partner's app, not here. Such an account must
 * not be offered the "another account took the lead" rule (D58), so `hideWhenManaged` rules are dropped alongside the
 * reply-only ones. A regular org (inbox on) still sees every org rule.
 */
export const availableExitRules = ({ inbox = true, isOrg = false } = {}) =>
  EXIT_RULES.filter((r) => (inbox || !r.needsInbox) && (isOrg || !r.orgOnly) && (inbox || !r.hideWhenManaged));
/** How many stop rules are switched on (the max-days limit counts as one). */
export function activeExitCount(exit, opts) {
  const on = availableExitRules(opts).filter((r) => exit?.[r.key] === true).length;
  return on + (Number.isInteger(exit?.maxDays) && exit.maxDays >= 1 ? 1 : 0);
}
/** Drop empty values so an untouched panel sends nothing. */
export function cleanExit(exit) {
  const out = {};
  for (const r of EXIT_RULES) if (typeof exit?.[r.key] === 'boolean') out[r.key] = exit[r.key];
  if (Number.isInteger(exit?.maxDays) && exit.maxDays >= 1) out.maxDays = exit.maxDays;
  return Object.keys(out).length ? out : undefined;
}
export const exitError = (exit) => (exit?.maxDays != null && !(Number.isInteger(exit.maxDays) && exit.maxDays >= 1 && exit.maxDays <= 365) ? 'Maximum days must be 1 to 365' : null);
