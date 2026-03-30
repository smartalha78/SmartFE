import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import "./MonthlyVariableAllowance.css";
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
        HEAD: 'HRMSVariableAllowanceHead',
        DETAIL: 'HRMSVariableAllowanceDet',
        EMPLOYEES: 'HrmsEmployee',
        ALLOWANCES: 'HRMSAllowanceType',
        BRANCH: 'comBranch'
    },
    GET_TABLE_DATA: `${API_BASE1}/get-table-data`,
    GET_VOUCHER_WITH_DETAILS: `${API_BASE1}/get-voucher-with-details`,
    INSERT_VARIABLE_ALLOWANCE: `${API_BASE1}/insert-variable-allowance`,
    UPDATE_VARIABLE_ALLOWANCE: `${API_BASE1}/update-variable-allowance`,
    POST_VARIABLE_ALLOWANCE: `${API_BASE1}/post-variable-allowance`,
    DELETE_VARIABLE_ALLOWANCE: `${API_BASE1}/delete-variable-allowance`,
    CANCEL_VARIABLE_ALLOWANCE: `${API_BASE1}/cancel-variable-allowance`
};

/* ---------------------------
 * Auth Hook
---------------------------- */
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    
    const credentials = context.credentials || {};
    const uid = credentials?.Uid || credentials?.uid || credentials?.userid || 
                credentials?.userId || credentials?.ID || localStorage.getItem("userUid") || '07';
    const bcode = credentials?.bcode || localStorage.getItem("userBcode") || '010101';
    const offcode = credentials?.offcode || '0101';
    
    return { 
        ...context, 
        credentials, 
        uid,
        bcode,
        offcode
    };
};

/* ---------------------------
 * Utilities
---------------------------- */
const normalizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
    return String(value).trim();
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return dateString;
    }
};

const formatDateTimeForDB = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0] + ' 00:00:00';
    } catch {
        return dateString;
    }
};

/* ---------------------------
 * Employee Row Component
---------------------------- */
const EmployeeRow = React.memo(({ index, data, onUpdate, onRemove, employees, allowances, canEdit }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(data.EmployeeCode || '');
    const [selectedAllowance, setSelectedAllowance] = useState(data.AllowancesCode || '');
    const [amount, setAmount] = useState(data.Amount || '0');
    const [percentage, setPercentage] = useState(data.Percentage || '0');
    const [usePercentage, setUsePercentage] = useState(parseFloat(data.Percentage || '0') > 0);

    useEffect(() => {
        setSelectedEmployee(data.EmployeeCode || '');
        setSelectedAllowance(data.AllowancesCode || '');
        setAmount(data.Amount || '0');
        setPercentage(data.Percentage || '0');
        setUsePercentage(parseFloat(data.Percentage || '0') > 0);
    }, [data]);

    const handleEmployeeChange = useCallback((e) => {
        const code = e.target.value;
        setSelectedEmployee(code);
        const employee = employees.find(emp => emp.code === code);
        
        onUpdate({
            EmployeeCode: code,
            EmployeeName: employee?.name || '',
            BasicPay: employee?.basicPay || 0,
            AllowancesCode: selectedAllowance,
            Amount: usePercentage ? '0' : amount,
            Percentage: usePercentage ? percentage : '0'
        });
    }, [employees, selectedAllowance, amount, percentage, usePercentage, onUpdate]);

    const handleAllowanceChange = useCallback((e) => {
        const code = e.target.value;
        setSelectedAllowance(code);
        const allowance = allowances.find(allow => allow.code === code);
        onUpdate({
            EmployeeCode: selectedEmployee,
            EmployeeName: data.EmployeeName,
            BasicPay: data.BasicPay,
            AllowancesCode: code,
            AllowanceName: allowance?.name || '',
            Amount: usePercentage ? '0' : amount,
            Percentage: usePercentage ? percentage : '0'
        });
    }, [allowances, selectedEmployee, data, amount, percentage, usePercentage, onUpdate]);

    const handleAmountChange = useCallback((e) => {
        const val = e.target.value;
        setAmount(val);
        setUsePercentage(false);
        onUpdate({
            EmployeeCode: selectedEmployee,
            EmployeeName: data.EmployeeName,
            BasicPay: data.BasicPay,
            AllowancesCode: selectedAllowance,
            AllowanceName: data.AllowanceName,
            Amount: val,
            Percentage: '0'
        });
    }, [selectedEmployee, data, selectedAllowance, onUpdate]);

    const handlePercentageChange = useCallback((e) => {
        const val = e.target.value;
        setPercentage(val);
        setUsePercentage(true);
        onUpdate({
            EmployeeCode: selectedEmployee,
            EmployeeName: data.EmployeeName,
            BasicPay: data.BasicPay,
            AllowancesCode: selectedAllowance,
            AllowanceName: data.AllowanceName,
            Amount: '0',
            Percentage: val
        });
    }, [selectedEmployee, data, selectedAllowance, onUpdate]);

    const calculatedAmount = usePercentage && data.BasicPay && percentage ? 
        (parseFloat(data.BasicPay) * parseFloat(percentage) / 100).toFixed(2) : null;

    return (
        <div className="mva-employee-row">
            <div className="mva-row-index">{index + 1}</div>
            <div className="mva-row-field">
                <select 
                    value={selectedEmployee} 
                    onChange={handleEmployeeChange} 
                    disabled={!canEdit} 
                    className="mva-select" 
                    required
                >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                        <option key={emp.code} value={emp.code}>{emp.display}</option>
                    ))}
                </select>
            </div>
            <div className="mva-row-field">
                <select 
                    value={selectedAllowance} 
                    onChange={handleAllowanceChange} 
                    disabled={!canEdit} 
                    className="mva-select" 
                    required
                >
                    <option value="">Select Allowance</option>
                    {allowances.map(allow => (
                        <option key={allow.code} value={allow.code}>{allow.display}</option>
                    ))}
                </select>
            </div>
            <div className="mva-row-field">
                <div className="mva-amount-type">
                    {usePercentage ? (
                        <>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={percentage} 
                                onChange={handlePercentageChange} 
                                disabled={!canEdit} 
                                className="mva-input" 
                                placeholder="%" 
                            />
                            {calculatedAmount && <span className="mva-calculated-amount">= {calculatedAmount}</span>}
                        </>
                    ) : (
                        <input 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={handleAmountChange} 
                            disabled={!canEdit} 
                            className="mva-input" 
                            placeholder="Amount" 
                        />
                    )}
                </div>
            </div>
            <div className="mva-row-actions">
                {canEdit && (
                    <button type="button" className="mva-remove-btn" onClick={() => onRemove(index)} title="Remove employee">
                        <Icons.Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
});

