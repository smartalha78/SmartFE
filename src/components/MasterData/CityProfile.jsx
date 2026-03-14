import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
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

// Extract numeric value from ID (remove leading zeros if any)
const getNumericId = (id) => {
    if (!id) return 0;
    return parseInt(id, 10) || 0;
};

/* ---------------------------
 * Initial State (without audit fields)
---------------------------- */
const getInitialCityData = (offcode = '1010') => ({
    CountryID: '',
    CityID: '',
    RegionID: '1',
    CityName: '',
    IsActive: 'true',
    offcode: offcode
});

// Prepare data for database insertion/update - WITHOUT audit fields
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    // Helper function to convert empty strings to null for optional fields
    const toDBValue = (value) => {
        if (value === undefined || value === '') return null;
        return value;
    };

    const preparedData = {
        offcode: currentOffcode,
        CountryID: data.CountryID || '',
        CityID: data.CityID || '',
        RegionID: data.RegionID || '1',
        CityName: data.CityName || '',
        IsActive: isActiveValue(data.IsActive) ? 'True' : 'False'
    };

    // Remove any undefined values
    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            delete preparedData[key];
        }
    });

    console.log('Prepared data for DB (no audit fields):', preparedData);

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useCityDataService = () => {
    const { credentials } = useAuth();
    const [cities, setCities] = useState([]);
    const [allCities, setAllCities] = useState([]); // Store ALL cities for code generation
    const [totalCount, setTotalCount] = useState(0);
    const [countries, setCountries] = useState([]);
    const [allCountries, setAllCountries] = useState([]); // Store ALL countries for dropdown
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountryId, setSelectedCountryId] = useState('');

    // Fetch ALL cities for code generation (non-paginated)
    const fetchAllCities = useCallback(async (offcode) => {
        try {
            console.log('Fetching ALL cities for code generation...');
            const whereClause = `offcode = '${offcode}'`;
            const payload = {
                tableName: API_CONFIG.TABLES.CITIES,
                where: whereClause,
                usePagination: false // Get ALL records
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (data.success) {
                setAllCities(data.rows || []);
                console.log('All cities count:', data.rows?.length);
            }
        } catch (err) {
            console.error('Error fetching all cities:', err);
        }
    }, []);

    const fetchPaginatedData = useCallback(async (page, size, search, countryId) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';

            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setCities([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching cities for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}, country: ${countryId}`);

            // Build where clause
            let whereClause = `offcode = '${currentOffcode}'`;
            if (countryId) {
                whereClause += ` AND CountryID = '${countryId}'`;
            }
            if (search) {
                whereClause += ` AND (CityName LIKE '%${search}%' OR CityID LIKE '%${search}%')`;
            }

            const payload = {
                tableName: API_CONFIG.TABLES.CITIES,
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
                setCities(data.rows || []);
                setTotalCount(data.totalCount || 0);
            } else {
                setCities([]);
                setTotalCount(0);
            }

            // Fetch ALL cities once for code generation (only if not already loaded)
            if (allCities.length === 0) {
                await fetchAllCities(currentOffcode);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setCities([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, allCities.length, fetchAllCities]);

    // Fetch countries separately (non-paginated)
    const fetchCountries = useCallback(async () => {
        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            const whereClause = `offcode = '${currentOffcode}'`;
            const payload = {
                tableName: API_CONFIG.TABLES.COUNTRY,
                where: whereClause,
                usePagination: false
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (data.success) {
                setCountries(data.rows || []);
                setAllCountries(data.rows || []);
            }
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    }, [credentials]);

    // Load data whenever pagination, search, or country selection changes
    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm, selectedCountryId);
    }, [currentPage, pageSize, searchTerm, selectedCountryId, fetchPaginatedData]);

    // Load countries on mount
    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    const refetch = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm, selectedCountryId);
    }, [currentPage, pageSize, searchTerm, selectedCountryId, fetchPaginatedData]);

    const goToPage = (page) => {
        console.log(`Changing to page: ${page}`);
        setCurrentPage(page);
    };

    const setSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const setCountryFilter = (countryId) => {
        setSelectedCountryId(countryId);
        setCurrentPage(1);
    };

    const updatePageSize = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        cities,
        allCities,
        countries,
        allCountries,
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
        selectedCountryId,
        setCountryFilter,
        updatePageSize
    };
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
    const currentOffcode = normalizeValue(credentials?.offcode || credentials?.company?.offcode) || '1010';

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
                                disabled={true}
                                placeholder={isNewMode ? "Auto-generated" : "City ID"}
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
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = normalizeValue(credentials?.offcode || credentials?.company?.offcode) || '1010';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);
    const headerRef = useRef(null);
    const filterRef = useRef(null);

    const {
        cities,
        allCities,
        countries,
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
        selectedCountryId,
        setCountryFilter,
        updatePageSize
    } = useCityDataService();

    const [selectedCity, setSelectedCity] = useState(null);
    const [formData, setFormData] = useState(() => getInitialCityData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [sidebarHeight, setSidebarHeight] = useState('calc(100vh - 280px)');

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

    // Update sidebar height based on header heights
    useEffect(() => {
        const updateSidebarHeight = () => {
            if (headerRef.current && filterRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                const filterHeight = filterRef.current.offsetHeight;
                const totalHeaderHeight = headerHeight + filterHeight + 40; // Add padding
                setSidebarHeight(`calc(100vh - ${totalHeaderHeight}px)`);
            }
        };

        updateSidebarHeight();
        window.addEventListener('resize', updateSidebarHeight);
        
        // Small delay to ensure DOM is ready
        setTimeout(updateSidebarHeight, 100);
        
        return () => window.removeEventListener('resize', updateSidebarHeight);
    }, []);

    // Get the true maximum CityID for a specific country from ALL cities
    const getMaxCityIdForCountry = useCallback((countryId) => {
        if (!countryId) return 0;
        
        // Use allCities if available, otherwise fall back to paginated cities
        const sourceCities = allCities.length > 0 ? allCities : cities;
        
        const numericIds = sourceCities
            .filter(c => c.CountryID === countryId && c.offcode === currentOffcode)
            .map(c => getNumericId(c.CityID))
            .filter(id => id > 0);
        
        return numericIds.length > 0 ? Math.max(...numericIds) : 0;
    }, [allCities, cities, currentOffcode]);

    // Generate City ID based on selected country
    const generateCityId = useCallback((countryId) => {
        if (!countryId) return '';
        
        const maxId = getMaxCityIdForCountry(countryId);
        const nextId = maxId + 1;
        
        console.log('Generating City ID:', {
            countryId,
            maxId,
            nextId,
            source: allCities.length > 0 ? 'allCities' : 'cities'
        });
        
        return nextId.toString();
    }, [getMaxCityIdForCountry, allCities.length, cities.length]);

    // Initialize form for new city
    useEffect(() => {
        if (currentMode === 'new' && !selectedCity) {
            // Use the selected country filter or first country
            const defaultCountryId = selectedCountryId || countries[0]?.CountryID || '';
            const newCityId = generateCityId(defaultCountryId);

            setFormData({
                ...getInitialCityData(currentOffcode),
                CountryID: defaultCountryId,
                CityID: newCityId,
                RegionID: '1',
                IsActive: 'true'
            });

            // Update country filter if not set
            if (!selectedCountryId && defaultCountryId) {
                setCountryFilter(defaultCountryId);
            }
        }
    }, [currentMode, currentOffcode, countries, generateCityId, selectedCity, selectedCountryId, setCountryFilter]);

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
            if (field === 'CountryID' && currentMode === 'new' && value) {
                const newCityId = generateCityId(value);
                newState.CityID = newCityId;
                
                // Update country filter when country changes
                setCountryFilter(value);
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
        
        // Update country filter to show cities from the same country
        if (city.CountryID) {
            setCountryFilter(city.CountryID);
        }
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

        // For new records, verify the ID is still available using ALL cities
        if (currentMode === 'new') {
            const sourceCities = allCities.length > 0 ? allCities : cities;
            
            const existingCity = sourceCities.find(c => 
                c.CountryID === formData.CountryID && 
                c.CityID === formData.CityID &&
                c.offcode === currentOffcode
            );

            if (existingCity) {
                // ID already exists, generate a new one
                const newCityId = generateCityId(formData.CountryID);
                setFormData(prev => ({ ...prev, CityID: newCityId }));
                setMessage('⚠️ City ID was taken, generating new ID...');
                setIsSaving(false);
                return;
            }

            // Check for duplicate city name in the same country
            const duplicateName = sourceCities.find(c => 
                c.CountryID === formData.CountryID && 
                normalizeValue(c.CityName).toLowerCase() === formData.CityName.toLowerCase() &&
                c.offcode === currentOffcode
            );

            if (duplicateName) {
                setMessage('❌ A city with this name already exists in the selected country!');
                setIsSaving(false);
                return;
            }
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database - WITHOUT audit fields
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

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                console.log('Error Response:', errorText);

                // Check for duplicate key errors
                if (errorText.includes('duplicate key') || errorText.includes('2627')) {
                    if (currentMode === 'new') {
                        const newCityId = generateCityId(formData.CountryID);
                        setFormData(prev => ({ ...prev, CityID: newCityId }));
                        setMessage('⚠️ City ID was taken, please try saving again');
                    } else {
                        setMessage('❌ Cannot update: Duplicate key violation');
                    }
                    setIsSaving(false);
                    return;
                }

                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const result = await resp.json();
            console.log('Save result:', result);

            if (result.success) {
                setMessage('✅ City saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // Find the newly created city
                    const newCity = {
                        ...preparedData,
                        CityName: preparedData.CityName
                    };
                    
                    setSelectedCity(newCity);
                    setCurrentMode('edit');
                    setFormData(newCity);
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
                
                // Check if current page is now empty and we're not on page 1
                if (cities.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
                }
                
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
        console.log(`Page change requested to: ${page}`);
        goToPage(page);
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop = 0;
        }
    };

    const handleCountryChange = (e) => {
        const countryId = e.target.value;
        setCountryFilter(countryId);
        if (currentMode === 'new') {
            setFormData(prev => ({
                ...prev,
                CountryID: countryId,
                CityID: generateCityId(countryId)
            }));
        }
    };

    const selectedCountry = countries.find(c => c.CountryID === formData.CountryID);
    const filteredCount = totalCount; // Use totalCount from server

    const CityManagementSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header" ref={headerRef}>
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
                    className="csp-sidebar-header" 
                    ref={filterRef}
                    style={{ 
                        paddingTop: 0, 
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid var(--gray-200)'
                    }}
                >
                    <select
                        value={selectedCountryId || ''}
                        onChange={handleCountryChange}
                        className="csp-form-select"
                        style={{ width: '100%' }}
                    >
                        <option value="">All Countries</option>
                        {countries.map(country => (
                            <option key={country.CountryID} value={country.CountryID}>
                                {country.CountryName}
                            </option>
                        ))}
                    </select>
                </div>

                <div
                    className="csp-sidebar-content"
                    ref={sidebarRef}
                    style={{
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        height: sidebarHeight,
                        scrollBehavior: 'smooth'
                    }}
                >
                    {isDataLoading && cities.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Cities...</p>
                        </div>
                    ) : cities.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {cities.map(city => (
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
                            <Icons.MapPin size={48} className="csp-empty-icon" />
                            <h4>No cities found</h4>
                            {localSearchTerm ? (
                                <p>Try a different search term</p>
                            ) : !selectedCountryId ? (
                                <p>Select a country to view cities</p>
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