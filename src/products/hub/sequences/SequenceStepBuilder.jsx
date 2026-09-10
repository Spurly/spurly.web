import { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { Field, Checkbox, IconButton, Button } from 'src/ui/primitives';
import { STEP_TYPES, STEP_TYPE_MAP, WAIT_MODES, makeStep, stepError } from './stepTypes.js';

/**
 * The step-list builder — a linear reorderable list, not a branching canvas
 * (per UNIPILE_MODULE_PLAN_V2.md §4 and the model.js comment on the backend).
 *
 * Reordering is native HTML5 drag on the whole row (same "the row IS the
 * handle" call the DataTable column-reorder feature made — see
 * datatable_column_reorder.md), plus explicit ↑/↓ buttons as the
 * keyboard/accessible fallback, since a linear list of a handful of steps
 * doesn't need that feature's Alt+Arrow scheme.
 */

function ConfigFields({ step, onConfigChange, disabled }) {
  const { type, config } = step;

  if (type === 'profile_visit') {
    return (
      <Checkbox
        label="Notify the lead you visited (recommended — this step exists to be seen)"
        checked={config.notify !== false}
        onChange={(e) => onConfigChange({ notify: e.target.checked })}
        disabled={disabled}
      />
    );
  }

  if (type === 'connect') {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={config.note || ''}
          maxLength={300}
          rows={2}
          disabled={disabled}
          onChange={(e) => onConfigChange({ note: e.target.value })}
          placeholder="Optional note to send with the invitation…"
          aria-label="Connection note"
          className="w-full text-[13px] rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--text-primary)] disabled:opacity-60"
        />
        <span className="text-[11px] text-[var(--text-tertiary)]">{(config.note || '').length}/300</span>
      </div>
    );
  }

  if (type === 'like_post') {
    return <p className="text-[12px] text-[var(--text-tertiary)]">Reacts to the lead's most recent post. No configuration needed.</p>;
  }

  if (type === 'comment_post' || type === 'message') {
    const label = type === 'message' ? 'Message' : 'Comment';
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={config.text || ''}
          maxLength={type === 'comment_post' ? 1250 : undefined}
          rows={3}
          disabled={disabled}
          onChange={(e) => onConfigChange({ text: e.target.value })}
          placeholder={type === 'message' ? 'Hey {{firstName}}, …' : `Write the ${label.toLowerCase()}…`}
          aria-label={label}
          className="w-full text-[13px] rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--text-primary)] disabled:opacity-60"
        />
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {type === 'message' ? 'Use {{firstName}} to personalize.' : `${(config.text || '').length}/1250`}
        </span>
      </div>
    );
  }

  if (type === 'wait') {
    const mode = config.mode || 'fixed';
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={mode}
          disabled={disabled}
          onChange={(e) => onConfigChange({ mode: e.target.value })}
          aria-label="Wait mode"
          className="text-[12px] rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)] px-2 py-1 text-[var(--text-primary)]"
        >
          {WAIT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {mode === 'fixed' ? (
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            Wait
            <input
              type="number"
              min={1}
              value={config.days ?? 2}
              disabled={disabled}
              onChange={(e) => onConfigChange({ days: Number(e.target.value) })}
              className="w-14 h-7 text-[12px] text-center rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)]"
            />
            days, then continue
          </label>
        ) : (
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            Stop if not accepted within
            <input
              type="number"
              min={1}
              value={config.maxDays ?? 7}
              disabled={disabled}
              onChange={(e) => onConfigChange({ maxDays: Number(e.target.value) })}
              className="w-14 h-7 text-[12px] text-center rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)]"
            />
            days
          </label>
        )}
      </div>
    );
  }

  if (type === 'endorse_skill') {
    return (
      <Field
        label={null}
        placeholder={'Skill name, exactly as it appears on their profile (e.g. "React")'}
        value={config.skillName || ''}
        onChange={(e) => onConfigChange({ skillName: e.target.value })}
        disabled={disabled}
      />
    );
  }

  return null;
}

