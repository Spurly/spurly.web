import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, render } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * Dashboard analytics: the payload normaliser, the chart pieces that carry
 * logic (gauge with no denominator, funnel conversion, heatmap readout), and
 * the page wiring (range switch refetches, a failed fetch degrades to a retry
 * banner without taking the rest of the dashboard down).
 */
const days7 = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];

function payload(over = {}) {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  grid[1][10] = 4;
  return {
    range: { days: 7, timezone: 'Asia/Kolkata' },
    startedAt: '2026-09-01T00:00:00.000Z',
    daysWithSpurly: 34,
    totals: { invites: 120, messages: 30, connections: 890, connectionsSinceStart: 42, repliesConversations: 9 },
    period: {
      invites: { value: 15, prev: 10, delta: 50 },
      messages: { value: 4, prev: 0, delta: null },
      newConnections: { value: 6, prev: 8, delta: -25 },
      replies: { value: 3, prev: 3, delta: 0 },
      newViewers: { value: 1, prev: 0, delta: null },
    },
    series: {
      days: days7,
      invites: [1, 2, 3, 2, 3, 2, 2],
      messages: [0, 0, 1, 0, 1, 1, 1],
      newConnections: [1, 0, 1, 1, 1, 1, 1],
      replies: [0, 1, 0, 1, 0, 1, 0],
      newViewers: [0, 0, 0, 0, 0, 0, 1],
      network: [884, 884, 885, 886, 887, 888, 890],
    },
    acceptance: { rate: 33.3, matured: 30, accepted: 10, windowDays: 14 },
    reply: { rate: 30, conversations: 30, replied: 9, medianHoursToReply: 5 },
    funnel: [
      { key: 'leads', label: 'Leads', value: 1000 },
      { key: 'enriched', label: 'Enriched', value: 500 },
      { key: 'conversations', label: 'Conversations', value: 800 },
    ],
    heat: { sends: grid, replies: grid },
    campaigns: [{ id: 'c1', name: 'Founders', type: 'connect', status: 'done', sent: 20, accepted: 5, messaged: 0, rate: 25 }],
    audience: { locations: [{ label: 'India', value: 700 }], companies: [{ label: 'Acme', value: 12 }] },
    ...over,
  };
}

describe('normalizeAnalytics', () => {
  it('returns null for anything that is not an analytics object', async () => {
    const { normalizeAnalytics } = await import('src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js');
    expect(normalizeAnalytics(null)).toBeNull();
    expect(normalizeAnalytics([])).toBeNull();
    expect(normalizeAnalytics({})).toBeNull();
    expect(normalizeAnalytics('nope')).toBeNull();
  });

  it('fills every field the page reads when the payload is partial', async () => {
    const { normalizeAnalytics } = await import('src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js');
    const out = normalizeAnalytics({ series: { days: ['2026-10-04'] } });
    expect(out.series.invites).toEqual([]);
    expect(out.period.invites).toEqual({ value: 0, prev: 0, delta: null });
    expect(out.acceptance.rate).toBeNull();
    expect(out.heat.sends).toEqual([]);
    expect(out.audience.locations).toEqual([]);
    expect(out.totals.connectionsSinceStart).toBeNull();
  });
});

