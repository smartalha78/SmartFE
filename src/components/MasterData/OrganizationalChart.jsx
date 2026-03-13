import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import "./CustomerSupplierProfile.css";
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
        ORG_CHART: 'comorgchart'
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

/* ---------------------------
 * Initial State
---------------------------- */
/* ---------------------------
 * Initial State
---------------------------- */
const getInitialOrgChartData = (offcode = '') => ({
    code: '',
    name: '',
    parent: '00',
    nlevel: '1',
    isActive: 'true',
    offcode: offcode
});

// Prepare data for database insertion/update - FIXED VERSION
// Prepare data for database insertion/update - FIXED VERSION
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    // Create a clean object with only the fields that exist in the database
    const preparedData = {
        code: data.code || '',
        name: data.name || '',
        parent: data.parent || '00',
        nlevel: data.nlevel || '1',
        isActive: isActiveValue(data.isActive) ? 'True' : 'False',
        offcode: currentOffcode
    };

    console.log('🔍 prepareDataForDB Output:', {
        input: { data, mode, currentUser, currentOffcode },
        output: preparedData
    });

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useOrgChartDataService = () => {
    const { credentials } = useAuth();
    const [orgChartData, setOrgChartData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setOrgChartData([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching data for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (code LIKE '%${search}%' OR name LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.ORG_CHART,
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
                setOrgChartData(data.rows || []);
                setTotalCount(data.totalCount || 0);
            } else {
                setOrgChartData([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setOrgChartData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    const fetchMaxCode = useCallback(async (offcode) => {
        // Don't fetch max code if we already have it
        if (maxCode > 0) return;
        
        try {
            const payload = {
                tableName: API_CONFIG.TABLES.ORG_CHART,
                where: `offcode = '${offcode}'`,
                usePagination: false
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            
            if (data.success && data.rows) {
                const codes = data.rows
                    .map(p => parseInt(normalizeValue(p.code), 10))
                    .filter(code => !isNaN(code) && code > 0);
                
                const max = codes.length > 0 ? Math.max(...codes) : 0;
                setMaxCode(max);
                console.log('Max code set to:', max);
            }
        } catch (err) {
            console.error('Error fetching max code:', err);
        }
    }, [maxCode]);

    // Load data whenever pagination or search changes
    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    // Only fetch max code once when component mounts
    useEffect(() => {
        const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
        if (currentOffcode && maxCode === 0) {
            fetchMaxCode(currentOffcode);
        }
    }, [credentials, maxCode, fetchMaxCode]);

    const refetch = useCallback(() => {
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

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    return { 
        orgChartData, 
        totalCount,
        totalPages,
        isLoading, 
        error, 
        refetch, 
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
 * Organization Chart Form Component
---------------------------- */
const OrgChartForm = ({
    formData,
    onFormChange,
    onSave,
    onNewPosition,
    currentMode,
    isLoading,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';

    const {
        code,
        name,
        parent,
        nlevel,
        isActive
    } = formData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Position' : `Position: ${name || 'Position'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{code || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
                        <span className="csp-office-badge">Office: {currentOffcode}</span>
                        {!isActiveValue(isActive) && <span className="csp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="csp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="csp-btn csp-btn-outline"
                                onClick={onNewPosition}
                            >
                                <Icons.Plus size={16} />
                                New Position
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !name || !code}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Position'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="csp-detail-content">
                <div className="csp-form-section">
                    <h4><Icons.Users size={18} /> Position Information</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-required">
                            <label>Position Code *</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => handleNumericInput('code', e.target.value)}
                                placeholder="e.g., 001, 002"
                                disabled={!isNewMode || !canEdit}
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Enter a unique 3-digit code (001, 002, etc.)</small>
                            )}
                        </div>

                        <div className="csp-field-group csp-required">
                            <label>Position Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => handleInput('name', e.target.value)}
                                placeholder="e.g., Manager, Supervisor"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActiveValue(isActive)}
                                    onChange={e => handleCheckbox('isActive', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Position is Active
                            </label>
                        </div>

                        <div className="csp-field-group">
                            <label>Parent Position</label>
                            <div className="csp-field-display">
                                <Icons.GitBranch size={16} />
                                <span>Root (00) - All positions are top level</span>
                            </div>
                            <small className="csp-field-hint">Parent is fixed at '00' for all positions.</small>
                        </div>

                        <div className="csp-field-group">
                            <label>Organization Level</label>
                            <div className="csp-field-display">
                                <Icons.Layers size={16} />
                                <span>Level {nlevel} (Top Level)</span>
                            </div>
                            <small className="csp-field-hint">Level is fixed at '1' for all positions.</small>
                        </div>
                    </div>
                </div>

                <div className="csp-form-section">
                    <h4><Icons.GitMerge size={18} /> Hierarchy Information Preview</h4>
                    <div className="csp-form-grid csp-grid-1">
                        <div className="csp-hierarchy-preview">
                            <div className="csp-hierarchy-item">
                                <div className="csp-hierarchy-level">Level {nlevel}</div>
                                <div className="csp-hierarchy-details">
                                    <strong>{code || 'XXX'} - {name || 'New Position'}</strong>
                                    <div className="csp-hierarchy-parent">
                                        Reports to: Root (00)
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
 * Organization Chart Main Component
---------------------------- */
const OrganizationChart = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        orgChartData, 
        totalCount,
        totalPages,
        isLoading: isDataLoading, 
        error, 
        refetch, 
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        updatePageSize,
        maxCode
    } = useOrgChartDataService();

    const [selectedPosition, setSelectedPosition] = useState(null);
    const [formData, setFormData] = useState(() => getInitialOrgChartData(currentOffcode));
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
                    body: JSON.stringify({ screenName: 'Organizational Chart' })
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

    // Generate next code based on maxCode from all records
    const generateNextCode = useCallback(() => {
        const nextCode = maxCode + 1;
        return nextCode.toString().padStart(3, '0');
    }, [maxCode]);

    // Initialize form for new position
    useEffect(() => {
        if (currentMode === 'new' && !selectedPosition) {
            const newCode = generateNextCode();
            
            setFormData({
                ...getInitialOrgChartData(currentOffcode),
                code: newCode
            });
        }
    }, [currentMode, currentOffcode, generateNextCode, selectedPosition]);

    // Load selected position for editing
    useEffect(() => {
        if (selectedPosition && currentMode === 'edit') {
            const normalizedPosition = Object.keys(getInitialOrgChartData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedPosition[key] || getInitialOrgChartData()[key]);
                return acc;
            }, {});

            setFormData(normalizedPosition);
        }
    }, [selectedPosition, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectPosition = (position) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view positions');
            return;
        }
        setSelectedPosition(position);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(position.name)}`);
    };

    const handleNewPosition = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new positions');
            return;
        }
        setSelectedPosition(null);
        setCurrentMode('new');
        setMessage('Creating new position...');
    };

 const handleSave = async () => {
    if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
        setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} positions`);
        return;
    }

    if (!formData.name.trim()) {
        setMessage('❌ Position Name is required!');
        return;
    }

    if (!formData.code.trim()) {
        setMessage('❌ Position Code is required!');
        return;
    }

    // Check for duplicate code in current page data
    const duplicateCode = orgChartData.find(p =>
        p.code === formData.code &&
        (currentMode === 'new' || p.code !== selectedPosition?.code)
    );

    if (duplicateCode) {
        setMessage('❌ A position with this code already exists!');
        return;
    }

    setIsSaving(true);
    setMessage('');

    const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

    // Prepare data for database - WITHOUT audit fields
    const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

    // Create payload based on the working example from your logs
    const payload = {
        tableName: API_CONFIG.TABLES.ORG_CHART,
        data: preparedData
    };

    // For update, add where clause
    if (currentMode === 'edit') {
        payload.where = {
            code: formData.code,
            offcode: currentOffcode
        };
    }

    console.log('========== INSERT/UPDATE DEBUG ==========');
    console.log('Endpoint:', endpoint);
    console.log('Full Payload:', JSON.stringify(payload, null, 2));
    console.log('=========================================');

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Response Status:', resp.status);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.log('Error Response Body:', errorText);
            throw new Error(`HTTP ${resp.status}: ${errorText}`);
        }

        const result = await resp.json();
        console.log('Success Response:', result);

        if (result.success) {
            setMessage('✅ Position saved successfully!');
            
            // Refresh the data
            await refetch();

            if (currentMode === 'new') {
                // For new records, stay in edit mode with the new record selected
                const newRecord = {
                    code: preparedData.code,
                    name: preparedData.name,
                    parent: preparedData.parent,
                    nlevel: preparedData.nlevel,
                    isActive: preparedData.isActive,
                    offcode: preparedData.offcode
                };
                
                setSelectedPosition(newRecord);
                setCurrentMode('edit');
                
                // Update form data with the saved record
                setFormData(newRecord);
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

    const handleDeletePosition = async (position) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete positions');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the position "${position.name}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.ORG_CHART,
                where: {
                    code: position.code,
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
                setMessage('✅ Position deleted successfully!');
                
                // Check if current page is now empty and we're not on page 1
                if (orgChartData.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
                }

                if (selectedPosition && selectedPosition.code === position.code) {
                    handleNewPosition();
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

    const OrgChartSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.Users size={20} />
                        <h3>Positions</h3>
                        <span className="csp-profile-count">{totalCount} positions</span>
                    </div>
                    <div className="csp-sidebar-actions">
                        <div className="csp-search-container">
                            <Icons.Search size={16} className="csp-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by code or name..."
                                value={localSearchTerm}
                                onChange={e => setLocalSearchTerm(e.target.value)}
                                className="csp-search-input"
                            />
                        </div>
                        <button
                            className="csp-btn csp-btn-icon"
                            onClick={refetch}
                            disabled={isDataLoading}
                            title="Refresh data"
                        >
                            <Icons.RefreshCw size={16} className={isDataLoading ? 'csp-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div 
                    className="csp-sidebar-content" 
                    ref={sidebarRef}
                    style={{
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        height: 'calc(100vh - 250px)',
                        scrollBehavior: 'smooth'
                    }}
                >
                    <div className="csp-level-section">
                        <div className="csp-level-header">
                            <Icons.Users size={16} />
                            <span>All Root Positions (Level 1)</span>
                            <span className="csp-position-count">({totalCount})</span>
                        </div>
                    </div>

                    {isDataLoading && orgChartData.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Positions...</p>
                        </div>
                    ) : orgChartData.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {orgChartData.map(position => (
                                    <div
                                        key={position.code}
                                        className={`csp-profile-item ${
                                            selectedPosition?.code === position.code && currentMode === 'edit' ? 'csp-selected' : ''
                                        }`}
                                        onClick={() => handleSelectPosition(position)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(position.code)}</span>
                                                <span className="csp-profile-type-badge">
                                                    Level {position.nlevel}
                                                </span>
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(position.name) || 'Unnamed Position'}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(position.isActive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(position.isActive) ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="csp-parent-badge">Parent: {position.parent}</span>
                                            </div>
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePosition(position);
                                                }}
                                                title="Delete position"
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
                                    onPageChange={handlePageChange}
                                    totalItems={totalCount}
                                    itemsPerPage={pageSize}
                                    maxVisiblePages={5}
                                    loading={isDataLoading}
                                />
                            )}
                        </>
                    ) : (
                        <div className="csp-empty-state">
                            <Icons.Users size={48} className="csp-empty-icon" />
                            <h4>No positions found</h4>
                            {localSearchTerm ? (
                                <p>Try a different search term</p>
                            ) : (
                                <p>Create your first position to get started</p>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        );
    };

    if (rightsLoading && !menuId) {
        return (
            <div className="csp-loading-container">
                <Icons.Loader size={40} className="csp-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="csp-container">
            <header className="csp-header">
                <div className="csp-header-left">
                    <Icons.Users size={24} className="csp-header-icon" />
                    <div>
                        <h1>Organization Chart</h1>
                        <span className="csp-header-subtitle">Manage organizational positions and hierarchy</span>
                    </div>
                </div>
                <div className="csp-header-right">
                    <Icons.User size={16} />
                    <span>{currentUser}</span>
                    <span className="csp-office-tag">Office: {currentOffcode}</span>
                </div>
            </header>

            <div className="csp-toolbar">
                <div className="csp-toolbar-group">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="csp-toolbar-btn csp-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="csp-toolbar-btn" onClick={handleNewPosition}>
                            <Icons.Plus size={16} />
                            <span>New Position</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="csp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedPosition) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a position to edit'); 
                                }
                            }}
                        >
                            <Icons.Pencil size={16} />
                            <span>Edit</span>
                        </button>
                    )}
                </div>

                <div className="csp-toolbar-group">
                    <button className="csp-toolbar-btn" onClick={refetch}>
                        <Icons.RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="csp-toast csp-error">
                    <div className="csp-toast-content">
                        <Icons.AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    <button className="csp-toast-close" onClick={() => setError('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            {message && (
                <div className={`csp-toast ${message.includes('❌') ? 'csp-error' : message.includes('⚠️') ? 'csp-warning' : 'csp-success'}`}>
                    <div className="csp-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={18} />}
                        {message.includes('❌') && <Icons.AlertCircle size={18} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={18} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="csp-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            <div className="csp-main-layout">
                <OrgChartSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.Users size={16} />
                            Position Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <OrgChartForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewPosition={handleNewPosition}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OrganizationChart;