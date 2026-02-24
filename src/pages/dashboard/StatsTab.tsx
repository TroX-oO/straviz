import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
  | "distance_cumulative"
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
  /** Si true, les valeurs sont affichées en somme cumulée croissante */
  cumulative?: boolean;
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
    key: "distance_cumulative",
    label: "km cumulés",
    unit: "km",
    extract: (a) => a.distance / 1000,
    format: (v) => `${v.toFixed(1)} km`,
    cumulative: true,
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

// ─── Period ──────────────────────────────────────────────────────────────────

interface Period {
  id: string;
  from: string;
  to: string;
  color: string;
}

const PERIOD_COLORS = ["#fc4c02", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

let _idSeq = 0;
const genId = () => `p${++_idSeq}`;

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

/** Dérive la date de début d'une période à partir de sa clé interne */
function getPeriodStartDate(key: string, groupBy: GroupBy): Date {
  if (groupBy === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const [yearStr, weekStr] = key.split("-S");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  return monday;
}

/**
 * Calcule les valeurs brutes par slot pour une période.
 * Retourne { values, keys } indexés [0..N-1].
 */
function computePeriodRaw(
  period: Period,
  activities: Activity[],
  groupBy: GroupBy,
  metricConfig: MetricConfig,
): { values: number[]; keys: string[] } {
  const from = new Date(period.from + "T00:00:00");
  const to = new Date(period.to + "T23:59:59");
  const filtered = activities.filter((a) => {
    const d = new Date(a.start_date);
    return d >= from && d <= to;
  });
  const periodKeys = generatePeriodKeys(from, to, groupBy);
  const buckets: Record<string, number> = {};
  for (const k of periodKeys) buckets[k] = 0;
  for (const a of filtered) {
    const d = new Date(a.start_date);
    const key = groupBy === "month" ? getMonthKey(d) : getISOWeekKey(d);
    if (key in buckets) buckets[key] += metricConfig.extract(a);
  }
  return {
    values: periodKeys.map((k) => Math.round(buckets[k] * 100) / 100),
    keys: periodKeys,
  };
}

/**
 * Format court d'une période pour le tooltip / la légende.
 */
function formatPeriodLabel(period: Period): string {
  const fy = period.from.slice(0, 4);
  const ty = period.to.slice(0, 4);
  if (period.from === `${fy}-01-01` && period.to === `${fy}-12-31` && fy === ty)
    return fy;
  if (fy === ty)
    return `${period.from.slice(5, 7)}/${fy} – ${period.to.slice(5, 7)}/${ty}`;
  return `${period.from} – ${period.to}`;
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
  payload?: Array<{ value: number; color: string; name: string }>;
  label?: string;
  metricConfig: MetricConfig;
  periods: Period[];
  isSingleMode: boolean;
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

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`;

const TooltipDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  display: inline-block;
`;

const TooltipMuted = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const CustomTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  label,
  metricConfig,
  periods,
  isSingleMode,
}) => {
  if (!active || !payload?.length) return null;
  if (isSingleMode) {
    return (
      <TooltipBox>
        <TooltipLabel>{label}</TooltipLabel>
        <div>{metricConfig.format(payload[0].value)}</div>
      </TooltipBox>
    );
  }
  return (
    <TooltipBox>
      <TooltipLabel>{label}</TooltipLabel>
      {payload.map((entry) => {
        const period = periods.find((p) => p.id === entry.name);
        return (
          <TooltipRow key={entry.name}>
            <TooltipDot $color={entry.color} />
            <TooltipMuted>
              {period ? formatPeriodLabel(period) : entry.name} :
            </TooltipMuted>
            <span>{metricConfig.format(entry.value)}</span>
          </TooltipRow>
        );
      })}
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

const PeriodRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 8px;
`;

const PeriodTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PeriodBottomRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`;

const ColorDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const RemoveButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #888;
  padding: 8px 12px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 60, 60, 0.12);
    border-color: rgba(255, 60, 60, 0.3);
    color: #ff6060;
  }
`;

const AddPeriodButton = styled.button`
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #888;
  padding: 10px 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-bottom: 24px;

  &:hover {
    background: rgba(252, 76, 2, 0.06);
    border-color: rgba(252, 76, 2, 0.3);
    color: #fc4c02;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const StatsTab: React.FC = () => {
  const { activities, loading, loaded, load } = useStoredActivities();

  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [metric, setMetric] = useState<MetricKey>("distance");
  const [periods, setPeriods] = useState<Period[]>([]);
  const defaultApplied = useRef(false);

  // Load activities on mount
  useEffect(() => {
    if (!loaded && !loading) load();
  }, [loaded, loading, load]);

  // Extract all years that have at least one activity
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const a of activities) years.add(new Date(a.start_date).getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [activities]);

  // Default selection: most recent year, once
  useEffect(() => {
    if (loaded && availableYears.length > 0 && !defaultApplied.current) {
      defaultApplied.current = true;
      const year = availableYears[0];
      setPeriods([
        {
          id: genId(),
          from: `${year}-01-01`,
          to: `${year}-12-31`,
          color: PERIOD_COLORS[0],
        },
      ]);
    }
  }, [loaded, availableYears]);

  const updatePeriod = (
    id: string,
    patch: Partial<Pick<Period, "from" | "to">>,
  ) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const removePeriod = (id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const addPeriod = () => {
    const nextColor = PERIOD_COLORS[periods.length % PERIOD_COLORS.length];
    const year = availableYears[0] ?? new Date().getFullYear();
    setPeriods((prev) => [
      ...prev,
      {
        id: genId(),
        from: `${year}-01-01`,
        to: `${year}-12-31`,
        color: nextColor,
      },
    ]);
  };

  const handleYearClick = (periodId: string, year: number) => {
    updatePeriod(periodId, { from: `${year}-01-01`, to: `${year}-12-31` });
  };

  const metricConfig = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const isSingleMode = periods.length <= 1;

  // ── Build chart data ──────────────────────────────────────────────────────

  const allSeriesRaw = useMemo(
    () =>
      periods.map((p) => ({
        period: p,
        ...computePeriodRaw(p, activities, groupBy, metricConfig),
      })),
    [periods, activities, groupBy, metricConfig],
  );

  /**
   * En mode single : axe X = labels de dates réels.
   * En mode comparaison : axe X relatif (M+1, M+2… / S+1, S+2…), aligné sur la
   * longueur max des séries.
   */
  const chartData = useMemo(() => {
    if (allSeriesRaw.length === 0) return [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isSingleMode) {
      const { period, values, keys } = allSeriesRaw[0];
      let acc = 0;
      return keys
        .map((key, i) => {
          if (metricConfig.cumulative) {
            const periodStart = getPeriodStartDate(key, groupBy);
            if (periodStart > today) return null;
          }
          const raw = values[i];
          let value: number;
          if (metricConfig.cumulative) {
            acc = Math.round((acc + raw) * 100) / 100;
            value = acc;
          } else {
            value = raw;
          }
          const label =
            groupBy === "month" ? formatMonthLabel(key) : formatWeekLabel(key);
          return { label, [period.id]: value };
        })
        .filter(Boolean) as Array<Record<string, string | number>>;
    }

    // Mode comparaison : normaliser toutes les séries sur un index relatif 0..maxLen-1
    // Troncature future pour cumulatif sur chaque série individuellement
    const processedSeries = allSeriesRaw.map(({ values, keys }) => {
      if (!metricConfig.cumulative) {
        return values.map((v, i) => ({
          slotIndex: i,
          value: v,
          label: keys[i],
        }));
      }
      // cumulative: filter future + accumulate
      const filtered: Array<{
        slotIndex: number;
        value: number;
        label: string;
      }> = [];
      let acc = 0;
      for (let i = 0; i < keys.length; i++) {
        const ps = getPeriodStartDate(keys[i], groupBy);
        if (ps > today) break;
        acc = Math.round((acc + values[i]) * 100) / 100;
        filtered.push({ slotIndex: i, value: acc, label: keys[i] });
      }
      return filtered;
    });

    const maxLen = Math.max(...processedSeries.map((s) => s.length));
    const rows: Array<Record<string, string | number | undefined>> = [];
    for (let i = 0; i < maxLen; i++) {
      const unit = groupBy === "month" ? "M" : "S";
      const row: Record<string, string | number | undefined> = {
        label: `${unit}+${i + 1}`,
      };
      allSeriesRaw.forEach(({ period }, si) => {
        const slot = processedSeries[si][i];
        // undefined (pas null) pour que recharts coupe la courbe proprement
        row[period.id] = slot !== undefined ? slot.value : undefined;
      });
      rows.push(row);
    }
    return rows;
  }, [allSeriesRaw, isSingleMode, metricConfig, groupBy]);

  // Summary stats for single mode (raw values)
  const summaryStats = useMemo(() => {
    if (!isSingleMode || allSeriesRaw.length === 0) return null;
    const values = allSeriesRaw[0].values;
    if (!values.length) return null;
    const nonZero = values.filter((v) => v > 0);
    const total = values.reduce((s, v) => s + v, 0);
    const max = Math.max(...values);
    const avg = nonZero.length ? total / nonZero.length : 0;
    return { total, max, avg, activePeriods: nonZero.length };
  }, [allSeriesRaw, isSingleMode]);

  // Year chip highlight per period
  const getSelectedYear = (period: Period): number | null =>
    availableYears.find(
      (y) => period.from === `${y}-01-01` && period.to === `${y}-12-31`,
    ) ?? null;

  return (
    <Wrapper>
      <PageTitle>Statistiques</PageTitle>
      <PageSubtitle>
        Analysez vos performances sur une période donnée
      </PageSubtitle>

      {/* ── Periods ── */}
      {periods.map((period, idx) => (
        <PeriodRow key={period.id}>
          <PeriodTopRow>
            <ColorDot $color={period.color} />
            <span
              style={{ fontSize: "0.85rem", color: "#ccc", fontWeight: 600 }}
            >
              {isSingleMode ? "Période" : `Période ${idx + 1}`}
            </span>
            {periods.length > 1 && (
              <RemoveButton onClick={() => removePeriod(period.id)}>
                Supprimer
              </RemoveButton>
            )}
          </PeriodTopRow>
          <PeriodBottomRow>
            <ControlGroup>
              <Label>Du</Label>
              <DateInput
                type="date"
                value={period.from}
                onChange={(e) =>
                  updatePeriod(period.id, { from: e.target.value })
                }
              />
            </ControlGroup>
            <ControlGroup>
              <Label>Au</Label>
              <DateInput
                type="date"
                value={period.to}
                onChange={(e) =>
                  updatePeriod(period.id, { to: e.target.value })
                }
              />
            </ControlGroup>
            {availableYears.length > 0 && (
              <ControlGroup>
                <Label>Année rapide</Label>
                <YearShortcutsRow style={{ margin: 0 }}>
                  {availableYears.map((year) => (
                    <YearChip
                      key={year}
                      $active={getSelectedYear(period) === year}
                      onClick={() => handleYearClick(period.id, year)}
                    >
                      {year}
                    </YearChip>
                  ))}
                </YearShortcutsRow>
              </ControlGroup>
            )}
          </PeriodBottomRow>
        </PeriodRow>
      ))}

      <AddPeriodButton onClick={addPeriod}>
        + Comparer avec une autre période
      </AddPeriodButton>

      {/* ── Metric + groupBy controls ── */}
      <ControlsRow>
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

      {/* ── Summary cards (single mode only) ── */}
      {isSingleMode && summaryStats && (
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

      {/* ── Chart ── */}
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
              {!isSingleMode && " — comparaison de périodes"}
            </span>
            <ChartMetricBadge>{metricConfig.unit}</ChartMetricBadge>
          </ChartTitle>
          <ResponsiveContainer width="100%" height={340}>
            {metricConfig.cumulative ? (
              /* ── Area chart (cumulatif) : courbes superposées ── */
              <AreaChart
                data={chartData}
                margin={{
                  top: 4,
                  right: 8,
                  left: 0,
                  bottom: groupBy === "week" ? 40 : 10,
                }}
              >
                <defs>
                  {periods.map((p) => (
                    <linearGradient
                      key={p.id}
                      id={`ag-${p.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={p.color} stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor={p.color}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  ))}
                </defs>
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
                  content={
                    <CustomTooltip
                      metricConfig={metricConfig}
                      periods={periods}
                      isSingleMode={isSingleMode}
                    />
                  }
                  cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
                />
                {periods.map((p) => (
                  <Area
                    key={p.id}
                    type="monotone"
                    dataKey={p.id}
                    stroke={p.color}
                    strokeWidth={2}
                    fill={`url(#ag-${p.id})`}
                    dot={false}
                    activeDot={{ r: 4, fill: p.color, strokeWidth: 0 }}
                    name={p.id}
                    connectNulls={false}
                  />
                ))}
              </AreaChart>
            ) : (
              /* ── Bar chart : barres côte à côte ── */
              <BarChart
                data={chartData}
                margin={{
                  top: 4,
                  right: 8,
                  left: 0,
                  bottom: groupBy === "week" ? 40 : 10,
                }}
              >
                <defs>
                  {periods.map((p) => (
                    <linearGradient
                      key={p.id}
                      id={`bg-${p.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={p.color} stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor={p.color}
                        stopOpacity={0.5}
                      />
                    </linearGradient>
                  ))}
                </defs>
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
                  content={
                    <CustomTooltip
                      metricConfig={metricConfig}
                      periods={periods}
                      isSingleMode={isSingleMode}
                    />
                  }
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                {periods.map((p) => (
                  <Bar
                    key={p.id}
                    dataKey={p.id}
                    fill={`url(#bg-${p.id})`}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isSingleMode ? 48 : 24}
                    name={p.id}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      )}
    </Wrapper>
  );
};

export default StatsTab;
