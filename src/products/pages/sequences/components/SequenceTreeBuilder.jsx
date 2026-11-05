import { useState, useRef, useMemo, useCallback } from 'react';
import { addNode, removeNode, updateNode, moveNodeTo, descendantsOf, nodeError, hasPostsStep } from 'src/products/sequences/treeModel.js';
import { SequenceCanvas } from './SequenceCanvas.jsx';
import { StepEditorPanel } from './StepEditorPanel.jsx';

/**
 * The v2 (tree) builder: a pannable, zoomable flow canvas with a side editor.
 *
 * State is still the flat `steps[]` array the server stores. Every edit goes through treeModel.js (tested), which
 * refuses anything that would break the tree rules, so the canvas cannot produce a sequence the server rejects.
 * Existing v1 sequences keep using SequenceFlowBuilder.
 *
 * Selection is controlled when the page passes `onSelect` (the detail page shows its own inspector), otherwise internal.
 */

const HISTORY_LIMIT = 50;
const COALESCE_MS = 1200;
export const EDITOR_INSET = 340 + 24;

export function SequenceTreeBuilder({ steps, onChange, readOnly = false, inbox = true, selectedId = null, onSelect, branchCounts = null, className = 'h-full min-h-[520px]' }) {
  const [innerSelected, setInnerSelected] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const controlled = onSelect !== undefined;
  const rawSelected = controlled ? selectedId : innerSelected;
  const selected = rawSelected && steps.some((n) => n.id === rawSelected) ? rawSelected : null;
  const select = useCallback((id) => {
    setConfirmId(null);
    if (controlled) onSelect(id); else setInnerSelected(id);
  }, [controlled, onSelect]);

  /* ---- undo / redo: whole-array snapshots; typing into one field coalesces into a single step ---- */
  const hist = useRef({ past: [], future: [], key: null, at: 0 });
  const [flags, setFlags] = useState({ undo: false, redo: false });
  const sync = () => setFlags({ undo: hist.current.past.length > 0, redo: hist.current.future.length > 0 });

  const commit = (next, coalesceKey = null) => {
    if (next === steps) return;
    const h = hist.current;
    const now = Date.now();
    const merge = coalesceKey && h.key === coalesceKey && now - h.at < COALESCE_MS;
    if (!merge) h.past = [...h.past, steps].slice(-HISTORY_LIMIT);
    h.future = [];
    h.key = coalesceKey;
    h.at = now;
    sync();
    onChange(next);
  };
  const travel = (from, to) => {
    const h = hist.current;
    if (!h[from].length) return;
    const target = h[from][h[from].length - 1];
    h[from] = h[from].slice(0, -1);
    h[to] = [...h[to], steps];
    h.key = null;
    sync();
    onChange(target);
  };
  const history = { undo: () => travel('past', 'future'), redo: () => travel('future', 'past'), canUndo: flags.undo, canRedo: flags.redo };

  /* ---- edits ---- */
  const add = (slot, type) => {
    const next = addNode(steps, slot, type);
    if (next === steps) return;
    const created = next.find((n) => !steps.some((o) => o.id === n.id));
    commit(next);
    if (created) select(created.id);
  };
  const move = (id, slot) => {
    const next = moveNodeTo(steps, id, slot);
    if (next === steps) return;
    commit(next);
    select(id);
  };
  const innerCount = (id) => descendantsOf(steps, id).length;
  const doRemove = (id) => {
    const gone = new Set([id, ...descendantsOf(steps, id)]);
    commit(removeNode(steps, id));
    if (selected && gone.has(selected)) select(null);
    setConfirmId(null);
  };
  // Removing a step with others inside it asks first (in the editor panel); removing a single step does not, and undo covers a slip.
  const requestRemove = (id) => {
    if (innerCount(id) === 0) { doRemove(id); return; }
    if (controlled) onSelect(id); else setInnerSelected(id);
    setConfirmId(id);
  };
  const change = (next) => commit(updateNode(steps, next.id, next), `edit:${next.id}`);

  const errors = useMemo(() => {
    const ids = new Set(steps.map((n) => n.id));
    const postsStep = hasPostsStep(steps);
    return Object.fromEntries(steps.map((n) => [n.id, nodeError(n, { inbox, ids, postsStep })]).filter(([, e]) => e));
  }, [steps, inbox]);

  const step = !readOnly && selected ? steps.find((n) => n.id === selected) : null;

  return (
    <div className={`relative w-full flex flex-col ${className}`}>
      <SequenceCanvas
        steps={steps}
        readOnly={readOnly}
        selectedId={selected}
        onSelect={select}
        onAdd={add}
        onMove={move}
        onRemove={requestRemove}
        errors={errors}
        branchCounts={branchCounts}
        rightInset={step ? EDITOR_INSET : 0}
        history={readOnly ? null : history}
      />
      {step && (
        <StepEditorPanel
          key={step.id}
          step={step}
          steps={steps}
          inbox={inbox}
          onChange={change}
          onClose={() => select(null)}
          innerCount={innerCount(step.id)}
          confirmRemove={confirmId === step.id}
          onRemove={() => (innerCount(step.id) > 0 && confirmId !== step.id ? setConfirmId(step.id) : doRemove(step.id))}
          onCancelRemove={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

export default SequenceTreeBuilder;