/* ---------------------------
 * Voucher Modal Component
---------------------------- */
const VoucherModal = React.memo(({ isOpen, onClose, voucher, onSave, onPost, onCancel, mode, lookupData, currentOffcode, currentUser, currentBcode }) => {
    const [formData, setFormData] = useState({
        vdate: new Date().toISOString().split('T')[0],
        Remarks: '',
        status: '1'
    });
    const [employees, setEmployees] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const { allowances, employees: employeeList } = lookupData;

    useEffect(() => {
        if (isOpen && voucher && (mode === 'edit' || mode === 'view')) {
            setFormData({
                vdate: formatDateForDisplay(voucher.vdate),
                Remarks: voucher.Remarks || '',
                status: voucher.status || '1',
                vno: voucher.vno,
                vockey: voucher.vockey
            });
            setEmployees(voucher.employees || []);
        } else if (isOpen && mode === 'new') {
            setFormData({
                vdate: new Date().toISOString().split('T')[0],
                Remarks: '',
                status: '1'
            });
            setEmployees([]);
        }
    }, [isOpen, voucher, mode]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddEmployee = useCallback(() => {
        setEmployees(prev => [...prev, {
            EmployeeCode: '', EmployeeName: '', BasicPay: '0',
            AllowancesCode: '', AllowanceName: '', Amount: '0', Percentage: '0'
        }]);
    }, []);

    const handleUpdateEmployee = useCallback((index, updatedData) => {
        setEmployees(prev => {
            const newEmployees = [...prev];
            newEmployees[index] = { ...newEmployees[index], ...updatedData };
            return newEmployees;
        });
    }, []);

    const handleRemoveEmployee = useCallback((index) => {
        setEmployees(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.Remarks.trim()) {
            alert('Please enter remarks');
            return;
        }

        if (employees.length === 0) {
            alert('Please add at least one employee');
            return;
        }

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            if (!emp.EmployeeCode) {
                alert(`Row ${i + 1}: Please select an employee`);
                return;
            }
            if (!emp.AllowancesCode) {
                alert(`Row ${i + 1}: Please select an allowance`);
                return;
            }
            const amount = parseFloat(emp.Amount || '0');
            const percentage = parseFloat(emp.Percentage || '0');
            if (amount <= 0 && percentage <= 0) {
                alert(`Row ${i + 1}: Please enter either amount or percentage`);
                return;
            }
        }

        setIsSubmitting(true);
        await onSave(formData, employees, mode);
        setIsSubmitting(false);
    }, [formData, employees, mode, onSave]);

    const handlePost = useCallback(async () => {
        if (!window.confirm('Are you sure you want to post this voucher? This action cannot be undone.')) return;
        setIsPosting(true);
        try {
            await onPost(voucher);
            onClose();
        } catch (error) {
            console.error('Post error:', error);
        } finally {
            setIsPosting(false);
        }
    }, [voucher, onPost, onClose]);

    const handleCancel = useCallback(async () => {
        if (!window.confirm('Are you sure you want to cancel this voucher? This action cannot be undone.')) return;
        setIsCancelling(true);
        try {
            await onCancel(voucher);
            onClose();
        } catch (error) {
            console.error('Cancel error:', error);
        } finally {
            setIsCancelling(false);
        }
    }, [voucher, onCancel, onClose]);

    const canEdit = mode !== 'view' && formData.status === '1';
    const isPosted = formData.status === '2';
    const isCancelled = formData.status === '3';

    if (!isOpen) return null;

    return (
        <div className="mva-modal-overlay">
            <div className="mva-modal-content mva-modal-large">
                <div className="mva-modal-header">
                    <h2>
                        {mode === 'new' ? 'New Variable Allowance' : mode === 'edit' ? 'Edit Variable Allowance' : 'View Variable Allowance'}
                        {formData.vno && <span className="mva-vno-badge">Voucher: {formData.vno}</span>}
                        {isPosted && <span className="mva-posted-badge">Posted</span>}
                        {isCancelled && <span className="mva-cancelled-badge">Cancelled</span>}
                    </h2>
                    <button className="mva-modal-close" onClick={onClose}><Icons.X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="mva-modal-form">
                    <div className="mva-modal-body">
                        <div className="mva-form-section">
                            <div className="mva-form-row">
                                <div className="mva-form-group">
                                    <label>Voucher Date <span className="required">*</span></label>
                                    <input 
                                        type="date" 
                                        name="vdate" 
                                        value={formData.vdate} 
                                        onChange={handleInputChange} 
                                        disabled={!canEdit} 
                                        className="mva-input" 
                                        required 
                                    />
                                </div>
                                <div className="mva-form-group full-width">
                                    <label>Remarks <span className="required">*</span></label>
                                    <textarea 
                                        name="Remarks" 
                                        value={formData.Remarks} 
                                        onChange={handleInputChange} 
                                        disabled={!canEdit} 
                                        className="mva-textarea" 
                                        rows="2" 
                                        required 
                                        placeholder="Enter voucher remarks..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mva-employees-section">
                            <div className="mva-employees-header">
                                <div className="mva-employees-title">
                                    <h3>Employee Allowances</h3>
                                    <span className="mva-count-badge">{employees.length} employees</span>
                                </div>
                                {canEdit && (
                                    <button type="button" className="mva-add-btn" onClick={handleAddEmployee}>
                                        <Icons.Plus size={14} /> Add Employee
                                    </button>
                                )}
                            </div>

                            <div className="mva-employees-list">
                                {employees.length === 0 ? (
                                    <div className="mva-empty-employees">
                                        <Icons.Users size={32} />
                                        <p>No employees added yet</p>
                                        {canEdit && (
                                            <button type="button" className="mva-add-btn" onClick={handleAddEmployee}>
                                                Add Employee
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mva-employees-grid-header">
                                            <div className="mva-header-index">#</div>
                                            <div className="mva-header-employee">Employee</div>
                                            <div className="mva-header-allowance">Allowance</div>
                                            <div className="mva-header-amount">Amount / %</div>
                                            <div className="mva-header-actions"></div>
                                        </div>
                                        {employees.map((emp, idx) => (
                                            <EmployeeRow
                                                key={idx}
                                                index={idx}
                                                data={emp}
                                                onUpdate={(updated) => handleUpdateEmployee(idx, updated)}
                                                onRemove={handleRemoveEmployee}
                                                employees={employeeList}
                                                allowances={allowances}
                                                canEdit={canEdit}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mva-modal-footer">
                        <button type="button" className="mva-btn mva-btn-outline" onClick={onClose}>
                            Close
                        </button>
                        
                        {canEdit && mode !== 'view' && (
                            <button type="submit" className="mva-btn mva-btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <Icons.Loader size={14} className="mva-spin" /> : <Icons.Save size={14} />}
                                {mode === 'new' ? 'Save Voucher' : 'Update Voucher'}
                            </button>
                        )}
                        
                        {!isPosted && !isCancelled && formData.status === '1' && (
                            <>
                                <button 
                                    type="button" 
                                    className="mva-btn mva-btn-success" 
                                    onClick={handlePost} 
                                    disabled={isPosting}
                                >
                                    {isPosting ? <Icons.Loader size={14} className="mva-spin" /> : <Icons.CheckCircle size={14} />}
                                    Post Voucher
                                </button>
                                <button 
                                    type="button" 
                                    className="mva-btn mva-btn-danger" 
                                    onClick={handleCancel} 
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? <Icons.Loader size={14} className="mva-spin" /> : <Icons.XCircle size={14} />}
                                    Cancel Voucher
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
});

/* ---------------------------
 * Main Component
---------------------------- */
const MonthlyVariableAllowance = () => {
    const { credentials, uid, bcode, offcode: authOffcode } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = useMemo(() => authOffcode || credentials?.offcode || '0101', [authOffcode, credentials]);
    const currentBcode = useMemo(() => bcode || credentials?.bcode || '010101', [bcode, credentials]);
    const currentUser = useMemo(() => credentials?.username || 'SYSTEM', [credentials]);

    const [vouchers, setVouchers] = useState([]);
    const [lookupData, setLookupData] = useState({ employees: [], allowances: [], branches: [] });
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = offcode ? `offcode = '${offcode}'` : '';
            if (additionalWhere) whereClause += whereClause ? ` AND ${additionalWhere}` : additionalWhere;

            const payload = { tableName, ...(whereClause && { where: whereClause }), usePagination: false };
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

    const fetchVouchers = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');
        try {
            let whereClause = `offcode = '${currentOffcode}' AND vtype = 'VRA'`;
            if (search) whereClause += ` AND (vno LIKE '%${search}%' OR Remarks LIKE '%${search}%')`;
            
            const payload = { 
                tableName: 'HRMSVariableAllowanceHead', 
                where: whereClause, 
                page, 
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
                setVouchers(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                if (lookupData.employees.length === 0) {
                    const [employeeData, allowanceData] = await Promise.all([
                        fetchTableData('HrmsEmployee', currentOffcode, "IsActive = 1"),
                        fetchTableData('HRMSAllowanceType', currentOffcode, "IsActive = 1")
                    ]);
                    
                    setLookupData({
                        employees: employeeData.map(emp => ({
                            code: normalizeValue(emp.Code || emp.EmployeeCode),
                            name: normalizeValue(emp.Name || emp.EmployeeName),
                            basicPay: parseFloat(emp.BasicPay || 0),
                            display: `${normalizeValue(emp.Code || emp.EmployeeCode)} - ${normalizeValue(emp.Name || emp.EmployeeName)}`
                        })).sort((a, b) => a.code.localeCompare(b.code)),
                        allowances: allowanceData.map(allow => ({
                            code: normalizeValue(allow.Code || allow.AllowanceCode),
                            name: normalizeValue(allow.Name || allow.AllowanceName),
                            display: `${normalizeValue(allow.Code || allow.AllowanceCode)} - ${normalizeValue(allow.Name || allow.AllowanceName)}`
                        })).sort((a, b) => a.code.localeCompare(b.code)),
                        branches: []
                    });
                }
            } else {
                setVouchers([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            setError(`Failed to load data: ${err.message}`);
            setVouchers([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentOffcode, fetchTableData, lookupData.employees.length]);

    const fetchVoucherWithDetails = useCallback(async (vockey, offcode) => {
        try {
            const resp = await fetch(API_CONFIG.GET_VOUCHER_WITH_DETAILS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vockey, offcode })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            
            if (data.success) {
                const voucherData = data.data;
                return {
                    ...voucherData.head,
                    employees: (voucherData.details || []).map(detail => ({
                        EmployeeCode: detail.EmployeeCode || '',
                        EmployeeName: detail.EmployeeName || '',
                        BasicPay: detail.BasicPay || '0',
                        AllowancesCode: detail.AllowancesCode || '',
                        AllowanceName: detail.AllowanceName || '',
                        Amount: detail.Amount !== null && detail.Amount !== undefined ? String(detail.Amount) : '0',
                        Percentage: detail.Percentage !== null && detail.Percentage !== undefined ? String(detail.Percentage) : '0'
                    }))
                };
            }
            return null;
        } catch (err) {
            console.error('Error fetching voucher details:', err);
            setError(`Failed to load voucher details: ${err.message}`);
            return null;
        }
    }, []);

    useEffect(() => {
        fetchVouchers(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchVouchers]);

    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(`${API_BASE1}/screen/get-config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Monthly Variable Allowance' })
                });
                const data = await response.json();
                if (data.success) setMenuId(data.screen.id);
            } catch (error) {
                console.error('Error loading screen config:', error);
            }
        };
        loadScreenConfig();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchTerm !== searchTerm) setSearchTerm(localSearchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearchTerm, searchTerm]);

    const handleNewVoucher = useCallback(() => {
        if (!hasPermission?.(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create vouchers');
            return;
        }
        setSelectedVoucher(null);
        setModalMode('new');
        setIsModalOpen(true);
    }, [hasPermission, menuId]);

    const handleViewVoucher = useCallback(async (voucher) => {
        if (!hasPermission?.(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view vouchers');
            return;
        }
        const voucherWithDetails = await fetchVoucherWithDetails(voucher.vockey, currentOffcode);
        if (voucherWithDetails) {
            setSelectedVoucher(voucherWithDetails);
            setModalMode('view');
            setIsModalOpen(true);
        } else {
            setMessage('❌ Failed to load voucher details');
        }
    }, [hasPermission, menuId, fetchVoucherWithDetails, currentOffcode]);

    const handleEditVoucher = useCallback(async (voucher) => {
        if (!hasPermission?.(menuId, 'edit')) {
            setMessage('⚠️ You do not have permission to edit vouchers');
            return;
        }
        if (voucher.status === '2') {
            setMessage('⚠️ Cannot edit a posted voucher');
            return;
        }
        if (voucher.status === '3') {
            setMessage('⚠️ Cannot edit a cancelled voucher');
            return;
        }
        const voucherWithDetails = await fetchVoucherWithDetails(voucher.vockey, currentOffcode);
        if (voucherWithDetails) {
            setSelectedVoucher(voucherWithDetails);
            setModalMode('edit');
            setIsModalOpen(true);
        } else {
            setMessage('❌ Failed to load voucher details');
        }
    }, [hasPermission, menuId, fetchVoucherWithDetails, currentOffcode]);

    const handleSave = useCallback(async (formData, employees, mode) => {
        setIsSaving(true);
        setMessage('');

        const headData = {
            vdate: formatDateTimeForDB(formData.vdate),
            Remarks: formData.Remarks,
            vtype: 'VRA',
            compcode: '01',
            createdby: currentUser,
            editby: currentUser,
            status: '1'
        };
        
        if (mode === 'edit') {
            headData.vno = formData.vno;
            headData.vockey = formData.vockey;
        }

        const details = employees.map(emp => ({
            data: {
                EmployeeCode: emp.EmployeeCode,
                EmployeeName: emp.EmployeeName,
                AllowancesCode: emp.AllowancesCode,
                AllowanceName: emp.AllowanceName,
                Amount: emp.Amount && parseFloat(emp.Amount) > 0 ? parseFloat(emp.Amount) : 0.0,
                Percentage: emp.Percentage && parseFloat(emp.Percentage) > 0 ? parseFloat(emp.Percentage) : 0.0,
                BasicPay: emp.BasicPay || '0',
                LocationCode: ''
            },
            tableName: 'HRMSVariableAllowanceDet'
        }));

        const payload = {
            head: { tableName: 'HRMSVariableAllowanceHead', data: headData },
            details,
            selectedBranch: currentBcode,
            offcode: currentOffcode
        };

        try {
            const endpoint = mode === 'new' ? API_CONFIG.INSERT_VARIABLE_ALLOWANCE : API_CONFIG.UPDATE_VARIABLE_ALLOWANCE;
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();
            
            if (result.success) {
                setMessage(`✅ Voucher ${mode === 'new' ? 'created' : 'updated'} successfully`);
                await fetchVouchers(currentPage, pageSize, searchTerm);
                setIsModalOpen(false);
            } else {
                setMessage(`❌ Save failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [currentUser, currentOffcode, currentBcode, currentPage, pageSize, searchTerm, fetchVouchers]);

    const handlePost = useCallback(async (voucher) => {
        setIsSaving(true);
        setMessage('');
        try {
            const payload = { 
                vockey: voucher.vockey, 
                offcode: currentOffcode, 
                bcode: currentBcode, 
                vtype: 'VRA', 
                ostatus: 1,
                posted_by: currentUser 
            };
            const resp = await fetch(API_CONFIG.POST_VARIABLE_ALLOWANCE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();
            
            if (result.success) {
                setMessage('✅ Voucher posted successfully');
                await fetchVouchers(currentPage, pageSize, searchTerm);
                setIsModalOpen(false);
            } else {
                setMessage(`❌ Post failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Post error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [currentOffcode, currentBcode, currentUser, currentPage, pageSize, searchTerm, fetchVouchers]);

    const handleCancel = useCallback(async (voucher) => {
        // Cancel button works without permission check
        if (voucher.status === '2') {
            setMessage('❌ Cannot cancel a posted voucher');
            return;
        }
        if (voucher.status === '3') {
            setMessage('❌ Voucher is already cancelled');
            return;
        }
        if (!window.confirm(`Are you sure you want to cancel voucher ${voucher.vno}? This action cannot be undone.`)) return;

        setIsSaving(true);
        setMessage('');
        try {
            const payload = { 
                vockey: voucher.vockey, 
                offcode: currentOffcode,
                cancelled_by: currentUser 
            };
            const resp = await fetch(API_CONFIG.CANCEL_VARIABLE_ALLOWANCE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();
            
            if (result.success) {
                setMessage('✅ Voucher cancelled successfully');
                await fetchVouchers(currentPage, pageSize, searchTerm);
                setIsModalOpen(false);
            } else {
                setMessage(`❌ Cancel failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Cancel error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [currentOffcode, currentUser, currentPage, pageSize, searchTerm, fetchVouchers]);

    const handleDelete = useCallback(async (voucher) => {
        if (!hasPermission?.(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete vouchers');
            return;
        }
        if (voucher.status === '2') {
            setMessage('❌ Cannot delete a posted voucher');
            return;
        }
        if (voucher.status === '3') {
            setMessage('❌ Cannot delete a cancelled voucher');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete voucher ${voucher.vno}?`)) return;

        setIsSaving(true);
        setMessage('');
        try {
            const payload = { vockey: voucher.vockey, offcode: currentOffcode };
            const resp = await fetch(API_CONFIG.DELETE_VARIABLE_ALLOWANCE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();
            
            if (result.success) {
                setMessage('✅ Voucher deleted successfully');
                if (vouchers.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    await fetchVouchers(currentPage, pageSize, searchTerm);
                }
            } else {
                setMessage(`❌ Delete failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [hasPermission, menuId, currentOffcode, vouchers.length, currentPage, pageSize, searchTerm, fetchVouchers]);

    const getStatusBadge = useCallback((status) => {
        if (status === '2') {
            return <span className="mva-status-badge mva-posted">Posted</span>;
        } else if (status === '3') {
            return <span className="mva-status-badge mva-cancelled">Cancelled</span>;
        } else {
            return <span className="mva-status-badge mva-draft">Draft</span>;
        }
    }, []);

    if (rightsLoading && !menuId) {
        return (
            <div className="mva-loading-container">
                <Icons.Loader size={24} className="mva-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="mva-container">
           
            <div className="mva-toolbar">
                <div className="mva-toolbar-group">
                    {hasPermission?.(menuId, 'add') && (
                        <button className="mva-toolbar-btn mva-primary" onClick={handleNewVoucher}>
                            <Icons.Plus size={14} /> <span>New Voucher</span>
                        </button>
                    )}
                </div>
                <div className="mva-toolbar-group">
                    <button className="mva-toolbar-btn" onClick={() => fetchVouchers(currentPage, pageSize, searchTerm)}>
                        <Icons.RefreshCw size={14} /> <span>Refresh</span>
                    </button>
                </div>
            </div>

            {(error || message) && (
                <div className={`mva-toast ${error ? 'mva-error' : message.includes('❌') ? 'mva-error' : message.includes('⚠️') ? 'mva-warning' : 'mva-success'}`}>
                    <div className="mva-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={16} />}
                        {message.includes('❌') && <Icons.AlertCircle size={16} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={16} />}
                        <span>{(error || message).replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="mva-toast-close" onClick={() => { setError(''); setMessage(''); }}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            <div className="mva-main-content">
                <div className="mva-search-bar">
                    <div className="mva-search-container">
                        <Icons.Search size={14} className="mva-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by voucher number or remarks..." 
                            value={localSearchTerm} 
                            onChange={e => setLocalSearchTerm(e.target.value)} 
                            className="mva-search-input" 
                        />
                    </div>
                </div>

                {isLoading && vouchers.length === 0 ? (
                    <div className="mva-loading-state">
                        <Icons.Loader size={24} className="mva-spin" />
                        <p>Loading vouchers...</p>
                    </div>
                ) : vouchers.length > 0 ? (
                    <>
                        <div className="mva-table-container">
                            <table className="mva-table">
                                <thead>
                                    <tr>
                                        <th>Voucher #</th>
                                        <th>Date</th>
                                        <th>Remarks</th>
                                        <th>Status</th>
                                        <th>Created By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vouchers.map(voucher => (
                                        <tr key={voucher.vockey}>
                                            <td>{voucher.vno}</td>
                                            <td>{formatDateForDisplay(voucher.vdate)}</td>
                                            <td>{voucher.Remarks || '-'}</td>
                                            <td>{getStatusBadge(voucher.status)}</td>
                                            <td>{voucher.createdby}</td>
                                            <td>
                                                <div className="mva-action-buttons">
                                                    {hasPermission?.(menuId, 'view') && (
                                                        <button 
                                                            className="mva-action-btn" 
                                                            onClick={() => handleViewVoucher(voucher)} 
                                                            title="View"
                                                        >
                                                            <Icons.Eye size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission?.(menuId, 'edit') && voucher.status === '1' && (
                                                        <button 
                                                            className="mva-action-btn" 
                                                            onClick={() => handleEditVoucher(voucher)} 
                                                            title="Edit"
                                                        >
                                                            <Icons.Edit size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission?.(menuId, 'post') && voucher.status === '1' && (
                                                        <button 
                                                            className="mva-action-btn mva-post" 
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to post voucher ${voucher.vno}?`)) {
                                                                    handlePost(voucher);
                                                                }
                                                            }} 
                                                            title="Post Voucher"
                                                        >
                                                            <Icons.CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                    {/* Cancel Button - Always shows for draft vouchers (status = 1) */}
                                                    {voucher.status === '1' && (
                                                        <button 
                                                            className="mva-action-btn mva-cancel" 
                                                            onClick={() => handleCancel(voucher)} 
                                                            title="Cancel Voucher"
                                                        >
                                                            <Icons.XCircle size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission?.(menuId, 'delete') && voucher.status === '1' && (
                                                        <button 
                                                            className="mva-action-btn mva-delete" 
                                                            onClick={() => handleDelete(voucher)} 
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
                            <div className="mva-pagination-wrapper">
                                <Pagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages} 
                                    onPageChange={setCurrentPage} 
                                    totalItems={totalCount} 
                                    itemsPerPage={pageSize} 
                                    maxVisiblePages={5} 
                                    loading={isLoading} 
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mva-empty-state">
                        <Icons.Gift size={32} className="mva-empty-icon" />
                        <h4>No vouchers found</h4>
                        <p>{localSearchTerm ? 'Try a different search term' : 'Click New Voucher to create one'}</p>
                    </div>
                )}
            </div>

            <VoucherModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                voucher={selectedVoucher} 
                onSave={handleSave} 
                onPost={handlePost}
                onCancel={handleCancel}
                mode={modalMode} 
                lookupData={lookupData} 
                currentOffcode={currentOffcode} 
                currentUser={currentUser}
                currentBcode={currentBcode}
            />
        </div>
    );
};

export default MonthlyVariableAllowance;