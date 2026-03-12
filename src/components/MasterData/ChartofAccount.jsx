import React, { useState, useEffect, useCallback, useContext } from 'react';
import "./ChartofAccount.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";

/* ---------------------------
 API & Configuration
---------------------------- */
const API_CONFIG = {
  BASE_URL: API_BASE1,
  TABLE_NAME: 'acchartofaccount',
  CASH_FLOW_TABLE: 'anot',
  
  // Using your Flask endpoints
  GET_TABLE_DATA: `${API_BASE1}/get-table-data`,
  INSERT_RECORD: `${API_BASE1}/table/insert`,
  UPDATE_RECORD: `${API_BASE1}/table/update`,
  DELETE_RECORD: `${API_BASE1}/table/delete`,
  GET_TABLE_STRUCTURE: `${API_BASE1}/get-table-structure`,
  GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
  GET_DOCUMENT_STATUSES: `${API_BASE1}/screen/document-statuses`,
};

/* ---------------------------
 Static / Lookup Data
---------------------------- */
const FIXED_TRANSACTION_TYPES = [
  { code: 'DN', name: 'DEBIT NOTE' }, { code: 'BNK', name: 'BANK' }, { code: 'CASH', name: 'CASH' }, { code: 'CN', name: 'CREDIT NOTE' },
  { code: 'CUST', name: 'CUSTOMER' }, { code: 'CUSTSUP', name: 'CUSTOMER/SUPPLIER' }, { code: 'LAB', name: 'LABOUR' },
  { code: 'LC', name: 'LC' }, { code: 'OTHER', name: 'OTHER' }, { code: 'SALES', name: 'SALESMAN' }, { code: 'STAFF', name: 'STAFF' },
  { code: 'SUP', name: 'SUPPLIER' }, { code: 'TRP', name: 'TRANSPORTER' },
];

const CODE_TYPES = [
  { code: 'I', name: 'Item' }, { code: 'HA', name: 'Header Account' }, { code: 'IT', name: 'Item Total' }, { code: 'EL', name: 'Empty Line' },
  { code: 'LS', name: 'Line Space' }, { code: 'LD', name: 'Line Double' }, { code: 'BPN', name: 'Balance Sheet Note' },
];

const V_TYPES = [
  { code: 'P', name: 'Profit & Loss' }, { code: 'B', name: 'Balance Sheet' }, { code: 'CF', name: 'Cash Flow' },
];

/* ---------------------------
 Icons (using modern SVG icons as per your request)
---------------------------- */
const Icon = {
  Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6M1 6h22"></path></svg>,
  ChevronRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  FileText: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Folder: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Chart: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>,
  Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
  CashFlow: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8V4h16z"></path><path d="M12 18v-4a4 4 0 0 1-4-4"></path><path d="M12 18v-4a4 4 0 0 0 4-4"></path></svg>,
  Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Account: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2"/></svg>,
  Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Database: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
};

/* ---------------------------
 Helper Functions
---------------------------- */
const normalizeValue = (value) => String(value === null || value === undefined ? '' : value);

const determineAccountType = (accountCode) => {
  const firstDigit = normalizeValue(accountCode).trim().charAt(0);
  switch (firstDigit) {
    case '1': return 'ASSET';
    case '2': return 'LIABILITY';
    case '3': return 'EQUITY';
    case '4': return 'REVENUE';
    case '5': return 'EXPENSE';
    default: return 'OTHER';
  }
};

