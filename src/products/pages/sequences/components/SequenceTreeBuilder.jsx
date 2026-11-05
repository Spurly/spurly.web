import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Trash2, MoreVertical, Plus, X } from 'lucide-react';
import { IconButton, Button } from 'src/core/primitives';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { STEP_TYPES, TREE_STEP_TYPES, TREE_ACTION_TYPES, STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import {
  addNode, removeNode, updateNode, moveNode, canMove, listOf, isBranching, depthOf, nodeError, nodeSummary,
  availableCheckGroups, availableEvents, actionNodes, WEEKDAYS, hasPostsStep, LIMIT_ACTIONS, LIMIT_WINDOWS, PROFILE_FIELDS, PROFILE_MATCHES, RESULT_OPTIONS, MAX_DEPTH, MAX_NODES,
} from 'src/products/sequences/treeModel.js';
import { sequencesStrings } from '../strings.js';
import { NodeCard, Gap, FloatingMenuList, MenuItem, computeMenuPosition, useMenuDismiss } from './SequenceFlowBuilder.jsx';

const t = sequencesStrings.tree;

/**
 * The v2 (tree) builder: the same vertical node cards as the linear builder, plus condition / wait-for-event / split
 * cards that fork into a Yes column and a No column, each with its own "+". Nothing can follow a branching card in its
 * own list (no joins): the next steps live inside Yes or No. State is the flat `steps[]` array the server stores;
 * every edit goes through treeModel.js (tested). Existing v1 sequences keep using SequenceFlowBuilder.
 */

const inputCls = 'text-[length:var(--ui-t-micro)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-1.5 py-1 text-[var(--ui-text-primary)] disabled:opacity-60';

function NumberInput({ value, onChange, min, max, label, disabled, width = 'w-14' }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value ?? ''}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      className={`${width} h-6 text-center ${inputCls}`}
    />
  );
}

