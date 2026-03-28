import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import "./Users.css";
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
        USERS: 'comUsers',
        BRANCH: 'comBranch',
        ACCOUNT: 'acChartOfAccount',
        CUSTOMER: 'comCustomer',
        SUPPLIER: 'comTransporter',
        SALESMAN: 'comSalesMan',
        EMPLOYEE: 'comEmployee',
        GODOWN: 'comGodown'
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
    
    const credentials = context.credentials || {};
    
    const uid = credentials?.Uid || 
                credentials?.uid || 
                credentials?.userid || 
                credentials?.userId || 
                credentials?.ID || 
                localStorage.getItem("userUid") || 
                '';
    
    return {
        ...context,
        credentials,
        uid
    };
};

/* ---------------------------
 * Utilities
---------------------------- */
const normalizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
    return String(value).trim();
};

const isActiveValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const str = value.toLowerCase().trim();
        return str === "true" || str === "1" || str === "yes" || str === "active";
    }
    return false;
};

/* ---------------------------
 * Data Service
---------------------------- */
const useUserDataService = () => {
    const { credentials } = useAuth();
    const [users, setUsers] = useState([]);
    const [lookupData, setLookupData] = useState({
        groups: [],
        managers: [],
        accounts: [],
        customers: [],
        suppliers: [],
        salesmen: [],
        employees: [],
        godowns: []
    });
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxUid, setMaxUid] = useState(0);

    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                whereClause = `Offcode = '${offcode}'`;
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

    const fetchMaxUid = useCallback(async (offcode) => {
        try {
            const allUsers = await fetchTableData(API_CONFIG.TABLES.USERS, offcode);
            
            const uids = allUsers
                .map(u => {
                    const uid = normalizeValue(u.Uid);
                    return parseInt(uid, 10);
                })
                .filter(uid => !isNaN(uid) && uid > 0);

            return uids.length > 0 ? Math.max(...uids) : 0;
        } catch (err) {
            console.error('Error fetching max UID:', err);
            return 0;
        }
    }, [fetchTableData]);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '0101';
            
            let whereClause = `Offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (Userlogin LIKE '%${search}%' OR Userfullname LIKE '%${search}%' OR Uid LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.USERS,
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
                setUsers(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                const max = await fetchMaxUid(currentOffcode);
                setMaxUid(max);
                
                await fetchLookupData(currentOffcode);
            } else {
                setUsers([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching users:', err);
            setError(`Failed to load data: ${err.message}`);
            setUsers([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, fetchTableData, fetchMaxUid]);

    const fetchLookupData = useCallback(async (offcode) => {
        try {
            const [
                allUsers,
                accountData,
                customerData,
                supplierData,
                salesmanData,
                employeeData,
                godownData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.USERS, offcode),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, offcode, "IsActive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.CUSTOMER, offcode, "isactive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.SUPPLIER, offcode, "isactive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.SALESMAN, offcode, "isactive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.EMPLOYEE, offcode, "IsActive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.GODOWN, offcode, "IsActive = 'True'")
            ]);

            const groups = [
                { code: '00', name: 'Super Admin' },
                { code: '001', name: 'Admin' },
                { code: '002', name: 'Manager' },
                { code: '003', name: 'User' },
                { code: '004', name: 'Viewer' }
            ];

            const managers = allUsers
                .filter(u => isActiveValue(u.IsActive))
                .map(u => ({
                    code: normalizeValue(u.Uid),
                    name: normalizeValue(u.Userfullname),
                    login: normalizeValue(u.Userlogin),
                    display: `${normalizeValue(u.Uid)} - ${normalizeValue(u.Userfullname)}`
                }));

            const accounts = accountData.map(acc => ({
                code: normalizeValue(acc.code),
                name: normalizeValue(acc.name),
                display: `${normalizeValue(acc.code)} - ${normalizeValue(acc.name)}`
            }));

            const customers = customerData.map(c => ({
                code: normalizeValue(c.CustomerCode),
                name: normalizeValue(c.CustomerName),
                display: `${normalizeValue(c.CustomerCode)} - ${normalizeValue(c.CustomerName)}`
            }));

            const suppliers = supplierData.map(s => ({
                code: normalizeValue(s.TransporterCode),
                name: normalizeValue(s.TransporterName),
                display: `${normalizeValue(s.TransporterCode)} - ${normalizeValue(s.TransporterName)}`
            }));

            const salesmen = salesmanData.map(s => ({
                code: normalizeValue(s.SaleManCode),
                name: normalizeValue(s.SaleManName),
                display: `${normalizeValue(s.SaleManCode)} - ${normalizeValue(s.SaleManName)}`
            }));

            const employees = employeeData.map(e => ({
                code: normalizeValue(e.EmployeeCode),
                name: normalizeValue(e.EmployeeName),
                display: `${normalizeValue(e.EmployeeCode)} - ${normalizeValue(e.EmployeeName)}`
            }));

            const godowns = godownData.map(g => ({
                code: normalizeValue(g.godownID),
                name: normalizeValue(g.description),
                display: `${normalizeValue(g.godownID)} - ${normalizeValue(g.description)}`
            }));

            setLookupData({
                groups,
                managers,
                accounts,
                customers,
                suppliers,
                salesmen,
                employees,
                godowns
            });

        } catch (err) {
            console.error('Error fetching lookup data:', err);
        }
    }, [fetchTableData]);

    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetch = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const goToPage = (page) => {
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
        users,
        lookupData,
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
        updatePageSize,
        maxUid
    };
};

/* ---------------------------
 * User Modal Component - FIXED
---------------------------- */
const UserModal = ({ isOpen, onClose, user, onSave, mode, lookupData, currentOffcode, maxUid }) => {
    const [formData, setFormData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    const { groups, managers, accounts, customers, suppliers, salesmen, employees, godowns } = lookupData;

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === 'new') {
                // For new user, generate UID and set defaults
                const newUid = (maxUid + 1).toString();
                setFormData({
                    Offcode: currentOffcode,
                    Uid: newUid,
                    Userlogin: '',
                    Userfullname: '',
                    Userpassword: '',
                    Useremail: '',
                    userMobile: '0',
                    Groupcode: '001',
                    IsActive: 'True',
                    IsBackDateEntry: 'True',
                    IsDashBord: 'True',
                    IsDashBordChart: 'True',
                    IsDateRange: 'False',
                    IsRateChange: 'True',
                    IsOTPActive: 'False',
                    IsPasswordExpiry: 'False',
                    PasswordExpiryDate: '',
                    OTPString: '',
                    OTPDate: '',
                    MobileKey: '',
                    ManagerCode: '',
                    ThemeName: 'Default',
                    FBRTokenNo: '',
                    SelectedItem: '',
                    AccountReferance: '',
                    AccountReferanceDet: '',
                    AccountReferanceNot: '',
                    AccountReferanceNotDet: '',
                    DefaultAccount: '',
                    DefaultCustomer: '',
                    DefaultSupplier: '',
                    DefaultGodown: '',
                    isUserCustomerActive: 'False',
                    isUserSaleManActive: 'False',
                    isUserEmployeeActive: 'False',
                    IsCustomerActive: 'False',
                    IsSalesmanActive: 'False',
                    UserCustomerCode: '0000000000',
                    UserSaleManCode: '0000000000',
                    UserEmployeeCode: '00000',
                    isAllowSaleOrderDemandCreate: 'False',
                    isUserFilter: 'False',
                    isManagerFilter: 'False',
                    webApiName: '',
                    STime: new Date().toISOString().split('T')[0] + ' 00:00:00',
                    ETime: new Date().toISOString().split('T')[0] + ' 00:00:00'
                });
            } else if (user) {
                // For edit, populate with user data
                const normalizedUser = {};
                const baseUser = {
                    Offcode: currentOffcode,
                    Uid: '',
                    Userlogin: '',
                    Userfullname: '',
                    Userpassword: '',
                    Useremail: '',
                    userMobile: '0',
                    Groupcode: '001',
                    IsActive: 'True',
                    IsBackDateEntry: 'True',
                    IsDashBord: 'True',
                    IsDashBordChart: 'True',
                    IsDateRange: 'False',
                    IsRateChange: 'True',
                    IsOTPActive: 'False',
                    IsPasswordExpiry: 'False',
                    PasswordExpiryDate: '',
                    OTPString: '',
                    OTPDate: '',
                    MobileKey: '',
                    ManagerCode: '',
                    ThemeName: 'Default',
                    FBRTokenNo: '',
                    SelectedItem: '',
                    AccountReferance: '',
                    AccountReferanceDet: '',
                    AccountReferanceNot: '',
                    AccountReferanceNotDet: '',
                    DefaultAccount: '',
                    DefaultCustomer: '',
                    DefaultSupplier: '',
                    DefaultGodown: '',
                    isUserCustomerActive: 'False',
                    isUserSaleManActive: 'False',
                    isUserEmployeeActive: 'False',
                    IsCustomerActive: 'False',
                    IsSalesmanActive: 'False',
                    UserCustomerCode: '0000000000',
                    UserSaleManCode: '0000000000',
                    UserEmployeeCode: '00000',
                    isAllowSaleOrderDemandCreate: 'False',
                    isUserFilter: 'False',
                    isManagerFilter: 'False',
                    webApiName: '',
                    STime: new Date().toISOString().split('T')[0] + ' 00:00:00',
                    ETime: new Date().toISOString().split('T')[0] + ' 00:00:00'
                };
                
                Object.keys(baseUser).forEach(key => {
                    normalizedUser[key] = normalizeValue(user[key] || baseUser[key]);
                });
                setFormData(normalizedUser);
            }
        }
    }, [isOpen, mode, user, currentOffcode, maxUid]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'True' : 'False') : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData) {
            onSave(formData, mode);
        }
    };

    if (!isOpen || !formData) return null;

    const themes = ['Default', 'Dark', 'Light', 'Blue', 'Green'];

    return (
        <div className="ump-modal-overlay">
            <div className="ump-modal-content">
                <div className="ump-modal-header">
                    <h2>{mode === 'new' ? 'Create New User' : 'Edit User'}</h2>
                    <button className="ump-modal-close" onClick={onClose}>
                        <Icons.X size={18} />
                    </button>
                </div>

                <div className="ump-modal-tabs">
                    <button 
                        className={`ump-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button 
                        className={`ump-tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('permissions')}
                    >
                        Permissions
                    </button>
                    <button 
                        className={`ump-tab-btn ${activeTab === 'references' ? 'active' : ''}`}
                        onClick={() => setActiveTab('references')}
                    >
                        References
                    </button>
                    <button 
                        className={`ump-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="ump-modal-form">
                    <div className="ump-modal-body">
                        {/* Basic Info Tab */}
                        {activeTab === 'basic' && (
                            <div className="ump-tab-content">
                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>UID</label>
                                        <input
                                            type="text"
                                            name="Uid"
                                            value={formData.Uid}
                                            onChange={handleInputChange}
                                            disabled={mode === 'edit'}
                                            className="ump-input"
                                            placeholder="Auto-generated"
                                        />
                                        {mode === 'new' && (
                                            <small className="ump-field-hint">Auto-generated: {formData.Uid}</small>
                                        )}
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Login ID *</label>
                                        <input
                                            type="text"
                                            name="Userlogin"
                                            value={formData.Userlogin}
                                            onChange={handleInputChange}
                                            required
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            name="Userfullname"
                                            value={formData.Userfullname}
                                            onChange={handleInputChange}
                                            required
                                            className="ump-input"
                                        />
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Password</label>
                                        <div className="ump-password-field">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="Userpassword"
                                                value={formData.Userpassword}
                                                onChange={handleInputChange}
                                                placeholder={mode === 'new' ? "Enter password" : "Leave blank to keep current"}
                                                className="ump-input"
                                            />
                                            <button
                                                type="button"
                                                className="ump-password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="Useremail"
                                            value={formData.Useremail}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Mobile</label>
                                        <input
                                            type="text"
                                            name="userMobile"
                                            value={formData.userMobile}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Group</label>
                                        <select
                                            name="Groupcode"
                                            value={formData.Groupcode}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            {groups.map(g => (
                                                <option key={g.code} value={g.code}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Manager</label>
                                        <select
                                            name="ManagerCode"
                                            value={formData.ManagerCode}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            <option value="">Select Manager</option>
                                            {managers.map(m => (
                                                <option key={m.code} value={m.code}>{m.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Theme</label>
                                        <select
                                            name="ThemeName"
                                            value={formData.ThemeName}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            {themes.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ump-form-group ump-checkbox-group">
                                        <label className="ump-checkbox">
                                            <input
                                                type="checkbox"
                                                name="IsActive"
                                                checked={formData.IsActive === 'True'}
                                                onChange={handleInputChange}
                                            />
                                            <span>Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Permissions Tab */}
                        {activeTab === 'permissions' && (
                            <div className="ump-tab-content">
                                <div className="ump-permissions-grid">
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsBackDateEntry"
                                            checked={formData.IsBackDateEntry === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Back Date Entry</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsDashBord"
                                            checked={formData.IsDashBord === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Dashboard Access</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsDashBordChart"
                                            checked={formData.IsDashBordChart === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Dashboard Charts</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsDateRange"
                                            checked={formData.IsDateRange === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Date Range</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsRateChange"
                                            checked={formData.IsRateChange === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Rate Change</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isAllowSaleOrderDemandCreate"
                                            checked={formData.isAllowSaleOrderDemandCreate === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Allow Sale Order</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isUserFilter"
                                            checked={formData.isUserFilter === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>User Filter</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isManagerFilter"
                                            checked={formData.isManagerFilter === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Manager Filter</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* References Tab */}
                        {activeTab === 'references' && (
                            <div className="ump-tab-content">
                                <h4>Default References</h4>
                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Default Account</label>
                                        <select
                                            name="DefaultAccount"
                                            value={formData.DefaultAccount}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            <option value="">Select</option>
                                            {accounts.map(a => (
                                                <option key={a.code} value={a.code}>{a.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Default Customer</label>
                                        <select
                                            name="DefaultCustomer"
                                            value={formData.DefaultCustomer}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            <option value="">Select</option>
                                            {customers.map(c => (
                                                <option key={c.code} value={c.code}>{c.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Default Supplier</label>
                                        <select
                                            name="DefaultSupplier"
                                            value={formData.DefaultSupplier}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            <option value="">Select</option>
                                            {suppliers.map(s => (
                                                <option key={s.code} value={s.code}>{s.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ump-form-group">
                                        <label>Default Godown</label>
                                        <select
                                            name="DefaultGodown"
                                            value={formData.DefaultGodown}
                                            onChange={handleInputChange}
                                            className="ump-select"
                                        >
                                            <option value="">Select</option>
                                            {godowns.map(g => (
                                                <option key={g.code} value={g.code}>{g.display}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <h4 style={{ marginTop: '20px' }}>Linked Entities</h4>
                                <div className="ump-form-row">
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isUserCustomerActive"
                                            checked={formData.isUserCustomerActive === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Link to Customer</span>
                                    </label>
                                    <div className="ump-form-group">
                                        <input
                                            type="text"
                                            name="UserCustomerCode"
                                            value={formData.UserCustomerCode}
                                            onChange={handleInputChange}
                                            placeholder="Customer Code"
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isUserSaleManActive"
                                            checked={formData.isUserSaleManActive === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Link to Salesman</span>
                                    </label>
                                    <div className="ump-form-group">
                                        <input
                                            type="text"
                                            name="UserSaleManCode"
                                            value={formData.UserSaleManCode}
                                            onChange={handleInputChange}
                                            placeholder="Salesman Code"
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="isUserEmployeeActive"
                                            checked={formData.isUserEmployeeActive === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Link to Employee</span>
                                    </label>
                                    <div className="ump-form-group">
                                        <input
                                            type="text"
                                            name="UserEmployeeCode"
                                            value={formData.UserEmployeeCode}
                                            onChange={handleInputChange}
                                            placeholder="Employee Code"
                                            className="ump-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="ump-tab-content">
                                <div className="ump-form-row">
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsOTPActive"
                                            checked={formData.IsOTPActive === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>OTP Active</span>
                                    </label>
                                    <label className="ump-checkbox">
                                        <input
                                            type="checkbox"
                                            name="IsPasswordExpiry"
                                            checked={formData.IsPasswordExpiry === 'True'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Password Expiry</span>
                                    </label>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Expiry Date</label>
                                        <input
                                            type="datetime-local"
                                            name="PasswordExpiryDate"
                                            value={formData.PasswordExpiryDate ? formData.PasswordExpiryDate.substring(0, 16) : ''}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                    <div className="ump-form-group">
                                        <label>OTP String</label>
                                        <input
                                            type="text"
                                            name="OTPString"
                                            value={formData.OTPString}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Mobile Key</label>
                                        <input
                                            type="text"
                                            name="MobileKey"
                                            value={formData.MobileKey}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                    <div className="ump-form-group">
                                        <label>FBR Token</label>
                                        <input
                                            type="text"
                                            name="FBRTokenNo"
                                            value={formData.FBRTokenNo}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                </div>

                                <div className="ump-form-row">
                                    <div className="ump-form-group">
                                        <label>Start Time</label>
                                        <input
                                            type="datetime-local"
                                            name="STime"
                                            value={formData.STime ? formData.STime.substring(0, 16) : ''}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                    <div className="ump-form-group">
                                        <label>End Time</label>
                                        <input
                                            type="datetime-local"
                                            name="ETime"
                                            value={formData.ETime ? formData.ETime.substring(0, 16) : ''}
                                            onChange={handleInputChange}
                                            className="ump-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ump-modal-footer">
                        <button type="button" className="ump-btn ump-btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="ump-btn ump-btn-primary">
                            {mode === 'new' ? 'Create User' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ---------------------------
 * Main User Management Component
---------------------------- */
const UserManagement = () => {
    const { credentials, uid } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { 
        users,
        lookupData,
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
        maxUid
    } = useUserDataService();

    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('new');
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
                    body: JSON.stringify({ screenName: 'Users' })
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

    const handleNewUser = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create users');
            return;
        }
        setSelectedUser(null);
        setModalMode('new');
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        if (!hasPermission || !hasPermission(menuId, 'edit')) {
            setMessage('⚠️ You do not have permission to edit users');
            return;
        }
        setSelectedUser(user);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleViewUser = (user) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view users');
            return;
        }
        // For view mode, you could open a read-only modal
        alert(`View user: ${user.Userfullname}`);
    };

    const handleSave = async (formData, mode) => {
        if (!hasPermission || !hasPermission(menuId, mode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${mode === 'new' ? 'create' : 'edit'} users`);
            return;
        }

        if (!formData.Userfullname?.trim()) {
            setMessage('❌ User Full Name is required!');
            return;
        }

        if (!formData.Userlogin?.trim()) {
            setMessage('❌ User Login ID is required!');
            return;
        }

        if (!formData.Uid?.trim()) {
            setMessage('❌ User UID is required!');
            return;
        }

        // Check for duplicate login ID
        const duplicateUser = users.find(u =>
            u.Userlogin === formData.Userlogin &&
            u.Offcode === currentOffcode &&
            (mode === 'new' || u.Uid !== selectedUser?.Uid)
        );

        if (duplicateUser) {
            setMessage('❌ A user with this login ID already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = mode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data - only include fields that exist in database
        const preparedData = {
            Offcode: formData.Offcode,
            Uid: formData.Uid,
            Userlogin: formData.Userlogin,
            Userfullname: formData.Userfullname,
            Userpassword: formData.Userpassword,
            Useremail: formData.Useremail || '',
            userMobile: formData.userMobile || '0',
            Groupcode: formData.Groupcode || '001',
            IsActive: formData.IsActive === 'True' ? 'True' : 'False',
            IsBackDateEntry: formData.IsBackDateEntry === 'True' ? 'True' : 'False',
            IsDashBord: formData.IsDashBord === 'True' ? 'True' : 'False',
            IsDashBordChart: formData.IsDashBordChart === 'True' ? 'True' : 'False',
            IsDateRange: formData.IsDateRange === 'True' ? 'True' : 'False',
            IsRateChange: formData.IsRateChange === 'True' ? 'True' : 'False',
            IsOTPActive: formData.IsOTPActive === 'True' ? 'True' : 'False',
            IsPasswordExpiry: formData.IsPasswordExpiry === 'True' ? 'True' : 'False',
            PasswordExpiryDate: formData.PasswordExpiryDate || '',
            OTPString: formData.OTPString || '',
            OTPDate: formData.OTPDate || '',
            MobileKey: formData.MobileKey || '',
            ManagerCode: formData.ManagerCode || '',
            ThemeName: formData.ThemeName || 'Default',
            FBRTokenNo: formData.FBRTokenNo || '',
            SelectedItem: formData.SelectedItem || '',
            AccountReferance: formData.AccountReferance || '',
            AccountReferanceDet: formData.AccountReferanceDet || '',
            AccountReferanceNot: formData.AccountReferanceNot || '',
            AccountReferanceNotDet: formData.AccountReferanceNotDet || '',
            DefaultAccount: formData.DefaultAccount || '',
            DefaultCustomer: formData.DefaultCustomer || '',
            DefaultSupplier: formData.DefaultSupplier || '',
            DefaultGodown: formData.DefaultGodown || '',
            isUserCustomerActive: formData.isUserCustomerActive === 'True' ? 'True' : 'False',
            isUserSaleManActive: formData.isUserSaleManActive === 'True' ? 'True' : 'False',
            isUserEmployeeActive: formData.isUserEmployeeActive === 'True' ? 'True' : 'False',
            IsCustomerActive: formData.IsCustomerActive === 'True' ? 'True' : 'False',
            IsSalesmanActive: formData.IsSalesmanActive === 'True' ? 'True' : 'False',
            UserCustomerCode: formData.UserCustomerCode || '0000000000',
            UserSaleManCode: formData.UserSaleManCode || '0000000000',
            UserEmployeeCode: formData.UserEmployeeCode || '00000',
            isAllowSaleOrderDemandCreate: formData.isAllowSaleOrderDemandCreate === 'True' ? 'True' : 'False',
            isUserFilter: formData.isUserFilter === 'True' ? 'True' : 'False',
            isManagerFilter: formData.isManagerFilter === 'True' ? 'True' : 'False',
            webApiName: formData.webApiName || '',
            STime: formData.STime || new Date().toISOString().split('T')[0] + ' 00:00:00',
            ETime: formData.ETime || new Date().toISOString().split('T')[0] + ' 00:00:00'
        };

        const payload = {
            tableName: API_CONFIG.TABLES.USERS,
            data: preparedData
        };

        if (mode === 'edit') {
            payload.where = {
                Uid: formData.Uid,
                Offcode: currentOffcode
            };
        }

        console.log('Saving user:', payload);

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
                setMessage(`✅ User ${mode === 'new' ? 'created' : 'updated'} successfully!`);
                await refetch();
                setIsModalOpen(false);
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

    const handleDeleteUser = async (user) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete users');
            return;
        }

        if (user.Uid === uid) {
            setMessage('❌ You cannot delete your own user account!');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the user "${user.Userfullname}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.USERS,
                where: {
                    Uid: user.Uid,
                    Offcode: currentOffcode
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
                setMessage('✅ User deleted successfully!');
                
                if (users.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetch();
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
        goToPage(page);
    };

    if (rightsLoading && !menuId) {
        return (
            <div className="ump-loading-container">
                <Icons.Loader size={24} className="ump-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="ump-container">
            <header className="ump-header">
                <div className="ump-header-left">
                    <Icons.Users size={20} className="ump-header-icon" />
                    <div>
                        <h1>User Management</h1>
                        <span className="ump-header-subtitle">Manage system users</span>
                    </div>
                </div>
                <div className="ump-header-right">
                    <Icons.User size={14} />
                    <span>{currentUser}</span>
                    <span className="ump-office-tag">{currentOffcode}</span>
                </div>
            </header>

            <div className="ump-toolbar">
                <div className="ump-toolbar-group">
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="ump-toolbar-btn ump-primary" onClick={handleNewUser}>
                            <Icons.Plus size={14} />
                            <span>New User</span>
                        </button>
                    )}
                </div>
                <div className="ump-toolbar-group">
                    <button className="ump-toolbar-btn" onClick={refetch}>
                        <Icons.RefreshCw size={14} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="ump-toast ump-error">
                    <div className="ump-toast-content">
                        <Icons.AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                    <button className="ump-toast-close" onClick={() => setError('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            {message && (
                <div className={`ump-toast ${message.includes('❌') ? 'ump-error' : message.includes('⚠️') ? 'ump-warning' : 'ump-success'}`}>
                    <div className="ump-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={16} />}
                        {message.includes('❌') && <Icons.AlertCircle size={16} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={16} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="ump-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            <div className="ump-main-content">
                <div className="ump-search-bar">
                    <div className="ump-search-container">
                        <Icons.Search size={14} className="ump-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by login, name or UID..."
                            value={localSearchTerm}
                            onChange={e => setLocalSearchTerm(e.target.value)}
                            className="ump-search-input"
                        />
                    </div>
                </div>

                {isDataLoading && users.length === 0 ? (
                    <div className="ump-loading-state">
                        <Icons.Loader size={24} className="ump-spin" />
                        <p>Loading users...</p>
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <div className="ump-table-container">
                            <table className="ump-table">
                                <thead>
                                    <tr>
                                        <th>UID</th>
                                        <th>Login</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Mobile</th>
                                        <th>Group</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={`${user.Uid}-${user.Offcode}`}>
                                            <td>{normalizeValue(user.Uid)}</td>
                                            <td>{normalizeValue(user.Userlogin)}</td>
                                            <td>{normalizeValue(user.Userfullname)}</td>
                                            <td>{normalizeValue(user.Useremail)}</td>
                                            <td>{normalizeValue(user.userMobile) !== '0' ? normalizeValue(user.userMobile) : '-'}</td>
                                            <td>{user.Groupcode}</td>
                                            <td>
                                                <span className={`ump-status-badge ${isActiveValue(user.IsActive) ? 'ump-active' : 'ump-inactive'}`}>
                                                    {isActiveValue(user.IsActive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ump-action-buttons">
                                                    {hasPermission && hasPermission(menuId, 'view') && (
                                                        <button 
                                                            className="ump-action-btn" 
                                                            onClick={() => handleViewUser(user)}
                                                            title="View"
                                                        >
                                                            <Icons.Eye size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission && hasPermission(menuId, 'edit') && (
                                                        <button 
                                                            className="ump-action-btn" 
                                                            onClick={() => handleEditUser(user)}
                                                            title="Edit"
                                                        >
                                                            <Icons.Edit size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission && hasPermission(menuId, 'delete') && (
                                                        <button 
                                                            className="ump-action-btn ump-delete" 
                                                            onClick={() => handleDeleteUser(user)}
                                                            title="Delete"
                                                        >
                                                            <Icons.Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="ump-pagination-wrapper">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    totalItems={totalCount}
                                    itemsPerPage={pageSize}
                                    maxVisiblePages={5}
                                    loading={isDataLoading}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="ump-empty-state">
                        <Icons.Users size={32} className="ump-empty-icon" />
                        <h4>No users found</h4>
                        <p>{localSearchTerm ? 'Try a different search term' : 'Click New User to create one'}</p>
                    </div>
                )}
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                onSave={handleSave}
                mode={modalMode}
                lookupData={lookupData}
                currentOffcode={currentOffcode}
                maxUid={maxUid}
            />
        </div>
    );
};

export default UserManagement;