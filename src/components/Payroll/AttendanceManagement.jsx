import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import "./AttendanceManagement.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";
import * as Icons from 'lucide-react';
import Pagination from '../Common/Pagination';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const API_CONFIG = {
    BASE_URL: API_BASE1,
    ATTENDANCE_SEARCH: `${API_BASE1}/attendance/search`,
    ATTENDANCE_EMPLOYEES: `${API_BASE1}/attendance/employees`,
    ATTENDANCE_EMPLOYEE_DETAILS: `${API_BASE1}/attendance/employee-details`,
    ATTENDANCE_UPDATE: `${API_BASE1}/attendance/update`,
    ATTENDANCE_YEARS: `${API_BASE1}/attendance/years`,
    ATTENDANCE_MONTHS: `${API_BASE1}/attendance/months`,
    ATTENDANCE_MONTHLY_STATS: `${API_BASE1}/attendance/monthly-stats`,
    ATTENDANCE_SHIFTS: `${API_BASE1}/attendance/shifts`,
    GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
};

const SCREEN_NAME = "Attendance Management";

/* ---------------------------
 * Auth Helper Function
---------------------------- */
const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    const enhancedOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    try {
        const response = await fetch(url, enhancedOptions);
        if (response.status === 401) {
            console.error('Unauthorized request to:', url);
            throw new Error('Session expired. Please login again.');
        }
        return response;
    } catch (error) {
        console.error('Auth fetch error:', error);
        throw error;
    }
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
    const offcode = credentials?.offcode || '0101';
    return { ...context, credentials, uid, offcode };
};

/* ---------------------------
 * Utilities
---------------------------- */
const safeNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
};

const getNumberValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toString();
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch {
        return dateString;
    }
};

const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return timeString;
    }
};

// Convert decimal hours to HH:MM format
const decimalHoursToHM = (decimalHours) => {
    if (decimalHours === null || decimalHours === undefined || decimalHours === '') return '0:00';
    const num = parseFloat(decimalHours);
    if (isNaN(num)) return '0:00';
    
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Format total working hours for display
const formatTotalWorkingHours = (value) => {
    if (value === null || value === undefined || value === '') return '0:00';
    if (typeof value === 'string' && value.includes(':')) return value;
    return decimalHoursToHM(value);
};

const getDayStatusBadge = (status) => {
    const statusMap = {
        '001': { label: 'Working Day', class: 'am-working', icon: Icons.Briefcase },
        '002': { label: 'Absent', class: 'am-absent', icon: Icons.XCircle },
        '003': { label: 'Holiday', class: 'am-holiday', icon: Icons.Sun },
        '004': { label: 'Company Off', class: 'am-off', icon: Icons.CalendarOff },
        'Working Day': { label: 'Working Day', class: 'am-working', icon: Icons.Briefcase },
        'Absent': { label: 'Absent', class: 'am-absent', icon: Icons.XCircle },
        'Holiday': { label: 'Holiday', class: 'am-holiday', icon: Icons.Sun },
        'Company Off': { label: 'Company Off', class: 'am-off', icon: Icons.CalendarOff }
    };
    return statusMap[status] || { label: status || 'N/A', class: 'am-default', icon: Icons.HelpCircle };
};

const getAttendanceStatusBadge = (status) => {
    const statusMap = {
        '001': { label: 'Present', class: 'am-present', icon: Icons.CheckCircle },
        '002': { label: 'Absent', class: 'am-absent', icon: Icons.XCircle },
        '003': { label: 'Late In', class: 'am-late', icon: Icons.Clock },
        '004': { label: 'Early Out', class: 'am-early', icon: Icons.Clock },
        '005': { label: 'Missing In', class: 'am-missing', icon: Icons.HelpCircle },
        '006': { label: 'Missing Out', class: 'am-missing', icon: Icons.HelpCircle },
        '007': { label: 'Incomplete', class: 'am-incomplete', icon: Icons.AlertTriangle },
        '008': { label: 'On Leave', class: 'am-leave', icon: Icons.Calendar },
        '009': { label: 'ON Time', class: 'am-ontime', icon: Icons.CheckCircle }
    };
    return statusMap[status] || { label: status || 'N/A', class: 'am-default', icon: Icons.HelpCircle };
};

/* ---------------------------
 * Tab Component
---------------------------- */
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
    <button 
        className={`am-tab-btn ${active ? 'active' : ''}`}
        onClick={onClick}
    >
        <Icon size={18} />
        <span>{label}</span>
        {count !== undefined && <span className="am-tab-count">{count}</span>}
    </button>
);

