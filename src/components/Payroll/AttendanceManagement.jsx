import React, { useState, useEffect, useCallback, useContext } from 'react';
import "./AttendanceManagement.css";
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
    ATTENDANCE_SEARCH: `${API_BASE1}/attendance/search`,
    ATTENDANCE_EMPLOYEES: `${API_BASE1}/attendance/employees`,
    ATTENDANCE_DEPARTMENTS: `${API_BASE1}/attendance/departments`,
    ATTENDANCE_DESIGNATIONS: `${API_BASE1}/attendance/designations`,
    ATTENDANCE_SHIFTS: `${API_BASE1}/attendance/shifts`,
    ATTENDANCE_UPDATE: `${API_BASE1}/attendance/update`,
    ATTENDANCE_SUMMARY: `${API_BASE1}/attendance/summary`,
    ATTENDANCE_EMPLOYEE_REPORT: `${API_BASE1}/attendance/employee-report`,
    ATTENDANCE_STATS: `${API_BASE1}/attendance/stats`,
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
    return String(value).trim();
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

// Helper function to safely convert to number
const safeNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
};

// Helper function to get number for editing
const getNumberValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toString();
};

const getDayStatusBadge = (status) => {
    const statusMap = {
        '001': { label: 'Working Day', class: 'am-working', icon: Icons.Briefcase },
        '002': { label: 'Absent', class: 'am-absent', icon: Icons.XCircle },
        '003': { label: 'Holiday', class: 'am-holiday', icon: Icons.Sun },
        '004': { label: 'Company Off', class: 'am-off', icon: Icons.CalendarOff }
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
 * Main Attendance Management Component
---------------------------- */
const AttendanceManagement = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    // State
    const [attendanceData, setAttendanceData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [viewMode, setViewMode] = useState('detailed'); // detailed, summary
    
    // Filters
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        employeeCode: '',
        departmentCode: '',
        designationCode: ''
    });
    
    const [localFilters, setLocalFilters] = useState({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        employeeCode: filters.employeeCode,
        departmentCode: filters.departmentCode,
        designationCode: filters.designationCode
    });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Edit mode
    const [editingCell, setEditingCell] = useState(null);
    
    // Load dropdown data on mount
    useEffect(() => {
        loadEmployees();
        loadDepartments();
        loadDesignations();
        loadShifts();
    }, []);
    
    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Attendance' })
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
    
    const loadEmployees = async () => {
        try {
            const resp = await fetch(`${API_CONFIG.ATTENDANCE_EMPLOYEES}?offcode=${currentOffcode}&isActive=True`);
            const data = await resp.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    };
    
    const loadDepartments = async () => {
        try {
            const resp = await fetch(`${API_CONFIG.ATTENDANCE_DEPARTMENTS}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) {
                setDepartments(data.data);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };
    
    const loadDesignations = async () => {
        try {
            const resp = await fetch(`${API_CONFIG.ATTENDANCE_DESIGNATIONS}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) {
                setDesignations(data.data);
            }
        } catch (error) {
            console.error('Error loading designations:', error);
        }
    };
    
    const loadShifts = async () => {
        try {
            const resp = await fetch(`${API_CONFIG.ATTENDANCE_SHIFTS}?offcode=${currentOffcode}`);
            const data = await resp.json();
            if (data.success) {
                setShifts(data.data);
            }
        } catch (error) {
            console.error('Error loading shifts:', error);
        }
    };
    
    const searchAttendance = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const payload = {
                offcode: currentOffcode,
                fromDate: localFilters.fromDate,
                toDate: localFilters.toDate,
                employeeCode: localFilters.employeeCode,
                departmentCode: localFilters.departmentCode,
                designationCode: localFilters.designationCode
            };
            
            const resp = await fetch(API_CONFIG.ATTENDANCE_SEARCH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await resp.json();
            
            if (data.success) {
                setAttendanceData(data.data);
                setSummary(data.summary);
                setTotalCount(data.count);
                setCurrentPage(1);
                setMessage(`Found ${data.count} records`);
                setTimeout(() => setMessage(''), 3000);
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
    
    const handleFilterChange = (field, value) => {
        setLocalFilters(prev => ({ ...prev, [field]: value }));
    };
    
    const applyFilters = () => {
        setFilters(localFilters);
        searchAttendance();
    };
    
    const handleRefresh = () => {
        searchAttendance();
        loadEmployees();
        loadDepartments();
        loadDesignations();
        loadShifts();
    };
    
    const handleCellEdit = async (record, field, value) => {
        if (!hasPermission || !hasPermission(menuId, 'edit')) {
            setError('You do not have permission to edit attendance');
            return;
        }
        
        setEditingCell(null);
        
        try {
            // Get the record ID - it could be Id, Pk, or other name
            const recordId = record.Id || record.Pk;
            
            if (!recordId) {
                setError('Record ID not found');
                return;
            }
            
            const payload = {
                id: recordId,
                field: field,
                value: value,
                user: currentUser
            };
            
            const resp = await fetch(API_CONFIG.ATTENDANCE_UPDATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await resp.json();
            
            if (data.success) {
                setMessage('Attendance updated successfully');
                setTimeout(() => setMessage(''), 2000);
                searchAttendance();
            } else {
                setError(data.error || 'Failed to update attendance');
            }
        } catch (error) {
            console.error('Update error:', error);
            setError('Failed to update attendance');
        }
    };
    
    const startEdit = (record, field, currentValue) => {
        const recordId = record.Id || record.Pk;
        setEditingCell({ recordId, field, value: currentValue });
    };
    
    const getEditableField = (record, field, value) => {
        const recordId = record.Id || record.Pk;
        const isEditing = editingCell?.recordId === recordId && editingCell?.field === field;
        
        if (isEditing) {
            return (
                <input
                    type={field === 'TotalWorkingHours' || field === 'LateHours' || field === 'OverTime' ? 'number' : 'text'}
                    value={editingCell.value}
                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                    onBlur={() => handleCellEdit(record, field, editingCell.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleCellEdit(record, field, editingCell.value);
                        }
                    }}
                    className="am-edit-input"
                    autoFocus
                    step={field === 'TotalWorkingHours' || field === 'LateHours' || field === 'OverTime' ? '0.01' : '1'}
                />
            );
        }
        
        // Format the display value safely
        let displayValue = value;
        if (field === 'TotalWorkingHours' || field === 'LateHours' || field === 'OverTime') {
            displayValue = safeNumber(value);
        } else if (field === 'Timein' || field === 'TimeOut') {
            displayValue = formatTimeForDisplay(value);
        }
        
        return (
            <div 
                className="am-cell-value"
                onClick={() => startEdit(record, field, getNumberValue(value))}
                title="Click to edit"
            >
                {displayValue !== null && displayValue !== undefined && displayValue !== '' ? displayValue : '-'}
                {hasPermission && hasPermission(menuId, 'edit') && <Icons.Edit size={12} className="am-edit-icon" />}
            </div>
        );
    };
    
    const renderAttendanceTable = () => {
        if (attendanceData.length === 0) {
            return (
                <div className="am-empty-table">
                    <Icons.Calendar size={48} />
                    <p>No attendance records found</p>
                    <p className="am-hint">Please adjust your search criteria and try again</p>
                </div>
            );
        }
        
        // Paginate data
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedData = attendanceData.slice(startIndex, startIndex + pageSize);
        
        return (
            <div className="am-table-wrapper">
                <table className="am-table">
                    <thead>
                        <tr>
                            <th>Shift</th>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>TWH</th>
                            <th>EIM</th>
                            <th>LIIM</th>
                            <th>EOM</th>
                            <th>ED</th>
                            <th>EM</th>
                            <th>Day Status</th>
                            <th>EA Status</th>
                            <th>ET Status</th>
                            <th>OTM</th>
                            <th>LH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(record => {
                            const shiftInfo = shifts.find(s => s.Code === record.ShiftCode);
                            const dayStatus = getDayStatusBadge(record.dayStatus);
                            const attStatus = getAttendanceStatusBadge(record.attStatus);
                            const DayStatusIcon = dayStatus.icon;
                            const AttStatusIcon = attStatus.icon;
                            
                            return (
                                <tr key={record.Id || record.Pk}>
                                    <td>{shiftInfo?.Name || record.ShiftCode}</td>
                                    <td>{formatDateForDisplay(record.attDate)}</td>
                                    <td>{record.attDayIN}</td>
                                    <td>{getEditableField(record, 'Timein', record.Timein)}</td>
                                    <td>{getEditableField(record, 'TimeOut', record.TimeOut)}</td>
                                    <td>{getEditableField(record, 'TotalWorkingHours', record.TotalWorkingHours)}</td>
                                    <td>{safeNumber(record.EarlyInMinute)}</td>
                                    <td>{safeNumber(record.LateHours_Minuts)}</td>
                                    <td>{safeNumber(record.LeaveEarlyMinute)}</td>
                                    <td>{safeNumber(record.LateInDeductionDay)}</td>
                                    <td>{safeNumber(record.ExcessMinute)}</td>
                                    <td className={`am-status-cell ${dayStatus.class}`}>
                                        <DayStatusIcon size={14} />
                                        <span>{dayStatus.label}</span>
                                    </td>
                                    <td className={`am-status-cell ${attStatus.class}`}>
                                        <AttStatusIcon size={14} />
                                        <span>{attStatus.label}</span>
                                    </td>
                                    <td>{record.attTimeStatus}</td>
                                    <td>{safeNumber(record.OverTime)}</td>
                                    <td>{safeNumber(record.LateHours)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };
    
    const renderSummaryView = () => {
        if (!summary) return null;
        
        return (
            <div className="am-summary-section">
                <div className="am-summary-grid">
                    <div className="am-summary-card">
                        <Icons.Users size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Total Employees</span>
                            <span className="am-summary-value">{summary.totalEmployees}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Calendar size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Total Days</span>
                            <span className="am-summary-value">{summary.totalDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.CheckCircle size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Present Days</span>
                            <span className="am-summary-value">{summary.presentDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.XCircle size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Absent Days</span>
                            <span className="am-summary-value">{summary.absentDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Sun size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Off Days</span>
                            <span className="am-summary-value">{summary.offDays}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Clock size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Total Working Hours</span>
                            <span className="am-summary-value">{safeNumber(summary.totalWorkingHours)}</span>
                        </div>
                    </div>
                    <div className="am-summary-card">
                        <Icons.Timer size={24} />
                        <div className="am-summary-info">
                            <span className="am-summary-label">Total Overtime</span>
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
    
    const renderLegend = () => {
        const legends = [
            { label: 'Present Days', class: 'am-present', icon: Icons.CheckCircle },
            { label: 'Absent Days', class: 'am-absent', icon: Icons.XCircle },
            { label: 'Off Days', class: 'am-off', icon: Icons.CalendarOff },
            { label: 'OverTime Min/Hour', class: 'am-overtime', icon: Icons.Timer },
            { label: 'Late Min/Hour', class: 'am-late', icon: Icons.Clock },
            { label: 'Late In/Min/Hour', class: 'am-late-in', icon: Icons.Clock },
            { label: 'Early Out Deviation', class: 'am-early', icon: Icons.Clock },
            { label: 'Missing In', class: 'am-missing', icon: Icons.HelpCircle },
            { label: 'Missing Out', class: 'am-missing', icon: Icons.HelpCircle }
        ];
        
        return (
            <div className="am-legend-section">
                <h4>LEGENDS</h4>
                <div className="am-legend-grid">
                    {legends.map(legend => {
                        const LegendIcon = legend.icon;
                        return (
                            <div key={legend.label} className="am-legend-item">
                                <LegendIcon size={14} className={legend.class} />
                                <span>{legend.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    if (rightsLoading && !menuId) {
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
                </div>
            </header>
            
            <div className="am-toolbar">
                <div className="am-toolbar-group">
                    <button 
                        className={`am-toolbar-btn ${viewMode === 'detailed' ? 'am-active' : ''}`}
                        onClick={() => setViewMode('detailed')}
                    >
                        <Icons.Table size={14} />
                        <span>Detailed View</span>
                    </button>
                    <button 
                        className={`am-toolbar-btn ${viewMode === 'summary' ? 'am-active' : ''}`}
                        onClick={() => setViewMode('summary')}
                    >
                        <Icons.ChartNoAxesColumnIncreasing size={14} />
                        <span>Summary View</span>
                    </button>
                </div>
                <div className="am-toolbar-group">
                    <button className="am-toolbar-btn" onClick={handleRefresh}>
                        <Icons.RefreshCw size={14} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
            
            <div className="am-filters-section">
                <h3>Search Criteria</h3>
                <div className="am-filters-grid">
                    <div className="am-filter-group">
                        <label>Employee</label>
                        <select 
                            className="am-select"
                            value={localFilters.employeeCode}
                            onChange={(e) => handleFilterChange('employeeCode', e.target.value)}
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.EmployeeCode} value={emp.EmployeeCode}>
                                    {emp.EmployeeCode} - {emp.EmployeeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="am-filter-group">
                        <label>Department</label>
                        <select 
                            className="am-select"
                            value={localFilters.departmentCode}
                            onChange={(e) => handleFilterChange('departmentCode', e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.Code} value={dept.Code}>
                                    {dept.Code} - {dept.Name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="am-filter-group">
                        <label>Designation</label>
                        <select 
                            className="am-select"
                            value={localFilters.designationCode}
                            onChange={(e) => handleFilterChange('designationCode', e.target.value)}
                        >
                            <option value="">All Designations</option>
                            {designations.map(des => (
                                <option key={des.Code} value={des.Code}>
                                    {des.Code} - {des.Name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="am-filter-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            value={localFilters.fromDate}
                            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                            className="am-input"
                        />
                    </div>
                    <div className="am-filter-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            value={localFilters.toDate}
                            onChange={(e) => handleFilterChange('toDate', e.target.value)}
                            className="am-input"
                        />
                    </div>
                </div>
                
                <div className="am-filters-actions">
                    <button className="am-btn am-btn-primary" onClick={applyFilters} disabled={isLoading}>
                        {isLoading ? <Icons.Loader size={14} className="am-spin" /> : <Icons.Search size={14} />}
                        Search
                    </button>
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
            
            <div className="am-content">
                {viewMode === 'summary' && renderSummaryView()}
                
                {viewMode === 'detailed' && renderAttendanceTable()}
                
                {totalPages > 1 && viewMode === 'detailed' && (
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
                
                {renderLegend()}
            </div>
        </div>
    );
};

export default AttendanceManagement;