function StepRow({
  step, index, isFirst, isLast, readOnly, onChange, onRemove, onMove,
  dragging, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const error = stepError(step);

  const setDelayDays = (v) => onChange(index, { ...step, delayDays: Math.max(0, Number(v) || 0) });
  const setConfig = (patch) => onChange(index, { ...step, config: { ...step.config, ...patch } });

  return (
    <div
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : onDragStart}
      onDragOver={readOnly ? undefined : onDragOver}
      onDrop={readOnly ? undefined : onDrop}
      onDragEnd={readOnly ? undefined : onDragEnd}
      className={`flex gap-3 px-[var(--ui-pad-lg)] py-3 border-b border-[var(--separator)] last:border-b-0 ${dragging ? 'opacity-40' : ''}`}
    >
      {!readOnly && (
        <span className="mt-1.5 shrink-0 text-[var(--text-tertiary)] cursor-grab" aria-hidden="true">
          <GripVertical size={14} />
        </span>
      )}
      <span className="mt-1 shrink-0 grid place-items-center w-5 h-5 rounded-full bg-[var(--ui-surface-sunken)] text-[11px] text-[var(--text-secondary)] tabular-nums">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-primary)]">
            {Icon && <Icon size={14} className="text-[var(--text-tertiary)]" aria-hidden="true" />}
            {def?.label ?? step.type}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                Wait
                <input
                  type="number"
                  min={0}
                  value={step.delayDays ?? 0}
                  onChange={(e) => setDelayDays(e.target.value)}
                  aria-label="Days before this step"
                  className="w-12 h-6 text-[11px] text-center rounded-[var(--ui-radius-sm)] border border-[var(--border-default)] bg-[var(--ui-surface-card)]"
                />
                day(s) before this step
              </label>
              <IconButton icon={<ChevronUp size={13} />} label="Move up" size="sm" disabled={isFirst} onClick={() => onMove(index, -1)} />
              <IconButton icon={<ChevronDown size={13} />} label="Move down" size="sm" disabled={isLast} onClick={() => onMove(index, 1)} />
              <IconButton icon={<Trash2 size={13} />} label="Remove step" size="sm" onClick={() => onRemove(index)} />
            </div>
          )}
          {readOnly && (step.delayDays ?? 0) > 0 && (
            <span className="text-[11px] text-[var(--text-tertiary)]">{step.delayDays} day(s) wait before this step</span>
          )}
        </div>
        {readOnly ? (
          <ReadOnlySummary step={step} />
        ) : (
          <ConfigFields step={step} onConfigChange={setConfig} disabled={readOnly} />
        )}
        {!readOnly && error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
      </div>
    </div>
  );
}

function ReadOnlySummary({ step }) {
  const { type, config } = step;
  if (type === 'connect' && config.note) return <p className="text-[12px] text-[var(--text-secondary)]">“{config.note}”</p>;
  if (type === 'comment_post' || type === 'message') return <p className="text-[12px] text-[var(--text-secondary)]">“{config.text}”</p>;
  if (type === 'wait') {
    return (
      <p className="text-[12px] text-[var(--text-secondary)]">
        {config.mode === 'until-accepted'
          ? `Stops if not accepted within ${config.maxDays} day(s)`
          : `Waits ${config.days} day(s), then continues`}
      </p>
    );
  }
  if (type === 'endorse_skill') return <p className="text-[12px] text-[var(--text-secondary)]">Skill: {config.skillName}</p>;
  if (type === 'profile_visit') return <p className="text-[12px] text-[var(--text-tertiary)]">{config.notify === false ? 'Silent visit' : 'Visits and notifies'}</p>;
  return null;
}

export function SequenceStepBuilder({ steps, onChange, readOnly = false }) {
  const [dragIndex, setDragIndex] = useState(null);

  const setStep = (index, next) => {
    const copy = steps.slice();
    copy[index] = next;
    onChange(copy);
  };

  const removeStep = (index) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const copy = steps.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  const addStep = (type) => {
    onChange([...steps, makeStep(type)]);
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); return; }
    const copy = steps.slice();
    const [moved] = copy.splice(dragIndex, 1);
    copy.splice(index, 0, moved);
    onChange(copy);
    setDragIndex(null);
  };

  return (
    <div>
      {steps.length === 0 ? (
        <p className="px-[var(--ui-pad-lg)] py-6 text-[13px] text-[var(--text-tertiary)]">No steps yet.</p>
      ) : (
        steps.map((step, index) => (
          <StepRow
            key={index}
            step={step}
            index={index}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
            readOnly={readOnly}
            onChange={setStep}
            onRemove={removeStep}
            onMove={moveStep}
            dragging={dragIndex === index}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => setDragIndex(null)}
          />
        ))
      )}
      {!readOnly && (
        <div className="px-[var(--ui-pad-lg)] py-3 flex items-center gap-2 flex-wrap">
          {STEP_TYPES.map((t) => (
            <Button key={t.value} size="sm" variant="ghost" leadingIcon={<Plus size={12} />} onClick={() => addStep(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SequenceStepBuilder;
