import React, { useEffect, useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { useStoredActivities } from '../../hooks';
import { useSettings } from '../../hooks';
import type { Activity } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<
  Activity,
  | 'start_date'
  | 'name'
  | 'sport_type'
  | 'distance'
  | 'moving_time'
  | 'total_elevation_gain'
  | 'average_speed'
  | 'average_heartrate'
>;

type SortDir = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  dir: SortDir;
}

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
  margin: 0 0 24px 0;
`;

const Meta = styled.div`
  font-size: 0.82rem;
  color: #666;
  margin-bottom: 16px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 800px;
`;

const Thead = styled.thead`
  background: rgba(255, 255, 255, 0.06);
`;

const Th = styled.th<{ $active: boolean; $sortable: boolean }>`
  padding: 14px 16px;
  text-align: left;
  color: ${({ $active }) => ($active ? '#fc4c02' : '#a0a0a0')};
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: ${({ $sortable }) => ($sortable ? 'pointer' : 'default')};
  white-space: nowrap;
  user-select: none;
  transition: color 0.2s;

  &:hover {
    color: ${({ $sortable }) => ($sortable ? '#ededed' : '#a0a0a0')};
  }
`;

const SortIcon = styled.span`
  margin-left: 4px;
  font-size: 0.7rem;
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.15s;

  &:hover {
    background: rgba(252, 76, 2, 0.06);
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  color: #e0e0e0;
  white-space: nowrap;
`;

const TdMuted = styled(Td)`
  color: #888;
`;

const TypeBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(252, 76, 2, 0.18);
  color: #fc4c02;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #666;

  p {
    font-size: 0.95rem;
    margin: 8px 0 0;
  }
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 12px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #a0a0a0;
  font-size: 0.95rem;
`;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDistance(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') return `${(meters / 1609.34).toFixed(1)} mi`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function fmtElevation(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') return `${(meters * 3.28084).toFixed(0)} ft`;
  return `${meters.toFixed(0)} m`;
}

function fmtSpeed(mps: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') return `${(mps * 2.23694).toFixed(1)} mph`;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

// ─── Sorting helpers ──────────────────────────────────────────────────────────

function getSortValue(a: Activity, key: SortKey): number | string {
  const v = a[key];
  if (v === undefined || v === null) return -Infinity;
  return v as number | string;
}

function sortActivities(activities: Activity[], config: SortConfig): Activity[] {
  return [...activities].sort((a, b) => {
    const av = getSortValue(a, config.key);
    const bv = getSortValue(b, config.key);
    let cmp = 0;
    if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv, 'fr');
    } else {
      cmp = (av as number) < (bv as number) ? -1 : (av as number) > (bv as number) ? 1 : 0;
    }
    return config.dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Column definitions ───────────────────────────────────────────────────────

interface ColDef {
  key: SortKey;
  label: string;
  sortable: true;
}

const COLUMNS: ColDef[] = [
  { key: 'start_date', label: 'Date', sortable: true },
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'sport_type', label: 'Type', sortable: true },
  { key: 'distance', label: 'Distance', sortable: true },
  { key: 'moving_time', label: 'Durée', sortable: true },
  { key: 'total_elevation_gain', label: 'Dénivelé+', sortable: true },
  { key: 'average_speed', label: 'Vitesse moy.', sortable: true },
  { key: 'average_heartrate', label: 'FC moy.', sortable: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

const ActivitiesTab: React.FC = () => {
  const { activities, loading, loaded, load } = useStoredActivities();
  const { units } = useSettings();

  const [sort, setSort] = useState<SortConfig>({ key: 'start_date', dir: 'desc' });

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortActivities(activities, sort), [activities, sort]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  }

  function sortIcon(key: SortKey): string {
    if (sort.key !== key) return '↕';
    return sort.dir === 'asc' ? '↑' : '↓';
  }

  function renderCell(activity: Activity, key: SortKey): React.ReactNode {
    switch (key) {
      case 'start_date':
        return <TdMuted>{fmtDate(activity.start_date)}</TdMuted>;
      case 'name':
        return <Td>{activity.name}</Td>;
      case 'sport_type':
        return (
          <Td>
            <TypeBadge>{activity.sport_type}</TypeBadge>
          </Td>
        );
      case 'distance':
        return <Td>{fmtDistance(activity.distance, units)}</Td>;
      case 'moving_time':
        return <Td>{fmtDuration(activity.moving_time)}</Td>;
      case 'total_elevation_gain':
        return <Td>{fmtElevation(activity.total_elevation_gain, units)}</Td>;
      case 'average_speed':
        return <Td>{fmtSpeed(activity.average_speed, units)}</Td>;
      case 'average_heartrate':
        return (
          <TdMuted>
            {activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '—'}
          </TdMuted>
        );
      default:
        return <Td>—</Td>;
    }
  }

  return (
    <Wrapper>
      <PageTitle>Activités</PageTitle>
      <PageSubtitle>
        Toutes tes activités issues du cache local. Aucun appel réseau.
      </PageSubtitle>

      {loading && <LoadingState>Chargement depuis le cache…</LoadingState>}

      {loaded && activities.length === 0 && (
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <strong>Aucune activité en cache</strong>
          <p>Rendez-vous dans l'onglet Synchronisation pour récupérer vos données Strava.</p>
        </EmptyState>
      )}

      {loaded && activities.length > 0 && (
        <>
          <Meta>{sorted.length} activité{sorted.length > 1 ? 's' : ''}</Meta>
          <TableWrapper>
            <Table>
              <Thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <Th
                      key={col.key}
                      $active={sort.key === col.key}
                      $sortable={col.sortable}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon>{sortIcon(col.key)}</SortIcon>
                    </Th>
                  ))}
                </tr>
              </Thead>
              <Tbody>
                {sorted.map((activity) => (
                  <Tr key={activity.id}>
                    {COLUMNS.map((col) => (
                      <React.Fragment key={col.key}>
                        {renderCell(activity, col.key)}
                      </React.Fragment>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableWrapper>
        </>
      )}
    </Wrapper>
  );
};

export default ActivitiesTab;
