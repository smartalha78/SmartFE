import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from "../../AuthContext";

/* ---------------------------
 * Generic Configuration & Constants
---------------------------- */
export const normalizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
    return String(value);
};

/* ---------------------------
 * Generic Icons
---------------------------- */
export const Icon = {
    Save: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
    Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6M1 6h22"></path></svg>,
    Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6" /><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2" /></svg>,
    ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
    Package: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    Layers: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    Cogs: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
    Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    // Add other icons as needed
};

/* ---------------------------
 * Generic Auth Hook
---------------------------- */
export const useAuth = () => useContext(AuthContext);

/* ---------------------------
 * Generic Data Service Hook
---------------------------- */
export const useGenericDataService = (config) => {
    const { credentials } = useAuth();
    const [data, setData] = useState([]);
    const [lookupData, setLookupData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTableData = async (tableName) => {
        try {
            const payload = { tableName };
            const resp = await fetch(config.GET_URL, {
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
            
            // Fetch all tables defined in config
            const fetchPromises = Object.values(config.TABLES).map(tableName => 
                fetchTableData(tableName)
            );
            
            const allData = await Promise.all(fetchPromises);
            
            // Process data based on module-specific logic
            const processedData = config.processData(allData, currentOffcode);
            
            setData(processedData.data || []);
            setLookupData(processedData.lookupData || {});
            
        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, config]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { data, lookupData, isLoading, error, refetch: loadAllData };
};

/* ---------------------------
 * Generic Collapsible Section Component
---------------------------- */
export const GenericCollapsibleSection = ({ title, icon, children, defaultExpanded = true, badge }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`modern-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="section-title">
                    <div className="section-icon">
                        {icon}
                    </div>
                    <h3>{title}</h3>
                    {badge && <span className="section-badge">{badge}</span>}
                </div>
                <Icon.ChevronDown className={`chevron ${isExpanded ? 'expanded' : ''}`} />
            </div>
            {isExpanded && (
                <div className="section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Generic Form Component
---------------------------- */
export const GenericForm = ({
    formData,
    onFormChange,
    onSave,
    onNew,
    currentMode,
    isLoading,
    lookupData,
    config,
    renderSections
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.company?.offcode || '0101';

    const isNewMode = currentMode === 'new';

    const handleInput = (field, value) => onFormChange(field, value);
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    return (
        <section className="modern-detail-panel">
            <div className="modern-detail-header">
                <div className="header-content">
                    <h1>{isNewMode ? config.newTitle : config.editTitle}</h1>
                    <div className="header-subtitle">
                        <span className={`mode-badge ${isNewMode ? 'new' : 'edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="muted">• Office: {currentOffcode}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-outline modern-btn"
                        onClick={onNew}
                    >
                        <Icon.Plus /> {config.newButtonText}
                    </button>
                    <button
                        className={`btn btn-primary modern-btn ${isLoading ? 'loading' : ''}`}
                        onClick={onSave}
                        disabled={isLoading || !config.getPrimaryKey(formData)}
                    >
                        {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
                        {isLoading ? 'Saving...' : config.saveButtonText}
                    </button>
                </div>
            </div>

            <div className="modern-detail-body">
                {renderSections && renderSections({
                    formData,
                    handleInput,
                    handleCheckbox,
                    lookupData,
                    currentMode,
                    currentOffcode
                })}
            </div>
        </section>
    );
};

/* ---------------------------
 * Generic List Component
---------------------------- */
export const GenericList = ({
    items,
    selectedItem,
    onSelect,
    searchTerm,
    onSearchChange,
    isLoading,
    config,
    renderItem
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.company?.offcode || '0101';

    const filteredItems = items.filter(item =>
        config.searchPredicate(item, searchTerm)
    );

    return (
        <aside className="modern-sidebar">
            <div className="sidebar-top">
                <div className="sidebar-title">
                    <div className="sidebar-icon">
                        {config.listIcon || <Icon.Layers />}
                    </div>
                    <div className="sidebar-title-content">
                        <div className="sidebar-main-title">{config.listTitle}</div>
                        <div className="sidebar-subtitle">{items.length} items • Office: {currentOffcode}</div>
                    </div>
                </div>
                <div className="sidebar-controls">
                    <div className="modern-search-wrap">
                        <Icon.Search className="search-icon" />
                        <input
                            type="text"
                            placeholder={config.searchPlaceholder}
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="modern-search-input"
                        />
                    </div>
                    <button
                        className="btn btn-icon modern-refresh-btn"
                        onClick={config.onRefresh}
                        disabled={isLoading}
                        title="Refresh data"
                    >
                        <Icon.Refresh className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="sidebar-body">
                {isLoading && items.length === 0 ? (
                    <div className="modern-loading-state">
                        <Icon.Loader className="spin" />
                        <span>Loading...</span>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="modern-list">
                        {filteredItems.map((item, index) => (
                            renderItem ? renderItem(item, selectedItem, onSelect, index) : (
                                <div
                                    key={item.id || index}
                                    className={`modern-list-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => onSelect(item)}
                                >
                                    {config.renderListItem ? config.renderListItem(item) : (
                                        <div className="list-item-content">
                                            <div className="list-item-main">
                                                <div className="list-item-name">{item.name}</div>
                                                <div className="list-item-code">{item.code}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="modern-empty-sidebar">
                        {config.emptyIcon || <Icon.Layers className="empty-sidebar-icon" />}
                        <div className="empty-sidebar-title">{config.emptyTitle}</div>
                        {searchTerm && (
                            <div className="empty-sidebar-subtitle">{config.emptySubtitle}</div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

/* ---------------------------
 * Generic Main Component Template
---------------------------- */
export const GenericMasterComponent = ({ config, ModuleSpecificComponent }) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { data, lookupData, isLoading: isDataLoading, error, refetch } = useGenericDataService(config);

    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState(() => config.getInitialFormData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setCurrentMode('edit');
        setMessage(`Editing: ${config.getItemDisplayName(item)}`);
    };

    const handleNewItem = () => {
        setSelectedItem(null);
        setCurrentMode('new');
        const newItemData = config.getInitialFormData(currentOffcode);
        setFormData(newItemData);
    };

    const handleSave = async () => {
        if (!config.validateForm(formData)) {
            setMessage('❌ Validation failed!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const result = await config.saveData(formData, currentMode, currentOffcode);
            if (result.success) {
                setMessage(`✅ ${currentMode === 'new' ? 'Created' : 'Updated'} successfully!`);
                await refetch();
                
                if (currentMode === 'new') {
                    const newItem = data.find(item => 
                        config.getPrimaryKey(item) === config.getPrimaryKey(formData)
                    );
                    if (newItem) {
                        setSelectedItem(newItem);
                        setCurrentMode('edit');
                    }
                }
            } else {
                setMessage(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modern-page-container">
            <div className="modern-app-header">
                <div className="header-brand">
                    <div className="brand-icon">
                        {config.headerIcon || <Icon.Layers />}
                    </div>
                    <div className="brand-content">
                        <h1>{config.pageTitle}</h1>
                        <div className="brand-subtitle">{config.pageSubtitle}</div>
                    </div>
                </div>
                <div className="header-user">
                    <div className="user-avatar">
                        <Icon.Package />
                    </div>
                    <span className="user-name">{currentUser}</span>
                </div>
            </div>

            {error && (
                <div className="modern-toast error">
                    <div className="toast-content">
                        <Icon.XCircle />
                        <span>{error}</span>
                    </div>
                    <button className="toast-close" onClick={() => { }}>×</button>
                </div>
            )}

            {message && (
                <div className={`modern-toast ${message.includes('❌') ? 'error' : message.includes('✅') ? 'success' : 'info'}`}>
                    <div className="toast-content">
                        {message.includes('✅') && <Icon.CheckCircle />}
                        {message.includes('❌') && <Icon.XCircle />}
                        <span>{message.replace(/[✅❌]/g, '')}</span>
                    </div>
                    <button className="toast-close" onClick={() => setMessage('')}>×</button>
                </div>
            )}

            <div className="modern-content-area">
                <GenericList
                    items={data}
                    selectedItem={selectedItem}
                    onSelect={handleSelectItem}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    isLoading={isDataLoading}
                    config={config.listConfig}
                    renderItem={config.renderListItem}
                />

                <div className="modern-main-content">
                    <div className="content-tabs">
                        <button className="tab active modern-tab">
                            {config.tabIcon || <Icon.Layers />} {config.tabTitle}
                        </button>
                    </div>

                    <div className="modern-content-panel">
                        {ModuleSpecificComponent ? (
                            <ModuleSpecificComponent
                                formData={formData}
                                onFormChange={handleFormChange}
                                onSave={handleSave}
                                onNew={handleNewItem}
                                currentMode={currentMode}
                                isLoading={isSaving}
                                lookupData={lookupData}
                                selectedItem={selectedItem}
                                config={config}
                            />
                        ) : (
                            <GenericForm
                                formData={formData}
                                onFormChange={handleFormChange}
                                onSave={handleSave}
                                onNew={handleNewItem}
                                currentMode={currentMode}
                                isLoading={isSaving}
                                lookupData={lookupData}
                                config={config}
                                renderSections={config.renderSections}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};