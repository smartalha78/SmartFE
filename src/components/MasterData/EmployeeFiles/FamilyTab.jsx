// tabs/FamilyTab.jsx
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes, FaUsers, FaPlus, FaSyncAlt } from "react-icons/fa";

const FamilyTab = ({ 
  data, 
  editState, 
  isEditing, 
  onEdit, 
  onCancel, 
  onNew, 
  onSave, 
  onDelete, 
  onInputChange,
  onRefresh
}) => {
  const [relationOptions, setRelationOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format CNIC with dashes for display only
  const formatCNICForDisplay = (value) => {
    if (!value) return "";
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 5) return numericValue;
    if (numericValue.length <= 12) return `${numericValue.slice(0, 5)}-${numericValue.slice(5)}`;
    return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 12)}-${numericValue.slice(12, 13)}`;
  };

  // Load relation options from database
  const loadRelations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.100.113:8000/get-table-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableName: "tbloption", 
          where: "codetype = 'RELTP'",
          usePagination: false 
        })
      });
      
      const result = await response.json();
      
      if (result?.success && result.rows) {
        const options = result.rows.map(opt => ({
          ccode: opt.ccode?.toString(),
          cname: opt.cname
        }));
        setRelationOptions(options);
        console.log("Loaded relation options:", options);
      }
    } catch (error) {
      console.error("Error loading relation options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRelations();
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadRelations();
  }, []);

  const getRelationName = (code) => {
    if (!code && code !== 0) return "-";
    const codeStr = code?.toString();
    const relation = relationOptions.find(r => r.ccode === codeStr);
    return relation ? relation.cname : code;
  };

  const handleCNICChange = (index, value, isNew) => {
    // Remove any non-numeric characters for storage
    const numericValue = value.replace(/\D/g, '');
    onInputChange(index, "CNIC", numericValue, isNew);
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    if (typeof date === 'string') {
      if (date.includes("T")) {
        return date.split("T")[0];
      }
      if (date.includes(" ")) {
        return date.split(" ")[0];
      }
    }
    return date;
  };

  const renderRow = (item, index) => {
    const isEditingThisRow = editState.editing?.[index];
    
    return (
      <div key={`row-${index}-${item.PK || index}`} className="table-row">
        {isEditingThisRow ? (
          <>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.Name || ""} 
                onChange={(e) => onInputChange(index, "Name", e.target.value, false)}
                className="modern-input small"
                placeholder="Enter full name"
                autoFocus
                maxLength="150"
              />
            </div>
            <div className="table-cell">
              <select 
                value={item.Relation?.toString() || ""} 
                onChange={(e) => onInputChange(index, "Relation", e.target.value, false)}
                className="modern-input small"
                disabled={loading}
              >
                <option value="">Select Relation</option>
                {relationOptions.map(opt => (
                  <option key={opt.ccode} value={opt.ccode}>
                    {opt.cname}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-cell">
              <input 
                type="text" 
                value={item.CNIC || ""} 
                onChange={(e) => handleCNICChange(index, e.target.value, false)}
                className="modern-input small"
                placeholder="CNIC (numbers only)"
                maxLength="13"
              />
            </div>
            <div className="table-cell">
              <input 
                type="date" 
                value={formatDateForInput(item.DOB)} 
                onChange={(e) => onInputChange(index, "DOB", e.target.value, false)}
                className="modern-input small"
              />
            </div>
            <div className="table-cell actions">
              <button className="btn-save" onClick={() => onSave(index, false)} title="Save">
                <FaSave />
              </button>
              <button className="btn-cancel" onClick={() => onCancel(index)} title="Cancel">
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="table-cell">{item.Name || "-"}</div>
            <div className="table-cell">{getRelationName(item.Relation)}</div>
            <div className="table-cell">
              {item.CNIC ? formatCNICForDisplay(item.CNIC) : "-"}
            </div>
            <div className="table-cell">
              {item.DOB ? new Date(item.DOB).toLocaleDateString() : "-"}
            </div>
            <div className="table-cell actions">
              <button 
                className="btn-edit" 
                onClick={() => onEdit(index)} 
                title="Edit" 
                disabled={!isEditing}
              >
                <FaEdit />
              </button>
              <button 
                className="btn-delete" 
                onClick={() => onDelete(index)} 
                title="Delete"
                disabled={!isEditing}
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
          value={row.Name || ""} 
          onChange={(e) => onInputChange(index, "Name", e.target.value, true)}
          className="modern-input small"
          placeholder="Enter full name"
          autoFocus
          maxLength="150"
        />
      </div>
      <div className="table-cell">
        <select 
          value={row.Relation?.toString() || ""} 
          onChange={(e) => onInputChange(index, "Relation", e.target.value, true)}
          className="modern-input small"
          disabled={loading}
        >
          <option value="">Select Relation</option>
          {relationOptions.map(opt => (
            <option key={opt.ccode} value={opt.ccode}>
              {opt.cname}
            </option>
          ))}
        </select>
      </div>
      <div className="table-cell">
        <input 
          type="text" 
          value={row.CNIC || ""} 
          onChange={(e) => handleCNICChange(index, e.target.value, true)}
          className="modern-input small"
          placeholder="CNIC (numbers only)"
          maxLength="13"
        />
      </div>
      <div className="table-cell">
        <input 
          type="date" 
          value={row.DOB || ""} 
          onChange={(e) => onInputChange(index, "DOB", e.target.value, true)}
          className="modern-input small"
        />
      </div>
      <div className="table-cell actions">
        <button className="btn-save" onClick={() => onSave(index, true)} title="Save">
          <FaSave />
        </button>
        <button className="btn-cancel" onClick={() => onCancel(index)} title="Cancel">
          <FaTimes />
        </button>
      </div>
    </div>
  );
  
  if (data.loading) {
    return <div className="tab-loading">Loading family details...</div>;
  }
  
  return (
    <div className="family-info">
      <div className="tab-header-actions">
        <h4><FaUsers /> Family Details</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-refresh" 
            onClick={handleRefresh} 
            disabled={refreshing}
            title="Refresh Data"
          >
            <FaSyncAlt className={refreshing ? 'spinner' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn-new" 
            onClick={onNew} 
            disabled={!isEditing}
          >
            <FaPlus /> Add New
          </button>
        </div>
      </div>
      
      {(data.data && data.data.length > 0) || (editState.newRows && editState.newRows.length > 0) ? (
        <div className="info-table">
          <div className="table-header">
            <div className="header-cell">Name</div>
            <div className="header-cell">Relation</div>
            <div className="header-cell">CNIC</div>
            <div className="header-cell">DOB</div>
            <div className="header-cell">Actions</div>
          </div>
          
          {data.data.map((item, idx) => renderRow(item, idx))}
          {editState.newRows.map((row, idx) => renderNewRow(row, idx))}
        </div>
      ) : (
        <p className="no-data">No family details available</p>
      )}
    </div>
  );
};

export default FamilyTab;