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
 * Initial State (without audit fields)
---------------------------- */
const getInitialSalesmanData = (offcode = '1010') => ({
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
    SaleManNameAR: ''
});

// Prepare data for database insertion/update - WITHOUT audit fields
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    // Create a clean object with only the fields that exist in the database
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
        defaultCommisionAmount: data.defaultCommisionAmount || '0'
    };

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
const useDataService = () => {
    const { credentials } = useAuth();
    const [salesmenData, setSalesmenData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [lookupData, setLookupData] = useState({
        countries: [],
        cities: [],
        glAccounts: [],
        branchData: null,
        salesmen: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(7);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setSalesmenData([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching salesmen for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            // Build where clause for search if needed
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (SaleManCode LIKE '%${search}%' OR SaleManName LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.SALESMAN,
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
                setSalesmenData(data.rows || []);
                setTotalCount(data.totalCount || 0);
            } else {
                setSalesmenData([]);
                setTotalCount(0);
            }

            // Fetch lookup data separately (non-paginated)
            await fetchLookupData(currentOffcode);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setSalesmenData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    const fetchLookupData = useCallback(async (offcode) => {
        try {
            const [
                countryData,
                cityData,
                glAccountData,
                branchData,
                allSalesmenData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.COUNTRY, offcode),
                fetchTableData(API_CONFIG.TABLES.CITY, offcode),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, offcode),
                fetchTableData(API_CONFIG.TABLES.BRANCH, offcode),
                fetchTableData(API_CONFIG.TABLES.SALESMAN, offcode, false) // Get all salesmen for dropdown
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
                branchData: currentBranch,
                salesmen: allSalesmenData.map(s => ({
                    code: normalizeValue(s.SaleManCode),
                    name: normalizeValue(s.SaleManName)
                }))
            });

            // Calculate max code from all salesmen
            const codes = allSalesmenData
                .map(s => parseInt(normalizeValue(s.SaleManCode), 10))
                .filter(code => !isNaN(code) && code > 0);
            
            const max = codes.length > 0 ? Math.max(...codes) : 0;
            setMaxCode(max);

        } catch (err) {
            console.error('Error fetching lookup data:', err);
        }
    }, []);

    const fetchTableData = async (tableName, offcode, paginated = false) => {
        try {
            const whereClause = `offcode = '${offcode}'`;
            const payload = { 
                tableName,
                where: whereClause,
                usePagination: paginated
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
    };

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
        data: salesmenData,
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
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '1010';

    const {
        SaleManCode, SaleManName, SaleManNameAR, ManagerCode, glCode, isactive, contact,
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
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '1010';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        data: salesmen,
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
    } = useDataService();

    const [selectedSalesman, setSelectedSalesman] = useState(null);
    const [formData, setFormData] = useState(() => getInitialSalesmanData(currentOffcode));
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
                    body: JSON.stringify({ screenName: 'SalesMan Profile' })
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

    // Generate salesman code based on maxCode from all records
    const generateSalesmanCode = useCallback(() => {
        const nextCode = maxCode + 1;
        return nextCode.toString().padStart(5, '0');
    }, [maxCode]);

    // Initialize form data for new record
    useEffect(() => {
        if (currentMode === 'new' && !selectedSalesman) {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            const newCode = generateSalesmanCode();

            setFormData({
                ...getInitialSalesmanData(currentOffcode),
                SaleManCode: newCode,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                country: lookupData.countries.find(c => c.id === defaultCountryId)?.name || 'Pakistan',
                city: lookupData.cities.find(c => c.id === defaultCityId)?.name || 'LAHORE',
                glCode: lookupData.glAccounts[0]?.code || ''
            });
        }
    }, [currentMode, currentOffcode, lookupData, generateSalesmanCode, selectedSalesman]);

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

        // Prepare data for database - WITHOUT audit fields
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

        console.log('Sending payload:', payload);

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
            console.log('Save result:', result);

            if (result.success) {
                setMessage('✅ Salesman saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // For new records, stay in edit mode with the new record selected
                    const newRecord = {
                        ...preparedData,
                        SaleManName: preparedData.SaleManName
                    };
                    
                    setSelectedSalesman(newRecord);
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
                
                // Check if current page is now empty and we're not on page 1
                if (salesmen.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
                }

                if (selectedSalesman && selectedSalesman.SaleManCode === salesman.SaleManCode) {
                    handleNewSalesman();
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

    const SalesmanProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.User size={20} />
                        <h3>Salesmen</h3>
                        <span className="csp-profile-count">{totalCount} salesmen</span>
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
                    {isDataLoading && salesmen.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Salesmen...</p>
                        </div>
                    ) : salesmen.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {salesmen.map(salesman => (
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
                            <h4>No salesmen found</h4>
                            {localSearchTerm ? (
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