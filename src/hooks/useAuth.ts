import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { setTokens, logout as logoutAction } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    athlete?: any;
  }) => {
    dispatch(setTokens(tokens));
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt,
    athlete: auth.athlete,
    login,
    logout,
  };
}
