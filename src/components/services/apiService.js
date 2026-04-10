// src/components/services/apiService.js
import API_BASE1 from "../../config"

class ApiService {
  constructor() {
    this.baseURL = API_BASE1;
  }

  getToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      const sessionToken = sessionStorage.getItem('authToken');
      if (sessionToken) {
        return sessionToken;
      }
    }
    return token;
  }

  getHeaders() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        console.error('Unauthorized - Token invalid or expired');
        throw new Error('Unauthorized: Token invalid or expired');
      }
      
      return response;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async post(endpoint, data, customHeaders = {}) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders,
    });
    return response.json();
  }

  async getUserRightsBulk(userId) {
    try {
      const response = await this.post('/user-rights/bulk-get', { userId });
      return response;
    } catch (error) {
      console.error('Error in getUserRightsBulk:', error);
      return { success: false, error: error.message, rights: {} };
    }
  }

  async getScreenConfig(screenName) {
    try {
      const response = await this.post('/screen/get-config', { screenName });
      return response;
    } catch (error) {
      console.error('Error in getScreenConfig:', error);
      return { success: false, error: error.message };
    }
  }

  // Add other methods as needed...
}

export default new ApiService();