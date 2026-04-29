import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import "./BOMCreation.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";
import * as Icons from 'lucide-react';
import Pagination from '../Common/Pagination';

/* ---------------------------
 * API & Configuration
---------------------------- */
const API_CONFIG = {
    BASE_URL: `${API_BASE1}`,
    TABLES: {
        BOM: 'imfbom',
        BOM_HEAD: 'imfbomhead',
        BOM_FOH: 'imfbomfoh',
        OVERHEAD: 'comFOH',
        UOM: 'comuom',
        PROCESS: 'comProcess',
        ITEMS: 'imf'
    },
    GET_URL: `${API_BASE1}/get-table-data`,
    INSERT_URL: `${API_BASE1}/insert-table-data`,
    UPDATE_URL: `${API_BASE1}/NoEditupdate-table-data`,
    DELETE_URL: `${API_BASE1}/delete-table-data`
};

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

/* ---------------------------
 * BOM Component Row Component
---------------------------- */
const BOMComponentRow = React.memo(({ index, data, onUpdate, onRemove, items, uoms, processes, canEdit }) => {
    const [selectedItem, setSelectedItem] = useState(data.BOMItemCode || '');
    const [selectedUOM, setSelectedUOM] = useState(data.uom || '1');
    const [quantity, setQuantity] = useState(data.NoOfQtyRequired || '1');
    const [pieces, setPieces] = useState(data.ForNoOfPeices || '1');
    const [selectedProcess, setSelectedProcess] = useState(data.ProcessID || '1');

    useEffect(() => {
        setSelectedItem(data.BOMItemCode || '');
        setSelectedUOM(data.uom || '1');
        setQuantity(data.NoOfQtyRequired || '1');
        setPieces(data.ForNoOfPeices || '1');
        setSelectedProcess(data.ProcessID || '1');
    }, [data]);

    const handleItemChange = useCallback((e) => {
        const code = e.target.value;
        setSelectedItem(code);
        onUpdate({
            BOMItemCode: code,
            uom: selectedUOM,
            NoOfQtyRequired: quantity,
            ForNoOfPeices: pieces,
            ProcessID: selectedProcess
        });
    }, [selectedUOM, quantity, pieces, selectedProcess, onUpdate]);

    const handleUOMChange = useCallback((e) => {
        const uom = e.target.value;
        setSelectedUOM(uom);
        onUpdate({
            BOMItemCode: selectedItem,
            uom: uom,
            NoOfQtyRequired: quantity,
            ForNoOfPeices: pieces,
            ProcessID: selectedProcess
        });
    }, [selectedItem, quantity, pieces, selectedProcess, onUpdate]);

    const handleQuantityChange = useCallback((e) => {
        const val = e.target.value;
        setQuantity(val);
        onUpdate({
            BOMItemCode: selectedItem,
            uom: selectedUOM,
            NoOfQtyRequired: val,
            ForNoOfPeices: pieces,
            ProcessID: selectedProcess
        });
    }, [selectedItem, selectedUOM, pieces, selectedProcess, onUpdate]);

    const handlePiecesChange = useCallback((e) => {
        const val = e.target.value;
        setPieces(val);
        onUpdate({
            BOMItemCode: selectedItem,
            uom: selectedUOM,
            NoOfQtyRequired: quantity,
            ForNoOfPeices: val,
            ProcessID: selectedProcess
        });
    }, [selectedItem, selectedUOM, quantity, selectedProcess, onUpdate]);

    const handleProcessChange = useCallback((e) => {
        const process = e.target.value;
        setSelectedProcess(process);
        onUpdate({
            BOMItemCode: selectedItem,
            uom: selectedUOM,
            NoOfQtyRequired: quantity,
            ForNoOfPeices: pieces,
            ProcessID: process
        });
    }, [selectedItem, selectedUOM, quantity, pieces, onUpdate]);

    return (
        <div className="bom-component-row">
            <div className="bom-row-index">{index + 1}</div>
            <div className="bom-row-field">
                <select 
                    value={selectedItem} 
                    onChange={handleItemChange} 
                    disabled={!canEdit} 
                    className="bom-select" 
                    required
                >
                    <option value="">Select Item</option>
                    {items.map(item => (
                        <option key={item.code} value={item.code}>
                            {item.display || `${item.code} - ${item.name}`}
                        </option>
                    ))}
                </select>
            </div>
            <div className="bom-row-field">
                <select 
                    value={selectedUOM} 
                    onChange={handleUOMChange} 
                    disabled={!canEdit} 
                    className="bom-select"
                >
                    {uoms.map(uom => (
                        <option key={uom.id} value={uom.id}>
                            {uom.name} ({uom.short})
                        </option>
                    ))}
                </select>
            </div>
            <div className="bom-row-field">
                <input 
                    type="number" 
                    step="0.001" 
                    value={quantity} 
                    onChange={handleQuantityChange} 
                    disabled={!canEdit} 
                    className="bom-input" 
                    placeholder="Qty"
                />
            </div>
            <div className="bom-row-field">
                <input 
                    type="number" 
                    step="1" 
                    value={pieces} 
                    onChange={handlePiecesChange} 
                    disabled={!canEdit} 
                    className="bom-input" 
                    placeholder="Pieces"
                />
            </div>
            <div className="bom-row-field">
                <select 
                    value={selectedProcess} 
                    onChange={handleProcessChange} 
                    disabled={!canEdit} 
                    className="bom-select"
                >
                    <option value="">Select Process</option>
                    {processes.map(process => (
                        <option key={process.id} value={process.id}>
                            {process.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="bom-row-actions">
                {canEdit && (
                    <button type="button" className="bom-remove-btn" onClick={() => onRemove(index)} title="Remove component">
                        <Icons.Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
});

/* ---------------------------
 * BOM Modal Component
---------------------------- */
const BOMModal = React.memo(({ isOpen, onClose, bom, onSave, mode, lookupData, currentOffcode, currentUser }) => {
    const [formData, setFormData] = useState({
        HeadItemCode: '',
        HeadItemName: '',
        isActive: '1'
    });
    const [components, setComponents] = useState([]);
    const [overheads, setOverheads] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Pagination state for components
    const [currentComponentPage, setCurrentComponentPage] = useState(1);
    const componentsPerPage = 5;

    const { items, uoms, processes, overheads: overheadList, allBOMHeads } = lookupData;

    // Generate next head item code
    const generateNextHeadItemCode = useCallback(() => {
        const allHeads = allBOMHeads || [];
        
        if (!allHeads || allHeads.length === 0) {
            return '0000000001';
        }

        const existingCodes = allHeads
            .map(head => {
                const code = parseInt(normalizeValue(head.HeadItemCode));
                return isNaN(code) ? 0 : code;
            })
            .filter(code => code > 0);

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextCode = maxCode + 1;
        return nextCode.toString().padStart(10, '0');
    }, [allBOMHeads]);

    useEffect(() => {
        if (isOpen && bom && (mode === 'edit' || mode === 'view')) {
            setFormData({
                HeadItemCode: bom.HeadItemCode || '',
                HeadItemName: bom.HeadItemName || '',
                isActive: bom.isActive === 'true' || bom.isActive === '1' ? '1' : '0'
            });
            setComponents(bom.components || []);
            setOverheads(bom.overheads || []);
            setCurrentComponentPage(1);
        } else if (isOpen && mode === 'new') {
            const nextCode = generateNextHeadItemCode();
            setFormData({
                HeadItemCode: nextCode,
                HeadItemName: '',
                isActive: '1'
            });
            setComponents([]);
            setOverheads([]);
            setCurrentComponentPage(1);
        }
    }, [isOpen, bom, mode, generateNextHeadItemCode]);

    // Get current page components
    const getCurrentPageComponents = useMemo(() => {
        const startIndex = (currentComponentPage - 1) * componentsPerPage;
        const endIndex = startIndex + componentsPerPage;
        return components.slice(startIndex, endIndex);
    }, [components, currentComponentPage]);

    const totalComponentPages = Math.ceil(components.length / componentsPerPage);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddComponent = useCallback(() => {
        setComponents(prev => [...prev, {
            BOMItemCode: '', uom: '1', NoOfQtyRequired: '1', ForNoOfPeices: '1', ProcessID: '1'
        }]);
        const newTotalPages = Math.ceil((components.length + 1) / componentsPerPage);
        setCurrentComponentPage(newTotalPages);
    }, [components.length]);

    const handleUpdateComponent = useCallback((index, updatedData) => {
        const actualIndex = (currentComponentPage - 1) * componentsPerPage + index;
        setComponents(prev => {
            const newComponents = [...prev];
            newComponents[actualIndex] = { ...newComponents[actualIndex], ...updatedData };
            return newComponents;
        });
    }, [currentComponentPage]);

    const handleRemoveComponent = useCallback((localIndex) => {
        const actualIndex = (currentComponentPage - 1) * componentsPerPage + localIndex;
        setComponents(prev => prev.filter((_, i) => i !== actualIndex));
        const newTotalPages = Math.ceil((components.length - 1) / componentsPerPage);
        if (currentComponentPage > newTotalPages && newTotalPages > 0) {
            setCurrentComponentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentComponentPage(1);
        }
    }, [currentComponentPage, components.length]);

    // Overhead handling
    const selectedOverheadsMap = useMemo(() => {
        return (overheads || []).reduce((acc, oh) => {
            if (oh && oh.FOHid) {
                acc[oh.FOHid] = oh.Rate || '0';
            }
            return acc;
        }, {});
    }, [overheads]);

    const handleToggleOverhead = useCallback((fohId) => {
        const newMap = { ...selectedOverheadsMap };
        if (newMap[fohId]) {
            delete newMap[fohId];
        } else {
            newMap[fohId] = '0';
        }
        const overheadsArray = Object.entries(newMap).map(([FOHid, Rate]) => ({
            FOHid,
            Rate
        }));
        setOverheads(overheadsArray);
    }, [selectedOverheadsMap]);

    const handleOverheadRateChange = useCallback((fohId, rate) => {
        const newMap = { ...selectedOverheadsMap };
        newMap[fohId] = rate;
        const overheadsArray = Object.entries(newMap).map(([FOHid, Rate]) => ({
            FOHid,
            Rate
        }));
        setOverheads(overheadsArray);
    }, [selectedOverheadsMap]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.HeadItemName.trim()) {
            alert('Please enter BOM name');
            return;
        }

        setIsSubmitting(true);
        await onSave(formData, components, overheads, mode);
        setIsSubmitting(false);
    }, [formData, components, overheads, mode, onSave]);

    const canEdit = mode !== 'view';
    const isPosted = false; // BOM doesn't have posted status
    const isCancelled = formData.isActive === '0';

    if (!isOpen) return null;

    // Format items for display
    const formattedItems = items.map(item => ({
        ...item,
        display: `${item.code} - ${item.name}`
    }));

    return (
        <div className="bom-modal-overlay">
            <div className="bom-modal-content bom-modal-large">
                <div className="bom-modal-header">
                    <h2>
                        {mode === 'new' ? 'New BOM' : mode === 'edit' ? 'Edit BOM' : 'View BOM'}
                        {formData.HeadItemCode && <span className="bom-code-badge">Code: {formData.HeadItemCode}</span>}
                        {isCancelled && <span className="bom-inactive-badge">Inactive</span>}
                    </h2>
                    <button type="button" className="bom-modal-close" onClick={onClose}>
                        <Icons.X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bom-modal-form">
                    <div className="bom-modal-body">
                        <div className="bom-form-section">
                            <div className="bom-form-row">
                                <div className="bom-form-group">
                                    <label>BOM Code</label>
                                    <input 
                                        type="text" 
                                        name="HeadItemCode" 
                                        value={formData.HeadItemCode} 
                                        disabled={true}
                                        className="bom-input bom-input-disabled" 
                                    />
                                    <small className="bom-form-hint">Auto-generated</small>
                                </div>
                                <div className="bom-form-group full-width">
                                    <label>BOM Name <span className="required">*</span></label>
                                    <input 
                                        type="text" 
                                        name="HeadItemName" 
                                        value={formData.HeadItemName} 
                                        onChange={handleInputChange} 
                                        disabled={!canEdit} 
                                        className="bom-input" 
                                        required 
                                        placeholder="Enter BOM name..."
                                    />
                                </div>
                            </div>
                            {canEdit && (
                                <div className="bom-form-checkbox">
                                    <label className="bom-checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive === '1'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked ? '1' : '0' }))}
                                        />
                                        Active BOM
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="bom-components-section">
                            <div className="bom-components-header">
                                <div className="bom-components-title">
                                    <h3>BOM Components</h3>
                                    <span className="bom-count-badge">{components.length} items</span>
                                </div>
                                {canEdit && (
                                    <button type="button" className="bom-add-btn" onClick={handleAddComponent}>
                                        <Icons.Plus size={14} /> Add Component
                                    </button>
                                )}
                            </div>

                            <div className="bom-components-list">
                                {components.length === 0 ? (
                                    <div className="bom-empty-components">
                                        <Icons.Package size={32} />
                                        <p>No components added yet</p>
                                        {canEdit && (
                                            <button type="button" className="bom-add-btn" onClick={handleAddComponent}>
                                                Add Component
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="bom-components-grid-header">
                                            <div className="bom-header-index">#</div>
                                            <div className="bom-header-item">Item</div>
                                            <div className="bom-header-uom">UOM</div>
                                            <div className="bom-header-qty">Quantity</div>
                                            <div className="bom-header-pieces">Pieces</div>
                                            <div className="bom-header-process">Process</div>
                                            <div className="bom-header-actions"></div>
                                        </div>
                                        
                                        {getCurrentPageComponents.map((comp, idx) => {
                                            const actualIndex = (currentComponentPage - 1) * componentsPerPage + idx;
                                            return (
                                                <BOMComponentRow
                                                    key={actualIndex}
                                                    index={idx}
                                                    data={comp}
                                                    onUpdate={(updated) => handleUpdateComponent(idx, updated)}
                                                    onRemove={handleRemoveComponent}
                                                    items={formattedItems}
                                                    uoms={uoms}
                                                    processes={processes}
                                                    canEdit={canEdit}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                            
                            {totalComponentPages > 1 && (
                                <div className="bom-component-pagination-wrapper">
                                    <Pagination 
                                        currentPage={currentComponentPage}
                                        totalItems={components.length}
                                        itemsPerPage={componentsPerPage}
                                        onPageChange={setCurrentComponentPage}
                                        maxVisiblePages={5}
                                        loading={false}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bom-overheads-section">
                            <div className="bom-overheads-header">
                                <div className="bom-overheads-title">
                                    <h3>BOM Overheads</h3>
                                    <span className="bom-count-badge">{Object.keys(selectedOverheadsMap).length} selected</span>
                                </div>
                            </div>

                            <div className="bom-overheads-list">
                                {!overheadList || overheadList.length === 0 ? (
                                    <div className="bom-empty-overheads">
                                        <Icons.DollarSign size={32} />
                                        <p>No overheads available</p>
                                    </div>
                                ) : (
                                    overheadList.map(overhead => (
                                        <div key={overhead.ccode} className="bom-overhead-item">
                                            <div className="bom-overhead-content">
                                                <div className="bom-overhead-checkbox">
                                                    <label className="bom-checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedOverheadsMap[overhead.ccode]}
                                                            onChange={() => handleToggleOverhead(overhead.ccode)}
                                                            disabled={!canEdit}
                                                        />
                                                        <span className="bom-overhead-name">{overhead.cname}</span>
                                                    </label>
                                                </div>
                                                
                                                {selectedOverheadsMap[overhead.ccode] !== undefined && (
                                                    <div className="bom-overhead-rate">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            value={selectedOverheadsMap[overhead.ccode]} 
                                                            onChange={(e) => handleOverheadRateChange(overhead.ccode, e.target.value)}
                                                            disabled={!canEdit}
                                                            className="bom-input bom-input-small" 
                                                            placeholder="Rate"
                                                        />
                                                        <span className="bom-rate-symbol">$</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bom-modal-footer">
                        <button type="button" className="bom-btn bom-btn-outline" onClick={onClose}>
                            Close
                        </button>
                        
                        {canEdit && mode !== 'view' && (
                            <button type="submit" className="bom-btn bom-btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <Icons.Loader size={14} className="bom-spin" /> : <Icons.Save size={14} />}
                                {mode === 'new' ? 'Create BOM' : 'Update BOM'}
                            </button>
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
const BOMCreation = () => {
    const { credentials, uid, bcode, offcode: authOffcode } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = useMemo(() => authOffcode || credentials?.offcode || '0101', [authOffcode, credentials]);
    const currentUser = useMemo(() => credentials?.username || 'SYSTEM', [credentials]);

    const [boms, setBoms] = useState([]);
    const [lookupData, setLookupData] = useState({ 
        items: [], 
        uoms: [], 
        processes: [], 
        overheads: [],
        allBOMHeads: []
    });
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBOM, setSelectedBOM] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [groupedBOMs, setGroupedBOMs] = useState([]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '', usePagination = false, page = 1, limit = 10) => {
        try {
            let whereClause = offcode ? `offcode = '${offcode}'` : '';
            if (additionalWhere) whereClause += whereClause ? ` AND ${additionalWhere}` : additionalWhere;

            const payload = { 
                tableName, 
                ...(whereClause && { where: whereClause }),
                ...(usePagination && { page, limit, usePagination: true })
            };
            const resp = await authFetch(API_CONFIG.GET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            return data.success ? (usePagination ? { rows: data.rows, totalCount: data.totalCount, totalPages: data.totalPages } : data.rows) : (usePagination ? { rows: [], totalCount: 0, totalPages: 0 } : []);
        } catch (err) {
            console.error(`Error fetching ${tableName}:`, err);
            return usePagination ? { rows: [], totalCount: 0, totalPages: 0 } : [];
        }
    }, []);

    const fetchAllBOMHeads = useCallback(async () => {
        const data = await fetchTableData(API_CONFIG.TABLES.BOM_HEAD, currentOffcode);
        return data;
    }, [fetchTableData, currentOffcode]);

    const fetchBOMs = useCallback(async (page, size, search, status) => {
        setIsLoading(true);
        setError('');
        try {
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) whereClause += ` AND (HeadItemCode LIKE '%${search}%' OR HeadItemName LIKE '%${search}%')`;
            if (status !== 'all') whereClause += ` AND isActive = '${status === 'active' ? 'true' : 'false'}'`;

            const { rows, totalCount: total } = await fetchTableData(
                API_CONFIG.TABLES.BOM_HEAD, 
                currentOffcode, 
                whereClause.split('AND').slice(1).join('AND').trim(),
                true,
                page,
                size
            );

            setBoms(rows || []);
            setTotalCount(total || 0);

            // Fetch lookup data if empty
            if (lookupData.items.length === 0) {
                const [itemsData, uomsData, processesData, overheadsData, allHeadsData] = await Promise.all([
                    fetchTableData(API_CONFIG.TABLES.ITEMS, currentOffcode, "isActive = 'true'"),
                    fetchTableData(API_CONFIG.TABLES.UOM, currentOffcode, "Isactive = 'true'"),
                    fetchTableData(API_CONFIG.TABLES.PROCESS, currentOffcode, "isActive = 'true'"),
                    fetchTableData(API_CONFIG.TABLES.OVERHEAD, currentOffcode),
                    fetchAllBOMHeads()
                ]);

                setLookupData({
                    items: itemsData.map(item => ({
                        code: normalizeValue(item.ItemCode),
                        name: normalizeValue(item.ItemName),
                        uom: normalizeValue(item.uom),
                        costPrice: normalizeValue(item.CostPrice),
                        salePrice: normalizeValue(item.SalePrice),
                        display: `${normalizeValue(item.ItemCode)} - ${normalizeValue(item.ItemName)}`
                    })).sort((a, b) => a.code.localeCompare(b.code)),
                    uoms: uomsData.map(uom => ({
                        id: normalizeValue(uom.ccode),
                        name: normalizeValue(uom.cname),
                        short: normalizeValue(uom.cSHD)
                    })),
                    processes: processesData.map(process => ({
                        id: normalizeValue(process.ccode),
                        name: normalizeValue(process.cname)
                    })),
                    overheads: overheadsData.map(oh => ({
                        ccode: normalizeValue(oh.ccode),
                        cname: normalizeValue(oh.cname)
                    })),
                    allBOMHeads: allHeadsData
                });
            }
        } catch (err) {
            console.error('Error fetching BOMs:', err);
            setError(`Failed to load data: ${err.message}`);
            setBoms([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentOffcode, fetchTableData, fetchAllBOMHeads, lookupData.items.length]);

    const fetchBOMWithDetails = useCallback(async (headItemCode) => {
        try {
            const [components, fohData] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.BOM, currentOffcode, `ItemCode = '${headItemCode}'`),
                fetchTableData(API_CONFIG.TABLES.BOM_FOH, currentOffcode, `HeadItemCode = '${headItemCode}'`)
            ]);

            return {
                components: components.map(comp => ({
                    BOMItemCode: normalizeValue(comp.BOMItemCode),
                    uom: normalizeValue(comp.uom),
                    NoOfQtyRequired: normalizeValue(comp.NoOfQtyRequired),
                    ForNoOfPeices: normalizeValue(comp.ForNoOfPeices),
                    ProcessID: normalizeValue(comp.ProcessID)
                })),
                overheads: fohData.map(foh => ({
                    FOHid: normalizeValue(foh.FOHid),
                    Rate: normalizeValue(foh.Rate)
                }))
            };
        } catch (err) {
            console.error('Error fetching BOM details:', err);
            return { components: [], overheads: [] };
        }
    }, [currentOffcode, fetchTableData]);

    // Group BOMs with their components and overheads
    useEffect(() => {
        const loadGroupedBOMs = async () => {
            if (boms.length > 0) {
                const grouped = await Promise.all(boms.map(async (head) => {
                    const details = await fetchBOMWithDetails(head.HeadItemCode);
                    return {
                        ...head,
                        components: details.components,
                        overheads: details.overheads,
                        componentCount: details.components.length,
                        overheadCount: details.overheads.length
                    };
                }));
                setGroupedBOMs(grouped);
            } else {
                setGroupedBOMs([]);
            }
        };
        loadGroupedBOMs();
    }, [boms, fetchBOMWithDetails]);

    useEffect(() => {
        fetchBOMs(currentPage, pageSize, searchTerm, statusFilter);
    }, [currentPage, pageSize, searchTerm, statusFilter, fetchBOMs]);

    // Load screen config to get menu ID
    useEffect(() => {
        const loadScreenConfig = async () => {
            setIsMenuLoading(true);
            try {
                console.log('Loading screen config for: BOM Creation');
                const response = await authFetch(`${API_BASE1}/screen/get-config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'BOM Creation' })
                });
                const data = await response.json();
                if (data.success && data.screen) {
                    setMenuId(String(data.screen.id));
                    console.log('✅ Menu ID loaded:', String(data.screen.id));
                } else {
                    console.warn('Screen config not found, using default');
                    setMenuId('000000001');
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
                setMenuId('000000001');
            } finally {
                setIsMenuLoading(false);
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

    const handleNewBOM = useCallback(() => {
        setSelectedBOM(null);
        setModalMode('new');
        setIsModalOpen(true);
    }, []);

    const handleViewBOM = useCallback(async (bom) => {
        const details = await fetchBOMWithDetails(bom.HeadItemCode);
        setSelectedBOM({
            ...bom,
            components: details.components,
            overheads: details.overheads
        });
        setModalMode('view');
        setIsModalOpen(true);
    }, [fetchBOMWithDetails]);

    const handleEditBOM = useCallback(async (bom) => {
        if (bom.isActive === 'false' || bom.isActive === '0') {
            setMessage('⚠️ Cannot edit an inactive BOM');
            return;
        }
        const details = await fetchBOMWithDetails(bom.HeadItemCode);
        setSelectedBOM({
            ...bom,
            components: details.components,
            overheads: details.overheads
        });
        setModalMode('edit');
        setIsModalOpen(true);
    }, [fetchBOMWithDetails]);

    const handleSave = useCallback(async (formData, components, overheads, mode) => {
        setIsSaving(true);
        setMessage('');

        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const isActiveValue = formData.isActive === '1' ? 'true' : 'false';

        try {
            // Save BOM Head
            const headPayload = {
                tableName: API_CONFIG.TABLES.BOM_HEAD,
                data: {
                    offcode: currentOffcode,
                    HeadItemCode: formData.HeadItemCode,
                    HeadItemName: formData.HeadItemName,
                    isActive: isActiveValue
                }
            };

            if (mode === 'edit') {
                headPayload.where = {
                    HeadItemCode: formData.HeadItemCode,
                    offcode: currentOffcode
                };
            }

            const headUrl = mode === 'new' ? API_CONFIG.INSERT_URL : API_CONFIG.UPDATE_URL;
            const headResp = await authFetch(headUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(headPayload)
            });

            if (!headResp.ok) throw new Error(`HTTP ${headResp.status}`);
            const headResult = await headResp.json();
            if (!headResult.success) throw new Error('Failed to save BOM head');

            // Delete existing components and overheads for edit mode
            if (mode === 'edit') {
                await authFetch(API_CONFIG.DELETE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tableName: API_CONFIG.TABLES.BOM,
                        where: { ItemCode: formData.HeadItemCode, offcode: currentOffcode }
                    })
                });
                await authFetch(API_CONFIG.DELETE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tableName: API_CONFIG.TABLES.BOM_FOH,
                        where: { HeadItemCode: formData.HeadItemCode, offcode: currentOffcode }
                    })
                });
            }

            // Save Components
            for (const component of components) {
                if (component.BOMItemCode) {
                    const bomPayload = {
                        tableName: API_CONFIG.TABLES.BOM,
                        data: {
                            offcode: currentOffcode,
                            ItemCode: formData.HeadItemCode,
                            BOMItemCode: component.BOMItemCode,
                            uom: component.uom || '1',
                            NoOfQtyRequired: component.NoOfQtyRequired || '1',
                            ForNoOfPeices: component.ForNoOfPeices || '1',
                            ProcessID: component.ProcessID || '1'
                        }
                    };
                    await authFetch(API_CONFIG.INSERT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bomPayload)
                    });
                }
            }

            // Save Overheads
            for (const overhead of overheads) {
                const fohPayload = {
                    tableName: API_CONFIG.TABLES.BOM_FOH,
                    data: {
                        offcode: currentOffcode,
                        HeadItemCode: formData.HeadItemCode,
                        FOHid: overhead.FOHid,
                        Rate: overhead.Rate || '0'
                    }
                };
                await authFetch(API_CONFIG.INSERT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fohPayload)
                });
            }

            setMessage(`✅ BOM ${mode === 'new' ? 'created' : 'updated'} successfully`);
            await fetchBOMs(currentPage, pageSize, searchTerm, statusFilter);
            setIsModalOpen(false);
        } catch (error) {
            console.error('❌ Save error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [currentOffcode, currentPage, pageSize, searchTerm, statusFilter, fetchBOMs]);

    const getStatusBadge = useCallback((isActive) => {
        if (isActive === 'true' || isActive === '1') {
            return <span className="bom-status-badge bom-active">Active</span>;
        } else {
            return <span className="bom-status-badge bom-inactive">Inactive</span>;
        }
    }, []);

    if (rightsLoading || isMenuLoading) {
        return (
            <div className="bom-loading-container">
                <Icons.Loader size={24} className="bom-spin" />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="bom-container">
            <div className="bom-toolbar">
                <div className="bom-toolbar-group">
                    <button type="button" className="bom-toolbar-btn bom-primary" onClick={handleNewBOM}>
                        <Icons.Plus size={14} /> <span>New BOM</span>
                    </button>
                </div>
                <div className="bom-toolbar-group">
                    <button type="button" className="bom-toolbar-btn" onClick={() => fetchBOMs(currentPage, pageSize, searchTerm, statusFilter)}>
                        <Icons.RefreshCw size={14} /> <span>Refresh</span>
                    </button>
                </div>
            </div>

            {(error || message) && (
                <div className={`bom-toast ${error ? 'bom-error' : message.includes('❌') ? 'bom-error' : message.includes('⚠️') ? 'bom-warning' : 'bom-success'}`}>
                    <div className="bom-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={16} />}
                        {message.includes('❌') && <Icons.AlertCircle size={16} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={16} />}
                        <span>{(error || message).replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button type="button" className="bom-toast-close" onClick={() => { setError(''); setMessage(''); }}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            <div className="bom-main-content">
                <div className="bom-search-bar">
                    <div className="bom-search-container">
                        <Icons.Search size={14} className="bom-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by BOM code or name..." 
                            value={localSearchTerm} 
                            onChange={e => setLocalSearchTerm(e.target.value)} 
                            className="bom-search-input" 
                        />
                    </div>
                    <div className="bom-filter-container">
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bom-filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {isLoading && groupedBOMs.length === 0 ? (
                    <div className="bom-loading-state">
                        <Icons.Loader size={24} className="bom-spin" />
                        <p>Loading BOMs...</p>
                    </div>
                ) : groupedBOMs.length > 0 ? (
                    <>
                        <div className="bom-table-container">
                            <table className="bom-table">
                                <thead>
                                    <tr>
                                        <th>BOM Code</th>
                                        <th>BOM Name</th>
                                        <th>Components</th>
                                        <th>Overheads</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedBOMs.map(bom => (
                                        <tr key={bom.HeadItemCode}>
                                            <td>{bom.HeadItemCode}</td>
                                            <td>{bom.HeadItemName}</td>
                                            <td>
                                                <span className="bom-count-chip">
                                                    <Icons.Layers size={12} />
                                                    {bom.componentCount} items
                                                </span>
                                            </td>
                                            <td>
                                                <span className="bom-count-chip">
                                                    <Icons.DollarSign size={12} />
                                                    {bom.overheadCount} overheads
                                                </span>
                                            </td>
                                            <td>{getStatusBadge(bom.isActive)}</td>
                                            <td>
                                                <div className="bom-action-buttons">
                                                    <button 
                                                        type="button"
                                                        className="bom-action-btn" 
                                                        onClick={() => handleViewBOM(bom)} 
                                                        title="View"
                                                    >
                                                        <Icons.Eye size={14} />
                                                    </button>
                                                    
                                                    {(bom.isActive === 'true' || bom.isActive === '1') && (
                                                        <button 
                                                            type="button"
                                                            className="bom-action-btn" 
                                                            onClick={() => handleEditBOM(bom)} 
                                                            title="Edit"
                                                        >
                                                            <Icons.Edit size={14} />
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
                            <div className="bom-pagination-wrapper">
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
                    <div className="bom-empty-state">
                        <Icons.Package size={32} className="bom-empty-icon" />
                        <h4>No BOMs found</h4>
                        <p>{localSearchTerm ? 'Try a different search term' : 'Click New BOM to create one'}</p>
                    </div>
                )}
            </div>

            <BOMModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                bom={selectedBOM} 
                onSave={handleSave} 
                mode={modalMode} 
                lookupData={lookupData} 
                currentOffcode={currentOffcode}
                currentUser={currentUser}
            />
        </div>
    );
};

export default BOMCreation;