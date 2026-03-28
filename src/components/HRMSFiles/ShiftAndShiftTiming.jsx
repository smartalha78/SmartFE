import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import "./ShiftManagement.css";
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
        SHIFT_HEAD: 'HRMSShift',
        SHIFT_DETAIL: 'HRMSShiftTimeTable',
        BRANCH: 'comBranch'
    },
    GET_TABLE_DATA: `${API_BASE1}/get-table-data`,
    INSERT_RECORD: `${API_BASE1}/table/insert`,
    UPDATE_RECORD: `${API_BASE1}/table/update`,
    DELETE_RECORD: `${API_BASE1}/table/delete`,
    GET_SCREEN_CONFIG: `${API_BASE1}/screen/get-config`,
    INSERT_HEAD_DETAIL: `${API_BASE1}/insert-SThead-det`,
    UPDATE_HEAD_DETAIL: `${API_BASE1}/update-SThead-det`
};

/* ---------------------------
 * Auth Hook - FIXED for Uid (capital U)
---------------------------- */
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    const credentials = context.credentials || {};
    
    // Try multiple possible UID field names - credentials has Uid (capital U)
    const uid = credentials?.Uid ||  // Try capital U first
                credentials?.uid || 
                credentials?.userid || 
                credentials?.userId || 
                credentials?.ID || 
                localStorage.getItem("userUid") || 
                '';
    
    console.log('Auth Context - UID extracted:', uid);
    
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

const getCurrentDateTime = () => {
    return formatDateForDB(new Date());
};

const formatTimeForDisplay = (time) => {
    if (!time || time === '0:0' || time === '00:00') return '00:00';
    
    let formattedTime = time.toString().trim();
    if (formattedTime.includes(' ')) {
        formattedTime = formattedTime.split(' ')[0];
    }
    
    if (formattedTime.includes(':')) {
        const parts = formattedTime.split(':');
        if (parts.length >= 2) {
            const hours = parts[0].padStart(2, '0');
            const minutes = parts[1].substring(0, 2).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    }
    
    return formattedTime;
};

const weekDays = [
    { value: "0", label: "Monday" },
    { value: "1", label: "Tuesday" },
    { value: "2", label: "Wednesday" },
    { value: "3", label: "Thursday" },
    { value: "4", label: "Friday" },
    { value: "5", label: "Saturday" },
    { value: "6", label: "Sunday" }
];

const getInitialShiftHeadData = (offcode = '', currentUser = 'SYSTEM', uid = '') => {
    return {
        offcode: offcode,
        Code: '',
        Name: '',
        ShortName: '',
        arName: '',
        compcode: '01',
        IsActive: 'true',
        shiftGrassInMinuts: '15',
        shiftGrassOutMinuts: '30',
        shiftHours: '8',
        uid: uid,
        createdby: currentUser,
        createdate: getCurrentDateTime(),
        editby: '',
        editdate: ''
    };
};

const getInitialShiftDetailData = (shiftCode = '', offcode = '', weekDay = '0') => ({
    offcode: offcode,
    ShiftCode: shiftCode,
    WeekDay: weekDay,
    DStartTime: '09:00',
    DEndTime: '17:00',
    BStartTimeIn: '08:30',
    BStartTimeOut: '16:30',
    EndTimeIn: '09:15',
    EndTimeOut: '17:30',
    BreakStartTimeIn: '12:30',
    BreakEndTimeOut: '13:15',
    isRestDay: weekDay === '6' ? 'true' : 'false',
    ShiftMores: '0',
    LateMinute: '0',
    LeaveEarlyMinute: '0',
    IsApplyIOTimePeriod: '',
    IsMustCheckIn: '',
    IsMustCheckOut: '',
    Note: '',
    CountWorkDay: '',
    Pk: ''
});

const prepareHeadDataForDB = (data, mode, currentUser, currentOffcode, uid) => {
    const currentDateTime = getCurrentDateTime();
    
    const finalUid = uid || data.uid || '';
    
    const preparedData = {
        offcode: currentOffcode,
        Code: data.Code || '',
        Name: data.Name || '',
        ShortName: data.ShortName || '',
        arName: data.arName || '',
        compcode: data.compcode || '01',
        IsActive: isActiveValue(data.IsActive) ? 'True' : 'False',
        shiftGrassInMinuts: data.shiftGrassInMinuts || '15',
        shiftGrassOutMinuts: data.shiftGrassOutMinuts || '30',
        shiftHours: data.shiftHours || '8',
        uid: finalUid
    };

    if (mode === 'new') {
        preparedData.createdby = currentUser;
        preparedData.createdate = currentDateTime;
        preparedData.editby = '';
        preparedData.editdate = '';
    } else {
        preparedData.createdby = data.createdby || currentUser;
        preparedData.createdate = data.createdate || currentDateTime;
        preparedData.editby = currentUser;
        preparedData.editdate = currentDateTime;
    }

    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            delete preparedData[key];
        }
    });

    return preparedData;
};

