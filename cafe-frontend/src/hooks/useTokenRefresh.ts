import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tokenRefreshInterval, isDevelopment } from '../config/env';

export const useTokenRefresh = () => {
  const { isAuthenticated, refreshAuth, validateUser } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshFailureCountRef = useRef(0);

  useEffect(() => {
    if (isAuthenticated) {
      refreshFailureCountRef.current = 0;
      intervalRef.current = setInterval(async () => {
        if (isRefreshingRef.current) {
          return;
        }

        if (refreshFailureCountRef.current >= 3) {
          console.log('Too many refresh failures, stopping automatic refresh');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        try {
          isRefreshingRef.current = true;
          await refreshAuth();
          refreshFailureCountRef.current = 0;

          if (isDevelopment) {
            console.log(`🔄 Token refreshed successfully. Next refresh in ${tokenRefreshInterval / 1000 / 60} minutes`);
          }
        } catch (error) {
          refreshFailureCountRef.current += 1;
          console.error(`Token refresh failed (attempt ${refreshFailureCountRef.current}/3):`, error);
        } finally {
          isRefreshingRef.current = false;
        }
      }, tokenRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isAuthenticated, refreshAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [validateUser, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
