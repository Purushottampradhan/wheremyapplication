import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../theme';
import { useReducedMotion } from './visuals';

export const STATUS_COLOR: Record<string, string> = {
  wishlist: '#7c3aed',
  applied: '#3b5bff',
  screening: '#0891b2',
  interview: '#d97706',
  offer: '#059669',
  rejected: '#e11d48',
  withdrawn: '#64748b',
};

export const WORK_COLOR: Record<string, string> = {
  Remote: '#0f766e',
  Hybrid: '#0284c7',
  'On-site': '#3b5bff',
  Unknown: '#94a3b8',
};

type Point = { name: string; count: number; fill?: string };

function useChartChrome() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const dark = theme === 'dark';
  return {
    reduced,
    grid: dark ? '#2c3b58' : '#e6edf6',
    tick: dark ? '#a9b6d0' : '#52627a',
    tooltip: {
      background: dark ? '#172033' : '#ffffff',
      border: `1px solid ${dark ? '#2c3b58' : '#dbe3ef'}`,
      borderRadius: 12,
      color: dark ? '#e7eefc' : '#0c1b33',
      fontSize: 13,
    },
  };
}

export function ActivityChart({ data }: { data: Array<{ name: string; count: number }> }) {
  const chrome = useChartChrome();
  return (
    <div className="chart-box" role="img" aria-label="Applications over the last six months">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b5bff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b5bff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chrome.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: chrome.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} width={32} tick={{ fill: chrome.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={chrome.tooltip} />
          <Area
            type="monotone"
            dataKey="count"
            name="Applications"
            stroke="#3b5bff"
            strokeWidth={2.5}
            fill="url(#activityFill)"
            isAnimationActive={!chrome.reduced}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  label,
}: {
  data: Point[];
  label: string;
}) {
  const chrome = useChartChrome();
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="chart-box donut" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={62}
            outerRadius={86}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={!chrome.reduced}
            animationDuration={700}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill || '#3b5bff'} />
            ))}
          </Pie>
          <Tooltip contentStyle={chrome.tooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{total}</strong>
        <span>total</span>
      </div>
    </div>
  );
}

export function HorizontalBars({
  data,
  label,
  color = '#3b5bff',
}: {
  data: Point[];
  label: string;
  color?: string;
}) {
  const chrome = useChartChrome();
  const height = Math.max(180, data.length * 36);
  return (
    <div className="chart-box" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={chrome.grid} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: chrome.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tick={{ fill: chrome.tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={chrome.tooltip} />
          <Bar dataKey="count" name="Applications" fill={color} radius={[0, 8, 8, 0]} isAnimationActive={!chrome.reduced} barSize={14}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill || color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartList({ items }: { items: Array<{ name: string; count: number }> }) {
  if (items.length === 0) return null;
  return (
    <ul className="chart-list">
      {items.map((item) => (
        <li key={item.name}>
          <span>{item.name}</span>
          <strong>{item.count}</strong>
        </li>
      ))}
    </ul>
  );
}
