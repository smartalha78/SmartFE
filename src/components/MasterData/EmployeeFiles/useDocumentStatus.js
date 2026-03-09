// hooks/useDocumentStatus.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

export const useDocumentStatus = (menuId) => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  const loadStatuses = useCallback(async () => {
    if (!menuId) return;
    
    setLoading(true);
    try {
      const response = await apiService.getDocumentStatus(menuId);
      
      if (response?.success) {
        const statusList = response.rows || [];
        setStatuses(statusList);
        
        // Create mapping for nFilterSort values
        const map = {};
        statusList.forEach(status => {
          if (status.nFilterSort) {
            const filters = status.nFilterSort.toString().split(',').map(f => f.trim());
            filters.forEach(filter => {
              if (filter) map[filter] = status.ccode;
            });
          }
        });
        setStatusMap(map);
        
        // Set default selected status (usually ccode=1)
        const defaultStatus = statusList.find(s => s.ccode === 1) || statusList[0];
        if (defaultStatus) {
          setSelectedStatus(defaultStatus.ccode);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading document statuses:', err);
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const getStatusByFilterSort = useCallback((filterSortValue) => {
    if (!filterSortValue) return selectedStatus;
    return statusMap[filterSortValue.toString()] || selectedStatus;
  }, [statusMap, selectedStatus]);

  return {
    statuses,
    loading,
    error,
    selectedStatus,
    setSelectedStatus,
    getStatusByFilterSort,
    refresh: loadStatuses
  };
};