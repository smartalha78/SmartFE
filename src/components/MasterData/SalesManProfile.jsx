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
        SALESMAN: 'comSalesMan',
        COUNTRY: 'Country',
        CITY: 'cities',
        ACCOUNT: 'acChartOfAccount',
        BRANCH: 'comBranch'
    },
    PRIMARY_KEYS: {
        SALESMAN: ['SaleManCode', 'offcode']
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
const getInitialSalesmanData = (offcode = '0101') => ({
    offcode: offcode,
    SaleManCode: '',
    SaleManName: '',
    ManagerCode: '',
    glCode: '',
    isactive: 'true',
    contact: '',
    CountryID: '1',
    country: 'Pakistan',
    CityID: '1',
    city: 'LAHORE',
    phone1: '',
    mobile: '0',
    email: '',
    creditisactive: 'false',
    creditlimit1: '0.00',
    creditlimit2: '0.00',
    creditlimit3: '0.00',
    creditdays: '0',
    isDiscount: 'false',
    discountper: '0.00',
    paymentmethod: '0',
    CurrentBalance: '0.00',
    alternativeCode: '',
    defaultTypePerAmt: '01',
    defaultCommisionAmount: '0',
    SaleManNameAR: '',
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
        SaleManCode: data.SaleManCode || '',
        SaleManName: data.SaleManName || '',
        SaleManNameAR: data.SaleManNameAR || '',
        ManagerCode: data.ManagerCode || '',
        glCode: data.glCode || '',
        isactive: isActiveValue(data.isactive) ? 'True' : 'False',
        contact: data.contact || '',
        CountryID: data.CountryID || '1',
        country: data.country || 'Pakistan',
        CityID: data.CityID || '1',
        city: data.city || 'LAHORE',
        phone1: data.phone1 || '',
        mobile: data.mobile || '0',
        email: data.email || '',
        creditisactive: isActiveValue(data.creditisactive) ? 'True' : 'False',
        creditlimit1: data.creditlimit1 || '0.00',
        creditlimit2: data.creditlimit2 || '0.00',
        creditlimit3: data.creditlimit3 || '0.00',
        creditdays: data.creditdays || '0',
        isDiscount: isActiveValue(data.isDiscount) ? 'True' : 'False',
        discountper: data.discountper || '0.00',
        paymentmethod: data.paymentmethod || '0',
        CurrentBalance: data.CurrentBalance || '0.00',
        alternativeCode: data.alternativeCode || '',
        defaultTypePerAmt: data.defaultTypePerAmt || '01',
        defaultCommisionAmount: data.defaultCommisionAmount || '0',
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
 * Data Service
---------------------------- */
const useDataService = () => {
    const { credentials } = useAuth();
    const [data, setData] = useState([]);
    const [lookupData, setLookupData] = useState({
        countries: [],
        cities: [],
        glAccounts: [],
        branchData: null,
        salesmen: [] // For ManagerCode dropdown
    });
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

            const [
                salesmanData,
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.SALESMAN),
                fetchTableData(API_CONFIG.TABLES.COUNTRY),
                fetchTableData(API_CONFIG.TABLES.CITY),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT),
                fetchTableData(API_CONFIG.TABLES.BRANCH)
            ]);

            // Filter data by current offcode
            const filteredSalesmen = salesmanData.filter(s =>
                normalizeValue(s.offcode) === currentOffcode
            );

            const filteredGLAccounts = glAccountData
                .filter(acc => acc.code && acc.name && normalizeValue(acc.offcode) === currentOffcode)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                }));

            // Get branch data for control accounts
            const currentBranch = branchData.find(b =>
                normalizeValue(b.offcode) === currentOffcode
            );

            setData(filteredSalesmen);
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
                branchData: currentBranch,
                salesmen: filteredSalesmen.map(s => ({
                    code: normalizeValue(s.SaleManCode),
                    name: normalizeValue(s.SaleManName)
                }))
            });

        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { data, lookupData, isLoading, error, refetch: loadAllData, setError };
};

