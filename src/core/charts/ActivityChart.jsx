import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { fmtNum, longDay, shortDay, sumOf } from './format.js';

/**
 * What you did vs what came back, day by day: invites as bars (effort), new
 * connections and replies as lines (results). Series are told apart by colour,
 * by mark type (bar vs line, solid vs dashed) and by the legend, which doubles
 * as the show/hide control.
 */
const SERIES = [
  { key: 'invites', name: 'Invites sent', color: 'var(--ui-chart-1)' },
  { key: 'newConnections', name: 'New connections', color: 'var(--ui-chart-2)' },
  { key: 'replies', name: 'Replies', color: 'var(--ui-chart-3)', dashed: true },
];

export function ActivityChart({ days = [], invites = [], newConnections = [], replies = [], height = 240 }) {
  const [hidden, setHidden] = useState(() => new Set());
  const source = { invites, newConnections, replies };
  const data = days.map((day, i) => ({
    day,
    invites: Number(invites[i]) || 0,
    newConnections: Number(newConnections[i]) || 0,
    replies: Number(replies[i]) || 0,
  }));

  const toggle = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < SERIES.length - 1) next.add(key);
      return next;
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3" role="group" aria-label="Show or hide a series">
        {SERIES.map((s) => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={!off}
              onClick={() => toggle(s.key)}
              className={`inline-flex items-center gap-1.5 text-[length:var(--ui-t-label)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] rounded ${off ? 'opacity-45' : ''}`}
            >
              <span
                className="inline-block w-3 h-[3px] rounded-full"
                style={{ background: s.color, ...(s.dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 4px, transparent 4px 6px)`, background: 'none' } : {}) }}
                aria-hidden="true"
              />
              <span className="text-[var(--ui-text-body)]">{s.name}</span>
              <span className="ui-num !font-normal text-[var(--ui-text-quaternary)]">{fmtNum(sumOf(source[s.key]))}</span>
            </button>
          );
        })}
      </div>
      <div style={{ height }} className="w-full" role="img" aria-label="Invites sent, new connections and replies per day">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--ui-chart-grid)" />
            <XAxis
              dataKey="day"
              tickFormatter={shortDay}
              tick={{ fontSize: 11, fill: 'var(--ui-text-quaternary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              width={32}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--ui-text-quaternary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--ui-accent-wash)' }}
              content={<ChartTooltip formatLabel={longDay} formatValue={fmtNum} />}
            />
            <Bar
              dataKey="invites"
              name="Invites sent"
              fill="var(--ui-chart-1)"
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
              hide={hidden.has('invites')}
            />
            <Line
              type="monotone"
              dataKey="newConnections"
              name="New connections"
              stroke="var(--ui-chart-2)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--ui-surface-card)', strokeWidth: 2 }}
              hide={hidden.has('newConnections')}
            />
            <Line
              type="monotone"
              dataKey="replies"
              name="Replies"
              stroke="var(--ui-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--ui-surface-card)', strokeWidth: 2 }}
              hide={hidden.has('replies')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
