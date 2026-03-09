// contexts/ScreenContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../components/services/apiService';

const ScreenContext = createContext();

export const useScreen = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within ScreenProvider');
  }
  return context;
};

export const ScreenProvider = ({ children, screenName, userId }) => {
  const [screenConfig, setScreenConfig] = useState(null);
  const [userRights, setUserRights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [hasRights, setHasRights] = useState(false);

  // Load screen configuration
  const loadScreenConfig = useCallback(async () => {
    if (!screenName) {
      setError('Screen name is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getScreenConfig(screenName);
      
      if (response.success) {
        setScreenConfig(response.screen);
        setMenuId(response.screen.id);
        setError(null);
      } else {
        setError(response.error || 'Failed to load screen configuration');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading screen config:', err);
    }
  }, [screenName]);

  // Load user rights for this screen
  const loadUserRights = useCallback(async () => {
    if (!userId || !menuId) {
      setUserRights(null);
      setHasRights(false);
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.getUserRights(userId, menuId);
      
      if (response.success) {
        setUserRights(response.rights);
        setHasRights(response.hasRights);
      } else {
        console.error('Error loading user rights:', response.error);
      }
    } catch (err) {
      console.error('Error loading user rights:', err);
    }
  }, [userId, menuId]);

  // Check if user has specific permission
  const can = useCallback((permission) => {
    if (!userRights) return false;
    
    // Map permission names to database fields
    const permissionMap = {
      'add': 'IsAdd',
      'create': 'IsAdd',
      'edit': 'IsEdit',
      'update': 'IsEdit',
      'delete': 'IsDelete',
      'remove': 'IsDelete',
      'view': 'IsView',
      'read': 'IsView',
      'print': 'IsPrint',
      'post': 'IsPost',
      'unpost': 'IsUnpost',
      'copy': 'IsCopy',
      'search': 'IsSearch',
      'upload': 'IsUpload',
      'download': 'IsDownload',
      'email': 'IsEmail',
      'favorite': 'IsFavorite',
      'backdate': 'IsBackDate'
    };
    
    const field = permissionMap[permission.toLowerCase()];
    if (!field) return false;
    
    return userRights[field] === true || userRights[field] === 1 || userRights[field] === "1" || userRights[field] === "true";
  }, [userRights]);

  // Check if user has any of the given permissions
  const canAny = useCallback((permissions) => {
    return permissions.some(permission => can(permission));
  }, [can]);

  // Check if user has all of the given permissions
  const canAll = useCallback((permissions) => {
    return permissions.every(permission => can(permission));
  }, [can]);

  // Load data when dependencies change
  useEffect(() => {
    loadScreenConfig();
  }, [loadScreenConfig]);

  useEffect(() => {
    if (menuId) {
      loadUserRights();
    }
  }, [menuId, loadUserRights]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadScreenConfig();
    if (menuId) {
      await loadUserRights();
    }
  }, [loadScreenConfig, loadUserRights, menuId]);

  const value = {
    screenConfig,
    userRights,
    menuId,
    loading,
    error,
    hasRights,
    can,
    canAny,
    canAll,
    refresh,
    userId
  };

  return (
    <ScreenContext.Provider value={value}>
      {children}
    </ScreenContext.Provider>
  );
};