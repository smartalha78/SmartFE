// hooks/useDataLoader.js
import { useState, useCallback, useRef } from 'react';

const useDataLoader = (apiBase, options = {}) => {
  const {
    cacheTimeout = 300000, // 5 minutes default
    onError = null
  } = options;

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const cache = useRef(new Map());

  const fetchJson = async (url, fetchOptions = {}) => {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(fetchOptions.headers || {}) },
        ...fetchOptions,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return await res.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  const loadData = useCallback(async (key, fetchFunction, options = {}) => {
    const {
      forceRefresh = false,
      showLoading = true,
      cacheKey = key
    } = options;

    // Check cache
    if (!forceRefresh) {
      const cached = cache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data;
      }
    }

    if (showLoading) {
      setLoading(prev => ({ ...prev, [key]: true }));
    }
    setErrors(prev => ({ ...prev, [key]: null }));

    try {
      const data = await fetchFunction();
      
      // Update cache
      cache.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: error.message }));
      if (onError) onError(key, error);
      throw error;
    } finally {
      if (showLoading) {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    }
  }, [cacheTimeout, onError]);

  const clearCache = useCallback((key) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  const getLoading = useCallback((key) => loading[key] || false, [loading]);
  const getError = useCallback((key) => errors[key] || null, [errors]);

  return {
    loadData,
    clearCache,
    getLoading,
    getError,
    fetchJson
  };
};

export default useDataLoader;