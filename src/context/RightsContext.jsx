// src/contexts/RightsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import apiService from '../components/services/apiService';

const RightsContext = createContext();

export const useRights = () => {
  const context = useContext(RightsContext);
  if (!context) {
    throw new Error('useRights must be used within RightsProvider');
  }
  return context;
};

export const RightsProvider = ({ children }) => {
  const { credentials } = useContext(AuthContext);
  const [userRights, setUserRights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to check if a value is truthy
  const isTruthy = (value) => {
    if (value === true || value === 1 || value === '1' || value === 'True' || value === 'true') {
      return true;
    }
    return false;
  };

  // Get user ID from credentials
  const getUserId = useCallback(() => {
    // Check if credentials exist and have Uid
    if (credentials?.Uid) {
      return credentials.Uid;
    }
    
    // Try to get from localStorage as fallback
    try {
      const storedCreds = localStorage.getItem("authCredentials");
      if (storedCreds) {
        const parsed = JSON.parse(storedCreds);
        if (parsed.Uid) {
          return parsed.Uid;
        }
      }
    } catch (e) {
      console.error("Error parsing authCredentials:", e);
    }
    
    return null;
  }, [credentials]);

  // Load all rights for the current user
  const loadUserRights = useCallback(async () => {
    const userId = getUserId();
    
    console.log('RightsContext - User ID:', userId);
    console.log('RightsContext - Credentials:', credentials);
    
    if (!userId) {
      console.log('RightsContext - No user ID found, skipping rights load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('RightsContext - Loading rights for user:', userId);
      const response = await apiService.getUserRightsBulk(userId);
      
      console.log('RightsContext - API Response:', response);
      
      if (response.success) {
        // Transform the rights data to ensure consistent boolean values
        const transformedRights = {};
        Object.entries(response.rights || {}).forEach(([menuId, rights]) => {
          transformedRights[menuId] = {
            IsAdd: isTruthy(rights.IsAdd),
            IsEdit: isTruthy(rights.IsEdit),
            IsDelete: isTruthy(rights.IsDelete),
            IsPrint: isTruthy(rights.IsPrint),
            IsPost: isTruthy(rights.IsPost),
            IsCopy: isTruthy(rights.IsCopy),
            IsSearch: isTruthy(rights.IsSearch),
            IsUpload: isTruthy(rights.IsUpload),
            IsBackDate: isTruthy(rights.IsBackDate),
            Isfavorite: isTruthy(rights.Isfavorite),
            IsActive: isTruthy(rights.IsActive)
          };
        });
        console.log('RightsContext - Transformed Rights:', transformedRights);
        setUserRights(transformedRights);
      } else {
        console.error('Failed to load user rights:', response.error);
        setError(response.error);
      }
    } catch (err) {
      console.error('Error loading user rights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getUserId, credentials]);

  useEffect(() => {
    loadUserRights();
  }, [loadUserRights]);

  // Check if user has permission for a specific menu and action
  const hasPermission = useCallback((menuId, action) => {
    if (!menuId) {
      return false;
    }
    
    const rights = userRights[menuId];
    if (!rights) {
      return false;
    }

    const actionMap = {
      'add': 'IsAdd',
      'create': 'IsAdd',
      'edit': 'IsEdit',
      'update': 'IsEdit',
      'delete': 'IsDelete',
      'remove': 'IsDelete',
      'print': 'IsPrint',
      'post': 'IsPost',
      'copy': 'IsCopy',
      'search': 'IsSearch',
      'upload': 'IsUpload',
      'favorite': 'Isfavorite',
      'backdate': 'IsBackDate',
      'active': 'IsActive',
      'view': 'IsSearch' // Using IsSearch for view permission
    };

    const field = actionMap[action.toLowerCase()];
    if (!field) return false;

    return rights[field] === true;
  }, [userRights]);

  const hasAnyPermission = useCallback((menuId, actions) => {
    return actions.some(action => hasPermission(menuId, action));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((menuId, actions) => {
    return actions.every(action => hasPermission(menuId, action));
  }, [hasPermission]);

  const refreshRights = useCallback(() => {
    loadUserRights();
  }, [loadUserRights]);

  const value = {
    userRights,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshRights
  };

  return (
    <RightsContext.Provider value={value}>
      {children}
    </RightsContext.Provider>
  );
};