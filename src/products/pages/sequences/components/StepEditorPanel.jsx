import { Plus, Trash2, X } from 'lucide-react';
import { IconButton, Button } from 'src/core/primitives';
import { Dropdown } from 'src/core/primitives/Dropdown';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import {
  nodeError, isBranching, availableCheckGroups, availableEvents, actionNodes, hasPostsStep, WEEKDAYS, LIMIT_ACTIONS,
  LIMIT_WINDOWS, PROFILE_FIELDS, PROFILE_MATCHES, RESULT_OPTIONS,
} from 'src/products/sequences/treeModel.js';
import { sequencesStrings } from '../strings.js';
import { ConfigFields } from './SequenceFlowBuilder.jsx';
import { tileClass } from './nodeStyle.js';

const t = sequencesStrings.tree;

/**
 * The editor for the selected step, shown beside the canvas. A canvas node is too small to hold its own form, so
 * editing happens here; the node itself only shows the title and a one-line summary.
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

export function StepEditorPanel({ step, steps, inbox, onChange, onRemove, onClose, innerCount = 0, confirmRemove = false, onCancelRemove }) {
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const branching = isBranching(step);
  const ids = new Set(steps.map((n) => n.id));
  const error = nodeError(step, { inbox, ids, postsStep: hasPostsStep(steps) });
  const setConfig = (patch) => onChange({ ...step, config: { ...step.config, ...patch } });
  return (
    <aside
      className="absolute z-20 top-3 right-3 bottom-3 w-[340px] max-w-[calc(100%-24px)] flex flex-col rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-lg)] overflow-hidden"
      aria-label="Edit step"
      data-testid="step-editor"
    >
      <div className="shrink-0 flex items-center gap-2.5 h-14 px-3.5 border-b border-[var(--ui-border-hairline)]">
        <span className={`shrink-0 grid place-items-center w-8 h-8 rounded-[var(--ui-radius-btn)] ${tileClass(step.type)}`}>
          {Icon && <Icon size={15} aria-hidden="true" />}
        </span>
        <h2 className="flex-1 min-w-0 truncate text-[length:var(--ui-t-body)] font-semibold text-[var(--ui-text-primary)]">{def?.label ?? step.type}</h2>
        <IconButton icon={<X size={14} />} label="Close editor" size="sm" onClick={onClose} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-3.5">
        {def?.description && <p className="text-[length:var(--ui-t-label)] leading-[1.5] text-[var(--ui-text-secondary)]">{def.description}</p>}
        {!branching && (
          <label className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
            Wait
            <NumberInput
              value={step.delayDays ?? 0}
              min={0}
              label="Days before this step"
              onChange={(v) => onChange({ ...step, delayDays: Math.max(0, Number.isFinite(v) ? v : 0) })}
            />
            day(s) before this step
          </label>
        )}
        {branching
          ? <BranchEditor step={step} steps={steps} inbox={inbox} onConfig={(config) => onChange({ ...step, config })} disabled={false} />
          : <ConfigFields step={step} onConfigChange={setConfig} disabled={false} />}
        {error && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-danger-fg)]" role="alert">{error}</p>}
      </div>
      <div className="shrink-0 flex flex-col gap-2 p-3.5 border-t border-[var(--ui-border-hairline)]">
        {confirmRemove && innerCount > 0 ? (
          <>
            <p className="text-[length:var(--ui-t-label)] text-[var(--ui-danger-fg)]" role="alert">
              This also removes the {innerCount} step{innerCount === 1 ? '' : 's'} inside it.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="dangerSoft" leadingIcon={<Trash2 size={13} />} onClick={onRemove}>Remove all</Button>
              <Button size="sm" variant="ghost" onClick={onCancelRemove}>Keep</Button>
            </div>
          </>
        ) : (
          <Button size="sm" variant="dangerSoft" leadingIcon={<Trash2 size={13} />} onClick={onRemove}>
            {branching && innerCount > 0 ? t.removeBranching : 'Remove step'}
          </Button>
        )}
      </div>
    </aside>
  );
}

export default StepEditorPanel;