/* ---------------------------
 * Salesman Profile Form Component
---------------------------- */
const SalesmanProfileForm = ({
    formData,
    onFormChange,
    onSave,
    onNewProfile,
    currentMode,
    isLoading,
    lookupData,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.company?.offcode || '0101';

    const {
        offcode, SaleManCode, SaleManName, SaleManNameAR, ManagerCode, glCode, isactive, contact,
        CountryID, CityID, phone1, mobile, email,
        creditisactive, creditlimit1, creditlimit2, creditlimit3, creditdays,
        isDiscount, discountper, paymentmethod, CurrentBalance, alternativeCode,
        defaultTypePerAmt, defaultCommisionAmount
    } = formData;

    const { countries, cities, glAccounts, branchData, salesmen } = lookupData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const availableCities = cities.filter(c => c.countryId === CountryID);
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    // Payment Method Options
    const paymentMethods = [
        { code: '0', name: 'Not Specified' },
        { code: '1', name: 'Cash' },
        { code: '2', name: 'Credit' },
        { code: '3', name: 'Bank Transfer' }
    ];

    // Default Type Options
    const defaultTypeOptions = [
        { code: '01', name: 'Fixed Amount' },
        { code: '02', name: 'Percentage' }
    ];

    // Get salesman control account from branch data
    const salesmanControlAccount = branchData?.SalesmanControlAccount || '';

    // Filter GL accounts based on control account
    const salesmanGLAccounts = glAccounts.filter(acc =>
        acc.code.startsWith(salesmanControlAccount) || salesmanControlAccount === ''
    );

    // Filter managers (exclude current salesman if editing)
    const availableManagers = salesmen.filter(s =>
        currentMode !== 'edit' || s.code !== SaleManCode
    );

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Salesman' : `Salesman: ${SaleManName || 'Salesman'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{SaleManCode || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
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
                                New Salesman
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !SaleManName || !SaleManCode}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Salesman'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="csp-detail-content">
                {/* General Information */}
                <div className="csp-form-section">
                    <h4><Icons.User size={18} /> General Information</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-required">
                            <label>Salesman Code *</label>
                            <input
                                type="text"
                                value={SaleManCode}
                                onChange={e => handleInput('SaleManCode', e.target.value)}
                                disabled={true}
                                placeholder="Auto-generated"
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Code will be auto-generated as 00001, 00002, etc.</small>
                            )}
                        </div>

                        <div className="csp-field-group csp-required">
                            <label>Salesman Name *</label>
                            <input
                                type="text"
                                value={SaleManName}
                                onChange={e => handleInput('SaleManName', e.target.value)}
                                placeholder="Enter salesman name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Salesman Name (Arabic)</label>
                            <input
                                type="text"
                                value={SaleManNameAR}
                                onChange={e => handleInput('SaleManNameAR', e.target.value)}
                                placeholder="Arabic name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Manager Code</label>
                            <select
                                value={ManagerCode}
                                onChange={e => handleInput('ManagerCode', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Manager</option>
                                {availableManagers.map(sm => (
                                    <option key={sm.code} value={sm.code}>
                                        {sm.code} - {sm.name}
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
                                Salesman is Active
                            </label>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="csp-form-section">
                    <h4><Icons.MapPin size={18} /> Contact Information</h4>
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
                                value={glCode}
                                onChange={e => handleInput('glCode', e.target.value)}
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select GL Account</option>
                                {salesmanGLAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            {salesmanControlAccount && (
                                <small className="csp-field-hint">Control Account: {salesmanControlAccount}</small>
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
                            <label>Current Balance</label>
                            <input
                                type="number"
                                step="0.01"
                                value={CurrentBalance}
                                onChange={e => handleNumericInput('CurrentBalance', e.target.value)}
                                placeholder="0.00"
                                disabled={true}
                                className="csp-form-input csp-disabled-field"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Alternative Code</label>
                            <input
                                type="text"
                                value={alternativeCode}
                                onChange={e => handleInput('alternativeCode', e.target.value)}
                                placeholder="Alternative code"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Credit Settings */}
                <div className="csp-form-section">
                    <h4><Icons.CreditCard size={18} /> Credit Settings</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="creditisactive"
                                    checked={isActiveValue(creditisactive)}
                                    onChange={e => handleCheckbox('creditisactive', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Credit Active
                            </label>
                        </div>

                        <div className="csp-field-group">
                            <label>Credit Limit 1</label>
                            <input
                                type="number"
                                step="0.01"
                                value={creditlimit1}
                                onChange={e => handleNumericInput('creditlimit1', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Credit Limit 2</label>
                            <input
                                type="number"
                                step="0.01"
                                value={creditlimit2}
                                onChange={e => handleNumericInput('creditlimit2', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Credit Limit 3</label>
                            <input
                                type="number"
                                step="0.01"
                                value={creditlimit3}
                                onChange={e => handleNumericInput('creditlimit3', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>

                        <div className="csp-field-group">
                            <label>Credit Days</label>
                            <input
                                type="number"
                                value={creditdays}
                                onChange={e => handleNumericInput('creditdays', e.target.value)}
                                placeholder="0"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Commission & Discount Settings */}
                <div className="csp-form-section">
                    <h4><Icons.DollarSign size={18} /> Commission & Discount</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="isDiscount"
                                    checked={isActiveValue(isDiscount)}
                                    onChange={e => handleCheckbox('isDiscount', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Discount Active
                            </label>
                        </div>

                        <div className="csp-field-group">
                            <label>Discount Percentage</label>
                            <input
                                type="number"
                                step="0.01"
                                value={discountper}
                                onChange={e => handleNumericInput('discountper', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
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
                            <label>Default Commission Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={defaultCommisionAmount}
                                onChange={e => handleNumericInput('defaultCommisionAmount', e.target.value)}
                                placeholder="0.00"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Salesman Profile Main Component
---------------------------- */
const SalesmanProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { data: salesmen, lookupData, isLoading: isDataLoading, error, refetch, setError } = useDataService();

    const [selectedSalesman, setSelectedSalesman] = useState(null);
    const [formData, setFormData] = useState(() => getInitialSalesmanData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    const [paginatedSalesmen, setPaginatedSalesmen] = useState([]);

    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'SalesMan Profile' })
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

    // Filter and paginate salesmen
    useEffect(() => {
        const filtered = salesmen.filter(s =>
            normalizeValue(s.SaleManName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            normalizeValue(s.SaleManCode).includes(searchTerm)
        );
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedSalesmen(filtered.slice(startIndex, endIndex));
    }, [salesmen, currentPage, itemsPerPage, searchTerm]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Generate salesman code starting from 00001
    const generateSalesmanCode = useCallback(() => {
        if (salesmen.length === 0) {
            return '00001';
        }

        // Get all existing codes and find the maximum
        const existingCodes = salesmen
            .map(s => parseInt(normalizeValue(s.SaleManCode), 10))
            .filter(code => !isNaN(code) && code > 0);

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextCode = maxCode + 1;

        // Format as 5-digit string with leading zeros
        return nextCode.toString().padStart(5, '0');
    }, [salesmen]);

    // Initialize form data for new record
    useEffect(() => {
        if (currentMode === 'new') {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            const newCode = generateSalesmanCode();

            setFormData(prev => ({
                ...getInitialSalesmanData(currentOffcode),
                SaleManCode: newCode,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                country: lookupData.countries.find(c => c.id === defaultCountryId)?.name || 'Pakistan',
                city: lookupData.cities.find(c => c.id === defaultCityId)?.name || 'LAHORE',
                glCode: lookupData.glAccounts[0]?.code || '',
                createdby: currentUser,
                editby: currentUser
            }));
        }
    }, [currentMode, currentOffcode, currentUser, lookupData, generateSalesmanCode]);

    // Load selected salesman data into form
    useEffect(() => {
        if (selectedSalesman && currentMode === 'edit') {
            const normalizedSalesman = Object.keys(getInitialSalesmanData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedSalesman[key] || getInitialSalesmanData()[key]);
                return acc;
            }, {});

            setFormData(normalizedSalesman);
        }
    }, [selectedSalesman, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectSalesman = (salesman) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view salesmen');
            return;
        }
        setSelectedSalesman(salesman);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(salesman.SaleManName)}`);
    };

    const handleNewSalesman = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new salesmen');
            return;
        }
        setSelectedSalesman(null);
        setCurrentMode('new');
        setMessage('Creating new salesman...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} salesmen`);
            return;
        }

        if (!formData.SaleManName.trim()) {
            setMessage('❌ Salesman Name is required!');
            return;
        }

        if (!formData.SaleManCode.trim()) {
            setMessage('❌ Salesman Code is required!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.SALESMAN,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                SaleManCode: formData.SaleManCode,
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
                setMessage('✅ Salesman saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // Find the newly created record
                    const newRecord = salesmen.find(s =>
                        s.SaleManCode === formData.SaleManCode && s.offcode === currentOffcode
                    ) || formData;
                    setSelectedSalesman(newRecord);
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

    const handleDeleteSalesman = async (salesman) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete salesmen');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the salesman "${salesman.SaleManName}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.SALESMAN,
                where: {
                    SaleManCode: salesman.SaleManCode,
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
                setMessage('✅ Salesman deleted successfully!');
                await refetch();

                if (selectedSalesman && selectedSalesman.SaleManCode === salesman.SaleManCode) {
                    setSelectedSalesman(null);
                    setCurrentMode('new');
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

    const filteredCount = salesmen.filter(s =>
        normalizeValue(s.SaleManName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        normalizeValue(s.SaleManCode).includes(searchTerm)
    ).length;

    const SalesmanProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.User size={20} />
                        <h3>Salesmen</h3>
                        <span className="csp-profile-count">{filteredCount} salesmen</span>
                    </div>
                    <div className="csp-sidebar-actions">
                        <div className="csp-search-container">
                            <Icons.Search size={16} className="csp-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by code or name..."
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
                    {isDataLoading && salesmen.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Salesmen...</p>
                        </div>
                    ) : paginatedSalesmen.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {paginatedSalesmen.map(salesman => (
                                    <div
                                        key={`${salesman.SaleManCode}-${salesman.offcode}`}
                                        className={`csp-profile-item ${selectedSalesman?.SaleManCode === salesman.SaleManCode && currentMode === 'edit' ? 'csp-selected' : ''
                                            }`}
                                        onClick={() => handleSelectSalesman(salesman)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(salesman.SaleManCode)}</span>
                                                {salesman.ManagerCode && (
                                                    <span className="csp-profile-type-badge">
                                                        Mgr: {salesman.ManagerCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(salesman.SaleManName)}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(salesman.isactive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(salesman.isactive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSalesman(salesman);
                                                }}
                                                title="Delete salesman"
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
                            <Icons.User size={48} className="csp-empty-icon" />
                            <h4>No salesmen found</h4>
                            {searchTerm ? (
                                <p>Try a different search term</p>
                            ) : (
                                <p>Create your first salesman to get started</p>
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
                    <Icons.User size={24} className="csp-header-icon" />
                    <div>
                        <h1>Salesman Management</h1>
                        <span className="csp-header-subtitle">Manage salesman profiles</span>
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
                        <button className="csp-toolbar-btn" onClick={handleNewSalesman}>
                            <Icons.Plus size={16} />
                            <span>New Salesman</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="csp-toolbar-btn" onClick={() => { 
                            if (selectedSalesman) { 
                                setCurrentMode('edit'); 
                            } else {
                                setMessage('Select a salesman to edit'); 
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
                <SalesmanProfileSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.User size={16} />
                            Profile Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <SalesmanProfileForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewProfile={handleNewSalesman}
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

export default SalesmanProfile;