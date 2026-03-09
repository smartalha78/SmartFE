import React, { useState, useEffect, useCallback, useContext } from 'react';
import "./ChartofAccount.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";

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
const useAuth = () => useContext(AuthContext);

/* ---------------------------
 * Utilities & Icons
---------------------------- */
const normalizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
    return String(value);
};

const Icon = {
    Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
    Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6M1 6h22"></path></svg>,
    Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6" /><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2" /></svg>,
    Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    Hierarchy: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2h6"/><path d="M14 6h2"/><path d="M14 10h6"/><path d="M4 18h2"/><path d="M4 14h6"/><path d="M4 22h6"/><rect x="8" y="2" width="8" height="6" rx="1"/><rect x="4" y="12" width="8" height="6" rx="1"/><path d="M22 18h-6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>,
};

/* ---------------------------
 * Initial State
---------------------------- */
const getInitialOrgChartData = (offcode = '0101') => ({
    code: '',
    name: '',
    parent: '00',
    nlevel: '1',
    isActive: 'true',
    offcode: offcode
});

/* ---------------------------
 * Data Service
---------------------------- */
const useOrgChartDataService = () => {
    const { credentials } = useAuth();
    const [orgChartData, setOrgChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTableData = async (tableName) => {
        try {
            const payload = { tableName };
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
    };

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.company?.offcode || '0101';

            const orgChartData = await fetchTableData(API_CONFIG.TABLES.ORG_CHART);

            const filteredData = orgChartData.filter(item =>
                normalizeValue(item.offcode) === currentOffcode
            );

            setOrgChartData(filteredData);

        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { orgChartData, isLoading, error, refetch: loadAllData, setError };
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
    const currentOffcode = credentials?.company?.offcode || '0101';

    const {
        code,
        name,
        parent,
        nlevel,
        isActive
    } = formData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    return (
        <section className="detail-panel">
            <div className="detail-header">
                <div className="header-content">
                    <h1>{isNewMode ? 'Add New Position' : `Position Details: ${name || 'Position'}`}</h1>
                    <div className="header-subtitle">
                        <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
                        <span className="muted">• Code: {code || 'No Code'}</span>
                        <span className="muted">• Office: {currentOffcode}</span>
                        {!(isActive === 'true') && <span className="inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="header-actions">
                    {canEdit && (
                        <>
                            <button
                                className="btn btn-outline"
                                onClick={onNewPosition}
                            >
                                <Icon.Plus /> New Position
                            </button>
                            <button
                                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !name || !code}
                            >
                                {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
                                {isLoading ? 'Saving...' : 'Save Position'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-body">
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.Hierarchy />
                            <h3>Position Information</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group required">
                                <label>Position Code *</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => handleInput('code', e.target.value)}
                                    placeholder="e.g., 001, 002"
                                    className="mono"
                                    disabled={!isNewMode || !canEdit}
                                />
                                {isNewMode && (
                                    <div className="hint">Enter a unique 3-digit code (001, 002, etc.)</div>
                                )}
                            </div>

                            <div className="form-group required">
                                <label>Position Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => handleInput('name', e.target.value)}
                                    placeholder="e.g., Manager, Supervisor"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive === 'true'}
                                    onChange={e => handleCheckbox('isActive', e)}
                                    disabled={!canEdit}
                                />
                                <label htmlFor="isActive">Position is Active</label>
                            </div>

                            <div className="form-group">
                                <label>Parent Position</label>
                                <input
                                    type="text"
                                    value="Root (No Parent)"
                                    disabled
                                />
                                <div className="hint">Parent is fixed at '00' for all positions.</div>
                            </div>

                            <div className="form-group">
                                <label>Organization Level</label>
                                <input
                                    type="text"
                                    value="Level 1 (Top Level)"
                                    disabled
                                />
                                <div className="hint">Level is fixed at '1' for all positions.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.Hierarchy />
                            <h3>Hierarchy Information Preview</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="hierarchy-preview">
                            <div className="hierarchy-item">
                                <div className="hierarchy-level">Level {nlevel}</div>
                                <div className="hierarchy-details">
                                    <strong>{code} - {name || 'New Position'}</strong>
                                    <div className="hierarchy-parent">
                                        Reports to: Root ({parent})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ---------------------------
 * Organization Chart Main Component
---------------------------- */
const OrganizationChart = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { orgChartData, isLoading: isDataLoading, error, refetch, setError } = useOrgChartDataService();

    const [selectedPosition, setSelectedPosition] = useState(null);
    const [formData, setFormData] = useState(() => getInitialOrgChartData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);

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
                    setScreenConfig(data.screen);
                    setMenuId(data.screen.id);
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
            }
        };
        loadScreenConfig();
    }, []);

    const filteredPositions = orgChartData.filter(position => {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        return !searchTerm ||
            normalizeValue(position.name).toLowerCase().includes(normalizedSearchTerm) ||
            normalizeValue(position.code).includes(normalizedSearchTerm);
    });

    const positionsByLevel = {
        '1': filteredPositions.sort((a, b) =>
            normalizeValue(a.code).localeCompare(normalizeValue(b.code))
        )
    };

    const generateNextCode = useCallback(() => {
        if (orgChartData.length === 0) {
            return '001';
        }

        const existingCodes = orgChartData
            .map(p => parseInt(normalizeValue(p.code)))
            .filter(code => !isNaN(code) && code > 0);

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextCode = maxCode + 1;

        return nextCode.toString().padStart(3, '0');
    }, [orgChartData]);

    useEffect(() => {
        if (currentMode === 'new') {
            const newCode = generateNextCode();

            setFormData(prev => ({
                ...getInitialOrgChartData(currentOffcode),
                code: newCode
            }));

            setMessage(`Ready to add new position. Auto-generated code: ${newCode}`);
        }
    }, [currentMode, currentOffcode, generateNextCode]);

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

        const payload = {
            tableName: API_CONFIG.TABLES.ORG_CHART,
            data: {
                ...formData,
                offcode: currentOffcode
            }
        };

        if (currentMode === 'edit') {
            payload.where = {
                code: formData.code,
                offcode: currentOffcode
            };
        }

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Position saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    const newRecord = orgChartData.find(p =>
                        p.code === formData.code && p.offcode === currentOffcode
                    ) || formData;
                    setSelectedPosition(newRecord);
                    setCurrentMode('edit');
                } else {
                    setSelectedPosition(payload.data);
                }
            } else {
                setMessage(`❌ Save failed: ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Save error:', error);
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
                await refetch();

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

    const OrgChartSidebar = () => {
        const positions = positionsByLevel['1'] || [];

        return (
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-title">
                        <Icon.Hierarchy className="big" />
                        <div>
                            <div className="h3">Organization Chart</div>
                            <div className="muted small">{orgChartData.length} positions • Office: {currentOffcode}</div>
                        </div>
                    </div>

                    <div className="search-and-filter-bar">
                        <div className="search-wrap full-width">
                            <Icon.Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search positions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-icon refresh-button"
                            onClick={refetch}
                            disabled={isDataLoading}
                            title="Refresh data"
                        >
                            <Icon.Refresh className={isDataLoading ? 'spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="sidebar-body">
                    <div className="level-section">
                        <div className="level-header sidebar-level-header">
                            <Icon.Users className="level-icon" />
                            <div className="level-name">All Root Positions (Level 1)</div>
                            <div className="position-count">({positions.length} total)</div>
                        </div>
                    </div>

                    {isDataLoading && orgChartData.length === 0 ? (
                        <div className="loading-message">
                            <Icon.Loader className="spin" /> Loading Positions...
                        </div>
                    ) : positions.length > 0 ? (
                        <div className="position-list">
                            <div className="positions-container">
                                {positions.map(position => (
                                    <div
                                        key={position.code}
                                        className={`position-item ${selectedPosition?.code === position.code && currentMode === 'edit' ? 'selected' : ''
                                            }`}
                                        onClick={() => handleSelectPosition(position)}
                                    >
                                        <div className="position-main">
                                            <div className="position-code-name">
                                                <span className="position-code">{normalizeValue(position.code)}</span>
                                                <span className="position-name">{normalizeValue(position.name) || 'Unnamed Position'}</span>
                                            </div>
                                            <div className="position-meta">
                                                {normalizeValue(position.isActive) === 'true' ? (
                                                    <span className="status active">Active</span>
                                                ) : (
                                                    <span className="status inactive">Inactive</span>
                                                )}
                                            </div>
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <div className="position-actions">
                                                <button
                                                    className="btn btn-icon btn-danger btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePosition(position);
                                                    }}
                                                    disabled={isSaving}
                                                    title="Delete position"
                                                >
                                                    <Icon.Trash width="16" height="16" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Icon.Hierarchy className="big-muted" />
                            <div className="muted">No positions found</div>
                            {searchTerm && (
                                <div className="small muted">Try a different search term</div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        );
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
                    <Icon.Hierarchy className="brand-icon" />
                    <div>
                        <h1>Organization Chart</h1>
                        <div className="muted">Manage organizational positions and hierarchy</div>
                    </div>
                </div>
                <div className="header-user">
                    <Icon.Users className="icon-sm" />
                    <span>{currentUser}</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-section">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="toolbar-btn primary" onClick={handleSave} disabled={isSaving}>
                            <Icon.Save /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="toolbar-btn" onClick={handleNewPosition}>
                            <Icon.Plus /> New Position
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="toolbar-btn" onClick={() => { 
                            if (selectedPosition) { 
                                setCurrentMode('edit'); 
                            } else {
                                setMessage('Select a position to edit'); 
                            }
                        }}>
                            <Icon.Edit /> Edit
                        </button>
                    )}
                </div>

                <div className="toolbar-section">
                    <button className="toolbar-btn" onClick={refetch}>
                        <Icon.Refresh /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="toast error">
                    <div className="toast-content">
                        <Icon.XCircle />
                        <span>{error}</span>
                    </div>
                    <button className="toast-close" onClick={() => setError('')}>×</button>
                </div>
            )}

            {message && (
                <div className={`toast ${message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'success'}`}>
                    <div className="toast-content">
                        {message.includes('✅') && <Icon.CheckCircle />}
                        {message.includes('❌') && <Icon.XCircle />}
                        {message.includes('⚠️') && <Icon.XCircle />}
                        <span>{message.replace(/[✅❌⚠️]/g, '').trim()}</span>
                    </div>
                    <button className="toast-close" onClick={() => setMessage('')}>×</button>
                </div>
            )}

            <div className="content-area">
                <OrgChartSidebar />

                <div className="main-content">
                    <div className="content-tabs">
                        <button className="tab active">
                            <Icon.Hierarchy /> Position Details
                        </button>
                    </div>

                    <div className="content-panel">
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
                </div>
            </div>
        </div>
    );
};

export default OrganizationChart;