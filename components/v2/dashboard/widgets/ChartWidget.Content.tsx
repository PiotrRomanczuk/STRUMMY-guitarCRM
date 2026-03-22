'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  lessons: number;
  assignments: number;
}

export function ChartContent({ data }: { data: ChartDataPoint[] }) {
  return (
    <>
      <div
        className="h-[200px]"
        role="img"
        aria-label="Weekly progress chart showing lessons and assignments"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="v2ColorLessons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffd183" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffd183" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="v2ColorAssignments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f2b127" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f2b127" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '10px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Area
              type="monotone"
              dataKey="lessons"
              stroke="#ffd183"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#v2ColorLessons)"
            />
            <Area
              type="monotone"
              dataKey="assignments"
              stroke="#f2b127"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#v2ColorAssignments)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ffd183' }} />
          <span className="text-xs text-muted-foreground">Lessons</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f2b127' }} />
          <span className="text-xs text-muted-foreground">Assignments</span>
        </div>
      </div>
    </>
  );
}
