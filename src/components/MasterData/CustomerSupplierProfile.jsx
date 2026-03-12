import React, { useState, useEffect, useCallback, useContext } from 'react';
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
        CUSTOMER_SUPPLIER: 'comcustomer',
        SALESMAN: 'comSalesman',
        COUNTRY: 'Country',
        CITY: 'cities',
        ACCOUNT: 'acChartOfAccount',
        BRANCH: 'comBranch'
    },
    PRIMARY_KEYS: {
        CUSTOMER_SUPPLIER: ['CustomerCode', 'offcode']
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

// ✅ Helper function to check if a value represents "active"
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

// Prepare data for database insertion/update
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    const now = new Date();
    const formattedNow = formatDateForDB(now);
    
    // Base data with all required fields
    const preparedData = {
        offcode: currentOffcode,
        CustomerCode: data.CustomerCode || '',
        CustomerName: data.CustomerName || '',
        CustomerNameAR: data.CustomerNameAR || '',
        SHD: data.SHD || '',
        isactive: isActiveValue(data.isactive) ? 'True' : 'False',
        billaddress: data.billaddress || '',
        billaddressAR: data.billaddressAR || '',
        zipcode: data.zipcode || '',
        CountryID: data.CountryID || '1',
        country: data.country || 'Pakistan',
        CityID: data.CityID || '1',
        city: data.city || 'LAHORE',
        phone1: data.phone1 || '',
        mobile: data.mobile || '0',
        fax: data.fax || '',
        email: data.email || '',
        type: data.type || '1',
        IsSalesTax: data.IsSalesTax === 'true' ? 'True' : 'False',
        SalesTaxNo: data.SalesTaxNo || '----',
        SalesTaxNoAR: data.SalesTaxNoAR || '',
        isCustomer: data.isCustomer === 'true' ? 'True' : 'False',
        Customercreditisactive: data.Customercreditisactive === 'true' ? 'True' : 'False',
        Customercreditdays: data.Customercreditdays || '0',
        CustomerisDiscount: data.CustomerisDiscount === 'true' ? 'True' : 'False',
        Customerdiscountper: data.Customerdiscountper || '0.00',
        CustomerglCode: data.CustomerglCode || '',
        CustomerCreditLimit: data.CustomerCreditLimit || '0.00',
        isSupplier: data.isSupplier === 'true' ? 'True' : 'False',
        Supplierrcreditisactive: data.Supplierrcreditisactive === 'true' ? 'True' : 'False',
        Suppliercreditdays: data.Suppliercreditdays || '0',
        SupplierisDiscount: data.SupplierisDiscount === 'true' ? 'True' : 'False',
        Supplierdiscountper: data.Supplierdiscountper || '0.00',
        SupplierglCode: data.SupplierglCode || '',
        SupplierCreditLimit: data.SupplierCreditLimit || '0.00',
        SaleManCode: data.SaleManCode || '',
        isNTN: data.isNTN === 'true' ? 'True' : 'False',
        NTN: data.NTN || '-',
        CNIC: data.CNIC || '0',
        ST1: data.ST1 || '',
        ST2: data.ST2 || '',
        ST3: data.ST3 || '',
        ST4: data.ST4 || '',
        ST5: data.ST5 || '',
        CustomeralternativeCode: data.CustomeralternativeCode || '',
        SupplieralternativeCode: data.SupplieralternativeCode || '',
        PartyVendorCode: data.PartyVendorCode || '',
        PartyCustomerCode: data.PartyCustomerCode || '',
        PackageId: data.PackageId || '1',
        PerMonthFee: data.PerMonthFee || '700',
        PackageDate: data.PackageDate ? formatDateForDB(data.PackageDate) : formatDateForDB(now),
        SectorCode: data.SectorCode || '000001',
        isAcCreate: data.isAcCreate === 'true' ? 'True' : 'False',
        PackageTotalAmount: data.PackageTotalAmount || '0',
        PackageDownAmount: data.PackageDownAmount || '0',
        PackageBalanceAmount: data.PackageBalanceAmount || '0',
        PackageNoofInstallment: data.PackageNoofInstallment || '0',
        ProductDetail: data.ProductDetail || '',
        ProductDetailAR: data.ProductDetailAR || '',
        State: data.State || '',
        isTaxableInvoice: data.isTaxableInvoice === 'true' ? 'True' : 'False',
        RateType: data.RateType || '1',
        buytypeId: data.buytypeId || 'TIN',
        buystreetname: data.buystreetname || '',
        buybuildingname: data.buybuildingname || '',
        buybuildno: data.buybuildno || '0',
        buyplotid: data.buyplotid || '',
        buyadbuildno: data.buyadbuildno || '',
        buypostalzone: data.buypostalzone || '0',
        buysubcitysubname: data.buysubcitysubname || '',
        buycountrySubentity: data.buycountrySubentity || '',
        buyContractAmount: data.buyContractAmount || '0.00',
        sellersidtype: data.sellersidtype || 'CRN',
        sellersid: data.sellersid || '',
        scenarioId: data.scenarioId || 'SN001',
        CustomerSupplierType: data.CustomerSupplierType || 'CUSTOMER/SUPPLIER',
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
 * Initial State
---------------------------- */
const getInitialCustomerData = (offcode = '1010') => ({
    offcode: offcode,
    CustomerCode: '',
    CustomerName: '',
    CustomerNameAR: '',
    SHD: '',
    isactive: 'true',
    billaddress: '',
    billaddressAR: '',
    zipcode: '',
    CountryID: '1',
    country: 'Pakistan',
    CityID: '1',
    city: 'LAHORE',
    phone1: '',
    mobile: '0',
    fax: '',
    email: '',
    type: '1',
    IsSalesTax: 'false',
    SalesTaxNo: '----',
    SalesTaxNoAR: '',
    isCustomer: 'true',
    Customercreditisactive: 'false',
    Customercreditdays: '0',
    CustomerisDiscount: 'false',
    Customerdiscountper: '0.00',
    CustomerglCode: '',
    CustomerCreditLimit: '0.00',
    isSupplier: 'false',
    Supplierrcreditisactive: 'false',
    Suppliercreditdays: '0',
    SupplierisDiscount: 'false',
    Supplierdiscountper: '0.00',
    SupplierglCode: '',
    SupplierCreditLimit: '0.00',
    SaleManCode: '',
    isNTN: 'false',
    NTN: '-',
    CNIC: '0',
    ST1: '',
    ST2: '',
    ST3: '',
    ST4: '',
    ST5: '',
    CustomeralternativeCode: '',
    SupplieralternativeCode: '',
    PartyVendorCode: '',
    PartyCustomerCode: '',
    PackageId: '1',
    PerMonthFee: '700',
    PackageDate: new Date().toISOString().split('T')[0],
    SectorCode: '000001',
    isAcCreate: 'false',
    PackageTotalAmount: '0',
    PackageDownAmount: '0',
    PackageBalanceAmount: '0',
    PackageNoofInstallment: '0',
    ProductDetail: '',
    ProductDetailAR: '',
    State: '',
    isTaxableInvoice: 'true',
    RateType: '1',
    buytypeId: 'TIN',
    buystreetname: '',
    buybuildingname: '',
    buybuildno: '0',
    buyplotid: '',
    buyadbuildno: '',
    buypostalzone: '0',
    buysubcitysubname: '',
    buycountrySubentity: '',
    buyContractAmount: '0.00',
    sellersidtype: 'CRN',
    sellersid: '',
    scenarioId: 'SN001',
    CustomerSupplierType: 'CUSTOMER/SUPPLIER',
    createdby: '',
    createdate: new Date().toISOString().split('T')[0],
    editby: '',
    editdate: new Date().toISOString().split('T')[0]
});

/* ---------------------------
 * Data Service
---------------------------- */
const useDataService = () => {
    const { credentials } = useAuth();
    const [data, setData] = useState([]);
    const [lookupData, setLookupData] = useState({
        saleMen: [],
        countries: [],
        cities: [],
        glAccounts: [],
        branchData: null
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
            const currentOffcode = credentials?.company?.offcode || credentials?.offcode || '0101';

            const [
                customerData,
                salesManData,
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.CUSTOMER_SUPPLIER),
                fetchTableData(API_CONFIG.TABLES.SALESMAN).catch(() => []), // Handle error gracefully
                fetchTableData(API_CONFIG.TABLES.COUNTRY),
                fetchTableData(API_CONFIG.TABLES.CITY),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT),
                fetchTableData(API_CONFIG.TABLES.BRANCH)
            ]);

            const filteredCustomers = customerData.filter(c =>
                normalizeValue(c.offcode) === currentOffcode
            );

            const filteredSalesMen = Array.isArray(salesManData) ? salesManData
                .filter(s => normalizeValue(s.offcode) === currentOffcode)
                .map(s => ({
                    code: normalizeValue(s.code),
                    name: normalizeValue(s.name)
                })) : [];

            const filteredGLAccounts = Array.isArray(glAccountData) ? glAccountData
                .filter(acc => acc.code && acc.name && normalizeValue(acc.offcode) === currentOffcode)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                })) : [];

            const currentBranch = Array.isArray(branchData) ? branchData.find(b =>
                normalizeValue(b.offcode) === currentOffcode
            ) : null;

            setData(filteredCustomers);
            setLookupData({
                saleMen: filteredSalesMen,
                countries: Array.isArray(countryData) ? countryData.map(c => ({
                    id: normalizeValue(c.CountryID),
                    name: normalizeValue(c.CountryName)
                })) : [],
                cities: Array.isArray(cityData) ? cityData.map(c => ({
                    id: normalizeValue(c.CityID),
                    name: normalizeValue(c.CityName),
                    countryId: normalizeValue(c.CountryID)
                })) : [],
                glAccounts: filteredGLAccounts,
                branchData: currentBranch
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
 * Customer/Supplier Profile Form Component
---------------------------- */
const CustomerSupplierProfileForm = ({
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
    const currentOffcode = credentials?.company?.offcode || credentials?.offcode || '0101';

    const {
        offcode, CustomerCode, CustomerName, CustomerNameAR, SHD, isactive,
        billaddress, billaddressAR, zipcode, CountryID, CityID, phone1, mobile, fax,
        email, type, IsSalesTax, SalesTaxNo, SalesTaxNoAR, isCustomer,
        Customercreditisactive, Customercreditdays, CustomerisDiscount, Customerdiscountper,
        CustomerglCode, CustomerCreditLimit, isSupplier, Supplierrcreditisactive,
        Suppliercreditdays, SupplierisDiscount, Supplierdiscountper, SupplierglCode,
        SupplierCreditLimit, SaleManCode, isNTN, NTN, CNIC, CustomerSupplierType
    } = formData;

    const { saleMen, countries, cities, glAccounts, branchData } = lookupData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const availableCities = cities.filter(c => c.countryId === CountryID);
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    const customerControlAccount = branchData?.CustomerControlAccount || '';
    const supplierControlAccount = branchData?.SupplierControlAccount || '';

    const customerGLAccounts = glAccounts.filter(acc =>
        acc.code.startsWith(customerControlAccount) || customerControlAccount === ''
    );

    const supplierGLAccounts = glAccounts.filter(acc =>
        acc.code.startsWith(supplierControlAccount) || supplierControlAccount === ''
    );

    return (
        <div className="csp-detail-panel">
            <div className="csp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Profile' : `Profile: ${CustomerName || 'Profile'}`}</h2>
                    <div className="csp-detail-meta">
                        <span className={`csp-mode-badge ${isNewMode ? 'csp-new' : 'csp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="csp-code-badge">{CustomerCode || (isNewMode ? 'Generating...' : 'No Code')}</span>
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
                                New Profile
                            </button>
                            <button
                                className={`csp-btn csp-btn-primary ${isLoading ? 'csp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !CustomerName || !CustomerCode}
                            >
                                {isLoading ? <Icons.Loader size={16} className="csp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Profile'}
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
                            <label>Customer Code *</label>
                            <input
                                type="text"
                                value={CustomerCode}
                                onChange={e => handleInput('CustomerCode', e.target.value)}
                                disabled={true} // Always disabled - auto-generated
                                placeholder="Auto-generated"
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Code is auto-generated and cannot be edited</small>
                            )}
                        </div>
                        <div className="csp-field-group csp-required">
                            <label>Name (English) *</label>
                            <input
                                type="text"
                                value={CustomerName}
                                onChange={e => handleInput('CustomerName', e.target.value)}
                                placeholder="Enter customer name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>Short Hand (SHD)</label>
                            <input
                                type="text"
                                value={SHD}
                                onChange={e => handleInput('SHD', e.target.value)}
                                placeholder="Short code"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>Name (Arabic)</label>
                            <input
                                type="text"
                                value={CustomerNameAR}
                                onChange={e => handleInput('CustomerNameAR', e.target.value)}
                                placeholder="Arabic name"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>Office Code</label>
                            <div className="csp-field-display">
                                <Icons.Building2 size={16} />
                                <span>{currentOffcode}</span>
                            </div>
                        </div>
                        <div className="csp-field-group">
                            <label>Profile Type</label>
                            <select 
                                value={CustomerSupplierType} 
                                onChange={e => handleInput('CustomerSupplierType', e.target.value)} 
                                disabled={!canEdit}
                                className="csp-form-select"
                            >
                                <option value="CUSTOMER">CUSTOMER</option>
                                <option value="SUPPLIER">SUPPLIER</option>
                                <option value="CUSTOMER/SUPPLIER">CUSTOMER/SUPPLIER</option>
                            </select>
                        </div>
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={isActiveValue(isactive)}
                                    onChange={e => handleCheckbox('isactive', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Profile is Active
                            </label>
                        </div>
                    </div>
                </div>

                {/* Contact & Address */}
                <div className="csp-form-section">
                    <h4><Icons.MapPin size={18} /> Contact & Address</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group">
                            <label>Phone 1</label>
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
                        <div className="csp-field-group">
                            <label>State</label>
                            <input
                                type="text"
                                value={formData.State}
                                onChange={e => handleInput('State', e.target.value)}
                                placeholder="State/Province"
                                disabled={!canEdit}
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group csp-full-width">
                            <label>Billing Address (English)</label>
                            <input
                                type="text"
                                value={billaddress}
                                onChange={e => handleInput('billaddress', e.target.value)}
                                placeholder="Full billing address"
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

                {/* Customer Settings */}
                <div className="csp-form-section">
                    <h4><Icons.UserCircle size={18} /> Customer Settings</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-checkbox csp-full-width">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="isCustomer"
                                    checked={isActiveValue(isCustomer)}
                                    onChange={e => handleCheckbox('isCustomer', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Is a Customer
                            </label>
                        </div>
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="custCreditActive"
                                    checked={isActiveValue(Customercreditisactive)}
                                    onChange={e => handleCheckbox('Customercreditisactive', e)}
                                    disabled={!isActiveValue(isCustomer) || !canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Credit Active
                            </label>
                        </div>
                        <div className="csp-field-group">
                            <label>Credit Days</label>
                            <input
                                type="number"
                                value={Customercreditdays}
                                onChange={e => handleNumericInput('Customercreditdays', e.target.value)}
                                disabled={!isActiveValue(isCustomer) || !canEdit}
                                placeholder="0"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>Credit Limit</label>
                            <input
                                type="number"
                                step="0.01"
                                value={CustomerCreditLimit}
                                onChange={e => handleNumericInput('CustomerCreditLimit', e.target.value)}
                                disabled={!isActiveValue(isCustomer) || !canEdit}
                                placeholder="0.00"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="custDiscount"
                                    checked={isActiveValue(CustomerisDiscount)}
                                    onChange={e => handleCheckbox('CustomerisDiscount', e)}
                                    disabled={!isActiveValue(isCustomer) || !canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Discount Active
                            </label>
                        </div>
                        <div className="csp-field-group">
                            <label>Discount %</label>
                            <input
                                type="number"
                                step="0.01"
                                value={Customerdiscountper}
                                onChange={e => handleNumericInput('Customerdiscountper', e.target.value)}
                                disabled={!isActiveValue(isCustomer) || !canEdit}
                                placeholder="0.00"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>GL Account Code *</label>
                            <select
                                value={CustomerglCode}
                                onChange={e => handleInput('CustomerglCode', e.target.value)}
                                disabled={!isActiveValue(isCustomer) || !canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select GL Account</option>
                                {customerGLAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="csp-field-group">
                            <label>Sales Man Code</label>
                            <select
                                value={SaleManCode}
                                onChange={e => handleInput('SaleManCode', e.target.value)}
                                disabled={!isActiveValue(isCustomer) || !canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select Salesman</option>
                                {saleMen.map(sm => (
                                    <option key={sm.code} value={sm.code}>
                                        {sm.code} - {sm.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Supplier Settings */}
                <div className="csp-form-section">
                    <h4><Icons.Truck size={18} /> Supplier Settings</h4>
                    <div className="csp-form-grid csp-grid-3">
                        <div className="csp-field-group csp-checkbox csp-full-width">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="isSupplier"
                                    checked={isActiveValue(isSupplier)}
                                    onChange={e => handleCheckbox('isSupplier', e)}
                                    disabled={!canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Is a Supplier
                            </label>
                        </div>
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="suppCreditActive"
                                    checked={isActiveValue(Supplierrcreditisactive)}
                                    onChange={e => handleCheckbox('Supplierrcreditisactive', e)}
                                    disabled={!isActiveValue(isSupplier) || !canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Credit Active
                            </label>
                        </div>
                        <div className="csp-field-group">
                            <label>Credit Days</label>
                            <input
                                type="number"
                                value={Suppliercreditdays}
                                onChange={e => handleNumericInput('Suppliercreditdays', e.target.value)}
                                disabled={!isActiveValue(isSupplier) || !canEdit}
                                placeholder="0"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>Credit Limit</label>
                            <input
                                type="number"
                                step="0.01"
                                value={SupplierCreditLimit}
                                onChange={e => handleNumericInput('SupplierCreditLimit', e.target.value)}
                                disabled={!isActiveValue(isSupplier) || !canEdit}
                                placeholder="0.00"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group csp-checkbox">
                            <label className="csp-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    id="suppDiscount"
                                    checked={isActiveValue(SupplierisDiscount)}
                                    onChange={e => handleCheckbox('SupplierisDiscount', e)}
                                    disabled={!isActiveValue(isSupplier) || !canEdit}
                                />
                                <span className="csp-checkbox-custom"></span>
                                Discount Active
                            </label>
                        </div>
                        <div className="csp-field-group">
                            <label>Discount %</label>
                            <input
                                type="number"
                                step="0.01"
                                value={Supplierdiscountper}
                                onChange={e => handleNumericInput('Supplierdiscountper', e.target.value)}
                                disabled={!isActiveValue(isSupplier) || !canEdit}
                                placeholder="0.00"
                                className="csp-form-input"
                            />
                        </div>
                        <div className="csp-field-group">
                            <label>GL Account Code *</label>
                            <select
                                value={SupplierglCode}
                                onChange={e => handleInput('SupplierglCode', e.target.value)}
                                disabled={!isActiveValue(isSupplier) || !canEdit}
                                className="csp-form-select"
                            >
                                <option value="">Select GL Account</option>
                                {supplierGLAccounts.map(acc => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Customer/Supplier Profile Main Component
---------------------------- */
const CustomerSupplierProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = credentials?.company?.offcode || credentials?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { data: profiles, lookupData, isLoading: isDataLoading, error, refetch, setError } = useDataService();

    const [selectedProfile, setSelectedProfile] = useState(null);
    const [formData, setFormData] = useState(() => getInitialCustomerData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    const [paginatedProfiles, setPaginatedProfiles] = useState([]);

    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Customer/Supplier Profile' })
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

    // Update paginated profiles
    useEffect(() => {
        const filtered = profiles.filter(p =>
            normalizeValue(p.CustomerName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            normalizeValue(p.CustomerCode).includes(searchTerm)
        );
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedProfiles(filtered.slice(startIndex, endIndex));
    }, [profiles, currentPage, itemsPerPage, searchTerm]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ✅ Fixed: Generate customer code with 10-digit format (0000000001)
    const generateCustomerCode = () => {
        // Filter profiles for current office only
        const officeProfiles = profiles.filter(p => 
            normalizeValue(p.offcode) === currentOffcode
        );
        
        const existingCodes = officeProfiles
            .map(p => {
                const code = normalizeValue(p.CustomerCode);
                // Try to parse as integer, but handle non-numeric codes
                const parsed = parseInt(code, 10);
                return isNaN(parsed) ? 0 : parsed;
            })
            .filter(code => code > 0);
        
        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        // Pad with leading zeros to make it 10 digits
        const newCode = (maxCode + 1).toString().padStart(10, '0');
        console.log('Generated new code:', newCode, 'from max:', maxCode); // For debugging
        return newCode;
    };

    // Initialize form for new profile with auto-generated code
    useEffect(() => {
        if (currentMode === 'new') {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            
            // Generate the code immediately for new profiles
            const newCode = generateCustomerCode();

            setFormData(prev => ({
                ...getInitialCustomerData(currentOffcode),
                CustomerCode: newCode, // Set the generated code immediately
                createdby: currentUser,
                editby: currentUser,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                country: lookupData.countries.find(c => c.id === defaultCountryId)?.name || 'Pakistan',
                city: lookupData.cities.find(c => c.id === defaultCityId)?.name || 'LAHORE',
                CustomerglCode: lookupData.glAccounts[0]?.code || '',
                SupplierglCode: lookupData.glAccounts[0]?.code || '',
                SaleManCode: lookupData.saleMen[0]?.code || ''
            }));
        }
    }, [currentMode, currentOffcode, currentUser, lookupData, profiles]);

    // Load selected profile for editing
    useEffect(() => {
        if (selectedProfile && currentMode === 'edit') {
            const normalizedProfile = Object.keys(getInitialCustomerData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedProfile[key] || getInitialCustomerData()[key]);
                return acc;
            }, {});

            setFormData(normalizedProfile);
        }
    }, [selectedProfile, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectProfile = (profile) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view profiles');
            return;
        }
        setSelectedProfile(profile);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(profile.CustomerName)}`);
    };

    const handleNewProfile = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new profiles');
            return;
        }
        setSelectedProfile(null);
        setCurrentMode('new');
        setMessage('Creating new profile...');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} profiles`);
            return;
        }

        if (!formData.CustomerName.trim()) {
            setMessage('❌ Customer Name is required!');
            return;
        }

        // For new profiles, ensure we have a code (it should already be generated)
        if (currentMode === 'new' && (!formData.CustomerCode || formData.CustomerCode.trim() === '')) {
            setMessage('❌ Customer Code generation failed!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.CUSTOMER_SUPPLIER,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                CustomerCode: formData.CustomerCode,
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
                setMessage('✅ Profile saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // Find the newly created profile or use the one we just created
                    const newRecord = profiles.find(p =>
                        p.CustomerCode === formData.CustomerCode && p.offcode === currentOffcode
                    ) || { ...formData };
                    
                    setSelectedProfile(newRecord);
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

    const handleDeleteProfile = async (profile) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete profiles');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the profile "${profile.CustomerName}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.CUSTOMER_SUPPLIER,
                where: {
                    CustomerCode: profile.CustomerCode,
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
                setMessage('✅ Profile deleted successfully!');
                await refetch();

                if (selectedProfile && selectedProfile.CustomerCode === profile.CustomerCode) {
                    setSelectedProfile(null);
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

    const filteredCount = profiles.filter(p =>
        normalizeValue(p.CustomerName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        normalizeValue(p.CustomerCode).includes(searchTerm)
    ).length;

    const CustomerProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.Users size={20} />
                        <h3>Profiles</h3>
                        <span className="csp-profile-count">{filteredCount} profiles</span>
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
                    {isDataLoading && profiles.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Profiles...</p>
                        </div>
                    ) : paginatedProfiles.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {paginatedProfiles.map(profile => (
                                    <div
                                        key={`${profile.CustomerCode}-${profile.offcode}`}
                                        className={`csp-profile-item ${
                                            selectedProfile?.CustomerCode === profile.CustomerCode && currentMode === 'edit' ? 'csp-selected' : ''
                                        }`}
                                        onClick={() => handleSelectProfile(profile)}
                                    >
                                        <div className="csp-profile-info">
                                            <div className="csp-profile-header">
                                                <span className="csp-profile-code">{normalizeValue(profile.CustomerCode)}</span>
                                                <span className="csp-profile-type-badge">
                                                    {normalizeValue(profile.CustomerSupplierType)}
                                                </span>
                                            </div>
                                            <div className="csp-profile-name">{normalizeValue(profile.CustomerName)}</div>
                                            <div className="csp-profile-meta">
                                                <span className={`csp-status-dot ${isActiveValue(profile.isactive) ? 'csp-active' : 'csp-inactive'}`} />
                                                <span className="csp-status-text">
                                                    {isActiveValue(profile.isactive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        {hasPermission && hasPermission(menuId, 'delete') && (
                                            <button
                                                className="csp-profile-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProfile(profile);
                                                }}
                                                title="Delete profile"
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
                            <Icons.UserCircle size={48} className="csp-empty-icon" />
                            <h4>No profiles found</h4>
                            {searchTerm ? (
                                <p>Try a different search term</p>
                            ) : (
                                <p>Create your first profile to get started</p>
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
                    <Icons.Users size={24} className="csp-header-icon" />
                    <div>
                        <h1>Customer & Supplier Management</h1>
                        <span className="csp-header-subtitle">Manage customer and supplier profiles</span>
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
                        <button className="csp-toolbar-btn" onClick={handleNewProfile}>
                            <Icons.Plus size={16} />
                            <span>New Profile</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="csp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedProfile) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a profile to edit'); 
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
                <CustomerProfileSidebar />

                <main className="csp-content-area">
                    <div className="csp-content-tabs">
                        <button className="csp-tab csp-active">
                            <Icons.User size={16} />
                            Profile Details
                        </button>
                    </div>

                    <div className="csp-content-panel">
                        <CustomerSupplierProfileForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewProfile={handleNewProfile}
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

export default CustomerSupplierProfile;