function CheckParams({ check, params, onParams, steps, selfId, disabled }) {
  const p = params || {};
  switch (check) {
    case 'replied':
      return (
        <label className="flex items-center gap-1.5 text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
          within <NumberInput value={p.withinDays} min={1} max={365} label="Reply window in days" disabled={disabled} onChange={(v) => onParams(v == null ? {} : { withinDays: v })} /> days (blank = ever)
        </label>
      );
    case 'step_result': {
      const options = actionNodes(steps).filter((n) => n.id !== selfId).map((n) => [n.id, `${STEP_TYPE_MAP[n.type]?.label ?? n.type} (${n.id})`]);
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-52">
            <Dropdown id={`sr-step-${selfId}`} ariaLabel="Step to look at" variant="dashboard" size="sm" placeholder="Pick a step" value={p.stepId || ''} disabled={disabled} options={options} onChange={(v) => onParams({ ...p, stepId: v })} />
          </span>
          <span className="w-32">
            <Dropdown id={`sr-res-${selfId}`} ariaLabel="Result" variant="dashboard" size="sm" placeholder="Result" value={p.result || ''} disabled={disabled} options={RESULT_OPTIONS} onChange={(v) => onParams({ ...p, result: v })} />
          </span>
        </div>
      );
    }
    case 'profile_field':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-32"><Dropdown id={`pf-f-${selfId}`} ariaLabel="Profile field" variant="dashboard" size="sm" placeholder="Field" value={p.field || ''} disabled={disabled} options={PROFILE_FIELDS} onChange={(v) => onParams({ ...p, field: v })} /></span>
          <span className="w-28"><Dropdown id={`pf-m-${selfId}`} ariaLabel="Match" variant="dashboard" size="sm" placeholder="Match" value={p.match || ''} disabled={disabled} options={PROFILE_MATCHES} onChange={(v) => onParams({ ...p, match: v })} /></span>
          <input value={p.value || ''} maxLength={100} disabled={disabled} aria-label="Text to match" placeholder="Text to match" onChange={(e) => onParams({ ...p, value: e.target.value })} className={`flex-1 min-w-[8rem] h-7 ${inputCls}`} />
        </div>
      );
    case 'limit_reached':
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-44"><Dropdown id={`lr-a-${selfId}`} ariaLabel="Limit type" variant="dashboard" size="sm" placeholder="Limit" value={p.action || ''} disabled={disabled} options={LIMIT_ACTIONS} onChange={(v) => onParams({ ...p, action: v })} /></span>
          <span className="w-32"><Dropdown id={`lr-w-${selfId}`} ariaLabel="Window" variant="dashboard" size="sm" placeholder="When" value={p.window || ''} disabled={disabled} options={LIMIT_WINDOWS} onChange={(v) => onParams({ ...p, window: v })} /></span>
        </div>
      );
    case 'weekday':
      return (
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Weekdays">
          {WEEKDAYS.map((label, day) => {
            const on = (p.days || []).includes(day);
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                onClick={() => onParams({ days: on ? (p.days || []).filter((d) => d !== day) : [...(p.days || []), day].sort() })}
                className={`h-6 px-2 rounded-[var(--ui-radius-pill)] border text-[length:var(--ui-t-micro)] ${on ? 'bg-[var(--ui-accent-tint)] border-[var(--ui-accent-border)] text-[var(--ui-accent-fg)]' : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)]'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      );
    case 'hour_window':
      return (
        <label className="flex items-center gap-1.5 text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
          from <NumberInput value={p.from} min={0} max={23} label="From hour" disabled={disabled} onChange={(v) => onParams({ ...p, from: v })} />
          to <NumberInput value={p.to} min={1} max={24} label="To hour" disabled={disabled} onChange={(v) => onParams({ ...p, to: v })} /> o’clock (your timezone)
        </label>
      );
    case 'days_since_enrolled':
      return (
        <label className="flex items-center gap-1.5 text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
          more than <NumberInput value={p.gt} min={0} max={365} label="Days" disabled={disabled} onChange={(v) => onParams({ gt: v })} /> days
        </label>
      );
    default:
      return null;
  }
}

function ConditionEditor({ step, steps, inbox, onChange, disabled }) {
  const config = step.config || {};
  const checks = config.checks || [];
  const groups = availableCheckGroups({ inbox });
  const options = groups.flatMap((g) => g.checks.map((c) => [c.value, `${g.label} · ${c.label}`]));
  const setChecks = (next) => onChange({ ...config, checks: next });
  return (
    <div className="flex flex-col gap-2">
      {!inbox && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{t.repliesElsewhere}</p>}
      {checks.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border-hairline)] p-2">
          <div className="flex items-center gap-2">
            {i > 0 && (
              <span className="w-20 shrink-0">
                <Dropdown id={`op-${step.id}`} ariaLabel="Combine checks with" variant="dashboard" size="sm" value={config.op || 'all'} disabled={disabled} options={[['all', 'AND'], ['any', 'OR']]} onChange={(v) => onChange({ ...config, op: v })} />
              </span>
            )}
            <span className="flex-1 min-w-0">
              <Dropdown id={`chk-${step.id}-${i}`} ariaLabel="Check" variant="dashboard" size="sm" placeholder="Pick a check" value={item.check || ''} disabled={disabled} options={options} onChange={(v) => setChecks(checks.map((c, k) => (k === i ? { check: v, params: {} } : c)))} />
            </span>
            {checks.length > 1 && !disabled && (
              <IconButton icon={<X size={12} />} label="Remove check" size="sm" onClick={() => setChecks(checks.filter((_, k) => k !== i))} />
            )}
          </div>
          <CheckParams check={item.check} params={item.params} steps={steps} selfId={step.id} disabled={disabled} onParams={(params) => setChecks(checks.map((c, k) => (k === i ? { ...c, params } : c)))} />
        </div>
      ))}
      {checks.length < 3 && !disabled && (
        <div>
          <Button size="sm" variant="ghost" leadingIcon={<Plus size={12} />} onClick={() => setChecks([...checks, { check: 'is_connected', params: {} }])}>{t.addCheck}</Button>
        </div>
      )}
    </div>
  );
}

function BranchEditor({ step, steps, inbox, onConfig, disabled }) {
  const config = step.config || {};
  if (step.type === 'condition') return <ConditionEditor step={step} steps={steps} inbox={inbox} onChange={onConfig} disabled={disabled} />;
  if (step.type === 'wait_for') {
    const events = availableEvents({ inbox }).map((e) => [e.value, e.label]);
    return (
      <div className="flex flex-col gap-2">
        {!inbox && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{t.repliesElsewhere}</p>}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-64">
            <Dropdown id={`ev-${step.id}`} ariaLabel="Event" variant="dashboard" size="sm" value={config.event || 'accepted'} disabled={disabled} options={events} onChange={(v) => onConfig({ ...config, event: v })} />
          </span>
          <label className="flex items-center gap-1.5 text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
            up to <NumberInput value={config.maxDays} min={1} max={90} label="Maximum days" disabled={disabled} onChange={(v) => onConfig({ ...config, maxDays: v })} /> days
          </label>
        </div>
        <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{t.waitForHint}</p>
      </div>
    );
  }
  return (
    <label className="flex items-center gap-1.5 text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
      <NumberInput value={config.ratio ?? 50} min={1} max={99} label="Percent that go Yes" disabled={disabled} onChange={(v) => onConfig({ ...config, ratio: v })} /> % go Yes, the rest go No
    </label>
  );
}

function BranchCard({ step, steps, inbox, readOnly, expanded, onToggle, onChange, onRemove, onMove, selected, onSelect, canUp, canDown }) {
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const ids = new Set(steps.map((n) => n.id));
  const error = !readOnly && nodeError(step, { inbox, ids, postsStep: hasPostsStep(steps) });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const reposition = () => setMenuPos(computeMenuPosition(btnRef.current?.getBoundingClientRect(), 168, 'end'));
  const toggleMenu = () => setMenuOpen((cur) => { if (cur) return false; reposition(); return true; });
  const close = () => setMenuOpen(false);
  useMenuDismiss(menuOpen, btnRef, listRef, reposition, close);

  return (
    <div className={`relative w-full max-w-[560px] rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-card)] ${error ? 'border-[var(--ui-danger)]' : selected ? 'border-[var(--ui-accent-border)]' : 'border-[var(--ui-border)]'} shadow-[var(--ui-shadow-sm)]`}>
      <div
        className="flex items-start gap-3 px-3.5 py-3.5 cursor-pointer"
        onClick={() => { if (!readOnly) onToggle(); onSelect?.(step.id); }}
      >
        <span className="shrink-0 grid place-items-center w-8 h-8 rounded-[var(--ui-radius-btn)] bg-[var(--ui-warning-tint)] text-[var(--ui-warning-fg)]">
          {Icon && <Icon size={15} aria-hidden="true" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] font-medium text-[var(--ui-accent-fg)]">{t.branches}</p>
          <p className="mt-0.5 text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)] truncate">{def?.label ?? step.type}</p>
          <p className={`mt-0.5 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.45] ${readOnly ? 'line-clamp-2' : 'truncate'}`}>{nodeSummary(step)}</p>
        </div>
        {error && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--ui-danger)]" aria-hidden="true" title={error} />}
        {!readOnly && (
          <div onClick={(e) => e.stopPropagation()}>
            <span ref={btnRef} className="inline-flex">
              <IconButton icon={<MoreVertical size={13} />} label="Step actions" size="sm" onClick={toggleMenu} aria-expanded={menuOpen} aria-haspopup="menu" />
            </span>
            <FloatingMenuList open={menuOpen} pos={menuPos} menuRef={listRef} widthPx={168}>
              {canUp && <MenuItem icon={ChevronUp} onSelect={() => { onMove(step.id, -1); close(); }}>Move up</MenuItem>}
              {canDown && <MenuItem icon={ChevronDown} onSelect={() => { onMove(step.id, 1); close(); }}>Move down</MenuItem>}
              <MenuItem icon={Trash2} tone="danger" onSelect={() => { onRemove(step.id); close(); }}>{t.removeBranching}</MenuItem>
            </FloatingMenuList>
          </div>
        )}
      </div>
      {expanded && !readOnly && (
        <div className="px-3.5 pb-3.5 pt-3 border-t border-[var(--ui-border-hairline)] flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
          <BranchEditor step={step} steps={steps} inbox={inbox} onConfig={(config) => onChange(step.id, { ...step, config })} disabled={false} />
          {error && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-danger-fg)]">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function SequenceTreeBuilder({ steps, onChange, readOnly = false, inbox = true, selectedId = null, onSelect }) {
  const [expandedId, setExpandedId] = useState(null);

  const addTypes = (depth) => [...STEP_TYPES, ...TREE_ACTION_TYPES, ...(depth < MAX_DEPTH ? TREE_STEP_TYPES : [])];
  const add = (where, type) => {
    if (steps.length >= MAX_NODES) return;
    const next = addNode(steps, where, type);
    onChange(next);
    const created = next.find((n) => !steps.some((o) => o.id === n.id));
    if (created) setExpandedId(created.id);
  };
  const remove = (id) => { onChange(removeNode(steps, id)); setExpandedId((cur) => (cur === id ? null : cur)); };
  const change = (id, next) => onChange(updateNode(steps, id, next));
  const move = (id, dir) => onChange(moveNode(steps, id, dir));

  const renderList = (parentId = null, branch = null) => {
    const nodes = listOf(steps, parentId, branch);
    const depth = parentId ? depthOf(steps, parentId) + 1 : 0;
    const where = (index) => ({ parentId, branch, index });
    return (
      <div className="flex flex-col items-center w-full">
        <Gap nextStep={nodes[0] ?? null} readOnly={readOnly} types={addTypes(depth)} onAddType={(type) => add(where(0), type)} />
        {nodes.length === 0 && parentId && (
          <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)] pb-2">{t.emptyBranch}</p>
        )}
        {nodes.map((node, i) => {
          return (
            <div key={node.id} className="flex flex-col items-center w-full">
              {isBranching(node) ? (
                <>
                  <BranchCard
                    step={node}
                    steps={steps}
                    inbox={inbox}
                    readOnly={readOnly}
                    expanded={expandedId === node.id}
                    onToggle={() => setExpandedId((cur) => (cur === node.id ? null : node.id))}
                    onChange={change}
                    onRemove={remove}
                    onMove={move}
                    selected={selectedId === node.id}
                    onSelect={onSelect}
                    canUp={canMove(steps, node.id, -1)}
                    canDown={canMove(steps, node.id, 1)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-3">
                    {['yes', 'no'].map((side) => (
                      <div key={side} className="rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-sunken)] px-2 pb-2 pt-2 flex flex-col items-center min-w-0" data-branch={side}>
                        <span className={`inline-flex items-center h-5 px-2 rounded-[var(--ui-radius-pill)] text-[length:var(--ui-t-micro)] font-medium ${side === 'yes' ? 'bg-[var(--ui-success-tint)] text-[var(--ui-success-fg)]' : 'bg-[var(--ui-surface-card)] text-[var(--ui-text-secondary)] border border-[var(--ui-border)]'}`}>
                          {side === 'yes' ? t.yes : t.no}
                        </span>
                        {renderList(node.id, side)}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <NodeCard
                    step={node}
                    index={node.id}
                    stepLabel={t.stepLabel(node, steps)}
                    draggable={false}
                    isFirst={!canMove(steps, node.id, -1)}
                    isLast={!canMove(steps, node.id, 1)}
                    readOnly={readOnly}
                    expanded={expandedId === node.id}
                    onToggleExpand={() => setExpandedId((cur) => (cur === node.id ? null : node.id))}
                    selected={selectedId === node.id}
                    onSelect={onSelect}
                    onChange={change}
                    onRemove={remove}
                    onMove={move}
                    isDragSource={false}
                    onDragStartHandle={() => {}}
                    onDragEndHandle={() => {}}
                  />
                  <Gap nextStep={nodes[i + 1] ?? null} readOnly={readOnly} types={addTypes(depth)} onAddType={(type) => add(where(i + 1), type)} />
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center py-2 px-6 min-h-full overflow-x-auto" data-testid="sequence-tree">
      {steps.length === 0 && <p className="mb-1 text-[length:var(--ui-t-label)] text-[var(--ui-text-tertiary)]">No steps yet.</p>}
      {renderList()}
    </div>
  );
}

export default SequenceTreeBuilder;
