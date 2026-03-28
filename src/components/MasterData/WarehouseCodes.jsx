import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import "./WarehouseCodes.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";
import * as Icons from 'lucide-react';
import Pagination from '../Common/Pagination';

/* ---------------------------
 * API & Configuration
---------------------------- */
const API_CONFIG = {
    BASE_URL: API_BASE1,
    TABLES: {
        GODOWN: 'comGodown',
        BRANCH: 'comBranch'
    },
    GET_TABLE_DATA: `${API_BASE1}/get-table-data`,
    INSERT_RECORD: `${API_BASE1}/table/insert`,
    UPDATE_RECORD: `${API_BASE1}/table/update`,
    DELETE_RECORD: `${API_BASE1}/table/delete`,
    GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
};

/* ---------------------------
 * Auth Hook
---------------------------- */
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/* ---------------------------
 * Utilities
---------------------------- */
const normalizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
    return String(value);
};

const isActiveValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        return value === "true" || value === "1" || value === "True" || value === "TRUE";
    }
    return false;
};

// Format date to match database format (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Get current date in database format
const getCurrentDateTime = () => {
    return formatDateForDB(new Date());
};

/* ---------------------------
 * Initial State (with audit fields)
---------------------------- */
const getInitialWarehouseData = (offcode = '', currentUser = 'SYSTEM') => ({
    offcode: offcode,
    godownID: '',
    description: '',
    IsActive: 'true',
    alternativeCode: '',
    createdby: currentUser,
    createdate: getCurrentDateTime(),
    editby: '',
    editdate: ''
});

