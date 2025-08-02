import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const useAuthenticatedFetch = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  const authenticatedFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    const requestOptions: FetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // Add authorization header if token exists
    if (accessToken) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${accessToken}`
      };
    }

    let response = await fetch(url, requestOptions);

    // If unauthorized, try to refresh token
    if (response.status === 401 && accessToken) {
      try {
        await refreshAccessToken();
        
        // Retry the request with new token
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${accessToken}`
        };
        response = await fetch(url, requestOptions);
      } catch (error) {
        // Refresh failed, logout user
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }, [accessToken, refreshAccessToken, logout]);

  return authenticatedFetch;
};
