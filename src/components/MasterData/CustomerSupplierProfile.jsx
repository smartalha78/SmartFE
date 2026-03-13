import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
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

// Helper function to check if a value represents "active"
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

// Convert numeric code to 10-digit format with leading zeros
const formatCode = (num) => {
    return num.toString().padStart(10, '0');
};

// Extract numeric value from code (remove leading zeros)
const getNumericCode = (code) => {
    if (!code) return 0;
    // Remove leading zeros and convert to number
    const numericStr = code.replace(/^0+/, '');
    return numericStr === '' ? 0 : parseInt(numericStr, 10);
};

// Prepare data for database insertion/update - COMPLETELY WITHOUT audit fields
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    // Helper function to convert empty strings to null for optional fields
    const toDBValue = (value) => {
        if (value === undefined || value === '') return null;
        return value;
    };

    // Base data with ONLY the fields that exist in the database
    // NO createdby, createdate, editby, editdate fields
    const preparedData = {
        offcode: currentOffcode,
        CustomerCode: data.CustomerCode || '',
        CustomerName: data.CustomerName || '',
        CustomerNameAR: toDBValue(data.CustomerNameAR),
        SHD: toDBValue(data.SHD),
        isactive: isActiveValue(data.isactive) ? 'True' : 'False',
        billaddress: toDBValue(data.billaddress),
        billaddressAR: toDBValue(data.billaddressAR),
        zipcode: toDBValue(data.zipcode),
        CountryID: data.CountryID || '1',
        country: data.country || 'Pakistan',
        CityID: data.CityID || '1',
        city: data.city || 'LAHORE',
        phone1: toDBValue(data.phone1),
        mobile: data.mobile || '0',
        fax: toDBValue(data.fax),
        email: toDBValue(data.email),
        type: data.type || '1',
        IsSalesTax: isActiveValue(data.IsSalesTax) ? 'True' : 'False',
        SalesTaxNo: data.SalesTaxNo || '----',
        SalesTaxNoAR: toDBValue(data.SalesTaxNoAR),
        isCustomer: isActiveValue(data.isCustomer) ? 'True' : 'False',
        Customercreditisactive: isActiveValue(data.Customercreditisactive) ? 'True' : 'False',
        Customercreditdays: data.Customercreditdays || '0',
        CustomerisDiscount: isActiveValue(data.CustomerisDiscount) ? 'True' : 'False',
        Customerdiscountper: data.Customerdiscountper || '0.00',
        CustomerglCode: toDBValue(data.CustomerglCode),
        CustomerCreditLimit: data.CustomerCreditLimit || '0.00',
        isSupplier: isActiveValue(data.isSupplier) ? 'True' : 'False',
        Supplierrcreditisactive: isActiveValue(data.Supplierrcreditisactive) ? 'True' : 'False',
        Suppliercreditdays: data.Suppliercreditdays || '0',
        SupplierisDiscount: isActiveValue(data.SupplierisDiscount) ? 'True' : 'False',
        Supplierdiscountper: data.Supplierdiscountper || '0.00',
        SupplierglCode: toDBValue(data.SupplierglCode),
        SupplierCreditLimit: data.SupplierCreditLimit || '0.00',
        SaleManCode: toDBValue(data.SaleManCode),
        isNTN: isActiveValue(data.isNTN) ? 'True' : 'False',
        NTN: data.NTN || '-',
        CNIC: data.CNIC || '0',
        ST1: toDBValue(data.ST1),
        ST2: toDBValue(data.ST2),
        ST3: toDBValue(data.ST3),
        ST4: toDBValue(data.ST4),
        ST5: toDBValue(data.ST5),
        CustomeralternativeCode: toDBValue(data.CustomeralternativeCode),
        SupplieralternativeCode: toDBValue(data.SupplieralternativeCode),
        PartyVendorCode: toDBValue(data.PartyVendorCode),
        PartyCustomerCode: toDBValue(data.PartyCustomerCode),
        PackageId: data.PackageId || '1',
        PerMonthFee: data.PerMonthFee || '700',
        PackageDate: data.PackageDate ? formatDateForDB(data.PackageDate) : formatDateForDB(new Date()),
        SectorCode: data.SectorCode || '000001',
        isAcCreate: isActiveValue(data.isAcCreate) ? 'True' : 'False',
        PackageTotalAmount: data.PackageTotalAmount || '0',
        PackageDownAmount: data.PackageDownAmount || '0',
        PackageBalanceAmount: data.PackageBalanceAmount || '0',
        PackageNoofInstallment: data.PackageNoofInstallment || '0',
        ProductDetail: toDBValue(data.ProductDetail),
        ProductDetailAR: toDBValue(data.ProductDetailAR),
        State: toDBValue(data.State),
        isTaxableInvoice: isActiveValue(data.isTaxableInvoice) ? 'True' : 'False',
        RateType: data.RateType || '1',
        buytypeId: data.buytypeId || 'TIN',
        buystreetname: toDBValue(data.buystreetname),
        buybuildingname: toDBValue(data.buybuildingname),
        buybuildno: data.buybuildno || '0',
        buyplotid: toDBValue(data.buyplotid),
        buyadbuildno: toDBValue(data.buyadbuildno),
        buypostalzone: data.buypostalzone || '0',
        buysubcitysubname: toDBValue(data.buysubcitysubname),
        buycountrySubentity: toDBValue(data.buycountrySubentity),
        buyContractAmount: data.buyContractAmount || '0.00',
        sellersidtype: data.sellersidtype || 'CRN',
        sellersid: toDBValue(data.sellersid),
        scenarioId: data.scenarioId || 'SN001',
        CustomerSupplierType: data.CustomerSupplierType || 'CUSTOMER/SUPPLIER'
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
 * Initial State (without audit fields)
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
    CustomerSupplierType: 'CUSTOMER/SUPPLIER'
});

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useDataService = () => {
    const { credentials } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]); // Store ALL profiles for code generation
    const [totalCount, setTotalCount] = useState(0);
    const [lookupData, setLookupData] = useState({
        saleMen: [],
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

    // Fetch ALL profiles for code generation (non-paginated)
    const fetchAllProfiles = useCallback(async (offcode) => {
        try {
            console.log('Fetching ALL profiles for code generation...');
            const whereClause = `offcode = '${offcode}'`;
            const payload = {
                tableName: API_CONFIG.TABLES.CUSTOMER_SUPPLIER,
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
                setAllProfiles(data.rows || []);
                
                // Calculate max code from ALL profiles
                const codes = (data.rows || [])
                    .map(p => {
                        const codeStr = normalizeValue(p.CustomerCode);
                        return getNumericCode(codeStr);
                    })
                    .filter(code => code > 0);

                const max = codes.length > 0 ? Math.max(...codes) : 0;
                console.log('All profiles count:', data.rows?.length);
                console.log('All numeric codes:', codes.sort((a, b) => a - b));
                console.log('True max code from ALL records:', max);
                setMaxCode(max);
            }
        } catch (err) {
            console.error('Error fetching all profiles:', err);
        }
    }, []);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';

            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setProfiles([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching profiles for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);

            // Build where clause for search if needed
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (CustomerCode LIKE '%${search}%' OR CustomerName LIKE '%${search}%')`;
            }

            const payload = {
                tableName: API_CONFIG.TABLES.CUSTOMER_SUPPLIER,
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
                setProfiles(data.rows || []);
                setTotalCount(data.totalCount || 0);
            } else {
                setProfiles([]);
                setTotalCount(0);
            }

            // Fetch ALL profiles once for code generation (only if not already loaded)
            if (allProfiles.length === 0) {
                await fetchAllProfiles(currentOffcode);
            }

            // Fetch lookup data separately (non-paginated)
            await fetchLookupData(currentOffcode);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setProfiles([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, allProfiles.length, fetchAllProfiles]);

    const fetchLookupData = useCallback(async (offcode) => {
        try {
            const [
                salesManData,
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.SALESMAN, offcode),
                fetchTableData(API_CONFIG.TABLES.COUNTRY, offcode),
                fetchTableData(API_CONFIG.TABLES.CITY, offcode),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, offcode),
                fetchTableData(API_CONFIG.TABLES.BRANCH, offcode)
            ]);

            const filteredSalesMen = Array.isArray(salesManData) ? salesManData
                .filter(s => normalizeValue(s.offcode) === offcode)
                .map(s => ({
                    code: normalizeValue(s.SaleManCode || s.code),
                    name: normalizeValue(s.SaleManName || s.name)
                })) : [];

            const filteredGLAccounts = Array.isArray(glAccountData) ? glAccountData
                .filter(acc => acc.code && acc.name)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                })) : [];

            const currentBranch = Array.isArray(branchData) ? branchData.find(b =>
                normalizeValue(b.offcode) === offcode
            ) : null;

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
        data: profiles,
        allProfiles, // Expose ALL profiles for code generation
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
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '0101';

    const {
        CustomerCode, CustomerName, CustomerNameAR, SHD, isactive,
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
                        <span className="csp-code-badge">{CustomerCode || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
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
                                disabled={true}
                                placeholder="Auto-generated"
                                className="csp-form-input csp-disabled-field"
                            />
                            {isNewMode && (
                                <small className="csp-field-hint">Code will be auto-generated as 0000000001, 0000000002, etc.</small>
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
                        <div className="csp-field-group full-width">
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
                        <div className="csp-field-group csp-checkbox full-width">
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
                        <div className="csp-field-group csp-checkbox full-width">
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
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const {
        data: profiles,
        allProfiles, // Get ALL profiles for code generation
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

    const [selectedProfile, setSelectedProfile] = useState(null);
    const [formData, setFormData] = useState(() => getInitialCustomerData(currentOffcode));
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
                    body: JSON.stringify({ screenName: 'Customer/Supplier Profile' })
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

    // Get the true maximum code from ALL profiles
    const getTrueMaxCode = useCallback(() => {
        // Use allProfiles if available, otherwise fall back to paginated profiles
        const sourceProfiles = allProfiles.length > 0 ? allProfiles : profiles;
        
        const numericCodes = sourceProfiles
            .filter(p => p.offcode === currentOffcode)
            .map(p => getNumericCode(p.CustomerCode))
            .filter(code => code > 0);
        
        return numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
    }, [allProfiles, profiles, currentOffcode]);

    // Generate customer code based on true maximum from ALL records (10-digit)
    const generateCustomerCode = useCallback(() => {
        const trueMax = getTrueMaxCode();
        const nextCode = trueMax + 1;
        const paddedCode = formatCode(nextCode);
        
        console.log('Generating code from ALL records:', { 
            trueMax, 
            nextCode, 
            paddedCode,
            allProfilesCount: allProfiles.length,
            profilesCount: profiles.length
        });
        
        return paddedCode;
    }, [getTrueMaxCode, allProfiles.length, profiles.length]);

    // Initialize form for new profile with auto-generated code
    useEffect(() => {
        if (currentMode === 'new' && !selectedProfile) {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            
            // Use ALL profiles for code generation
            const sourceProfiles = allProfiles.length > 0 ? allProfiles : profiles;
            
            // Get all existing codes from ALL records
            const existingCodes = new Set(
                sourceProfiles
                    .filter(p => p.offcode === currentOffcode)
                    .map(p => getNumericCode(p.CustomerCode))
            );
            
            // Find the true maximum
            const trueMax = Math.max(0, ...Array.from(existingCodes));
            
            // Find the next available code
            let candidate = trueMax + 1;
            while (existingCodes.has(candidate)) {
                candidate++;
            }
            
            const newCode = formatCode(candidate);
            
            console.log('New profile initialization:', {
                trueMax,
                candidate,
                newCode,
                existingCodesCount: existingCodes.size,
                source: allProfiles.length > 0 ? 'allProfiles' : 'profiles'
            });

            setFormData({
                ...getInitialCustomerData(currentOffcode),
                CustomerCode: newCode,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                country: lookupData.countries.find(c => c.id === defaultCountryId)?.name || 'Pakistan',
                city: lookupData.cities.find(c => c.id === defaultCityId)?.name || 'LAHORE',
                CustomerglCode: lookupData.glAccounts[0]?.code || '',
                SupplierglCode: lookupData.glAccounts[0]?.code || '',
                SaleManCode: lookupData.saleMen[0]?.code || ''
            });
        }
    }, [currentMode, currentOffcode, lookupData, selectedProfile, allProfiles, profiles]);

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

        if (!formData.CustomerCode.trim()) {
            setMessage('❌ Customer Code is required!');
            return;
        }

        // For new records, verify the code is still available using ALL profiles
        if (currentMode === 'new') {
            // Use ALL profiles for duplicate check
            const sourceProfiles = allProfiles.length > 0 ? allProfiles : profiles;
            
            const existingCode = sourceProfiles.find(p =>
                p.CustomerCode === formData.CustomerCode &&
                p.offcode === currentOffcode
            );

            if (existingCode) {
                // Code already exists, find the next available code from ALL records
                const existingCodes = new Set(
                    sourceProfiles
                        .filter(p => p.offcode === currentOffcode)
                        .map(p => getNumericCode(p.CustomerCode))
                );
                
                const trueMax = Math.max(0, ...Array.from(existingCodes));
                let candidate = trueMax + 1;
                while (existingCodes.has(candidate)) {
                    candidate++;
                }
                
                const newCode = formatCode(candidate);
                setFormData(prev => ({ ...prev, CustomerCode: newCode }));
                setMessage(`⚠️ Code was taken, new code generated from ALL records: ${newCode}`);
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
            tableName: API_CONFIG.TABLES.CUSTOMER_SUPPLIER,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                CustomerCode: formData.CustomerCode,
                offcode: currentOffcode
            };
        }

        console.log('Sending payload (no audit fields):', JSON.stringify(payload, null, 2));

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                console.log('Error Response:', errorText);

                // Check if it's a duplicate key error
                if (errorText.includes('duplicate key') || errorText.includes('2627')) {
                    // Find the next available code from ALL records
                    const sourceProfiles = allProfiles.length > 0 ? allProfiles : profiles;
                    
                    const existingCodes = new Set(
                        sourceProfiles
                            .filter(p => p.offcode === currentOffcode)
                            .map(p => getNumericCode(p.CustomerCode))
                    );
                    
                    const trueMax = Math.max(0, ...Array.from(existingCodes));
                    let candidate = trueMax + 1;
                    while (existingCodes.has(candidate)) {
                        candidate++;
                    }
                    
                    const newCode = formatCode(candidate);
                    setFormData(prev => ({ ...prev, CustomerCode: newCode }));
                    setMessage(`⚠️ Code was taken, new code generated from ALL records: ${newCode}`);
                    setIsSaving(false);
                    return;
                }

                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const result = await resp.json();
            console.log('Save result:', result);

            if (result.success) {
                setMessage('✅ Profile saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    // For new records, stay in edit mode with the new record selected
                    const newRecord = {
                        ...preparedData,
                        CustomerName: preparedData.CustomerName
                    };

                    setSelectedProfile(newRecord);
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

                // Check if current page is now empty and we're not on page 1
                if (profiles.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
                }

                if (selectedProfile && selectedProfile.CustomerCode === profile.CustomerCode) {
                    handleNewProfile();
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

    const CustomerProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.Users size={20} />
                        <h3>Profiles</h3>
                        <span className="csp-profile-count">{totalCount} profiles</span>
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
                    {isDataLoading && profiles.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Profiles...</p>
                        </div>
                    ) : profiles.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {profiles.map(profile => (
                                    <div
                                        key={`${profile.CustomerCode}-${profile.offcode}`}
                                        className={`csp-profile-item ${selectedProfile?.CustomerCode === profile.CustomerCode && currentMode === 'edit' ? 'csp-selected' : ''
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
                            <Icons.UserCircle size={48} className="csp-empty-icon" />
                            <h4>No profiles found</h4>
                            {localSearchTerm ? (
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