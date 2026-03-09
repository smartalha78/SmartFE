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
        ITEM: 'imf',
        ACCOUNT: 'acChartOfAccount',
        BRANCH: 'comBranch',
        GODOWN: 'comGodown',
        UOM: 'comUOM'
    },
    PRIMARY_KEYS: {
        ITEM: ['ItemCode', 'offcode'],
        ACCOUNT: ['code', 'offcode'],
        BRANCH: ['offcode'],
        GODOWN: ['godownID', 'offcode'],
        UOM: ['uomID']
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
    Package: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    Search: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Refresh: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6" /><path d="M21.02 12.8C20.45 18.05 16.94 22 12 22A9 9 0 0 1 3 13m1.27-5.8C4.55 3.95 7.84 2 12 2h.1C16.94 2 20.45 5.95 21.02 11.2" /></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    BarChart: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>,
    Folder: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    FileText: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    ChevronRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    ChevronDown: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    Database: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path></svg>,
    Building: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    Warehouse: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M8 11h8"></path><path d="M8 15h8"></path><path d="M8 19h8"></path></svg>,
    Image: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
    Upload: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
    Camera: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
    Eye: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    EyeOff: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
    Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
    Users: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
};

/* ---------------------------
 * Initial State
---------------------------- */
const getInitialItemData = (offcode = '0101') => ({
    StoreMainType: '1', offcode: offcode, ItemParent: '00', ItemCode: '', ItemName: '',
    ItemType: '1', InvType: '1', uom: '1', nlevel: '1', IsItemLevel: 'false',
    isActive: 'true', isDispatch: 'false', isPurchase: 'true', isManufactur: 'false',
    isConsumeable: 'true', minQty: '0', CriticalQty: '0', ReorderQty: '0',
    pictureURL: '', CostPrice: '0.00', DeliveryTime: '0', SalePrice: '0.00',
    DeliveryLeadTime: '0', ManufacturLeadTime: '0', AssetAccount: '',
    PurchaseReturnAccount: '', InputTaxAccount: '0203050002',
    InputTaxRate: '0', IncomeAccount: '0400000001', SalesReturnAccount: '',
    OutPutTaxAccount: '0203050002', OutPutTaxRate: '0', ConsumptionAccount: '0305010001',
    AdjustmentAccount: '', createdby: '', createdate: new Date().toISOString().split('T')[0] + 'T00:00:00+05:00',
    editby: '', editdate: new Date().toISOString().split('T')[0] + 'T00:00:00+05:00',
    typeCategory: 'Organic', PartNo: '', HsCode: '', noExpDays: '0', excessQtyper: '0',
    alternativeCode: '', DiscountPer: '0', DiscountAmt: '0.000', isOutSource: 'false',
    HeadItemCode: '0000000003', alterItemName: '', pictureURL1: '', pictureURL2: '',
    pictureURL3: '', PackingNetWeight: '0.000', PackingGrossWeight: '0.000',
    PackingLenth: '0', PackingWidth: '0', PackingHight: '0', OPbalQty: '0.000',
    OPbalValue: '0.000', balQty: '0.000', balValue: '0.000', alterItemName1: '',
    branchalternativecode: '', isbundleItem: 'false', PackingQty: '0'
});

