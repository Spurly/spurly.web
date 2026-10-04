import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { fmtNum, longDay, shortDay } from './format.js';

/**
 * One series over time with a gradient fill (the network-growth line). The
 * y-axis hugs the data instead of starting at zero, because a network of 860
 * growing to 890 would otherwise draw as a flat line at the top.
 */
export function AreaTrend({ days = [], values = [], name = 'Value', color = 'var(--ui-chart-1)', height = 180 }) {
  const gid = `area-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const data = days.map((day, i) => ({ day, value: Number(values[i]) || 0 }));
  if (data.length === 0) return <div style={{ height }} aria-hidden="true" />;

  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`${name} over the selected range`}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.32 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.02 }} />
            </linearGradient>
          </defs>
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
            width={44}
            tickFormatter={fmtNum}
            tick={{ fontSize: 11, fill: 'var(--ui-text-quaternary)' }}
            axisLine={false}
            tickLine={false}
            domain={[(min) => Math.max(0, Math.floor(min * 0.98)), (max) => Math.max(1, Math.ceil(max * 1.01))]}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--ui-border-strong)', strokeDasharray: '3 3' }}
            content={<ChartTooltip formatLabel={longDay} formatValue={fmtNum} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--ui-surface-card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
