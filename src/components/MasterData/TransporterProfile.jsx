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
        TRANSPORTER: 'comtransporter',
        COUNTRY: 'Country',
        CITY: 'cities',
        ACCOUNT: 'acChartOfAccount',
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
 * Initial State
---------------------------- */
const getInitialTransporterData = (offcode = '', currentUser = 'SYSTEM') => ({
    offcode: offcode,
    TransporterCode: '',
    TransporterName: '',
    isactive: 'true',
    contact: '',
    billaddress: '',
    zipcode: '',
    CountryID: '1',
    country: '',
    CityID: '1',
    city: '',
    phone1: '',
    mobile: '0',
    fax: '',
    email: '',
    paymentmethod: '1',
    TransporterglCode: '',
    defaultTypePerAmt: '01',
    defaultAmount: '0',
    // For new records, only createdby/date should be set, editby/date should be empty
    createdby: currentUser,
    createdate: getCurrentDateTime(),
    editby: '',
    editdate: ''
});

// Prepare data for database insertion/update
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    const currentDateTime = getCurrentDateTime();
    
    // Create base object with all fields from the API response structure
    const preparedData = {
        offcode: currentOffcode,
        TransporterCode: data.TransporterCode || '',
        TransporterName: data.TransporterName || '',
        isactive: isActiveValue(data.isactive) ? 'True' : 'False',
        contact: data.contact || '',
        billaddress: data.billaddress || '',
        zipcode: data.zipcode || '',
        CountryID: data.CountryID || '1',
        country: data.country || '',
        CityID: data.CityID || '1',
        city: data.city || '',
        phone1: data.phone1 || '',
        mobile: data.mobile || '0',
        fax: data.fax || '',
        email: data.email || '',
        paymentmethod: data.paymentmethod || '1',
        TransporterglCode: data.TransporterglCode || '',
        defaultTypePerAmt: data.defaultTypePerAmt || '01',
        defaultAmount: data.defaultAmount || '0'
    };

    // Add audit fields based on mode
    if (mode === 'new') {
        // New record: set created fields, leave edit fields empty
        preparedData.createdby = currentUser;
        preparedData.createdate = currentDateTime;
        preparedData.editby = '';  // Empty for new records
        preparedData.editdate = ''; // Empty for new records
    } else {
        // Edit mode: preserve original created fields, update edit fields
        preparedData.createdby = data.createdby || currentUser;
        preparedData.createdate = data.createdate || currentDateTime;
        preparedData.editby = currentUser;
        preparedData.editdate = currentDateTime;
    }

    console.log('🔍 prepareDataForDB Output:', {
        input: { data, mode, currentUser, currentOffcode },
        output: preparedData
    });

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useTransporterDataService = () => {
    const { credentials } = useAuth();
    const [transporters, setTransporters] = useState([]);
    const [lookupData, setLookupData] = useState({
        countries: [],
        cities: [],
        glAccounts: [],
        branchData: null
    });
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Generic function to fetch table data with offcode filtering
    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                // Check which column name to use for offcode based on table
                const offcodeColumn = tableName === API_CONFIG.TABLES.COUNTRY ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.CITY ? 'offcode' :
                                     tableName === API_CONFIG.TABLES.ACCOUNT ? 'offcode' :
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

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setTransporters([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching transporters for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (TransporterCode LIKE '%${search}%' OR TransporterName LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.TRANSPORTER,
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
                setTransporters(data.rows || []);
                setTotalCount(data.totalCount || 0);
            } else {
                setTransporters([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching transporters:', err);
            setError(`Failed to load data: ${err.message}`);
            setTransporters([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    const fetchLookupData = useCallback(async () => {
        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode for lookup data');
                return;
            }

            // Fetch all lookup tables with offcode filtering
            const [
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.COUNTRY, currentOffcode),
                fetchTableData(API_CONFIG.TABLES.CITY, currentOffcode),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, currentOffcode, "code IS NOT NULL AND name IS NOT NULL"),
                fetchTableData(API_CONFIG.TABLES.BRANCH, currentOffcode)
            ]);

            // Process countries
            const processedCountries = countryData.map(c => ({
                id: normalizeValue(c.CountryID),
                name: normalizeValue(c.CountryName)
            }));

            // Process cities
            const processedCities = cityData.map(c => ({
                id: normalizeValue(c.CityID),
                name: normalizeValue(c.CityName),
                countryId: normalizeValue(c.CountryID)
            }));

            // Process GL accounts
            const processedGLAccounts = glAccountData
                .filter(acc => acc.code && acc.name)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                }));

            // Get current branch
            const currentBranch = branchData.length > 0 ? branchData[0] : null;

            setLookupData({
                countries: processedCountries,
                cities: processedCities,
                glAccounts: processedGLAccounts,
                branchData: currentBranch
            });

            console.log('✅ Lookup data loaded:', {
                countries: processedCountries.length,
                cities: processedCities.length,
                glAccounts: processedGLAccounts.length,
                hasBranch: !!currentBranch
            });

        } catch (err) {
            console.error('Error fetching lookup data:', err);
        }
    }, [credentials, fetchTableData]);

    // NEW: Function to fetch maximum transporter code from ALL records
    const fetchMaxTransporterCode = useCallback(async () => {
        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                return '0000000001';
            }

            // Fetch ALL transporters for this offcode (no pagination)
            const payload = { 
                tableName: API_CONFIG.TABLES.TRANSPORTER,
                where: `offcode = '${currentOffcode}'`,
                usePagination: false
            };

            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            
            if (data.success && data.rows && data.rows.length > 0) {
                const existingCodes = data.rows
                    .map(t => {
                        const code = normalizeValue(t.TransporterCode);
                        // Handle both string and number codes
                        if (code.startsWith('0')) {
                            return parseInt(code, 10);
                        }
                        return parseInt(code, 10);
                    })
                    .filter(code => !isNaN(code) && code > 0);

                const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
                const nextCode = maxCode + 1;
                return nextCode.toString().padStart(10, '0');
            }
            
            return '0000000001';
        } catch (err) {
            console.error('Error fetching max transporter code:', err);
            return '0000000001';
        }
    }, [credentials]);

    // Load data whenever pagination or search changes
    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    // Load lookup data once when component mounts and when offcode changes
    useEffect(() => {
        fetchLookupData();
    }, [fetchLookupData]);

    const refetch = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetchAll = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
        fetchLookupData();
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData, fetchLookupData]);

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
        transporters, 
        lookupData,
        totalCount,
        totalPages,
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
        fetchMaxTransporterCode  // Add this to the return
    };
};

