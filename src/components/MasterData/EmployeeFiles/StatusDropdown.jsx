// StatusDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaFilter,FaClock,FaBan, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import './StatusDropdown.css';

const StatusDropdown = ({
  statuses = [],
  selectedStatus,
  onStatusChange,
  loading = false,
  disabled = false,
  placement = 'bottom-left',
  onOpen // New prop: called when dropdown is opened
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status) => {
    if (!status) return '#6c757d';
    const name = status.cname?.toLowerCase() || '';
    if (name.includes('active')) return '#28a745';
    if (name.includes('inactive')) return '#dc3545';
    if (name.includes('retire')) return '#ffc107';
    if (name.includes('suspend')) return '#17a2b8';
    return '#6c757d';
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaFilter />;
    const name = status.cname?.toLowerCase() || '';
    if (name.includes('active')) return <FaCheck />;
    if (name.includes('inactive')) return <FaTimes />;
    if (name.includes('retire')) return <FaClock />;
    if (name.includes('suspend')) return <FaBan />;
    return <FaFilter />;
  };

  const handleButtonClick = () => {
    if (!disabled && !loading) {
      if (!isOpen && onOpen) {
        onOpen(); // Notify parent to load statuses if needed
      }
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (status) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  if (!loading && statuses.length === 0 && !isOpen) {
    // Only show error if not loading and not open (to avoid flicker)
    return (
      <div className="status-dropdown-container">
        <button className="status-dropdown-button error" disabled title="No statuses available">
          <span className="status-icon" style={{ color: '#dc3545' }}>
            <FaExclamationTriangle />
          </span>
          <span className="status-text">No Statuses</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`status-dropdown-container ${isOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
      <button
        className="status-dropdown-button"
        onClick={handleButtonClick}
        disabled={disabled || loading}
        style={{
          borderColor: selectedStatus ? getStatusColor(selectedStatus) : '#ddd',
          backgroundColor: selectedStatus ? `${getStatusColor(selectedStatus)}10` : 'white'
        }}
      >
        <span className="status-icon" style={{ color: selectedStatus ? getStatusColor(selectedStatus) : '#6c757d' }}>
          {selectedStatus ? getStatusIcon(selectedStatus) : <FaFilter />}
        </span>
        <span className="status-text">
          {loading ? 'Loading...' : (selectedStatus?.cname || 'Select Status')}
        </span>
        {loading ? (
          <FaSpinner className="spinner" />
        ) : (
          <FaChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className={`status-dropdown-menu ${placement}`}>
          <div className="status-dropdown-header">
            <h4>Select Status</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="status-dropdown-list">
            {statuses.length > 0 ? (
              statuses.map((status) => {
                const isSelected = selectedStatus?.ccode === status.ccode;
                const statusColor = getStatusColor(status);

                return (
                  <button
                    key={status.ccode}
                    className={`status-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(status)}
                  >
                    <span className="status-bullet" style={{ backgroundColor: statusColor }} />
                    <span className="status-name">{status.cname}</span>
                    {status.isactive === false && (
                      <span className="status-badge inactive">Inactive</span>
                    )}
                    {isSelected && <FaCheck className="check-icon" />}
                  </button>
                );
              })
            ) : (
              <div className="no-statuses">
                <p>No status options available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;