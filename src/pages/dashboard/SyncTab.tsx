import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useSync } from '../../hooks';

// ─── Animations ──────────────────────────────────────────────────────────────

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const fillBar = (width: string) => keyframes`
  from { width: 0; }
  to   { width: ${width}; }
`;

// ─── Styled components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  max-width: 680px;
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
  margin: 0 0 32px 0;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;

const SyncInfo = styled.div``;

const SyncLabel = styled.div`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-bottom: 4px;
`;

const SyncDate = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ededed;
`;

const TotalCount = styled.div`
  font-size: 0.85rem;
  color: #a0a0a0;
  margin-top: 4px;
`;

const SyncButton = styled.button<{ $syncing: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: ${({ $syncing }) =>
    $syncing
      ? 'rgba(252, 76, 2, 0.3)'
      : 'linear-gradient(135deg, #fc4c02 0%, #ff6b35 100%)'};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: ${({ $syncing }) => ($syncing ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(252, 76, 2, 0.4);
  }
`;

const SpinIcon = styled.span`
  display: inline-block;
  animation: ${spin} 1s linear infinite;
`;

const ProgressSection = styled.div`
  margin-top: 20px;
`;

const ProgressLabel = styled.div`
  font-size: 0.85rem;
  color: #a0a0a0;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #fc4c02, #ff6b35);
  border-radius: 3px;
  width: ${({ $progress }) => `${Math.min($progress, 100)}%`};
  transition: width 0.3s ease;
`;

const ErrorBox = styled.div`
  background: rgba(211, 47, 47, 0.15);
  border: 1px solid rgba(211, 47, 47, 0.4);
  border-radius: 10px;
  padding: 14px 18px;
  color: #f44336;
  font-size: 0.9rem;
  margin-top: 16px;
`;

const YearTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const YearRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const YearLabel = styled.span`
  width: 48px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ededed;
  flex-shrink: 0;
`;

const YearBarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
`;

const YearBarFill = styled.div<{ $pct: string }>`
  height: 100%;
  background: linear-gradient(90deg, #fc4c02, #ff6b35);
  border-radius: 4px;
  width: ${({ $pct }) => $pct};
  animation: ${({ $pct }) => fillBar($pct)} 0.6s ease-out both;
`;

const YearCount = styled.span`
  width: 64px;
  text-align: right;
  font-size: 0.85rem;
  color: #a0a0a0;
  flex-shrink: 0;
`;

const EmptyState = styled.p`
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSyncDate(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const SyncTab: React.FC = () => {
  const { syncing, progress, error, stats, sync } = useSync();
  const { lastSync, totalCached, activitiesByYear } = stats;

  const maxCount = Math.max(...activitiesByYear.map((y) => y.count), 1);

  return (
    <Wrapper>
      <PageTitle>Synchronisation</PageTitle>
      <PageSubtitle>
        Récupère l'ensemble de tes activités Strava et les enregistre localement.
      </PageSubtitle>

      {/* Status + Sync button */}
      <Card>
        <CardTitle>Dernière synchronisation</CardTitle>
        <StatusRow>
          <SyncInfo>
            <SyncLabel>Date</SyncLabel>
            <SyncDate>
              {lastSync ? formatSyncDate(lastSync) : 'Jamais synchronisé'}
            </SyncDate>
            {totalCached > 0 && (
              <TotalCount>{totalCached} activité{totalCached > 1 ? 's' : ''} en cache</TotalCount>
            )}
          </SyncInfo>

          <SyncButton $syncing={syncing} onClick={sync} disabled={syncing}>
            {syncing ? (
              <>
                <SpinIcon>⟳</SpinIcon>
                Synchronisation…
              </>
            ) : (
              <>↻ Synchroniser</>
            )}
          </SyncButton>
        </StatusRow>

        {syncing && (
          <ProgressSection>
            <ProgressLabel>
              <span>Activités récupérées</span>
              <span>{progress}</span>
            </ProgressLabel>
            <ProgressTrack>
              <ProgressFill $progress={totalCached > 0 ? (progress / totalCached) * 100 : 50} />
            </ProgressTrack>
          </ProgressSection>
        )}

        {error && <ErrorBox>⚠ {error}</ErrorBox>}
      </Card>

      {/* Year breakdown */}
      <Card>
        <CardTitle>Activités par année</CardTitle>
        {activitiesByYear.length === 0 ? (
          <EmptyState>Aucune donnée — lancez une synchronisation.</EmptyState>
        ) : (
          <YearTable>
            {activitiesByYear.map(({ year, count }) => (
              <YearRow key={year}>
                <YearLabel>{year}</YearLabel>
                <YearBarTrack>
                  <YearBarFill $pct={`${(count / maxCount) * 100}%`} />
                </YearBarTrack>
                <YearCount>{count} activité{count > 1 ? 's' : ''}</YearCount>
              </YearRow>
            ))}
          </YearTable>
        )}
      </Card>
    </Wrapper>
  );
};

export default SyncTab;
