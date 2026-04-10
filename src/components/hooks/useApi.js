// src/hooks/useApi.js
import { useCallback } from 'react';
import apiService from '../services/apiService';

export const useApi = () => {
  const post = useCallback(async (endpoint, data) => {
    try {
      return await apiService.post(endpoint, data);
    } catch (error) {
      console.error(`API POST error to ${endpoint}:`, error);
      throw error;
    }
  }, []);

  const get = useCallback(async (endpoint) => {
    try {
      return await apiService.get(endpoint);
    } catch (error) {
      console.error(`API GET error to ${endpoint}:`, error);
      throw error;
    }
  }, []);

  const put = useCallback(async (endpoint, data) => {
    try {
      return await apiService.put(endpoint, data);
    } catch (error) {
      console.error(`API PUT error to ${endpoint}:`, error);
      throw error;
    }
  }, []);

  const del = useCallback(async (endpoint) => {
    try {
      return await apiService.delete(endpoint);
    } catch (error) {
      console.error(`API DELETE error to ${endpoint}:`, error);
      throw error;
    }
  }, []);

  return { post, get, put, delete: del };
};