/* ---------------------------
 * Transport Profile Form Component
---------------------------- */
const TransportProfileForm = ({
    formData,
    onFormChange,
    onSave,
    onNewProfile,
    currentMode,
    isLoading,
    hasPermission,
    menuId,
    lookupData
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';

    const {
        TransporterCode,
        TransporterName,
        isactive,
        contact,
        billaddress,
        zipcode,
        CountryID,
        CityID,
        phone1,
        mobile,
        fax,
        email,
        paymentmethod,
        TransporterglCode,
        defaultTypePerAmt,
        defaultAmount,
        createdby,
        createdate,
        editby,
        editdate
    } = formData;

    const { countries, cities, glAccounts, branchData } = lookupData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');
    const availableCities = cities.filter(c => c.countryId === CountryID);

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

    // Payment Method Options
    const paymentMethods = [
        { code: '1', name: 'Advance Party' },
        { code: '2', name: 'Payment Against Delivery' },
        { code: '3', name: 'Credit' }
    ];

    // Default Type Options
    const defaultTypeOptions = [
        { code: '01', name: 'Fixed Amount' },
        { code: '02', name: 'Percentage' }
    ];

    // Get transporter control account from branch data
    const transporterControlAccount = branchData?.TransporterControlAccount || '';

    // Filter GL accounts based on control account
    const transporterGLAccounts = glAccounts.filter(acc =>
        acc.code.startsWith(transporterControlAccount) || transporterControlAccount === ''
    );

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Transporter' : `Transporter: ${TransporterName || 'Transporter'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{TransporterCode || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
                        <span className="csp-office-badge">Office: {currentOffcode}</span>
                        {!isActiveValue(isactive) && <span className="csp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="csp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="csp-btn csp-btn-outline"
                                onClick={onNewProfile}
                            >
                                <Icons.Plus size={16} />
                                New Transporter
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !TransporterName || !TransporterCode}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Transporter'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="csp-detail-content">
                {/* General Information */}
                <div className="csp-form-section">
                    <h4><Icons.Truck size={18} /> General Information</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-required">
                            <label>Transporter Code *</label>
                            <input
                                type="text"
                                value={TransporterCode}
                                onChange={e => handleInput('TransporterCode', e.target.value)}
                                placeholder="Auto-generated"
                                disabled={!isNewMode || !canEdit}
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Code will be auto-generated as 0000000001, 0000000002, etc.</small>
                            )}
                        </div>

                        <div className="csp-field-group csp-required">
                            <label>Transporter Name *</label>
                            <input
                                type="text"
                                value={TransporterName}
                                onChange={e => handleInput('TransporterName', e.target.value)}
                                placeholder="Enter transporter name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActiveValue(isactive)}
                                    onChange={e => handleCheckbox('isactive', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Transporter is Active
                            </label>
                        </div>

                        <div className="csp-field-group">
                            <label>Contact Person</label>
                            <input
                                type="text"
                                value={contact}
                                onChange={e => handleInput('contact', e.target.value)}
                                placeholder="Contact person name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Office Code</label>
                            <div className="csp-field-display">
                                <Icons.Building size={16} />
                                <span>{currentOffcode}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Address */}
                <div className="csp-form-section">
                    <h4><Icons.MapPin size={18} /> Contact & Address</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={phone1}
                                onChange={e => handleInput('phone1', e.target.value)}
                                placeholder="Primary phone"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Mobile</label>
                            <input
                                type="text"
                                value={mobile}
                                onChange={e => handleNumericInput('mobile', e.target.value)}
                                placeholder="Mobile number"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => handleInput('email', e.target.value)}
                                placeholder="Email address"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Fax</label>
                            <input
                                type="text"
                                value={fax}
                                onChange={e => handleInput('fax', e.target.value)}
                                placeholder="Fax number"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Zip Code</label>
                            <input
                                type="text"
                                value={zipcode}
                                onChange={e => handleNumericInput('zipcode', e.target.value)}
                                placeholder="Postal code"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group csp-span-3">
                            <label>Address</label>
                            <input
                                type="text"
                                value={billaddress}
                                onChange={e => handleInput('billaddress', e.target.value)}
                                placeholder="Full address"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Country</label>
                            <select 
                                value={CountryID} 
                                onChange={e => handleInput('CountryID', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group">
                            <label>City</label>
                            <select 
                                value={CityID} 
                                onChange={e => handleInput('CityID', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select City</option>
                                {availableCities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="csp-form-section">
                    <h4><Icons.DollarSign size={18} /> Financial Settings</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group">
                            <label>Payment Method</label>
                            <select 
                                value={paymentmethod} 
                                onChange={e => handleInput('paymentmethod', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Payment Method</option>
                                {paymentMethods.map(pm => (
                                    <option key={pm.code} value={pm.code}>{pm.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group">
                            <label>Default Type</label>
                            <select 
                                value={defaultTypePerAmt} 
                                onChange={e => handleInput('defaultTypePerAmt', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Default Type</option>
                                {defaultTypeOptions.map(dt => (
                                    <option key={dt.code} value={dt.code}>{dt.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group">
                            <label>Default Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={defaultAmount}
                                onChange={e => handleNumericInput('defaultAmount', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group csp-span-2">
                            <label>GL Account Code</label>
                            <select
                                value={TransporterglCode}
                                onChange={e => handleInput('TransporterglCode', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select GL Account</option>
                                {transporterGLAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            {transporterControlAccount && (
                                <small className="csp-field-hint">
                                    Control Account: {transporterControlAccount}
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* Audit Information - Show for both modes but with different content */}
                <div className="csp-form-section csp-audit-section">
                    <h4><Icons.Clock size={18} /> Audit Information</h4>
                    <div className="csp-form-grid csp-grid-2">
                        <div className="csp-field-group">
                            <label>Created By</label>
                            <div className="csp-field-display">
                                <Icons.User size={16} />
                                <span>{createdby || (isNewMode ? 'Will be set on save' : 'N/A')}</span>
                            </div>
                        </div>
                        <div className="csp-field-group">
                            <label>Created Date</label>
                            <div className="csp-field-display">
                                <Icons.Calendar size={16} />
                                <span>{createdate ? formatDisplayDate(createdate) : (isNewMode ? 'Will be set on save' : 'Not set')}</span>
                            </div>
                        </div>
                        <div className="csp-field-group">
                            <label>Last Edited By</label>
                            <div className="csp-field-display">
                                <Icons.User size={16} />
                                <span>{editby || (isNewMode ? 'Not edited yet' : 'N/A')}</span>
                            </div>
                        </div>
                        <div className="csp-field-group">
                            <label>Last Edited Date</label>
                            <div className="csp-field-display">
                                <Icons.Calendar size={16} />
                                <span>{editdate ? formatDisplayDate(editdate) : (isNewMode ? 'Not edited yet' : 'Not set')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Transport Profile Main Component
---------------------------- */
const TransportProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        transporters, 
        lookupData,
        totalCount,
        totalPages,
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
        updatePageSize,
        fetchMaxTransporterCode  // Add this
    } = useTransporterDataService();

    const [selectedTransporter, setSelectedTransporter] = useState(null);
    const [formData, setFormData] = useState(() => getInitialTransporterData(currentOffcode, currentUser));
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
                    body: JSON.stringify({ screenName: 'Transporter Profile' })
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

    // Generate transporter code based on ALL records in database
    const generateTransporterCode = useCallback(async () => {
        return await fetchMaxTransporterCode();
    }, [fetchMaxTransporterCode]);

    // Initialize form for new transporter
    useEffect(() => {
        const initializeNewForm = async () => {
            if (currentMode === 'new' && !selectedTransporter) {
                const defaultCountryId = lookupData.countries[0]?.id || '1';
                const defaultCity = lookupData.cities.find(c => c.countryId === defaultCountryId);
                const defaultCityId = defaultCity?.id || '1';
                
                // Generate code based on ALL records
                const newCode = await generateTransporterCode();

                setFormData({
                    ...getInitialTransporterData(currentOffcode, currentUser),
                    TransporterCode: newCode,
                    CountryID: defaultCountryId,
                    CityID: defaultCityId,
                    TransporterglCode: lookupData.glAccounts[0]?.code || ''
                });
                
                setMessage(`Ready to create new transporter. Auto-generated code: ${newCode}`);
            }
        };

        initializeNewForm();
    }, [currentMode, currentOffcode, currentUser, lookupData, generateTransporterCode, selectedTransporter]);

    // Load selected transporter for editing
    useEffect(() => {
        if (selectedTransporter && currentMode === 'edit') {
            // Create a normalized version of the selected transporter
            const normalizedTransporter = {
                offcode: normalizeValue(selectedTransporter.offcode),
                TransporterCode: normalizeValue(selectedTransporter.TransporterCode),
                TransporterName: normalizeValue(selectedTransporter.TransporterName),
                isactive: normalizeValue(selectedTransporter.isactive),
                contact: normalizeValue(selectedTransporter.contact),
                billaddress: normalizeValue(selectedTransporter.billaddress),
                zipcode: normalizeValue(selectedTransporter.zipcode),
                CountryID: normalizeValue(selectedTransporter.CountryID),
                country: normalizeValue(selectedTransporter.country),
                CityID: normalizeValue(selectedTransporter.CityID),
                city: normalizeValue(selectedTransporter.city),
                phone1: normalizeValue(selectedTransporter.phone1),
                mobile: normalizeValue(selectedTransporter.mobile),
                fax: normalizeValue(selectedTransporter.fax),
                email: normalizeValue(selectedTransporter.email),
                paymentmethod: normalizeValue(selectedTransporter.paymentmethod),
                TransporterglCode: normalizeValue(selectedTransporter.TransporterglCode),
                defaultTypePerAmt: normalizeValue(selectedTransporter.defaultTypePerAmt),
                defaultAmount: normalizeValue(selectedTransporter.defaultAmount),
                createdby: normalizeValue(selectedTransporter.createdby),
                createdate: normalizeValue(selectedTransporter.createdate),
                editby: normalizeValue(selectedTransporter.editby),
                editdate: normalizeValue(selectedTransporter.editdate)
            };

            setFormData(normalizedTransporter);
        }
    }, [selectedTransporter, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectTransporter = (transporter) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view transporters');
            return;
        }
        setSelectedTransporter(transporter);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(transporter.TransporterName)}`);
    };

    const handleNewTransporter = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new transporters');
            return;
        }
        setSelectedTransporter(null);
        setCurrentMode('new');
        setMessage('Creating new transporter...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} transporters`);
            return;
        }

        if (!formData.TransporterName.trim()) {
            setMessage('❌ Transporter Name is required!');
            return;
        }

        if (!formData.TransporterCode.trim()) {
            setMessage('❌ Transporter Code is required!');
            return;
        }

        // Check for duplicate code in current page data
        const duplicateCode = transporters.find(t =>
            t.TransporterCode === formData.TransporterCode &&
            (currentMode === 'new' || t.TransporterCode !== selectedTransporter?.TransporterCode)
        );

        if (duplicateCode) {
            setMessage('❌ A transporter with this code already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        // Create payload
        const payload = {
            tableName: API_CONFIG.TABLES.TRANSPORTER,
            data: preparedData
        };

        // For update, add where clause
        if (currentMode === 'edit') {
            payload.where = {
                TransporterCode: formData.TransporterCode,
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
                setMessage('✅ Transporter saved successfully!');
                
                // Refresh all data
                await refetchAll();

                if (currentMode === 'new') {
                    // For new records, stay in edit mode with the new record selected
                    const newRecord = {
                        ...preparedData
                    };
                    
                    setSelectedTransporter(newRecord);
                    setCurrentMode('edit');
                    
                    // Update form data with the saved record
                    setFormData(newRecord);
                } else {
                    // Update the selected transporter with the latest data
                    setSelectedTransporter(preparedData);
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

    const handleDeleteTransporter = async (transporter) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete transporters');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the transporter "${transporter.TransporterName}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.TRANSPORTER,
                where: {
                    TransporterCode: transporter.TransporterCode,
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
                setMessage('✅ Transporter deleted successfully!');
                
                // Check if current page is now empty and we're not on page 1
                if (transporters.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetchAll();
                }

                if (selectedTransporter && selectedTransporter.TransporterCode === transporter.TransporterCode) {
                    handleNewTransporter();
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

    const TransportProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.Truck size={20} />
                        <h3>Transporters</h3>
                        <span className="csp-profile-count">{totalCount} transporters</span>
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
                            onClick={refetchAll}
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
                    {isDataLoading && transporters.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Transporters...</p>
                        </div>
                    ) : transporters.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {transporters.map(transporter => (
                                    <div
                                        key={`${transporter.TransporterCode}-${transporter.offcode}`}
                                        className={`csp-profile-item ${
                                            selectedTransporter?.TransporterCode === transporter.TransporterCode && currentMode === 'edit' ? 'csp-selected' : ''
                                        }`}
                                        onClick={() => handleSelectTransporter(transporter)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(transporter.TransporterCode)}</span>
                                                <span className="csp-profile-type-badge">
                                                    Transporter
                                                </span>
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(transporter.TransporterName) || 'Unnamed Transporter'}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(transporter.isactive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(transporter.isactive) ? 'Active' : 'Inactive'}
                                                </span>
                                                {normalizeValue(transporter.phone1) && (
                                                    <>
                                                        <span className="csp-meta-separator">•</span>
                                                        <span className="csp-meta-text">{normalizeValue(transporter.phone1)}</span>
                                                    </>
                                                )}
                                            </div>
                                            {normalizeValue(transporter.createdby) && (
                                                <div className="csp-profile-audit">
                                                    <small>Created: {normalizeValue(transporter.createdby)}</small>
                                                    {normalizeValue(transporter.editby) && (
                                                        <small> | Edited: {normalizeValue(transporter.editby)}</small>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTransporter(transporter);
                                                }}
                                                title="Delete transporter"
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
                            <Icons.Truck size={48} className="csp-empty-icon" />
                            <h4>No transporters found</h4>
                            {localSearchTerm ? (
                                <p>Try a different search term</p>
                            ) : (
                                <p>Create your first transporter to get started</p>
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
                    <Icons.Truck size={24} className="csp-header-icon" />
                    <div>
                        <h1>Transport Management</h1>
                        <span className="csp-header-subtitle">Manage transporter profiles</span>
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
                        <button className="csp-toolbar-btn" onClick={handleNewTransporter}>
                            <Icons.Plus size={16} />
                            <span>New Transporter</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="csp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedTransporter) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a transporter to edit'); 
                                }
                            }}
                        >
                            <Icons.Pencil size={16} />
                            <span>Edit</span>
                        </button>
                    )}
                </div>

                <div className="csp-toolbar-group">
                    <button className="csp-toolbar-btn" onClick={refetchAll}>
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
                <TransportProfileSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.Truck size={16} />
                            Transporter Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <TransportProfileForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewProfile={handleNewTransporter}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            hasPermission={hasPermission}
                            menuId={menuId}
                            lookupData={lookupData}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TransportProfile;