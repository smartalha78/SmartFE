// src/utils/corsHelper.js
/**
 * CORS Helper - Ensures all requests have proper headers
 */

export const corsFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authCredentials');
      localStorage.removeItem('appData');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    return response;
  } catch (error) {
    console.error('CORS fetch error:', error);
    throw error;
  }
};

// Helper for JSON responses
export const corsJson = async (url, options = {}) => {
  const response = await corsFetch(url, options);
  return response.json();
};