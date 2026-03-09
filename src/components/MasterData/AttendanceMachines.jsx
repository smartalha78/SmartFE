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
        HRMS_MACHINE: 'hrmsmachine'
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
    Cpu: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>,
    Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
};

/* ---------------------------
 * Initial State
---------------------------- */
const getInitialMachineData = (offcode = '0101') => ({
    Code: '',
    Name: '',
    DeviceNo: '1',
    CommunicationMode: '1',
    SP_COM_Port: 'COM3',
    SP_COM_BandRate: '9600',
    SP_COM_MachineSrNo: '',
    TCP_IP_No: '192.168.100.205',
    TCP_IP_Port: '4370',
    USB_Address: '',
    IsActive: 'true',
    offcode: offcode,
    InCode: '0',
    OutCode: '1',
    InOutBothType: 'BOTH',
    DefaultStatusCode: '0'
});

/* ---------------------------
 * Data Service
---------------------------- */
const useMachineDataService = () => {
    const { credentials } = useAuth();
    const [machineData, setMachineData] = useState([]);
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

            const machineData = await fetchTableData(API_CONFIG.TABLES.HRMS_MACHINE);

            const filteredData = machineData.filter(item =>
                normalizeValue(item.offcode) === currentOffcode
            );

            setMachineData(filteredData);

        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { machineData, isLoading, error, refetch: loadAllData, setError };
};

