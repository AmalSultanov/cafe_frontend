interface AppConfig {
  apiBaseUrl: string;
  accessTokenLifetime: number;
  tokenRefreshBeforeExpiry: number;
  tokenRefreshInterval: number;
  isDevelopment: boolean;
  debugMode: boolean;
}

const getEnvVar = (key: string, fallback: string): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value ?? fallback;
};

const getEnvNumber = (key: string, fallback: number): number => {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
};


const calculateRefreshInterval = (
  accessTokenLifetime: number,
  refreshBeforeExpiry: number
): number => {
  const lifetimeMs = accessTokenLifetime * 60 * 1000;
  const bufferMs = refreshBeforeExpiry * 60 * 1000;
  return Math.max(lifetimeMs - bufferMs, 60 * 1000);
};

export const config: AppConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api/v1'),
  accessTokenLifetime: getEnvNumber('VITE_ACCESS_TOKEN_LIFETIME', 15),
  tokenRefreshBeforeExpiry: getEnvNumber('VITE_TOKEN_REFRESH_BEFORE_EXPIRY', 1),
  tokenRefreshInterval: getEnvNumber('VITE_TOKEN_REFRESH_INTERVAL', 0) > 0
    ? getEnvNumber('VITE_TOKEN_REFRESH_INTERVAL', 0) * 60 * 1000
    : calculateRefreshInterval(
        getEnvNumber('VITE_ACCESS_TOKEN_LIFETIME', 15),
        getEnvNumber('VITE_TOKEN_REFRESH_BEFORE_EXPIRY', 1)
      ),
  isDevelopment: getEnvVar('VITE_NODE_ENV', 'development') === 'development',
  debugMode: getEnvVar('VITE_DEBUG_MODE', 'false') === 'true',
};

export const {
  apiBaseUrl,
  accessTokenLifetime,
  tokenRefreshBeforeExpiry,
  tokenRefreshInterval,
  isDevelopment,
  debugMode,
} = config;
