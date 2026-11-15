import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { JourneyView } = await import('src/products/pages/sequences/components/journey/JourneyView.jsx');

const steps = [
  { id: 'sp', type: 'split', config: {}, delayDays: 0 },
  { id: 'a1', type: 'like_post', config: {}, delayDays: 0, parentId: 'sp', branch: 'yes' },
  { id: 'b1', type: 'follow', config: {}, delayDays: 0, parentId: 'sp', branch: 'no' },
];
const lead = (id, name, status = 'active') => ({ id, name, status, photo: '' });
const node = (leads, here) => ({ here: { active: 0, waiting: 0, failed: 0, ...here }, passed: { done: 0, skipped: 0 }, bySender: {}, leads, moreHere: 0 });
const flow = {
  status: 'paused',
  nodes: {
    __start: node([lead('e1', 'Ann'), lead('e2', 'Bo')], { active: 2 }),
    a1: node([lead('e3', 'Cy', 'waiting')], { waiting: 1 }),
  },
  terminal: { completed: 1, stopped: { 'lead-replied': 2 }, failed: {} },
  replied: { count: 2, leads: [{ id: 'r1', name: 'Dee', photo: '' }, { id: 'r2', name: 'Eli', photo: '' }] },
  attention: [],
};
const journey = (over = {}) => ({ flow, loading: false, senderId: null, setSenderId: vi.fn(), openId: null, openLead: vi.fn(), retrying: false, retryAll: vi.fn(), ...over });

describe('JourneyView', () => {
  it('draws the Start node with the not-started leads, and labels the split sides A and B', () => {
    render(<JourneyView sequence={{ steps }} journey={journey()} onOpenEnrolled={() => {}} />);
    const start = document.querySelector('[data-node-id="start"]');
    expect(start).toHaveTextContent('Start');
    expect(start).toHaveTextContent('6 enrolled');
    expect(screen.getByRole('button', { name: /Ann/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Only A' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Only B' })).toBeInTheDocument();
    expect(screen.getByText(/Paused: nothing is sent/)).toBeInTheDocument();
  });

  it('counts the filters, and Replied shows who replied', async () => {
    render(<JourneyView sequence={{ steps }} journey={journey()} onOpenEnrolled={() => {}} />);
    expect(screen.getByRole('radio', { name: /Not started/ })).toHaveTextContent('2');
    expect(screen.getByRole('radio', { name: /Replied/ })).toHaveTextContent('2');
    expect(screen.queryByTestId('replied-strip')).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: /Replied/ }));
    expect(screen.getByTestId('replied-strip')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dee/ })).toBeInTheDocument();
  });

  it('opens a lead from a bubble', async () => {
    const j = journey();
    render(<JourneyView sequence={{ steps }} journey={j} onOpenEnrolled={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Cy/ }));
    expect(j.openLead).toHaveBeenCalledWith('e3');
  });
});

describe('JourneyView flow suggestion', () => {
  const lintSteps = [
    { id: 'c1', type: 'connect', config: {}, delayDays: 0 },
    { id: 'm1', type: 'message', config: { text: 'hi' }, delayDays: 0 },
  ];
  const f = (status) => ({ ...flow, status, nodes: {} });
  it('shows a short line with Fix now (explanation in a tooltip), enabled only while paused', () => {
    render(<JourneyView sequence={{ steps: lintSteps }} journey={journey({ flow: f('running') })} onOpenEnrolled={() => {}} onInsertWait={vi.fn()} />);
    expect(screen.getByText(/comes right after the connection request/)).toBeInTheDocument();
    expect(screen.queryByText(/LinkedIn only lets you message connections/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Fix now' })).toBeDisabled();
  });
  it('asks which wait to add, and adds nothing until confirmed', async () => {
    const onInsertWait = vi.fn();
    render(<JourneyView sequence={{ steps: lintSteps }} journey={journey({ flow: f('paused') })} onOpenEnrolled={() => {}} onInsertWait={onInsertWait} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fix now' }));
    expect(onInsertWait).not.toHaveBeenCalled();
    expect(screen.getByText('Add a wait before the message')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add wait' }));
    expect(onInsertWait).toHaveBeenCalledWith({ parentId: null, branch: null, index: 1 }, { mode: 'until-accepted', days: 2, maxDays: 7 });
  });
});
