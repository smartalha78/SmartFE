// tabs/AllowancesTab.jsx
import React, { useState } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes, FaMoneyBill, FaPlus, FaSyncAlt } from "react-icons/fa";

const AllowancesTab = ({ 
  data, 
  editState, 
  allowanceTypes, 
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

  const getAllowanceName = (code) => {
    if (!code) return "-";
    const allowance = allowanceTypes.find(a => a.Code == code || a.code == code);
    return allowance ? (allowance.Name || allowance.name || allowance.description || code) : code;
  };

  const filteredData = data.data.filter(item => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      (item.AllowancesCode && getAllowanceName(item.AllowancesCode).toLowerCase().includes(searchLower)) ||
      (item.Amount && String(item.Amount).includes(filterText))
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
              <select 
                value={item.AllowancesCode || ""} 
                onChange={(e) => onInputChange(originalIndex, "AllowancesCode", e.target.value)}
                className="modern-input small"
                autoFocus
                disabled={saving}
              >
                <option value="">Select Allowance</option>
                {allowanceTypes.map(a => (
                  <option key={a.Code || a.code} value={a.Code || a.code}>
                    {a.Name || a.name || a.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-cell">
              <input 
                type="number" 
                value={item.Amount || ""} 
                onChange={(e) => onInputChange(originalIndex, "Amount", e.target.value)}
                className="modern-input small"
                placeholder="Amount"
                step="0.01"
                disabled={saving}
              />
            </div>
            <div className="table-cell">
              <select 
                value={item.CalType || "1"} 
                onChange={(e) => onInputChange(originalIndex, "CalType", e.target.value)}
                className="modern-input small"
                disabled={saving}
              >
                <option value="1">Fixed</option>
                <option value="2">Percentage</option>
              </select>
            </div>
            <div className="table-cell">
              <input 
                type="number" 
                value={item.Percentage || ""} 
                onChange={(e) => onInputChange(originalIndex, "Percentage", e.target.value)}
                className="modern-input small"
                placeholder="Percentage %"
                step="0.01"
                min="0"
                max="100"
                disabled={saving || item.CalType !== "2"}
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
            <div className="table-cell">{getAllowanceName(item.AllowancesCode)}</div>
            <div className="table-cell">{item.Amount || "-"}</div>
            <div className="table-cell">{item.CalType === "1" ? "Fixed" : "Percentage"}</div>
            <div className="table-cell">{item.Percentage || "-"}</div>
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
        <select 
          value={row.AllowancesCode || ""} 
          onChange={(e) => onInputChange(index, "AllowancesCode", e.target.value, true)}
          className="modern-input small"
          autoFocus
          disabled={saving}
        >
          <option value="">Select Allowance</option>
          {allowanceTypes.map(a => (
            <option key={a.Code || a.code} value={a.Code || a.code}>
              {a.Name || a.name || a.description}
            </option>
          ))}
        </select>
      </div>
      <div className="table-cell">
        <input 
          type="number" 
          value={row.Amount || ""} 
          onChange={(e) => onInputChange(index, "Amount", e.target.value, true)}
          className="modern-input small"
          placeholder="Amount"
          step="0.01"
          disabled={saving}
        />
      </div>
      <div className="table-cell">
        <select 
          value={row.CalType || "1"} 
          onChange={(e) => onInputChange(index, "CalType", e.target.value, true)}
          className="modern-input small"
          disabled={saving}
        >
          <option value="1">Fixed</option>
          <option value="2">Percentage</option>
        </select>
      </div>
      <div className="table-cell">
        <input 
          type="number" 
          value={row.Percentage || ""} 
          onChange={(e) => onInputChange(index, "Percentage", e.target.value, true)}
          className="modern-input small"
          placeholder="Percentage %"
          step="0.01"
          min="0"
          max="100"
          disabled={saving || row.CalType !== "2"}
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
    return <div className="tab-loading">Loading allowances...</div>;
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
    <div className="allowances-info">
      <div className="tab-header-actions">
        <h4><FaMoneyBill /> Allowances</h4>
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
            <div className="header-cell">Allowance</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Calc Type</div>
            <div className="header-cell">Percentage</div>
            <div className="header-cell actions">Actions</div>
          </div>
          
          {filteredData.map((item, idx) => renderRow(item, idx))}
          {editState.newRows.map((row, idx) => renderNewRow(row, idx))}
        </div>
      ) : (
        <p className="no-data">No allowances available</p>
      )}
      
      {data.lastRefreshed && (
        <div className="last-refreshed">
          <small>Last updated: {new Date(data.lastRefreshed).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
};

export default AllowancesTab;