const prepareDetailDataForDB = (data, currentOffcode) => {
    const preparedData = {
        offcode: currentOffcode,
        ShiftCode: data.ShiftCode || '',
        WeekDay: data.WeekDay || '0',
        DStartTime: formatTimeForDisplay(data.DStartTime || '09:00'),
        DEndTime: formatTimeForDisplay(data.DEndTime || '17:00'),
        BStartTimeIn: formatTimeForDisplay(data.BStartTimeIn || '08:30'),
        BStartTimeOut: formatTimeForDisplay(data.BStartTimeOut || '16:30'),
        EndTimeIn: formatTimeForDisplay(data.EndTimeIn || '09:15'),
        EndTimeOut: formatTimeForDisplay(data.EndTimeOut || '17:30'),
        BreakStartTimeIn: formatTimeForDisplay(data.BreakStartTimeIn || '12:30'),
        BreakEndTimeOut: formatTimeForDisplay(data.BreakEndTimeOut || '13:15'),
        isRestDay: isActiveValue(data.isRestDay) ? 'True' : 'False',
        ShiftMores: data.ShiftMores || '0',
        LateMinute: data.LateMinute || '0',
        LeaveEarlyMinute: data.LeaveEarlyMinute || '0',
        IsApplyIOTimePeriod: data.IsApplyIOTimePeriod || '',
        IsMustCheckIn: data.IsMustCheckIn || '',
        IsMustCheckOut: data.IsMustCheckOut || '',
        Note: data.Note || '',
        CountWorkDay: data.CountWorkDay || '',
        Pk: data.Pk || ''
    };

    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            delete preparedData[key];
        }
    });

    return preparedData;
};

