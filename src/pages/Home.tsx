import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { redirectToStravaAuthorize } from '../api/strava';

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

const HomeContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
`;

const HeroSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80px 10%;
  min-height: 80vh;
  gap: 60px;

  @media (max-width: 968px) {
    flex-direction: column;
    text-align: center;
    padding: 60px 5%;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  max-width: 600px;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  margin-bottom: 20px;
  font-weight: 800;

  @media (max-width: 968px) {
    font-size: 2.5rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(90deg, #fc4c02, #ff6b35, #f7931e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #e0e0e0;
  margin-bottom: 15px;
  font-weight: 500;
`;

const HeroDescription = styled.p`
  font-size: 1.1rem;
  color: #a0a0a0;
  line-height: 1.7;
  margin-bottom: 40px;
`;

const StravaConnectBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #fc4c02 0%, #ff6b35 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(252, 76, 2, 0.4);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(252, 76, 2, 0.5);
  }
`;

const StravaIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const HeroVisual = styled.div`
  flex: 1;
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 968px) {
    width: 100%;
    height: 300px;
  }
`;

const FloatingCard = styled.div<{ delay?: number; top?: string; bottom?: string; left?: string; right?: string }>`
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: ${float} 3s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay || 0}s;
  top: ${({ top }) => top};
  bottom: ${({ bottom }) => bottom};
  left: ${({ left }) => left};
  right: ${({ right }) => right};
`;

const CardIcon = styled.span`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const CardValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fc4c02;
`;

const CardLabel = styled.span`
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-top: 5px;
`;

const FeaturesSection = styled.div`
  padding: 80px 10%;
  background: rgba(0, 0, 0, 0.2);

  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 50px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(252, 76, 2, 0.3);
  }

  h3 {
    font-size: 1.3rem;
    margin-bottom: 15px;
    color: #fc4c02;
  }

  p {
    color: #a0a0a0;
    line-height: 1.6;
  }
`;

const FeatureIcon = styled.span`
  font-size: 3rem;
  display: block;
  margin-bottom: 20px;
`;

const Home: React.FC = () => {
  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  return (
    <HomeContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            <GradientText>StravaViz</GradientText>
          </HeroTitle>
          <HeroSubtitle>
            Visualisez vos performances sportives comme jamais auparavant
          </HeroSubtitle>
          <HeroDescription>
            Connectez votre compte Strava et découvrez des analyses détaillées, 
            des graphiques interactifs et des insights sur vos activités.
          </HeroDescription>
          
          <StravaConnectBtn onClick={redirectToStravaAuthorize}>
            <StravaIcon viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </StravaIcon>
            Se connecter avec Strava
          </StravaConnectBtn>
        </HeroContent>
        
        <HeroVisual>
          <FloatingCard delay={0} top="20%" left="10%">
            <CardIcon>🚴</CardIcon>
            <CardValue>245 km</CardValue>
            <CardLabel>Cette semaine</CardLabel>
          </FloatingCard>
          <FloatingCard delay={1} top="50%" right="10%">
            <CardIcon>🏃</CardIcon>
            <CardValue>42 activités</CardValue>
            <CardLabel>Ce mois</CardLabel>
          </FloatingCard>
          <FloatingCard delay={2} bottom="10%" left="30%">
            <CardIcon>⚡</CardIcon>
            <CardValue>+15%</CardValue>
            <CardLabel>Progression</CardLabel>
          </FloatingCard>
        </HeroVisual>
      </HeroSection>
      
      <FeaturesSection>
        <h2>Fonctionnalités</h2>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>📊</FeatureIcon>
            <h3>Analyses détaillées</h3>
            <p>Explorez vos données avec des graphiques interactifs</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🗺️</FeatureIcon>
            <h3>Cartes interactives</h3>
            <p>Visualisez tous vos parcours sur une carte</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>📈</FeatureIcon>
            <h3>Suivi de progression</h3>
            <p>Suivez votre évolution au fil du temps</p>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
    </HomeContainer>
  );
};

export default Home;
