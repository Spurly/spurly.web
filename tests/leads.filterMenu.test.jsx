import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from './helpers.jsx';
import { LeadFilterMenu } from 'src/products/pages/leads/components/LeadFilterMenu.jsx';
import { EMPTY_LEAD_FILTERS, leadFilterParams, countLeadFilters } from 'src/products/leads/constants/constants.js';

/**
 * Leads → Filter menu (Title, Seniority, Function, Location, Last activity).
 * The menu edits a draft and hands the whole object over on Apply; leadFilterParams turns it into the query the server reads.
 */

describe('leadFilterParams', () => {
  it('sends only what is set, with lists comma-joined', () => {
    expect(leadFilterParams(EMPTY_LEAD_FILTERS)).toEqual({});
    expect(leadFilterParams({ title: ' CTO ', seniority: ['c_level', 'vp'], jobFunction: ['hr'], location: ' Berlin ', lastActivity: 'd30' })).toEqual({
      title: 'CTO', seniority: 'c_level,vp', jobFunction: 'hr', location: 'Berlin', lastActivity: 'd30',
    });
    expect(countLeadFilters({ ...EMPTY_LEAD_FILTERS, title: 'x', lastActivity: 'd7' })).toBe(2);
  });
});

describe('LeadFilterMenu', () => {
  /** The menu hands its state setter an updater; run it against the current value like React would. */
  const apply = (onChange, from = EMPTY_LEAD_FILTERS) => onChange.mock.calls.reduce((acc, [next]) => (typeof next === 'function' ? next(acc) : next), from);

  it('applies each change at once: picked boxes, a last-activity window, then typing after a short wait', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderWithProviders(<LeadFilterMenu value={EMPTY_LEAD_FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /filter leads/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'C-level' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'HR & Recruiting' }));
    fireEvent.click(screen.getByRole('radio', { name: '30 days' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'CTO' } });
    expect(apply(onChange).title).toBe(''); // still typing
    act(() => { vi.advanceTimersByTime(400); });
    vi.useRealTimers();

    expect(apply(onChange)).toEqual({ title: 'CTO', seniority: ['c_level'], jobFunction: ['hr'], location: '', lastActivity: 'd30' });
  });

  it('shows how many filters are on, and Clear all resets them', () => {
    const onChange = vi.fn();
    renderWithProviders(<LeadFilterMenu value={{ ...EMPTY_LEAD_FILTERS, title: 'CTO', location: 'Berlin' }} onChange={onChange} />);

    expect(screen.getByRole('button', { name: /filter leads/i })).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: /filter leads/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_LEAD_FILTERS);
  });
});