/* ---------------------------
 * Data Service
---------------------------- */
const useShiftDataService = () => {
    const { credentials } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [shiftDetails, setShiftDetails] = useState([]);
    const [branches, setBranches] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                whereClause = `offcode = '${offcode}'`;
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

    const fetchMaxShiftCode = useCallback(async (offcode) => {
        try {
            const allShifts = await fetchTableData(API_CONFIG.TABLES.SHIFT_HEAD, offcode);
            const codes = allShifts
                .map(s => {
                    const code = normalizeValue(s.Code);
                    return parseInt(code, 10);
                })
                .filter(code => !isNaN(code) && code > 0);
            return codes.length > 0 ? Math.max(...codes) : 0;
        } catch (err) {
            console.error('Error fetching max shift code:', err);
            return 0;
        }
    }, [fetchTableData]);

    const fetchPaginatedData = useCallback(async (page, size, search) => {
        setIsLoading(true);
        setError('');

        try {
            const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
            
            if (!currentOffcode) {
                console.warn('No offcode found in credentials');
                setShifts([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (Code LIKE '%${search}%' OR Name LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.SHIFT_HEAD,
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
                setShifts(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                const max = await fetchMaxShiftCode(currentOffcode);
                setMaxCode(max);
                
                await fetchBranches(currentOffcode);
            } else {
                setShifts([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching shifts:', err);
            setError(`Failed to load data: ${err.message}`);
            setShifts([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, fetchTableData, fetchMaxShiftCode]);

    const fetchBranches = useCallback(async (offcode) => {
        try {
            const branchData = await fetchTableData(API_CONFIG.TABLES.BRANCH, offcode);
            setBranches(branchData);
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    }, [fetchTableData]);

    const fetchShiftDetails = useCallback(async (shiftCode, offcode) => {
        try {
            const whereClause = `ShiftCode = '${shiftCode}' AND offcode = '${offcode}'`;
            const details = await fetchTableData(API_CONFIG.TABLES.SHIFT_DETAIL, offcode, whereClause);
            
            const processedDetails = details.map(detail => ({
                offcode: normalizeValue(detail.offcode),
                ShiftCode: normalizeValue(detail.ShiftCode),
                WeekDay: normalizeValue(detail.WeekDay),
                DStartTime: formatTimeForDisplay(detail.DStartTime),
                DEndTime: formatTimeForDisplay(detail.DEndTime),
                BStartTimeIn: formatTimeForDisplay(detail.BStartTimeIn),
                BStartTimeOut: formatTimeForDisplay(detail.BStartTimeOut),
                EndTimeIn: formatTimeForDisplay(detail.EndTimeIn),
                EndTimeOut: formatTimeForDisplay(detail.EndTimeOut),
                BreakStartTimeIn: formatTimeForDisplay(detail.BreakStartTimeIn),
                BreakEndTimeOut: formatTimeForDisplay(detail.BreakEndTimeOut),
                isRestDay: detail.isRestDay === 'True' || detail.isRestDay === true ? 'true' : 'false',
                ShiftMores: normalizeValue(detail.ShiftMores),
                LateMinute: normalizeValue(detail.LateMinute),
                LeaveEarlyMinute: normalizeValue(detail.LeaveEarlyMinute),
                IsApplyIOTimePeriod: normalizeValue(detail.IsApplyIOTimePeriod),
                IsMustCheckIn: normalizeValue(detail.IsMustCheckIn),
                IsMustCheckOut: normalizeValue(detail.IsMustCheckOut),
                Note: normalizeValue(detail.Note),
                CountWorkDay: normalizeValue(detail.CountWorkDay),
                Pk: normalizeValue(detail.Pk)
            }));
            
            setShiftDetails(processedDetails);
            return processedDetails;
        } catch (err) {
            console.error('Error fetching shift details:', err);
            return [];
        }
    }, [fetchTableData]);

    useEffect(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetch = useCallback(() => {
        fetchPaginatedData(currentPage, pageSize, searchTerm);
    }, [currentPage, pageSize, searchTerm, fetchPaginatedData]);

    const refetchAll = useCallback(() => {
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
        shifts,
        shiftDetails,
        branches,
        totalCount,
        totalPages,
        isLoading, 
        error, 
        refetch,
        refetchAll,
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        updatePageSize,
        maxCode,
        fetchShiftDetails
    };
};

/* ---------------------------
 * Shift Form Component
---------------------------- */
const ShiftForm = ({
    formData,
    details,
    onHeadChange,
    onDetailChange,
    onSave,
    onNewShift,
    currentMode,
    isLoading,
    hasPermission,
    menuId,
    branches
}) => {
    const { credentials, uid } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';

    const {
        Code, Name, ShortName, arName, IsActive,
        shiftGrassInMinuts, shiftGrassOutMinuts, shiftHours,
        createdby, createdate, editby, editdate
    } = formData;

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    const handleHeadInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        onHeadChange({
            target: {
                name,
                value: type === 'checkbox' ? (checked ? 'true' : 'false') : value
            }
        });
    };

    const handleDetailInputChange = (weekDay, field, e) => {
        const { value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? (checked ? 'true' : 'false') : value;
        console.log(`Updating ${field} for day ${weekDay} to:`, newValue);
        onDetailChange(weekDay, {
            [field]: newValue
        });
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="smp-detail-panel">
            <div className="smp-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Shift' : `Shift: ${Name || 'Shift'}`}</h2>
                    <div className="smp-detail-meta">
                        <span className={`smp-mode-badge ${isNewMode ? 'smp-new' : 'smp-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="smp-code-badge">Code: {Code || (isNewMode ? 'Auto-generated' : 'No Code')}</span>
                        <span className="smp-office-badge">Office: {currentOffcode}</span>
                        {!isActiveValue(IsActive) && <span className="smp-inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="smp-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="smp-btn smp-btn-outline"
                                onClick={onNewShift}
                            >
                                <Icons.Plus size={16} />
                                New Shift
                            </button>
                            <button
                                className={`smp-btn smp-btn-primary ${isLoading ? 'smp-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !Name || !Code}
                            >
                                {isLoading ? <Icons.Loader size={16} className="smp-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save Shift'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="smp-detail-content">
                <div className="smp-info-section">
                    <h3 className="smp-section-main-title">
                        <Icons.Info size={20} />
                        Shift Information
                    </h3>
                    <div className="smp-info-grid">
                        <div className="smp-info-row">
                            <div className="smp-info-item">
                                <label>Shift Code</label>
                                <div className="smp-info-value">
                                    <input
                                        type="text"
                                        name="Code"
                                        value={Code}
                                        onChange={handleHeadInputChange}
                                        disabled={!isNewMode || !canEdit}
                                        className="smp-input"
                                    />
                                    {isNewMode && <span className="smp-hint">Auto-generated</span>}
                                </div>
                            </div>
                            <div className="smp-info-item">
                                <label>Shift Name</label>
                                <input
                                    type="text"
                                    name="Name"
                                    value={Name}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                            <div className="smp-info-item">
                                <label>Short Name</label>
                                <input
                                    type="text"
                                    name="ShortName"
                                    value={ShortName}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                        </div>

                        <div className="smp-info-row">
                            <div className="smp-info-item">
                                <label>Arabic Name</label>
                                <input
                                    type="text"
                                    name="arName"
                                    value={arName}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                            <div className="smp-info-item">
                                <label>Shift Hours</label>
                                <input
                                    type="number"
                                    name="shiftHours"
                                    value={shiftHours}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                            <div className="smp-info-item">
                                <label>Grace In (Min)</label>
                                <input
                                    type="number"
                                    name="shiftGrassInMinuts"
                                    value={shiftGrassInMinuts}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                        </div>

                        <div className="smp-info-row">
                            <div className="smp-info-item">
                                <label>Grace Out (Min)</label>
                                <input
                                    type="number"
                                    name="shiftGrassOutMinuts"
                                    value={shiftGrassOutMinuts}
                                    onChange={handleHeadInputChange}
                                    disabled={!canEdit}
                                    className="smp-input"
                                />
                            </div>
                            <div className="smp-info-item">
                                <label>Office Code</label>
                                <div className="smp-info-display">
                                    <Icons.Building2 size={16} />
                                    <span>{currentOffcode}</span>
                                </div>
                            </div>
                            <div className="smp-info-item smp-checkbox-item">
                                <label className="smp-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        name="IsActive"
                                        checked={isActiveValue(IsActive)}
                                        onChange={handleHeadInputChange}
                                        disabled={!canEdit}
                                    />
                                    <span className="smp-checkbox-custom"></span>
                                    <span>Active Shift</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="smp-timing-section">
                    <h3 className="smp-section-main-title">
                        <Icons.Clock size={20} />
                        Weekly Schedule
                    </h3>
                    
                    <div className="smp-timing-grid">
                        {weekDays.map((day) => {
                            const detail = details.find(d => d.WeekDay === day.value) || 
                                getInitialShiftDetailData(formData.Code, currentOffcode, day.value);
                            const isRestDay = detail.isRestDay === 'true';
                            
                            return (
                                <div key={day.value} className={`smp-day-timing-card ${isRestDay ? 'smp-rest-day' : ''}`}>
                                    <div className="smp-day-header">
                                        <span className="smp-day-name">{day.label}</span>
                                        <div className="smp-day-status">
                                            <label className="smp-checkbox-wrapper smp-small-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isRestDay}
                                                    onChange={(e) => handleDetailInputChange(day.value, 'isRestDay', e)}
                                                    disabled={!canEdit}
                                                />
                                                <span className="smp-checkbox-custom"></span>
                                                <span>Rest Day</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="smp-timing-body">
                                        {!isRestDay ? (
                                            <>
                                                <div className="smp-timing-row">
                                                    <div className="smp-timing-item">
                                                        <label>Duty Start</label>
                                                        <input
                                                            type="time"
                                                            value={detail.DStartTime || '09:00'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'DStartTime', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Duty End</label>
                                                        <input
                                                            type="time"
                                                            value={detail.DEndTime || '17:00'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'DEndTime', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="smp-timing-row">
                                                    <div className="smp-timing-item">
                                                        <label>Buffer In</label>
                                                        <input
                                                            type="time"
                                                            value={detail.BStartTimeIn || '08:30'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'BStartTimeIn', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Buffer Out</label>
                                                        <input
                                                            type="time"
                                                            value={detail.BStartTimeOut || '16:30'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'BStartTimeOut', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="smp-timing-row">
                                                    <div className="smp-timing-item">
                                                        <label>Grace In</label>
                                                        <input
                                                            type="time"
                                                            value={detail.EndTimeIn || '09:15'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'EndTimeIn', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Grace Out</label>
                                                        <input
                                                            type="time"
                                                            value={detail.EndTimeOut || '17:30'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'EndTimeOut', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="smp-timing-row">
                                                    <div className="smp-timing-item">
                                                        <label>Break Start</label>
                                                        <input
                                                            type="time"
                                                            value={detail.BreakStartTimeIn || '12:30'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'BreakStartTimeIn', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Break End</label>
                                                        <input
                                                            type="time"
                                                            value={detail.BreakEndTimeOut || '13:15'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'BreakEndTimeOut', e)}
                                                            disabled={!canEdit}
                                                            className="smp-time-input-small"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="smp-timing-row">
                                                    <div className="smp-timing-item">
                                                        <label>Late Min</label>
                                                        <input
                                                            type="number"
                                                            value={detail.LateMinute || '0'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'LateMinute', e)}
                                                            disabled={!canEdit}
                                                            className="smp-number-small"
                                                            min="0"
                                                            max="999"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Early Leave</label>
                                                        <input
                                                            type="number"
                                                            value={detail.LeaveEarlyMinute || '0'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'LeaveEarlyMinute', e)}
                                                            disabled={!canEdit}
                                                            className="smp-number-small"
                                                            min="0"
                                                            max="999"
                                                        />
                                                    </div>
                                                    <div className="smp-timing-item">
                                                        <label>Next Day</label>
                                                        <select
                                                            value={detail.ShiftMores || '0'}
                                                            onChange={(e) => handleDetailInputChange(day.value, 'ShiftMores', e)}
                                                            disabled={!canEdit}
                                                            className="smp-select-small"
                                                        >
                                                            <option value="0">No</option>
                                                            <option value="1">Yes</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="smp-rest-message">
                                                <Icons.Sun size={24} />
                                                <p>Rest Day - No working hours</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="smp-audit-section">
                    <h3 className="smp-section-main-title">
                        <Icons.Clock size={20} />
                        Audit Trail
                    </h3>
                    <div className="smp-audit-grid">
                        <div className="smp-audit-item">
                            <label>Created By</label>
                            <div className="smp-audit-value">
                                <Icons.User size={14} />
                                <span>{createdby || (isNewMode ? 'Will be set' : 'N/A')}</span>
                            </div>
                        </div>
                        <div className="smp-audit-item">
                            <label>Created Date</label>
                            <div className="smp-audit-value">
                                <Icons.Calendar size={14} />
                                <span>{createdate ? formatDisplayDate(createdate) : (isNewMode ? 'Will be set' : 'Not set')}</span>
                            </div>
                        </div>
                        <div className="smp-audit-item">
                            <label>Last Edited By</label>
                            <div className="smp-audit-value">
                                <Icons.User size={14} />
                                <span>{editby || (isNewMode ? 'Not edited' : 'N/A')}</span>
                            </div>
                        </div>
                        <div className="smp-audit-item">
                            <label>Last Edited Date</label>
                            <div className="smp-audit-value">
                                <Icons.Calendar size={14} />
                                <span>{editdate ? formatDisplayDate(editdate) : (isNewMode ? 'Not edited' : 'Not set')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Shift Sidebar Component
---------------------------- */
const ShiftSidebar = ({ 
    shifts, 
    selectedShift, 
    onShiftSelect, 
    searchTerm, 
    onSearchChange, 
    isLoading, 
    hasPermission, 
    menuId, 
    onDelete,
    totalCount,
    currentPage,
    totalPages,
    onPageChange
}) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop = 0;
        }
    }, [currentPage]);

    return (
        <aside className="smp-sidebar">
            <div className="smp-sidebar-header">
                <div className="smp-sidebar-title">
                    <Icons.Clock size={20} />
                    <h3>Shifts</h3>
                    <span className="smp-count-badge">{totalCount} shifts</span>
                </div>
                <div className="smp-sidebar-actions">
                    <div className="smp-search-container">
                        <Icons.Search size={16} className="smp-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="smp-search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="smp-sidebar-content" ref={sidebarRef}>
                {isLoading && shifts.length === 0 ? (
                    <div className="smp-loading-state">
                        <Icons.Loader size={32} className="smp-spin" />
                        <p>Loading Shifts...</p>
                    </div>
                ) : shifts.length > 0 ? (
                    <>
                        <div className="smp-list">
                            {shifts.map(shift => (
                                <div
                                    key={`${shift.Code}-${shift.offcode}`}
                                    className={`smp-list-item ${selectedShift?.Code === shift.Code ? 'smp-selected' : ''}`}
                                    onClick={() => onShiftSelect(shift)}
                                >
                                    <div className="smp-item-info">
                                        <div className="smp-item-header">
                                            <span className="smp-item-code">{normalizeValue(shift.Code)}</span>
                                            <span className={`smp-status-badge ${isActiveValue(shift.IsActive) ? 'smp-active' : 'smp-inactive'}`}>
                                                {isActiveValue(shift.IsActive) ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="smp-item-name">{normalizeValue(shift.Name) || 'Unnamed Shift'}</div>
                                        <div className="smp-item-meta">
                                            <span>{shift.shiftHours} hrs</span>
                                            {shift.ShortName && (
                                                <>
                                                    <span className="smp-meta-separator">•</span>
                                                    <span>{shift.ShortName}</span>
                                                </>
                                            )}
                                        </div>
                                        {normalizeValue(shift.createdby) && (
                                            <div className="smp-item-audit">
                                                <Icons.User size={10} />
                                                <span>{normalizeValue(shift.createdby)}</span>
                                                {normalizeValue(shift.editby) && (
                                                    <>
                                                        <span className="smp-audit-separator">•</span>
                                                        <Icons.Edit size={10} />
                                                        <span>{normalizeValue(shift.editby)}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {hasPermission && hasPermission(menuId, 'delete') && (
                                        <button
                                            className="smp-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(shift);
                                            }}
                                            title="Delete shift"
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
                                onPageChange={onPageChange}
                                totalItems={totalCount}
                                itemsPerPage={10}
                                maxVisiblePages={5}
                                loading={isLoading}
                            />
                        )}
                    </>
                ) : (
                    <div className="smp-empty-state">
                        <Icons.Clock size={48} className="smp-empty-icon" />
                        <h4>No shifts found</h4>
                        {searchTerm ? (
                            <p>Try a different search term</p>
                        ) : (
                            <p>Create your first shift to get started</p>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

/* ---------------------------
 * Main Shift Management Component
---------------------------- */
const ShiftManagement = () => {
    const { credentials, uid } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        shifts,
        branches,
        totalCount,
        totalPages,
        isLoading: isDataLoading, 
        error, 
        refetch,
        refetchAll,
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        maxCode,
        fetchShiftDetails
    } = useShiftDataService();

    const [selectedShift, setSelectedShift] = useState(null);
    const [headData, setHeadData] = useState(() => getInitialShiftHeadData(currentOffcode, currentUser, uid));
    const [detailData, setDetailData] = useState([]);
    const [currentMode, setCurrentMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Shift & Shift Timing' })
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchTerm !== searchTerm) {
                setSearch(localSearchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearchTerm, searchTerm, setSearch]);

    const generateShiftCode = useCallback(() => {
        const nextCode = maxCode + 1;
        return nextCode.toString().padStart(3, '0');
    }, [maxCode]);

    useEffect(() => {
        if (currentMode === 'new' && !selectedShift) {
            const newCode = generateShiftCode();
            setHeadData({
                ...getInitialShiftHeadData(currentOffcode, currentUser, uid),
                Code: newCode
            });
            const initialDetails = weekDays.map(day => 
                getInitialShiftDetailData(newCode, currentOffcode, day.value)
            );
            setDetailData(initialDetails);
            setMessage(`Ready to create new shift. Code: ${newCode}`);
        }
    }, [currentMode, currentOffcode, currentUser, uid, generateShiftCode, selectedShift]);

    const handleShiftSelect = async (shift) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view shifts');
            return;
        }

        setSelectedShift(shift);
        setCurrentMode('edit');

        const shiftUid = normalizeValue(shift.uid) || uid;

        setHeadData({
            offcode: normalizeValue(shift.offcode),
            Code: normalizeValue(shift.Code),
            Name: normalizeValue(shift.Name),
            ShortName: normalizeValue(shift.ShortName),
            arName: normalizeValue(shift.arName),
            compcode: normalizeValue(shift.compcode),
            IsActive: normalizeValue(shift.IsActive),
            shiftGrassInMinuts: normalizeValue(shift.shiftGrassInMinuts),
            shiftGrassOutMinuts: normalizeValue(shift.shiftGrassOutMinuts),
            shiftHours: normalizeValue(shift.shiftHours),
            uid: shiftUid,
            createdby: normalizeValue(shift.createdby),
            createdate: normalizeValue(shift.createdate),
            editby: normalizeValue(shift.editby),
            editdate: normalizeValue(shift.editdate)
        });

        try {
            const details = await fetchShiftDetails(shift.Code, currentOffcode);
            
            if (details && details.length > 0) {
                const mappedDetails = weekDays.map(day => {
                    const existing = details.find(d => d.WeekDay === day.value);
                    if (existing) {
                        return existing;
                    } else {
                        return getInitialShiftDetailData(shift.Code, currentOffcode, day.value);
                    }
                });
                setDetailData(mappedDetails);
            } else {
                const defaultDetails = weekDays.map(day => 
                    getInitialShiftDetailData(shift.Code, currentOffcode, day.value)
                );
                setDetailData(defaultDetails);
            }
        } catch (error) {
            console.error('Error loading shift details:', error);
        }

        setMessage(`Editing: ${normalizeValue(shift.Name)}`);
    };

    const handleNewShift = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new shifts');
            return;
        }
        setSelectedShift(null);
        setCurrentMode('new');
    };

    const handleHeadChange = (e) => {
        const { name, value } = e.target;
        setHeadData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDetailChange = (weekDay, updatedFields) => {
        setDetailData(prev => {
            const index = prev.findIndex(d => d.WeekDay === weekDay);
            if (index >= 0) {
                const newDetails = [...prev];
                newDetails[index] = { ...newDetails[index], ...updatedFields };
                console.log(`Updated detail for day ${weekDay}:`, newDetails[index]);
                return newDetails;
            }
            return prev;
        });
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} shifts`);
            return;
        }

        if (!headData.Name.trim()) {
            setMessage('❌ Shift Name is required!');
            return;
        }

        if (!headData.Code.trim()) {
            setMessage('❌ Shift Code is required!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const preparedHead = prepareHeadDataForDB(headData, currentMode, currentUser, currentOffcode, uid);
        const preparedDetails = detailData.map(detail => 
            prepareDetailDataForDB(
                { ...detail, ShiftCode: headData.Code },
                currentOffcode
            )
        );

        // Create payload that matches your backend expectations
        const payload = {
            head: {
                tableName: API_CONFIG.TABLES.SHIFT_HEAD,
                data: preparedHead
            },
            details: preparedDetails.map(detail => ({
                tableName: API_CONFIG.TABLES.SHIFT_DETAIL,
                data: detail
            })),
            selectedBranch: currentOffcode
        };

        console.log('Save payload:', JSON.stringify(payload, null, 2));

        try {
            const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_HEAD_DETAIL : API_CONFIG.UPDATE_HEAD_DETAIL;
            
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
            console.log('Save result:', result);

            if (result.success) {
                setMessage('✅ Shift saved successfully!');
                
                await refetchAll();

                if (currentMode === 'new') {
                    const newRecord = { ...preparedHead };
                    setSelectedShift(newRecord);
                    setCurrentMode('edit');
                    setHeadData(preparedHead);
                } else {
                    await fetchShiftDetails(headData.Code, currentOffcode);
                }
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

    const handleDeleteShift = async (shift) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete shifts');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the shift "${shift.Name}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const detailsPayload = {
                tableName: API_CONFIG.TABLES.SHIFT_DETAIL,
                where: {
                    ShiftCode: shift.Code,
                    offcode: currentOffcode
                }
            };

            await fetch(API_CONFIG.DELETE_RECORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detailsPayload)
            });

            const headPayload = {
                tableName: API_CONFIG.TABLES.SHIFT_HEAD,
                where: {
                    Code: shift.Code,
                    offcode: currentOffcode
                }
            };

            const resp = await fetch(API_CONFIG.DELETE_RECORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(headPayload)
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Shift deleted successfully!');
                
                if (shifts.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetchAll();
                }

                if (selectedShift && selectedShift.Code === shift.Code) {
                    setSelectedShift(null);
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
        goToPage(page);
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop = 0;
        }
    };

    if (rightsLoading && !menuId) {
        return (
            <div className="smp-loading-container">
                <Icons.Loader size={40} className="smp-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="smp-container">
            <header className="smp-header">
                <div className="smp-header-left">
                    <Icons.Clock size={24} className="smp-header-icon" />
                    <div>
                        <h1>Shift Management</h1>
                        <span className="smp-header-subtitle">Manage shift schedules</span>
                    </div>
                </div>
                <div className="smp-header-right">
                    <Icons.User size={16} />
                    <span>{currentUser}</span>
                    <span className="smp-office-tag">Office: {currentOffcode}</span>
                </div>
            </header>

            <div className="smp-toolbar">
                <div className="smp-toolbar-group">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="smp-toolbar-btn smp-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Icons.Loader size={16} className="smp-spin" /> : <Icons.Save size={16} />}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="smp-toolbar-btn" onClick={handleNewShift}>
                            <Icons.Plus size={16} />
                            <span>New Shift</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button 
                            className="smp-toolbar-btn" 
                            onClick={() => { 
                                if (selectedShift) { 
                                    setCurrentMode('edit'); 
                                } else {
                                    setMessage('Select a shift to edit'); 
                                }
                            }}
                        >
                            <Icons.Pencil size={16} />
                            <span>Edit</span>
                        </button>
                    )}
                </div>

                <div className="smp-toolbar-group">
                    <button className="smp-toolbar-btn" onClick={refetchAll}>
                        <Icons.RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="smp-toast smp-error">
                    <div className="smp-toast-content">
                        <Icons.AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    <button className="smp-toast-close" onClick={() => setError('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            {message && (
                <div className={`smp-toast ${message.includes('❌') ? 'smp-error' : message.includes('⚠️') ? 'smp-warning' : 'smp-success'}`}>
                    <div className="smp-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={18} />}
                        {message.includes('❌') && <Icons.AlertCircle size={18} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={18} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="smp-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={14} />
                    </button>
                </div>
            )}

            <div className="smp-main-layout">
                <ShiftSidebar
                    shifts={shifts}
                    selectedShift={selectedShift}
                    onShiftSelect={handleShiftSelect}
                    searchTerm={localSearchTerm}
                    onSearchChange={setLocalSearchTerm}
                    isLoading={isDataLoading}
                    hasPermission={hasPermission}
                    menuId={menuId}
                    onDelete={handleDeleteShift}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <main className="smp-content-area">
                    <div className="smp-content-tabs">
                        <button className="smp-tab smp-active">
                            <Icons.Clock size={16} />
                            Shift Details
                        </button>
                    </div>

                    <div className="smp-content-panel">
                        <ShiftForm
                            formData={headData}
                            details={detailData}
                            onHeadChange={handleHeadChange}
                            onDetailChange={handleDetailChange}
                            onSave={handleSave}
                            onNewShift={handleNewShift}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            hasPermission={hasPermission}
                            menuId={menuId}
                            branches={branches}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ShiftManagement;