/* ---------------------------
 * Shift Dropdown Component
---------------------------- */
const ShiftDropdown = ({ value, record, shifts, onSave, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedShift, setSelectedShift] = useState(value);
    const selectRef = useRef(null);

    const handleStartEdit = () => {
        if (!canEdit) return;
        setIsEditing(true);
        setTimeout(() => selectRef.current?.focus(), 50);
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSelectedShift(newValue);
        if (newValue !== value) {
            onSave(record, 'ShiftCode', newValue);
        }
        setIsEditing(false);
    };

    const handleBlur = () => setIsEditing(false);
    const getShiftName = (shiftCode) => {
        const shift = shifts.find(s => s.Code === shiftCode);
        return shift ? shift.Name : shiftCode;
    };

    if (isEditing) {
        return (
            <select
                ref={selectRef}
                value={selectedShift || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                className="am-shift-select"
                disabled={!canEdit}
            >
                <option value="">Select Shift</option>
                {shifts.map(shift => (
                    <option key={shift.Code} value={shift.Code}>
                        {shift.Code} - {shift.Name}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div
            className={`am-shift-cell ${canEdit ? 'editable' : 'readonly'}`}
            onClick={handleStartEdit}
            title={canEdit ? "Click to change shift" : "Read only"}
        >
            <span className="am-shift-code">{value || '-'}</span>
            <span className="am-shift-name">{getShiftName(value)}</span>
            {canEdit && <Icons.Edit size={12} className="am-edit-icon" />}
        </div>
    );
};

/* ---------------------------
 * Checkbox Cell Component
---------------------------- */
const CheckboxCell = ({ value, record, onSave, canEdit }) => {
    const [isChecked, setIsChecked] = useState(value === 1 || value === '1' || value === true);

    const handleChange = async (e) => {
        const newValue = e.target.checked;
        setIsChecked(newValue);
        if (canEdit) onSave(record, 'IsDeductionExempt', newValue);
    };

    return (
        <div className="am-checkbox-cell">
            <label className="am-checkbox-label">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="am-checkbox"
                />
                <span className="am-checkbox-text">
                    {isChecked ? 'Exempt' : 'Not Exempt'}
                </span>
            </label>
        </div>
    );
};

/* ---------------------------
 * Editable Cell Component
---------------------------- */
const EditableCell = ({ value, field, record, onSave, canEdit, onError }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    const handleStartEdit = () => {
        if (!canEdit) return;
        setIsEditing(true);
        if (field === 'Timein' || field === 'TimeOut') {
            if (value) {
                try {
                    const date = new Date(value);
                    setEditValue(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
                } catch { setEditValue(''); }
            } else { setEditValue(''); }
        } else if (field === 'TotalWorkingHours') {
            const currentValue = formatTotalWorkingHours(value);
            setEditValue(currentValue);
        } else {
            setEditValue(getNumberValue(value));
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSave = () => {
        setIsEditing(false);
        let saveValue = editValue;

        if (field === 'Timein' || field === 'TimeOut') {
            if (saveValue && saveValue.trim()) {
                let cleanValue = saveValue.trim().toUpperCase().replace(/\s/g, '');
                let hour = 0, minute = 0;

                if (cleanValue.includes('AM') || cleanValue.includes('PM')) {
                    let isPM = cleanValue.includes('PM');
                    let timePart = cleanValue.replace('AM', '').replace('PM', '');
                    let parts = timePart.split(':');
                    hour = parseInt(parts[0]);
                    minute = parseInt(parts[1]) || 0;
                    if (isPM && hour !== 12) hour += 12;
                    if (!isPM && hour === 12) hour = 0;
                } else {
                    let parts = saveValue.split(':');
                    hour = parseInt(parts[0]) || 0;
                    minute = parseInt(parts[1]) || 0;
                }

                saveValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                if (hour < 0 || hour > 23) { if (onError) onError('Invalid hour. Please use 0-23'); return; }
                if (minute < 0 || minute > 59) { if (onError) onError('Invalid minute. Please use 0-59'); return; }
            } else { saveValue = ''; }

            const currentTime = formatTimeForDisplay(value);
            if (saveValue !== currentTime) onSave(record, field, saveValue);
        } else if (field === 'TotalWorkingHours') {
            if (saveValue && saveValue.includes(':')) {
                const parts = saveValue.split(':');
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                saveValue = hours + (minutes / 60);
                saveValue = saveValue.toFixed(2);
            } else if (saveValue && !isNaN(saveValue)) {
                saveValue = parseFloat(saveValue).toFixed(2);
            } else {
                saveValue = 0;
            }
            
            const currentValue = parseFloat(value) || 0;
            if (parseFloat(saveValue) !== currentValue) {
                onSave(record, field, saveValue);
            }
        } else if (saveValue !== getNumberValue(value)) {
            onSave(record, field, saveValue);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSave();
        else if (e.key === 'Escape') setIsEditing(false);
    };

    let displayValue = value;
    if (field === 'TotalWorkingHours') {
        displayValue = formatTotalWorkingHours(value);
    } else if (field === 'Timein' || field === 'TimeOut') {
        displayValue = formatTimeForDisplay(value);
    } else if (field === 'LateHours_Minuts' || field === 'LeaveEarlyMinute' || field === 'OverTime') {
        displayValue = safeNumber(value);
    }

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyPress}
                className="am-edit-input"
                placeholder={field === 'Timein' || field === 'TimeOut' ? "HH:MM" : (field === 'TotalWorkingHours' ? "HH:MM" : "0.00")}
            />
        );
    }

    return (
        <div
            className={`am-cell-value ${canEdit ? 'editable' : 'readonly'}`}
            onClick={handleStartEdit}
            title={canEdit ? "Click to edit" : "No edit permission - Read only"}
        >
            {displayValue !== null && displayValue !== undefined && displayValue !== '' ? displayValue : '-'}
            {canEdit && <Icons.Edit size={12} className="am-edit-icon" />}
        </div>
    );
};

/* ---------------------------
 * Main Component
---------------------------- */
const AttendanceManagement = () => {
    const { credentials, uid, offcode: authOffcode } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = useMemo(() => authOffcode || credentials?.offcode || '0101', [authOffcode, credentials]);
    const currentUser = useMemo(() => credentials?.username || 'SYSTEM', [credentials]);

    // State
    const [activeTab, setActiveTab] = useState('summary');
    const [attendanceData, setAttendanceData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [years, setYears] = useState([]);
    const [months, setMonths] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [yearlySummary, setYearlySummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [viewType, setViewType] = useState('month');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [menuId, setMenuId] = useState(null);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        selectedYear: '', selectedYearCode: '', selectedMonth: '', selectedMonthCode: '',
        employeeCode: '', fromDate: '', toDate: ''
    });

    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState({
        departmentName: '', designationName: '', shiftName: '', employeeName: ''
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasEditPermission = useMemo(() => menuId && hasPermission && hasPermission(menuId, 'edit'), [hasPermission, menuId]);

    // Load screen config
    useEffect(() => {
        const loadScreenConfig = async () => {
            setIsMenuLoading(true);
            try {
                const response = await authFetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST', body: JSON.stringify({ screenName: 'Attendance' })
                });
                const data = await response.json();
                setMenuId(data.success && data.screen ? String(data.screen.id) : '0702000010');
            } catch (error) {
                console.error('Error loading screen config:', error);
                setMenuId('0702000010');
            } finally {
                setIsMenuLoading(false);
            }
        };
        loadScreenConfig();
    }, []);

    // Load data
    useEffect(() => { loadShifts(); loadYears(); }, []);
    useEffect(() => { if (filters.selectedYearCode && viewType === 'month' && !isInitialLoad) loadMonths(filters.selectedYearCode); }, [filters.selectedYearCode, viewType, isInitialLoad]);
    useEffect(() => { if (filters.selectedYearCode && !isInitialLoad) loadEmployees(); }, [filters.selectedYearCode, isInitialLoad]);
    useEffect(() => { if (filters.employeeCode && filters.selectedYearCode && !isInitialLoad) { loadMonthlyStats(); searchAttendance(); } }, [filters.employeeCode, filters.selectedYearCode, isInitialLoad]);

    const loadShifts = async () => {
        try {
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_SHIFTS}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) setShifts(data.data || []);
        } catch (error) { console.error('Error loading shifts:', error); }
    };

    const loadYears = async () => {
        try {
            setIsLoading(true);
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_YEARS}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) {
                setYears(data.data);
                if (data.currentYear) {
                    setFilters(prev => ({
                        ...prev,
                        selectedYear: data.currentYear.YName,
                        selectedYearCode: data.currentYear.YCode,
                        fromDate: data.currentYear.YSDate?.split('T')[0] || '',
                        toDate: data.currentYear.YEDate?.split('T')[0] || ''
                    }));
                    await loadMonths(data.currentYear.YCode);
                } else if (data.data?.length > 0) {
                    const firstYear = data.data[0];
                    setFilters(prev => ({
                        ...prev,
                        selectedYear: firstYear.YName,
                        selectedYearCode: firstYear.YCode,
                        fromDate: firstYear.YSDate?.split('T')[0] || '',
                        toDate: firstYear.YEDate?.split('T')[0] || ''
                    }));
                    await loadMonths(firstYear.YCode);
                }
            }
        } catch (error) { setError('Failed to load years: ' + error.message); }
        finally { setIsLoading(false); }
    };

    const loadMonths = async (ycode) => {
        try {
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_MONTHS}?ycode=${ycode}&offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) {
                setMonths(data.data);
                if (data.currentMonth && viewType === 'month') {
                    setFilters(prev => ({
                        ...prev,
                        selectedMonth: data.currentMonth.PName,
                        selectedMonthCode: data.currentMonth.PCode,
                        fromDate: data.currentMonth.SDate?.split('T')[0] || '',
                        toDate: data.currentMonth.EDate?.split('T')[0] || ''
                    }));
                } else if (data.data?.length > 0 && viewType === 'month') {
                    const firstMonth = data.data[0];
                    setFilters(prev => ({
                        ...prev,
                        selectedMonth: firstMonth.PName,
                        selectedMonthCode: firstMonth.PCode,
                        fromDate: firstMonth.SDate?.split('T')[0] || '',
                        toDate: firstMonth.EDate?.split('T')[0] || ''
                    }));
                }
                setIsInitialLoad(false);
            }
        } catch (error) { setError('Failed to load months: ' + error.message); }
    };

    const loadEmployees = async () => {
        try {
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_EMPLOYEES}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success && data.data?.length > 0) {
                setEmployees(data.data);
                if (!filters.employeeCode) {
                    const firstEmployee = data.data[0];
                    setFilters(prev => ({ ...prev, employeeCode: firstEmployee.EmployeeCode }));
                    await getEmployeeDetails(firstEmployee.EmployeeCode);
                } else if (filters.employeeCode) {
                    await getEmployeeDetails(filters.employeeCode);
                }
            } else {
                setEmployees([]);
                setMessage('No employees found');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) { setError('Failed to load employees: ' + error.message); }
    };

    const getEmployeeDetails = async (employeeCode) => {
        if (!employeeCode) return;
        try {
            const resp = await authFetch(API_CONFIG.ATTENDANCE_EMPLOYEE_DETAILS, {
                method: 'POST', body: JSON.stringify({ employeeCode, offcode: currentOffcode })
            });
            const data = await resp.json();
            if (data.success && data.data) {
                setSelectedEmployeeDetails({
                    departmentName: data.data.DepartmentName || '',
                    designationName: data.data.DesignationName || '',
                    shiftName: data.data.ShiftName || '',
                    employeeName: data.data.EmployeeName || ''
                });
            }
        } catch (error) { console.error('Error getting employee details:', error); }
    };

    const searchAttendance = async () => {
        if (!filters.fromDate || !filters.toDate || !filters.employeeCode) return;
        setIsLoading(true);
        try {
            const payload = { offcode: currentOffcode, fromDate: filters.fromDate, toDate: filters.toDate, employeeCode: filters.employeeCode };
            const resp = await authFetch(API_CONFIG.ATTENDANCE_SEARCH, { method: 'POST', body: JSON.stringify(payload) });
            const data = await resp.json();
            if (data.success) {
                setAttendanceData(data.data || []);
                setSummary(data.summary);
                setTotalCount(data.count || 0);
                setCurrentPage(1);
            } else { setError(data.error || 'Failed to load attendance'); }
        } catch (error) { setError('Failed to load attendance data'); }
        finally { setIsLoading(false); }
    };

    const loadMonthlyStats = async () => {
        if (!filters.employeeCode || !filters.selectedYearCode) return;
        try {
            const resp = await authFetch(API_CONFIG.ATTENDANCE_MONTHLY_STATS, {
                method: 'POST', body: JSON.stringify({ offcode: currentOffcode, employeeCode: filters.employeeCode, yearCode: filters.selectedYearCode })
            });
            const data = await resp.json();
            if (data.success) { setMonthlyStats(data.data || []); setYearlySummary(data.summary); }
        } catch (error) { console.error('Error loading monthly stats:', error); }
    };

    const handleYearChange = (yearCode, yearName) => {
        const selectedYear = years.find(y => String(y.YCode) === String(yearCode));
        setFilters(prev => ({
            ...prev, selectedYear: yearName, selectedYearCode: yearCode,
            selectedMonth: '', selectedMonthCode: '', employeeCode: '',
            fromDate: selectedYear?.YSDate?.split('T')[0] || '', toDate: selectedYear?.YEDate?.split('T')[0] || ''
        }));
        setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
        setMonthlyStats([]); setYearlySummary(null); setAttendanceData([]); setSummary(null);
        loadMonths(yearCode);
    };

    const handleMonthChange = (monthCode, monthName, fromDate, toDate) => {
        setFilters(prev => ({ ...prev, selectedMonth: monthName, selectedMonthCode: monthCode, fromDate, toDate, employeeCode: '' }));
        setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
        setMonthlyStats([]); setYearlySummary(null); setAttendanceData([]); setSummary(null);
        loadEmployees();
    };

    const handleEmployeeChange = (employeeCode) => {
        setFilters(prev => ({ ...prev, employeeCode }));
        if (employeeCode) getEmployeeDetails(employeeCode);
        else {
            setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
            setAttendanceData([]); setSummary(null);
        }
    };

    const handleViewTypeChange = (type) => {
        setViewType(type);
        if (type === 'year') {
            const selectedYear = years.find(y => String(y.YCode) === String(filters.selectedYearCode));
            if (selectedYear) {
                setFilters(prev => ({ ...prev, fromDate: selectedYear.YSDate?.split('T')[0] || '', toDate: selectedYear.YEDate?.split('T')[0] || '', selectedMonth: '', selectedMonthCode: '' }));
            }
        } else if (type === 'month' && filters.selectedMonthCode) {
            const selectedMonth = months.find(m => String(m.PCode) === String(filters.selectedMonthCode));
            if (selectedMonth) {
                setFilters(prev => ({ ...prev, fromDate: selectedMonth.SDate?.split('T')[0] || '', toDate: selectedMonth.EDate?.split('T')[0] || '' }));
            }
        }
        setAttendanceData([]); setSummary(null);
    };

    const handleRefresh = () => {
        if (filters.employeeCode && filters.fromDate && filters.toDate) { searchAttendance(); loadMonthlyStats(); }
        else if (!filters.employeeCode) setError('Please select an employee first');
        else if (!filters.fromDate || !filters.toDate) setError('Please select year and period first');
        setTimeout(() => setError(''), 3000);
    };

    const handleCellEdit = async (record, field, value) => {
        if (!hasEditPermission) {
            setError('You do not have permission to edit attendance records.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        let saveValue = value;
        if (field === 'Timein' || field === 'TimeOut') {
            if (saveValue && !saveValue.includes(':')) saveValue = `${parseInt(saveValue).toString().padStart(2, '0')}:00`;
            if (saveValue && saveValue.includes(':')) {
                const parts = saveValue.split(':');
                saveValue = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0').substring(0, 2)}`;
            }
        } else if (field === 'TotalWorkingHours') {
            if (saveValue && saveValue.includes(':')) {
                const parts = saveValue.split(':');
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                saveValue = hours + (minutes / 60);
                saveValue = saveValue.toFixed(2);
            }
        }
        try {
            const payload = { id: record.Id, field, value: saveValue, employeeCode: record.EmployeeCode, attDate: record.attDate, user: currentUser };
            const resp = await authFetch(API_CONFIG.ATTENDANCE_UPDATE, { method: 'POST', body: JSON.stringify(payload) });
            const data = await resp.json();
            if (data.success) {
                setMessage('Attendance updated successfully');
                setTimeout(() => setMessage(''), 2000);
                searchAttendance();
                if (filters.employeeCode) loadMonthlyStats();
            } else { setError(data.error || 'Failed to update attendance'); }
        } catch (error) { setError('Failed to update attendance: ' + error.message); }
        setTimeout(() => setError(''), 3000);
    };

    // Format working hours for summary cards
    const formatWorkingHours = (decimalHours) => {
        if (!decimalHours && decimalHours !== 0) return '0:00';
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    // Chart Configurations - Blue Theme
    const barChartData = {
        labels: monthlyStats.map(item => item.MonthName),
        datasets: [
            { label: 'Present Days', data: monthlyStats.map(item => item.PresentDays), backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: '#2563eb', borderWidth: 2, borderRadius: 8 },
            { label: 'Absent Days', data: monthlyStats.map(item => item.AbsentDays), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#dc2626', borderWidth: 2, borderRadius: 8 },
            { label: 'Off Days', data: monthlyStats.map(item => item.OffDays), backgroundColor: 'rgba(100, 116, 139, 0.7)', borderColor: '#475569', borderWidth: 2, borderRadius: 8 }
        ]
    };

    const pieChartData = {
        labels: ['Present Days', 'Absent Days', 'Off Days'],
        datasets: [{ data: [yearlySummary?.presentDays || 0, yearlySummary?.absentDays || 0, yearlySummary?.offDays || 0], backgroundColor: ['#3b82f6', '#ef4444', '#64748b'], borderColor: 'white', borderWidth: 3 }]
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { size: 12, weight: 'bold' }, color: '#1e293b' } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        let value = context.raw;
                        return `${label}: ${value} days`;
                    }
                }
            }
        },
        scales: {
            y: { title: { display: true, text: 'Days', font: { weight: 'bold' }, color: '#475569' }, ticks: { color: '#334155' } },
            x: { title: { display: true, text: 'Months', font: { weight: 'bold' }, color: '#475569' }, ticks: { color: '#334155' } }
        }
    };

    const renderFilters = () => (
        <div className="am-filters-section">
            <h3>Select Period & Employee</h3>
            <div className="am-filters-grid">
                <div className="am-filter-group">
                    <label>Year</label>
                    <select className="am-select" value={filters.selectedYearCode || ''} onChange={(e) => {
                        const selected = years.find(y => String(y.YCode) === e.target.value);
                        if (selected) handleYearChange(selected.YCode, selected.YName);
                    }}>
                        <option value="">Select Year</option>
                        {years.map(year => <option key={year.YCode} value={year.YCode}>{year.YName}</option>)}
                    </select>
                </div>
                <div className="am-filter-group">
                    <label>Period Type</label>
                    <div className="am-period-buttons">
                        <button className={`am-period-btn ${viewType === 'month' ? 'active' : ''}`} onClick={() => handleViewTypeChange('month')}><Icons.Calendar size={14} /> Month</button>
                        <button className={`am-period-btn ${viewType === 'year' ? 'active' : ''}`} onClick={() => handleViewTypeChange('year')}><Icons.CalendarDays size={14} /> Year</button>
                    </div>
                </div>
                {viewType === 'month' && (
                    <div className="am-filter-group">
                        <label>Month</label>
                        <select className="am-select" value={filters.selectedMonthCode || ''} onChange={(e) => {
                            const selected = months.find(m => String(m.PCode) === e.target.value);
                            if (selected) handleMonthChange(selected.PCode, selected.PName, selected.SDate?.split('T')[0] || '', selected.EDate?.split('T')[0] || '');
                        }} disabled={!filters.selectedYearCode}>
                            <option value="">Select Month</option>
                            {months.map(month => <option key={month.PCode} value={month.PCode}>{month.PName}</option>)}
                        </select>
                    </div>
                )}
                <div className="am-filter-group">
                    <label>Employee</label>
                    <select className="am-select" value={filters.employeeCode || ''} onChange={(e) => handleEmployeeChange(e.target.value)} disabled={employees.length === 0}>
                        <option value="">Select Employee</option>
                        {employees.map(emp => <option key={emp.EmployeeCode} value={emp.EmployeeCode}>{emp.EmployeeCode} - {emp.EmployeeName}</option>)}
                    </select>
                </div>
            </div>
            {filters.employeeCode && (
                <div className="am-employee-info">
                    <div className="am-employee-avatar"><Icons.User size={32} /></div>
                    <div className="am-employee-details">
                        <h4>{selectedEmployeeDetails.employeeName || 'Employee'}</h4>
                        <div className="am-employee-meta">
                            {selectedEmployeeDetails.departmentName && <span><Icons.Building size={12} /> {selectedEmployeeDetails.departmentName}</span>}
                            {selectedEmployeeDetails.designationName && <span><Icons.BadgeCheck size={12} /> {selectedEmployeeDetails.designationName}</span>}
                            {selectedEmployeeDetails.shiftName && <span><Icons.Clock size={12} /> {selectedEmployeeDetails.shiftName}</span>}
                        </div>
                    </div>
                </div>
            )}
            <div className="am-filters-actions">
                <button className="am-btn am-btn-primary" onClick={handleRefresh} disabled={!filters.employeeCode || isLoading}>
                    {isLoading ? <Icons.Loader size={14} className="am-spin" /> : <Icons.RefreshCw size={14} />}
                    {isLoading ? 'Loading...' : 'Refresh Data'}
                </button>
            </div>
            <div className="am-selected-period-info">
                <small><Icons.Info size={12} /> Selected Period: {filters.fromDate && filters.toDate ? `${filters.fromDate} to ${filters.toDate}` : 'Not selected'}</small>
            </div>
        </div>
    );

    const renderSummaryCards = () => {
        if (!summary) return null;
        
        const cards = [
            { icon: Icons.Calendar, label: 'Total Days', value: summary.totalDays, color: '#3b82f6' },
            { icon: Icons.CheckCircle, label: 'Present Days', value: summary.presentDays, color: '#22c55e' },
            { icon: Icons.XCircle, label: 'Absent Days', value: summary.absentDays, color: '#ef4444' },
            { icon: Icons.Sun, label: 'Off Days', value: summary.offDays, color: '#f59e0b' },
            { icon: Icons.Clock, label: 'Working Hours', value: formatWorkingHours(summary.totalWorkingHours), color: '#8b5cf6' },
            { icon: Icons.Timer, label: 'Overtime', value: formatWorkingHours(summary.totalOvertimeHours), color: '#06b6d4' },
            { icon: Icons.AlertTriangle, label: 'Late Minutes', value: safeNumber(summary.totalLateMinutes), color: '#ef4444' }
        ];
        
        return (
            <div className="am-summary-section">
                <div className="am-summary-header"><h3><Icons.TrendingUp size={18} /> Attendance Summary</h3></div>
                <div className="am-summary-grid">
                    {cards.map((card, idx) => (
                        <div key={idx} className="am-summary-card" style={{ borderTopColor: card.color }}>
                            <card.icon size={24} style={{ color: card.color }} />
                            <div className="am-summary-info">
                                <span className="am-summary-label">{card.label}</span>
                                <span className="am-summary-value">{card.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCharts = () => (
        <div className="am-charts-section">
            <div className="am-charts-header"><h3><Icons.BarChart size={20} /> Attendance Analytics</h3></div>
            <div className="am-charts-grid">
                <div className="am-chart-card">
                    <h4>Monthly Attendance Overview</h4>
                    <div className="am-chart-container">{monthlyStats.length > 0 ? <Bar data={barChartData} options={chartOptions} /> : <div className="am-chart-placeholder">No data available</div>}</div>
                </div>
                <div className="am-chart-card">
                    <h4>Yearly Summary</h4>
                    <div className="am-chart-container">{yearlySummary ? <Pie data={pieChartData} options={chartOptions} /> : <div className="am-chart-placeholder">No data available</div>}</div>
                </div>
            </div>
        </div>
    );

    const renderAttendanceTable = () => {
        if (attendanceData.length === 0) {
            return (
                <div className="am-empty-table">
                    <Icons.Calendar size={48} />
                    <p>No attendance records found</p>
                    <p className="am-hint">Please select an employee to view attendance</p>
                </div>
            );
        }
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedData = attendanceData.slice(startIndex, startIndex + pageSize);
        const lastRecord = attendanceData[attendanceData.length - 1];

        return (
            <div className="am-table-wrapper">
                {!hasEditPermission && (
                    <div className="am-readonly-banner"><Icons.Lock size={14} /><span>You have read-only access. To edit attendance records, please contact your administrator.</span></div>
                )}
                <table className="am-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Shift</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>TWH</th>
                            <th>Late (Min)</th>
                            <th>Early Out (Min)</th>
                            <th>OT (Hours)</th>
                            <th>Deduction Exempt</th>
                            <th>Day Status</th>
                            <th>Att Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(record => {
                            const dayStatus = getDayStatusBadge(record.dayStatus);
                            const attStatus = getAttendanceStatusBadge(record.attStatus);
                            const DayStatusIcon = dayStatus.icon, AttStatusIcon = attStatus.icon;
                            return (
                                <tr key={record.Id}>
                                    <td>{formatDateForDisplay(record.attDate)}</td>
                                    <td>{record.attDayIN}</td>
                                    <td><ShiftDropdown value={record.ShiftCode} record={record} shifts={shifts} onSave={handleCellEdit} canEdit={hasEditPermission} /></td>
                                    <td><EditableCell value={record.Timein} field="Timein" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><EditableCell value={record.TimeOut} field="TimeOut" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><EditableCell value={record.TotalWorkingHours} field="TotalWorkingHours" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><EditableCell value={record.LateHours_Minuts} field="LateHours_Minuts" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><EditableCell value={record.LeaveEarlyMinute} field="LeaveEarlyMinute" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><EditableCell value={record.OverTime} field="OverTime" record={record} onSave={handleCellEdit} canEdit={hasEditPermission} onError={setError} /></td>
                                    <td><CheckboxCell value={record.IsDeductionExempt} record={record} onSave={handleCellEdit} canEdit={hasEditPermission} /></td>
                                    <td className={`am-status-cell ${dayStatus.class}`}><DayStatusIcon size={14} /><span>{dayStatus.label}</span></td>
                                    <td className={`am-status-cell ${attStatus.class}`}><AttStatusIcon size={14} /><span>{attStatus.label}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {(lastRecord?.Editby || lastRecord?.EditDate) && (
                    <div className="am-audit-info"><Icons.Info size={12} /><span>Last edited by: {lastRecord.Editby || 'N/A'} on {lastRecord.EditDate ? new Date(lastRecord.EditDate).toLocaleString() : 'N/A'}</span></div>
                )}
                {totalPages > 1 && (
                    <div className="am-pagination"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} totalItems={totalCount} itemsPerPage={pageSize} maxVisiblePages={5} loading={isLoading} /></div>
                )}
            </div>
        );
    };

    if (rightsLoading || isMenuLoading) {
        return <div className="am-loading-container"><Icons.Loader size={32} className="am-spin" /><p>Loading...</p></div>;
    }

    return (
        <div className="am-container">
            <header className="am-header">
                <div className="am-header-left"><Icons.Calendar size={24} className="am-header-icon" /><div><h1>Attendance Management</h1><span className="am-header-subtitle">Track and manage employee attendance</span></div></div>
                <div className="am-header-right"><Icons.User size={14} /><span>{currentUser}</span><span className="am-office-tag">{currentOffcode}</span>{!hasEditPermission && <span className="am-readonly-badge">Read Only</span>}</div>
            </header>

            {renderFilters()}

            {/* Tab Navigation */}
            <div className="am-tabs">
                <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={Icons.TrendingUp} label="Attendance Summary" />
                <TabButton active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={Icons.BarChart} label="Analytics Charts" />
                <TabButton active={activeTab === 'records'} onClick={() => setActiveTab('records')} icon={Icons.Table} label="Attendance Records" count={totalCount} />
            </div>

            {/* Tab Content */}
            <div className="am-tab-content">
                {activeTab === 'summary' && renderSummaryCards()}
                {activeTab === 'charts' && renderCharts()}
                {activeTab === 'records' && renderAttendanceTable()}
            </div>

            {error && <div className="am-toast am-error"><Icons.AlertCircle size={16} /><span>{error}</span><button className="am-toast-close" onClick={() => setError('')}><Icons.X size={12} /></button></div>}
            {message && <div className="am-toast am-success"><Icons.CheckCircle size={16} /><span>{message}</span><button className="am-toast-close" onClick={() => setMessage('')}><Icons.X size={12} /></button></div>}
        </div>
    );
};

export default AttendanceManagement;