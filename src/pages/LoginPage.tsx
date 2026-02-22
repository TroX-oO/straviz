
import styled from '@emotion/styled';
import { useAuth } from '../hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoginButton = styled(Link)`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e54502;
  }
`;

const LoginPage = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <LoginContainer>
            <h1>Strava Dashboard</h1>
            <p>Please login to continue</p>
            <LoginButton to="/">
                Login with Strava
            </LoginButton>
        </LoginContainer>
    );
};

export default LoginPage;
