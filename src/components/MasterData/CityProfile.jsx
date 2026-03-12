import React, { useState, useEffect, useCallback, useContext } from 'react';
import "./ChartofAccount.css";
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
        COUNTRY: 'Country',
        CITIES: 'cities'
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
const getInitialCityData = (offcode = '0101') => ({
    CountryID: '',
    CityID: '',
    RegionID: '1',
    CityName: '',
    IsActive: 'true',
    offcode: offcode,
    createdby: '',
    createdate: new Date().toISOString().split('T')[0],
    editby: '',
    editdate: new Date().toISOString().split('T')[0]
});

// Prepare data for database insertion/update
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    const now = new Date();
    const formattedNow = formatDateForDB(now);
    
    const preparedData = {
        offcode: currentOffcode,
        CountryID: data.CountryID || '',
        CityID: data.CityID || '',
        RegionID: data.RegionID || '1',
        CityName: data.CityName || '',
        IsActive: isActiveValue(data.IsActive) ? 'True' : 'False',
        createdby: mode === 'new' ? currentUser : data.createdby || currentUser,
        createdate: mode === 'new' ? formattedNow : data.createdate || formattedNow,
        editby: currentUser,
        editdate: formattedNow
    };

    // Remove any undefined values
    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            preparedData[key] = '';
        }
    });

    return preparedData;
};

/* ---------------------------
 * Data Service Hook
---------------------------- */
const useCityDataService = () => {
    const { credentials } = useAuth();
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
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
            const currentOffcode = normalizeValue(credentials?.company?.offcode) || '0101';

            const [countryData, cityData] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.COUNTRY),
                fetchTableData(API_CONFIG.TABLES.CITIES)
            ]);

            const filteredCountries = countryData.filter(c =>
                normalizeValue(c.offcode) === currentOffcode
            );

            const filteredCities = cityData.filter(c =>
                normalizeValue(c.offcode) === currentOffcode
            );

            setCountries(filteredCountries);
            setCities(filteredCities);

        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { countries, cities, isLoading, error, refetch: loadAllData, setError };
};

/* ---------------------------
 * City Form Component
---------------------------- */
const CityForm = ({
    formData,
    onFormChange,
    onSave,
    onNewCity,
    currentMode,
    isLoading,
    countries,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = normalizeValue(credentials?.company?.offcode) || '0101';

    const {
        CountryID,
        CityID,
        RegionID,
        CityName,
        IsActive
    } = formData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const selectedCountry = countries.find(c => c.CountryID === CountryID);
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New City' : `City: ${CityName || 'City'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{CityID || (isNewMode ? 'Auto-generated' : 'No ID')}</span>
                        <span className="csp-office-badge">Office: {currentOffcode}</span>
                        {selectedCountry && (
                            <span className="csp-office-badge">Country: {selectedCountry.CountryName}</span>
                        )}
                        {!isActiveValue(IsActive) && <span className="csp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="csp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="csp-btn csp-btn-outline"
                                onClick={onNewCity}
                            >
                                <Icons.Plus size={16} />
                                New City
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !CityName?.trim() || !CountryID?.trim()}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save City'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="csp-detail-content">
                <div className="csp-form-section">
                    <h4><Icons.MapPin size={18} /> City Information</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-required">
                            <label>Country *</label>
                            <select
                                value={CountryID}
                                onChange={e => handleInput('CountryID', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Country</option>
                                {countries.map(country => (
                                    <option key={country.CountryID} value={country.CountryID}>
                                        {country.CountryName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group csp-required">
                            <label>City Name *</label>
                            <input
                                type="text"
                                value={CityName}
                                onChange={e => handleInput('CityName', e.target.value)}
                                placeholder="Enter city name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>City ID</label>
                            <input
                                type="text"
                                value={CityID}
                                onChange={e => handleInput('CityID', e.target.value)}
                                placeholder={isNewMode ? "Auto-generated" : "City ID"}
                                disabled={true}
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">ID is auto-generated based on selected country</small>
                            )}
                        </div>

                        <div className="csp-field-group">
                            <label>Region ID</label>
                            <input
                                type="text"
                                value={RegionID}
                                onChange={e => handleNumericInput('RegionID', e.target.value)}
                                placeholder="Region ID (e.g., 1)"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="IsActive"
                                    checked={isActiveValue(IsActive)}
                                    onChange={e => handleCheckbox('IsActive', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                City is Active
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * City Profile Main Component
---------------------------- */
const CityProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = normalizeValue(credentials?.company?.offcode) || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { countries, cities, isLoading: isDataLoading, error, refetch, setError } = useCityDataService();

    const [selectedCity, setSelectedCity] = useState(null);
    const [formData, setFormData] = useState(() => getInitialCityData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [paginatedCities, setPaginatedCities] = useState([]);

    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'City Profile' })
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

    // Filter cities based on selected country and search term
    const filteredCities = cities.filter(city => {
        const matchesCountry = !formData.CountryID || city.CountryID === formData.CountryID;
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = !normalizedSearchTerm || 
            normalizeValue(city.CityName).toLowerCase().includes(normalizedSearchTerm) ||
            normalizeValue(city.CityID).includes(normalizedSearchTerm);
        return matchesCountry && matchesSearch;
    });

    // Update paginated cities
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedCities(filteredCities.slice(startIndex, endIndex));
    }, [filteredCities, currentPage, itemsPerPage]);

    // Reset page when country changes
    useEffect(() => {
        setCurrentPage(1);
    }, [formData.CountryID, searchTerm]);

    const generateCityId = useCallback((countryId) => {
        if (!countryId) return '';

        const countryCities = cities.filter(c => c.CountryID === countryId);
        const existingCodes = countryCities
            .map(c => {
                const id = parseInt(normalizeValue(c.CityID), 10);
                return isNaN(id) ? 0 : id;
            })
            .filter(id => id > 0);
        
        const maxId = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        return (maxId + 1).toString();
    }, [cities]);

    // Initialize form for new city
    useEffect(() => {
        if (currentMode === 'new') {
            const defaultCountryId = formData.CountryID || countries[0]?.CountryID || '';
            const newCityId = generateCityId(defaultCountryId);

            setFormData(prev => ({
                ...getInitialCityData(currentOffcode),
                CountryID: defaultCountryId,
                CityID: newCityId,
                createdby: currentUser,
                editby: currentUser
            }));
        }
    }, [currentMode, currentOffcode, currentUser, countries, generateCityId]);

    // Load selected city for editing
    useEffect(() => {
        if (selectedCity && currentMode === 'edit') {
            const normalizedCity = Object.keys(getInitialCityData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedCity[key] || getInitialCityData()[key]);
                return acc;
            }, {});

            setFormData(normalizedCity);
        }
    }, [selectedCity, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => {
            let newState = { ...prev, [field]: value };
            
            // Auto-generate City ID when country changes in new mode
            if (field === 'CountryID' && currentMode === 'new') {
                const newCityId = generateCityId(value);
                newState.CityID = newCityId;
            }
            
            return newState;
        });
    };

    const handleSelectCity = (city) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view cities');
            return;
        }
        setSelectedCity(city);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(city.CityName)}`);
    };

    const handleNewCity = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new cities');
            return;
        }
        setSelectedCity(null);
        setCurrentMode('new');
        setMessage('Creating new city...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} cities`);
            return;
        }

        if (!formData.CityName.trim()) {
            setMessage('❌ City Name is required!');
            return;
        }

        if (!formData.CountryID.trim()) {
            setMessage('❌ Country is required!');
            return;
        }

        // Check for duplicate city name in the same country
        const duplicateCity = cities.find(c => 
            c.CountryID === formData.CountryID && 
            normalizeValue(c.CityName).toLowerCase() === formData.CityName.toLowerCase() &&
            (currentMode === 'new' || c.CityID !== formData.CityID)
        );

        if (duplicateCity) {
            setMessage('❌ A city with this name already exists in the selected country!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.CITIES,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                CityID: formData.CityID,
                CountryID: formData.CountryID,
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
                setMessage('✅ City saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // Find the newly created city
                    const newCity = cities.find(c =>
                        c.CityID === formData.CityID && 
                        c.CountryID === formData.CountryID && 
                        c.offcode === currentOffcode
                    ) || { ...formData };
                    
                    setSelectedCity(newCity);
                    setCurrentMode('edit');
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

    const handleDeleteCity = async (city) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete cities');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the city "${city.CityName}" (ID: ${city.CityID})?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.CITIES,
                where: {
                    CityID: city.CityID,
                    CountryID: city.CountryID,
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
                setMessage('✅ City deleted successfully!');
                await refetch();
                
                if (selectedCity?.CityID === city.CityID && selectedCity?.CountryID === city.CountryID) {
                    handleNewCity();
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
        setCurrentPage(page);
    };

    const filteredCount = filteredCities.length;
    const selectedCountry = countries.find(c => c.CountryID === formData.CountryID);

    const CityManagementSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.MapPin size={20} />
                        <h3>Cities</h3>
                        <span className="csp-profile-count">
                            {selectedCountry ? `${filteredCount} cities in ${selectedCountry.CountryName}` : `${filteredCount} cities`}
                        </span>
                    </div>
                    <div className="csp-sidebar-actions">
                        <div className="csp-search-container">
                            <Icons.Search size={16} className="csp-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
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

                <div className="csp-sidebar-content">
                    {isDataLoading && cities.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Cities...</p>
                        </div>
                    ) : paginatedCities.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {paginatedCities.map(city => (
                                    <div
                                        key={`${city.CountryID}-${city.CityID}`}
                                        className={`csp-profile-item ${
                                            selectedCity?.CityID === city.CityID && 
                                            selectedCity?.CountryID === city.CountryID && 
                                            currentMode === 'edit' ? 'csp-selected' : ''
                                        }`}
                                        onClick={() => handleSelectCity(city)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(city.CityID)}</span>
                                                <span className="csp-profile-type-badge">
                                                    {countries.find(c => c.CountryID === city.CountryID)?.CountryName || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(city.CityName)}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(city.IsActive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(city.IsActive) ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="csp-region-badge">Region: {normalizeValue(city.RegionID)}</span>
                                            </div>
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCity(city);
                                                }}
                                                title="Delete city"
                                            >
                                                <Icons.Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filteredCount}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                maxVisiblePages={3}
                                loading={isDataLoading}
                            />
                        </>
                    ) : (
                        <div className="csp-empty-state">
                            <Icons.MapPin size={48} className="csp-empty-icon" />
                            <h4>No cities found</h4>
                            {searchTerm ? (
                                <p>Try a different search term</p>
                            ) : !formData.CountryID ? (
                                <p>Select a country in the form to view cities</p>
                            ) : (
                                <p>Create your first city in this country to get started</p>
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
            {/* Header */}
            <header className="csp-header">
                <div className="csp-header-left">
                    <Icons.MapPin size={24} className="csp-header-icon" />
                    <div>
                        <h1>City Management</h1>
                        <span className="csp-header-subtitle">Manage cities by country</span>
                    </div>
                </div>
                <div className="csp-header-right">
                    <Icons.User size={16} />
                    <span>{currentUser}</span>
                    <span className="csp-office-tag">Office: {currentOffcode}</span>
                </div>
            </header>

            {/* Toolbar */}
            <div className="csp-toolbar">
                <div className="csp-toolbar-group">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="csp-toolbar-btn csp-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="csp-toolbar-btn" onClick={handleNewCity}>
                            <Icons.Plus size={16} />
                            <span>New City</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="csp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedCity) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a city to edit'); 
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

            {/* Error Toast */}
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

            {/* Message Toast */}
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

            {/* Main Content */}
            <div className="csp-main-layout">
                <CityManagementSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.MapPin size={16} />
                            City Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <CityForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewCity={handleNewCity}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            countries={countries}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CityProfile;