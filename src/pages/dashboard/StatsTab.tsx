import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStoredActivities } from "../../hooks";
import type { Activity } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupBy = "week" | "month";

type MetricKey =
  | "distance"
  | "moving_time"
  | "elapsed_time"
  | "total_elevation_gain"
  | "count"
  | "suffer_score"
  | "average_heartrate"
  | "kilojoules";

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  extract: (a: Activity) => number;
  format: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: "distance",
    label: "Distance",
    unit: "km",
    extract: (a) => a.distance / 1000,
    format: (v) => `${v.toFixed(1)} km`,
  },
  {
    key: "moving_time",
    label: "Temps en mouvement",
    unit: "h",
    extract: (a) => a.moving_time / 3600,
    format: (v) => `${v.toFixed(1)} h`,
  },
  {
    key: "elapsed_time",
    label: "Temps total",
    unit: "h",
    extract: (a) => a.elapsed_time / 3600,
    format: (v) => `${v.toFixed(1)} h`,
  },
  {
    key: "total_elevation_gain",
    label: "Dénivelé positif",
    unit: "m",
    extract: (a) => a.total_elevation_gain,
    format: (v) => `${Math.round(v)} m`,
  },
  {
    key: "count",
    label: "Nombre d'activités",
    unit: "activités",
    extract: () => 1,
    format: (v) => `${Math.round(v)} activités`,
  },
  {
    key: "suffer_score",
    label: "Suffer score",
    unit: "pts",
    extract: (a) => a.suffer_score ?? 0,
    format: (v) => `${Math.round(v)} pts`,
  },
  {
    key: "average_heartrate",
    label: "FC moyenne (moy. pondérée)",
    unit: "bpm",
    extract: (a) => a.average_heartrate ?? 0,
    format: (v) => `${Math.round(v)} bpm`,
  },
  {
    key: "kilojoules",
    label: "Énergie (kJ)",
    unit: "kJ",
    extract: (a) => a.kilojoules ?? 0,
    format: (v) => `${Math.round(v)} kJ`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** ISO week number (1-53) and year for week-based grouping */
function getISOWeekKey(date: Date): string {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${tmp.getFullYear()}-S${String(weekNum).padStart(2, "0")}`;
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function formatWeekLabel(key: string): string {
  return key.replace("-S", " S");
}

/** Generate all period keys (months or weeks) between two dates (inclusive) */
function generatePeriodKeys(from: Date, to: Date, groupBy: GroupBy): string[] {
  const keys: string[] = [];
  if (groupBy === "month") {
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      keys.push(getMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    // week: iterate day by day and collect unique week keys in order
    const cursor = new Date(from.getTime());
    const seen = new Set<string>();
    while (cursor <= to) {
      const k = getISOWeekKey(cursor);
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
      cursor.setDate(cursor.getDate() + 7);
      // snap to Monday to avoid drift
      cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
    }
  }
  return keys;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metricConfig: MetricConfig;
}

const TooltipBox = styled.div`
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(252, 76, 2, 0.4);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #e0e0e0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

const TooltipLabel = styled.div`
  font-weight: 600;
  color: #fc4c02;
  margin-bottom: 4px;
`;

const CustomTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  label,
  metricConfig,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipLabel>{label}</TooltipLabel>
      <div>{metricConfig.format(payload[0].value)}</div>
    </TooltipBox>
  );
};

// ─── Styled components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  overflow: hidden;
`;

const PageTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(90deg, #fc4c02, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const PageSubtitle = styled.p`
  font-size: 0.95rem;
  color: #a0a0a0;
  margin: 0 0 28px 0;
`;

const ControlsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.78rem;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #e0e0e0;
  padding: 8px 12px;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  color-scheme: dark;

  &:focus {
    border-color: rgba(252, 76, 2, 0.5);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #e0e0e0;
  padding: 8px 12px;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:focus {
    border-color: rgba(252, 76, 2, 0.5);
  }

  option {
    background: #1a1a2e;
    color: #e0e0e0;
  }
`;

const YearShortcutsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  align-items: center;
`;

const YearChip = styled.button<{ $active: boolean }>`
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(252,76,2,0.7)" : "rgba(255,255,255,0.15)"};
  background: ${({ $active }) =>
    $active ? "rgba(252,76,2,0.2)" : "rgba(255,255,255,0.04)"};
  color: ${({ $active }) => ($active ? "#fc4c02" : "#aaa")};

  &:hover {
    border-color: rgba(252, 76, 2, 0.5);
    color: #fc4c02;
    background: rgba(252, 76, 2, 0.1);
  }
`;

const YearLabel = styled.span`
  font-size: 0.78rem;
  color: #666;
  margin-right: 4px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.04em;
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px 16px 16px;
`;

const ChartTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ccc;
  margin-bottom: 20px;
  padding-left: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChartMetricBadge = styled.span`
  font-size: 0.78rem;
  background: rgba(252, 76, 2, 0.15);
  border: 1px solid rgba(252, 76, 2, 0.3);
  color: #fc4c02;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 0;
  color: #666;
  font-size: 0.95rem;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 20px;
  flex: 1;
  min-width: 140px;
`;

const SummaryValue = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
`;

const SummaryLabel = styled.div`
  font-size: 0.78rem;
  color: #888;
  margin-top: 2px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const StatsTab: React.FC = () => {
  const { activities, loading, loaded, load } = useStoredActivities();

  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [metric, setMetric] = useState<MetricKey>("distance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Ref pour n'initialiser la période qu'une seule fois après le chargement
  const defaultApplied = useRef(false);

  // Load activities on mount
  useEffect(() => {
    if (!loaded && !loading) {
      load();
    }
  }, [loaded, loading, load]);

  // Extract all years that have at least one activity
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const a of activities) {
      years.add(new Date(a.start_date).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a); // most recent first
  }, [activities]);

  // Default selection: most recent year — s'exécute une seule fois après le chargement
  useEffect(() => {
    if (loaded && availableYears.length > 0 && !defaultApplied.current) {
      defaultApplied.current = true;
      const year = availableYears[0];
      setDateFrom(`${year}-01-01`);
      setDateTo(`${year}-12-31`);
    }
  }, [loaded, availableYears]);

  const handleYearClick = (year: number) => {
    setDateFrom(`${year}-01-01`);
    setDateTo(`${year}-12-31`);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  };

  const metricConfig = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  // Filter + aggregate activities
  const chartData = useMemo(() => {
    if (!dateFrom || !dateTo) return [];

    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T23:59:59");

    const filtered = activities.filter((a) => {
      const d = new Date(a.start_date);
      return d >= from && d <= to;
    });

    // Generate all period keys to have zero-filled buckets
    const periodKeys = generatePeriodKeys(from, to, groupBy);
    const buckets: Record<string, number> = {};
    for (const k of periodKeys) buckets[k] = 0;

    for (const a of filtered) {
      const d = new Date(a.start_date);
      const key = groupBy === "month" ? getMonthKey(d) : getISOWeekKey(d);
      if (key in buckets) {
        buckets[key] += metricConfig.extract(a);
      }
    }

    return periodKeys.map((key) => ({
      key,
      label: groupBy === "month" ? formatMonthLabel(key) : formatWeekLabel(key),
      value: Math.round(buckets[key] * 100) / 100,
    }));
  }, [activities, dateFrom, dateTo, groupBy, metricConfig]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!chartData.length) return null;
    const nonZero = chartData.filter((d) => d.value > 0);
    const total = chartData.reduce((s, d) => s + d.value, 0);
    const max = Math.max(...chartData.map((d) => d.value));
    const avg = nonZero.length ? total / nonZero.length : 0;
    return { total, max, avg, activePeriods: nonZero.length };
  }, [chartData]);

  // Detect if a full year is selected (for chip highlight)
  const isFullYear = (year: number) => {
    return dateFrom === `${year}-01-01` && dateTo === `${year}-12-31`;
  };

  const currentSelectedYear = availableYears.find((y) => isFullYear(y)) ?? null;

  return (
    <Wrapper>
      <PageTitle>Statistiques</PageTitle>
      <PageSubtitle>
        Analysez vos performances sur une période donnée
      </PageSubtitle>

      {/* ── Year shortcuts ── */}
      {availableYears.length > 0 && (
        <YearShortcutsRow>
          <YearLabel>Année&nbsp;:</YearLabel>
          {availableYears.map((year) => (
            <YearChip
              key={year}
              $active={currentSelectedYear === year}
              onClick={() => handleYearClick(year)}
            >
              {year}
            </YearChip>
          ))}
        </YearShortcutsRow>
      )}

      {/* ── Controls ── */}
      <ControlsRow>
        <ControlGroup>
          <Label>Du</Label>
          <DateInput
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
          />
        </ControlGroup>
        <ControlGroup>
          <Label>Au</Label>
          <DateInput type="date" value={dateTo} onChange={handleDateToChange} />
        </ControlGroup>
        <ControlGroup>
          <Label>Métrique</Label>
          <Select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label} ({m.unit})
              </option>
            ))}
          </Select>
        </ControlGroup>
        <ControlGroup>
          <Label>Grouper par</Label>
          <Select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            <option value="month">Mois</option>
            <option value="week">Semaine</option>
          </Select>
        </ControlGroup>
      </ControlsRow>

      {/* ── Summary cards ── */}
      {summaryStats && (
        <SummaryRow>
          <SummaryCard>
            <SummaryValue>
              {metricConfig.format(summaryStats.total)}
            </SummaryValue>
            <SummaryLabel>Total sur la période</SummaryLabel>
          </SummaryCard>
          <SummaryCard>
            <SummaryValue>{metricConfig.format(summaryStats.max)}</SummaryValue>
            <SummaryLabel>
              Meilleur {groupBy === "month" ? "mois" : "semaine"}
            </SummaryLabel>
          </SummaryCard>
          <SummaryCard>
            <SummaryValue>{metricConfig.format(summaryStats.avg)}</SummaryValue>
            <SummaryLabel>
              Moyenne par{" "}
              {groupBy === "month" ? "mois actif" : "semaine active"}
            </SummaryLabel>
          </SummaryCard>
          <SummaryCard>
            <SummaryValue>{summaryStats.activePeriods}</SummaryValue>
            <SummaryLabel>
              {groupBy === "month" ? "Mois actifs" : "Semaines actives"}
            </SummaryLabel>
          </SummaryCard>
        </SummaryRow>
      )}

      {/* ── Bar chart ── */}
      {loading && <EmptyState>Chargement des activités…</EmptyState>}

      {!loading && loaded && chartData.length === 0 && (
        <EmptyState>Aucune activité sur cette période.</EmptyState>
      )}

      {!loading && chartData.length > 0 && (
        <ChartCard>
          <ChartTitle>
            <span>
              {metricConfig.label} par{" "}
              {groupBy === "month" ? "mois" : "semaine"}
            </span>
            <ChartMetricBadge>{metricConfig.unit}</ChartMetricBadge>
          </ChartTitle>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={chartData}
              margin={{
                top: 4,
                right: 8,
                left: 0,
                bottom: groupBy === "week" ? 40 : 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#888", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                interval={groupBy === "week" ? 3 : 0}
                angle={groupBy === "week" ? -45 : 0}
                textAnchor={groupBy === "week" ? "end" : "middle"}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
                width={48}
              />
              <Tooltip
                content={<CustomTooltip metricConfig={metricConfig} />}
                cursor={{ fill: "rgba(252,76,2,0.06)" }}
              />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fc4c02" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ff6b35" stopOpacity={0.5} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </Wrapper>
  );
};

export default StatsTab;
