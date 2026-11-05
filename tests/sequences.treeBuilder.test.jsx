import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hubEnrollmentColumns, historyLabel } from 'src/products/pages/sequences/components/columns.jsx';

/**
 * P3.7: the tree builder. A step added through "+" lands in the right list, a condition forks into Yes / No columns with
 * their own "+", the Reply group of the condition picker is hidden in an inbox-off org, and validation errors show on
 * the card. (The state functions themselves are tested in sequences.treeModel.test.js.)
 */

const { SequenceTreeBuilder } = await import('src/products/pages/sequences/components/SequenceTreeBuilder.jsx');

function Harness({ initial, inbox = true, onChangeSpy }) {
  const [steps, setSteps] = useState(initial);
  return <SequenceTreeBuilder steps={steps} onChange={(next) => { onChangeSpy?.(next); setSteps(next); }} inbox={inbox} />;
}

const cond = { id: 's1', type: 'condition', config: { op: 'all', checks: [{ check: 'is_connected', params: {} }] }, delayDays: 0 };
const msg = { id: 's2', type: 'message', config: { text: 'hi' }, delayDays: 0, parentId: 's1', branch: 'yes' };
const follow = { id: 's3', type: 'follow', config: {}, delayDays: 0, parentId: 's1', branch: 'no' };

describe('SequenceTreeBuilder', () => {
  it('renders a Yes column and a No column, each holding its own steps', () => {
    render(<Harness initial={[cond, msg, follow]} />);
    const yes = document.querySelector('[data-branch="yes"]');
    const no = document.querySelector('[data-branch="no"]');
    expect(within(yes).getByText('Send a message')).toBeInTheDocument();
    expect(within(no).getByText('Follow')).toBeInTheDocument();
    expect(within(yes).queryByText('Follow')).toBeNull();
    expect(within(yes).getByText('Step 2 · Yes')).toBeInTheDocument();
  });

  it('adding a step from a branch’s “+” puts it in that branch only', async () => {
    const spy = vi.fn();
    render(<Harness initial={[cond]} onChangeSpy={spy} />);
    const noCol = document.querySelector('[data-branch="no"]');
    await userEvent.click(within(noCol).getByRole('button', { name: 'Add a step here' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Follow' }));
    const next = spy.mock.calls.at(-1)[0];
    expect(next.at(-1)).toMatchObject({ type: 'follow', parentId: 's1', branch: 'no' });
    expect(within(document.querySelector('[data-branch="no"]')).getByText('Follow')).toBeInTheDocument();
  });

  it('the top-level “+” offers Condition, Wait for event and A/B split; adding one creates both columns', async () => {
    render(<Harness initial={[{ id: 's1', type: 'follow', config: {}, delayDays: 0 }]} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Add a step here' }).at(-1));
    expect(await screen.findByRole('menuitem', { name: 'Condition' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Wait for event' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'A/B split' }));
    expect(document.querySelectorAll('[data-branch]')).toHaveLength(2);
  });

  it('nothing can be added after a branching card (no joins): only its columns have a “+”', () => {
    render(<Harness initial={[cond]} />);
    // gap above the condition + one in each column = 3, none below the card
    expect(screen.getAllByRole('button', { name: 'Add a step here' })).toHaveLength(3);
  });

  async function openCheckPicker(inbox) {
    render(<Harness initial={[cond]} inbox={inbox} />);
    await userEvent.click(screen.getByText('Condition'));
    await userEvent.click(await screen.findByRole('button', { name: 'Check' }));
  }

  it('condition picker lists the Reply group when the inbox is on', async () => {
    await openCheckPicker(true);
    expect(await screen.findByText('Reply · Has replied')).toBeInTheDocument();
    expect(screen.getAllByText('Connection · Is connected (1st degree)').length).toBeGreaterThan(0);
    expect(screen.getByText('Time · Today is one of these weekdays')).toBeInTheDocument();
  });

  it('condition picker hides the Reply group in an inbox-off org and says why', async () => {
    await openCheckPicker(false);
    expect((await screen.findAllByText('Connection · Is connected (1st degree)')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Reply · Has replied')).toBeNull();
    expect(screen.getByText(/Reply checks are hidden/)).toBeInTheDocument();
  });

  it('wait-for-event only offers “accepts” without the inbox', async () => {
    render(<Harness initial={[{ id: 's1', type: 'wait_for', config: { event: 'accepted', maxDays: 3 }, delayDays: 0 }]} inbox={false} />);
    await userEvent.click(screen.getByText('Wait for event'));
    await userEvent.click(await screen.findByRole('button', { name: 'Event' }));
    expect(await screen.findAllByText('The lead accepts the invitation')).not.toHaveLength(0);
    expect(screen.queryByText('The lead replies')).toBeNull();
  });

  it('a bad config shows its error on the expanded card', async () => {
    render(<Harness initial={[{ id: 's1', type: 'wait_for', config: { event: 'accepted', maxDays: 0 }, delayDays: 0 }]} />);
    await userEvent.click(screen.getByText('Wait for event'));
    expect(await screen.findByText('Wait 1 to 90 days at most')).toBeInTheDocument();
  });

  it('removing a condition removes everything inside it', async () => {
    const spy = vi.fn();
    render(<Harness initial={[cond, msg, follow]} onChangeSpy={spy} />);
    const actions = screen.getAllByRole('button', { name: 'Step actions' });
    await userEvent.click(actions[0]);
    await userEvent.click(await screen.findByRole('menuitem', { name: /Remove \(and everything inside\)/ }));
    expect(spy.mock.calls.at(-1)[0]).toEqual([]);
  });
});

describe('enrollment columns for a v2 sequence', () => {
  const steps = [
    { id: 'c', type: 'connect', config: {} },
    { id: 'w', type: 'wait_for', config: { event: 'accepted', maxDays: 3 } },
    { id: 'm', type: 'message', config: { text: 'x' }, parentId: 'w', branch: 'yes' },
  ];
  it('the step column reads currentStepId and names the side; history labels carry the branch', () => {
    const cols = hubEnrollmentColumns(steps, { tree: true });
    const stepCol = cols.find((c) => c.key === 'currentStepIndex');
    const { container } = render(<div>{stepCol.render(0, { status: 'active', currentStepId: 'm' })}</div>);
    expect(container.textContent).toBe('3/3 — Send a message · Yes');
    expect(historyLabel({ type: 'wait_for', outcome: 'done', branch: 'yes' })).toBe('Wait for event → Yes');
    expect(historyLabel({ type: 'message', outcome: 'done', branch: 'yes' })).toBe('Send a message — done (Yes side)');
    const last = cols.find((c) => c.key === 'lastEvent');
    expect(last.title({ history: [{ type: 'connect', outcome: 'done' }, { type: 'wait_for', outcome: 'done', branch: 'no' }] })).toBe('Send connection request — done › Wait for event → No');
    expect(last.title({ stopReason: 'branch-ended', history: [] })).toBe('Finished: nothing left on this branch');
  });
  it('a v1 sequence keeps the index-based column', () => {
    const cols = hubEnrollmentColumns([{ type: 'connect', config: {} }, { type: 'message', config: {} }]);
    const stepCol = cols.find((c) => c.key === 'currentStepIndex');
    const { container } = render(<div>{stepCol.render(1, { status: 'active', currentStepIndex: 1 })}</div>);
    expect(container.textContent).toBe('2/2 — Send a message');
  });
});
