import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from "../../AuthContext";

/* ---------------------------
 * API & Configuration
---------------------------- */
const API_CONFIG = {
  BASE_URL: 'http://192.168.100.113:8081/api',
  GET_URL: 'http://192.168.100.113:8081/api/get-table-data',
  INSERT_URL: 'http://192.168.100.113:8081/api/insert-table-data',
  UPDATE_URL: 'http://192.168.100.113:8081/api/update-table-data',
  DELETE_URL: 'http://192.168.100.113:8081/api/delete-table-data',
};

/* ---------------------------
 * Module Configurations
---------------------------- */
export const MODULE_CONFIG = {
  reason: {
    tableName: 'comReason',
    primaryKey: ['code', 'offcode'],
    codeField: 'code',
    nameField: 'reason',
    fields: {
      offcode: 'string',
      code: 'string',
      reason: 'string',
      isActive: 'boolean',
      type: 'string'
    },
    defaultValues: {
      offcode: '',
      code: '',
      reason: '',
      isActive: true,
      type: '1'
    }
  },
  bom: {
    tableName: 'imfbomhead',
    primaryKey: ['HeadItemCode', 'offcode'],
    codeField: 'HeadItemCode',
    nameField: 'HeadItemName',
    fields: {
      offcode: 'string',
      HeadItemCode: 'string',
      HeadItemName: 'string',
      isActive: 'boolean'
    },
    defaultValues: {
      offcode: '',
      HeadItemCode: '',
      HeadItemName: '',
      isActive: true
    }
  },
  item: {
    tableName: 'imf',
    primaryKey: ['ItemCode', 'offcode'],
    codeField: 'ItemCode',
    nameField: 'ItemName',
    fields: {
      offcode: 'string',
      ItemCode: 'string',
      ItemName: 'string',
      isActive: 'boolean',
      ItemType: 'string',
      InvType: 'string',
      uom: 'string',
      nlevel: 'string',
      CostPrice: 'number',
      SalePrice: 'number'
    },
    defaultValues: {
      offcode: '',
      ItemCode: '',
      ItemName: '',
      isActive: true,
      ItemType: '1',
      InvType: '1',
      uom: '1',
      nlevel: '1',
      CostPrice: 0,
      SalePrice: 0
    }
  },
  customersupplier: {
    tableName: 'comcustomer',
    primaryKey: ['CustomerCode', 'offcode'],
    codeField: 'CustomerCode',
    nameField: 'CustomerName',
    fields: {
      offcode: 'string',
      CustomerCode: 'string',
      CustomerName: 'string',
      isactive: 'boolean',
      isCustomer: 'boolean',
      isSupplier: 'boolean',
      phone1: 'string',
      mobile: 'string',
      email: 'string'
    },
    defaultValues: {
      offcode: '',
      CustomerCode: '',
      CustomerName: '',
      isactive: true,
      isCustomer: true,
      isSupplier: false,
      phone1: '',
      mobile: '',
      email: ''
    }
  }
};

/* ---------------------------
 * Auth Hook
---------------------------- */
export const useAuth = () => useContext(AuthContext);

/* ---------------------------
 * Utilities
---------------------------- */
export const normalizeValue = (value) => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

export const denormalizeValue = (value, type = 'string') => {
  if (value === null || value === undefined || value === '') {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      default: return '';
    }
  }
  
  if (type === 'boolean') {
    return value === 'true' || value === true || value === 1 || value === '1';
  }
  
  if (type === 'number') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  return String(value);
};

