// DocumentStatusBar.jsx - Updated with All option
import React from 'react';
import { FaFile, FaCheckCircle, FaClock, FaBan, FaExclamationTriangle, FaList } from 'react-icons/fa';
import './DocumentStatusBar.css';

const DocumentStatusBar = ({
  statuses = [],
  selectedStatus,
  onStatusClick,
  loading = false,
  showCounts = false,
  counts = {},
  showAllOption = true,
  allOptionLabel = "All",
  allOptionIcon = <FaList />
}) => {
  const getStatusIcon = (status) => {
    // Handle "all" option
    if (status.ccode === 'all' || status.ccode === -1) {
      return allOptionIcon;
    }

    const name = status.cname?.toLowerCase() || '';
    
    if (name.includes('active')) return <FaCheckCircle />;
    if (name.includes('inactive')) return <FaBan />;
    if (name.includes('retire')) return <FaClock />;
    if (name.includes('suspend')) return <FaExclamationTriangle />;
    if (name.includes('post')) return <FaCheckCircle />;
    if (name.includes('unpost')) return <FaClock />;
    
    return <FaFile />;
  };

  const getStatusColor = (status) => {
    // Handle "all" option
    if (status.ccode === 'all' || status.ccode === -1) {
      return '#6c757d'; // Gray color for All
    }

    const name = status.cname?.toLowerCase() || '';
    
    if (name.includes('active')) return '#28a745';
    if (name.includes('inactive')) return '#dc3545';
    if (name.includes('retire')) return '#ffc107';
    if (name.includes('suspend')) return '#17a2b8';
    if (name.includes('post')) return '#28a745';
    if (name.includes('unpost')) return '#ffc107';
    
    return '#007bff';
  };

  if (loading) {
    return (
      <div className="status-bar-loading">
        <div className="spinner"></div>
        <span>Loading statuses...</span>
      </div>
    );
  }

  if (statuses.length === 0) {
    return null;
  }

  // Create an "All" option
  const allStatus = {
    ccode: 'all',
    cname: allOptionLabel,
    nFilterSort: 0 // Ensure it appears first
  };

  // Calculate total count for "All" option
  const totalCount = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);

  // Combine All option with statuses
  const displayStatuses = showAllOption 
    ? [allStatus, ...statuses] 
    : statuses;

  return (
    <div className="document-status-bar">
      {displayStatuses.map((status) => {
        const isSelected = selectedStatus?.ccode === status.ccode;
        const color = getStatusColor(status);
        
        // Get count based on whether it's "All" or regular status
        const count = status.ccode === 'all' || status.ccode === -1 
          ? totalCount 
          : counts[status.ccode] || 0;

        return (
          <button
            key={status.ccode}
            className={`status-tab ${isSelected ? 'active' : ''}`}
            onClick={() => onStatusClick(status)}
            style={{
              '--status-color': color,
              '--status-color-light': `${color}20`
            }}
          >
            <span className="status-icon" style={{ color }}>
              {getStatusIcon(status)}
            </span>
            <span className="status-name">{status.cname}</span>
            {showCounts && (
              <span className="status-count" style={{ background: color }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DocumentStatusBar;