import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@iconify/react';

// Bootstrap icon names for Iconify
const BookOpenIcon = (props: { className?: string }) => (
  <Icon icon="bi:book" className={props.className} />
);
const FlameIcon = (props: { className?: string }) => (
  <Icon icon="bi:fire" className={props.className} />
);
const ClockIcon = (props: { className?: string }) => (
  <Icon icon="bi:clock" className={props.className} />
);

const stats = [
  {
    title: 'Total Cards',
    value: '0',
    description: 'Cards created',
    icon: BookOpenIcon,
  },
  {
    title: 'Study Streak',
    value: '0',
    description: 'Days in a row',
    icon: FlameIcon,
  },
  {
    title: 'Time Spent',
    value: '0h',
    description: 'Total study time',
    icon: ClockIcon,
  },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HEATMAP_LEVEL_OPACITY = [0.08, 0.24, 0.42, 0.6, 0.82] as const;
const HEATMAP_GAP = '0.5rem';

interface StudyActivityHeatmapProps {
  activityData: Record<string, number>;
}

interface CalendarDay {
  date: Date;
  key: string;
  count: number;
  isCurrentMonth: boolean;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfWeek(date: Date) {
  const end = new Date(date);
  end.setDate(date.getDate() + (6 - date.getDay()));
  end.setHours(0, 0, 0, 0);
  return end;
}

function getDisplayMonth(activityData: Record<string, number>) {
  const keys = Object.keys(activityData).sort();

  if (keys.length === 0) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const latestKey = keys[keys.length - 1];
  const [year, month] = latestKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function getActivityLevel(count: number, maxCount: number) {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  const ratio = count / maxCount;

  if (ratio <= 0.25) {
    return 1;
  }

  if (ratio <= 0.5) {
    return 2;
  }

  if (ratio <= 0.75) {
    return 3;
  }

  return 4;
}

export function StudyActivityHeatmap({
  activityData,
}: StudyActivityHeatmapProps) {
  const displayMonth = getDisplayMonth(activityData);
  const monthStart = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0
  );
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days: CalendarDay[] = [];
  const current = new Date(gridStart);
  const monthlyCounts = Object.entries(activityData)
    .filter(([key]) => key.startsWith(formatDateKey(monthStart).slice(0, 7)))
    .map(([, count]) => count);
  const maxCount = Math.max(0, ...monthlyCounts);
  const tooltipFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  while (current <= gridEnd) {
    const key = formatDateKey(current);

    days.push({
      date: new Date(current),
      key,
      count: activityData[key] ?? 0,
      isCurrentMonth: current.getMonth() === displayMonth.getMonth(),
    });

    current.setDate(current.getDate() + 1);
  }

  return (
    <div className="w-full overflow-x-auto px-1 pb-1">
      <style>{`
        @media (max-width: 768px) {
          .heatmap-grid { grid-template-columns: repeat(7, 1fr) !important; }
          .heatmap-header { grid-template-columns: repeat(7, 1fr) !important; }
          .heatmap-sun-cell { display: none !important; }
          .heatmap-sun-header { display: none !important; }
          .heatmap-cell { padding: 0.5rem !important; }
        }
        .heatmap-cell { aspect-ratio: 1 / 1 !important; }
      `}</style>
      <div className="min-w-fit space-y-4 p-3 sm:p-5">
        <div
          className="heatmap-header grid text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
          style={{
            gridTemplateColumns: 'repeat(8, 1fr)',
            columnGap: HEATMAP_GAP,
          }}
        >
          {DAY_LABELS.map((day) => (
            <span key={day} className="text-center">
              {day}
            </span>
          ))}
          <span className="heatmap-sun-header text-center text-muted-foreground/50">
            Sun
          </span>
        </div>

        <div
          className="heatmap-grid grid"
          style={{
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: HEATMAP_GAP,
          }}
        >
          {days.map((day, idx) => {
            const level = getActivityLevel(day.count, maxCount);
            const opacity = HEATMAP_LEVEL_OPACITY[level];

            return (
              <React.Fragment key={day.key}>
                <div
                  className="heatmap-cell rounded-[4px] border border-primary/10 p-3 transition-transform duration-150 hover:-translate-y-0.5"
                  aria-label={`${day.count} cards memorized on ${tooltipFormatter.format(day.date)}`}
                  style={{
                    backgroundColor: `hsl(var(--primary) / ${opacity})`,
                    opacity: day.isCurrentMonth ? 1 : 0.45,
                  }}
                  title={`${day.count} cards memorized on ${tooltipFormatter.format(day.date)}`}
                />
                {(idx + 1) % 7 === 0 && (
                  <div
                    className="heatmap-sun-cell hidden rounded-[4px] border border-primary/10 p-3 sm:block"
                    style={{
                      backgroundColor: `hsl(var(--primary) / 0.08)`,
                      opacity: 0.45,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const activityData: Record<string, number> = {};
  const displayMonth = getDisplayMonth(activityData);
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(displayMonth);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={
              stat.title === 'Time Spent' ? 'md:col-span-2 xl:col-span-1' : ''
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card className="col-span-2 md:col-span-2 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{monthLabel}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily memorization activity
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <StudyActivityHeatmap activityData={activityData} />
          </CardContent>
        </Card>

        <Card className="col-span-2 border border-[#4a4a46] bg-[#30302e] transition-colors md:col-span-2 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white">
              Recent Activity
            </CardTitle>
            <p className="text-xs text-white/70">
              Your learning history will appear here
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-lg px-6 py-12 text-center sm:px-8">
              <BookOpenIcon className="mb-4 h-12 w-12 text-white/45" />
              <p className="text-sm text-white/70">
                No activity yet. Your completed study sessions and milestones
                will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
