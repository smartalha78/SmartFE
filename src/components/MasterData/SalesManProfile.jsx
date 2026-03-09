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
    ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
    User: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    MapPin: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    CreditCard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
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
    SaleManNameAR: ''
});

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
        <section className="detail-panel">
            <div className="detail-header">
                <div className="header-content">
                    <h1>{isNewMode ? 'Create New Salesman' : `Salesman Details: ${SaleManName || 'Salesman'}`}</h1>
                    <div className="header-subtitle">
                        <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
                        <span className="muted">• {SaleManCode || 'No Code'}</span>
                        <span className="muted">• Office: {currentOffcode}</span>
                        {!(isactive === 'true') && <span className="inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="header-actions">
                    {canEdit && (
                        <>
                            <button
                                className="btn btn-outline"
                                onClick={onNewProfile}
                            >
                                <Icon.Plus /> New Salesman
                            </button>
                            <button
                                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !SaleManName || !SaleManCode}
                            >
                                {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
                                {isLoading ? 'Saving...' : 'Save Salesman'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-body">
                {/* General Information */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.User />
                            <h3>General Information</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group required">
                                <label>Salesman Code *</label>
                                <input
                                    type="text"
                                    value={SaleManCode}
                                    onChange={e => handleInput('SaleManCode', e.target.value)}
                                    disabled
                                    placeholder="Auto-generated"
                                    className="mono"
                                />
                                {isNewMode && (
                                    <div className="hint">Code will be auto-generated as 00001, 00002, etc.</div>
                                )}
                            </div>

                            <div className="form-group required">
                                <label>Salesman Name *</label>
                                <input
                                    type="text"
                                    value={SaleManName}
                                    onChange={e => handleInput('SaleManName', e.target.value)}
                                    placeholder="Enter salesman name"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Salesman Name (Arabic)</label>
                                <input
                                    type="text"
                                    value={SaleManNameAR}
                                    onChange={e => handleInput('SaleManNameAR', e.target.value)}
                                    placeholder="Arabic name"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Manager Code</label>
                                <select
                                    value={ManagerCode}
                                    onChange={e => handleInput('ManagerCode', e.target.value)}
                                    disabled={!canEdit}
                                >
                                    <option value="">Select Manager</option>
                                    {availableManagers.map(sm => (
                                        <option key={sm.code} value={sm.code}>
                                            {sm.code} - {sm.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Office Code</label>
                                <input type="text" value={currentOffcode} disabled />
                            </div>

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isactive === 'true'}
                                    onChange={e => handleCheckbox('isactive', e)}
                                    disabled={!canEdit}
                                />
                                <label htmlFor="isActive">Salesman is Active</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.MapPin />
                            <h3>Contact Information</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group">
                                <label>Contact Person</label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={e => handleInput('contact', e.target.value)}
                                    placeholder="Contact person name"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={phone1}
                                    onChange={e => handleInput('phone1', e.target.value)}
                                    placeholder="Primary phone"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Mobile</label>
                                <input
                                    type="text"
                                    value={mobile}
                                    onChange={e => handleInput('mobile', e.target.value)}
                                    placeholder="Mobile number"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => handleInput('email', e.target.value)}
                                    placeholder="Email address"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Country</label>
                                <select value={CountryID} onChange={e => handleInput('CountryID', e.target.value)} disabled={!canEdit}>
                                    <option value="">Select Country</option>
                                    {countries.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>City</label>
                                <select value={CityID} onChange={e => handleInput('CityID', e.target.value)} disabled={!canEdit}>
                                    <option value="">Select City</option>
                                    {availableCities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.DollarSign />
                            <h3>Financial Settings</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group">
                                <label>GL Account Code</label>
                                <select
                                    value={glCode}
                                    onChange={e => handleInput('glCode', e.target.value)}
                                    disabled={!canEdit}
                                >
                                    <option value="">Select GL Account</option>
                                    {salesmanGLAccounts.map(acc => (
                                        <option key={acc.code} value={acc.code}>
                                            {acc.code} - {acc.name}
                                        </option>
                                    ))}
                                </select>
                                {salesmanControlAccount && (
                                    <div className="field-info">
                                        Control Account: {salesmanControlAccount}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Payment Method</label>
                                <select value={paymentmethod} onChange={e => handleInput('paymentmethod', e.target.value)} disabled={!canEdit}>
                                    <option value="">Select Payment Method</option>
                                    {paymentMethods.map(pm => (
                                        <option key={pm.code} value={pm.code}>{pm.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Current Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={CurrentBalance}
                                    onChange={e => handleNumericInput('CurrentBalance', e.target.value)}
                                    placeholder="0.00"
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label>Alternative Code</label>
                                <input
                                    type="text"
                                    value={alternativeCode}
                                    onChange={e => handleInput('alternativeCode', e.target.value)}
                                    placeholder="Alternative code"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credit Settings */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.CreditCard />
                            <h3>Credit Settings</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="creditisactive"
                                    checked={creditisactive === 'true'}
                                    onChange={e => handleCheckbox('creditisactive', e)}
                                    disabled={!canEdit}
                                />
                                <label htmlFor="creditisactive">Credit Active</label>
                            </div>

                            <div className="form-group">
                                <label>Credit Limit 1</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={creditlimit1}
                                    onChange={e => handleNumericInput('creditlimit1', e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Credit Limit 2</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={creditlimit2}
                                    onChange={e => handleNumericInput('creditlimit2', e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Credit Limit 3</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={creditlimit3}
                                    onChange={e => handleNumericInput('creditlimit3', e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Credit Days</label>
                                <input
                                    type="number"
                                    value={creditdays}
                                    onChange={e => handleNumericInput('creditdays', e.target.value)}
                                    placeholder="0"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commission & Discount Settings */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.DollarSign />
                            <h3>Commission & Discount</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isDiscount"
                                    checked={isDiscount === 'true'}
                                    onChange={e => handleCheckbox('isDiscount', e)}
                                    disabled={!canEdit}
                                />
                                <label htmlFor="isDiscount">Discount Active</label>
                            </div>

                            <div className="form-group">
                                <label>Discount Percentage</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={discountper}
                                    onChange={e => handleNumericInput('discountper', e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Default Commission Type</label>
                                <select value={defaultTypePerAmt} onChange={e => handleInput('defaultTypePerAmt', e.target.value)} disabled={!canEdit}>
                                    <option value="">Select Commission Type</option>
                                    {defaultTypeOptions.map(dt => (
                                        <option key={dt.code} value={dt.code}>{dt.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Default Commission Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={defaultCommisionAmount}
                                    onChange={e => handleNumericInput('defaultCommisionAmount', e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
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

    // Generate salesman code starting from 00001
    const generateSalesmanCode = useCallback(() => {
        if (salesmen.length === 0) {
            return '00001';
        }

        // Get all existing codes and find the maximum
        const existingCodes = salesmen
            .map(s => parseInt(normalizeValue(s.SaleManCode)))
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
                glCode: lookupData.glAccounts[0]?.code || ''
            }));

            setMessage(`Ready to create new salesman. Auto-generated code: ${newCode}`);
        }
    }, [currentMode, currentOffcode, lookupData, generateSalesmanCode]);

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

        const payload = {
            tableName: API_CONFIG.TABLES.SALESMAN,
            data: {
                ...formData,
                SaleManCode: formData.SaleManCode,
                offcode: currentOffcode
            }
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

    // Sidebar Component
    const SalesmanProfileSidebar = () => {
        const filteredSalesmen = salesmen.filter(s =>
            normalizeValue(s.SaleManName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            normalizeValue(s.SaleManCode).includes(searchTerm)
        );

        return (
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-title">
                        <Icon.User className="big" />
                        <div>
                            <div className="h3">Salesman Profiles</div>
                            <div className="muted small">{salesmen.length} salesmen • Office: {currentOffcode}</div>
                        </div>
                    </div>
                    <div className="search-wrap">
                        <Icon.Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-icon"
                        onClick={refetch}
                        disabled={isDataLoading}
                        title="Refresh data"
                    >
                        <Icon.Refresh className={isDataLoading ? 'spin' : ''} />
                    </button>
                </div>

                <div className="sidebar-body">
                    {isDataLoading && salesmen.length === 0 ? (
                        <div className="loading-message">
                            <Icon.Loader className="spin" /> Loading Salesmen...
                        </div>
                    ) : filteredSalesmen.length > 0 ? (
                        <div className="profile-list">
                            {filteredSalesmen.map(salesman => (
                                <div
                                    key={`${salesman.SaleManCode}-${salesman.offcode}`}
                                    className={`profile-item ${selectedSalesman?.SaleManCode === salesman.SaleManCode && currentMode === 'edit' ? 'selected' : ''
                                        }`}
                                    onClick={() => handleSelectSalesman(salesman)}
                                >
                                    <div className="profile-main">
                                        <div className="code-name">
                                            <span className="code">{normalizeValue(salesman.SaleManCode)}</span>
                                            <span className="name">{normalizeValue(salesman.SaleManName)}</span>
                                        </div>
                                        <div className="profile-meta">
                                            {normalizeValue(salesman.isactive) === 'true' ? (
                                                <span className="status active">Active</span>
                                            ) : (
                                                <span className="status inactive">Inactive</span>
                                            )}
                                            {salesman.ManagerCode && (
                                                <span className="manager-badge">Manager: {salesman.ManagerCode}</span>
                                            )}
                                        </div>
                                    </div>
                                    {hasPermission && hasPermission(menuId, 'delete') && (
                                        <div className="profile-actions">
                                            <button
                                                className="btn btn-icon btn-danger btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSalesman(salesman);
                                                }}
                                                title="Delete salesman"
                                            >
                                                <Icon.Trash width="16" height="16" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Icon.User className="big-muted" />
                            <div className="muted">No salesmen found</div>
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
                    <Icon.User className="brand-icon" />
                    <div>
                        <h1>Salesman Management</h1>
                        <div className="muted">Manage salesman profiles</div>
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
                        <button className="toolbar-btn" onClick={handleNewSalesman}>
                            <Icon.Plus /> New Salesman
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="toolbar-btn" onClick={() => { 
                            if (selectedSalesman) { 
                                setCurrentMode('edit'); 
                            } else {
                                setMessage('Select a salesman to edit'); 
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
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="toast-close" onClick={() => setMessage('')}>×</button>
                </div>
            )}

            <div className="content-area">
                <SalesmanProfileSidebar />

                <div className="main-content">
                    <div className="content-tabs">
                        <button className="tab active">
                            <Icon.User /> Profile Details
                        </button>
                    </div>

                    <div className="content-panel">
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
                </div>
            </div>
        </div>
    );
};

export default SalesmanProfile;