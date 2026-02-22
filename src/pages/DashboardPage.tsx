import React from 'react';
import styled from '@emotion/styled';
import { useActivities, useStats, useSettings } from '../hooks';
import type { MonthlyData } from '../hooks';

// Styled components
const Container = styled.div`
  padding: 40px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #fc4c02, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const StatIcon = styled.span`
  font-size: 2rem;
  display: block;
  margin-bottom: 12px;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #fc4c02;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #a0a0a0;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  color: #e0e0e0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  font-size: 1.5rem;
`;

const MonthlyRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MonthlyDistance = styled.span`
  color: #fc4c02;
`;

// Utility functions
const formatDistance = (meters: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

const formatElevation = (meters: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    return `${feet.toFixed(0)} ft`;
  }
  return `${meters.toFixed(0)} m`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const DashboardPage: React.FC = () => {
  const { loading: activitiesLoading, totalActivities, activities } = useActivities();
  const { totalStats, monthlyData, loading: statsLoading } = useStats();
  const { units } = useSettings();

  const loading = activitiesLoading || statsLoading;

  if (loading && totalActivities === 0) {
    return <LoadingContainer>Chargement des données...</LoadingContainer>;
  }

  console.log(activities)

  return (
    <Container>
      <Header>
        <Title>Dashboard</Title>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon>🛣️</StatIcon>
          <StatValue>{formatDistance(totalStats.totalDistance, units)}</StatValue>
          <StatLabel>Distance totale</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>⛰️</StatIcon>
          <StatValue>{formatElevation(totalStats.totalElevation, units)}</StatValue>
          <StatLabel>Dénivelé total</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>⏱️</StatIcon>
          <StatValue>{formatDuration(totalStats.totalMovingTime)}</StatValue>
          <StatLabel>Temps total</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>🏃</StatIcon>
          <StatValue>{totalStats.totalActivities}</StatValue>
          <StatLabel>Activités</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>📅</StatIcon>
          <StatValue>{totalStats.activeDays}</StatValue>
          <StatLabel>Jours actifs</StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Distance par mois</ChartTitle>
          <div style={{ color: '#a0a0a0' }}>
            {monthlyData.map((data: MonthlyData) => (
              <MonthlyRow key={data.month}>
                <span>{data.month}</span>
                <MonthlyDistance>{formatDistance(data.distance, units)}</MonthlyDistance>
              </MonthlyRow>
            ))}
          </div>
        </ChartCard>
        <ChartCard>
          <ChartTitle>Types d'activités</ChartTitle>
          <div style={{ color: '#a0a0a0' }}>
            {totalActivities === 0 ? (
              <p>Aucune activité trouvée. Synchronisez vos données Strava.</p>
            ) : (
              <p>Données disponibles après synchronisation.</p>
            )}
          </div>
        </ChartCard>
      </ChartsGrid>
    </Container>
  );
};

export default DashboardPage;