describe('chart pieces', () => {
  it('Gauge shows a dash, not 0%, when there is no honest denominator', async () => {
    const { Gauge } = await import('src/core/charts');
    const { container } = render(<Gauge value={null} label="Acceptance rate" />);
    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toContain('0%');
    expect(screen.getByRole('img', { name: /not enough data yet/i })).toBeInTheDocument();
  });

  it('Gauge prints the rate it was given', async () => {
    const { Gauge } = await import('src/core/charts');
    render(<Gauge value={33.3} label="Acceptance rate" />);
    expect(screen.getByRole('img', { name: /33\.3%/ })).toBeInTheDocument();
  });

  it('Funnel3D shows a step ratio, and none when a stage is larger than the one before', async () => {
    const { Funnel3D } = await import('src/core/charts');
    const { container } = render(<Funnel3D stages={payload().funnel} />);
    const convs = [...container.querySelectorAll('.ui-funnel__conv')].map((n) => n.textContent);
    expect(convs).toEqual(['', '50%', '']);
  });

  it('Funnel3D renders nothing for an empty list', async () => {
    const { Funnel3D } = await import('src/core/charts');
    const { container } = render(<Funnel3D stages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('Heatmap names its busiest slot in text, and says so when empty', async () => {
    const { Heatmap } = await import('src/core/charts');
    const { rerender } = render(<Heatmap grid={payload().heat.sends} unit="sends" />);
    expect(screen.getByText(/Busiest: Tue 10 AM · 4 sends/)).toBeInTheDocument();
    rerender(<Heatmap grid={[]} unit="sends" />);
    expect(screen.getByText(/No sends in this range yet/)).toBeInTheDocument();
  });

  it('Sparkline degrades to a plain track for fewer than two points', async () => {
    const { Sparkline } = await import('src/core/charts');
    const { container } = render(<Sparkline values={[3]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('Sparkline of all zeros draws a flat line instead of NaN geometry', async () => {
    const { Sparkline } = await import('src/core/charts');
    const { container } = render(<Sparkline values={[0, 0, 0, 0]} />);
    expect(container.querySelector('path[d*="NaN"]')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('hero and tiles', () => {
  it('HeroCard leads with connections gained since the start', async () => {
    const { HeroCard } = await import('src/products/pages/dashboard/analytics/HeroCard.jsx');
    render(<HeroCard data={(await import('src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js')).normalizeAnalytics(payload())} loading={false} days={7} />);
    expect(screen.getByText('Since you started using Spurly')).toBeInTheDocument();
    expect(screen.getByText(/grown your network by 42 connections/)).toBeInTheDocument();
    expect(screen.getByText('Day 34 with Spurly')).toBeInTheDocument();
  });

  it('HeroCard falls back to the network size rather than inventing a gain', async () => {
    const { HeroCard } = await import('src/products/pages/dashboard/analytics/HeroCard.jsx');
    const { normalizeAnalytics } = await import('src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js');
    const data = normalizeAnalytics(payload({ totals: { invites: 0, messages: 0, connections: 890, connectionsSinceStart: null, repliesConversations: 0 } }));
    render(<HeroCard data={data} loading={false} days={7} />);
    expect(screen.getByText(/network is 890 connections strong/)).toBeInTheDocument();
    expect(screen.queryByText(/grown your network/)).toBeNull();
  });

  it('HeroCard for a brand-new account says where the numbers will come from', async () => {
    const { HeroCard } = await import('src/products/pages/dashboard/analytics/HeroCard.jsx');
    const { normalizeAnalytics } = await import('src/core/dashboardAnalytics/hooks/useDashboardAnalytics.js');
    const zero = { invites: 0, messages: 0, connections: 0, connectionsSinceStart: null, repliesConversations: 0 };
    render(<HeroCard data={normalizeAnalytics(payload({ totals: zero, daysWithSpurly: null }))} loading={false} days={7} />);
    expect(screen.getByText(/numbers start with your first campaign/)).toBeInTheDocument();
  });

  it('TrendTile shows the delta only when there is something to compare', async () => {
    const { TrendTile } = await import('src/products/pages/dashboard/analytics/TrendTile.jsx');
    const { rerender, container } = render(<TrendTile label="Invites sent" value={15} prev={10} delta={50} series={[1, 2, 3]} days={7} />);
    expect(container.textContent).toContain('50%');
    rerender(<TrendTile label="Invites sent" value={4} prev={0} delta={null} series={[1, 2, 3]} days={7} />);
    expect(container.textContent).not.toContain('%');
    expect(container.textContent).toContain('Nothing to compare yet');
  });
});

describe('dashboard page wiring', () => {
  const state = { fail: false };

  beforeEach(() => {
    state.fail = false;
    vi.resetModules();
  });

  async function renderPage() {
    const gateway = stubGateway({
      'GET /hub/summary': { success: true, data: { leadsTotal: 5, pacing: { dayUsed: 1, dailyCap: 40 } } },
      'GET /hub/summary/dashboard': { success: true, data: { leadsTotal: 5, pacing: { dayUsed: 1, dailyCap: 40 }, connectRate: 10 } },
      'GET /hub/summary/analytics': (url) => {
        if (state.fail) return { success: false, message: 'boom' };
        const d = Number(new URL(url, 'http://x').searchParams.get('days'));
        return { success: true, data: payload({ range: { days: d, timezone: 'UTC' } }) };
      },
      'GET /credits*': { success: true, data: { balance: 100 } },
      'GET /*': { success: true, data: [] },
    });
    vi.doMock('src/shared/gateway/apiGateway.js', () => gateway);
    const { renderWithProviders } = await import('./helpers.jsx');
    const { HubDashboardPage } = await import('src/products/pages/dashboard/index.jsx');
    renderWithProviders(<HubDashboardPage />);
    return gateway.default.get;
  }

  it('renders the analytics, and the range pills refetch with the new range', async () => {
    const get = await renderPage();
    expect(await screen.findByText(/grown your network by 42 connections/)).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(expect.stringContaining('/hub/summary/analytics?days=30'));
    fireEvent.click(screen.getByRole('radio', { name: '7 days' }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(expect.stringContaining('days=7')));
    expect(await screen.findByText('Last 7 days')).toBeInTheDocument();
  });

  it('a failed analytics call shows a retry banner and leaves the rest of the page up', async () => {
    state.fail = true;
    await renderPage();
    expect(await screen.findByText('boom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByText('Leads sourced')).toBeInTheDocument();
  });
});
