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
    GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
};

// Screen name constant - Make sure this matches exactly with database
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

    return {
        ...context,
        credentials,
        uid,
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
    const match = statusMap[status] || { label: status || 'N/A', class: 'am-default', icon: Icons.HelpCircle };
    return match;
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
    const match = statusMap[status] || { label: status || 'N/A', class: 'am-default', icon: Icons.HelpCircle };
    return match;
};

/* ---------------------------
 * Editable Cell Component
---------------------------- */
/* ---------------------------
 * Editable Cell Component
---------------------------- */
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
        // For time fields, extract just the time part (HH:MM)
        if (field === 'Timein' || field === 'TimeOut') {
            if (value) {
                try {
                    const date = new Date(value);
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    setEditValue(`${hours}:${minutes}`);
                } catch {
                    setEditValue('');
                }
            } else {
                setEditValue('');
            }
        } else {
            setEditValue(getNumberValue(value));
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSave = () => {
        setIsEditing(false);
        let saveValue = editValue;

        if ((field === 'Timein' || field === 'TimeOut')) {
            // Validate and format time
            if (saveValue && saveValue.trim()) {
                // Remove any AM/PM and extra spaces
                let cleanValue = saveValue.trim().toUpperCase().replace(/\s/g, '');

                // Handle AM/PM
                let hour = 0;
                let minute = 0;

                if (cleanValue.includes('AM') || cleanValue.includes('PM')) {
                    let isPM = cleanValue.includes('PM');
                    let timePart = cleanValue.replace('AM', '').replace('PM', '');
                    let parts = timePart.split(':');
                    hour = parseInt(parts[0]);
                    minute = parseInt(parts[1]) || 0;

                    if (isPM && hour !== 12) hour += 12;
                    if (!isPM && hour === 12) hour = 0;
                } else {
                    // 24-hour format
                    let parts = saveValue.split(':');
                    hour = parseInt(parts[0]) || 0;
                    minute = parseInt(parts[1]) || 0;
                }

                // Format as HH:MM
                saveValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Validate hour range
                if (hour < 0 || hour > 23) {
                    if (onError) onError('Invalid hour. Please use 0-23');
                    return;
                }
                if (minute < 0 || minute > 59) {
                    if (onError) onError('Invalid minute. Please use 0-59');
                    return;
                }
            } else {
                saveValue = '';
            }

            const currentTime = formatTimeForDisplay(value);
            if (saveValue !== currentTime) {
                onSave(record, field, saveValue);
            }
        } else if (saveValue !== getNumberValue(value)) {
            onSave(record, field, saveValue);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    let displayValue = value;
    if (field === 'TotalWorkingHours' || field === 'LateHours' || field === 'OverTime') {
        displayValue = safeNumber(value);
    } else if (field === 'Timein' || field === 'TimeOut') {
        displayValue = formatTimeForDisplay(value);
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
                placeholder={field === 'Timein' || field === 'TimeOut' ? "HH:MM" : "0.00"}
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
 * Main Attendance Management Component
---------------------------- */
const AttendanceManagement = () => {
    const { credentials, uid, offcode: authOffcode } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = useMemo(() => authOffcode || credentials?.offcode || '0101', [authOffcode, credentials]);
    const currentUser = useMemo(() => credentials?.username || 'SYSTEM', [credentials]);

    // State
    const [attendanceData, setAttendanceData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [years, setYears] = useState([]);
    const [months, setMonths] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [yearlySummary, setYearlySummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showChart, setShowChart] = useState(true);
    const [viewType, setViewType] = useState('month');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [menuId, setMenuId] = useState(null);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [filters, setFilters] = useState({
        selectedYear: '',
        selectedYearCode: '',
        selectedMonth: '',
        selectedMonthCode: '',
        employeeCode: '',
        fromDate: '',
        toDate: ''
    });

    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState({
        departmentName: '',
        designationName: '',
        shiftName: '',
        employeeName: ''
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Check if user has edit permission - with proper menuId
    const hasEditPermission = useMemo(() => {
        if (!menuId) return false;
        const hasEdit = hasPermission && hasPermission(menuId, 'edit');
        console.log(`Permission check - Menu: ${menuId}, Edit permission: ${hasEdit}`);
        return hasEdit;
    }, [hasPermission, menuId]);

    // Load screen config to get menu ID
    useEffect(() => {
        const loadScreenConfig = async () => {
            setIsMenuLoading(true);
            try {
                console.log(`Loading screen config for: ${SCREEN_NAME}`);
                const response = await authFetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Attendance' })
                });
                const data = await response.json();
                if (data.success && data.screen) {
                    const loadedMenuId = String(data.screen.id);
                    setMenuId(loadedMenuId);
                    console.log('✅ Menu ID loaded:', loadedMenuId);
                } else {
                    console.warn('Screen config not found, using default menu ID');
                    setMenuId('0702000010'); // Default menu ID for attendance
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
                setMenuId('0702000010'); // Default menu ID for attendance
            } finally {
                setIsMenuLoading(false);
            }
        };

        loadScreenConfig();
    }, []);

    // Load years on mount
    useEffect(() => {
        loadYears();
    }, []);

    // Load months when year changes
    useEffect(() => {
        if (filters.selectedYearCode && viewType === 'month' && !isInitialLoad) {
            loadMonths(filters.selectedYearCode);
        }
    }, [filters.selectedYearCode, viewType, isInitialLoad]);

    // Load employees when year changes
    useEffect(() => {
        if (filters.selectedYearCode && !isInitialLoad) {
            loadEmployees();
        }
    }, [filters.selectedYearCode, isInitialLoad]);

    // Load monthly stats when employee changes
    useEffect(() => {
        if (filters.employeeCode && filters.selectedYearCode && !isInitialLoad) {
            loadMonthlyStats();
        }
    }, [filters.employeeCode, filters.selectedYearCode, isInitialLoad]);

    // Auto-search when employee is selected and dates are available
    useEffect(() => {
        if (filters.employeeCode && filters.fromDate && filters.toDate && !isInitialLoad) {
            searchAttendance();
        }
    }, [filters.employeeCode, filters.fromDate, filters.toDate, isInitialLoad]);

    const loadYears = async () => {
        try {
            setIsLoading(true);
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_YEARS}?offcode=${currentOffcode}`);
            const data = await resp.json();

            if (data.success) {
                setYears(data.data);
                if (data.currentYear) {
                    const fromDate = data.currentYear.YSDate ? data.currentYear.YSDate.split('T')[0] : '';
                    const toDate = data.currentYear.YEDate ? data.currentYear.YEDate.split('T')[0] : '';
                    setFilters(prev => ({
                        ...prev,
                        selectedYear: data.currentYear.YName,
                        selectedYearCode: data.currentYear.YCode,
                        fromDate: fromDate,
                        toDate: toDate
                    }));

                    // Load months for the selected year
                    await loadMonths(data.currentYear.YCode);
                } else if (data.data && data.data.length > 0) {
                    const firstYear = data.data[0];
                    const fromDate = firstYear.YSDate ? firstYear.YSDate.split('T')[0] : '';
                    const toDate = firstYear.YEDate ? firstYear.YEDate.split('T')[0] : '';
                    setFilters(prev => ({
                        ...prev,
                        selectedYear: firstYear.YName,
                        selectedYearCode: firstYear.YCode,
                        fromDate: fromDate,
                        toDate: toDate
                    }));

                    // Load months for the selected year
                    await loadMonths(firstYear.YCode);
                }
            } else {
                setError(data.error || 'Failed to load years');
            }
        } catch (error) {
            console.error('Error loading years:', error);
            setError('Failed to load years: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMonths = async (ycode) => {
        try {
            const resp = await authFetch(`${API_CONFIG.ATTENDANCE_MONTHS}?ycode=${ycode}&offcode=${currentOffcode}`);
            const data = await resp.json();

            if (data.success) {
                setMonths(data.data);
                if (data.currentMonth && viewType === 'month') {
                    const fromDate = data.currentMonth.SDate ? data.currentMonth.SDate.split('T')[0] : '';
                    const toDate = data.currentMonth.EDate ? data.currentMonth.EDate.split('T')[0] : '';
                    setFilters(prev => ({
                        ...prev,
                        selectedMonth: data.currentMonth.PName,
                        selectedMonthCode: data.currentMonth.PCode,
                        fromDate: fromDate,
                        toDate: toDate
                    }));
                } else if (data.data && data.data.length > 0 && viewType === 'month') {
                    const firstMonth = data.data[0];
                    const fromDate = firstMonth.SDate ? firstMonth.SDate.split('T')[0] : '';
                    const toDate = firstMonth.EDate ? firstMonth.EDate.split('T')[0] : '';
                    setFilters(prev => ({
                        ...prev,
                        selectedMonth: firstMonth.PName,
                        selectedMonthCode: firstMonth.PCode,
                        fromDate: fromDate,
                        toDate: toDate
                    }));
                }

                // After loading months, set initial load to false
                setIsInitialLoad(false);
            } else {
                setError(data.error || 'Failed to load months');
            }
        } catch (error) {
            console.error('Error loading months:', error);
            setError('Failed to load months: ' + error.message);
        }
    };

    const loadEmployees = async () => {
        try {
            let url = `${API_CONFIG.ATTENDANCE_EMPLOYEES}?offcode=${currentOffcode}`;
            const resp = await authFetch(url);
            const data = await resp.json();

            if (data.success && data.data && data.data.length > 0) {
                setEmployees(data.data);
                if (!filters.employeeCode) {
                    const firstEmployee = data.data[0];
                    setFilters(prev => ({
                        ...prev,
                        employeeCode: firstEmployee.EmployeeCode
                    }));
                    await getEmployeeDetails(firstEmployee.EmployeeCode);
                } else {
                    const currentEmpExists = data.data.some(emp => emp.EmployeeCode === filters.employeeCode);
                    if (!currentEmpExists && data.data.length > 0) {
                        const firstEmployee = data.data[0];
                        setFilters(prev => ({
                            ...prev,
                            employeeCode: firstEmployee.EmployeeCode
                        }));
                        await getEmployeeDetails(firstEmployee.EmployeeCode);
                    } else if (filters.employeeCode) {
                        await getEmployeeDetails(filters.employeeCode);
                    }
                }
                setShowChart(true);
            } else {
                setEmployees([]);
                setMessage('No employees found');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            setError('Failed to load employees: ' + error.message);
        }
    };

    const getEmployeeDetails = async (employeeCode) => {
        if (!employeeCode) return;

        try {
            const resp = await authFetch(API_CONFIG.ATTENDANCE_EMPLOYEE_DETAILS, {
                method: 'POST',
                body: JSON.stringify({ employeeCode, offcode: currentOffcode })
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
        } catch (error) {
            console.error('Error getting employee details:', error);
        }
    };

    const searchAttendance = async () => {
        if (!filters.fromDate || !filters.toDate || !filters.employeeCode) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const payload = {
                offcode: currentOffcode,
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                employeeCode: filters.employeeCode
            };

            const resp = await authFetch(API_CONFIG.ATTENDANCE_SEARCH, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            if (data.success) {
                setAttendanceData(data.data || []);
                setSummary(data.summary);
                setTotalCount(data.count || 0);
                setCurrentPage(1);
            } else {
                setError(data.error || 'Failed to load attendance');
            }
        } catch (error) {
            console.error('Search error:', error);
            setError('Failed to load attendance data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMonthlyStats = async () => {
        if (!filters.employeeCode || !filters.selectedYearCode) {
            return;
        }

        try {
            const resp = await authFetch(API_CONFIG.ATTENDANCE_MONTHLY_STATS, {
                method: 'POST',
                body: JSON.stringify({
                    offcode: currentOffcode,
                    employeeCode: filters.employeeCode,
                    yearCode: filters.selectedYearCode
                })
            });
            const data = await resp.json();
            if (data.success) {
                setMonthlyStats(data.data || []);
                setYearlySummary(data.summary);
            }
        } catch (error) {
            console.error('Error loading monthly stats:', error);
        }
    };

    const handleYearChange = (yearCode, yearName) => {
        const selectedYear = years.find(y => String(y.YCode) === String(yearCode));
        let fromDate = '';
        let toDate = '';

        if (selectedYear) {
            fromDate = selectedYear.YSDate ? selectedYear.YSDate.split('T')[0] : '';
            toDate = selectedYear.YEDate ? selectedYear.YEDate.split('T')[0] : '';
        }

        setFilters(prev => ({
            ...prev,
            selectedYear: yearName,
            selectedYearCode: yearCode,
            selectedMonth: '',
            selectedMonthCode: '',
            fromDate: fromDate,
            toDate: toDate,
            employeeCode: ''
        }));

        setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
        setMonthlyStats([]);
        setYearlySummary(null);
        setAttendanceData([]);
        setSummary(null);

        // Reload months for the new year
        loadMonths(yearCode);
    };

    const handleMonthChange = (monthCode, monthName, fromDate, toDate) => {
        setFilters(prev => ({
            ...prev,
            selectedMonth: monthName,
            selectedMonthCode: monthCode,
            fromDate: fromDate,
            toDate: toDate,
            employeeCode: ''
        }));

        setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
        setMonthlyStats([]);
        setYearlySummary(null);
        setAttendanceData([]);
        setSummary(null);

        // Reload employees for the new month/year
        loadEmployees();
    };

    const handleEmployeeChange = (employeeCode) => {
        setFilters(prev => ({ ...prev, employeeCode }));
        if (employeeCode) {
            getEmployeeDetails(employeeCode);
            setShowChart(true);
        } else {
            setSelectedEmployeeDetails({ departmentName: '', designationName: '', shiftName: '', employeeName: '' });
            setShowChart(false);
            setAttendanceData([]);
            setSummary(null);
        }
    };

    const handleViewTypeChange = (type) => {
        setViewType(type);

        if (type === 'year') {
            const selectedYear = years.find(y => String(y.YCode) === String(filters.selectedYearCode));
            if (selectedYear) {
                const fromDate = selectedYear.YSDate ? selectedYear.YSDate.split('T')[0] : '';
                const toDate = selectedYear.YEDate ? selectedYear.YEDate.split('T')[0] : '';
                setFilters(prev => ({
                    ...prev,
                    fromDate: fromDate,
                    toDate: toDate,
                    selectedMonth: '',
                    selectedMonthCode: ''
                }));
            }
        } else if (type === 'month' && filters.selectedMonthCode) {
            const selectedMonth = months.find(m => String(m.PCode) === String(filters.selectedMonthCode));
            if (selectedMonth) {
                const fromDate = selectedMonth.SDate ? selectedMonth.SDate.split('T')[0] : '';
                const toDate = selectedMonth.EDate ? selectedMonth.EDate.split('T')[0] : '';
                setFilters(prev => ({
                    ...prev,
                    fromDate: fromDate,
                    toDate: toDate
                }));
            }
        }

        setAttendanceData([]);
        setSummary(null);
    };

    const handleRefresh = () => {
        if (filters.employeeCode && filters.fromDate && filters.toDate) {
            searchAttendance();
            loadMonthlyStats();
        } else if (!filters.employeeCode) {
            setError('Please select an employee first');
            setTimeout(() => setError(''), 3000);
        } else if (!filters.fromDate || !filters.toDate) {
            setError('Please select year and period first');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleCellEdit = async (record, field, value) => {
        if (!hasEditPermission) {
            setError('You do not have permission to edit attendance records. Please contact administrator.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // For time fields, send just the time string
        let saveValue = value;
        if (field === 'Timein' || field === 'TimeOut') {
            // Ensure format is HH:MM
            if (saveValue && !saveValue.includes(':')) {
                // If it's just a number like "5", convert to "05:00"
                const hour = parseInt(saveValue).toString().padStart(2, '0');
                saveValue = `${hour}:00`;
            }
            // Ensure minutes have two digits
            if (saveValue && saveValue.includes(':')) {
                const parts = saveValue.split(':');
                if (parts.length >= 2) {
                    const hour = parts[0].padStart(2, '0');
                    const minute = parts[1].padStart(2, '0').substring(0, 2);
                    saveValue = `${hour}:${minute}`;
                }
            }
            console.log('Sending time value:', saveValue);
        }

        try {
            const payload = {
                id: record.Id,
                field: field,
                value: saveValue,
                employeeCode: record.EmployeeCode,
                attDate: record.attDate,
                user: currentUser
            };

            console.log('Sending update payload:', payload);

            const resp = await authFetch(API_CONFIG.ATTENDANCE_UPDATE, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            if (data.success) {
                setMessage('Attendance updated successfully');
                setTimeout(() => setMessage(''), 2000);
                searchAttendance();
                if (filters.employeeCode) {
                    loadMonthlyStats();
                }
            } else {
                setError(data.error || 'Failed to update attendance');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error) {
            console.error('Update error:', error);
            setError('Failed to update attendance: ' + error.message);
            setTimeout(() => setError(''), 3000);
        }
    };;

    const renderChart = () => {
        if (!showChart || monthlyStats.length === 0 || !filters.employeeCode) return null;

        const barChartData = {
            labels: monthlyStats.map(item => item.MonthName),
            datasets: [
                {
                    label: 'Present Days',
                    data: monthlyStats.map(item => item.PresentDays),
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: '#22c55e',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Absent Days',
                    data: monthlyStats.map(item => item.AbsentDays),
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Off Days',
                    data: monthlyStats.map(item => item.OffDays),
                    backgroundColor: 'rgba(100, 116, 139, 0.7)',
                    borderColor: '#64748b',
                    borderWidth: 2,
                    borderRadius: 8,
                }
            ]
        };

        const pieChartData = {
            labels: ['Present Days', 'Absent Days', 'Off Days'],
            datasets: [{
                data: [
                    yearlySummary?.presentDays || 0,
                    yearlySummary?.absentDays || 0,
                    yearlySummary?.offDays || 0
                ],
                backgroundColor: ['#22c55e', '#ef4444', '#64748b'],
                borderColor: 'white',
                borderWidth: 3,
            }]
        };

        const barOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: `${selectedEmployeeDetails.employeeName || 'Employee'} - Monthly Attendance (${filters.selectedYear})`,
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Days' } },
                x: { title: { display: true, text: 'Months' } }
            }
        };

        const pieOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: `Yearly Summary - ${filters.selectedYear}`,
                    font: { size: 14, weight: 'bold' }
                }
            }
        };

        return (
            <div className="am-charts-section">
                <div className="am-charts-header">
                    <h3>
                        <Icons.BarChart size={20} />
                        Attendance Analytics Dashboard
                    </h3>
                    <button className="am-chart-toggle" onClick={() => setShowChart(!showChart)}>
                        {showChart ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                        {showChart ? 'Hide Charts' : 'Show Charts'}
                    </button>
                </div>
                <div className="am-charts-grid">
                    <div className="am-chart-card">
                        <h4>Monthly Attendance Overview</h4>
                        <div className="am-chart-container">
                            <Bar data={barChartData} options={barOptions} />
                        </div>
                    </div>
                    <div className="am-chart-card">
                        <h4>Yearly Summary</h4>
                        <div className="am-chart-container">
                            <Pie data={pieChartData} options={pieOptions} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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

        return (
            <div className="am-table-wrapper">
                {!hasEditPermission && (
                    <div className="am-readonly-banner">
                        <Icons.Lock size={14} />
                        <span>You have read-only access. To edit attendance records, please contact your administrator.</span>
                    </div>
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
                            <th>Day Status</th>
                            <th>Att Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(record => {
                            const dayStatus = getDayStatusBadge(record.dayStatus);
                            const attStatus = getAttendanceStatusBadge(record.attStatus);
                            const DayStatusIcon = dayStatus.icon;
                            const AttStatusIcon = attStatus.icon;

                            return (
                                <tr key={record.Id}>
                                    <td>{formatDateForDisplay(record.attDate)}</td>
                                    <td>{record.attDayIN}</td>
                                    <td>{record.ShiftName || record.ShiftCode}</td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.Timein}
                                            field="Timein"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.TimeOut}
                                            field="TimeOut"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.TotalWorkingHours}
                                            field="TotalWorkingHours"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.LateHours_Minuts}
                                            field="LateHours_Minuts"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.LeaveEarlyMinute}
                                            field="LeaveEarlyMinute"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className="am-editable-cell">
                                        <EditableCell
                                            value={record.OverTime}
                                            field="OverTime"
                                            record={record}
                                            onSave={handleCellEdit}
                                            canEdit={hasEditPermission}
                                            onError={setError}
                                        />
                                    </td>
                                    <td className={`am-status-cell ${dayStatus.class}`}>
                                        <DayStatusIcon size={14} />
                                        <span>{dayStatus.label}</span>
                                    </td>
                                    <td className={`am-status-cell ${attStatus.class}`}>
                                        <AttStatusIcon size={14} />
                                        <span>{attStatus.label}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSummaryCards = () => {
        if (!summary) return null;

        return (
            <div className="am-summary-section">
                <div className="am-summary-grid">
                    <div className="am-summary-card">
                        <Icons.Calendar size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Total Days</span>
                            <span className="am-summary-value">{summary.totalDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card am-present-card">
                        <Icons.CheckCircle size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Present Days</span>
                            <span className="am-summary-value">{summary.presentDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card am-absent-card">
                        <Icons.XCircle size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Absent Days</span>
                            <span className="am-summary-value">{summary.absentDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card am-off-card">
                        <Icons.Sun size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Off Days</span>
                            <span className="am-summary-value">{summary.offDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Clock size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Working Hours</span>
                            <span className="am-summary-value">{safeNumber(summary.totalWorkingHours)}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Timer size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Overtime</span>
                            <span className="am-summary-value">{safeNumber(summary.totalOvertimeHours)}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.AlertTriangle size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Late Minutes</span>
                            <span className="am-summary-value">{safeNumber(summary.totalLateMinutes)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderEmployeeInfo = () => {
        if (!filters.employeeCode) return null;

        return (
            <div className="am-employee-info">
                <div className="am-employee-avatar">
                    <Icons.User size={32} />
                </div>
                <div className="am-employee-details">
                    <h4>{selectedEmployeeDetails.employeeName || 'Employee'}</h4>
                    <div className="am-employee-meta">
                        {selectedEmployeeDetails.departmentName && (
                            <span><Icons.Building size={12} /> {selectedEmployeeDetails.departmentName}</span>
                        )}
                        {selectedEmployeeDetails.designationName && (
                            <span><Icons.BadgeCheck size={12} /> {selectedEmployeeDetails.designationName}</span>
                        )}
                        {selectedEmployeeDetails.shiftName && (
                            <span><Icons.Clock size={12} /> {selectedEmployeeDetails.shiftName}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Show loading state while rights are being loaded
    if (rightsLoading || isMenuLoading) {
        return (
            <div className="am-loading-container">
                <Icons.Loader size={32} className="am-spin" />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="am-container">
            <header className="am-header">
                <div className="am-header-left">
                    <Icons.Calendar size={24} className="am-header-icon" />
                    <div>
                        <h1>Attendance Management</h1>
                        <span className="am-header-subtitle">Track and manage employee attendance</span>
                    </div>
                </div>
                <div className="am-header-right">
                    <Icons.User size={14} />
                    <span>{currentUser}</span>
                    <span className="am-office-tag">{currentOffcode}</span>
                    {!hasEditPermission && (
                        <span className="am-readonly-badge">Read Only</span>
                    )}
                </div>
            </header>

            <div className="am-filters-section">
                <h3>Select Period & Employee</h3>
                <div className="am-filters-grid">
                    <div className="am-filter-group">
                        <label>Year</label>
                        <select
                            className="am-select"
                            value={filters.selectedYearCode || ''}
                            onChange={(e) => {
                                const selected = years.find(y => String(y.YCode) === e.target.value);
                                if (selected) handleYearChange(selected.YCode, selected.YName);
                            }}
                        >
                            <option value="">Select Year</option>
                            {years.map(year => (
                                <option key={year.YCode} value={year.YCode}>
                                    {year.YName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="am-filter-group">
                        <label>Period Type</label>
                        <div className="am-period-buttons">
                            <button
                                className={`am-period-btn ${viewType === 'month' ? 'active' : ''}`}
                                onClick={() => handleViewTypeChange('month')}
                            >
                                <Icons.Calendar size={14} />
                                Month
                            </button>
                            <button
                                className={`am-period-btn ${viewType === 'year' ? 'active' : ''}`}
                                onClick={() => handleViewTypeChange('year')}
                            >
                                <Icons.CalendarDays size={14} />
                                Year
                            </button>
                        </div>
                    </div>

                    {viewType === 'month' && (
                        <div className="am-filter-group">
                            <label>Month</label>
                            <select
                                className="am-select"
                                value={filters.selectedMonthCode || ''}
                                onChange={(e) => {
                                    const selected = months.find(m => String(m.PCode) === e.target.value);
                                    if (selected) {
                                        const fromDate = selected.SDate ? selected.SDate.split('T')[0] : '';
                                        const toDate = selected.EDate ? selected.EDate.split('T')[0] : '';
                                        handleMonthChange(selected.PCode, selected.PName, fromDate, toDate);
                                    }
                                }}
                                disabled={!filters.selectedYearCode}
                            >
                                <option value="">Select Month</option>
                                {months.map(month => (
                                    <option key={month.PCode} value={month.PCode}>
                                        {month.PName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="am-filter-group">
                        <label>Employee</label>
                        <select
                            className="am-select"
                            value={filters.employeeCode || ''}
                            onChange={(e) => handleEmployeeChange(e.target.value)}
                            disabled={employees.length === 0}
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.EmployeeCode} value={emp.EmployeeCode}>
                                    {emp.EmployeeCode} - {emp.EmployeeName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {renderEmployeeInfo()}

                <div className="am-filters-actions">
                    <button
                        className="am-btn am-btn-primary"
                        onClick={handleRefresh}
                        disabled={!filters.employeeCode || isLoading}
                    >
                        {isLoading ? <Icons.Loader size={14} className="am-spin" /> : <Icons.RefreshCw size={14} />}
                        {isLoading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                <div className="am-selected-period-info">
                    <small>
                        <Icons.Info size={12} />
                        Selected Period: {filters.fromDate && filters.toDate ? `${filters.fromDate} to ${filters.toDate}` : 'Not selected'}
                    </small>
                </div>
            </div>

            {error && (
                <div className="am-toast am-error">
                    <Icons.AlertCircle size={16} />
                    <span>{error}</span>
                    <button className="am-toast-close" onClick={() => setError('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            {message && (
                <div className="am-toast am-success">
                    <Icons.CheckCircle size={16} />
                    <span>{message}</span>
                    <button className="am-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            {renderSummaryCards()}
            {renderChart()}

            <div className="am-content">
                {renderAttendanceTable()}

                {totalPages > 1 && (
                    <div className="am-pagination">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                            totalItems={totalCount}
                            itemsPerPage={pageSize}
                            maxVisiblePages={5}
                            loading={isLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;