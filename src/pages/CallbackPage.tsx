
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { exchangeToken } from '../api/strava';
import styled from '@emotion/styled';

const CallbackContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
`;

const CallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error("Strava OAuth Error:", error);
            navigate('/login');
            return;
        }

        if (code) {
            exchangeToken(code)
                .then(() => {
                    navigate('/dashboard');
                })
                .catch(err => {
                    console.error("Token exchange failed:", err);
                    navigate('/login');
                });
        }
    }, [searchParams, navigate]);

    return (
        <CallbackContainer>
            <p>Loading...</p>
        </CallbackContainer>
    );
};

export default CallbackPage;
