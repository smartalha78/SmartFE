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
        LABOUR: 'comLabour',
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
 * Initial State (with audit fields)
---------------------------- */
const getInitialLabourData = (offcode = '', currentUser = 'SYSTEM') => ({
    offcode: offcode,
    LabourCode: '',
    LabourName: '',
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
    paymentmethod: '2',
    LabourglCode: '',
    defaultTypePerAmt: '01',
    defaultAmount: '0',
    LabourType: '01',
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
        LabourCode: data.LabourCode || '',
        LabourName: data.LabourName || '',
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
        paymentmethod: data.paymentmethod || '2',
        LabourglCode: data.LabourglCode || '',
        defaultTypePerAmt: data.defaultTypePerAmt || '01',
        defaultAmount: data.defaultAmount || '0',
        LabourType: data.LabourType || '01'
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

    console.log('Prepared data for DB:', preparedData);

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useLabourDataService = () => {
    const { credentials } = useAuth();
    const [labourData, setLabourData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [lookupData, setLookupData] = useState({
        countries: [],
        cities: [],
        glAccounts: [],
        branchData: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(7);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    // Generic function to fetch table data with offcode filtering
    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                const offcodeColumn = tableName === API_CONFIG.TABLES.COUNTRY ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.CITY ? 'offcode' :
                                     tableName === API_CONFIG.TABLES.ACCOUNT ? 'offcode' :
                                     tableName === API_CONFIG.TABLES.BRANCH ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.LABOUR ? 'offcode' : 'offcode';
                
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

    // Function to fetch maximum labour code
    const fetchMaxLabourCode = useCallback(async (offcode) => {
        try {
            const allLabourData = await fetchTableData(API_CONFIG.TABLES.LABOUR, offcode);
            const codes = allLabourData
                .map(l => parseInt(normalizeValue(l.LabourCode), 10))
                .filter(code => !isNaN(code) && code > 0);
            
            return codes.length > 0 ? Math.max(...codes) : 0;
        } catch (err) {
            console.error('Error fetching max labour code:', err);
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
                setLabourData([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching labour for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (LabourCode LIKE '%${search}%' OR LabourName LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.LABOUR,
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
                setLabourData(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                // Fetch max code after getting data
                const max = await fetchMaxLabourCode(currentOffcode);
                setMaxCode(max);
                
                // Fetch lookup data
                await fetchLookupData(currentOffcode);
            } else {
                setLabourData([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setLabourData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, fetchTableData, fetchMaxLabourCode]);

    const fetchLookupData = useCallback(async (offcode) => {
        try {
            const [
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.COUNTRY, offcode),
                fetchTableData(API_CONFIG.TABLES.CITY, offcode),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, offcode),
                fetchTableData(API_CONFIG.TABLES.BRANCH, offcode)
            ]);

            const filteredGLAccounts = glAccountData
                .filter(acc => acc.code && acc.name)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                }));

            const currentBranch = branchData.find(b =>
                normalizeValue(b.offcode) === offcode
            );

            setLookupData({
                countries: countryData.map(c => ({
                    id: normalizeValue(c.CountryID),
                    name: normalizeValue(c.CountryName)
                })),
                cities: cityData.map(c => ({
                    id: normalizeValue(c.CityID),
                    name: normalizeValue(c.CityName),
                    countryId: normalizeValue(c.CountryID)
                })),
                glAccounts: filteredGLAccounts,
                branchData: currentBranch
            });

        } catch (err) {
            console.error('Error fetching lookup data:', err);
        }
    }, [fetchTableData]);

    // Load data whenever pagination or search changes
    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

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

    const totalPages = Math.ceil(totalCount / pageSize);

    return { 
        labourData,
        totalCount,
        totalPages,
        lookupData,
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
 * Labour Profile Form Component (with Audit Section)
---------------------------- */
const LabourProfileForm = ({
    formData,
    onFormChange,
    onSave,
    onNewLabour,
    currentMode,
    isLoading,
    lookupData,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';

    const {
        LabourCode, LabourName, isactive, contact, billaddress, zipcode,
        CountryID, CityID, phone1, mobile, fax, email, paymentmethod,
        LabourglCode, defaultTypePerAmt, defaultAmount, LabourType,
        createdby, createdate, editby, editdate
    } = formData;

    const { countries, cities, glAccounts, branchData } = lookupData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const availableCities = cities.filter(c => c.countryId === CountryID);
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

    const paymentMethods = [
        { code: '1', name: 'Cash' },
        { code: '2', name: 'Credit' },
        { code: '3', name: 'Bank Transfer' }
    ];

    const defaultTypeOptions = [
        { code: '01', name: 'Fixed Amount' },
        { code: '02', name: 'Percentage' }
    ];

    const labourTypeOptions = [
        { code: '01', name: 'Regular Labour' },
        { code: '02', name: 'Contract Labour' }
    ];

    const labourControlAccount = branchData?.LabourControlAccount || '';
    const labourGLAccounts = glAccounts.filter(acc =>
        acc.code.startsWith(labourControlAccount) || labourControlAccount === ''
    );

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Labour' : `Labour: ${LabourName || 'Labour'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{LabourCode || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
                        <span className="csp-office-badge">Office: {currentOffcode}</span>
                        {!isActiveValue(isactive) && <span className="csp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="csp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="csp-btn csp-btn-outline"
                                onClick={onNewLabour}
                            >
                                <Icons.Plus size={16} />
                                New Labour
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !LabourName || !LabourCode}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Labour'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="csp-detail-content">
                {/* Basic Information */}
                <div className="csp-form-section">
                    <h4><Icons.User size={18} /> Basic Information</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-required">
                            <label>Labour Code *</label>
                            <input
                                type="text"
                                value={LabourCode}
                                onChange={e => handleInput('LabourCode', e.target.value)}
                                disabled={true}
                                placeholder="Auto-generated"
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Code will be auto-generated as 0000000001, 0000000002, etc.</small>
                            )}
                        </div>

                        <div className="csp-field-group csp-required">
                            <label>Labour Name *</label>
                            <input
                                type="text"
                                value={LabourName}
                                onChange={e => handleInput('LabourName', e.target.value)}
                                placeholder="Enter labour name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Labour Type</label>
                            <select
                                value={LabourType}
                                onChange={e => handleInput('LabourType', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                {labourTypeOptions.map(type => (
                                    <option key={type.code} value={type.code}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group">
                            <label>Office Code</label>
                            <div className="csp-field-display">
                                <Icons.Building2 size={16} />
                                <span>{currentOffcode}</span>
                            </div>
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
                                Labour is Active
                            </label>
                        </div>
                    </div>
                </div>

                {/* Contact & Address */}
                <div className="csp-form-section">
                    <h4><Icons.MapPin size={18} /> Contact & Address</h4>
                    <div className="csp-form-grid csp-grid-3">
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
                                onChange={e => handleInput('mobile', e.target.value)}
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
                                onChange={e => handleInput('zipcode', e.target.value)}
                                placeholder="Postal code"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group full-width">
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
                            <label>GL Account Code</label>
                            <select
                                value={LabourglCode}
                                onChange={e => handleInput('LabourglCode', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select GL Account</option>
                                {labourGLAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            {labourControlAccount && (
                                <small className="csp-field-hint">Control Account: {labourControlAccount}</small>
                            )}
                        </div>

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
                            <label>Default Commission Type</label>
                            <select 
                                value={defaultTypePerAmt} 
                                onChange={e => handleInput('defaultTypePerAmt', e.target.value)} 
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Commission Type</option>
                                {defaultTypeOptions.map(dt => (
                                    <option key={dt.code} value={dt.code}>{dt.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="csp-field-group">
                            <label>Default Amount/Percentage</label>
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
                    </div>
                </div>

                {/* Audit Information */}
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
 * Labour Profile Main Component
---------------------------- */
const LabourProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        labourData,
        totalCount,
        totalPages,
        lookupData,
        isLoading: isDataLoading, 
        error, 
        refetch, 
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        maxCode
    } = useLabourDataService();

    const [selectedLabour, setSelectedLabour] = useState(null);
    const [formData, setFormData] = useState(() => getInitialLabourData(currentOffcode, currentUser));
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
                    body: JSON.stringify({ screenName: 'Labour Profile' })
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

    // Generate labour code based on maxCode from all records
    const generateLabourCode = useCallback(() => {
        const nextCode = maxCode + 1;
        return nextCode.toString().padStart(10, '0');
    }, [maxCode]);

    // Initialize form data for new record
    useEffect(() => {
        if (currentMode === 'new' && !selectedLabour) {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            const newCode = generateLabourCode();

            setFormData({
                ...getInitialLabourData(currentOffcode, currentUser),
                LabourCode: newCode,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                LabourglCode: lookupData.glAccounts[0]?.code || ''
            });
            
            setMessage(`Ready to create new labour. Auto-generated code: ${newCode}`);
        }
    }, [currentMode, currentOffcode, currentUser, lookupData, generateLabourCode, selectedLabour]);

    // Load selected labour data into form
    useEffect(() => {
        if (selectedLabour && currentMode === 'edit') {
            const normalizedLabour = {
                offcode: normalizeValue(selectedLabour.offcode),
                LabourCode: normalizeValue(selectedLabour.LabourCode),
                LabourName: normalizeValue(selectedLabour.LabourName),
                isactive: normalizeValue(selectedLabour.isactive),
                contact: normalizeValue(selectedLabour.contact),
                billaddress: normalizeValue(selectedLabour.billaddress),
                zipcode: normalizeValue(selectedLabour.zipcode),
                CountryID: normalizeValue(selectedLabour.CountryID),
                country: normalizeValue(selectedLabour.country),
                CityID: normalizeValue(selectedLabour.CityID),
                city: normalizeValue(selectedLabour.city),
                phone1: normalizeValue(selectedLabour.phone1),
                mobile: normalizeValue(selectedLabour.mobile),
                fax: normalizeValue(selectedLabour.fax),
                email: normalizeValue(selectedLabour.email),
                paymentmethod: normalizeValue(selectedLabour.paymentmethod),
                LabourglCode: normalizeValue(selectedLabour.LabourglCode),
                defaultTypePerAmt: normalizeValue(selectedLabour.defaultTypePerAmt),
                defaultAmount: normalizeValue(selectedLabour.defaultAmount),
                LabourType: normalizeValue(selectedLabour.LabourType),
                createdby: normalizeValue(selectedLabour.createdby),
                createdate: normalizeValue(selectedLabour.createdate),
                editby: normalizeValue(selectedLabour.editby),
                editdate: normalizeValue(selectedLabour.editdate)
            };

            setFormData(normalizedLabour);
        }
    }, [selectedLabour, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectLabour = (labour) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view labour');
            return;
        }
        setSelectedLabour(labour);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(labour.LabourName)}`);
    };

    const handleNewLabour = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new labour');
            return;
        }
        setSelectedLabour(null);
        setCurrentMode('new');
        setMessage('Creating new labour...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} labour`);
            return;
        }

        if (!formData.LabourName.trim()) {
            setMessage('❌ Labour Name is required!');
            return;
        }

        if (!formData.LabourCode.trim()) {
            setMessage('❌ Labour Code is required!');
            return;
        }

        // Check for duplicate code
        const duplicateCode = labourData.find(l =>
            l.LabourCode === formData.LabourCode &&
            (currentMode === 'new' || l.LabourCode !== selectedLabour?.LabourCode)
        );

        if (duplicateCode) {
            setMessage('❌ A labour with this code already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database with audit fields
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.LABOUR,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                LabourCode: formData.LabourCode,
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
                const errorText = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Labour saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    const newRecord = {
                        ...preparedData
                    };
                    
                    setSelectedLabour(newRecord);
                    setCurrentMode('edit');
                    setFormData(newRecord);
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

    const handleDeleteLabour = async (labour) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete labour');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the labour "${labour.LabourName}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.LABOUR,
                where: {
                    LabourCode: labour.LabourCode,
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
                setMessage('✅ Labour deleted successfully!');
                
                if (labourData.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
                }

                if (selectedLabour && selectedLabour.LabourCode === labour.LabourCode) {
                    handleNewLabour();
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

    const LabourProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.User size={20} />
                        <h3>Labour</h3>
                        <span className="csp-profile-count">{totalCount} labour</span>
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
                    {isDataLoading && labourData.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Labour...</p>
                        </div>
                    ) : labourData.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {labourData.map(labour => (
                                    <div
                                        key={labour.LabourCode}
                                        className={`csp-profile-item ${selectedLabour?.LabourCode === labour.LabourCode && currentMode === 'edit' ? 'csp-selected' : ''
                                            }`}
                                        onClick={() => handleSelectLabour(labour)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(labour.LabourCode)}</span>
                                                <span className="csp-profile-type-badge">
                                                    {labour.LabourType === '01' ? 'Regular' : 'Contract'}
                                                </span>
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(labour.LabourName)}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(labour.isactive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(labour.isactive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            {normalizeValue(labour.createdby) && (
                                                <div className="csp-profile-audit">
                                                    <small>Created: {normalizeValue(labour.createdby)}</small>
                                                    {normalizeValue(labour.editby) && (
                                                        <small> | Edited: {normalizeValue(labour.editby)}</small>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLabour(labour);
                                                }}
                                                title="Delete labour"
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
                            <Icons.User size={48} className="csp-empty-icon" />
                            <h4>No labour found</h4>
                            {localSearchTerm ? (
                                <p>Try a different search term</p>
                            ) : (
                                <p>Create your first labour to get started</p>
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
                    <Icons.User size={24} className="csp-header-icon" />
                    <div>
                        <h1>Labour Management</h1>
                        <span className="csp-header-subtitle">Manage labour profiles</span>
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
                        <button className="csp-toolbar-btn" onClick={handleNewLabour}>
                            <Icons.Plus size={16} />
                            <span>New Labour</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="csp-toolbar-btn" onClick={() => { 
                            if (selectedLabour) { 
                                setCurrentMode('edit'); 
                            } else {
                                setMessage('Select a labour to edit'); 
                            }
                        }}>
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
                <LabourProfileSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.User size={16} />
                            Profile Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <LabourProfileForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewLabour={handleNewLabour}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            lookupData={lookupData}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LabourProfile;