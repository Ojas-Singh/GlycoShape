export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh-token',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_EMAIL: '/api/auth/verify-email'
    },
    USER: {
      PROFILE: '/api/user/profile',
      USAGE: '/api/user/usage-summary',
      CHANGE_PASSWORD: '/api/user/change-password'
    },
    SUBSCRIPTIONS: {
      PLANS: '/api/subscriptions/plans',
      CURRENT: '/api/subscriptions/current',
      SUBSCRIBE: '/api/subscriptions/subscribe',
      CANCEL: '/api/subscriptions/cancel',
      HISTORY: '/api/subscriptions/history'
    },
    LICENSES: {
      LIST: '/api/licenses/my-licenses',
      GENERATE: '/api/licenses/generate',
      ACTIVATE: '/api/licenses/activate',
      DEACTIVATE: '/api/licenses/deactivate',
      STATUS: '/api/licenses/status',
      REVOKE: '/api/licenses'
    },
    API_KEYS: {
      LIST: '/api/api-keys/list',
      GENERATE: '/api/api-keys/generate',
      UPDATE: '/api/api-keys',
      REVOKE: '/api/api-keys',
      ADD_CREDITS: '/api/api-keys/add-credits',
      USAGE: '/api/api-keys'
    }
  }
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