// Prepare data for database insertion/update (with audit fields)
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    const currentDateTime = getCurrentDateTime();
    
    // Create base object with all fields
    const preparedData = {
        offcode: currentOffcode,
        godownID: data.godownID || '',
        description: data.description || '',
        IsActive: isActiveValue(data.IsActive) ? 'True' : 'False',
        alternativeCode: data.alternativeCode || ''
    };

    // Add audit fields based on mode
    if (mode === 'new') {
        preparedData.createdby = currentUser;
        preparedData.createdate = currentDateTime;
        preparedData.editby = '';
        preparedData.editdate = '';
    } else {
        preparedData.createdby = data.createdby || currentUser;
        preparedData.createdate = data.createdate || currentDateTime;
        preparedData.editby = currentUser;
        preparedData.editdate = currentDateTime;
    }

    // Remove any undefined values
    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            delete preparedData[key];
        }
    });

    console.log('🔍 Prepared data for DB:', preparedData);

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useWarehouseDataService = () => {
    const { credentials } = useAuth();
    const [warehouses, setWarehouses] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [branchData, setBranchData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    // Generic function to fetch table data with offcode filtering
    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                const offcodeColumn = tableName === API_CONFIG.TABLES.GODOWN ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.BRANCH ? 'offcode' : 'offcode';
                
                whereClause = `${offcodeColumn} = '${offcode}'`;
                if (additionalWhere) {
                    whereClause += ` AND ${additionalWhere}`;
                }
            }

            const payload = { 
                tableName,
                ...(whereClause && { where: whereClause }),
                usePagination: false
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            return data.success ? data.rows : [];
        } catch (err) {
            console.error(`Error fetching ${tableName}:`, err);
            return [];
        }
    }, []);

    // Function to fetch maximum godown ID
    const fetchMaxGodownId = useCallback(async (offcode) => {
        try {
            const allWarehouses = await fetchTableData(API_CONFIG.TABLES.GODOWN, offcode);
            
            const codes = allWarehouses
                .map(w => {
                    const id = normalizeValue(w.godownID);
                    return parseInt(id, 10);
                })
                .filter(code => !isNaN(code) && code > 0);

            return codes.length > 0 ? Math.max(...codes) : 0;
        } catch (err) {
            console.error('Error fetching max godown ID:', err);
            return 0;
        }
    }, [fetchTableData]);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setWarehouses([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching warehouses for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (godownID LIKE '%${search}%' OR description LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.GODOWN,
                where: whereClause,
                page: page,
                limit: size,
                usePagination: true
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            
            if (data.success) {
                setWarehouses(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                // Fetch max code after getting data
                const max = await fetchMaxGodownId(currentOffcode);
                setMaxCode(max);
                
                // Fetch branch data
                await fetchBranchData(currentOffcode);
            } else {
                setWarehouses([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching warehouses:', err);
            setError(`Failed to load data: ${err.message}`);
            setWarehouses([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, fetchTableData, fetchMaxGodownId]);

    const fetchBranchData = useCallback(async (offcode) => {
        try {
            const branchData = await fetchTableData(API_CONFIG.TABLES.BRANCH, offcode);
            const currentBranch = branchData.find(b => normalizeValue(b.offcode) === offcode);
            setBranchData(currentBranch || null);
        } catch (err) {
            console.error('Error fetching branch data:', err);
        }
    }, [fetchTableData]);

    // Load data whenever pagination or search changes
    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetch = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetchAll = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const goToPage = (page) => {
        console.log(`Changing to page: ${page}`);
        setCurrentPage(page);
    };

    const setSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const updatePageSize = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return { 
        warehouses,
        totalCount,
        totalPages,
        branchData,
        isLoading, 
        error, 
        refetch,
        refetchAll,
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        updatePageSize,
        maxCode
    };
};

/* ---------------------------
 * Warehouse Form Component
---------------------------- */
const WarehouseForm = ({
    formData,
    onFormChange,
    onSave,
    onNewWarehouse,
    currentMode,
    isLoading,
    hasPermission,
    menuId,
    branchData
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';

    const {
        godownID,
        description,
        IsActive,
        alternativeCode,
        createdby,
        createdate,
        editby,
        editdate
    } = formData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    // Format date for display
    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="wp-detail-panel">
            <div className="wp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Warehouse' : `Warehouse: ${description || 'Warehouse'}`}</h2>
                    <div className="wp-detail-meta">
                        <span className={`wp-mode-badge ${isNewMode ? 'wp-new' : 'wp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="wp-code-badge">ID: {godownID || (isNewMode ? 'Auto-generated' : 'No ID')}</span>
                        <span className="wp-office-badge">Office: {currentOffcode}</span>
                        {!isActiveValue(IsActive) && <span className="wp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="wp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="wp-btn wp-btn-outline"
                                onClick={onNewWarehouse}
                            >
                                <Icons.Plus size={16} />
                                New Warehouse
                            </button>
                            <button
                                className={`wp-btn wp-btn-primary ${isLoading ? 'wp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !description || !godownID}
                            >
                                {isLoading ? <Icons.Loader size={16} className="wp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Warehouse'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="wp-detail-content">
                <div className="wp-form-layout">
                    {/* Left Column - Basic Information */}
                    <div className="wp-form-column">
                        <div className="wp-form-section wp-expanded">
                            <div className="wp-section-header">
                                <div className="wp-section-title">
                                    <Icons.Warehouse size={18} />
                                    <h4>Warehouse Information</h4>
                                </div>
                            </div>
                            <div className="wp-section-content">
                                <div className="wp-form-grid wp-grid-2">
                                    <div className="wp-field-group wp-required">
                                        <label>Warehouse ID *</label>
                                        <input
                                            type="text"
                                            value={godownID}
                                            onChange={e => handleNumericInput('godownID', e.target.value)}
                                            placeholder="Auto-generated"
                                            disabled={!isNewMode || !canEdit}
                                            className="wp-form-input wp-disabled-field"
                                        />
                                        {isNewMode && (
                                            <small className="wp-field-hint">ID will be auto-generated as 1, 2, 3, etc.</small>
                                        )}
                                    </div>

                                    <div className="wp-field-group wp-required">
                                        <label>Description *</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={e => handleInput('description', e.target.value)}
                                            placeholder="Enter warehouse description"
                                            disabled={!canEdit}
                                            className="wp-form-input"
                                        />
                                    </div>

                                    <div className="wp-field-group">
                                        <label>Alternative Code</label>
                                        <input
                                            type="text"
                                            value={alternativeCode}
                                            onChange={e => handleInput('alternativeCode', e.target.value)}
                                            placeholder="Enter alternative code"
                                            disabled={!canEdit}
                                            className="wp-form-input"
                                        />
                                    </div>

                                    <div className="wp-field-group wp-checkbox">
                                        <label className="wp-checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                id="IsActive"
                                                checked={isActiveValue(IsActive)}
                                                onChange={e => handleCheckbox('IsActive', e)}
                                                disabled={!canEdit}
                                            />
                                            <span className="wp-checkbox-custom"></span>
                                            Warehouse is Active
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Additional Information */}
                    <div className="wp-form-column">
                        <div className="wp-form-section wp-expanded">
                            <div className="wp-section-header">
                                <div className="wp-section-title">
                                    <Icons.Info size={18} />
                                    <h4>Additional Information</h4>
                                </div>
                            </div>
                            <div className="wp-section-content">
                                <div className="wp-form-grid wp-grid-2">
                                    <div className="wp-field-group">
                                        <label>Office Code</label>
                                        <div className="wp-field-display">
                                            <Icons.Building2 size={16} />
                                            <span>{currentOffcode}</span>
                                        </div>
                                    </div>

                                    <div className="wp-field-group">
                                        <label>Branch Name</label>
                                        <div className="wp-field-display">
                                            <Icons.Building size={16} />
                                            <span>{branchData?.branchName || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Information */}
                        <div className="wp-form-section wp-expanded">
                            <div className="wp-section-header">
                                <div className="wp-section-title">
                                    <Icons.Clock size={18} />
                                    <h4>Audit Information</h4>
                                </div>
                            </div>
                            <div className="wp-section-content">
                                <div className="wp-form-grid wp-grid-2">
                                    <div className="wp-field-group">
                                        <label>Created By</label>
                                        <div className="wp-field-display">
                                            <Icons.User size={16} />
                                            <span>{createdby || (isNewMode ? 'Will be set on save' : 'N/A')}</span>
                                        </div>
                                    </div>
                                    <div className="wp-field-group">
                                        <label>Created Date</label>
                                        <div className="wp-field-display">
                                            <Icons.Calendar size={16} />
                                            <span>{createdate ? formatDisplayDate(createdate) : (isNewMode ? 'Will be set on save' : 'Not set')}</span>
                                        </div>
                                    </div>
                                    <div className="wp-field-group">
                                        <label>Last Edited By</label>
                                        <div className="wp-field-display">
                                            <Icons.User size={16} />
                                            <span>{editby || (isNewMode ? 'Not edited yet' : 'N/A')}</span>
                                        </div>
                                    </div>
                                    <div className="wp-field-group">
                                        <label>Last Edited Date</label>
                                        <div className="wp-field-display">
                                            <Icons.Calendar size={16} />
                                            <span>{editdate ? formatDisplayDate(editdate) : (isNewMode ? 'Not edited yet' : 'Not set')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Warehouse Sidebar Component
---------------------------- */
const WarehouseSidebar = ({ 
    warehouses, 
    selectedWarehouse, 
    onWarehouseSelect, 
    searchTerm, 
    onSearchChange, 
    isLoading, 
    hasPermission, 
    menuId, 
    onDelete,
    totalCount,
    currentPage,
    totalPages,
    onPageChange
}) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop = 0;
        }
    }, [currentPage]);

    return (
        <aside className="wp-sidebar">
            <div className="wp-sidebar-header">
                <div className="wp-sidebar-title">
                    <Icons.Warehouse size={20} />
                    <h3>Warehouses</h3>
                    <span className="wp-count-badge">{totalCount} warehouses</span>
                </div>
                <div className="wp-sidebar-actions">
                    <div className="wp-search-container">
                        <Icons.Search size={16} className="wp-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID or description..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="wp-search-input"
                        />
                    </div>
                </div>
            </div>

            <div 
                className="wp-sidebar-content" 
                ref={sidebarRef}
            >
                {isLoading && warehouses.length === 0 ? (
                    <div className="wp-loading-state">
                        <Icons.Loader size={32} className="wp-spin" />
                        <p>Loading Warehouses...</p>
                    </div>
                ) : warehouses.length > 0 ? (
                    <>
                        <div className="wp-list">
                            {warehouses.map(warehouse => (
                                <div
                                    key={`${warehouse.godownID}-${warehouse.offcode}`}
                                    className={`wp-list-item ${selectedWarehouse?.godownID === warehouse.godownID && selectedWarehouse?.offcode === warehouse.offcode ? 'wp-selected' : ''}`}
                                    onClick={() => onWarehouseSelect(warehouse)}
                                >
                                    <div className="wp-item-info">
                                        <div className="wp-item-header">
                                            <span className="wp-item-code">{normalizeValue(warehouse.godownID)}</span>
                                            <span className={`wp-status-badge ${isActiveValue(warehouse.IsActive) ? 'wp-active' : 'wp-inactive'}`}>
                                                {isActiveValue(warehouse.IsActive) ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="wp-item-name">{normalizeValue(warehouse.description) || 'Unnamed Warehouse'}</div>
                                        {normalizeValue(warehouse.alternativeCode) && (
                                            <div className="wp-item-altcode">Alt: {normalizeValue(warehouse.alternativeCode)}</div>
                                        )}
                                        {normalizeValue(warehouse.createdby) && (
                                            <div className="wp-item-audit">
                                                <Icons.User size={10} />
                                                <span>{normalizeValue(warehouse.createdby)}</span>
                                                {normalizeValue(warehouse.editby) && (
                                                    <>
                                                        <span className="wp-audit-separator">•</span>
                                                        <Icons.Edit size={10} />
                                                        <span>{normalizeValue(warehouse.editby)}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {hasPermission && hasPermission(menuId, 'delete') && (
                                        <button
                                            className="wp-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(warehouse);
                                            }}
                                            title="Delete warehouse"
                                        >
                                            <Icons.Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                                totalItems={totalCount}
                                itemsPerPage={10}
                                maxVisiblePages={5}
                                loading={isLoading}
                            />
                        )}
                    </>
                ) : (
                    <div className="wp-empty-state">
                        <Icons.Warehouse size={48} className="wp-empty-icon" />
                        <h4>No warehouses found</h4>
                        {searchTerm ? (
                            <p>Try a different search term</p>
                        ) : (
                            <p>Create your first warehouse to get started</p>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

/* ---------------------------
 * Main Warehouse Profile Component
---------------------------- */
const WarehouseProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        warehouses,
        totalCount,
        totalPages,
        branchData,
        isLoading: isDataLoading, 
        error, 
        refetch,
        refetchAll,
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        maxCode
    } = useWarehouseDataService();

    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [formData, setFormData] = useState(() => getInitialWarehouseData(currentOffcode, currentUser));
    const [currentMode, setCurrentMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Warehouse Profile' })
                });
                const data = await response.json();
                if (data.success) {
                    setMenuId(data.screen.id);
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
            }
        };
        loadScreenConfig();
    }, []);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchTerm !== searchTerm) {
                setSearch(localSearchTerm);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearchTerm, searchTerm, setSearch]);

    // Generate warehouse ID based on maxCode from all records
    const generateWarehouseId = useCallback(() => {
        const nextId = maxCode + 1;
        return nextId.toString();
    }, [maxCode]);

    // Initialize form for new warehouse
    useEffect(() => {
        if (currentMode === 'new' && !selectedWarehouse) {
            const newId = generateWarehouseId();

            setFormData({
                ...getInitialWarehouseData(currentOffcode, currentUser),
                godownID: newId
            });
            
            setMessage(`Ready to create new warehouse. Auto-generated ID: ${newId}`);
        }
    }, [currentMode, currentOffcode, currentUser, generateWarehouseId, selectedWarehouse]);

    // Load selected warehouse for editing
    useEffect(() => {
        if (selectedWarehouse && currentMode === 'edit') {
            const normalizedWarehouse = {
                offcode: normalizeValue(selectedWarehouse.offcode),
                godownID: normalizeValue(selectedWarehouse.godownID),
                description: normalizeValue(selectedWarehouse.description),
                IsActive: normalizeValue(selectedWarehouse.IsActive),
                alternativeCode: normalizeValue(selectedWarehouse.alternativeCode),
                createdby: normalizeValue(selectedWarehouse.createdby),
                createdate: normalizeValue(selectedWarehouse.createdate),
                editby: normalizeValue(selectedWarehouse.editby),
                editdate: normalizeValue(selectedWarehouse.editdate)
            };

            setFormData(normalizedWarehouse);
        }
    }, [selectedWarehouse, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectWarehouse = (warehouse) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view warehouses');
            return;
        }
        setSelectedWarehouse(warehouse);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(warehouse.description)}`);
    };

    const handleNewWarehouse = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new warehouses');
            return;
        }
        setSelectedWarehouse(null);
        setCurrentMode('new');
        setMessage('Creating new warehouse...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} warehouses`);
            return;
        }

        if (!formData.description.trim()) {
            setMessage('❌ Warehouse Description is required!');
            return;
        }

        if (!formData.godownID.trim()) {
            setMessage('❌ Warehouse ID is required!');
            return;
        }

        // Check for duplicate ID
        const duplicateWarehouse = warehouses.find(w =>
            w.godownID === formData.godownID &&
            w.offcode === currentOffcode &&
            (currentMode === 'new' || w.godownID !== selectedWarehouse?.godownID)
        );

        if (duplicateWarehouse) {
            setMessage('❌ A warehouse with this ID already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database with audit fields
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.GODOWN,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                godownID: formData.godownID,
                offcode: currentOffcode
            };
        }

        console.log('========== SAVE PAYLOAD ==========');
        console.log('Endpoint:', endpoint);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('===================================');

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                console.log('Error Response:', errorText);
                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const result = await resp.json();
            console.log('Success Response:', result);

            if (result.success) {
                setMessage('✅ Warehouse saved successfully!');
                
                // Refresh all data
                await refetchAll();

                if (currentMode === 'new') {
                    // For new records, stay in edit mode with the new record selected
                    const newRecord = {
                        ...preparedData
                    };
                    
                    setSelectedWarehouse(newRecord);
                    setCurrentMode('edit');
                    
                    // Update form data with the saved record
                    setFormData(newRecord);
                } else {
                    // Update the selected warehouse with the latest data
                    setSelectedWarehouse(preparedData);
                }
            } else {
                setMessage(`❌ Save failed: ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('❌ Save error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWarehouse = async (warehouse) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete warehouses');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the warehouse "${warehouse.description}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.GODOWN,
                where: {
                    godownID: warehouse.godownID,
                    offcode: currentOffcode
                }
            };

            const resp = await fetch(API_CONFIG.DELETE_RECORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Warehouse deleted successfully!');
                
                // Check if current page is now empty and we're not on page 1
                if (warehouses.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetchAll();
                }

                if (selectedWarehouse && selectedWarehouse.godownID === warehouse.godownID) {
                    handleNewWarehouse();
                }
            } else {
                setMessage(`❌ Delete failed: ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Delete error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePageChange = (page) => {
        console.log(`Page change requested to: ${page}`);
        goToPage(page);
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop = 0;
        }
    };

    if (rightsLoading && !menuId) {
        return (
            <div className="wp-loading-container">
                <Icons.Loader size={40} className="wp-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="wp-container">
            <header className="wp-header">
                <div className="wp-header-left">
                    <Icons.Warehouse size={24} className="wp-header-icon" />
                    <div>
                        <h1>Warehouse Management</h1>
                        <span className="wp-header-subtitle">Manage warehouse locations and godowns</span>
                    </div>
                </div>
                <div className="wp-header-right">
                    <Icons.User size={16} />
                    <span>{currentUser}</span>
                    <span className="wp-office-tag">Office: {currentOffcode}</span>
                </div>
            </header>

            <div className="wp-toolbar">
                <div className="wp-toolbar-group">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="wp-toolbar-btn wp-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Icons.Loader size={16} className="wp-spin" /> : <Icons.Save size={16} />}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="wp-toolbar-btn" onClick={handleNewWarehouse}>
                            <Icons.Plus size={16} />
                            <span>New Warehouse</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="wp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedWarehouse) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a warehouse to edit'); 
                                }
                            }}
                        >
                            <Icons.Pencil size={16} />
                            <span>Edit</span>
                        </button>
                    )}
                </div>

                <div className="wp-toolbar-group">
                    <button className="wp-toolbar-btn" onClick={refetchAll}>
                        <Icons.RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="wp-toast wp-error">
                    <div className="wp-toast-content">
                        <Icons.AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    <button className="wp-toast-close" onClick={() => setError('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            {message && (
                <div className={`wp-toast ${message.includes('❌') ? 'wp-error' : message.includes('⚠️') ? 'wp-warning' : 'wp-success'}`}>
                    <div className="wp-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={18} />}
                        {message.includes('❌') && <Icons.AlertCircle size={18} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={18} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="wp-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            <div className="wp-main-layout">
                <WarehouseSidebar
                    warehouses={warehouses}
                    selectedWarehouse={selectedWarehouse}
                    onWarehouseSelect={handleSelectWarehouse}
                    searchTerm={localSearchTerm}
                    onSearchChange={setLocalSearchTerm}
                    isLoading={isDataLoading}
                    hasPermission={hasPermission}
                    menuId={menuId}
                    onDelete={handleDeleteWarehouse}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <main className="wp-content-area">
                    <div className="wp-content-tabs">
                        <button className="wp-tab wp-active">
                            <Icons.Warehouse size={16} />
                            Warehouse Details
                        </button>
                    </div>

                    <div className="wp-content-panel">
                        <WarehouseForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewWarehouse={handleNewWarehouse}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            hasPermission={hasPermission}
                            menuId={menuId}
                            branchData={branchData}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WarehouseProfile;