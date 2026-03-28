// tabs/AcademicTab.jsx
import React, { useState } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes, FaGraduationCap, FaPlus, FaSyncAlt } from "react-icons/fa";

const AcademicTab = ({ 
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
      (item.Institute && item.Institute.toLowerCase().includes(searchLower)) ||
      (item.Year && String(item.Year).includes(filterText))
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
                placeholder="Degree"
                autoFocus
                disabled={saving}
              />
            </div>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Institute || ""} 
                onChange={(e) => onInputChange(originalIndex, "Institute", e.target.value)}
                className="modern-input small"
                placeholder="Institute"
                disabled={saving}
              />
            </div>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Year || ""} 
                onChange={(e) => onInputChange(originalIndex, "Year", e.target.value)}
                className="modern-input small"
                placeholder="Year"
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
            <div className="table-cell">{item.Institute || "-"}</div>
            <div className="table-cell">{item.Year || "-"}</div>
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
          placeholder="Degree"
          autoFocus
          disabled={saving}
        />
      </div>
      <div className="table-cell">
        <input 
          type="text" 
          value={row.Institute || ""} 
          onChange={(e) => onInputChange(index, "Institute", e.target.value, true)}
          className="modern-input small"
          placeholder="Institute"
          disabled={saving}
        />
      </div>
      <div className="table-cell">
        <input 
          type="text" 
          value={row.Year || ""} 
          onChange={(e) => onInputChange(index, "Year", e.target.value, true)}
          className="modern-input small"
          placeholder="Year"
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
    return <div className="tab-loading">Loading academic information...</div>;
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
    <div className="academic-info">
      <div className="tab-header-actions">
        <h4><FaGraduationCap /> Academic Information</h4>
        <div className="header-right">
          {/* <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input small"
          />
          <button 
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
            <div className="header-cell">Degree</div>
            <div className="header-cell">Institute</div>
            <div className="header-cell">Year</div>
            <div className="header-cell actions">Actions</div>
          </div>
          
          {filteredData.map((item, idx) => renderRow(item, idx))}
          {editState.newRows.map((row, idx) => renderNewRow(row, idx))}
        </div>
      ) : (
        <p className="no-data">No academic information available</p>
      )}
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          <small>Last updated: {new Date(data.lastRefreshed).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
};

export default AcademicTab;