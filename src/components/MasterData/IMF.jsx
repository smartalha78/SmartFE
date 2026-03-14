import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import "./IMF.css";
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
        ITEM: 'imf',
        ACCOUNT: 'acChartOfAccount',
        BRANCH: 'comBranch',
        GODOWN: 'comGodown',
        UOM: 'comUOM'
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

// Get current date in database format
const getCurrentDateTime = () => {
    return formatDateForDB(new Date());
};

/* ---------------------------
 * Initial State (with audit fields)
---------------------------- */
const getInitialItemData = (offcode = '', currentUser = 'SYSTEM') => ({
    StoreMainType: '',
    offcode: offcode,
    ItemParent: '00',
    ItemCode: '',
    ItemName: '',
    ItemType: '1',
    InvType: '1',
    uom: '1',
    nlevel: '1',
    IsItemLevel: 'false',
    isActive: 'true',
    isDispatch: 'false',
    isPurchase: 'true',
    isManufactur: 'false',
    isConsumeable: 'true',
    minQty: '0',
    CriticalQty: '0',
    ReorderQty: '0',
    pictureURL: '',
    CostPrice: '0.00',
    DeliveryTime: '0',
    SalePrice: '0.00',
    DeliveryLeadTime: '0',
    ManufacturLeadTime: '0',
    AssetAccount: '',
    PurchaseReturnAccount: '',
    InputTaxAccount: '',
    InputTaxRate: '0',
    IncomeAccount: '',
    SalesReturnAccount: '',
    OutPutTaxAccount: '',
    OutPutTaxRate: '0',
    ConsumptionAccount: '',
    AdjustmentAccount: '',
    typeCategory: 'Organic',
    PartNo: '',
    HsCode: '',
    noExpDays: '0',
    excessQtyper: '0',
    alternativeCode: '',
    DiscountPer: '0',
    DiscountAmt: '0.000',
    isOutSource: 'false',
    HeadItemCode: '',
    alterItemName: '',
    pictureURL1: '',
    pictureURL2: '',
    pictureURL3: '',
    PackingNetWeight: '0.000',
    PackingGrossWeight: '0.000',
    PackingLenth: '0',
    PackingWidth: '0',
    PackingHight: '0',
    OPbalQty: '0.000',
    OPbalValue: '0.000',
    balQty: '0.000',
    balValue: '0.000',
    alterItemName1: '',
    branchalternativecode: '',
    isbundleItem: 'false',
    PackingQty: '0',
    createdby: currentUser,
    createdate: getCurrentDateTime(),
    editby: '',
    editdate: ''
});

// Prepare data for database insertion/update (with audit fields)
const prepareDataForDB = (data, mode, currentUser, currentOffcode) => {
    const currentDateTime = getCurrentDateTime();
    
    // Create base object with all fields
    const preparedData = {
        offcode: currentOffcode,
        StoreMainType: data.StoreMainType || '',
        ItemParent: data.ItemParent || '00',
        ItemCode: data.ItemCode || '',
        ItemName: data.ItemName || '',
        ItemType: data.ItemType || '1',
        InvType: data.InvType || '1',
        uom: data.uom || '1',
        nlevel: data.nlevel || '1',
        IsItemLevel: isActiveValue(data.IsItemLevel) ? 'True' : 'False',
        isActive: isActiveValue(data.isActive) ? 'True' : 'False',
        isDispatch: isActiveValue(data.isDispatch) ? 'True' : 'False',
        isPurchase: isActiveValue(data.isPurchase) ? 'True' : 'False',
        isManufactur: isActiveValue(data.isManufactur) ? 'True' : 'False',
        isConsumeable: isActiveValue(data.isConsumeable) ? 'True' : 'False',
        minQty: data.minQty || '0',
        CriticalQty: data.CriticalQty || '0',
        ReorderQty: data.ReorderQty || '0',
        pictureURL: data.pictureURL || '',
        CostPrice: data.CostPrice || '0.00',
        DeliveryTime: data.DeliveryTime || '0',
        SalePrice: data.SalePrice || '0.00',
        DeliveryLeadTime: data.DeliveryLeadTime || '0',
        ManufacturLeadTime: data.ManufacturLeadTime || '0',
        AssetAccount: data.AssetAccount || '',
        PurchaseReturnAccount: data.PurchaseReturnAccount || '',
        InputTaxAccount: data.InputTaxAccount || '',
        InputTaxRate: data.InputTaxRate || '0',
        IncomeAccount: data.IncomeAccount || '',
        SalesReturnAccount: data.SalesReturnAccount || '',
        OutPutTaxAccount: data.OutPutTaxAccount || '',
        OutPutTaxRate: data.OutPutTaxRate || '0',
        ConsumptionAccount: data.ConsumptionAccount || '',
        AdjustmentAccount: data.AdjustmentAccount || '',
        typeCategory: data.typeCategory || 'Organic',
        PartNo: data.PartNo || '',
        HsCode: data.HsCode || '',
        noExpDays: data.noExpDays || '0',
        excessQtyper: data.excessQtyper || '0',
        alternativeCode: data.alternativeCode || '',
        DiscountPer: data.DiscountPer || '0',
        DiscountAmt: data.DiscountAmt || '0.000',
        isOutSource: isActiveValue(data.isOutSource) ? 'True' : 'False',
        HeadItemCode: data.HeadItemCode || '',
        alterItemName: data.alterItemName || '',
        pictureURL1: data.pictureURL1 || '',
        pictureURL2: data.pictureURL2 || '',
        pictureURL3: data.pictureURL3 || '',
        PackingNetWeight: data.PackingNetWeight || '0.000',
        PackingGrossWeight: data.PackingGrossWeight || '0.000',
        PackingLenth: data.PackingLenth || '0',
        PackingWidth: data.PackingWidth || '0',
        PackingHight: data.PackingHight || '0',
        OPbalQty: data.OPbalQty || '0.000',
        OPbalValue: data.OPbalValue || '0.000',
        balQty: data.balQty || '0.000',
        balValue: data.balValue || '0.000',
        alterItemName1: data.alterItemName1 || '',
        branchalternativecode: data.branchalternativecode || '',
        isbundleItem: isActiveValue(data.isbundleItem) ? 'True' : 'False',
        PackingQty: data.PackingQty || '0'
    };

    // Add audit fields based on mode
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

    // Remove any undefined values
    Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
            delete preparedData[key];
        }
    });

    console.log('Prepared data for DB:', preparedData);

    return preparedData;
};

