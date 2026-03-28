// tabs/EmploymentTab.jsx
import React, { useState } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes, FaBriefcase, FaPlus, FaSyncAlt } from "react-icons/fa";

const EmploymentTab = ({ 
  data, 
  editState, 
  isEditing, 
  onEdit, 
  onCancel, 
  onNew, 
  onSave, 
  onDelete, 
  onInputChange,
  onRefresh,
  saving 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [filterText, setFilterText] = useState("");

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const filteredData = data.data.filter(item => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      (item.Description && item.Description.toLowerCase().includes(searchLower)) ||
      (item.Company && item.Company.toLowerCase().includes(searchLower)) ||
      (item.Experience && String(item.Experience).includes(filterText))
    );
  });

  const renderRow = (item, index) => {
    const isEditingThisRow = editState.editing?.[index];
    const originalIndex = data.data.findIndex(d => d === item);
    
    return (
      <div key={index} className="table-row">
        {isEditingThisRow ? (
          <>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Description || ""} 
                onChange={(e) => onInputChange(originalIndex, "Description", e.target.value)}
                className="modern-input small"
                placeholder="Description"
                autoFocus
                maxLength="500"
                disabled={saving}
              />
            </div>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Company || ""} 
                onChange={(e) => onInputChange(originalIndex, "Company", e.target.value)}
                className="modern-input small"
                placeholder="Company"
                maxLength="100"
                disabled={saving}
              />
            </div>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Experience || ""} 
                onChange={(e) => onInputChange(originalIndex, "Experience", e.target.value)}
                className="modern-input small"
                placeholder="Experience (years)"
                maxLength="50"
                disabled={saving}
              />
            </div>
            <div className="table-cell actions">
              <button 
                className="btn-save" 
                onClick={() => onSave(originalIndex, false)} 
                title="Save"
                disabled={saving}
              >
                {saving ? <FaSyncAlt className="spinner" /> : <FaSave />}
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => onCancel(originalIndex)} 
                title="Cancel"
                disabled={saving}
              >
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="table-cell">{item.Description || "-"}</div>
            <div className="table-cell">{item.Company || "-"}</div>
            <div className="table-cell">{item.Experience || "-"}</div>
            <div className="table-cell actions">
              <button 
                className="btn-edit" 
                onClick={() => onEdit(originalIndex)} 
                title="Edit" 
                disabled={!isEditing || saving}
              >
                <FaEdit />
              </button>
              <button 
                className="btn-delete" 
                onClick={() => onDelete(originalIndex)} 
                title="Delete"
                disabled={!isEditing || saving}
              >
                <FaTrash />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };
  
  const renderNewRow = (row, index) => (
    <div key={`new-${row.tempId}`} className="table-row new-row">
      <div className="table-cell">
        <input 
          type="text" 
          value={row.Description || ""} 
          onChange={(e) => onInputChange(index, "Description", e.target.value, true)}
          className="modern-input small"
          placeholder="Description"
          autoFocus
          maxLength="500"
          disabled={saving}
        />
      </div>
      <div className="table-cell">
        <input 
          type="text" 
          value={row.Company || ""} 
          onChange={(e) => onInputChange(index, "Company", e.target.value, true)}
          className="modern-input small"
          placeholder="Company"
          maxLength="100"
          disabled={saving}
        />
      </div>
      <div className="table-cell">
        <input 
          type="text" 
          value={row.Experience || ""} 
          onChange={(e) => onInputChange(index, "Experience", e.target.value, true)}
          className="modern-input small"
          placeholder="Experience (years)"
          maxLength="50"
          disabled={saving}
        />
      </div>
      <div className="table-cell actions">
        <button 
          className="btn-save" 
          onClick={() => onSave(index, true)} 
          title="Save"
          disabled={saving}
        >
          {saving ? <FaSyncAlt className="spinner" /> : <FaSave />}
        </button>
        <button 
          className="btn-cancel" 
          onClick={() => onCancel(index)} 
          title="Cancel"
          disabled={saving}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
  
  if (data.loading) {
    return <div className="tab-loading">Loading employment history...</div>;
  }
  
  if (data.error) {
    return (
      <div className="tab-error">
        <p>Error: {data.error}</p>
        <button className="btn-retry" onClick={handleRefresh}>
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="employment-info">
      <div className="tab-header-actions">
        <h4><FaBriefcase /> Employment History</h4>
        <div className="header-right">
          {/* <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input small"
          /> */}
          {/* <button 
            className="btn refresh" 
            onClick={handleRefresh} 
            disabled={refreshing}
            title="Refresh Data"
          >
            <FaSyncAlt className={refreshing ? 'spinner' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button> */}
          {isEditing && (
            <button className="btn new" onClick={onNew} disabled={saving}>
              <FaPlus /> Add New
            </button>
          )}
        </div>
      </div>
      
      {(filteredData.length > 0) || (editState.newRows && editState.newRows.length > 0) ? (
        <div className="info-table">
          <div className="table-header">
            <div className="header-cell">Description</div>
            <div className="header-cell">Company</div>
            <div className="header-cell">Experience</div>
            <div className="header-cell actions">Actions</div>
          </div>
          
          {filteredData.map((item, idx) => renderRow(item, idx))}
          {editState.newRows.map((row, idx) => renderNewRow(row, idx))}
        </div>
      ) : (
        <p className="no-data">No employment history available</p>
      )}
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          <small>Last updated: {new Date(data.lastRefreshed).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
};

export default EmploymentTab;