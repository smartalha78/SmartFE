// src/utils/api.js
import API_BASE1 from '../config';

export const apiCall = async (endpoint, options = {}) => {
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
    const response = await fetch(`${API_BASE1}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('authCredentials');
      localStorage.removeItem('userUid');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Helper for JSON responses
export const apiJson = async (endpoint, options = {}) => {
  const response = await apiCall(endpoint, options);
  return await response.json();
};