/* ---------------------------
 * Data Service
---------------------------- */
const useDataService = () => {
    const { credentials } = useAuth();
    const [lookupData, setLookupData] = useState({
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
        uomTypes: [],
        storeTypes: [],
        accounts: [],
        branches: [],
        godowns: [],
        uomList: [],
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
    const [isLoading, setIsLoading] = useState(true);
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
                itemsData = [],
                allAccountsData = [],
                allBranchesData = [],
                allGodownsData = [],
                allUomData = []
            ] = await Promise.all([
                fetchTableData(API_CONFIG.TABLES.ITEM).catch(() => []),
                fetchTableData(API_CONFIG.TABLES.ACCOUNT).catch(() => []),
                fetchTableData(API_CONFIG.TABLES.BRANCH).catch(() => []),
                fetchTableData(API_CONFIG.TABLES.GODOWN).catch(() => []),
                fetchTableData(API_CONFIG.TABLES.UOM).catch(() => [])
            ]);

            // Find current branch
            const branchData = allBranchesData.find(
                branch => normalizeValue(branch.offcode) === currentOffcode
            );

            const parentAccount = normalizeValue(
                branchData?.imfAsset || branchData?.imfAssets || '010108'
            );

            // Filtered Accounts
            const filteredAccounts = (allAccountsData || []).filter(acc =>
                normalizeValue(acc.parent) === parentAccount &&
                normalizeValue(acc.offcode) === currentOffcode &&
                (normalizeValue(acc.isActive) === 'true' ||
                    normalizeValue(acc.isActive) === '1' ||
                    normalizeValue(acc.isActive) === true)
            );

            // Filtered Godowns
            const filteredGodowns = (allGodownsData || []).filter(godown =>
                normalizeValue(godown.offcode) === currentOffcode &&
                (normalizeValue(godown.IsActive) === 'true' ||
                    normalizeValue(godown.IsActive) === '1' ||
                    normalizeValue(godown.IsActive) === true)
            );

            // Filtered UOM
            const filteredUom = (allUomData || []).filter(
                uom => normalizeValue(uom.offcode) === currentOffcode
            );

            // Processed Data
            const processedAccounts = (filteredAccounts || []).map(acc => ({
                code: normalizeValue(acc.code),
                name: normalizeValue(acc.name),
                type: normalizeValue(acc.type)
            }));

            const processedGodowns = (filteredGodowns || []).map(godown => ({
                code: normalizeValue(godown.godownID),
                name: normalizeValue(godown.description)
            }));

            const processedUOM = (filteredUom || []).map(uom => ({
                code: normalizeValue(uom.ccode),
                name: normalizeValue(uom.cname),
                symbol: normalizeValue(uom.cSHD)
            }));

            const uomTypes = Array.isArray(itemsData)
                ? [...new Set(itemsData.map(item => item.uom))].filter(Boolean).map(code => ({
                    code,
                    name: `UOM ${code}`
                }))
                : [];

            // Set Lookup Data
            setLookupData({
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
                uomTypes,
                storeTypes: processedGodowns,
                accounts: processedAccounts,
                branches: allBranchesData,
                godowns: processedGodowns,
                uomList: processedUOM,
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
        } catch (err) {
            console.error('Error loading data:', err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [credentials]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { lookupData, isLoading, error, refetch: loadAllData, setError };
};

/* ---------------------------
 * Collapsible Section Component
---------------------------- */
const CollapsibleSection = ({ title, icon, children, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`form-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="section-title">
                    {icon}
                    <h3>{title}</h3>
                </div>
                <Icon.ChevronDown className={`chevron ${isExpanded ? 'expanded' : ''}`} />
            </div>
            {isExpanded && (
                <div className="section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Image Upload Component
---------------------------- */
const ImageUpload = ({ imageUrl, onImageChange, itemCode, canEdit }) => {
    const [previewUrl, setPreviewUrl] = useState(imageUrl);
    const [isUploading, setIsUploading] = useState(false);

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
            };
            reader.readAsDataURL(file);

            const base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            onImageChange(base64Image);
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
    };

    return (
        <div className="image-upload-section">
            <div className="image-preview-container">
                {previewUrl ? (
                    <div className="image-preview">
                        <img src={previewUrl} alt="Item" />
                        {canEdit && (
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={handleRemoveImage}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="image-placeholder">
                        <Icon.Camera className="placeholder-icon" />
                        <span>No Image</span>
                    </div>
                )}
            </div>

            {canEdit && (
                <div className="upload-controls">
                    <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="image-upload" className="upload-btn">
                        <Icon.Upload />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <div className="upload-hint">
                        Supports JPG, PNG, GIF • Max 5MB
                    </div>
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Item Tree Components
---------------------------- */
const ItemTreeNode = ({ node, level = 0, onSelect, selectedItem, searchTerm, hasPermission, menuId, onDelete }) => {
    const nodeCode = normalizeValue(node.ItemCode);
    const nodeName = normalizeValue(node.ItemName);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedItem && selectedItem.ItemCode === nodeCode;
    const [expanded, setExpanded] = useState(level < 2);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(node);
    };

    return (
        <div className="tree-node">
            <div className={`tree-node-row ${isSelected ? 'selected' : ''}`} style={{ paddingLeft: `${level * 18 + 12}px` }}>
                <div className="tree-left">
                    {hasChildren ? (
                        <button
                            className="toggle-btn"
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        >
                            {expanded ? <Icon.ChevronDown className="small" /> : <Icon.ChevronRight className="small" />}
                        </button>
                    ) : (
                        <div className="spacer"></div>
                    )}
                    <div className="tree-main" onClick={() => onSelect(node)}>
                        <div className="node-content">
                            {hasChildren ? (
                                <Icon.Folder className="folder-icon" />
                            ) : (
                                <Icon.Package className="item-icon" />
                            )}
                            <div className="node-text">
                                <div className="code">{nodeCode}</div>
                                <div className="name">{nodeName}</div>
                            </div>
                        </div>
                        <div className="node-level">Level {node.nlevel}</div>
                    </div>
                </div>
                <div className="tree-right">
                    <div className={`status ${node.isActive === 'true' || node.isActive === true ? 'active' : 'inactive'}`}>
                        {node.isActive === 'true' || node.isActive === true ? '✓' : '✗'}
                    </div>
                    {hasPermission && hasPermission(menuId, 'delete') && (
                        <button
                            className="delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete Item"
                        >
                            <Icon.Trash />
                        </button>
                    )}
                </div>
            </div>
            {expanded && hasChildren && (
                <div className="children">
                    {node.children.map(child => (
                        <ItemTreeNode
                            key={normalizeValue(child.ItemCode)}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedItem={selectedItem}
                            searchTerm={searchTerm}
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
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-title">
                    <Icon.Package className="big" />
                    <div>
                        <div className="h3">Item Hierarchy</div>
                        <div className="muted small">{items.length} items</div>
                    </div>
                </div>
                <div className="search-wrap">
                    <Icon.Search className="search-icon" />
                    <input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="sidebar-body">
                {isLoading ? (
                    <div className="center padded">
                        <Icon.Loader className="loader" />
                        <div>Loading items...</div>
                    </div>
                ) : visibleTree.length === 0 ? (
                    <div className="empty-state padded">
                        <Icon.Folder className="big-muted" />
                        <div className="muted">No items found</div>
                        <div className="small muted">
                            {searchTerm ? 'Try a different search term' : 'Create a root item to get started'}
                        </div>
                    </div>
                ) : (
                    <div className="tree-container">
                        {visibleTree.map(n => (
                            <ItemTreeNode
                                key={normalizeValue(n.ItemCode)}
                                node={n}
                                onSelect={onItemSelect}
                                selectedItem={selectedItem}
                                searchTerm={searchTerm}
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
    const currentOffcode = credentials?.company?.offcode || '0101';

    const {
        StoreMainType, offcode, ItemParent, ItemCode, ItemName, ItemType, InvType, uom, nlevel,
        IsItemLevel, isActive, isDispatch, isPurchase, isManufactur, isConsumeable,
        minQty, CriticalQty, ReorderQty, pictureURL, CostPrice, DeliveryTime, SalePrice,
        DeliveryLeadTime, ManufacturLeadTime, AssetAccount, PurchaseReturnAccount, InputTaxAccount,
        InputTaxRate, IncomeAccount, SalesReturnAccount, OutPutTaxAccount, OutPutTaxRate,
        ConsumptionAccount, AdjustmentAccount, createdby, createdate, editby, editdate,
        typeCategory, PartNo, HsCode, noExpDays, excessQtyper, alternativeCode, DiscountPer,
        DiscountAmt, isOutSource, HeadItemCode, alterItemName, pictureURL1, pictureURL2,
        pictureURL3, PackingNetWeight, PackingGrossWeight, PackingLenth, PackingWidth,
        PackingHight, OPbalQty, OPbalValue, balQty, balValue, alterItemName1,
        branchalternativecode, isbundleItem, PackingQty
    } = formData || {};

    const isNewMode = currentMode === 'new';
    const isLevel4 = parseInt(nlevel || '1') === 4;
    const canEdit = hasPermission && hasPermission(menuId, isNewMode ? 'add' : 'edit');

    const handleInput = (field, value) => onFormChange(field, value);

    const {
        itemTypes,
        inventoryTypes,
        uomList,
        storeTypes,
        accounts,
        fixedAccounts
    } = lookupData;

    return (
        <section className="detail-panel">
            <div className="detail-header">
                <div className="header-content">
                    <h1>{isNewMode ? 'Create New Item' : `Item Details: ${ItemName || 'Item'}`}</h1>
                    <div className="header-subtitle">
                        <span className="mode-badge">{isNewMode ? 'NEW' : 'EDIT'}</span>
                        <span className="muted">• Level {nlevel}</span>
                        <span className="muted">• {ItemCode}</span>
                        {!(isActive === 'true' || isActive === true) && <span className="inactive-badge">INACTIVE</span>}
                        {isLevel4 && <span className="level4-badge">MAX LEVEL</span>}
                    </div>
                </div>
                <div className="header-actions">
                    {canEdit && (
                        <>
                            <button
                                className="btn btn-toggle"
                                onClick={onToggleFields}
                                title={showAllFields ? "Show basic fields" : "Show all fields"}
                            >
                                {showAllFields ? <Icon.EyeOff /> : <Icon.Eye />}
                                {showAllFields ? "Basic View" : "Full View"}
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={onNewItem}
                                disabled={isLevel4 && !isNewMode}
                                title={isLevel4 ? "Cannot create child at maximum level (4)" : "Create new child item"}
                            >
                                <Icon.Plus /> {selectedItem && currentMode === 'edit' ? 'New Child' : 'New Root'}
                            </button>
                            <button
                                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                                onClick={onSave}
                                disabled={isLoading || isDataLoading || !ItemCode || !ItemName}
                            >
                                {isLoading ? <Icon.Loader className="spin" /> : <Icon.Save />}
                                {isLoading ? 'Saving...' : 'Save Item'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-body">
                <div className="form-layout">
                    {/* Left Column - Image and Basic Info */}
                    <div className="form-column">
                        <CollapsibleSection title="Item Images" icon={<Icon.Image />} defaultExpanded={true}>
                            <div className="multiple-images-section">
                                <div className="image-grid">
                                    <div className="image-upload-item">
                                        <label>Main Image</label>
                                        <ImageUpload
                                            imageUrl={pictureURL}
                                            onImageChange={(imageData) => handleInput('pictureURL', imageData)}
                                            itemCode={ItemCode}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                    <div className="image-upload-item">
                                        <label>Image 2</label>
                                        <ImageUpload
                                            imageUrl={pictureURL1}
                                            onImageChange={(imageData) => handleInput('pictureURL1', imageData)}
                                            itemCode={ItemCode}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                    <div className="image-upload-item">
                                        <label>Image 3</label>
                                        <ImageUpload
                                            imageUrl={pictureURL2}
                                            onImageChange={(imageData) => handleInput('pictureURL2', imageData)}
                                            itemCode={ItemCode}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                    <div className="image-upload-item">
                                        <label>Image 4</label>
                                        <ImageUpload
                                            imageUrl={pictureURL3}
                                            onImageChange={(imageData) => handleInput('pictureURL3', imageData)}
                                            itemCode={ItemCode}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Basic Information" icon={<Icon.FileText />} defaultExpanded={true}>
                            <div className="form-grid compact">
                                <div className="field">
                                    <label>Parent Code</label>
                                    <div className="input-with-icon">
                                        <Icon.Folder className="input-icon" />
                                        <input value={ItemParent} disabled className="mono" />
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Item Code *</label>
                                    <div className="input-with-icon">
                                        <Icon.Package className="input-icon" />
                                        <input value={ItemCode} disabled className="mono" />
                                    </div>
                                    {isNewMode && <div className="hint">Auto-generated based on parent</div>}
                                </div>
                                <div className="field">
                                    <label>Level</label>
                                    <input value={nlevel} disabled />
                                </div>

                                <div className="field full-width">
                                    <label>Item Name *</label>
                                    <input
                                        value={ItemName}
                                        onChange={e => handleInput('ItemName', e.target.value)}
                                        placeholder="Enter item name..."
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="field full-width">
                                    <label>Alternative Item Name</label>
                                    <input
                                        value={alterItemName}
                                        onChange={e => handleInput('alterItemName', e.target.value)}
                                        placeholder="Enter alternative name..."
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="field full-width">
                                    <label>Alternative Item Name 2</label>
                                    <input
                                        value={alterItemName1}
                                        onChange={e => handleInput('alterItemName1', e.target.value)}
                                        placeholder="Enter alternative name 2..."
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="field">
                                    <label>Item Type *</label>
                                    <select value={ItemType} onChange={e => handleInput('ItemType', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select item type</option>
                                        {itemTypes.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Inventory Type *</label>
                                    <select value={InvType} onChange={e => handleInput('InvType', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select inventory type</option>
                                        {inventoryTypes.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Unit of Measure</label>
                                    <select value={uom} onChange={e => handleInput('uom', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select UOM</option>
                                        {uomList.map(t => (
                                            <option key={t.code} value={t.code}>
                                                {t.name} {t.symbol ? `(${t.symbol})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Category</label>
                                    <select value={typeCategory} onChange={e => handleInput('typeCategory', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Category</option>
                                        <option value="Organic">Organic</option>
                                        <option value="In Organic">In Organic</option>
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Office/Branch</label>
                                    <input value={currentOffcode} disabled />
                                    <div className="hint">Auto-filled from login</div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Store Types" icon={<Icon.Warehouse />} defaultExpanded={false}>
                            <div className="field">
                                <label>Select Godowns</label>
                                <div className="checkbox-group">
                                    {storeTypes.map(store => (
                                        <div key={store.code} className="checkbox-item">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={StoreMainType && StoreMainType.includes(store.code)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        let newStoreTypes;

                                                        if (isChecked) {
                                                            newStoreTypes = StoreMainType ?
                                                                `${StoreMainType},${store.code}` :
                                                                store.code;
                                                        } else {
                                                            const storesArray = StoreMainType ? StoreMainType.split(',').filter(s => s !== store.code) : [];
                                                            newStoreTypes = storesArray.join(',');
                                                        }

                                                        handleInput('StoreMainType', newStoreTypes);
                                                    }}
                                                    disabled={!canEdit}
                                                />
                                                <span className="checkmark"></span>
                                                {store.code} - {store.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {storeTypes.length === 0 && !isDataLoading && (
                                    <div className="hint error">No active godowns found for office {currentOffcode}</div>
                                )}
                                {StoreMainType && (
                                    <div className="hint">Selected: {StoreMainType.split(',').map(code => {
                                        const store = storeTypes.find(s => s.code === code);
                                        return store ? `${store.code}-${store.name}` : code;
                                    }).join(', ')}</div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {showAllFields && (
                            <>
                                <CollapsibleSection title="Packing Information" icon={<Icon.Package />} defaultExpanded={false}>
                                    <div className="form-grid compact">
                                        <div className="field">
                                            <label>Packing Quantity</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingQty}
                                                onChange={e => handleInput('PackingQty', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Packing Net Weight</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingNetWeight}
                                                onChange={e => handleInput('PackingNetWeight', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Packing Gross Weight</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={PackingGrossWeight}
                                                onChange={e => handleInput('PackingGrossWeight', e.target.value)}
                                                placeholder="0.000"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Packing Length</label>
                                            <input
                                                type="number"
                                                value={PackingLenth}
                                                onChange={e => handleInput('PackingLenth', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Packing Width</label>
                                            <input
                                                type="number"
                                                value={PackingWidth}
                                                onChange={e => handleInput('PackingWidth', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Packing Height</label>
                                            <input
                                                type="number"
                                                value={PackingHight}
                                                onChange={e => handleInput('PackingHight', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="Additional Information" icon={<Icon.Info />} defaultExpanded={false}>
                                    <div className="form-grid compact">
                                        <div className="field">
                                            <label>Part Number</label>
                                            <input
                                                value={PartNo}
                                                onChange={e => handleInput('PartNo', e.target.value)}
                                                placeholder="Enter part number..."
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>HS Code</label>
                                            <input
                                                value={HsCode}
                                                onChange={e => handleInput('HsCode', e.target.value)}
                                                placeholder="Enter HS code..."
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Alternative Code</label>
                                            <input
                                                value={alternativeCode}
                                                onChange={e => handleInput('alternativeCode', e.target.value)}
                                                placeholder="Enter alternative code..."
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Branch Alternative Code</label>
                                            <input
                                                value={branchalternativecode}
                                                onChange={e => handleInput('branchalternativecode', e.target.value)}
                                                placeholder="Enter branch alternative code..."
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Head Item Code</label>
                                            <input
                                                value={HeadItemCode}
                                                onChange={e => handleInput('HeadItemCode', e.target.value)}
                                                placeholder="Enter head item code..."
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </>
                        )}
                    </div>

                    {/* Right Column - Other Sections */}
                    <div className="form-column">
                        <CollapsibleSection title="Pricing Information" icon={<Icon.DollarSign />} defaultExpanded={false}>
                            <div className="form-grid compact">
                                <div className="field">
                                    <label>Cost Price</label>
                                    <div className="input-with-icon">
                                        <Icon.DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={CostPrice}
                                            onChange={e => handleInput('CostPrice', e.target.value)}
                                            placeholder="0.00"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Sale Price</label>
                                    <div className="input-with-icon">
                                        <Icon.DollarSign className="input-icon" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={SalePrice}
                                            onChange={e => handleInput('SalePrice', e.target.value)}
                                            placeholder="0.00"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Discount Percentage</label>
                                    <input
                                        type="number"
                                        value={DiscountPer}
                                        onChange={e => handleInput('DiscountPer', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Discount Amount</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={DiscountAmt}
                                        onChange={e => handleInput('DiscountAmt', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Inventory Control" icon={<Icon.BarChart />} defaultExpanded={false}>
                            <div className="form-grid compact">
                                <div className="field">
                                    <label>Minimum Quantity</label>
                                    <input
                                        type="number"
                                        value={minQty}
                                        onChange={e => handleInput('minQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Critical Quantity</label>
                                    <input
                                        type="number"
                                        value={CriticalQty}
                                        onChange={e => handleInput('CriticalQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Reorder Quantity</label>
                                    <input
                                        type="number"
                                        value={ReorderQty}
                                        onChange={e => handleInput('ReorderQty', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Packing Quantity</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={PackingQty}
                                        onChange={e => handleInput('PackingQty', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Delivery Time (Days)</label>
                                    <input
                                        type="number"
                                        value={DeliveryTime}
                                        onChange={e => handleInput('DeliveryTime', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Excess Quantity (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={excessQtyper}
                                        onChange={e => handleInput('excessQtyper', e.target.value)}
                                        placeholder="0.00"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Opening Balance Qty</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={OPbalQty}
                                        onChange={e => handleInput('OPbalQty', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Opening Balance Value</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={OPbalValue}
                                        onChange={e => handleInput('OPbalValue', e.target.value)}
                                        placeholder="0.000"
                                        disabled={!canEdit}
                                    />
                                </div>
                                <div className="field">
                                    <label>Current Balance Qty</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={balQty}
                                        onChange={e => handleInput('balQty', e.target.value)}
                                        placeholder="0.000"
                                        disabled
                                    />
                                </div>
                                <div className="field">
                                    <label>Current Balance Value</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={balValue}
                                        onChange={e => handleInput('balValue', e.target.value)}
                                        placeholder="0.000"
                                        disabled
                                    />
                                </div>
                                {showAllFields && (
                                    <>
                                        <div className="field">
                                            <label>No Expiration Days</label>
                                            <input
                                                type="number"
                                                value={noExpDays}
                                                onChange={e => handleInput('noExpDays', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Account Mapping" icon={<Icon.Database />} defaultExpanded={false}>
                            <div className="account-note">
                                <Icon.Info className="info-icon" />
                                <span>Accounts are filtered dynamically based on branch configuration</span>
                            </div>
                            <div className="form-grid compact">
                                <div className="field">
                                    <label>Asset Account</label>
                                    <select value={AssetAccount} onChange={e => handleInput('AssetAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Asset Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Purchase Return Account</label>
                                    <select value={PurchaseReturnAccount} onChange={e => handleInput('PurchaseReturnAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Purchase Return Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Input Tax Account</label>
                                    <select value={InputTaxAccount} onChange={e => handleInput('InputTaxAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Input Tax Account</option>
                                        {fixedAccounts.inputTaxAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Input Tax Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={InputTaxRate}
                                        onChange={e => handleInput('InputTaxRate', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="field">
                                    <label>Income Account</label>
                                    <select value={IncomeAccount} onChange={e => handleInput('IncomeAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Income Account</option>
                                        {fixedAccounts.incomeAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Sales Return Account</label>
                                    <select value={SalesReturnAccount} onChange={e => handleInput('SalesReturnAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Sales Return Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Output Tax Account</label>
                                    <select value={OutPutTaxAccount} onChange={e => handleInput('OutPutTaxAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Output Tax Account</option>
                                        {fixedAccounts.outputTaxAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Output Tax Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={OutPutTaxRate}
                                        onChange={e => handleInput('OutPutTaxRate', e.target.value)}
                                        placeholder="0"
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="field">
                                    <label>Consumption Account</label>
                                    <select value={ConsumptionAccount} onChange={e => handleInput('ConsumptionAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Consumption Account</option>
                                        {fixedAccounts.consumptionAccounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Adjustment Account</label>
                                    <select value={AdjustmentAccount} onChange={e => handleInput('AdjustmentAccount', e.target.value)} disabled={!canEdit}>
                                        <option value="">Select Adjustment Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.code} value={acc.code}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {showAllFields && (
                            <>
                                <CollapsibleSection title="Lead Times" icon={<Icon.Settings />} defaultExpanded={false}>
                                    <div className="form-grid compact">
                                        <div className="field">
                                            <label>Delivery Lead Time</label>
                                            <input
                                                type="number"
                                                value={DeliveryLeadTime}
                                                onChange={e => handleInput('DeliveryLeadTime', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="field">
                                            <label>Manufacturing Lead Time</label>
                                            <input
                                                type="number"
                                                value={ManufacturLeadTime}
                                                onChange={e => handleInput('ManufacturLeadTime', e.target.value)}
                                                placeholder="0"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="Audit Information" icon={<Icon.FileText />} defaultExpanded={false}>
                                    <div className="form-grid compact">
                                        <div className="field">
                                            <label>Created By</label>
                                            <input value={createdby} disabled />
                                        </div>
                                        <div className="field">
                                            <label>Created Date</label>
                                            <input type="datetime-local" value={createdate} disabled />
                                        </div>
                                        <div className="field">
                                            <label>Last Edited By</label>
                                            <input value={editby} disabled />
                                        </div>
                                        <div className="field">
                                            <label>Last Edited Date</label>
                                            <input type="datetime-local" value={editdate} disabled />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </>
                        )}

                        <CollapsibleSection title="Item Flags" icon={<Icon.Settings />} defaultExpanded={false}>
                            <div className="flags-grid compact">
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isActive === 'true' || isActive === true}
                                            onChange={e => handleInput('isActive', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Active Item
                                    </label>
                                </div>
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isPurchase === 'true' || isPurchase === true}
                                            onChange={e => handleInput('isPurchase', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Purchase Item
                                    </label>
                                </div>
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isManufactur === 'true' || isManufactur === true}
                                            onChange={e => handleInput('isManufactur', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Manufacturing Item
                                    </label>
                                </div>
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isConsumeable === 'true' || isConsumeable === true}
                                            onChange={e => handleInput('isConsumeable', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Consumable Item
                                    </label>
                                </div>
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isDispatch === 'true' || isDispatch === true}
                                            onChange={e => handleInput('isDispatch', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Dispatch Item
                                    </label>
                                </div>
                                <div className="field checkbox">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={IsItemLevel === 'true' || IsItemLevel === true}
                                            onChange={e => handleInput('IsItemLevel', e.target.checked ? 'true' : 'false')}
                                            disabled={!canEdit}
                                        />
                                        <span className="checkmark"></span>
                                        Item Level
                                    </label>
                                </div>
                                {showAllFields && (
                                    <>
                                        <div className="field checkbox">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={isOutSource === 'true' || isOutSource === true}
                                                    onChange={e => handleInput('isOutSource', e.target.checked ? 'true' : 'false')}
                                                    disabled={!canEdit}
                                                />
                                                <span className="checkmark"></span>
                                                Outsource Item
                                            </label>
                                        </div>
                                        <div className="field checkbox">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={isbundleItem === 'true' || isbundleItem === true}
                                                    onChange={e => handleInput('isbundleItem', e.target.checked ? 'true' : 'false')}
                                                    disabled={!canEdit}
                                                />
                                                <span className="checkmark"></span>
                                                Bundle Item
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ---------------------------
 * Main Item Profile Component
---------------------------- */
const ItemProfile = ({ initialMode = 'new' }) => {
    const { credentials } = useAuth();
    const { hasPermission, loading: rightsLoading, error: rightsError } = useRights();
    const USER_LOGIN = credentials?.userLogin || credentials?.username || 'SYSTEM';
    const currentOffcode = credentials?.company?.offcode || '0101';

    const { lookupData, isLoading: isLookupLoading, error: lookupError, refetch: refetchLookupData, setError } = useDataService();

    const [formData, setFormData] = useState(() => getInitialItemData(currentOffcode));
    const [currentMode, setCurrentMode] = useState(initialMode);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [showAllFields, setShowAllFields] = useState(false);
    const [menuId, setMenuId] = useState(null);
    const [screenConfig, setScreenConfig] = useState(null);

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
                    setScreenConfig(data.screen);
                    setMenuId(data.screen.id);
                }
            } catch (error) {
                console.error('Error loading screen config:', error);
            }
        };
        loadScreenConfig();
    }, []);

    const updateFormData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const setAllFormData = (data) => setFormData(data);

    const fetchItems = useCallback(async () => {
        setIsDataLoading(true);
        setMessage('');
        try {
            const resp = await fetch(API_CONFIG.GET_TABLE_DATA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableName: API_CONFIG.TABLES.ITEM })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (data.success && Array.isArray(data.rows)) {
                const normalized = data.rows.map(item => ({
                    StoreMainType: normalizeValue(item.StoreMainType),
                    offcode: normalizeValue(item.offcode),
                    ItemParent: normalizeValue(item.ItemParent),
                    ItemCode: normalizeValue(item.ItemCode),
                    ItemName: normalizeValue(item.ItemName),
                    ItemType: normalizeValue(item.ItemType),
                    InvType: normalizeValue(item.InvType),
                    uom: normalizeValue(item.uom),
                    nlevel: normalizeValue(item.nlevel),
                    IsItemLevel: normalizeValue(item.IsItemLevel),
                    isActive: normalizeValue(item.isActive),
                    isDispatch: normalizeValue(item.isDispatch),
                    isPurchase: normalizeValue(item.isPurchase),
                    isManufactur: normalizeValue(item.isManufactur),
                    isConsumeable: normalizeValue(item.isConsumeable),
                    minQty: normalizeValue(item.minQty),
                    CriticalQty: normalizeValue(item.CriticalQty),
                    ReorderQty: normalizeValue(item.ReorderQty),
                    pictureURL: normalizeValue(item.pictureURL),
                    CostPrice: normalizeValue(item.CostPrice),
                    DeliveryTime: normalizeValue(item.DeliveryTime),
                    SalePrice: normalizeValue(item.SalePrice),
                    DeliveryLeadTime: normalizeValue(item.DeliveryLeadTime),
                    ManufacturLeadTime: normalizeValue(item.ManufacturLeadTime),
                    AssetAccount: normalizeValue(item.AssetAccount),
                    PurchaseReturnAccount: normalizeValue(item.PurchaseReturnAccount),
                    InputTaxAccount: normalizeValue(item.InputTaxAccount),
                    InputTaxRate: normalizeValue(item.InputTaxRate),
                    IncomeAccount: normalizeValue(item.IncomeAccount),
                    SalesReturnAccount: normalizeValue(item.SalesReturnAccount),
                    OutPutTaxAccount: normalizeValue(item.OutPutTaxAccount),
                    OutPutTaxRate: normalizeValue(item.OutPutTaxRate),
                    ConsumptionAccount: normalizeValue(item.ConsumptionAccount),
                    AdjustmentAccount: normalizeValue(item.AdjustmentAccount),
                    createdby: normalizeValue(item.createdby),
                    createdate: normalizeValue(item.createdate),
                    editby: normalizeValue(item.editby),
                    editdate: normalizeValue(item.editdate),
                    typeCategory: normalizeValue(item.typeCategory),
                    PartNo: normalizeValue(item.PartNo),
                    HsCode: normalizeValue(item.HsCode),
                    noExpDays: normalizeValue(item.noExpDays),
                    excessQtyper: normalizeValue(item.excessQtyper),
                    alternativeCode: normalizeValue(item.alternativeCode),
                    DiscountPer: normalizeValue(item.DiscountPer),
                    DiscountAmt: normalizeValue(item.DiscountAmt),
                    isOutSource: normalizeValue(item.isOutSource),
                    HeadItemCode: normalizeValue(item.HeadItemCode),
                    alterItemName: normalizeValue(item.alterItemName),
                    pictureURL1: normalizeValue(item.pictureURL1),
                    pictureURL2: normalizeValue(item.pictureURL2),
                    pictureURL3: normalizeValue(item.pictureURL3),
                    PackingNetWeight: normalizeValue(item.PackingNetWeight),
                    PackingGrossWeight: normalizeValue(item.PackingGrossWeight),
                    PackingLenth: normalizeValue(item.PackingLenth),
                    PackingWidth: normalizeValue(item.PackingWidth),
                    PackingHight: normalizeValue(item.PackingHight),
                    OPbalQty: normalizeValue(item.OPbalQty),
                    OPbalValue: normalizeValue(item.OPbalValue),
                    balQty: normalizeValue(item.balQty),
                    balValue: normalizeValue(item.balValue),
                    alterItemName1: normalizeValue(item.alterItemName1),
                    branchalternativecode: normalizeValue(item.branchalternativecode),
                    isbundleItem: normalizeValue(item.isbundleItem),
                    PackingQty: normalizeValue(item.PackingQty)
                }));
                setItems(normalized);
            } else {
                setMessage('Error: API returned success=false or invalid data structure.');
                setItems([]);
            }
        } catch (err) {
            console.error('fetchItems', err);
            setMessage(`❌ Error fetching items: ${err.message}`);
            setItems([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const generateChildCode = (parentCode) => {
        const children = items.filter(item => item.ItemParent === parentCode);
        const expectedSuffixLength = (parentCode.length === 0 || parentCode === '00') ? 2 : (parentCode.length >= 6 ? 4 : 2);
        if (children.length === 0) return parentCode + '1'.padStart(expectedSuffixLength, '0');

        const numericSuffixes = children.map(item => {
            const full = normalizeValue(item.ItemCode);
            if (full.length > parentCode.length) {
                const suffixStr = full.slice(parentCode.length);
                return { suffix: parseInt(suffixStr) || 0, suffixStr };
            }
            return { suffix: 0, suffixStr: '' };
        });
        const maxObj = numericSuffixes.reduce((mx, o) => o.suffix > mx.suffix ? o : mx, { suffix: 0, suffixStr: '' });
        const actualSuffixLength = maxObj.suffixStr.length || expectedSuffixLength;
        const newNum = maxObj.suffix + 1;
        const finalSuffixLength = Math.min(actualSuffixLength, 4);
        const newSuffix = newNum.toString().padStart(finalSuffixLength, '0');
        return parentCode + newSuffix;
    };

    const loadItemDataIntoForm = useCallback((item) => {
        setAllFormData({
            StoreMainType: normalizeValue(item.StoreMainType),
            offcode: normalizeValue(item.offcode),
            ItemParent: normalizeValue(item.ItemParent),
            ItemCode: normalizeValue(item.ItemCode),
            ItemName: normalizeValue(item.ItemName),
            ItemType: normalizeValue(item.ItemType),
            InvType: normalizeValue(item.InvType),
            uom: normalizeValue(item.uom),
            nlevel: normalizeValue(item.nlevel),
            IsItemLevel: normalizeValue(item.IsItemLevel),
            isActive: normalizeValue(item.isActive),
            isDispatch: normalizeValue(item.isDispatch),
            isPurchase: normalizeValue(item.isPurchase),
            isManufactur: normalizeValue(item.isManufactur),
            isConsumeable: normalizeValue(item.isConsumeable),
            minQty: normalizeValue(item.minQty),
            CriticalQty: normalizeValue(item.CriticalQty),
            ReorderQty: normalizeValue(item.ReorderQty),
            pictureURL: normalizeValue(item.pictureURL),
            CostPrice: normalizeValue(item.CostPrice),
            DeliveryTime: normalizeValue(item.DeliveryTime),
            SalePrice: normalizeValue(item.SalePrice),
            DeliveryLeadTime: normalizeValue(item.DeliveryLeadTime),
            ManufacturLeadTime: normalizeValue(item.ManufacturLeadTime),
            AssetAccount: normalizeValue(item.AssetAccount),
            PurchaseReturnAccount: normalizeValue(item.PurchaseReturnAccount),
            InputTaxAccount: normalizeValue(item.InputTaxAccount),
            InputTaxRate: normalizeValue(item.InputTaxRate),
            IncomeAccount: normalizeValue(item.IncomeAccount),
            SalesReturnAccount: normalizeValue(item.SalesReturnAccount),
            OutPutTaxAccount: normalizeValue(item.OutPutTaxAccount),
            OutPutTaxRate: normalizeValue(item.OutPutTaxRate),
            ConsumptionAccount: normalizeValue(item.ConsumptionAccount),
            AdjustmentAccount: normalizeValue(item.AdjustmentAccount),
            createdby: normalizeValue(item.createdby),
            createdate: normalizeValue(item.createdate),
            editby: normalizeValue(item.editby),
            editdate: normalizeValue(item.editdate),
            typeCategory: normalizeValue(item.typeCategory),
            PartNo: normalizeValue(item.PartNo),
            HsCode: normalizeValue(item.HsCode),
            noExpDays: normalizeValue(item.noExpDays),
            excessQtyper: normalizeValue(item.excessQtyper),
            alternativeCode: normalizeValue(item.alternativeCode),
            DiscountPer: normalizeValue(item.DiscountPer),
            DiscountAmt: normalizeValue(item.DiscountAmt),
            isOutSource: normalizeValue(item.isOutSource),
            HeadItemCode: normalizeValue(item.HeadItemCode),
            alterItemName: normalizeValue(item.alterItemName),
            pictureURL1: normalizeValue(item.pictureURL1),
            pictureURL2: normalizeValue(item.pictureURL2),
            pictureURL3: normalizeValue(item.pictureURL3),
            PackingNetWeight: normalizeValue(item.PackingNetWeight),
            PackingGrossWeight: normalizeValue(item.PackingGrossWeight),
            PackingLenth: normalizeValue(item.PackingLenth),
            PackingWidth: normalizeValue(item.PackingWidth),
            PackingHight: normalizeValue(item.PackingHight),
            OPbalQty: normalizeValue(item.OPbalQty),
            OPbalValue: normalizeValue(item.OPbalValue),
            balQty: normalizeValue(item.balQty),
            balValue: normalizeValue(item.balValue),
            alterItemName1: normalizeValue(item.alterItemName1),
            branchalternativecode: normalizeValue(item.branchalternativecode),
            isbundleItem: normalizeValue(item.isbundleItem),
            PackingQty: normalizeValue(item.PackingQty)
        });
        setSelectedItem(item);
    }, []);

    const setupNewRootItem = () => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new items');
            return;
        }

        const rootItems = items.filter(a => a.ItemParent === '00');
        const maxCode = rootItems.reduce((mx, a) => {
            const v = parseInt(normalizeValue(a.ItemCode).slice(0, 2)) || 0;
            return v > mx ? v : mx;
        }, 0);
        const newRootCode = (maxCode + 1).toString().padStart(2, '0');
        setAllFormData({
            ...getInitialItemData(currentOffcode),
            ItemCode: newRootCode,
            createdby: USER_LOGIN,
            editby: USER_LOGIN
        });
        setSelectedItem(null);
        setCurrentMode('new');
        setMessage(`Ready to create a new Root Item (Level 1). Code: ${newRootCode}`);
    };

    const setupNewChildItem = (parentItem) => {
        if (!hasPermission || !hasPermission(menuId, 'add')) {
            setMessage('⚠️ You do not have permission to create new items');
            return;
        }

        const pcode = normalizeValue(parentItem.ItemCode);
        const plevel = parseInt(normalizeValue(parentItem.nlevel || '1'));

        if (plevel >= 4) {
            setMessage('⚠️ Cannot create a new child item. Maximum hierarchy level (4) reached.');
            return;
        }

        const newCode = generateChildCode(pcode);
        setAllFormData({
            ...getInitialItemData(currentOffcode),
            StoreMainType: normalizeValue(parentItem.StoreMainType),
            offcode: normalizeValue(parentItem.offcode),
            ItemParent: pcode,
            ItemCode: newCode,
            ItemName: '',
            ItemType: normalizeValue(parentItem.ItemType),
            InvType: normalizeValue(parentItem.InvType),
            uom: normalizeValue(parentItem.uom),
            nlevel: String(plevel + 1),
            IsItemLevel: 'true',
            pictureURL: normalizeValue(parentItem.pictureURL),
            DeliveryTime: normalizeValue(parentItem.DeliveryTime),
            DeliveryLeadTime: normalizeValue(parentItem.DeliveryLeadTime),
            ManufacturLeadTime: normalizeValue(parentItem.ManufacturLeadTime),
            AssetAccount: normalizeValue(parentItem.AssetAccount),
            PurchaseReturnAccount: normalizeValue(parentItem.PurchaseReturnAccount),
            InputTaxAccount: normalizeValue(parentItem.InputTaxAccount),
            InputTaxRate: normalizeValue(parentItem.InputTaxRate),
            IncomeAccount: normalizeValue(parentItem.IncomeAccount),
            SalesReturnAccount: normalizeValue(parentItem.SalesReturnAccount),
            OutPutTaxAccount: normalizeValue(parentItem.OutPutTaxAccount),
            OutPutTaxRate: normalizeValue(parentItem.OutPutTaxRate),
            ConsumptionAccount: normalizeValue(parentItem.ConsumptionAccount),
            AdjustmentAccount: normalizeValue(parentItem.AdjustmentAccount),
            createdby: USER_LOGIN,
            editby: USER_LOGIN,
            typeCategory: normalizeValue(parentItem.typeCategory),
            noExpDays: normalizeValue(parentItem.noExpDays),
            excessQtyper: normalizeValue(parentItem.excessQtyper),
            HeadItemCode: normalizeValue(parentItem.HeadItemCode),
            pictureURL1: normalizeValue(parentItem.pictureURL1),
            pictureURL2: normalizeValue(parentItem.pictureURL2),
            pictureURL3: normalizeValue(parentItem.pictureURL3),
            PackingNetWeight: normalizeValue(parentItem.PackingNetWeight),
            PackingGrossWeight: normalizeValue(parentItem.PackingGrossWeight),
            PackingLenth: normalizeValue(parentItem.PackingLenth),
            PackingWidth: normalizeValue(parentItem.PackingWidth),
            PackingHight: normalizeValue(parentItem.PackingHight),
            PackingQty: normalizeValue(parentItem.PackingQty)
        });
        setCurrentMode('new');
        setMessage(`Ready to create a child item under ${pcode}. New Code: ${newCode}`);
    };

    const handleItemSelect = (item) => {
        if (!hasPermission || !hasPermission(menuId, 'view')) {
            setMessage('⚠️ You do not have permission to view items');
            return;
        }
        setCurrentMode('edit');
        loadItemDataIntoForm(item);
        setMessage(`Viewing/Editing Item: ${normalizeValue(item.ItemCode)} - ${normalizeValue(item.ItemName)}`);
    };

    const handleNewItemClick = () => {
        if (selectedItem && currentMode === 'edit') {
            setupNewChildItem(selectedItem);
        } else {
            setupNewRootItem();
        }
    };

    const handleSave = async () => {
        if (!hasPermission || !hasPermission(menuId, currentMode === 'new' ? 'add' : 'edit')) {
            setMessage(`⚠️ You do not have permission to ${currentMode === 'new' ? 'create' : 'edit'} items`);
            return;
        }

        const { ItemCode, ItemName, offcode } = formData;
        if (!ItemCode || !ItemName) {
            setMessage('⚠️ Item Code and Name are required.');
            return;
        }

        setIsLoading(true);
        setMessage('');
        const now = new Date().toISOString();

        const itemRecord = {
            ...formData,
            ...(currentMode === 'new' && { createdby: USER_LOGIN, createdate: now }),
            ...(currentMode === 'edit' && { editby: USER_LOGIN, editdate: now })
        };

        const payload = { tableName: API_CONFIG.TABLES.ITEM, data: itemRecord };
        let endpoint = API_CONFIG.INSERT_RECORD;
        let successMessage = '✅ Item created successfully!';
        if (currentMode === 'edit') {
            endpoint = API_CONFIG.UPDATE_RECORD;
            successMessage = '✅ Item updated successfully!';
            payload.where = { ItemCode: ItemCode, offcode: offcode };
        }

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                let errorText = `API request failed with status: ${resp.status}`;
                try {
                    const ed = await resp.json();
                    errorText = ed.error || ed.message || errorText;
                } catch (e) { }
                throw new Error(errorText);
            }
            const data = await resp.json();
            if (data.success) {
                setMessage(successMessage);
                await fetchItems();
                if (currentMode === 'new') {
                    if (formData.ItemParent !== '00' && selectedItem) {
                        setupNewChildItem(selectedItem);
                    } else {
                        setupNewRootItem();
                    }
                }
            } else {
                setMessage(`❌ Save Failed: ${data.message || 'API returned a failure signal.'}`);
            }
        } catch (err) {
            console.error('save item', err);
            setMessage(`❌ Critical Save Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteItem = async (item) => {
        if (!hasPermission || !hasPermission(menuId, 'delete')) {
            setMessage('⚠️ You do not have permission to delete items');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the item "${item.ItemName}"?`)) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const payload = {
                tableName: API_CONFIG.TABLES.ITEM,
                where: {
                    ItemCode: item.ItemCode,
                    offcode: item.offcode
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
                await fetchItems();

                if (selectedItem && selectedItem.ItemCode === item.ItemCode) {
                    setSelectedItem(null);
                    setCurrentMode('new');
                }
            } else {
                setMessage(`❌ Delete failed: ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Delete error:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAllFields = () => {
        setShowAllFields(!showAllFields);
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
                    <Icon.Package className="brand-icon" />
                    <div>
                        <h1>Item Profile</h1>
                        <div className="muted">Manage your item hierarchy and inventory</div>
                    </div>
                </div>
                <div className="header-user">
                    <button
                        className="toggle-view-btn"
                        onClick={toggleAllFields}
                        title={showAllFields ? "Show basic fields" : "Show all fields"}
                    >
                        {showAllFields ? <Icon.EyeOff /> : <Icon.Eye />}
                        {showAllFields ? "Basic View" : "Full View"}
                    </button>
                    <Icon.Users className="icon-sm" />
                    <span>{USER_LOGIN}</span>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-section">
                    {(hasPermission && (hasPermission(menuId, 'add') || hasPermission(menuId, 'edit'))) && (
                        <button className="toolbar-btn primary" onClick={handleSave} disabled={isLoading}>
                            <Icon.Save /> {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'add') && (
                        <button className="toolbar-btn" onClick={handleNewItemClick}>
                            <Icon.Plus /> New Item
                        </button>
                    )}
                    {hasPermission && hasPermission(menuId, 'edit') && (
                        <button className="toolbar-btn" onClick={() => {
                            if (selectedItem) {
                                setCurrentMode('edit');
                                loadItemDataIntoForm(selectedItem);
                            } else {
                                setMessage('Select an item to edit');
                            }
                        }}>
                            <Icon.Edit /> Edit
                        </button>
                    )}
                </div>

                <div className="toolbar-section">
                    <button className="toolbar-btn" onClick={() => { fetchItems(); refetchLookupData(); setMessage('Refreshing...'); }}>
                        <Icon.Refresh /> Refresh All Data
                    </button>
                </div>
            </div>

            {lookupError && (
                <div className="toast error">
                    <div className="toast-content">
                        <Icon.XCircle />
                        <span>{lookupError}</span>
                    </div>
                    <button className="toast-close" onClick={() => setError('')}>×</button>
                </div>
            )}

            <div className="content-area">
                <ItemTreeSidebar
                    items={items}
                    selectedItem={selectedItem}
                    onItemSelect={handleItemSelect}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    isLoading={isDataLoading}
                    hasPermission={hasPermission}
                    menuId={menuId}
                    onDelete={handleDeleteItem}
                />

                <div className="main-content">
                    <div className="content-tabs">
                        <button className="tab active">
                            <Icon.FileText /> Item Details
                        </button>
                    </div>

                    <div className="content-panel">
                        <ItemDetailForm
                            formData={formData}
                            onFormChange={updateFormData}
                            onSave={handleSave}
                            onNewItem={handleNewItemClick}
                            currentMode={currentMode}
                            selectedItem={selectedItem}
                            isLoading={isLoading}
                            isDataLoading={isDataLoading || isLookupLoading}
                            lookupData={lookupData}
                            showAllFields={showAllFields}
                            onToggleFields={toggleAllFields}
                            hasPermission={hasPermission}
                            menuId={menuId}
                        />
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default ItemProfile;