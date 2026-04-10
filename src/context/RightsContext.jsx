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

  // Helper function to check if a value is truthy (handles 1, '1', true, 'True', 'true')
  const isTruthy = (value) => {
    if (value === null || value === undefined) return false;
    if (value === true || value === 1 || value === '1' || value === 'True' || value === 'true') {
      return true;
    }
    return false;
  };

  // Get user ID from credentials
  const getUserId = useCallback(() => {
    // Check multiple possible field names
    if (credentials?.Uid) return String(credentials.Uid);
    if (credentials?.uid) return String(credentials.uid);
    if (credentials?.user_id) return String(credentials.user_id);
    if (credentials?.userId) return String(credentials.userId);
    
    // Try to get from localStorage as fallback
    try {
      const storedCreds = localStorage.getItem("authCredentials");
      if (storedCreds) {
        const parsed = JSON.parse(storedCreds);
        if (parsed.Uid) return String(parsed.Uid);
        if (parsed.uid) return String(parsed.uid);
        if (parsed.user_id) return String(parsed.user_id);
      }
      
      const storedUid = localStorage.getItem('userUid');
      if (storedUid) return String(storedUid);
    } catch (e) {
      console.error("Error getting user ID:", e);
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
      
      if (response.success && response.rights) {
        // Transform the rights data - keep menuId as string
        const transformedRights = {};
        
        // response.rights is an object with menuId as keys
        Object.entries(response.rights).forEach(([menuId, rights]) => {
          // Convert menuId to string for consistent comparison
          const menuIdStr = String(menuId);
          
          transformedRights[menuIdStr] = {
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
            IsActive: isTruthy(rights.IsActive),
            isDesktop: isTruthy(rights.isDesktop)
          };
        });
        
        console.log('RightsContext - Transformed Rights:', transformedRights);
        console.log('RightsContext - Rights for menu 01:', transformedRights['01']);
        setUserRights(transformedRights);
      } else {
        console.error('Failed to load user rights:', response.error);
        setError(response.error || 'Failed to load user rights');
        setUserRights({});
      }
    } catch (err) {
      console.error('Error loading user rights:', err);
      setError(err.message);
      setUserRights({});
    } finally {
      setLoading(false);
    }
  }, [getUserId, credentials]);

  useEffect(() => {
    loadUserRights();
  }, [loadUserRights]);

  // Check if user has permission for a specific menu and action
  const hasPermission = useCallback((menuId, action) => {
    // During loading, return false to prevent actions
    if (loading) {
      console.log(`Permission check during loading - Menu: ${menuId}, Action: ${action}, Result: false`);
      return false;
    }
    
    if (!menuId) {
      console.warn('hasPermission called without menuId');
      return false;
    }
    
    // Convert menuId to string for consistent comparison
    const menuIdStr = String(menuId);
    const rights = userRights[menuIdStr];
    
    if (!rights) {
      console.log(`No rights found for menu ${menuIdStr}, denying all permissions`);
      return false;
    }

    // Map action names to database column names
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
      'view': 'IsSearch',
      'upload': 'IsUpload',
      'favorite': 'Isfavorite',
      'backdate': 'IsBackDate',
      'cancel': 'IsBackDate',  // Cancel uses backdate permission
      'active': 'IsActive'
    };

    const dbColumn = actionMap[action.toLowerCase()];
    if (!dbColumn) {
      console.warn(`Unknown action: ${action}`);
      return false;
    }

    const hasPerm = rights[dbColumn] === true;
    console.log(`Permission check - Menu: ${menuIdStr}, Action: ${action} -> ${dbColumn}, Result: ${hasPerm}`);
    return hasPerm;
  }, [userRights, loading]);

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