/* ---------------------------
 Cash Flow Notes Manager (Modal)
---------------------------- */
const CashFlowNotesManager = ({ isVisible, onClose, hasPermission, menuId }) => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState('P');
  const [formData, setFormData] = useState({
    offcode: '', code: '', name: '', codeType: 'I', vType: 'P',
    sorting: '0', figureBehavour: '1', isEnable: true, formula: '', BPNCode: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const CODE_RANGES = {
    'P': { min: 1101, max: 1500, next: 1501 },
    'B': { min: 1501, max: 5999, next: 6000 },
    'CF': { min: 6000, max: 9999, next: null }
  };

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableName: API_CONFIG.CASH_FLOW_TABLE,
          usePagination: false
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && Array.isArray(data.rows)) {
        let filtered = data.rows;
        if (searchType === 'P') filtered = data.rows.filter(n => { 
          const c = parseInt(n.code); 
          return c >= CODE_RANGES.P.min && c <= CODE_RANGES.P.max; 
        });
        else if (searchType === 'B') filtered = data.rows.filter(n => { 
          const c = parseInt(n.code); 
          return c >= CODE_RANGES.B.min && c <= CODE_RANGES.B.max; 
        });
        else if (searchType === 'CF') filtered = data.rows.filter(n => { 
          const c = parseInt(n.code); 
          return c >= CODE_RANGES.CF.min && c <= CODE_RANGES.CF.max; 
        });
        const normalized = filtered.map(n => ({
          offcode: normalizeValue(n.offcode || '1010'),
          code: normalizeValue(n.code),
          name: normalizeValue(n.name),
          codeType: normalizeValue(n.codeType || 'I'),
          vType: normalizeValue(n.vType || 'P'),
          sorting: normalizeValue(n.sorting || '0'),
          figureBehavour: normalizeValue(n.figureBehavour || '1'),
          isEnable: n.isEnable === true || n.isEnable === 'true' || n.isEnable === 'True',
          formula: normalizeValue(n.formula || ''),
          BPNCode: normalizeValue(n.BPNCode || '')
        }));
        setNotes(normalized);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('fetchNotes', err);
      setErrorMessage('Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    if (isVisible) {
      fetchNotes();
      resetForm();
    }
  }, [isVisible, fetchNotes]);

  const generateNextCode = useCallback(() => {
    const range = CODE_RANGES[searchType];
    if (!range) return '';
    
    const existingCodes = notes
      .filter(note => {
        const codeNum = parseInt(note.code);
        return codeNum >= range.min && codeNum <= range.max;
      })
      .map(note => parseInt(note.code))
      .sort((a, b) => a - b);
    
    if (existingCodes.length === 0) {
      return range.min.toString();
    }
    
    const maxExistingCode = Math.max(...existingCodes);
    const nextCode = maxExistingCode + 1;
    
    if (nextCode > range.max) {
      setErrorMessage(`Maximum code limit reached for ${searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes. Maximum allowed: ${range.max}`);
      return '';
    }
    
    return nextCode.toString();
  }, [notes, searchType]);

  const handleInput = (f, v) => {
    setFormData(prev => ({ ...prev, [f]: v }));
    setErrorMessage('');
  };

  const resetForm = () => {
    const nextCode = generateNextCode();
    setFormData({ 
      offcode: '1010', 
      code: nextCode, 
      name: '', 
      codeType: 'I', 
      vType: searchType, 
      sorting: '0', 
      figureBehavour: '1', 
      isEnable: true, 
      formula: '', 
      BPNCode: '' 
    });
    setIsEditing(false);
    setShowAddForm(false);
    setErrorMessage('');
  };

  const handleAddNew = () => {
    if (!hasPermission || !hasPermission(menuId, 'add')) {
      setErrorMessage('You do not have permission to add notes');
      return;
    }
    const nextCode = generateNextCode();
    if (!nextCode) return;
    setFormData(prev => ({ ...prev, code: nextCode }));
    setShowAddForm(true);
    setErrorMessage('');
  };

  const validateCode = (code) => {
    const codeNum = parseInt(code);
    const range = CODE_RANGES[searchType];
    
    if (!range) return false;
    
    if (codeNum < range.min || codeNum > range.max) {
      setErrorMessage(`Code must be between ${range.min} and ${range.max} for ${searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes`);
      return false;
    }
    
    if (!isEditing && notes.some(note => note.code === code)) {
      setErrorMessage(`Code ${code} already exists`);
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) { 
      setErrorMessage('Code and Name are required');
      return; 
    }
    
    if (!validateCode(formData.code)) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const payload = { 
        tableName: API_CONFIG.CASH_FLOW_TABLE, 
        data: { 
          ...formData, 
          isEnable: formData.isEnable ? 'True' : 'False' 
        } 
      };
      
      let endpoint = API_CONFIG.INSERT_RECORD;
      if (isEditing) { 
        endpoint = API_CONFIG.UPDATE_RECORD; 
        payload.where = { code: formData.code, offcode: formData.offcode }; 
      }
      
      const resp = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!resp.ok) throw new Error(`Save failed ${resp.status}`);
      const data = await resp.json();
      
      if (data.success) { 
        await fetchNotes(); 
        resetForm();
        setErrorMessage('');
      } else {
        setErrorMessage('Save failed: ' + (data.message || data.error || 'unknown'));
      }
    } catch (err) { 
      console.error('save note', err); 
      setErrorMessage('Save failed: ' + err.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDelete = async (note) => {
    if (!hasPermission || !hasPermission(menuId, 'delete')) {
      setErrorMessage('You do not have permission to delete notes');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete note "${note.name}"?`)) return;
    try {
      const payload = { 
        tableName: API_CONFIG.CASH_FLOW_TABLE, 
        where: { code: note.code, offcode: note.offcode } 
      };
      const resp = await fetch(API_CONFIG.DELETE_RECORD, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!resp.ok) throw new Error('Delete failed');
      const data = await resp.json();
      if (data.success) {
        await fetchNotes();
        setErrorMessage('');
      } else {
        setErrorMessage('Delete failed');
      }
    } catch (err) { 
      console.error(err); 
      setErrorMessage('Delete failed: ' + err.message); 
    }
  };

  const handleEdit = (note) => {
    if (!hasPermission || !hasPermission(menuId, 'edit')) {
      setErrorMessage('You do not have permission to edit notes');
      return;
    }
    setFormData({ 
      offcode: note.offcode, 
      code: note.code, 
      name: note.name, 
      codeType: note.codeType, 
      vType: note.vType, 
      sorting: note.sorting, 
      figureBehavour: note.figureBehavour, 
      isEnable: note.isEnable, 
      formula: note.formula, 
      BPNCode: note.BPNCode 
    });
    setIsEditing(true);
    setShowAddForm(true);
    setErrorMessage('');
  };

  useEffect(() => {
    if (showAddForm && !isEditing) {
      const nextCode = generateNextCode();
      if (nextCode) {
        setFormData(prev => ({ ...prev, code: nextCode, vType: searchType }));
      }
    }
  }, [searchType, showAddForm, isEditing, generateNextCode]);

  if (!isVisible) return null;

  return (
    <div className="cfa-modal-backdrop">
      <div className="cfa-modal cash-flow-modal">
        <div className="cfa-modal-header">
          <div className="cfa-modal-title">
            <div className="title-icon">
              <Icon.CashFlow />
            </div>
            <div className="title-content">
              <h3>Cash Flow Notes Manager</h3>
              <div className="muted">Manage financial statement notes and formulas</div>
            </div>
          </div>
          <button className="cfa-close-btn" onClick={onClose} title="Close">
            <Icon.XCircle />
          </button>
        </div>

        <div className="cfa-modal-controls">
          <div className="controls-left">
            <div className="control-group">
              <label>Filter by Type</label>
              <select 
                value={searchType} 
                onChange={e => setSearchType(e.target.value)} 
                className="type-select"
                disabled={showAddForm && !isEditing}
              >
                <option value="P">Profit & Loss Notes (1101-1500)</option>
                <option value="B">Balance Sheet Notes (1501-6000)</option>
                <option value="CF">Cash Flow Notes (6001-9999)</option>
              </select>
            </div>
            <div className="notes-count">
              <span className="count-badge">
                {notes.length} / {CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1} notes
              </span>
            </div>
          </div>
          
          <div className="controls-right">
            <button className="btn btn-outline" onClick={fetchNotes} disabled={isLoading}>
              <Icon.Refresh className={isLoading ? 'spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            {hasPermission && hasPermission(menuId, 'add') && (
              <button 
                className="btn btn-primary" 
                onClick={handleAddNew}
                disabled={notes.length >= (CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1)}
                title={notes.length >= (CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1) ? 'Maximum limit reached' : ''}
              >
                <Icon.Plus />
                Add New Note
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="error-message">
            <Icon.XCircle />
            <span>{errorMessage}</span>
            <button className="error-close" onClick={() => setErrorMessage('')}>
              <Icon.XCircle />
            </button>
          </div>
        )}

        <div className="cfa-modal-body">
          {showAddForm && (hasPermission && (hasPermission(menuId, isEditing ? 'edit' : 'add'))) && (
            <div className="cfa-form-section">
              <div className="form-section-header">
                <h4>
                  <Icon.FileText />
                  {isEditing ? 'Edit Note' : 'Create New Note'}
                  {!isEditing && formData.code && (
                    <span className="auto-generated-badge">Auto-generated: {formData.code}</span>
                  )}
                </h4>
                <button className="btn btn-text" onClick={resetForm}>
                  <Icon.XCircle />
                </button>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input 
                    value={formData.code} 
                    onChange={e => handleInput('code', e.target.value)}
                    placeholder="Enter note code..."
                    className="form-input"
                    disabled={!isEditing}
                  />
                  {!isEditing && (
                    <div className="form-hint">
                      Code auto-generated. Range: {CODE_RANGES[searchType]?.min} - {CODE_RANGES[searchType]?.max}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    value={formData.name} 
                    onChange={e => handleInput('name', e.target.value)}
                    placeholder="Enter note name..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Code Type</label>
                  <select 
                    value={formData.codeType} 
                    onChange={e => handleInput('codeType', e.target.value)}
                    className="form-select"
                  >
                    {CODE_TYPES.map(x => (
                      <option key={x.code} value={x.code}>
                        {x.code} - {x.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>V Type</label>
                  <select 
                    value={formData.vType} 
                    onChange={e => handleInput('vType', e.target.value)}
                    className="form-select"
                    disabled={!isEditing}
                  >
                    {V_TYPES.map(x => (
                      <option key={x.code} value={x.code}>
                        {x.code} - {x.name}
                      </option>
                    ))}
                  </select>
                  {!isEditing && (
                    <div className="form-hint">Automatically set to {searchType}</div>
                  )}
                </div>
                
                <div className="form-group full-width">
                  <label>Formula</label>
                  <input 
                    value={formData.formula} 
                    onChange={e => handleInput('formula', e.target.value)}
                    placeholder="e.g., 1110-1120 or SUM(1101,1102,1103)"
                    className="form-input"
                  />
                  <div className="form-hint">Enter account codes and operators (+, -, *, /) or SUM function</div>
                </div>
                
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formData.isEnable} 
                      onChange={e => handleInput('isEnable', e.target.checked)} 
                    />
                    <span className="checkmark"></span>
                    Enabled Note
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-success" 
                  onClick={handleSave} 
                  disabled={isLoading || !formData.code || !formData.name || !!errorMessage}
                >
                  {isLoading ? (
                    <Icon.Loader className="spin" />
                  ) : (
                    <Icon.Save />
                  )}
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Note' : 'Save Note')}
                </button>
                <button className="btn btn-text" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="cfa-list-section">
            <div className="list-section-header">
              <h4>
                <Icon.Database />
                Notes List
                <span className="count-pill">{notes.length}</span>
              </h4>
              <div className="list-actions">
                <div className="search-box">
                  <Icon.Search />
                  <input 
                    type="text" 
                    placeholder="Search notes..." 
                    className="search-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="notes-list-container">
              {isLoading ? (
                <div className="loading-state">
                  <Icon.Loader className="loader spin" />
                  <p>Loading notes...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="empty-state">
                  <Icon.Folder className="empty-icon" />
                  <h4>No notes found</h4>
                  <p>No {searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes available</p>
                  {hasPermission && hasPermission(menuId, 'add') && (
                    <button className="btn btn-primary" onClick={handleAddNew}>
                      <Icon.Plus />
                      Create First Note
                    </button>
                  )}
                </div>
              ) : (
                <div className="notes-grid">
                  {notes.map(note => (
                    <div key={`${note.offcode}-${note.code}`} className="note-card">
                      <div className="note-header">
                        <div className="note-code-badge">{note.code}</div>
                        <div className="note-actions">
                          {hasPermission && hasPermission(menuId, 'edit') && (
                            <button 
                              className="icon-btn btn-edit" 
                              onClick={() => handleEdit(note)} 
                              title="Edit Note"
                            >
                              <Icon.Edit />
                            </button>
                          )}
                          {hasPermission && hasPermission(menuId, 'delete') && (
                            <button 
                              className="icon-btn btn-delete" 
                              onClick={() => handleDelete(note)} 
                              title="Delete Note"
                            >
                              <Icon.Trash />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="note-content">
                        <h5 className="note-title">{note.name}</h5>
                        <div className="note-meta">
                          <span className={`status-badge ${note.isEnable ? 'active' : 'inactive'}`}>
                            {note.isEnable ? 'Active' : 'Inactive'}
                          </span>
                          <span className="type-badge">{note.codeType}</span>
                          <span className="vtype-badge">{note.vType}</span>
                        </div>
                        
                        {note.formula && (
                          <div className="note-formula">
                            <Icon.FileText className="formula-icon" />
                            <span className="formula-text">{note.formula}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
 Recursive Tree Node component
---------------------------- */
const TreeNode = ({ node, level = 0, onSelect, selectedAccount, searchTerm, isNodeVisible, hasPermission, menuId, onDelete }) => {
  const nodeCode = normalizeValue(node.code);
  const nodeName = normalizeValue(node.name);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedAccount && selectedAccount.code === nodeCode;

  const [expanded, setExpanded] = useState(level < 2 || searchTerm !== '');

  useEffect(() => {
    if (searchTerm !== '') {
      const matches = isNodeVisible(node) || (hasChildren && node.children.length > 0);
      if (matches) setExpanded(true);
    } else {
      setExpanded(level < 2);
    }
  }, [searchTerm, level, hasChildren, node, isNodeVisible]);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(node);
  };

  return (
    <div className="tree-node">
      <div className={`tree-node-row ${isSelected ? 'selected' : ''}`} style={{ paddingLeft: `${level * 18 + 12}px` }} onClick={() => onSelect(node)}>
        <div className="tree-left">
          {hasChildren ? (
            <button className="toggle-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
              {expanded ? <Icon.ChevronDown className="small" /> : <Icon.ChevronRight className="small" />}
            </button>
          ) : <div className="file-icon"><Icon.Account /></div>}
          <div className="tree-main">
            <div className="code">{nodeCode}</div>
            <div className="name">{nodeName}</div>
            <div className="node-level">Level {node.nlevel}</div>
          </div>
        </div>

        <div className="tree-right">
          <div className={`status ${node.isActive ? 'active' : 'inactive'}`}>
            {node.isActive ? '✓' : '✗'}
          </div>
          {hasPermission && hasPermission(menuId, 'delete') && (
            <button 
              className="delete-btn" 
              onClick={handleDeleteClick}
              title="Delete Account"
            >
              <Icon.Trash />
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="children">
          {node.children.map(child => <TreeNode 
            key={normalizeValue(child.code)} 
            node={child} 
            level={level + 1} 
            onSelect={onSelect} 
            selectedAccount={selectedAccount} 
            searchTerm={searchTerm} 
            isNodeVisible={isNodeVisible}
            hasPermission={hasPermission}
            menuId={menuId}
            onDelete={onDelete}
          />)}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
 Account Tree Sidebar component
---------------------------- */
const AccountTreeSidebar = ({ accounts, selectedAccount, onAccountSelect, searchTerm, onSearchChange, isLoading, hasPermission, menuId, onDelete }) => {

  const buildTree = useCallback((parentCode = '00') => {
    return accounts
      .filter(acc => normalizeValue(acc.parent) === parentCode)
      .sort((a, b) => normalizeValue(a.code).localeCompare(normalizeValue(b.code)))
      .map(acc => ({ ...acc, children: buildTree(normalizeValue(acc.code)) }));
  }, [accounts]);

  const isNodeVisible = useCallback((node) => {
    const nodeCode = normalizeValue(node.code);
    const nodeName = normalizeValue(node.name);
    if (searchTerm === '') return true;
    return nodeName.toLowerCase().includes(searchTerm.toLowerCase()) || nodeCode.includes(searchTerm);
  }, [searchTerm]);

  const filterTree = useCallback((nodes) => {
    return nodes
      .map(node => {
        const children = filterTree(node.children || []);
        const matches = isNodeVisible(node);
        if (matches || children.length > 0) return { ...node, children };
        return null;
      })
      .filter(Boolean);
  }, [isNodeVisible]);

  const fullTree = buildTree();
  const visibleTree = filterTree(fullTree);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-title"><Icon.Chart className="big" /> <div><div className="h3">Account Hierarchy</div><div className="muted small">{accounts.length} accounts</div></div></div>
        <div className="search-wrap">
          <Icon.Search className="search-icon" />
          <input placeholder="Search accounts..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} />
        </div>
      </div>

      <div className="sidebar-body">
        {isLoading ? (
          <div className="center padded"><Icon.Loader className="loader" /></div>
        ) : visibleTree.length === 0 ? (
          <div className="empty-state padded">
            <Icon.Folder className="big-muted" />
            <div className="muted">No accounts found</div>
            <div className="small muted">Create a root account to get started</div>
          </div>
        ) : (
          <div className="tree-container">
            {visibleTree.map(n => <TreeNode 
              key={normalizeValue(n.code)} 
              node={n} 
              onSelect={onAccountSelect} 
              selectedAccount={selectedAccount} 
              searchTerm={searchTerm} 
              isNodeVisible={isNodeVisible}
              hasPermission={hasPermission}
              menuId={menuId}
              onDelete={onDelete}
            />)}
          </div>
        )}
      </div>
    </aside>
  );
};

/* ---------------------------
 Account Detail Form (Right Panel)
---------------------------- */
const AccountDetailForm = ({ formData, onFormChange, onSave, onNewAccount, currentMode, selectedAccount, anoteCodes, isLoading, isDataLoading, transactionTypes, hasPermission, menuId }) => {
  const { code, name, type, parent, nlevel, isActive, groupcode, offcode, cashFlowCode } = formData || {};

  const canCreateNewChild = selectedAccount && parseInt(normalizeValue(selectedAccount.nlevel)) < 4;
  const isLevel4 = parseInt(nlevel || '1') === 4;
  
  const showAttachmentOptions = !isLevel4;
  const isNewMode = currentMode === 'new';

  const handleInput = (f, v) => onFormChange(f, v);

  const getTransactionTypeName = (c) => {
    const found = (transactionTypes || []).find(t => t.code === c);
    return found ? found.name : c;
  };

  const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

  return (
    <section className="detail-panel">
      <div className="detail-header">
        <div className="header-content">
          <h1>{isNewMode ? 'Create New Account' : 'Account Details'}</h1>
          <div className="header-subtitle">
            <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
            <span className="muted">• Level {nlevel}</span>
            {!isActive && <span className="inactive-badge">INACTIVE</span>}
            {isLevel4 && <span className="level4-badge">MAX LEVEL</span>}
          </div>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button 
              className="btn btn-outline" 
              onClick={onNewAccount} 
              disabled={isLevel4 && !isNewMode || !canEdit}
              title={isLevel4 ? "Cannot create child at maximum level (4)" : "Create new child account"}
            >
              <Icon.Plus /> {selectedAccount && currentMode === 'edit' ? 'New Child' : 'New Root'}
            </button>
          )}
          {canEdit && (
            <button 
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
              onClick={onSave} 
              disabled={isLoading || isDataLoading || !code || !name || !type || !canEdit}
            >
              {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
              {isLoading ? 'Saving...' : 'Save Account'}
            </button>
          )}
        </div>
      </div>

      <div className="detail-body">
        <div className="form-section">
          <h3><Icon.FileText /> Basic Information</h3>
          <div className="form-grid">
            <div className="field">
              <label>Parent Code</label>
              <div className="input-with-icon">
                <Icon.Folder className="input-icon" />
                <input value={parent} disabled className="mono" />
              </div>
            </div>
            <div className="field">
              <label>Account Code *</label>
              <div className="input-with-icon">
                <Icon.Database className="input-icon" />
                <input value={code} disabled className="mono" />
              </div>
              {isNewMode && <div className="hint">Auto-generated based on parent</div>}
            </div>
            <div className="field">
              <label>Level</label>
              <input value={nlevel} disabled />
            </div>

            <div className="field full-width">
              <label>Account Name *</label>
              <input 
                value={name} 
                onChange={e => handleInput('name', e.target.value)} 
                placeholder="Enter account name..."
                disabled={!canEdit}
              />
            </div>

            <div className="field">
              <label>Account Classification</label>
              <select value={type} onChange={e => handleInput('type', e.target.value)} disabled={isNewMode || !canEdit}>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="hint">Based on account code prefix</div>
            </div>

            <div className="field">
              <label>Transaction Type *</label>
              <select value={type} onChange={e => handleInput('type', e.target.value)} disabled={!canEdit}>
                <option value="">{getTransactionTypeName(type)}</option>
                {transactionTypes.map(t => (
                  <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
                ))}
              </select>
              <div className="hint">
                Selected: <strong>{getTransactionTypeName(type)}</strong>
              </div>
            </div>

            <div className="field">
              <label>Group Code</label>
              <input value={groupcode} onChange={e => handleInput('groupcode', e.target.value)} disabled={!canEdit} />
            </div>

            <div className="field">
              <label>Office Code</label>
              <input value={offcode} disabled />
            </div>

            <div className="field checkbox">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={e => handleInput('isActive', e.target.checked)} 
                  disabled={!canEdit}
                />
                <span className="checkmark"></span>
                Active Account
              </label>
            </div>
          </div>
        </div>

        {showAttachmentOptions && (
          <div className="form-section">
            <h3><Icon.CashFlow /> Cash Flow Attachment</h3>
            <div className="attachment-block">
              <div className="field full-width">
                <label>Cash Flow Note</label>
                <select value={cashFlowCode} onChange={e => handleInput('cashFlowCode', e.target.value)} disabled={!canEdit}>
                  <option value="">Select cash flow note (optional)</option>
                  {anoteCodes.map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
                <div className="hint">Available for accounts up to Level 3</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* ---------------------------
 Main Manager Component
---------------------------- */
const ChartOfAccountsManager = () => {
  const { credentials } = useContext(AuthContext);
  const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
  const USER_LOGIN = credentials?.userLogin || credentials?.username || 'SYSTEM';

  const [formData, setFormData] = useState({
    code: '', name: '', type: 'OTHER', parent: '00', nlevel: '1', isActive: true, groupcode: '1', offcode: '1010', cashFlowCode: ''
  });

  const [currentMode, setCurrentMode] = useState('new');
  const [accounts, setAccounts] = useState([]);
  const [anoteCodes, setAnoteCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showCashFlowNotes, setShowCashFlowNotes] = useState(false);
  const [screenConfig, setScreenConfig] = useState(null);
  const [menuId, setMenuId] = useState(null);

  // Load screen configuration
  useEffect(() => {
    const loadScreenConfig = async () => {
      try {
        const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ screenName: 'Chart of Accounts' })
        });
        const data = await response.json();
        if (data.success) {
          setScreenConfig(data.screen);
          setMenuId(data.screen.id);
        }
      } catch (error) {
        console.error('Error loading screen config:', error);
      }
    };
    loadScreenConfig();
  }, []);

  // Form helpers
  const updateFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const setAllFormData = (data) => setFormData(data);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setIsDataLoading(true);
    setMessage('');
    try {
      const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          tableName: API_CONFIG.TABLE_NAME,
          usePagination: false
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && Array.isArray(data.rows)) {
        const normalized = data.rows.map(acc => ({
          code: normalizeValue(acc.code || acc.CODE),
          name: normalizeValue(acc.name || acc.NAME),
          parent: normalizeValue(acc.parent || acc.PARENT || '00'),
          nlevel: normalizeValue(acc.nlevel || acc.NLEVEL || '1'),
          groupcode: normalizeValue(acc.groupcode || acc.GROUPCODE || '1'),
          offcode: normalizeValue(acc.offcode || acc.OFFCODE || '1010'),
          type: normalizeValue(acc.type || acc.TYPE || determineAccountType(acc.code || acc.CODE)),
          isActive: acc.isActive === true || acc.isActive === 'true' || acc.isActive === 1 || acc.isActive === '1' || acc.isActive === 'True',
          cashFlowCode: normalizeValue(acc.atDrCode || acc.ATDRCODE || '')
        }));
        setAccounts(normalized);
      } else {
        setMessage('Error: API returned success=false or invalid data structure.');
        setAccounts([]);
      }
    } catch (err) {
      console.error('fetchAccounts', err);
      setMessage(`Error fetching accounts: ${err.message}`);
      setAccounts([]);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  const fetchAnoteCodes = useCallback(async () => {
    try {
      const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          tableName: API_CONFIG.CASH_FLOW_TABLE,
          usePagination: false
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && Array.isArray(data.rows)) {
        const normalized = data.rows.map(r => ({ 
          code: normalizeValue(r.code || r.CODE), 
          name: normalizeValue(r.name || r.NAME) 
        }));
        setAnoteCodes(normalized);
      } else setAnoteCodes([]);
    } catch (err) { 
      console.error('fetchAnoteCodes', err); 
      setAnoteCodes([]);
    }
  }, []);

  useEffect(() => { 
    fetchAccounts(); 
    fetchAnoteCodes(); 
  }, [fetchAccounts, fetchAnoteCodes]);

  // Code generation
  const generateChildCode = (parentCode) => {
    const children = accounts.filter(acc => acc.parent === parentCode);
    const expectedSuffixLength = (parentCode.length === 0 || parentCode === '00') ? 2 : (parentCode.length >= 6 ? 4 : 2);
    if (children.length === 0) return parentCode + '1'.padStart(expectedSuffixLength, '0');

    const numericSuffixes = children.map(acc => {
      const full = normalizeValue(acc.code);
      if (full.length > parentCode.length) {
        const suffixStr = full.slice(parentCode.length);
        return { suffix: parseInt(suffixStr) || 0, suffixStr };
      }
      return { suffix: 0, suffixStr: '' };
    });
    const maxObj = numericSuffixes.reduce((mx, o) => o.suffix > mx.suffix ? o : mx, { suffix: 0, suffixStr: '' });
    const actualSuffixLength = maxObj.suffixStr.length || expectedSuffixLength;
    const newNum = maxObj.suffix + 1;
    const finalSuffixLength = Math.min(actualSuffixLength, 4);
    const newSuffix = newNum.toString().padStart(finalSuffixLength, '0');
    return parentCode + newSuffix;
  };

  // Loading account into form
  const loadAccountDataIntoForm = useCallback((account) => {
    setAllFormData({
      code: normalizeValue(account.code), 
      name: normalizeValue(account.name), 
      type: normalizeValue(account.type),
      parent: normalizeValue(account.parent), 
      nlevel: normalizeValue(account.nlevel),
      isActive: account.isActive, 
      groupcode: normalizeValue(account.groupcode),
      offcode: normalizeValue(account.offcode), 
      cashFlowCode: normalizeValue(account.cashFlowCode || '')
    });
    setSelectedAccount(account);
  }, []);

  const setupNewRootAccount = () => {
    if (!hasPermission || !hasPermission(menuId, 'add')) {
      setMessage('⚠️ You do not have permission to create new accounts');
      return;
    }
    const rootAccounts = accounts.filter(a => a.parent === '00');
    const maxCode = rootAccounts.reduce((mx, a) => {
      const v = parseInt(normalizeValue(a.code).slice(0, 2)) || 0; 
      return v > mx ? v : mx;
    }, 0);
    const newRootCode = (maxCode + 1).toString().padStart(2, '0');
    const autoType = determineAccountType(newRootCode);
    setAllFormData({ 
      code: newRootCode, 
      name: '', 
      type: autoType, 
      parent: '00', 
      nlevel: '1', 
      isActive: true, 
      groupcode: newRootCode, 
      offcode: '1010', 
      cashFlowCode: '' 
    });
    setSelectedAccount(null); 
    setCurrentMode('new'); 
    setMessage(`Ready to create a new Root Account (Level 1, Type: ${autoType}).`);
  };

  const setupNewChildAccount = (parentAccount) => {
    if (!hasPermission || !hasPermission(menuId, 'add')) {
      setMessage('⚠️ You do not have permission to create new accounts');
      return;
    }
    const pcode = normalizeValue(parentAccount.code);
    const plevel = parseInt(normalizeValue(parentAccount.nlevel || '1'));
    
    if (plevel >= 4) {
      setMessage('⚠️ Cannot create a new child account. Maximum hierarchy level (4) reached.');
      return;
    }
    
    const newCode = generateChildCode(pcode);
    const autoType = determineAccountType(newCode);
    setAllFormData({ 
      code: newCode, 
      name: '', 
      type: autoType, 
      parent: pcode, 
      nlevel: String(plevel + 1), 
      isActive: true, 
      groupcode: normalizeValue(parentAccount.groupcode || '1'), 
      offcode: normalizeValue(parentAccount.offcode || '1010'), 
      cashFlowCode: '' 
    });
    setCurrentMode('new'); 
    setMessage(`Ready to create a child account under ${pcode}. New Code: ${newCode}`);
  };

  // Selection & new click
  const handleAccountSelect = (account) => { 
    if (!hasPermission || !hasPermission(menuId, 'view')) {
      setMessage('⚠️ You do not have permission to view accounts');
      return;
    }
    setCurrentMode('edit'); 
    loadAccountDataIntoForm(account); 
    setMessage(`Viewing/Editing Account: ${normalizeValue(account.code)} - ${normalizeValue(account.name)}`); 
  };
  
  const handleNewAccountClick = () => { 
    if (selectedAccount && currentMode === 'edit') {
      setupNewChildAccount(selectedAccount); 
    } else {
      setupNewRootAccount(); 
    }
  };

  const handleDeleteAccount = async (account) => {
    if (!hasPermission || !hasPermission(menuId, 'delete')) {
      setMessage('⚠️ You do not have permission to delete accounts');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete account "${account.code} - ${account.name}"?`)) return;
    
    setIsLoading(true);
    try {
      const payload = {
        tableName: API_CONFIG.TABLE_NAME,
        where: { code: account.code, offcode: account.offcode }
      };
      
      const resp = await fetch(API_CONFIG.DELETE_RECORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) throw new Error('Delete failed');
      const data = await resp.json();
      
      if (data.success) {
        await fetchAccounts();
        if (selectedAccount && selectedAccount.code === account.code) {
          setSelectedAccount(null);
          setFormData({
            code: '', name: '', type: 'OTHER', parent: '00', nlevel: '1', 
            isActive: true, groupcode: '1', offcode: '1010', cashFlowCode: ''
          });
          setCurrentMode('new');
        }
        setMessage('✅ Account deleted successfully!');
      } else {
        setMessage('❌ Delete failed: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('delete account', err);
      setMessage(`❌ Delete error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save account (insert/update)
  const handleSave = async () => {
    if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
      setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} accounts`);
      return;
    }

    const { code, name, type, nlevel, cashFlowCode, offcode } = formData;
    if (!code || !name || !type) { 
      setMessage('⚠️ Account Code, Name, and Transaction Type are required.'); 
      return; 
    }
    
    setIsLoading(true); 
    setMessage('');
    const now = new Date().toISOString();
    const isLeaf = parseInt(nlevel) === 4;
    const finalCashFlowCode = isLeaf && cashFlowCode ? cashFlowCode : null;

    const accountRecord = {
      offcode,
      code,
      name,
      type: type,
      groupcode: formData.groupcode,
      parent: formData.parent,
      nlevel: formData.nlevel,
      isActive: formData.isActive ? 'True' : 'False',
      atDrCode: finalCashFlowCode,
      atCrCode: finalCashFlowCode,
      Debit: "0.00",
      Credit: "0.00",
      ProjectGroupCode: "00001",
      DebitE: "0.00",
      CreditE: "0.00",
      isAccountLevel: "false",
      alternativeCode: "",
      AssociateGLCode: "",
      FCDebitE: "0.00",
      FCCreditE: "0.00",
      isFCAccount: "false",
      DebitPosted: "0.00",
      CreditPosted: "0.00",
      DebitUnPosted: "0.00",
      CreditUnPosted: "0.00",
    };

    if (currentMode === 'new') {
      accountRecord.createdby = USER_LOGIN;
      accountRecord.createdate = now;
    } else {
      accountRecord.editby = USER_LOGIN;
      accountRecord.editdate = now;
    }

    const payload = { tableName: API_CONFIG.TABLE_NAME, data: accountRecord };
    let endpoint = API_CONFIG.INSERT_RECORD;
    let successMessage = '✅ Account created successfully!';
    
    if (currentMode === 'edit') { 
      endpoint = API_CONFIG.UPDATE_RECORD; 
      successMessage = '✅ Account updated successfully!'; 
      payload.where = { code: code, offcode: offcode }; 
    }

    try {
      const resp = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!resp.ok) {
        let errorText = `API request failed with status: ${resp.status}`;
        try { 
          const ed = await resp.json(); 
          errorText = ed.error || ed.message || errorText; 
        } catch (e) {}
        throw new Error(errorText);
      }
      const data = await resp.json();
      if (data.success) {
        setMessage(successMessage);
        await fetchAccounts();
        if (currentMode === 'new') {
          if (formData.parent !== '00' && selectedAccount) {
            setupNewChildAccount(selectedAccount);
          } else {
            setupNewRootAccount();
          }
        }
      } else { 
        setMessage(`❌ Save Failed: ${data.message || 'API returned a failure signal.'}`); 
      }
    } catch (err) {
      console.error('save account', err);
      setMessage(`❌ Critical Save Error: ${err.message}`);
    } finally { 
      setIsLoading(false); 
    }
  };

  if (rightsLoading && !menuId) {
    return (
      <div className="loading-container">
        <Icon.Loader className="loader spin" />
        <p>Loading user rights...</p>
      </div>
    );
  }

  return (
    <div className="cfa-page">
      <div className="app-header">
        <div className="header-brand">
          <Icon.Chart className="brand-icon" />
          <div>
            <h1>Chart of Accounts</h1>
            <div className="muted">Manage your financial account hierarchy</div>
          </div>
        </div>
        <div className="header-user">
          <Icon.Users className="icon-sm" />
          <span>{USER_LOGIN}</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-section">
          {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
            <button className="toolbar-btn primary" onClick={handleSave} disabled={isLoading}>
              <Icon.Save /> {isLoading ? 'Saving...' : 'Save'}
            </button>
          )}
          {hasPermission && hasPermission(menuId, 'add') && (
            <button className="toolbar-btn" onClick={handleNewAccountClick}>
              <Icon.Plus /> New Account
            </button>
          )}
          {hasPermission && hasPermission(menuId, 'edit') && (
            <button className="toolbar-btn" onClick={() => { 
              if (selectedAccount) { 
                setCurrentMode('edit'); 
                loadAccountDataIntoForm(selectedAccount); 
              } else {
                setMessage('Select an account to edit'); 
              }
            }}>
              <Icon.Edit /> Edit
            </button>
          )}
        </div>

        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => { fetchAccounts(); setMessage('Refreshed'); }}>
            <Icon.Refresh /> Refresh
          </button>
          <button className="toolbar-btn" onClick={() => setShowCashFlowNotes(true)}>
            <Icon.CashFlow /> Cash Flow Notes
          </button>
        </div>
      </div>

      <div className="content-area">
        <AccountTreeSidebar 
          accounts={accounts} 
          selectedAccount={selectedAccount} 
          onAccountSelect={handleAccountSelect} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          isLoading={isDataLoading}
          hasPermission={hasPermission}
          menuId={menuId}
          onDelete={handleDeleteAccount}
        />
        
        <div className="main-content">
          <div className="content-tabs">
            <button className={`tab ${true ? 'active' : ''}`}>
              <Icon.FileText /> Account Details
            </button>
            <button className="tab" onClick={() => setShowCashFlowNotes(true)}>
              <Icon.CashFlow /> BS/PL Attachments
            </button>
          </div>

          <div className="content-panel">
            <AccountDetailForm 
              formData={formData} 
              onFormChange={updateFormData} 
              onSave={handleSave} 
              onNewAccount={handleNewAccountClick} 
              currentMode={currentMode} 
              selectedAccount={selectedAccount} 
              anoteCodes={anoteCodes} 
              isLoading={isLoading} 
              isDataLoading={isDataLoading} 
              transactionTypes={FIXED_TRANSACTION_TYPES}
              hasPermission={hasPermission}
              menuId={menuId}
            />
          </div>
        </div>
      </div>

      <CashFlowNotesManager 
        isVisible={showCashFlowNotes} 
        onClose={() => setShowCashFlowNotes(false)}
        hasPermission={hasPermission}
        menuId={menuId}
      />

      {message && (
        <div className={`toast ${message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'success'}`}>
          <div className="toast-content">
            {message.includes('✅') && <Icon.CheckCircle />}
            {message.includes('❌') && <Icon.XCircle />}
            {message.includes('⚠️') && <Icon.XCircle />}
            <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
          </div>
          <button className="toast-close" onClick={() => setMessage('')}>×</button>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsManager;




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import "./ChartofAccount.css";
// import { AuthContext } from "../../AuthContext";
// import { useRights } from "../../context/RightsContext";
// import API_BASE1 from "../../config";
// import Pagination from '../Common/Pagination'; // Import the pagination component

// /* ---------------------------
//  API & Configuration
// ---------------------------- */
// const API_CONFIG = {
//   BASE_URL: API_BASE1,
//   TABLE_NAME: 'acchartofaccount',
//   CASH_FLOW_TABLE: 'anot',
  
//   // Using your Flask endpoints
//   GET_TABLE_DATA: `${API_BASE1}/get-table-data`,
//   INSERT_RECORD: `${API_BASE1}/table/insert`,
//   UPDATE_RECORD: `${API_BASE1}/table/update`,
//   DELETE_RECORD: `${API_BASE1}/table/delete`,
//   GET_TABLE_STRUCTURE: `${API_BASE1}/get-table-structure`,
//   GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
//   GET_DOCUMENT_STATUSES: `${API_BASE1}/screen/document-statuses`,
// };

// /* ---------------------------
//  Static / Lookup Data
// ---------------------------- */
// const FIXED_TRANSACTION_TYPES = [
//   { code: 'DN', name: 'DEBIT NOTE' }, { code: 'BNK', name: 'BANK' }, { code: 'CASH', name: 'CASH' }, { code: 'CN', name: 'CREDIT NOTE' },
//   { code: 'CUST', name: 'CUSTOMER' }, { code: 'CUSTSUP', name: 'CUSTOMER/SUPPLIER' }, { code: 'LAB', name: 'LABOUR' },
//   { code: 'LC', name: 'LC' }, { code: 'OTHER', name: 'OTHER' }, { code: 'SALES', name: 'SALESMAN' }, { code: 'STAFF', name: 'STAFF' },
//   { code: 'SUP', name: 'SUPPLIER' }, { code: 'TRP', name: 'TRANSPORTER' },
// ];

// const CODE_TYPES = [
//   { code: 'I', name: 'Item' }, { code: 'HA', name: 'Header Account' }, { code: 'IT', name: 'Item Total' }, { code: 'EL', name: 'Empty Line' },
//   { code: 'LS', name: 'Line Space' }, { code: 'LD', name: 'Line Double' }, { code: 'BPN', name: 'Balance Sheet Note' },
// ];

// const V_TYPES = [
//   { code: 'P', name: 'Profit & Loss' }, { code: 'B', name: 'Balance Sheet' }, { code: 'CF', name: 'Cash Flow' },
// ];

// /* ---------------------------
//  Icons (using modern SVG icons as per your request)
// ---------------------------- */
// const Icon = {
//   Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
//   Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
//   Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
//   Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6M1 6h22"></path></svg>,
//   ChevronRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
//   ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
//   FileText: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
//   Folder: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
//   Chart: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>,
//   Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
//   CashFlow: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8V4h16z"></path><path d="M12 18v-4a4 4 0 0 1-4-4"></path><path d="M12 18v-4a4 4 0 0 0 4-4"></path></svg>,
//   Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
//   Account: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
//   CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
//   XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="12"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
//   Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2"/></svg>,
//   Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//   Database: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
// };

// /* ---------------------------
//  Helper Functions
// ---------------------------- */
// const normalizeValue = (value) => String(value === null || value === undefined ? '' : value);

// const determineAccountType = (accountCode) => {
//   const firstDigit = normalizeValue(accountCode).trim().charAt(0);
//   switch (firstDigit) {
//     case '1': return 'ASSET';
//     case '2': return 'LIABILITY';
//     case '3': return 'EQUITY';
//     case '4': return 'REVENUE';
//     case '5': return 'EXPENSE';
//     default: return 'OTHER';
//   }
// };

// /* ---------------------------
//  Cash Flow Notes Manager (Modal)
// ---------------------------- */
// const CashFlowNotesManager = ({ isVisible, onClose, hasPermission, menuId, credentials }) => {
//   const [notes, setNotes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchType, setSearchType] = useState('P');
//   const [formData, setFormData] = useState({
//     offcode: credentials?.offcode || '1010', code: '', name: '', codeType: 'I', vType: 'P',
//     sorting: '0', figureBehavour: '1', isEnable: true, formula: '', BPNCode: ''
//   });
//   const [isEditing, setIsEditing] = useState(false);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   const CODE_RANGES = {
//     'P': { min: 1101, max: 1500, next: 1501 },
//     'B': { min: 1501, max: 5999, next: 6000 },
//     'CF': { min: 6000, max: 9999, next: null }
//   };

//   const fetchNotes = useCallback(async () => {
//     setIsLoading(true);
//     setErrorMessage('');
//     try {
//       const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ 
//           tableName: API_CONFIG.CASH_FLOW_TABLE,
//           usePagination: false
//         })
//       });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       const data = await resp.json();
//       if (data.success && Array.isArray(data.rows)) {
//         let filtered = data.rows;
//         if (searchType === 'P') filtered = data.rows.filter(n => { 
//           const c = parseInt(n.code); 
//           return c >= CODE_RANGES.P.min && c <= CODE_RANGES.P.max; 
//         });
//         else if (searchType === 'B') filtered = data.rows.filter(n => { 
//           const c = parseInt(n.code); 
//           return c >= CODE_RANGES.B.min && c <= CODE_RANGES.B.max; 
//         });
//         else if (searchType === 'CF') filtered = data.rows.filter(n => { 
//           const c = parseInt(n.code); 
//           return c >= CODE_RANGES.CF.min && c <= CODE_RANGES.CF.max; 
//         });
//         const normalized = filtered.map(n => ({
//           offcode: credentials?.offcode || '1010',
//           code: normalizeValue(n.code),
//           name: normalizeValue(n.name),
//           codeType: normalizeValue(n.codeType || 'I'),
//           vType: normalizeValue(n.vType || 'P'),
//           sorting: normalizeValue(n.sorting || '0'),
//           figureBehavour: normalizeValue(n.figureBehavour || '1'),
//           isEnable: n.isEnable === true || n.isEnable === 'true' || n.isEnable === 'True',
//           formula: normalizeValue(n.formula || ''),
//           BPNCode: normalizeValue(n.BPNCode || '')
//         }));
//         setNotes(normalized);
//       } else {
//         setNotes([]);
//       }
//     } catch (err) {
//       console.error('fetchNotes', err);
//       setErrorMessage('Failed to fetch notes');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [searchType, credentials]);

//   useEffect(() => {
//     if (isVisible) {
//       fetchNotes();
//       resetForm();
//     }
//   }, [isVisible, fetchNotes]);

//   const generateNextCode = useCallback(() => {
//     const range = CODE_RANGES[searchType];
//     if (!range) return '';
    
//     const existingCodes = notes
//       .filter(note => {
//         const codeNum = parseInt(note.code);
//         return codeNum >= range.min && codeNum <= range.max;
//       })
//       .map(note => parseInt(note.code))
//       .sort((a, b) => a - b);
    
//     if (existingCodes.length === 0) {
//       return range.min.toString();
//     }
    
//     const maxExistingCode = Math.max(...existingCodes);
//     const nextCode = maxExistingCode + 1;
    
//     if (nextCode > range.max) {
//       setErrorMessage(`Maximum code limit reached for ${searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes. Maximum allowed: ${range.max}`);
//       return '';
//     }
    
//     return nextCode.toString();
//   }, [notes, searchType]);

//   const handleInput = (f, v) => {
//     setFormData(prev => ({ ...prev, [f]: v }));
//     setErrorMessage('');
//   };

//   const resetForm = () => {
//     const nextCode = generateNextCode();
//     setFormData({ 
//       offcode: credentials?.offcode || '1010', 
//       code: nextCode, 
//       name: '', 
//       codeType: 'I', 
//       vType: searchType, 
//       sorting: '0', 
//       figureBehavour: '1', 
//       isEnable: true, 
//       formula: '', 
//       BPNCode: '' 
//     });
//     setIsEditing(false);
//     setShowAddForm(false);
//     setErrorMessage('');
//   };

//   const handleAddNew = () => {
//     if (!hasPermission || !hasPermission(menuId, 'add')) {
//       setErrorMessage('You do not have permission to add notes');
//       return;
//     }
//     const nextCode = generateNextCode();
//     if (!nextCode) return;
//     setFormData(prev => ({ ...prev, code: nextCode }));
//     setShowAddForm(true);
//     setErrorMessage('');
//   };

//   const validateCode = (code) => {
//     const codeNum = parseInt(code);
//     const range = CODE_RANGES[searchType];
    
//     if (!range) return false;
    
//     if (codeNum < range.min || codeNum > range.max) {
//       setErrorMessage(`Code must be between ${range.min} and ${range.max} for ${searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes`);
//       return false;
//     }
    
//     if (!isEditing && notes.some(note => note.code === code)) {
//       setErrorMessage(`Code ${code} already exists`);
//       return false;
//     }
    
//     return true;
//   };

//   const handleSave = async () => {
//     if (!formData.code || !formData.name) { 
//       setErrorMessage('Code and Name are required');
//       return; 
//     }
    
//     if (!validateCode(formData.code)) {
//       return;
//     }
    
//     setIsLoading(true);
//     setErrorMessage('');
    
//     try {
//       const payload = { 
//         tableName: API_CONFIG.CASH_FLOW_TABLE, 
//         data: { 
//           ...formData, 
//           isEnable: formData.isEnable ? 'True' : 'False' 
//         } 
//       };
      
//       let endpoint = API_CONFIG.INSERT_RECORD;
//       if (isEditing) { 
//         endpoint = API_CONFIG.UPDATE_RECORD; 
//         payload.where = { code: formData.code, offcode: formData.offcode }; 
//       }
      
//       const resp = await fetch(endpoint, { 
//         method: 'POST', 
//         headers: { 'Content-Type': 'application/json' }, 
//         body: JSON.stringify(payload) 
//       });
      
//       if (!resp.ok) throw new Error(`Save failed ${resp.status}`);
//       const data = await resp.json();
      
//       if (data.success) { 
//         await fetchNotes(); 
//         resetForm();
//         setErrorMessage('');
//       } else {
//         setErrorMessage('Save failed: ' + (data.message || data.error || 'unknown'));
//       }
//     } catch (err) { 
//       console.error('save note', err); 
//       setErrorMessage('Save failed: ' + err.message); 
//     } finally { 
//       setIsLoading(false); 
//     }
//   };

//   const handleDelete = async (note) => {
//     if (!hasPermission || !hasPermission(menuId, 'delete')) {
//       setErrorMessage('You do not have permission to delete notes');
//       return;
//     }
//     if (!window.confirm(`Are you sure you want to delete note "${note.name}"?`)) return;
//     try {
//       const payload = { 
//         tableName: API_CONFIG.CASH_FLOW_TABLE, 
//         where: { code: note.code, offcode: note.offcode } 
//       };
//       const resp = await fetch(API_CONFIG.DELETE_RECORD, { 
//         method: 'POST', 
//         headers: { 'Content-Type': 'application/json' }, 
//         body: JSON.stringify(payload) 
//       });
//       if (!resp.ok) throw new Error('Delete failed');
//       const data = await resp.json();
//       if (data.success) {
//         await fetchNotes();
//         setErrorMessage('');
//       } else {
//         setErrorMessage('Delete failed');
//       }
//     } catch (err) { 
//       console.error(err); 
//       setErrorMessage('Delete failed: ' + err.message); 
//     }
//   };

//   const handleEdit = (note) => {
//     if (!hasPermission || !hasPermission(menuId, 'edit')) {
//       setErrorMessage('You do not have permission to edit notes');
//       return;
//     }
//     setFormData({ 
//       offcode: note.offcode, 
//       code: note.code, 
//       name: note.name, 
//       codeType: note.codeType, 
//       vType: note.vType, 
//       sorting: note.sorting, 
//       figureBehavour: note.figureBehavour, 
//       isEnable: note.isEnable, 
//       formula: note.formula, 
//       BPNCode: note.BPNCode 
//     });
//     setIsEditing(true);
//     setShowAddForm(true);
//     setErrorMessage('');
//   };

//   useEffect(() => {
//     if (showAddForm && !isEditing) {
//       const nextCode = generateNextCode();
//       if (nextCode) {
//         setFormData(prev => ({ ...prev, code: nextCode, vType: searchType }));
//       }
//     }
//   }, [searchType, showAddForm, isEditing, generateNextCode]);

//   if (!isVisible) return null;

//   return (
//     <div className="cfa-modal-backdrop">
//       <div className="cfa-modal cash-flow-modal">
//         <div className="cfa-modal-header">
//           <div className="cfa-modal-title">
//             <div className="title-icon">
//               <Icon.CashFlow />
//             </div>
//             <div className="title-content">
//               <h3>Cash Flow Notes Manager</h3>
//               <div className="muted">Manage financial statement notes and formulas</div>
//             </div>
//           </div>
//           <button className="cfa-close-btn" onClick={onClose} title="Close">
//             <Icon.XCircle />
//           </button>
//         </div>

//         <div className="cfa-modal-controls">
//           <div className="controls-left">
//             <div className="control-group">
//               <label>Filter by Type</label>
//               <select 
//                 value={searchType} 
//                 onChange={e => setSearchType(e.target.value)} 
//                 className="type-select"
//                 disabled={showAddForm && !isEditing}
//               >
//                 <option value="P">Profit & Loss Notes (1101-1500)</option>
//                 <option value="B">Balance Sheet Notes (1501-6000)</option>
//                 <option value="CF">Cash Flow Notes (6001-9999)</option>
//               </select>
//             </div>
//             <div className="notes-count">
//               <span className="count-badge">
//                 {notes.length} / {CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1} notes
//               </span>
//             </div>
//           </div>
          
//           <div className="controls-right">
//             <button className="btn btn-outline" onClick={fetchNotes} disabled={isLoading}>
//               <Icon.Refresh className={isLoading ? 'spin' : ''} />
//               {isLoading ? 'Refreshing...' : 'Refresh'}
//             </button>
//             {hasPermission && hasPermission(menuId, 'add') && (
//               <button 
//                 className="btn btn-primary" 
//                 onClick={handleAddNew}
//                 disabled={notes.length >= (CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1)}
//                 title={notes.length >= (CODE_RANGES[searchType]?.max - CODE_RANGES[searchType]?.min + 1) ? 'Maximum limit reached' : ''}
//               >
//                 <Icon.Plus />
//                 Add New Note
//               </button>
//             )}
//           </div>
//         </div>

//         {errorMessage && (
//           <div className="error-message">
//             <Icon.XCircle />
//             <span>{errorMessage}</span>
//             <button className="error-close" onClick={() => setErrorMessage('')}>
//               <Icon.XCircle />
//             </button>
//           </div>
//         )}

//         <div className="cfa-modal-body">
//           {showAddForm && (hasPermission && (hasPermission(menuId, isEditing ? 'edit' : 'add'))) && (
//             <div className="cfa-form-section">
//               <div className="form-section-header">
//                 <h4>
//                   <Icon.FileText />
//                   {isEditing ? 'Edit Note' : 'Create New Note'}
//                   {!isEditing && formData.code && (
//                     <span className="auto-generated-badge">Auto-generated: {formData.code}</span>
//                   )}
//                 </h4>
//                 <button className="btn btn-text" onClick={resetForm}>
//                   <Icon.XCircle />
//                 </button>
//               </div>
              
//               <div className="form-grid">
//                 <div className="form-group">
//                   <label>Code *</label>
//                   <input 
//                     value={formData.code} 
//                     onChange={e => handleInput('code', e.target.value)}
//                     placeholder="Enter note code..."
//                     className="form-input"
//                     disabled={!isEditing}
//                   />
//                   {!isEditing && (
//                     <div className="form-hint">
//                       Code auto-generated. Range: {CODE_RANGES[searchType]?.min} - {CODE_RANGES[searchType]?.max}
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="form-group">
//                   <label>Name *</label>
//                   <input 
//                     value={formData.name} 
//                     onChange={e => handleInput('name', e.target.value)}
//                     placeholder="Enter note name..."
//                     className="form-input"
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Code Type</label>
//                   <select 
//                     value={formData.codeType} 
//                     onChange={e => handleInput('codeType', e.target.value)}
//                     className="form-select"
//                   >
//                     {CODE_TYPES.map(x => (
//                       <option key={x.code} value={x.code}>
//                         {x.code} - {x.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div className="form-group">
//                   <label>V Type</label>
//                   <select 
//                     value={formData.vType} 
//                     onChange={e => handleInput('vType', e.target.value)}
//                     className="form-select"
//                     disabled={!isEditing}
//                   >
//                     {V_TYPES.map(x => (
//                       <option key={x.code} value={x.code}>
//                         {x.code} - {x.name}
//                       </option>
//                     ))}
//                   </select>
//                   {!isEditing && (
//                     <div className="form-hint">Automatically set to {searchType}</div>
//                   )}
//                 </div>
                
//                 <div className="form-group full-width">
//                   <label>Formula</label>
//                   <input 
//                     value={formData.formula} 
//                     onChange={e => handleInput('formula', e.target.value)}
//                     placeholder="e.g., 1110-1120 or SUM(1101,1102,1103)"
//                     className="form-input"
//                   />
//                   <div className="form-hint">Enter account codes and operators (+, -, *, /) or SUM function</div>
//                 </div>
                
//                 <div className="form-group full-width">
//                   <label className="checkbox-label">
//                     <input 
//                       type="checkbox" 
//                       checked={formData.isEnable} 
//                       onChange={e => handleInput('isEnable', e.target.checked)} 
//                     />
//                     <span className="checkmark"></span>
//                     Enabled Note
//                   </label>
//                 </div>
//               </div>
              
//               <div className="form-actions">
//                 <button 
//                   className="btn btn-success" 
//                   onClick={handleSave} 
//                   disabled={isLoading || !formData.code || !formData.name || !!errorMessage}
//                 >
//                   {isLoading ? (
//                     <Icon.Loader className="spin" />
//                   ) : (
//                     <Icon.Save />
//                   )}
//                   {isLoading ? 'Saving...' : (isEditing ? 'Update Note' : 'Save Note')}
//                 </button>
//                 <button className="btn btn-text" onClick={resetForm}>
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="cfa-list-section">
//             <div className="list-section-header">
//               <h4>
//                 <Icon.Database />
//                 Notes List
//                 <span className="count-pill">{notes.length}</span>
//               </h4>
//               <div className="list-actions">
//                 <div className="search-box">
//                   <Icon.Search />
//                   <input 
//                     type="text" 
//                     placeholder="Search notes..." 
//                     className="search-input"
//                   />
//                 </div>
//               </div>
//             </div>
            
//             <div className="notes-list-container">
//               {isLoading ? (
//                 <div className="loading-state">
//                   <Icon.Loader className="loader spin" />
//                   <p>Loading notes...</p>
//                 </div>
//               ) : notes.length === 0 ? (
//                 <div className="empty-state">
//                   <Icon.Folder className="empty-icon" />
//                   <h4>No notes found</h4>
//                   <p>No {searchType === 'P' ? 'Profit & Loss' : searchType === 'B' ? 'Balance Sheet' : 'Cash Flow'} notes available</p>
//                   {hasPermission && hasPermission(menuId, 'add') && (
//                     <button className="btn btn-primary" onClick={handleAddNew}>
//                       <Icon.Plus />
//                       Create First Note
//                     </button>
//                   )}
//                 </div>
//               ) : (
//                 <div className="notes-grid">
//                   {notes.map(note => (
//                     <div key={`${note.offcode}-${note.code}`} className="note-card">
//                       <div className="note-header">
//                         <div className="note-code-badge">{note.code}</div>
//                         <div className="note-actions">
//                           {hasPermission && hasPermission(menuId, 'edit') && (
//                             <button 
//                               className="icon-btn btn-edit" 
//                               onClick={() => handleEdit(note)} 
//                               title="Edit Note"
//                             >
//                               <Icon.Edit />
//                             </button>
//                           )}
//                           {hasPermission && hasPermission(menuId, 'delete') && (
//                             <button 
//                               className="icon-btn btn-delete" 
//                               onClick={() => handleDelete(note)} 
//                               title="Delete Note"
//                             >
//                               <Icon.Trash />
//                             </button>
//                           )}
//                         </div>
//                       </div>
                      
//                       <div className="note-content">
//                         <h5 className="note-title">{note.name}</h5>
//                         <div className="note-meta">
//                           <span className={`status-badge ${note.isEnable ? 'active' : 'inactive'}`}>
//                             {note.isEnable ? 'Active' : 'Inactive'}
//                           </span>
//                           <span className="type-badge">{note.codeType}</span>
//                           <span className="vtype-badge">{note.vType}</span>
//                         </div>
                        
//                         {note.formula && (
//                           <div className="note-formula">
//                             <Icon.FileText className="formula-icon" />
//                             <span className="formula-text">{note.formula}</span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ---------------------------
//  Recursive Tree Node component
// ---------------------------- */
// const TreeNode = ({ node, level = 0, onSelect, selectedAccount, searchTerm, isNodeVisible, hasPermission, menuId, onDelete }) => {
//   const nodeCode = normalizeValue(node.code);
//   const nodeName = normalizeValue(node.name);
//   const hasChildren = node.children && node.children.length > 0;
//   const isSelected = selectedAccount && selectedAccount.code === nodeCode;

//   const [expanded, setExpanded] = useState(level < 2 || searchTerm !== '');

//   useEffect(() => {
//     if (searchTerm !== '') {
//       const matches = isNodeVisible(node) || (hasChildren && node.children.length > 0);
//       if (matches) setExpanded(true);
//     } else {
//       setExpanded(level < 2);
//     }
//   }, [searchTerm, level, hasChildren, node, isNodeVisible]);

//   const handleDeleteClick = (e) => {
//     e.stopPropagation();
//     onDelete(node);
//   };

//   return (
//     <div className="tree-node">
//       <div className={`tree-node-row ${isSelected ? 'selected' : ''}`} style={{ paddingLeft: `${level * 18 + 12}px` }} onClick={() => onSelect(node)}>
//         <div className="tree-left">
//           {hasChildren ? (
//             <button className="toggle-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
//               {expanded ? <Icon.ChevronDown className="small" /> : <Icon.ChevronRight className="small" />}
//             </button>
//           ) : <div className="file-icon"><Icon.Account /></div>}
//           <div className="tree-main">
//             <div className="code">{nodeCode}</div>
//             <div className="name">{nodeName}</div>
//             <div className="node-level">Level {node.nlevel}</div>
//           </div>
//         </div>

//         <div className="tree-right">
//           <div className={`status ${node.isActive ? 'active' : 'inactive'}`}>
//             {node.isActive ? '✓' : '✗'}
//           </div>
//           {hasPermission && hasPermission(menuId, 'delete') && (
//             <button 
//               className="delete-btn" 
//               onClick={handleDeleteClick}
//               title="Delete Account"
//             >
//               <Icon.Trash />
//             </button>
//           )}
//         </div>
//       </div>

//       {expanded && hasChildren && (
//         <div className="children">
//           {node.children.map(child => <TreeNode 
//             key={normalizeValue(child.code)} 
//             node={child} 
//             level={level + 1} 
//             onSelect={onSelect} 
//             selectedAccount={selectedAccount} 
//             searchTerm={searchTerm} 
//             isNodeVisible={isNodeVisible}
//             hasPermission={hasPermission}
//             menuId={menuId}
//             onDelete={onDelete}
//           />)}
//         </div>
//       )}
//     </div>
//   );
// };

// /* ---------------------------
//  Account Tree Sidebar component with Pagination
// ---------------------------- */
// const AccountTreeSidebar = ({ 
//   accounts, 
//   selectedAccount, 
//   onAccountSelect, 
//   searchTerm, 
//   onSearchChange, 
//   isLoading, 
//   hasPermission, 
//   menuId, 
//   onDelete,
//   currentPage,
//   itemsPerPage,
//   totalItems,
//   onPageChange,
//   isPaginationLoading
// }) => {

//   const buildTree = useCallback((parentCode = '00') => {
//     return accounts
//       .filter(acc => normalizeValue(acc.parent) === parentCode)
//       .sort((a, b) => normalizeValue(a.code).localeCompare(normalizeValue(b.code)))
//       .map(acc => ({ ...acc, children: buildTree(normalizeValue(acc.code)) }));
//   }, [accounts]);

//   const isNodeVisible = useCallback((node) => {
//     const nodeCode = normalizeValue(node.code);
//     const nodeName = normalizeValue(node.name);
//     if (searchTerm === '') return true;
//     return nodeName.toLowerCase().includes(searchTerm.toLowerCase()) || nodeCode.includes(searchTerm);
//   }, [searchTerm]);

//   const filterTree = useCallback((nodes) => {
//     return nodes
//       .map(node => {
//         const children = filterTree(node.children || []);
//         const matches = isNodeVisible(node);
//         if (matches || children.length > 0) return { ...node, children };
//         return null;
//       })
//       .filter(Boolean);
//   }, [isNodeVisible]);

//   const fullTree = buildTree();
//   const visibleTree = filterTree(fullTree);

//   return (
//     <aside className="sidebar fixed-sidebar">
//       <div className="sidebar-top">
//         <div className="sidebar-title">
//           <Icon.Chart className="big" /> 
//           <div>
//             <div className="h3">Account Hierarchy</div>
//             <div className="muted small">{totalItems} accounts</div>
//           </div>
//         </div>
//         <div className="search-wrap">
//           <Icon.Search className="search-icon" />
//           <input 
//             placeholder="Search accounts..." 
//             value={searchTerm} 
//             onChange={e => onSearchChange(e.target.value)} 
//           />
//         </div>
//       </div>

//       <div className="sidebar-body scrollable">
//         {isLoading ? (
//           <div className="center padded"><Icon.Loader className="loader" /></div>
//         ) : visibleTree.length === 0 ? (
//           <div className="empty-state padded">
//             <Icon.Folder className="big-muted" />
//             <div className="muted">No accounts found</div>
//             <div className="small muted">Create a root account to get started</div>
//           </div>
//         ) : (
//           <div className="tree-container">
//             {visibleTree.map(n => <TreeNode 
//               key={normalizeValue(n.code)} 
//               node={n} 
//               onSelect={onAccountSelect} 
//               selectedAccount={selectedAccount} 
//               searchTerm={searchTerm} 
//               isNodeVisible={isNodeVisible}
//               hasPermission={hasPermission}
//               menuId={menuId}
//               onDelete={onDelete}
//             />)}
//           </div>
//         )}
//       </div>

//       <div className="sidebar-footer">
//         <Pagination
//           currentPage={currentPage}
//           totalItems={totalItems}
//           itemsPerPage={itemsPerPage}
//           onPageChange={onPageChange}
//           loading={isPaginationLoading}
//         />
//       </div>
//     </aside>
//   );
// };

// /* ---------------------------
//  Account Detail Form (Right Panel)
// ---------------------------- */
// const AccountDetailForm = ({ formData, onFormChange, onSave, onNewAccount, currentMode, selectedAccount, anoteCodes, isLoading, isDataLoading, transactionTypes, hasPermission, menuId, credentials }) => {
//   const { code, name, type, parent, nlevel, isActive, groupcode, offcode, cashFlowCode } = formData || {};

//   const canCreateNewChild = selectedAccount && parseInt(normalizeValue(selectedAccount.nlevel)) < 4;
//   const isLevel4 = parseInt(nlevel || '1') === 4;
  
//   const showAttachmentOptions = !isLevel4;
//   const isNewMode = currentMode === 'new';

//   const handleInput = (f, v) => onFormChange(f, v);

//   const getTransactionTypeName = (c) => {
//     const found = (transactionTypes || []).find(t => t.code === c);
//     return found ? found.name : c;
//   };

//   const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

//   return (
//     <section className="detail-panel scrollable-panel">
//       <div className="detail-header">
//         <div className="header-content">
//           <h1>{isNewMode ? 'Create New Account' : 'Account Details'}</h1>
//           <div className="header-subtitle">
//             <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
//             <span className="muted">• Level {nlevel}</span>
//             {!isActive && <span className="inactive-badge">INACTIVE</span>}
//             {isLevel4 && <span className="level4-badge">MAX LEVEL</span>}
//           </div>
//         </div>
//         <div className="header-actions">
//           {canEdit && (
//             <button 
//               className="btn btn-outline" 
//               onClick={onNewAccount} 
//               disabled={isLevel4 && !isNewMode || !canEdit}
//               title={isLevel4 ? "Cannot create child at maximum level (4)" : "Create new child account"}
//             >
//               <Icon.Plus /> {selectedAccount && currentMode === 'edit' ? 'New Child' : 'New Root'}
//             </button>
//           )}
//           {canEdit && (
//             <button 
//               className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
//               onClick={onSave} 
//               disabled={isLoading || isDataLoading || !code || !name || !type || !canEdit}
//             >
//               {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
//               {isLoading ? 'Saving...' : 'Save Account'}
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="detail-body">
//         <div className="form-section">
//           <h3><Icon.FileText /> Basic Information</h3>
//           <div className="form-grid">
//             <div className="field">
//               <label>Parent Code</label>
//               <div className="input-with-icon">
//                 <Icon.Folder className="input-icon" />
//                 <input value={parent} disabled className="mono" />
//               </div>
//             </div>
//             <div className="field">
//               <label>Account Code *</label>
//               <div className="input-with-icon">
//                 <Icon.Database className="input-icon" />
//                 <input value={code} disabled className="mono" />
//               </div>
//               {isNewMode && <div className="hint">Auto-generated based on parent</div>}
//             </div>
//             <div className="field">
//               <label>Level</label>
//               <input value={nlevel} disabled />
//             </div>

//             <div className="field full-width">
//               <label>Account Name *</label>
//               <input 
//                 value={name} 
//                 onChange={e => handleInput('name', e.target.value)} 
//                 placeholder="Enter account name..."
//                 disabled={!canEdit}
//               />
//             </div>

//             <div className="field">
//               <label>Account Classification</label>
//               <select value={type} onChange={e => handleInput('type', e.target.value)} disabled={isNewMode || !canEdit}>
//                 <option value="ASSET">Asset</option>
//                 <option value="LIABILITY">Liability</option>
//                 <option value="EQUITY">Equity</option>
//                 <option value="REVENUE">Revenue</option>
//                 <option value="EXPENSE">Expense</option>
//                 <option value="OTHER">Other</option>
//               </select>
//               <div className="hint">Based on account code prefix</div>
//             </div>

//             <div className="field">
//               <label>Transaction Type *</label>
//               <select value={type} onChange={e => handleInput('type', e.target.value)} disabled={!canEdit}>
//                 <option value="">{getTransactionTypeName(type)}</option>
//                 {transactionTypes.map(t => (
//                   <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
//                 ))}
//               </select>
//               <div className="hint">
//                 Selected: <strong>{getTransactionTypeName(type)}</strong>
//               </div>
//             </div>

//             <div className="field">
//               <label>Group Code</label>
//               <input value={groupcode} onChange={e => handleInput('groupcode', e.target.value)} disabled={!canEdit} />
//             </div>

//             <div className="field">
//               <label>Office Code</label>
//               <input value={credentials?.offcode || offcode} disabled />
//             </div>

//             <div className="field checkbox">
//               <label className="checkbox-label">
//                 <input 
//                   type="checkbox" 
//                   checked={isActive} 
//                   onChange={e => handleInput('isActive', e.target.checked)} 
//                   disabled={!canEdit}
//                 />
//                 <span className="checkmark"></span>
//                 Active Account
//               </label>
//             </div>
//           </div>
//         </div>

//         {showAttachmentOptions && (
//           <div className="form-section">
//             <h3><Icon.CashFlow /> Cash Flow Attachment</h3>
//             <div className="attachment-block">
//               <div className="field full-width">
//                 <label>Cash Flow Note</label>
//                 <select value={cashFlowCode} onChange={e => handleInput('cashFlowCode', e.target.value)} disabled={!canEdit}>
//                   <option value="">Select cash flow note (optional)</option>
//                   {anoteCodes.map(a => (
//                     <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
//                   ))}
//                 </select>
//                 <div className="hint">Available for accounts up to Level 3</div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// /* ---------------------------
//  Main Manager Component
// ---------------------------- */
// const ChartOfAccountsManager = () => {
//   const { credentials } = useContext(AuthContext);
//   const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
//   const USER_LOGIN = credentials?.userLogin || credentials?.username || 'SYSTEM';

//   const [formData, setFormData] = useState({
//     code: '', name: '', type: 'OTHER', parent: '00', nlevel: '1', isActive: true, groupcode: '1', offcode: credentials?.offcode || '1010', cashFlowCode: ''
//   });

//   const [currentMode, setCurrentMode] = useState('new');
//   const [accounts, setAccounts] = useState([]);
//   const [anoteCodes, setAnoteCodes] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedAccount, setSelectedAccount] = useState(null);
//   const [message, setMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDataLoading, setIsDataLoading] = useState(true);
//   const [showCashFlowNotes, setShowCashFlowNotes] = useState(false);
//   const [screenConfig, setScreenConfig] = useState(null);
//   const [menuId, setMenuId] = useState(null);

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(50);
//   const [paginatedAccounts, setPaginatedAccounts] = useState([]);
//   const [isPaginationLoading, setIsPaginationLoading] = useState(false);

//   // Load screen configuration
//   useEffect(() => {
//     const loadScreenConfig = async () => {
//       try {
//         const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ screenName: 'Chart of Accounts' })
//         });
//         const data = await response.json();
//         if (data.success) {
//           setScreenConfig(data.screen);
//           setMenuId(data.screen.id);
//         }
//       } catch (error) {
//         console.error('Error loading screen config:', error);
//       }
//     };
//     loadScreenConfig();
//   }, []);

//   // Form helpers
//   const updateFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
//   const setAllFormData = (data) => setFormData(data);

//   // Fetch accounts with pagination
//   const fetchAccounts = useCallback(async (page = currentPage) => {
//     setIsDataLoading(true);
//     setIsPaginationLoading(true);
//     setMessage('');
//     try {
//       const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
//         method: 'POST', 
//         headers: { 'Content-Type': 'application/json' }, 
//         body: JSON.stringify({ 
//           tableName: API_CONFIG.TABLE_NAME,
//           usePagination: true,
//           page: page,
//           itemsPerPage: itemsPerPage,
//           searchTerm: searchTerm
//         })
//       });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       const data = await resp.json();
//       if (data.success && Array.isArray(data.rows)) {
//         const normalized = data.rows.map(acc => ({
//           code: normalizeValue(acc.code || acc.CODE),
//           name: normalizeValue(acc.name || acc.NAME),
//           parent: normalizeValue(acc.parent || acc.PARENT || '00'),
//           nlevel: normalizeValue(acc.nlevel || acc.NLEVEL || '1'),
//           groupcode: normalizeValue(acc.groupcode || acc.GROUPCODE || '1'),
//           offcode: normalizeValue(acc.offcode || acc.OFFCODE || credentials?.offcode || '1010'),
//           type: normalizeValue(acc.type || acc.TYPE || determineAccountType(acc.code || acc.CODE)),
//           isActive: acc.isActive === true || acc.isActive === 'true' || acc.isActive === 1 || acc.isActive === '1' || acc.isActive === 'True',
//           cashFlowCode: normalizeValue(acc.atDrCode || acc.ATDRCODE || '')
//         }));
//         setAccounts(normalized);
//         setPaginatedAccounts(normalized);
//       } else {
//         setMessage('Error: API returned success=false or invalid data structure.');
//         setAccounts([]);
//         setPaginatedAccounts([]);
//       }
//     } catch (err) {
//       console.error('fetchAccounts', err);
//       setMessage(`Error fetching accounts: ${err.message}`);
//       setAccounts([]);
//       setPaginatedAccounts([]);
//     } finally {
//       setIsDataLoading(false);
//       setIsPaginationLoading(false);
//     }
//   }, [credentials, itemsPerPage, searchTerm]);

//   const fetchAnoteCodes = useCallback(async () => {
//     try {
//       const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
//         method: 'POST', 
//         headers: { 'Content-Type': 'application/json' }, 
//         body: JSON.stringify({ 
//           tableName: API_CONFIG.CASH_FLOW_TABLE,
//           usePagination: false
//         })
//       });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       const data = await resp.json();
//       if (data.success && Array.isArray(data.rows)) {
//         const normalized = data.rows.map(r => ({ 
//           code: normalizeValue(r.code || r.CODE), 
//           name: normalizeValue(r.name || r.NAME) 
//         }));
//         setAnoteCodes(normalized);
//       } else setAnoteCodes([]);
//     } catch (err) { 
//       console.error('fetchAnoteCodes', err); 
//       setAnoteCodes([]);
//     }
//   }, []);

//   // Handle page change
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//     fetchAccounts(page);
//   };

//   // Handle search change
//   const handleSearchChange = (term) => {
//     setSearchTerm(term);
//     setCurrentPage(1); // Reset to first page on new search
//     fetchAccounts(1);
//   };

//   useEffect(() => { 
//     fetchAccounts(); 
//     fetchAnoteCodes(); 
//   }, [fetchAccounts, fetchAnoteCodes]);

//   // Code generation
//   const generateChildCode = (parentCode) => {
//     const children = accounts.filter(acc => acc.parent === parentCode);
//     const expectedSuffixLength = (parentCode.length === 0 || parentCode === '00') ? 2 : (parentCode.length >= 6 ? 4 : 2);
//     if (children.length === 0) return parentCode + '1'.padStart(expectedSuffixLength, '0');

//     const numericSuffixes = children.map(acc => {
//       const full = normalizeValue(acc.code);
//       if (full.length > parentCode.length) {
//         const suffixStr = full.slice(parentCode.length);
//         return { suffix: parseInt(suffixStr) || 0, suffixStr };
//       }
//       return { suffix: 0, suffixStr: '' };
//     });
//     const maxObj = numericSuffixes.reduce((mx, o) => o.suffix > mx.suffix ? o : mx, { suffix: 0, suffixStr: '' });
//     const actualSuffixLength = maxObj.suffixStr.length || expectedSuffixLength;
//     const newNum = maxObj.suffix + 1;
//     const finalSuffixLength = Math.min(actualSuffixLength, 4);
//     const newSuffix = newNum.toString().padStart(finalSuffixLength, '0');
//     return parentCode + newSuffix;
//   };

//   // Loading account into form
//   const loadAccountDataIntoForm = useCallback((account) => {
//     setAllFormData({
//       code: normalizeValue(account.code), 
//       name: normalizeValue(account.name), 
//       type: normalizeValue(account.type),
//       parent: normalizeValue(account.parent), 
//       nlevel: normalizeValue(account.nlevel),
//       isActive: account.isActive, 
//       groupcode: normalizeValue(account.groupcode),
//       offcode: normalizeValue(account.offcode), 
//       cashFlowCode: normalizeValue(account.cashFlowCode || '')
//     });
//     setSelectedAccount(account);
//   }, []);

//   const setupNewRootAccount = () => {
//     if (!hasPermission || !hasPermission(menuId, 'add')) {
//       setMessage('⚠️ You do not have permission to create new accounts');
//       return;
//     }
//     const rootAccounts = accounts.filter(a => a.parent === '00');
//     const maxCode = rootAccounts.reduce((mx, a) => {
//       const v = parseInt(normalizeValue(a.code).slice(0, 2)) || 0; 
//       return v > mx ? v : mx;
//     }, 0);
//     const newRootCode = (maxCode + 1).toString().padStart(2, '0');
//     const autoType = determineAccountType(newRootCode);
//     setAllFormData({ 
//       code: newRootCode, 
//       name: '', 
//       type: autoType, 
//       parent: '00', 
//       nlevel: '1', 
//       isActive: true, 
//       groupcode: newRootCode, 
//       offcode: credentials?.offcode || '1010', 
//       cashFlowCode: '' 
//     });
//     setSelectedAccount(null); 
//     setCurrentMode('new'); 
//     setMessage(`Ready to create a new Root Account (Level 1, Type: ${autoType}).`);
//   };

//   const setupNewChildAccount = (parentAccount) => {
//     if (!hasPermission || !hasPermission(menuId, 'add')) {
//       setMessage('⚠️ You do not have permission to create new accounts');
//       return;
//     }
//     const pcode = normalizeValue(parentAccount.code);
//     const plevel = parseInt(normalizeValue(parentAccount.nlevel || '1'));
    
//     if (plevel >= 4) {
//       setMessage('⚠️ Cannot create a new child account. Maximum hierarchy level (4) reached.');
//       return;
//     }
    
//     const newCode = generateChildCode(pcode);
//     const autoType = determineAccountType(newCode);
//     setAllFormData({ 
//       code: newCode, 
//       name: '', 
//       type: autoType, 
//       parent: pcode, 
//       nlevel: String(plevel + 1), 
//       isActive: true, 
//       groupcode: normalizeValue(parentAccount.groupcode || '1'), 
//       offcode: normalizeValue(parentAccount.offcode || credentials?.offcode || '1010'), 
//       cashFlowCode: '' 
//     });
//     setCurrentMode('new'); 
//     setMessage(`Ready to create a child account under ${pcode}. New Code: ${newCode}`);
//   };

//   // Selection & new click
//   const handleAccountSelect = (account) => { 
//     if (!hasPermission || !hasPermission(menuId, 'view')) {
//       setMessage('⚠️ You do not have permission to view accounts');
//       return;
//     }
//     setCurrentMode('edit'); 
//     loadAccountDataIntoForm(account); 
//     setMessage(`Viewing/Editing Account: ${normalizeValue(account.code)} - ${normalizeValue(account.name)}`); 
//   };
  
//   const handleNewAccountClick = () => { 
//     if (selectedAccount && currentMode === 'edit') {
//       setupNewChildAccount(selectedAccount); 
//     } else {
//       setupNewRootAccount(); 
//     }
//   };

//   const handleDeleteAccount = async (account) => {
//     if (!hasPermission || !hasPermission(menuId, 'delete')) {
//       setMessage('⚠️ You do not have permission to delete accounts');
//       return;
//     }
    
//     if (!window.confirm(`Are you sure you want to delete account "${account.code} - ${account.name}"?`)) return;
    
//     setIsLoading(true);
//     try {
//       const payload = {
//         tableName: API_CONFIG.TABLE_NAME,
//         where: { code: account.code, offcode: account.offcode }
//       };
      
//       const resp = await fetch(API_CONFIG.DELETE_RECORD, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
      
//       if (!resp.ok) throw new Error('Delete failed');
//       const data = await resp.json();
      
//       if (data.success) {
//         await fetchAccounts(currentPage);
//         if (selectedAccount && selectedAccount.code === account.code) {
//           setSelectedAccount(null);
//           setFormData({
//             code: '', name: '', type: 'OTHER', parent: '00', nlevel: '1', 
//             isActive: true, groupcode: '1', offcode: credentials?.offcode || '1010', cashFlowCode: ''
//           });
//           setCurrentMode('new');
//         }
//         setMessage('✅ Account deleted successfully!');
//       } else {
//         setMessage('❌ Delete failed: ' + (data.message || data.error || 'Unknown error'));
//       }
//     } catch (err) {
//       console.error('delete account', err);
//       setMessage(`❌ Delete error: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Save account (insert/update)
//   const handleSave = async () => {
//     if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
//       setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} accounts`);
//       return;
//     }

//     const { code, name, type, nlevel, cashFlowCode, offcode } = formData;
//     if (!code || !name || !type) { 
//       setMessage('⚠️ Account Code, Name, and Transaction Type are required.'); 
//       return; 
//     }
    
//     setIsLoading(true); 
//     setMessage('');
//     const now = new Date().toISOString();
//     const isLeaf = parseInt(nlevel) === 4;
//     const finalCashFlowCode = isLeaf && cashFlowCode ? cashFlowCode : null;

//     const accountRecord = {
//       offcode,
//       code,
//       name,
//       type: type,
//       groupcode: formData.groupcode,
//       parent: formData.parent,
//       nlevel: formData.nlevel,
//       isActive: formData.isActive ? 'True' : 'False',
//       atDrCode: finalCashFlowCode,
//       atCrCode: finalCashFlowCode,
//       Debit: "0.00",
//       Credit: "0.00",
//       ProjectGroupCode: "00001",
//       DebitE: "0.00",
//       CreditE: "0.00",
//       isAccountLevel: "false",
//       alternativeCode: "",
//       AssociateGLCode: "",
//       FCDebitE: "0.00",
//       FCCreditE: "0.00",
//       isFCAccount: "false",
//       DebitPosted: "0.00",
//       CreditPosted: "0.00",
//       DebitUnPosted: "0.00",
//       CreditUnPosted: "0.00",
//     };

//     if (currentMode === 'new') {
//       accountRecord.createdby = USER_LOGIN;
//       accountRecord.createdate = now;
//     } else {
//       accountRecord.editby = USER_LOGIN;
//       accountRecord.editdate = now;
//     }

//     const payload = { tableName: API_CONFIG.TABLE_NAME, data: accountRecord };
//     let endpoint = API_CONFIG.INSERT_RECORD;
//     let successMessage = '✅ Account created successfully!';
    
//     if (currentMode === 'edit') { 
//       endpoint = API_CONFIG.UPDATE_RECORD; 
//       successMessage = '✅ Account updated successfully!'; 
//       payload.where = { code: code, offcode: offcode }; 
//     }

//     try {
//       const resp = await fetch(endpoint, { 
//         method: 'POST', 
//         headers: { 'Content-Type': 'application/json' }, 
//         body: JSON.stringify(payload) 
//       });
//       if (!resp.ok) {
//         let errorText = `API request failed with status: ${resp.status}`;
//         try { 
//           const ed = await resp.json(); 
//           errorText = ed.error || ed.message || errorText; 
//         } catch (e) {}
//         throw new Error(errorText);
//       }
//       const data = await resp.json();
//       if (data.success) {
//         setMessage(successMessage);
//         await fetchAccounts(currentPage);
//         if (currentMode === 'new') {
//           if (formData.parent !== '00' && selectedAccount) {
//             setupNewChildAccount(selectedAccount);
//           } else {
//             setupNewRootAccount();
//           }
//         }
//       } else { 
//         setMessage(`❌ Save Failed: ${data.message || 'API returned a failure signal.'}`); 
//       }
//     } catch (err) {
//       console.error('save account', err);
//       setMessage(`❌ Critical Save Error: ${err.message}`);
//     } finally { 
//       setIsLoading(false); 
//     }
//   };

//   if (rightsLoading && !menuId) {
//     return (
//       <div className="loading-container">
//         <Icon.Loader className="loader spin" />
//         <p>Loading user rights...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="cfa-page">
//       <div className="app-header">
//         <div className="header-brand">
//           <Icon.Chart className="brand-icon" />
//           <div>
//             <h1>Chart of Accounts</h1>
//             <div className="muted">Manage your financial account hierarchy</div>
//           </div>
//         </div>
//         <div className="header-user">
//           <Icon.Users className="icon-sm" />
//           <span>{USER_LOGIN}</span>
//           <span className="office-code-badge">{credentials?.offcode || '1010'}</span>
//         </div>
//       </div>

//       <div className="toolbar">
//         <div className="toolbar-section">
//           {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
//             <button className="toolbar-btn primary" onClick={handleSave} disabled={isLoading}>
//               <Icon.Save /> {isLoading ? 'Saving...' : 'Save'}
//             </button>
//           )}
//           {hasPermission && hasPermission(menuId, 'add') && (
//             <button className="toolbar-btn" onClick={handleNewAccountClick}>
//               <Icon.Plus /> New Account
//             </button>
//           )}
//           {hasPermission && hasPermission(menuId, 'edit') && (
//             <button className="toolbar-btn" onClick={() => { 
//               if (selectedAccount) { 
//                 setCurrentMode('edit'); 
//                 loadAccountDataIntoForm(selectedAccount); 
//               } else {
//                 setMessage('Select an account to edit'); 
//               }
//             }}>
//               <Icon.Edit /> Edit
//             </button>
//           )}
//         </div>

//         <div className="toolbar-section">
//           <button className="toolbar-btn" onClick={() => { fetchAccounts(currentPage); setMessage('Refreshed'); }}>
//             <Icon.Refresh /> Refresh
//           </button>
//           <button className="toolbar-btn" onClick={() => setShowCashFlowNotes(true)}>
//             <Icon.CashFlow /> Cash Flow Notes
//           </button>
//         </div>
//       </div>

//       <div className="content-area with-fixed-sidebar">
//         <AccountTreeSidebar 
//           accounts={paginatedAccounts} 
//           selectedAccount={selectedAccount} 
//           onAccountSelect={handleAccountSelect} 
//           searchTerm={searchTerm} 
//           onSearchChange={handleSearchChange} 
//           isLoading={isDataLoading}
//           hasPermission={hasPermission}
//           menuId={menuId}
//           onDelete={handleDeleteAccount}
//           currentPage={currentPage}
//           itemsPerPage={itemsPerPage}
//           totalItems={accounts.length}
//           onPageChange={handlePageChange}
//           isPaginationLoading={isPaginationLoading}
//         />
        
//         <div className="main-content scrollable">
//           <div className="content-tabs">
//             <button className={`tab ${true ? 'active' : ''}`}>
//               <Icon.FileText /> Account Details
//             </button>
//             <button className="tab" onClick={() => setShowCashFlowNotes(true)}>
//               <Icon.CashFlow /> BS/PL Attachments
//             </button>
//           </div>

//           <div className="content-panel">
//             <AccountDetailForm 
//               formData={formData} 
//               onFormChange={updateFormData} 
//               onSave={handleSave} 
//               onNewAccount={handleNewAccountClick} 
//               currentMode={currentMode} 
//               selectedAccount={selectedAccount} 
//               anoteCodes={anoteCodes} 
//               isLoading={isLoading} 
//               isDataLoading={isDataLoading} 
//               transactionTypes={FIXED_TRANSACTION_TYPES}
//               hasPermission={hasPermission}
//               menuId={menuId}
//               credentials={credentials}
//             />
//           </div>
//         </div>
//       </div>

//       <CashFlowNotesManager 
//         isVisible={showCashFlowNotes} 
//         onClose={() => setShowCashFlowNotes(false)}
//         hasPermission={hasPermission}
//         menuId={menuId}
//         credentials={credentials}
//       />

//       {message && (
//         <div className={`toast ${message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'success'}`}>
//           <div className="toast-content">
//             {message.includes('✅') && <Icon.CheckCircle />}
//             {message.includes('❌') && <Icon.XCircle />}
//             {message.includes('⚠️') && <Icon.XCircle />}
//             <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
//           </div>
//           <button className="toast-close" onClick={() => setMessage('')}>×</button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChartOfAccountsManager;