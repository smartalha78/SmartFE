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
const getInitialLabourData = (offcode = '0101') => ({
    offcode: offcode,
    LabourCode: '',
    LabourName: '',
    isactive: 'true',
    contact: '',
    billaddress: '',
    zipcode: '',
    CountryID: '1',
    country: 'Pakistan',
    CityID: '1',
    city: 'LAHORE',
    phone1: '',
    mobile: '0',
    fax: '',
    email: '',
    paymentmethod: '2',
    LabourglCode: '',
    defaultTypePerAmt: '01',
    defaultAmount: '0',
    LabourType: '01',
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
        LabourCode: data.LabourCode || '',
        LabourName: data.LabourName || '',
        isactive: isActiveValue(data.isactive) ? 'True' : 'False',
        contact: data.contact || '',
        billaddress: data.billaddress || '',
        zipcode: data.zipcode || '',
        CountryID: data.CountryID || '1',
        country: data.country || 'Pakistan',
        CityID: data.CityID || '1',
        city: data.city || 'LAHORE',
        phone1: data.phone1 || '',
        mobile: data.mobile || '0',
        fax: data.fax || '',
        email: data.email || '',
        paymentmethod: data.paymentmethod || '2',
        LabourglCode: data.LabourglCode || '',
        defaultTypePerAmt: data.defaultTypePerAmt || '01',
        defaultAmount: data.defaultAmount || '0',
        LabourType: data.LabourType || '01',
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
const useLabourDataService = () => {
    const { credentials } = useAuth();
    const [labourData, setLabourData] = useState([]);
    const [lookupData, setLookupData] = useState({
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
            const currentOffcode = credentials?.company?.offcode || '0101';

            const [
                labourData,
                countryData,
                cityData,
                glAccountData,
                branchData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.LABOUR),
                fetchTableData(API_CONFIG.TABLES.COUNTRY),
                fetchTableData(API_CONFIG.TABLES.CITY),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT),
                fetchTableData(API_CONFIG.TABLES.BRANCH)
            ]);

            const filteredLabour = labourData.filter(l =>
                normalizeValue(l.offcode) === currentOffcode
            );

            const filteredGLAccounts = glAccountData
                .filter(acc => acc.code && acc.name && normalizeValue(acc.offcode) === currentOffcode)
                .map(acc => ({
                    code: normalizeValue(acc.code),
                    name: normalizeValue(acc.name)
                }));

            const currentBranch = branchData.find(b =>
                normalizeValue(b.offcode) === currentOffcode
            );

            setLabourData(filteredLabour);
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
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { labourData, lookupData, isLoading, error, refetch: loadAllData, setError };
};

/* ---------------------------
 * Labour Profile Form Component
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
    const currentOffcode = credentials?.company?.offcode || '0101';

    const {
        offcode, LabourCode, LabourName, isactive, contact, billaddress, zipcode,
        CountryID, CityID, phone1, mobile, fax, email, paymentmethod,
        LabourglCode, defaultTypePerAmt, defaultAmount, LabourType
    } = formData;

    const { countries, cities, glAccounts, branchData } = lookupData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const availableCities = cities.filter(c => c.countryId === CountryID);
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

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

                        <div className="csp-field-group csp-full-width">
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
            </div>
        </div>
    );
};

/* ---------------------------
 * Labour Profile Main Component
---------------------------- */
const LabourProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { labourData, lookupData, isLoading: isDataLoading, error, refetch, setError } = useLabourDataService();

    const [selectedLabour, setSelectedLabour] = useState(null);
    const [formData, setFormData] = useState(() => getInitialLabourData(currentOffcode));
    const [currentMode, setCurrentMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    const [paginatedLabour, setPaginatedLabour] = useState([]);

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
                    setScreenConfig(data.screen);
                    setMenuId(data.screen.id);
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
            }
        };
        loadScreenConfig();
    }, []);

    // Filter and paginate labour
    useEffect(() => {
        const filtered = labourData.filter(l =>
            normalizeValue(l.LabourName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            normalizeValue(l.LabourCode).includes(searchTerm)
        );
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedLabour(filtered.slice(startIndex, endIndex));
    }, [labourData, currentPage, itemsPerPage, searchTerm]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const generateLabourCode = useCallback(() => {
        if (labourData.length === 0) {
            return '0000000001';
        }

        const existingCodes = labourData
            .map(l => parseInt(normalizeValue(l.LabourCode), 10))
            .filter(code => !isNaN(code) && code > 0);

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextCode = maxCode + 1;

        return nextCode.toString().padStart(10, '0');
    }, [labourData]);

    useEffect(() => {
        if (currentMode === 'new') {
            const defaultCountryId = lookupData.countries[0]?.id || '1';
            const defaultCityId = lookupData.cities.find(c => c.countryId === defaultCountryId)?.id || '1';
            const newCode = generateLabourCode();

            setFormData(prev => ({
                ...getInitialLabourData(currentOffcode),
                LabourCode: newCode,
                CountryID: defaultCountryId,
                CityID: defaultCityId,
                country: lookupData.countries.find(c => c.id === defaultCountryId)?.name || 'Pakistan',
                city: lookupData.cities.find(c => c.id === defaultCityId)?.name || 'LAHORE',
                LabourglCode: lookupData.glAccounts[0]?.code || '',
                createdby: currentUser,
                editby: currentUser
            }));
        }
    }, [currentMode, currentOffcode, currentUser, lookupData, generateLabourCode]);

    useEffect(() => {
        if (selectedLabour && currentMode === 'edit') {
            const normalizedLabour = Object.keys(getInitialLabourData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedLabour[key] || getInitialLabourData()[key]);
                return acc;
            }, {});

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

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database
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
                throw new Error(`HTTP ${resp.status}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Labour saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    const newRecord = labourData.find(l =>
                        l.LabourCode === formData.LabourCode && l.offcode === currentOffcode
                    ) || formData;
                    setSelectedLabour(newRecord);
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
                await refetch();

                if (selectedLabour && selectedLabour.LabourCode === labour.LabourCode) {
                    setSelectedLabour(null);
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

    const filteredCount = labourData.filter(l =>
        normalizeValue(l.LabourName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        normalizeValue(l.LabourCode).includes(searchTerm)
    ).length;

    const LabourProfileSidebar = () => {
        return (
            <aside className="csp-sidebar">
                <div className="csp-sidebar-header">
                    <div className="csp-sidebar-title">
                        <Icons.User size={20} />
                        <h3>Labour</h3>
                        <span className="csp-profile-count">{filteredCount} labour</span>
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
                    {isDataLoading && labourData.length === 0 ? (
                        <div className="csp-loading-state">
                            <Icons.Loader size={32} className="csp-spin" />
                            <p>Loading Labour...</p>
                        </div>
                    ) : paginatedLabour.length > 0 ? (
                        <>
                            <div className="csp-profile-list">
                                {paginatedLabour.map(labour => (
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
                            <h4>No labour found</h4>
                            {searchTerm ? (
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
            {/* Header */}
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