/* ---------------------------
 * Data Service with Server-Side Pagination
---------------------------- */
const useItemDataService = () => {
    const { credentials } = useAuth();
    const [items, setItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [lookupData, setLookupData] = useState({
        accounts: [],
        branches: [],
        godowns: [],
        uomList: [],
        itemTypes: [
            { code: '1', name: 'RAW' },
            { code: '2', name: 'SEMI-FINISHED/MILL FINISH' },
            { code: '3', name: 'FINISHED' }
        ],
        inventoryTypes: [
            { code: '1', name: 'Inventory' },
            { code: '2', name: 'NON-Inventory' },
            { code: '3', name: 'Services' },
            { code: '4', name: 'BUNDLE' }
        ],
        fixedAccounts: {
            inputTaxAccounts: [
                { code: '0203050002', name: 'WithHolding Tax payables(Vendors)' }
            ],
            incomeAccounts: [
                { code: '0400000001', name: 'Revenue accounts' },
                { code: '0400000002', name: 'Revenue accounts foreign currency' }
            ],
            outputTaxAccounts: [
                { code: '0203050002', name: 'WithHolding Tax payables(Vendors)' }
            ],
            consumptionAccounts: [
                { code: '0305010001', name: 'Purchase Account' },
                { code: '0305010002', name: 'Purchase Return' },
                { code: '0305010003', name: 'Carriage Inward' },
                { code: '0305010004', name: 'Carriage outward' }
            ]
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCode, setMaxCode] = useState(0);

    // Generic function to fetch table data with offcode filtering
    const fetchTableData = useCallback(async (tableName, offcode, additionalWhere = '') => {
        try {
            let whereClause = '';
            if (offcode) {
                const offcodeColumn = tableName === API_CONFIG.TABLES.ACCOUNT ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.BRANCH ? 'offcode' :
                                     tableName === API_CONFIG.TABLES.GODOWN ? 'offcode' :
                                     tableName === API_CONFIG.TABLES.UOM ? 'offcode' : 
                                     tableName === API_CONFIG.TABLES.ITEM ? 'offcode' : 'offcode';
                
                whereClause = `${offcodeColumn} = '${offcode}'`;
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

    // Function to fetch maximum item code
    const fetchMaxItemCode = useCallback(async (offcode, parentCode = '00') => {
        try {
            const allItemsData = await fetchTableData(API_CONFIG.TABLES.ITEM, offcode);
            
            // Filter items with the same parent
            const siblingItems = allItemsData.filter(item => 
                normalizeValue(item.ItemParent) === parentCode
            );
            
            const codes = siblingItems
                .map(item => {
                    const code = normalizeValue(item.ItemCode);
                    // Handle both string and number codes
                    if (code.startsWith('0')) {
                        return parseInt(code, 10);
                    }
                    return parseInt(code, 10);
                })
                .filter(code => !isNaN(code) && code > 0);

            return codes.length > 0 ? Math.max(...codes) : 0;
        } catch (err) {
            console.error('Error fetching max item code:', err);
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
                setItems([]);
                setTotalCount(0);
                setIsLoading(false);
                return;
            }

            console.log(`Fetching items for offcode: ${currentOffcode}, page: ${page}, size: ${size}, search: ${search}`);
            
            let whereClause = `offcode = '${currentOffcode}'`;
            if (search) {
                whereClause += ` AND (ItemCode LIKE '%${search}%' OR ItemName LIKE '%${search}%')`;
            }
            
            const payload = { 
                tableName: API_CONFIG.TABLES.ITEM,
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
                setItems(data.rows || []);
                setTotalCount(data.totalCount || 0);
                
                // Fetch lookup data after getting items
                await fetchLookupData(currentOffcode);
            } else {
                setItems([]);
                setTotalCount(0);
            }

        } catch (err) {
            console.error('Error fetching items:', err);
            setError(`Failed to load data: ${err.message}`);
            setItems([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, fetchTableData]);

    const fetchLookupData = useCallback(async (offcode) => {
        try {
            const [
                accountData,
                branchData,
                godownData,
                uomData
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.ACCOUNT, offcode),
                fetchTableData(API_CONFIG.TABLES.BRANCH, offcode),
                fetchTableData(API_CONFIG.TABLES.GODOWN, offcode, "IsActive = 'True'"),
                fetchTableData(API_CONFIG.TABLES.UOM, offcode)
            ]);

            // Find current branch
            const currentBranch = branchData.find(b =>
                normalizeValue(b.offcode) === offcode
            );

            const parentAccount = normalizeValue(
                currentBranch?.imfAsset || currentBranch?.imfAssets || '010108'
            );

            // Filter accounts based on parent
            const filteredAccounts = accountData.filter(acc =>
                normalizeValue(acc.parent) === parentAccount &&
                isActiveValue(acc.isActive)
            );

            // Process accounts
            const processedAccounts = filteredAccounts.map(acc => ({
                code: normalizeValue(acc.code),
                name: normalizeValue(acc.name)
            }));

            // Process godowns
            const processedGodowns = godownData.map(godown => ({
                code: normalizeValue(godown.godownID),
                name: normalizeValue(godown.description)
            }));

            // Process UOM
            const processedUOM = uomData.map(uom => ({
                code: normalizeValue(uom.ccode),
                name: normalizeValue(uom.cname),
                symbol: normalizeValue(uom.cSHD)
            }));

            setLookupData(prev => ({
                ...prev,
                accounts: processedAccounts,
                branches: branchData,
                godowns: processedGodowns,
                uomList: processedUOM
            }));

            console.log('✅ Lookup data loaded:', {
                accounts: processedAccounts.length,
                godowns: processedGodowns.length,
                uom: processedUOM.length,
                hasBranch: !!currentBranch
            });

        } catch (err) {
            console.error('Error fetching lookup data:', err);
        }
    }, [fetchTableData]);

    // Load data whenever pagination or search changes
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
        items,
        totalCount,
        totalPages,
        lookupData,
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
        fetchMaxItemCode
    };
};

/* ---------------------------
 * Image Upload Component
---------------------------- */
const ItemImageUpload = ({ imageUrl, onImageChange, itemCode, canEdit, label }) => {
    const [previewUrl, setPreviewUrl] = useState(imageUrl);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setPreviewUrl(imageUrl);
    }, [imageUrl]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
                onImageChange(e.target.result);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl('');
        onImageChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="ip-image-upload-container">
            <div className="ip-image-preview-wrapper">
                {previewUrl ? (
                    <div className="ip-image-preview">
                        <img src={previewUrl} alt={label || "Item"} />
                        {canEdit && (
                            <button
                                type="button"
                                className="ip-remove-image-btn"
                                onClick={handleRemoveImage}
                                title="Remove image"
                            >
                                <Icons.X size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="ip-image-placeholder">
                        <Icons.Image className="ip-placeholder-icon" size={24} />
                        <span className="ip-placeholder-text">No Image</span>
                    </div>
                )}
            </div>

            {canEdit && (
                <div className="ip-upload-controls">
                    <input
                        type="file"
                        ref={fileInputRef}
                        id={`image-upload-${label}`}
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor={`image-upload-${label}`} className="ip-upload-btn">
                        <Icons.Upload size={14} />
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </label>
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Collapsible Section Component
---------------------------- */
const ItemCollapsibleSection = ({ title, icon, children, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`ip-form-section ${isExpanded ? 'ip-expanded' : 'ip-collapsed'}`}>
            <div className="ip-section-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="ip-section-title">
                    {icon}
                    <h4>{title}</h4>
                </div>
                <Icons.ChevronDown className={`ip-chevron ${isExpanded ? 'ip-expanded' : ''}`} size={18} />
            </div>
            {isExpanded && (
                <div className="ip-section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Item Tree Components
---------------------------- */
const ItemTreeNode = ({ node, level = 0, onSelect, selectedItem, hasPermission, menuId, onDelete }) => {
    const nodeCode = normalizeValue(node.ItemCode);
    const nodeName = normalizeValue(node.ItemName);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedItem && selectedItem.ItemCode === nodeCode;
    const [expanded, setExpanded] = useState(level < 2);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(node);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return '';
        }
    };

    return (
        <div className="ip-tree-node">
            <div 
                className={`ip-tree-node-row ${isSelected ? 'ip-selected' : ''}`} 
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                <div className="ip-tree-left">
                    {hasChildren ? (
                        <button
                            className="ip-toggle-btn"
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        >
                            {expanded ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
                        </button>
                    ) : (
                        <div className="ip-toggle-spacer"></div>
                    )}
                    <div className="ip-tree-main" onClick={() => onSelect(node)}>
                        <div className="ip-node-content">
                            {hasChildren ? (
                                <Icons.Folder className="ip-folder-icon" size={14} />
                            ) : (
                                <Icons.Package className="ip-item-icon" size={14} />
                            )}
                            <div className="ip-node-text">
                                <span className="ip-node-code">{nodeCode}</span>
                                <span className="ip-node-name">{nodeName}</span>
                            </div>
                        </div>
                        <div className="ip-node-badges">
                            <span className="ip-node-level-badge">L{node.nlevel}</span>
                            {node.createdby && (
                                <span className="ip-node-audit" title={`Created: ${formatDate(node.createdate)} by ${node.createdby}`}>
                                    <Icons.User size={10} />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="ip-tree-right">
                    <span className={`ip-status-dot ${isActiveValue(node.isActive) ? 'ip-active' : 'ip-inactive'}`} />
                    {hasPermission && hasPermission(menuId, 'delete') && (
                        <button
                            className="ip-delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete Item"
                        >
                            <Icons.Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>
            {expanded && hasChildren && (
                <div className="ip-children-container">
                    {node.children.map(child => (
                        <ItemTreeNode
                            key={normalizeValue(child.ItemCode)}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedItem={selectedItem}
                            hasPermission={hasPermission}
                            menuId={menuId}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ItemTreeSidebar = ({ items, selectedItem, onItemSelect, searchTerm, onSearchChange, isLoading, hasPermission, menuId, onDelete }) => {
    const buildTree = useCallback(() => {
        const itemMap = new Map();
        items.forEach(item => {
            itemMap.set(item.ItemCode, { ...item, children: [] });
        });

        const tree = [];
        items.forEach(item => {
            const node = itemMap.get(item.ItemCode);
            const parentCode = normalizeValue(item.ItemParent);

            if (parentCode === '00' || parentCode === '') {
                tree.push(node);
            } else {
                const parent = itemMap.get(parentCode);
                if (parent) {
                    parent.children.push(node);
                } else {
                    tree.push(node);
                }
            }
        });

        const sortTree = (nodes) => nodes.sort((a, b) => a.ItemCode.localeCompare(b.ItemCode));
        const sortedTree = sortTree(tree);

        const sortChildren = (nodes) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    node.children = sortTree(node.children);
                    sortChildren(node.children);
                }
            });
        };
        sortChildren(sortedTree);

        return sortedTree;
    }, [items]);

    const isNodeVisible = useCallback((node) => {
        const nodeCode = normalizeValue(node.ItemCode);
        const nodeName = normalizeValue(node.ItemName);
        if (searchTerm === '') return true;
        return nodeName.toLowerCase().includes(searchTerm.toLowerCase()) || nodeCode.includes(searchTerm);
    }, [searchTerm]);

    const filterTree = useCallback((nodes) => {
        return nodes
            .map(node => {
                const children = filterTree(node.children || []);
                const matches = isNodeVisible(node);
                if (matches || children.length > 0) return { ...node, children };
                return null;
            })
            .filter(Boolean);
    }, [isNodeVisible]);

    const fullTree = buildTree();
    const visibleTree = searchTerm ? filterTree(fullTree) : fullTree;

    return (
        <aside className="ip-sidebar">
            <div className="ip-sidebar-header">
                <div className="ip-sidebar-title">
                    <Icons.Package size={18} />
                    <h3>Item Hierarchy</h3>
                    <span className="ip-item-count">{items.length} items</span>
                </div>
                <div className="ip-sidebar-actions">
                    <div className="ip-search-container">
                        <Icons.Search size={14} className="ip-search-icon" />
                        <input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="ip-search-input"
                        />
                    </div>
                </div>
            </div>
            <div className="ip-sidebar-content">
                {isLoading ? (
                    <div className="ip-loading-state">
                        <Icons.Loader size={24} className="ip-spin" />
                        <p>Loading items...</p>
                    </div>
                ) : visibleTree.length === 0 ? (
                    <div className="ip-empty-state">
                        <Icons.FolderOpen size={32} className="ip-empty-icon" />
                        <h4>No items found</h4>
                        <p>{searchTerm ? 'Try a different search term' : 'Create a root item to get started'}</p>
                    </div>
                ) : (
                    <div className="ip-tree-container">
                        {visibleTree.map(n => (
                            <ItemTreeNode
                                key={normalizeValue(n.ItemCode)}
                                node={n}
                                onSelect={onItemSelect}
                                selectedItem={selectedItem}
                                hasPermission={hasPermission}
                                menuId={menuId}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

/* ---------------------------
 * Item Detail Form Component
---------------------------- */
const ItemDetailForm = ({
    formData,
    onFormChange,
    onSave,
    onNewItem,
    currentMode,
    selectedItem,
    isLoading,
    isDataLoading,
    lookupData,
    showAllFields,
    onToggleFields,
    hasPermission,
    menuId
}) => {
    const { credentials } = useAuth();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';

    const {
        StoreMainType, ItemParent, ItemCode, ItemName, ItemType, InvType, uom, nlevel,
        IsItemLevel, isActive, isDispatch, isPurchase, isManufactur, isConsumeable,
        minQty, CriticalQty, ReorderQty, pictureURL, CostPrice, DeliveryTime, SalePrice,
        DeliveryLeadTime, ManufacturLeadTime, AssetAccount, PurchaseReturnAccount, InputTaxAccount,
        InputTaxRate, IncomeAccount, SalesReturnAccount, OutPutTaxAccount, OutPutTaxRate,
        ConsumptionAccount, AdjustmentAccount, typeCategory, PartNo, HsCode, noExpDays,
        excessQtyper, alternativeCode, DiscountPer, DiscountAmt, isOutSource, HeadItemCode,
        alterItemName, pictureURL1, pictureURL2, pictureURL3, PackingNetWeight,
        PackingGrossWeight, PackingLenth, PackingWidth, PackingHight, OPbalQty, OPbalValue,
        balQty, balValue, alterItemName1, branchalternativecode, isbundleItem, PackingQty,
        createdby, createdate, editby, editdate
    } = formData;

    const isNewMode = currentMode === 'new';
    const isLevel4 = parseInt(nlevel || '1') === 4;
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    const handleInput = (field, value) => onFormChange(field, value);
    const handleNumericInput = (field, value) => onFormChange(field, value.replace(/[^0-9.]/g, ''));
    const handleCheckbox = (field, e) => onFormChange(field, e.target.checked ? 'true' : 'false');

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    const {
        accounts,
        godowns,
        uomList,
        itemTypes,
        inventoryTypes,
        fixedAccounts
    } = lookupData;

    // Handle store types selection
    const handleStoreTypeChange = (storeCode, checked) => {
        const currentStores = StoreMainType ? StoreMainType.split(',').filter(s => s) : [];
        let newStores;
        
        if (checked) {
            newStores = [...currentStores, storeCode];
        } else {
            newStores = currentStores.filter(s => s !== storeCode);
        }
        
        onFormChange('StoreMainType', newStores.join(','));
    };

    return (
        <div className="ip-detail-panel">
            <div className="ip-detail-header">
                <div>
                    <h2>{isNewMode ? 'Create New Item' : `Item: ${ItemName || 'Item'}`}</h2>
                    <div className="ip-detail-meta">
                        <span className={`ip-mode-badge ${isNewMode ? 'ip-new' : 'ip-edit'}`}>
                            {isNewMode ? 'NEW' : 'EDIT'}
                        </span>
                        <span className="ip-code-badge">{ItemCode || 'No Code'}</span>
                        <span className="ip-office-badge">Level {nlevel}</span>
                        {!isActiveValue(isActive) && <span className="ip-inactive-badge">INACTIVE</span>}
                        {isLevel4 && <span className="ip-maxlevel-badge">MAX LEVEL</span>}
                    </div>
                </div>
                <div className="ip-detail-actions">
                    {canEdit && (
                        <>
                            <button
                                className="ip-btn ip-btn-outline"
                                onClick={onToggleFields}
                                title={showAllFields ? "Show basic fields" : "Show all fields"}
                            >
                                {showAllFields ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                                {showAllFields ? "Basic" : "Full"}
                            </button>
                            <button
                                className="ip-btn ip-btn-outline"
                                onClick={onNewItem}
                                disabled={isLevel4 && !isNewMode}
                                title={isLevel4 ? "Cannot create child at maximum level (4)" : "Create new child item"}
                            >
                                <Icons.Plus size={16} />
                                {selectedItem && currentMode === 'edit' ? 'Child' : 'Root'}
                            </button>
                            <button
                                className={`ip-btn ip-btn-primary ${isLoading ? 'ip-loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || isDataLoading || !ItemCode || !ItemName}
                            >
                                {isLoading ? <Icons.Loader size={16} className="ip-spin" /> : <Icons.Save size={16} />}
                                {isLoading ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="ip-detail-content">
                <div className="ip-form-layout">
                    {/* Left Column - Images and Basic Info */}
                    <div className="ip-form-column">
                        <ItemCollapsibleSection title="Item Images" icon={<Icons.Image size={16} />} defaultExpanded={true}>
                            <div className="ip-image-grid">
                                <div className="ip-image-item">
                                    <label>Main Image</label>
                                    <ItemImageUpload
                                        imageUrl={pictureURL}
                                        onImageChange={(value) => handleInput('pictureURL', value)}
                                        itemCode={ItemCode}
                                        canEdit={canEdit}
                                        label="main"
                                    />
                                </div>
                                <div className="ip-image-item">
                                    <label>Image 2</label>
                                    <ItemImageUpload
                                        imageUrl={pictureURL1}
                                        onImageChange={(value) => handleInput('pictureURL1', value)}
                                        itemCode={ItemCode}
                                        canEdit={canEdit}
                                        label="img2"
                                    />
                                </div>
                                <div className="ip-image-item">
                                    <label>Image 3</label>
                                    <ItemImageUpload
                                        imageUrl={pictureURL2}
                                        onImageChange={(value) => handleInput('pictureURL2', value)}
                                        itemCode={ItemCode}
                                        canEdit={canEdit}
                                        label="img3"
                                    />
                                </div>
                                <div className="ip-image-item">
                                    <label>Image 4</label>
                                    <ItemImageUpload
                                        imageUrl={pictureURL3}
                                        onImageChange={(value) => handleInput('pictureURL3', value)}
                                        itemCode={ItemCode}
                                        canEdit={canEdit}
                                        label="img4"
                                    />
                                </div>
                            </div>
                        </ItemCollapsibleSection>

                        <ItemCollapsibleSection title="Basic Information" icon={<Icons.FileText size={16} />} defaultExpanded={true}>
                            <div className="ip-form-grid ip-grid-2">
                                <div className="ip-field-group">
                                    <label>Parent Code</label>
                                    <div className="ip-field-display">
                                        <Icons.Folder size={14} />
                                        <span className="ip-mono">{ItemParent}</span>
                                    </div>
                                </div>
                                <div className="ip-field-group">
                                    <label>Item Code</label>
                                    <div className="ip-field-display">
                                        <Icons.Package size={14} />
                                        <span className="ip-mono">{ItemCode}</span>
                                    </div>
                                    {isNewMode && <span className="ip-field-hint">Auto-generated</span>}
                                </div>

                                <div className="ip-field-group ip-full-width">
                                    <label>Item Name *</label>
                                    <input
                                        value={ItemName}
                                        onChange={e => handleInput('ItemName', e.target.value)}
                                        placeholder="Enter item name..."
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>

                                <div className="ip-field-group ip-full-width">
                                    <label>Alternative Name</label>
                                    <input
                                        value={alterItemName}
                                        onChange={e => handleInput('alterItemName', e.target.value)}
                                        placeholder="Enter alternative name..."
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>

                                <div className="ip-field-group">
                                    <label>Item Type</label>
                                    <select 
                                        value={ItemType} 
                                        onChange={e => handleInput('ItemType', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {itemTypes.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Inventory Type</label>
                                    <select 
                                        value={InvType} 
                                        onChange={e => handleInput('InvType', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {inventoryTypes.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Unit of Measure</label>
                                    <select 
                                        value={uom} 
                                        onChange={e => handleInput('uom', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {uomList.map(t => (
                                            <option key={t.code} value={t.code}>
                                                {t.name} {t.symbol ? `(${t.symbol})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Category</label>
                                    <select 
                                        value={typeCategory} 
                                        onChange={e => handleInput('typeCategory', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="Organic">Organic</option>
                                        <option value="In Organic">In Organic</option>
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Level</label>
                                    <div className="ip-field-display">
                                        <Icons.Layers size={14} />
                                        <span>{nlevel}</span>
                                    </div>
                                </div>
                            </div>
                        </ItemCollapsibleSection>

                        <ItemCollapsibleSection title="Store Locations" icon={<Icons.Warehouse size={16} />} defaultExpanded={false}>
                            <div className="ip-checkbox-group">
                                {godowns.map(store => (
                                    <div key={store.code} className="ip-checkbox-item">
                                        <label className="ip-checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={StoreMainType && StoreMainType.split(',').includes(store.code)}
                                                onChange={(e) => handleStoreTypeChange(store.code, e.target.checked)}
                                                disabled={!canEdit}
                                            />
                                            <span className="ip-checkbox-custom"></span>
                                            <span className="ip-checkbox-label">{store.code} - {store.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {StoreMainType && (
                                <div className="ip-field-hint">
                                    Selected: {StoreMainType.split(',').map(code => {
                                        const store = godowns.find(s => s.code === code);
                                        return store ? `${store.code}` : code;
                                    }).join(', ')}
                                </div>
                            )}
                        </ItemCollapsibleSection>
                    </div>

                    {/* Right Column - Other Sections */}
                    <div className="ip-form-column">
                        <ItemCollapsibleSection title="Pricing" icon={<Icons.DollarSign size={16} />} defaultExpanded={false}>
                            <div className="ip-form-grid ip-grid-2">
                                <div className="ip-field-group">
                                    <label>Cost Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={CostPrice}
                                        onChange={e => handleNumericInput('CostPrice', e.target.value)}
                                        placeholder="0.00"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Sale Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={SalePrice}
                                        onChange={e => handleNumericInput('SalePrice', e.target.value)}
                                        placeholder="0.00"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Discount %</label>
                                    <input
                                        type="number"
                                        value={DiscountPer}
                                        onChange={e => handleNumericInput('DiscountPer', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Discount Amount</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={DiscountAmt}
                                        onChange={e => handleNumericInput('DiscountAmt', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                            </div>
                        </ItemCollapsibleSection>

                        <ItemCollapsibleSection title="Inventory Control" icon={<Icons.BarChart2 size={16} />} defaultExpanded={false}>
                            <div className="ip-form-grid ip-grid-2">
                                <div className="ip-field-group">
                                    <label>Min Quantity</label>
                                    <input
                                        type="number"
                                        value={minQty}
                                        onChange={e => handleNumericInput('minQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Critical Qty</label>
                                    <input
                                        type="number"
                                        value={CriticalQty}
                                        onChange={e => handleNumericInput('CriticalQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Reorder Qty</label>
                                    <input
                                        type="number"
                                        value={ReorderQty}
                                        onChange={e => handleNumericInput('ReorderQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Delivery Time</label>
                                    <input
                                        type="number"
                                        value={DeliveryTime}
                                        onChange={e => handleNumericInput('DeliveryTime', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Excess Qty %</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={excessQtyper}
                                        onChange={e => handleNumericInput('excessQtyper', e.target.value)}
                                        placeholder="0.00"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Opening Qty</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={OPbalQty}
                                        onChange={e => handleNumericInput('OPbalQty', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Opening Value</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={OPbalValue}
                                        onChange={e => handleNumericInput('OPbalValue', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>
                                <div className="ip-field-group">
                                    <label>Current Qty</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={balQty}
                                        placeholder="0.000"
                                        disabled
                                        className="ip-form-input ip-disabled"
                                    />
                                </div>
                            </div>
                        </ItemCollapsibleSection>

                        <ItemCollapsibleSection title="Account Mapping" icon={<Icons.Database size={16} />} defaultExpanded={false}>
                            <div className="ip-form-grid ip-grid-2">
                                <div className="ip-field-group">
                                    <label>Asset Account</label>
                                    <select 
                                        value={AssetAccount} 
                                        onChange={e => handleInput('AssetAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Purchase Return</label>
                                    <select 
                                        value={PurchaseReturnAccount} 
                                        onChange={e => handleInput('PurchaseReturnAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Input Tax</label>
                                    <select 
                                        value={InputTaxAccount} 
                                        onChange={e => handleInput('InputTaxAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {fixedAccounts.inputTaxAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Input Tax Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={InputTaxRate}
                                        onChange={e => handleNumericInput('InputTaxRate', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>

                                <div className="ip-field-group">
                                    <label>Income Account</label>
                                    <select 
                                        value={IncomeAccount} 
                                        onChange={e => handleInput('IncomeAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {fixedAccounts.incomeAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Sales Return</label>
                                    <select 
                                        value={SalesReturnAccount} 
                                        onChange={e => handleInput('SalesReturnAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Output Tax</label>
                                    <select 
                                        value={OutPutTaxAccount} 
                                        onChange={e => handleInput('OutPutTaxAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {fixedAccounts.outputTaxAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Output Tax Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={OutPutTaxRate}
                                        onChange={e => handleNumericInput('OutPutTaxRate', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                        className="ip-form-input"
                                    />
                                </div>

                                <div className="ip-field-group">
                                    <label>Consumption</label>
                                    <select 
                                        value={ConsumptionAccount} 
                                        onChange={e => handleInput('ConsumptionAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {fixedAccounts.consumptionAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ip-field-group">
                                    <label>Adjustment</label>
                                    <select 
                                        value={AdjustmentAccount} 
                                        onChange={e => handleInput('AdjustmentAccount', e.target.value)} 
                                        disabled={!canEdit}
                                        className="ip-form-select"
                                    >
                                        <option value="">Select</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </ItemCollapsibleSection>

                        {showAllFields && (
                            <>
                                <ItemCollapsibleSection title="Additional Info" icon={<Icons.Info size={16} />} defaultExpanded={false}>
                                    <div className="ip-form-grid ip-grid-2">
                                        <div className="ip-field-group">
                                            <label>Part Number</label>
                                            <input
                                                value={PartNo}
                                                onChange={e => handleInput('PartNo', e.target.value)}
                                                placeholder="Part number..."
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>HS Code</label>
                                            <input
                                                value={HsCode}
                                                onChange={e => handleInput('HsCode', e.target.value)}
                                                placeholder="HS code..."
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Alternative Code</label>
                                            <input
                                                value={alternativeCode}
                                                onChange={e => handleInput('alternativeCode', e.target.value)}
                                                placeholder="Alt code..."
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Head Item Code</label>
                                            <input
                                                value={HeadItemCode}
                                                onChange={e => handleInput('HeadItemCode', e.target.value)}
                                                placeholder="Head code..."
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Expiration Days</label>
                                            <input
                                                type="number"
                                                value={noExpDays}
                                                onChange={e => handleNumericInput('noExpDays', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                    </div>
                                </ItemCollapsibleSection>

                                <ItemCollapsibleSection title="Packing" icon={<Icons.Package size={16} />} defaultExpanded={false}>
                                    <div className="ip-form-grid ip-grid-2">
                                        <div className="ip-field-group">
                                            <label>Packing Qty</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingQty}
                                                onChange={e => handleNumericInput('PackingQty', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Net Weight</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingNetWeight}
                                                onChange={e => handleNumericInput('PackingNetWeight', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Gross Weight</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingGrossWeight}
                                                onChange={e => handleNumericInput('PackingGrossWeight', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Length</label>
                                            <input
                                                type="number"
                                                value={PackingLenth}
                                                onChange={e => handleNumericInput('PackingLenth', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Width</label>
                                            <input
                                                type="number"
                                                value={PackingWidth}
                                                onChange={e => handleNumericInput('PackingWidth', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Height</label>
                                            <input
                                                type="number"
                                                value={PackingHight}
                                                onChange={e => handleNumericInput('PackingHight', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                    </div>
                                </ItemCollapsibleSection>

                                <ItemCollapsibleSection title="Lead Times" icon={<Icons.Clock size={16} />} defaultExpanded={false}>
                                    <div className="ip-form-grid ip-grid-2">
                                        <div className="ip-field-group">
                                            <label>Delivery Lead Time</label>
                                            <input
                                                type="number"
                                                value={DeliveryLeadTime}
                                                onChange={e => handleNumericInput('DeliveryLeadTime', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                        <div className="ip-field-group">
                                            <label>Manufacturing Lead Time</label>
                                            <input
                                                type="number"
                                                value={ManufacturLeadTime}
                                                onChange={e => handleNumericInput('ManufacturLeadTime', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                                className="ip-form-input"
                                            />
                                        </div>
                                    </div>
                                </ItemCollapsibleSection>
                            </>
                        )}

                        <ItemCollapsibleSection title="Item Flags" icon={<Icons.Settings size={16} />} defaultExpanded={false}>
                            <div className="ip-flags-grid">
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(isActive)}
                                            onChange={e => handleCheckbox('isActive', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Active</span>
                                    </label>
                                </div>
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(isPurchase)}
                                            onChange={e => handleCheckbox('isPurchase', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Purchase</span>
                                    </label>
                                </div>
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(isManufactur)}
                                            onChange={e => handleCheckbox('isManufactur', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Manufacture</span>
                                    </label>
                                </div>
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(isConsumeable)}
                                            onChange={e => handleCheckbox('isConsumeable', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Consumable</span>
                                    </label>
                                </div>
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(isDispatch)}
                                            onChange={e => handleCheckbox('isDispatch', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Dispatch</span>
                                    </label>
                                </div>
                                <div className="ip-checkbox-item">
                                    <label className="ip-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={isActiveValue(IsItemLevel)}
                                            onChange={e => handleCheckbox('IsItemLevel', e)}
                                            disabled={!canEdit}
                                        />
                                        <span className="ip-checkbox-custom"></span>
                                        <span className="ip-checkbox-label">Item Level</span>
                                    </label>
                                </div>
                                {showAllFields && (
                                    <>
                                        <div className="ip-checkbox-item">
                                            <label className="ip-checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={isActiveValue(isOutSource)}
                                                    onChange={e => handleCheckbox('isOutSource', e)}
                                                    disabled={!canEdit}
                                                />
                                                <span className="ip-checkbox-custom"></span>
                                                <span className="ip-checkbox-label">Outsource</span>
                                            </label>
                                        </div>
                                        <div className="ip-checkbox-item">
                                            <label className="ip-checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={isActiveValue(isbundleItem)}
                                                    onChange={e => handleCheckbox('isbundleItem', e)}
                                                    disabled={!canEdit}
                                                />
                                                <span className="ip-checkbox-custom"></span>
                                                <span className="ip-checkbox-label">Bundle</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ItemCollapsibleSection>

                        <ItemCollapsibleSection title="Audit Information" icon={<Icons.Clock size={16} />} defaultExpanded={false}>
                            <div className="ip-form-grid ip-grid-2">
                                <div className="ip-field-group">
                                    <label>Created By</label>
                                    <div className="ip-field-display">
                                        <Icons.User size={14} />
                                        <span>{createdby || (isNewMode ? 'Will be set' : 'N/A')}</span>
                                    </div>
                                </div>
                                <div className="ip-field-group">
                                    <label>Created Date</label>
                                    <div className="ip-field-display">
                                        <Icons.Calendar size={14} />
                                        <span>{createdate ? formatDisplayDate(createdate) : (isNewMode ? 'Will be set' : 'Not set')}</span>
                                    </div>
                                </div>
                                <div className="ip-field-group">
                                    <label>Last Edited By</label>
                                    <div className="ip-field-display">
                                        <Icons.User size={14} />
                                        <span>{editby || (isNewMode ? 'Not edited' : 'N/A')}</span>
                                    </div>
                                </div>
                                <div className="ip-field-group">
                                    <label>Last Edited Date</label>
                                    <div className="ip-field-display">
                                        <Icons.Calendar size={14} />
                                        <span>{editdate ? formatDisplayDate(editdate) : (isNewMode ? 'Not edited' : 'Not set')}</span>
                                    </div>
                                </div>
                            </div>
                        </ItemCollapsibleSection>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------
 * Main Item Profile Component
---------------------------- */
const ItemProfile = () => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = credentials?.offcode || credentials?.company?.offcode || '';
    const currentUser = credentials?.username || 'SYSTEM';
    const sidebarRef = useRef(null);

    const { 
        items,
        totalCount,
        totalPages,
        lookupData,
        isLoading: isDataLoading, 
        error, 
        refetchAll,
        setError,
        currentPage,
        pageSize,
        goToPage,
        searchTerm,
        setSearch,
        fetchMaxItemCode
    } = useItemDataService();

    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState(() => getInitialItemData(currentOffcode, currentUser));
    const [currentMode, setCurrentMode] = useState('new');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [showAllFields, setShowAllFields] = useState(false);

    // Load screen configuration
    useEffect(() => {
        const loadScreenConfig = async () => {
            try {
                const response = await fetch(API_CONFIG.GET_SCREEN_CONFIG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ screenName: 'Item Profile' })
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

    // Generate item code for new items
    const generateItemCode = useCallback(async (parentCode = '00') => {
        const maxCode = await fetchMaxItemCode(currentOffcode, parentCode);
        const nextCode = maxCode + 1;
        
        // Format based on parent
        if (parentCode === '00') {
            // Root level: 2 digits
            return nextCode.toString().padStart(2, '0');
        } else {
            // Child level: parent code + suffix
            const suffixLength = parentCode.length >= 6 ? 4 : 2;
            return parentCode + nextCode.toString().padStart(suffixLength, '0');
        }
    }, [currentOffcode, fetchMaxItemCode]);

    // Initialize form for new root item
    const handleNewRootItem = useCallback(async () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new items');
            return;
        }

        const newCode = await generateItemCode('00');
        
        setFormData({
            ...getInitialItemData(currentOffcode, currentUser),
            ItemCode: newCode
        });
        
        setSelectedItem(null);
        setCurrentMode('new');
        setMessage(`Ready to create new root item. Code: ${newCode}`);
    }, [currentOffcode, currentUser, hasPermission, menuId, generateItemCode]);

    // Initialize form for new child item
    const handleNewChildItem = useCallback(async (parentItem) => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new items');
            return;
        }

        const parentCode = normalizeValue(parentItem.ItemCode);
        const parentLevel = parseInt(normalizeValue(parentItem.nlevel || '1'));

        if (parentLevel >= 4) {
            setMessage('⚠️ Cannot create child. Maximum level (4) reached.');
            return;
        }

        const newCode = await generateItemCode(parentCode);
        
        setFormData({
            ...getInitialItemData(currentOffcode, currentUser),
            ItemParent: parentCode,
            ItemCode: newCode,
            nlevel: String(parentLevel + 1),
            StoreMainType: parentItem.StoreMainType || '',
            ItemType: parentItem.ItemType || '1',
            InvType: parentItem.InvType || '1',
            uom: parentItem.uom || '1',
            AssetAccount: parentItem.AssetAccount || '',
            PurchaseReturnAccount: parentItem.PurchaseReturnAccount || '',
            InputTaxAccount: parentItem.InputTaxAccount || '',
            InputTaxRate: parentItem.InputTaxRate || '0',
            IncomeAccount: parentItem.IncomeAccount || '',
            SalesReturnAccount: parentItem.SalesReturnAccount || '',
            OutPutTaxAccount: parentItem.OutPutTaxAccount || '',
            OutPutTaxRate: parentItem.OutPutTaxRate || '0',
            ConsumptionAccount: parentItem.ConsumptionAccount || '',
            AdjustmentAccount: parentItem.AdjustmentAccount || '',
            typeCategory: parentItem.typeCategory || 'Organic',
            HeadItemCode: parentItem.HeadItemCode || ''
        });

        setCurrentMode('new');
        setMessage(`Ready to create child under ${parentCode}. New Code: ${newCode}`);
    }, [currentOffcode, currentUser, hasPermission, menuId, generateItemCode]);

    // Handle new item button click
    const handleNewItem = () => {
        if (selectedItem && currentMode === 'edit') {
            handleNewChildItem(selectedItem);
        } else {
            handleNewRootItem();
        }
    };

    // Load selected item data into form
    useEffect(() => {
        if (selectedItem && currentMode === 'edit') {
            const normalizedItem = {
                StoreMainType: normalizeValue(selectedItem.StoreMainType),
                offcode: normalizeValue(selectedItem.offcode),
                ItemParent: normalizeValue(selectedItem.ItemParent),
                ItemCode: normalizeValue(selectedItem.ItemCode),
                ItemName: normalizeValue(selectedItem.ItemName),
                ItemType: normalizeValue(selectedItem.ItemType),
                InvType: normalizeValue(selectedItem.InvType),
                uom: normalizeValue(selectedItem.uom),
                nlevel: normalizeValue(selectedItem.nlevel),
                IsItemLevel: normalizeValue(selectedItem.IsItemLevel),
                isActive: normalizeValue(selectedItem.isActive),
                isDispatch: normalizeValue(selectedItem.isDispatch),
                isPurchase: normalizeValue(selectedItem.isPurchase),
                isManufactur: normalizeValue(selectedItem.isManufactur),
                isConsumeable: normalizeValue(selectedItem.isConsumeable),
                minQty: normalizeValue(selectedItem.minQty),
                CriticalQty: normalizeValue(selectedItem.CriticalQty),
                ReorderQty: normalizeValue(selectedItem.ReorderQty),
                pictureURL: normalizeValue(selectedItem.pictureURL),
                CostPrice: normalizeValue(selectedItem.CostPrice),
                DeliveryTime: normalizeValue(selectedItem.DeliveryTime),
                SalePrice: normalizeValue(selectedItem.SalePrice),
                DeliveryLeadTime: normalizeValue(selectedItem.DeliveryLeadTime),
                ManufacturLeadTime: normalizeValue(selectedItem.ManufacturLeadTime),
                AssetAccount: normalizeValue(selectedItem.AssetAccount),
                PurchaseReturnAccount: normalizeValue(selectedItem.PurchaseReturnAccount),
                InputTaxAccount: normalizeValue(selectedItem.InputTaxAccount),
                InputTaxRate: normalizeValue(selectedItem.InputTaxRate),
                IncomeAccount: normalizeValue(selectedItem.IncomeAccount),
                SalesReturnAccount: normalizeValue(selectedItem.SalesReturnAccount),
                OutPutTaxAccount: normalizeValue(selectedItem.OutPutTaxAccount),
                OutPutTaxRate: normalizeValue(selectedItem.OutPutTaxRate),
                ConsumptionAccount: normalizeValue(selectedItem.ConsumptionAccount),
                AdjustmentAccount: normalizeValue(selectedItem.AdjustmentAccount),
                typeCategory: normalizeValue(selectedItem.typeCategory),
                PartNo: normalizeValue(selectedItem.PartNo),
                HsCode: normalizeValue(selectedItem.HsCode),
                noExpDays: normalizeValue(selectedItem.noExpDays),
                excessQtyper: normalizeValue(selectedItem.excessQtyper),
                alternativeCode: normalizeValue(selectedItem.alternativeCode),
                DiscountPer: normalizeValue(selectedItem.DiscountPer),
                DiscountAmt: normalizeValue(selectedItem.DiscountAmt),
                isOutSource: normalizeValue(selectedItem.isOutSource),
                HeadItemCode: normalizeValue(selectedItem.HeadItemCode),
                alterItemName: normalizeValue(selectedItem.alterItemName),
                pictureURL1: normalizeValue(selectedItem.pictureURL1),
                pictureURL2: normalizeValue(selectedItem.pictureURL2),
                pictureURL3: normalizeValue(selectedItem.pictureURL3),
                PackingNetWeight: normalizeValue(selectedItem.PackingNetWeight),
                PackingGrossWeight: normalizeValue(selectedItem.PackingGrossWeight),
                PackingLenth: normalizeValue(selectedItem.PackingLenth),
                PackingWidth: normalizeValue(selectedItem.PackingWidth),
                PackingHight: normalizeValue(selectedItem.PackingHight),
                OPbalQty: normalizeValue(selectedItem.OPbalQty),
                OPbalValue: normalizeValue(selectedItem.OPbalValue),
                balQty: normalizeValue(selectedItem.balQty),
                balValue: normalizeValue(selectedItem.balValue),
                alterItemName1: normalizeValue(selectedItem.alterItemName1),
                branchalternativecode: normalizeValue(selectedItem.branchalternativecode),
                isbundleItem: normalizeValue(selectedItem.isbundleItem),
                PackingQty: normalizeValue(selectedItem.PackingQty),
                createdby: normalizeValue(selectedItem.createdby),
                createdate: normalizeValue(selectedItem.createdate),
                editby: normalizeValue(selectedItem.editby),
                editdate: normalizeValue(selectedItem.editdate)
            };

            setFormData(normalizedItem);
        }
    }, [selectedItem, currentMode]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSelectItem = (item) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view items');
            return;
        }
        setSelectedItem(item);
        setCurrentMode('edit');
        setMessage(`Editing: ${normalizeValue(item.ItemName)}`);
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} items`);
            return;
        }

        if (!formData.ItemName.trim()) {
            setMessage('❌ Item Name is required!');
            return;
        }

        if (!formData.ItemCode.trim()) {
            setMessage('❌ Item Code is required!');
            return;
        }

        // Check for duplicate code
        const duplicateCode = items.find(i =>
            i.ItemCode === formData.ItemCode &&
            i.offcode === currentOffcode &&
            (currentMode === 'new' || i.ItemCode !== selectedItem?.ItemCode)
        );

        if (duplicateCode) {
            setMessage('❌ An item with this code already exists!');
            return;
        }

        setIsSaving(true);
        setMessage('');

        const endpoint = currentMode === 'new' ? API_CONFIG.INSERT_RECORD : API_CONFIG.UPDATE_RECORD;

        // Prepare data for database with audit fields
        const preparedData = prepareDataForDB(formData, currentMode, currentUser, currentOffcode);

        const payload = {
            tableName: API_CONFIG.TABLES.ITEM,
            data: preparedData
        };

        if (currentMode === 'edit') {
            payload.where = {
                ItemCode: formData.ItemCode,
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
                const errorText = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const result = await resp.json();

            if (result.success) {
                setMessage('✅ Item saved successfully!');
                await refetchAll();

                if (currentMode === 'new') {
                    const newRecord = {
                        ...preparedData
                    };
                    
                    setSelectedItem(newRecord);
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

    const handleDeleteItem = async (item) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete items');
            return;
        }

        // Check if item has children
        const hasChildren = items.some(i => i.ItemParent === item.ItemCode);
        if (hasChildren) {
            setMessage('❌ Cannot delete item with child items. Delete children first.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the item "${item.ItemName}"?`)) {
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.ITEM,
                where: {
                    ItemCode: item.ItemCode,
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
                setMessage('✅ Item deleted successfully!');
                
                if (items.length === 1 && currentPage > 1) {
                    goToPage(currentPage - 1);
                } else {
                    await refetchAll();
                }

                if (selectedItem && selectedItem.ItemCode === item.ItemCode) {
                    setSelectedItem(null);
                    setCurrentMode('new');
                    handleNewRootItem();
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

    const toggleAllFields = () => {
        setShowAllFields(!showAllFields);
    };

    if (rightsLoading && !menuId) {
        return (
            <div className="ip-loading-container">
                <Icons.Loader size={32} className="ip-spin" />
                <p>Loading user rights...</p>
            </div>
        );
    }

    return (
        <div className="ip-container">
            <header className="ip-header">
                <div className="ip-header-left">
                    <Icons.Package size={20} className="ip-header-icon" />
                    <div>
                        <h1>Item Profile</h1>
                        <span className="ip-header-subtitle">Manage item hierarchy and inventory</span>
                    </div>
                </div>
                <div className="ip-header-right">
                    <Icons.User size={14} />
                    <span>{currentUser}</span>
                    <span className="ip-office-tag">Office: {currentOffcode}</span>
                </div>
            </header>

            <div className="ip-toolbar">
                <div className="ip-toolbar-group">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="ip-toolbar-btn ip-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Icons.Loader size={14} className="ip-spin" /> : <Icons.Save size={14} />}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="ip-toolbar-btn" onClick={handleNewItem}>
                            <Icons.Plus size={14} />
                            <span>New Item</span>
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="ip-toolbar-btn" onClick={() => {
                            if (selectedItem) {
                                setCurrentMode('edit');
                            } else {
                                setMessage('Select an item to edit');
                            }
                        }}>
                            <Icons.Pencil size={14} />
                            <span>Edit</span>
                        </button>
                    )}
                    <button className="ip-toolbar-btn" onClick={toggleAllFields}>
                        {showAllFields ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                        <span>{showAllFields ? 'Basic View' : 'Full View'}</span>
                    </button>
                </div>

                <div className="ip-toolbar-group">
                    <button className="ip-toolbar-btn" onClick={refetchAll}>
                        <Icons.RefreshCw size={14} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="ip-toast ip-error">
                    <div className="ip-toast-content">
                        <Icons.AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                    <button className="ip-toast-close" onClick={() => setError('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            {message && (
                <div className={`ip-toast ${message.includes('❌') ? 'ip-error' : message.includes('⚠️') ? 'ip-warning' : 'ip-success'}`}>
                    <div className="ip-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={16} />}
                        {message.includes('❌') && <Icons.AlertCircle size={16} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={16} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button className="ip-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            <div className="ip-main-layout">
                <ItemTreeSidebar
                    items={items}
                    selectedItem={selectedItem}
                    onItemSelect={handleSelectItem}
                    searchTerm={localSearchTerm}
                    onSearchChange={setLocalSearchTerm}
                    isLoading={isDataLoading}
                    hasPermission={hasPermission}
                    menuId={menuId}
                    onDelete={handleDeleteItem}
                />

                <main className="ip-content-area">
                    <div className="ip-content-tabs">
                        <button className="ip-tab ip-active">
                            <Icons.FileText size={14} />
                            Item Details
                        </button>
                    </div>

                    <div className="ip-content-panel">
                        <ItemDetailForm
                            formData={formData}
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onNewItem={handleNewItem}
                            currentMode={currentMode}
                            selectedItem={selectedItem}
                            isLoading={isSaving}
                            isDataLoading={isDataLoading}
                            lookupData={lookupData}
                            showAllFields={showAllFields}
                            onToggleFields={toggleAllFields}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </main>
            </div>

            {totalPages > 1 && (
                <div className="ip-pagination-wrapper">
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
        </div>
    );
};

export default ItemProfile;