// components/RefreshButton.jsx
import React, { useState } from 'react';
import { FaSyncAlt, FaSpinner } from 'react-icons/fa';
import './RefreshButton.css';

const RefreshButton = ({ onRefresh, label = 'Refresh', size = 'medium', className = '' }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sizeClass = `refresh-btn-${size}`;

  return (
    <button
      className={`refresh-btn ${sizeClass} ${refreshing ? 'refreshing' : ''} ${className}`}
      onClick={handleRefresh}
      disabled={refreshing}
      title="Refresh Data"
    >
      {refreshing ? <FaSpinner className="spinner" /> : <FaSyncAlt />}
      {label && <span>{refreshing ? 'Refreshing...' : label}</span>}
    </button>
  );
};

export default RefreshButton;