/* ---------------------------
 * Data Service Hook
---------------------------- */
export const useDataService = (moduleType) => {
  const { credentials } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const config = MODULE_CONFIG[moduleType];
  if (!config) {
    throw new Error(`Invalid module type: ${moduleType}`);
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const currentOffcode = credentials?.company?.offcode || '0101';
      
      const payload = { tableName: config.tableName };
      const resp = await fetch(API_CONFIG.GET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const result = await resp.json();

      if (result.success && Array.isArray(result.rows)) {
        // Filter by office code and normalize data
        const filteredData = result.rows
          .filter(item => normalizeValue(item.offcode) === currentOffcode)
          .map(item => {
            const normalized = {};
            Object.keys(config.fields).forEach(field => {
              normalized[field] = normalizeValue(item[field]);
            });
            return normalized;
          });

        setData(filteredData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [credentials, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

/* ---------------------------
 * CRUD Operations
---------------------------- */
export const useCRUDOperations = (moduleType) => {
  const { credentials } = useAuth();
  const config = MODULE_CONFIG[moduleType];

  const createRecord = async (recordData) => {
    try {
      const currentOffcode = credentials?.company?.offcode || '0101';
      const currentUser = credentials?.username || 'SYSTEM';
      
      const preparedData = {};
      Object.keys(config.fields).forEach(field => {
        const value = recordData[field];
        const fieldType = config.fields[field];
        preparedData[field] = denormalizeValue(value, fieldType);
        
        // Set office code if not provided
        if (field === 'offcode' && !value) {
          preparedData[field] = currentOffcode;
        }
        
        // Set created fields for new records
        if (field === 'createdby' && !value) {
          preparedData[field] = currentUser;
        }
        if (field === 'createdate' && !value) {
          preparedData[field] = new Date().toISOString();
        }
        if (field === 'editby') {
          preparedData[field] = currentUser;
        }
        if (field === 'editdate') {
          preparedData[field] = new Date().toISOString();
        }
      });

      const payload = {
        tableName: config.tableName,
        data: preparedData
      };

      const resp = await fetch(API_CONFIG.INSERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const result = await resp.json();
      return result;
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  };

  const updateRecord = async (recordData) => {
    try {
      const currentOffcode = credentials?.company?.offcode || '0101';
      const currentUser = credentials?.username || 'SYSTEM';
      
      const preparedData = {};
      Object.keys(config.fields).forEach(field => {
        const value = recordData[field];
        const fieldType = config.fields[field];
        preparedData[field] = denormalizeValue(value, fieldType);
        
        // Update edit fields
        if (field === 'editby') {
          preparedData[field] = currentUser;
        }
        if (field === 'editdate') {
          preparedData[field] = new Date().toISOString();
        }
      });

      const payload = {
        tableName: config.tableName,
        data: preparedData,
        where: {}
      };

      // Build where clause from primary key
      config.primaryKey.forEach(key => {
        if (key === 'offcode') {
          payload.where[key] = currentOffcode;
        } else {
          payload.where[key] = preparedData[key];
        }
      });

      const resp = await fetch(API_CONFIG.UPDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const result = await resp.json();
      return result;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const deleteRecord = async (recordId) => {
    try {
      const currentOffcode = credentials?.company?.offcode || '0101';
      
      const payload = {
        tableName: config.tableName,
        where: {
          [config.primaryKey[0]]: recordId,
          offcode: currentOffcode
        }
      };

      const resp = await fetch(API_CONFIG.DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const result = await resp.json();
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  return { createRecord, updateRecord, deleteRecord };
};

/* ---------------------------
 * Form Management Hook
---------------------------- */
export const useFormManager = (moduleType, initialData = null) => {
  const config = MODULE_CONFIG[moduleType];
  const { credentials } = useAuth();
  const currentOffcode = credentials?.company?.offcode || '0101';

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const data = {};
      Object.keys(config.fields).forEach(field => {
        data[field] = normalizeValue(initialData[field]);
      });
      return data;
    }
    
    const data = { ...config.defaultValues };
    data.offcode = currentOffcode;
    return data;
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCheckboxChange = (field, checked) => {
    handleChange(field, checked ? 'true' : 'false');
  };

  const handleNumericChange = (field, value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    handleChange(field, numericValue);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData[config.codeField]?.trim()) {
      newErrors[config.codeField] = `${config.codeField} is required`;
    }
    
    if (!formData[config.nameField]?.trim()) {
      newErrors[config.nameField] = `${config.nameField} is required`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = (newData = null) => {
    if (newData) {
      const data = {};
      Object.keys(config.fields).forEach(field => {
        data[field] = normalizeValue(newData[field]);
      });
      setFormData(data);
    } else {
      const data = { ...config.defaultValues };
      data.offcode = currentOffcode;
      setFormData(data);
    }
    setErrors({});
    setIsDirty(false);
  };

  return {
    formData,
    errors,
    isDirty,
    handleChange,
    handleCheckboxChange,
    handleNumericChange,
    validateForm,
    resetForm,
    setFormData
  };
};

/* ---------------------------
 * Icons (Using Lucide Icons)
---------------------------- */
export const Icon = {
  Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6M1 6h22"></path></svg>,
  Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"></path><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2"></path></svg>,
  ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
  Package: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Layers: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Cogs: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
  Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  User: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 5.74"></path></svg>,
  MapPin: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Tag: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 22.5L14 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2h2v.5a2.5 2.5 0 0 1-2.5 2.5z"></path></svg>,
  CreditCard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  FileText: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Folder: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Database: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path></svg>,
  Building: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Warehouse: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M8 11h8"></path><path d="M8 15h8"></path><path d="M8 19h8"></path></svg>,
  Scale: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><path d="M3 12h18"></path><circle cx="8" cy="8" r="2"></circle><circle cx="16" cy="16" r="2"></circle><circle cx="16" cy="8" r="2"></circle><circle cx="8" cy="16" r="2"></circle></svg>,
  X: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Filter: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  Eye: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  EyeOff: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
  BarChart: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>,
};

/* ---------------------------
 * Module Display Names
---------------------------- */
export const getModuleDisplayName = (moduleType) => {
  const names = {
    reason: 'Reason',
    bom: 'BOM',
    item: 'Item',
    customersupplier: 'Customer/Supplier'
  };
  return names[moduleType] || moduleType;
};

/* ---------------------------
 * Module Icons
---------------------------- */
export const getModuleIcon = (moduleType) => {
  const icons = {
    reason: Icon.Tag,
    bom: Icon.Layers,
    item: Icon.Package,
    customersupplier: Icon.User
  };
  return icons[moduleType] || Icon.Settings;
};

/* ---------------------------
 * Field Configuration
---------------------------- */
export const getFieldConfig = (moduleType, fieldName) => {
  const config = MODULE_CONFIG[moduleType];
  if (!config) return {};
  
  const commonConfigs = {
    // Reason module fields
    'reason': { label: 'Reason', type: 'text', required: true, placeholder: 'Enter reason' },
    'type': { label: 'Type', type: 'select', options: [
      { value: '1', label: 'Type 1' },
      { value: '2', label: 'Type 2' },
      { value: '3', label: 'Type 3' }
    ]},
    'isActive': { label: 'Active', type: 'checkbox' },
    
    // BOM module fields
    'HeadItemName': { label: 'Head Item Name', type: 'text', required: true },
    
    // Item module fields
    'ItemName': { label: 'Item Name', type: 'text', required: true },
    'ItemType': { label: 'Item Type', type: 'select', options: [
      { value: '1', label: 'RAW' },
      { value: '2', label: 'SEMI-FINISHED' },
      { value: '3', label: 'FINISHED' }
    ]},
    'InvType': { label: 'Inventory Type', type: 'select', options: [
      { value: '1', label: 'Inventory' },
      { value: '2', label: 'NON-Inventory' },
      { value: '3', label: 'Services' },
      { value: '4', label: 'BUNDLE' }
    ]},
    'CostPrice': { label: 'Cost Price', type: 'number', min: 0, step: 0.01 },
    'SalePrice': { label: 'Sale Price', type: 'number', min: 0, step: 0.01 },
    
    // Customer/Supplier fields
    'CustomerName': { label: 'Customer Name', type: 'text', required: true },
    'phone1': { label: 'Phone', type: 'text' },
    'mobile': { label: 'Mobile', type: 'text' },
    'email': { label: 'Email', type: 'email' },
    'isCustomer': { label: 'Is Customer', type: 'checkbox' },
    'isSupplier': { label: 'Is Supplier', type: 'checkbox' }
  };
  
  return commonConfigs[fieldName] || {
    label: fieldName,
    type: config.fields[fieldName] || 'text'
  };
};

export default {
  MODULE_CONFIG,
  useAuth,
  normalizeValue,
  denormalizeValue,
  useDataService,
  useCRUDOperations,
  useFormManager,
  Icon,
  getModuleDisplayName,
  getModuleIcon,
  getFieldConfig
};