/* ---------------------------
 * Machine Form Component
---------------------------- */
const MachineForm = ({
    formData,
    onFormChange,
    onSave,
    onNewMachine,
    currentMode,
    isLoading,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.company?.offcode || '0101';

    const {
        Code,
        Name,
        DeviceNo,
        CommunicationMode,
        SP_COM_Port,
        SP_COM_BandRate,
        SP_COM_MachineSrNo,
        TCP_IP_No,
        TCP_IP_Port,
        USB_Address,
        IsActive,
        InCode,
        OutCode,
        InOutBothType,
        DefaultStatusCode
    } = formData;

    const handleInput = (field, value) => onFormChange(field, value);
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const isNewMode = currentMode === 'new';
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    const communicationModes = [
        { value: '1', label: 'Serial Port (COM)' },
        { value: '2', label: 'TCP/IP' },
        { value: '3', label: 'USB' }
    ];

    const inOutTypeOptions = [
        { value: 'IN', label: 'IN Only' },
        { value: 'OUT', label: 'OUT Only' },
        { value: 'BOTH', label: 'BOTH IN & OUT' }
    ];

    const defaultStatusOptions = [
        { value: '0', label: 'IN' },
        { value: '1', label: 'OUT' }
    ];

    return (
        <section className="detail-panel">
            <div className="detail-header">
                <div className="header-content">
                    <h1>{isNewMode ? 'Add New Machine' : `Machine Details: ${Name || 'Machine'}`}</h1>
                    <div className="header-subtitle">
                        <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
                        <span className="muted">• Code: {Code || 'No Code'}</span>
                        <span className="muted">• Office: {currentOffcode}</span>
                        {!(IsActive === 'true') && <span className="inactive-badge">INACTIVE</span>}
                    </div>
                </div>
                <div className="header-actions">
                    {canEdit && (
                        <>
                            <button
                                className="btn btn-outline"
                                onClick={onNewMachine}
                            >
                                <Icon.Plus /> New Machine
                            </button>
                            <button
                                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || !Name || !Code}
                            >
                                {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
                                {isLoading ? 'Saving...' : 'Save Machine'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-body">
                {/* Basic Information */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.Cpu />
                            <h3>Basic Information</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group required">
                                <label>Machine Code *</label>
                                <input
                                    type="text"
                                    value={Code}
                                    onChange={e => handleInput('Code', e.target.value)}
                                    placeholder="e.g., 001, 002"
                                    className="mono"
                                    disabled={!canEdit}
                                />
                                {isNewMode && (
                                    <div className="hint">Enter a unique 3-digit code</div>
                                )}
                            </div>

                            <div className="form-group required">
                                <label>Machine Name *</label>
                                <input
                                    type="text"
                                    value={Name}
                                    onChange={e => handleInput('Name', e.target.value)}
                                    placeholder="e.g., In, Out, Main Gate"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>Device Number</label>
                                <input
                                    type="number"
                                    value={DeviceNo}
                                    onChange={e => handleInput('DeviceNo', e.target.value)}
                                    placeholder="1"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="IsActive"
                                    checked={IsActive === 'true'}
                                    onChange={e => handleCheckbox('IsActive', e)}
                                    disabled={!canEdit}
                                />
                                <label htmlFor="IsActive">Machine is Active</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Communication Settings */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.Settings />
                            <h3>Communication Settings</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group">
                                <label>Communication Mode</label>
                                <select
                                    value={CommunicationMode}
                                    onChange={e => handleInput('CommunicationMode', e.target.value)}
                                    disabled={!canEdit}
                                >
                                    {communicationModes.map(mode => (
                                        <option key={mode.value} value={mode.value}>
                                            {mode.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {CommunicationMode === '1' && (
                                <>
                                    <div className="form-group">
                                        <label>COM Port</label>
                                        <input
                                            type="text"
                                            value={SP_COM_Port}
                                            onChange={e => handleInput('SP_COM_Port', e.target.value)}
                                            placeholder="COM3"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Baud Rate</label>
                                        <input
                                            type="text"
                                            value={SP_COM_BandRate}
                                            onChange={e => handleInput('SP_COM_BandRate', e.target.value)}
                                            placeholder="9600"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Machine Serial No.</label>
                                        <input
                                            type="text"
                                            value={SP_COM_MachineSrNo}
                                            onChange={e => handleInput('SP_COM_MachineSrNo', e.target.value)}
                                            placeholder="12345"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </>
                            )}

                            {CommunicationMode === '2' && (
                                <>
                                    <div className="form-group">
                                        <label>IP Address</label>
                                        <input
                                            type="text"
                                            value={TCP_IP_No}
                                            onChange={e => handleInput('TCP_IP_No', e.target.value)}
                                            placeholder="192.168.100.205"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Port</label>
                                        <input
                                            type="number"
                                            value={TCP_IP_Port}
                                            onChange={e => handleInput('TCP_IP_Port', e.target.value)}
                                            placeholder="4370"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </>
                            )}

                            {CommunicationMode === '3' && (
                                <div className="form-group">
                                    <label>USB Address</label>
                                    <input
                                        type="text"
                                        value={USB_Address}
                                        onChange={e => handleInput('USB_Address', e.target.value)}
                                        placeholder="USB address"
                                        disabled={!canEdit}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance Settings */}
                <div className="form-section expanded">
                    <div className="section-header">
                        <div className="section-title">
                            <Icon.Settings />
                            <h3>Attendance Settings</h3>
                        </div>
                    </div>
                    <div className="section-content">
                        <div className="form-grid grid-3-col">
                            <div className="form-group">
                                <label>IN Code</label>
                                <input
                                    type="text"
                                    value={InCode}
                                    onChange={e => handleInput('InCode', e.target.value)}
                                    placeholder="0"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>OUT Code</label>
                                <input
                                    type="text"
                                    value={OutCode}
                                    onChange={e => handleInput('OutCode', e.target.value)}
                                    placeholder="1"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-group">
                                <label>IN/OUT Type</label>
                                <select
                                    value={InOutBothType}
                                    onChange={e => handleInput('InOutBothType', e.target.value)}
                                    disabled={!canEdit}
                                >
                                    {inOutTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Default Status</label>
                                <select
                                    value={DefaultStatusCode}
                                    onChange={e => handleInput('DefaultStatusCode', e.target.value)}
                                    disabled={!canEdit}
                                >
                                    {defaultStatusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ---------------------------
 * Machine Management Main Component
---------------------------- */
const MachineManagement = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const currentOffcode = credentials?.company?.offcode || '0101';
    const currentUser = credentials?.username || 'SYSTEM';

    const { machineData, isLoading: isDataLoading, error, refetch, setError } = useMachineDataService();

    const [selectedMachine, setSelectedMachine] = useState(null);
    const [formData, setFormData] = useState(() => getInitialMachineData(currentOffcode));
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
                    body: JSON.stringify({ screenName: 'Attendance Machines' })
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

    // Filter machines based on search term
    const filteredMachines = machineData.filter(machine => {
        return !searchTerm || 
            normalizeValue(machine.Name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            normalizeValue(machine.Code).includes(searchTerm);
    });

    // Generate next available code
    const generateNextCode = useCallback(() => {
        if (machineData.length === 0) {
            return '001';
        }

        const existingCodes = machineData
            .map(m => parseInt(normalizeValue(m.Code)))
            .filter(code => !isNaN(code) && code > 0);

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextCode = maxCode + 1;

        return nextCode.toString().padStart(3, '0');
    }, [machineData]);

    // Initialize form data for new record
    useEffect(() => {
        if (currentMode === 'new') {
            const newCode = generateNextCode();

            setFormData(prev => ({
                ...getInitialMachineData(currentOffcode),
                Code: newCode
            }));

            setMessage(`Ready to add new machine. Auto-generated code: ${newCode}`);
        }
    }, [currentMode, currentOffcode, generateNextCode]);

    // Load selected machine data into form
    useEffect(() => {
        if (selectedMachine && currentMode === 'edit') {
            const normalizedMachine = Object.keys(getInitialMachineData()).reduce((acc, key) => {
                acc[key] = normalizeValue(selectedMachine[key] || getInitialMachineData()[key]);
                return acc;
            }, {});

            setFormData(normalizedMachine);
        }
    }, [selectedMachine, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectMachine = (machine) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view machines');
            return;
        }
        setSelectedMachine(machine);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(machine.Name)}`);
    };

    const handleNewMachine = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new machines');
            return;
        }
        setSelectedMachine(null);
        setCurrentMode('new');
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} machines`);
            return;
        }

        if (!formData.Name.trim()) {
            setMessage('❌ Machine Name is required!');
            return;
        }

        if (!formData.Code.trim()) {
            setMessage('❌ Machine Code is required!');
            return;
        }

        const duplicateCode = machineData.find(m => 
            m.Code === formData.Code && 
            (currentMode === 'new' || m.Code !== selectedMachine?.Code)
        );

        if (duplicateCode) {
            setMessage('❌ A machine with this code already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        const payload = {
            tableName: API_CONFIG.TABLES.HRMS_MACHINE,
            data: {
                ...formData,
                offcode: currentOffcode
            }
        };

        if (currentMode === 'edit') {
            payload.where = {
                Code: formData.Code,
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
                setMessage('✅ Machine saved successfully!');
                await refetch();

                if (currentMode === 'new') {
                    const newRecord = machineData.find(m =>
                        m.Code === formData.Code && m.offcode === currentOffcode
                    ) || formData;
                    setSelectedMachine(newRecord);
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

    const handleDeleteMachine = async (machine) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete machines');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the machine "${machine.Name}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.HRMS_MACHINE,
                where: {
                    Code: machine.Code,
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
                setMessage('✅ Machine deleted successfully!');
                await refetch();

                if (selectedMachine && selectedMachine.Code === machine.Code) {
                    setSelectedMachine(null);
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
    const MachineManagementSidebar = () => {
        return (
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-title">
                        <Icon.Cpu className="big" />
                        <div>
                            <div className="h3">Machine Management</div>
                            <div className="muted small">{machineData.length} machines • Office: {currentOffcode}</div>
                        </div>
                    </div>
                    
                    <div className="search-wrap">
                        <Icon.Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search machines..."
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
                    {isDataLoading && machineData.length === 0 ? (
                        <div className="loading-message">
                            <Icon.Loader className="spin" /> Loading Machines...
                        </div>
                    ) : filteredMachines.length > 0 ? (
                        <div className="machine-list">
                            {filteredMachines.map(machine => (
                                <div
                                    key={machine.Code}
                                    className={`machine-item ${selectedMachine?.Code === machine.Code && currentMode === 'edit' ? 'selected' : ''
                                        }`}
                                    onClick={() => handleSelectMachine(machine)}
                                >
                                    <div className="machine-main">
                                        <div className="machine-code-name">
                                            <span className="machine-code">{normalizeValue(machine.Code)}</span>
                                            <span className="machine-name">{normalizeValue(machine.Name)}</span>
                                        </div>
                                        <div className="machine-meta">
                                            {normalizeValue(machine.IsActive) === 'true' ? (
                                                <span className="status active">Active</span>
                                            ) : (
                                                <span className="status inactive">Inactive</span>
                                            )}
                                            <span className="communication-mode">
                                                {machine.CommunicationMode === '1' && 'COM'}
                                                {machine.CommunicationMode === '2' && 'TCP/IP'}
                                                {machine.CommunicationMode === '3' && 'USB'}
                                            </span>
                                        </div>
                                    </div>
                                    {hasPermission && hasPermission(menuId, 'delete') && (
                                        <div className="machine-actions">
                                            <button
                                                className="btn btn-icon btn-danger btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMachine(machine);
                                                }}
                                                title="Delete machine"
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
                            <Icon.Cpu className="big-muted" />
                            <div className="muted">No machines found</div>
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
                    <Icon.Cpu className="brand-icon" />
                    <div>
                        <h1>Machine Management</h1>
                        <div className="muted">Manage attendance machines and devices</div>
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
                        <button className="toolbar-btn" onClick={handleNewMachine}>
                            <Icon.Plus /> New Machine
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="toolbar-btn" onClick={() => { 
                            if (selectedMachine) { 
                                setCurrentMode('edit'); 
                            } else {
                                setMessage('Select a machine to edit'); 
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
                <MachineManagementSidebar />

                <div className="main-content">
                    <div className="content-tabs">
                        <button className="tab active">
                            <Icon.Cpu /> Machine Details
                        </button>
                    </div>

                    <div className="content-panel">
                        <MachineForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewMachine={handleNewMachine}
                            currentMode={currentMode}
                            isLoading={isSaving}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineManagement;