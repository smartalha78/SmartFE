import React, { useState, useEffect, useContext, useMemo } from "react";
import "./ProductCosting.css";
import { AuthContext } from "../../AuthContext";
import { useRights } from "../../context/RightsContext";
import API_BASE1 from "../../config";
import * as Icons from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ---------------------------
 * API Configuration
---------------------------- */
const API_CONFIG = {
    BASE_URL: API_BASE1,
    GET_PRODUCTS: `${API_BASE1}/get-products`,
    CALCULATE_REQUIRED_SUMMARY: `${API_BASE1}/calculate-required-summary`,
    CALCULATE_BOM_COST: `${API_BASE1}/calculate-bom-cost`,
    GET_PROCESSES_WITH_RATES: `${API_BASE1}/get-processes-with-rates`,
    GET_FACTORY_OVERHEADS: `${API_BASE1}/get-factory-overheads`,
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
const formatNumber = (num, decimals = 4) => {
    if (num === null || num === undefined || isNaN(num)) return '0.0000';
    return parseFloat(num).toFixed(decimals);
};

const formatCurrency = (num, currency = 'USD') => {
    if (num === null || num === undefined || isNaN(num)) return `0.00 ${currency}`;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(num) + ` ${currency}`;
};

/* ---------------------------
 * BOM Detail Row Component - FIXED field names
---------------------------- */
const BOMDetailRow = ({ index, data }) => {
    // Handle different possible field names from API
    const processName = data.processName || data.ProcessName || '-';
    const rawMaterialCode = data.rawMaterialCode || data.RawMaterialCode || data.RawMaterial || '';
    const rawMaterialName = data.rawMaterialName || data.RawMaterialName || data.rawMaterial || '';
    const uomName = data.uomName || data.UOMName || data.UOM || '';
    const requiredQty = data.requiredQty || data.RequiredQty || data.NoOfQtyRequired || 0;
    const costPrice = data.costPrice || data.CostPrice || data.ProfileCostPrice || 0;
    const value = data.value || data.Value || 0;
    const availableQty = data.availableQty || data.AvailableQty || data.Qty || 0;

    const isLowStock = parseFloat(availableQty) < parseFloat(requiredQty);

    return (
        <div className={`pc-bom-row ${isLowStock ? 'pc-low-stock' : ''}`}>
            <div className="pc-bom-cell pc-bom-index">{index + 1}</div>
            <div className="pc-bom-cell pc-bom-process">{processName}</div>
            <div className="pc-bom-cell pc-bom-material">
                <div className="pc-bom-material-code">{rawMaterialCode}</div>
                <div className="pc-bom-material-name">{rawMaterialName}</div>
            </div>
            <div className="pc-bom-cell pc-bom-uom">{uomName}</div>
            <div className="pc-bom-cell pc-bom-qty">{formatNumber(requiredQty)}</div>
            <div className="pc-bom-cell pc-bom-price">{formatNumber(costPrice)}</div>
            <div className="pc-bom-cell pc-bom-value">{formatNumber(value)}</div>
            <div className={`pc-bom-cell pc-bom-available ${isLowStock ? 'pc-warning' : ''}`}>
                {formatNumber(availableQty)}
                {isLowStock && <span className="pc-stock-warning" title="Low Stock!">⚠️</span>}
            </div>
        </div>
    );
};

/* ---------------------------
 * Process Overhead Row Component
---------------------------- */
const ProcessOverheadRow = ({ index, process, rate, defaultRate, onRateChange, canEdit }) => {
    const processId = process.ProcessID || process.ccode || process.processId;
    const processName = process.ProcessName || process.cname || process.processName || `Process ${processId}`;
    const currentRate = rate !== undefined ? rate : (defaultRate || 0);

    return (
        <div className="pc-overhead-row">
            <div className="pc-overhead-cell pc-overhead-index">{index + 1}</div>
            <div className="pc-overhead-cell pc-overhead-process">{processName}</div>
            <div className="pc-overhead-cell pc-overhead-rate">
                {canEdit ? (
                    <input
                        type="number"
                        step="0.01"
                        value={currentRate}
                        onChange={(e) => onRateChange(process, e.target.value)}
                        className="pc-rate-input"
                    />
                ) : (
                    <span>{formatNumber(currentRate)}</span>
                )}
            </div>
            {defaultRate > 0 && defaultRate !== currentRate && (
                <div className="pc-overhead-cell pc-overhead-default">
                    <small>(Default: {formatNumber(defaultRate)})</small>
                </div>
            )}
        </div>
    );
};

/* ---------------------------
 * Factory Overhead Row Component
---------------------------- */
const FactoryOverheadRow = ({ index, overhead, rate, onRateChange, canEdit }) => {
    return (
        <div className="pc-overhead-row">
            <div className="pc-overhead-cell pc-overhead-index">{index + 1}</div>
            <div className="pc-overhead-cell pc-overhead-process">{overhead.cname}</div>
            <div className="pc-overhead-cell pc-overhead-rate">
                {canEdit ? (
                    <input
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) => onRateChange(overhead, e.target.value)}
                        className="pc-rate-input"
                    />
                ) : (
                    <span>{formatNumber(rate)}</span>
                )}
            </div>
        </div>
    );
};

/* ---------------------------
 * Main Component
---------------------------- */
const ProductCosting = () => {
    const { credentials, uid, bcode, offcode: authOffcode } = useAuth();
    const { hasPermission, loading: rightsLoading } = useRights();
    const currentOffcode = useMemo(() => authOffcode || credentials?.offcode || '0101', [authOffcode, credentials]);

    // State
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rateType, setRateType] = useState('profile');
    const [productionQty, setProductionQty] = useState(1);
    const [bomDetails, setBomDetails] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [factoryOverheads, setFactoryOverheads] = useState([]);
    const [processRates, setProcessRates] = useState({});
    const [workflowRates, setWorkflowRates] = useState({});
    const [fohRates, setFohRates] = useState({});
    const [calculations, setCalculations] = useState({
        materialCost: 0,
        processCost: 0,
        fohCost: 0,
        totalCost: 0,
        profitMargin: 20,
        salePrice: 0,
        salePricePKR: 0,
        currency: 'USD',
        exchangeRate: 280.0
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('required');
    const [message, setMessage] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState([]);

    // Load products on mount
    useEffect(() => {
        loadProducts();
        loadFactoryOverheads();
    }, [currentOffcode]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const resp = await authFetch(API_CONFIG.GET_PRODUCTS, {
                method: 'POST',
                body: JSON.stringify({ offcode: currentOffcode })
            });
            const data = await resp.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            setMessage('❌ Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const loadProcessesWithRates = async (productCode = null) => {
        try {
            const resp = await authFetch(API_CONFIG.GET_PROCESSES_WITH_RATES, {
                method: 'POST',
                body: JSON.stringify({
                    offcode: currentOffcode,
                    productCode: productCode || selectedProduct?.ItemCode || null
                })
            });
            const data = await resp.json();
            if (data.success && data.data) {
                setProcesses(data.data || []);
                const initialRates = {};
                const workflowRatesMap = {};
                (data.data || []).forEach(process => {
                    const pid = process.ProcessID || process.ccode;
                    const defaultRate = process.defaultRate || 0;
                    initialRates[pid] = defaultRate;
                    if (defaultRate > 0) {
                        workflowRatesMap[pid] = defaultRate;
                    }
                });
                setProcessRates(initialRates);
                setWorkflowRates(workflowRatesMap);
            }
        } catch (error) {
            console.error('Error loading processes:', error);
        }
    };

    const loadFactoryOverheads = async () => {
        try {
            const resp = await authFetch(API_CONFIG.GET_FACTORY_OVERHEADS, {
                method: 'POST',
                body: JSON.stringify({ offcode: currentOffcode })
            });
            const data = await resp.json();
            if (data.success) {
                setFactoryOverheads(data.data || []);
                const initialRates = {};
                (data.data || []).forEach(foh => {
                    initialRates[foh.ccode] = 0;
                });
                setFohRates(initialRates);
            }
        } catch (error) {
            console.error('Error loading factory overheads:', error);
        }
    };

    const handleProductChange = async (product) => {
        setSelectedProduct(product);
        setBomDetails([]);
        setCalculations(prev => ({ ...prev, materialCost: 0, processCost: 0, fohCost: 0, totalCost: 0 }));
        setMessage('');

        if (product) {
            await loadProcessesWithRates(product.ItemCode);
        }
    };

    // Calculate Required Summary
    const handleCalculateRequiredSummary = async () => {
        if (!selectedProduct) {
            setMessage('⚠️ Please select a product first');
            return;
        }

        setIsCalculating(true);
        try {
            const resp = await authFetch(API_CONFIG.CALCULATE_REQUIRED_SUMMARY, {
                method: 'POST',
                body: JSON.stringify({
                    productCode: selectedProduct.ItemCode,
                    productionQty: productionQty,
                    rateType: rateType,
                    offcode: currentOffcode
                })
            });
            const data = await resp.json();
            console.log('API Response:', data); // Debug log

            if (data.success) {
                const bomData = data.data.bomDetails || [];
                console.log('BOM Details:', bomData); // Debug log

                setBomDetails(bomData);
                setCalculations(prev => ({
                    ...prev,
                    materialCost: data.data.materialCost || 0,
                    totalCost: data.data.materialCost || 0
                }));
                setMessage(`✅ BOM cost calculated successfully! Total: ${formatCurrency(data.data.materialCost, 'USD')}`);
                setActiveTab('required');
            } else {
                setMessage(`❌ Calculation failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Error calculating required summary:', error);
            setMessage('❌ Failed to calculate required summary');
        } finally {
            setIsCalculating(false);
        }
    };

    // Calculate Complete BOM Cost
    const handleCalculateCompleteBOM = async () => {
        if (!selectedProduct) {
            setMessage('⚠️ Please select a product first');
            return;
        }

        setIsCalculating(true);
        try {
            const resp = await authFetch(API_CONFIG.CALCULATE_BOM_COST, {
                method: 'POST',
                body: JSON.stringify({
                    productCode: selectedProduct.ItemCode,
                    productionQty: productionQty,
                    rateType: rateType,
                    offcode: currentOffcode,
                    processRates: processRates,
                    fohRates: fohRates
                })
            });
            const data = await resp.json();

            if (data.success) {
                setBomDetails(data.data.bomDetails || []);
                setCalculations(prev => ({
                    ...prev,
                    materialCost: data.data.materialCost || 0,
                    processCost: data.data.processCost || 0,
                    fohCost: data.data.fohCost || 0,
                    totalCost: data.data.totalCost || 0
                }));
                setMessage('✅ Complete BOM cost calculated successfully');
                setActiveTab('required');
            } else {
                setMessage(`❌ Calculation failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Error calculating complete BOM:', error);
            setMessage('❌ Failed to calculate complete BOM cost');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleProcessRateChange = (process, rate) => {
        const processId = process.ProcessID || process.ccode;
        const newRates = { ...processRates, [processId]: parseFloat(rate) || 0 };
        setProcessRates(newRates);

        let totalProcessCost = 0;
        Object.entries(newRates).forEach(([pid, rateValue]) => {
            totalProcessCost += (parseFloat(rateValue) || 0) * productionQty;
        });

        const newCalculations = {
            ...calculations,
            processCost: totalProcessCost,
            totalCost: calculations.materialCost + totalProcessCost + calculations.fohCost
        };
        setCalculations(newCalculations);
        updateSalePrice(newCalculations.totalCost, calculations.profitMargin);
    };

    const handleFOHRateChange = (overhead, rate) => {
        const newRates = { ...fohRates, [overhead.ccode]: parseFloat(rate) || 0 };
        setFohRates(newRates);

        let totalFOHCost = 0;
        Object.values(newRates).forEach(val => {
            totalFOHCost += parseFloat(val) || 0;
        });

        const newCalculations = {
            ...calculations,
            fohCost: totalFOHCost,
            totalCost: calculations.materialCost + calculations.processCost + totalFOHCost
        };
        setCalculations(newCalculations);
        updateSalePrice(newCalculations.totalCost, calculations.profitMargin);
    };

    const handleProfitMarginChange = (margin) => {
        const newMargin = parseFloat(margin) || 0;
        setCalculations(prev => ({ ...prev, profitMargin: newMargin }));
        updateSalePrice(calculations.totalCost, newMargin);
    };

    const updateSalePrice = (totalCost, profitMargin) => {
        const salePrice = totalCost * (1 + (profitMargin / 100));
        const salePricePKR = salePrice * calculations.exchangeRate;
        setCalculations(prev => ({
            ...prev,
            salePrice: salePrice,
            salePricePKR: salePricePKR
        }));
    };

    const handleCurrencyChange = (currency) => {
        setCalculations(prev => ({ ...prev, currency }));
        updateSalePrice(calculations.totalCost, calculations.profitMargin);
    };

    const handleExchangeRateChange = (rate) => {
        const newRate = parseFloat(rate) || 0;
        setCalculations(prev => ({
            ...prev,
            exchangeRate: newRate,
            salePricePKR: prev.salePrice * newRate
        }));
    };

    const exportToPDF = () => {
        if (!selectedProduct || bomDetails.length === 0) {
            setMessage('⚠️ Please calculate BOM cost first');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.setTextColor(0, 51, 102);
        doc.text('Product Cost Sheet', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Product: ${selectedProduct.ItemCode} - ${selectedProduct.ItemName}`, 14, 35);
        doc.text(`Production Qty: ${formatNumber(productionQty)}`, 14, 42);
        doc.text(`Rate Type: ${rateType === 'profile' ? 'Item Profile Rate' : rateType === 'lastSale' ? 'Last Sale Rate' : 'Average Rate'}`, 14, 49);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 56);

        const tableData = bomDetails.map((item, idx) => [
            idx + 1,
            item.rawMaterialCode || item.RawMaterialCode,
            item.rawMaterialName || item.RawMaterialName,
            item.uomName || item.UOMName,
            formatNumber(item.requiredQty || item.RequiredQty),
            formatNumber(item.costPrice || item.CostPrice),
            formatNumber(item.value || item.Value)
        ]);

        doc.autoTable({
            startY: 65,
            head: [['#', 'Code', 'Material', 'UOM', 'Req Qty', 'Price', 'Value']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
        });

        let finalY = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(10);
        doc.text(`Material Cost: ${formatCurrency(calculations.materialCost, calculations.currency)}`, 14, finalY);
        finalY += 7;
        doc.text(`Process Cost: ${formatCurrency(calculations.processCost, calculations.currency)}`, 14, finalY);
        finalY += 7;
        doc.text(`Factory Overhead: ${formatCurrency(calculations.fohCost, calculations.currency)}`, 14, finalY);
        finalY += 7;
        doc.text(`Total Cost: ${formatCurrency(calculations.totalCost, calculations.currency)}`, 14, finalY);
        finalY += 7;
        doc.text(`Profit Margin: ${calculations.profitMargin}%`, 14, finalY);
        finalY += 7;
        doc.text(`Sale Price: ${formatCurrency(calculations.salePrice, calculations.currency)}`, 14, finalY);
        finalY += 7;
        doc.text(`Sale Price (PKR): ${formatCurrency(calculations.salePricePKR, 'PKR')}`, 14, finalY);

        doc.save(`Cost_Sheet_${selectedProduct.ItemCode}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const exportToExcel = () => {
        if (!selectedProduct || bomDetails.length === 0) {
            setMessage('⚠️ Please calculate BOM cost first');
            return;
        }

        const wsData = [
            ['Product Cost Sheet'],
            ['Product Code', selectedProduct.ItemCode],
            ['Product Name', selectedProduct.ItemName],
            ['Production Qty', productionQty],
            ['Rate Type', rateType === 'profile' ? 'Item Profile Rate' : rateType === 'lastSale' ? 'Last Sale Rate' : 'Average Rate'],
            ['Date', new Date().toLocaleDateString()],
            [],
            ['BOM Details'],
            ['#', 'Process', 'Material Code', 'Material Name', 'UOM', 'Required Qty', 'Cost Price', 'Value', 'Available Qty']
        ];

        bomDetails.forEach((item, idx) => {
            wsData.push([
                idx + 1,
                item.processName || item.ProcessName,
                item.rawMaterialCode || item.RawMaterialCode,
                item.rawMaterialName || item.RawMaterialName,
                item.uomName || item.UOMName,
                formatNumber(item.requiredQty || item.RequiredQty),
                formatNumber(item.costPrice || item.CostPrice),
                formatNumber(item.value || item.Value),
                formatNumber(item.availableQty || item.AvailableQty)
            ]);
        });

        wsData.push([], ['Summary']);
        wsData.push(['Material Cost', formatNumber(calculations.materialCost)]);
        wsData.push(['Process Cost', formatNumber(calculations.processCost)]);
        wsData.push(['Factory Overhead', formatNumber(calculations.fohCost)]);
        wsData.push(['Total Cost', formatNumber(calculations.totalCost)]);
        wsData.push(['Profit Margin %', calculations.profitMargin]);
        wsData.push(['Sale Price', formatNumber(calculations.salePrice)]);
        wsData.push(['Sale Price (PKR)', formatNumber(calculations.salePricePKR)]);
        wsData.push(['Currency', calculations.currency]);
        wsData.push(['Exchange Rate', calculations.exchangeRate]);

        const ws = utils.aoa_to_sheet(wsData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'CostSheet');
        writeFile(wb, `Cost_Sheet_${selectedProduct.ItemCode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const generateReport = () => {
        setReportData(bomDetails);
        setShowReportModal(true);
    };

    const printReport = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html>
        <head>
            <title>Product Cost Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h2 { color: #1a365d; text-align: center; }
                .info { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
                .info-row { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #2c5282; color: white; }
                .summary { margin-top: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
                .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-weight: bold; font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
            </style>
        </head>
        <body>
            <h1>Product Cost Report</h1>
            <div class="info">
                <div class="info-row"><strong>Product:</strong> ${selectedProduct?.ItemCode} - ${selectedProduct?.ItemName}</div>
                <div class="info-row"><strong>Production Qty:</strong> ${formatNumber(productionQty)}</div>
                <div class="info-row"><strong>Rate Type:</strong> ${rateType === 'profile' ? 'Item Profile Rate' : rateType === 'lastSale' ? 'Last Sale Rate' : 'Average Rate'}</div>
                <div class="info-row"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
            <h2>BOM Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Process</th>
                        <th>Material Code</th>
                        <th>Material Name</th>
                        <th>UOM</th>
                        <th>Required Qty</th>
                        <th>Cost Price</th>
                        <th>Value</th>
                        <th>Available Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${bomDetails.map((item, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${item.processName || item.ProcessName || '-'}</td>
                            <td>${item.rawMaterialCode || item.RawMaterialCode}</td>
                            <td>${item.rawMaterialName || item.RawMaterialName}</td>
                            <td>${item.uomName || item.UOMName}</td>
                            <td style="text-align:right">${formatNumber(item.requiredQty || item.RequiredQty)}</td>
                            <td style="text-align:right">${formatNumber(item.costPrice || item.CostPrice)}</td>
                            <td style="text-align:right">${formatNumber(item.value || item.Value)}</td>
                            <td style="text-align:right">${formatNumber(item.availableQty || item.AvailableQty)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="summary">
                <div class="summary-row"><strong>Material Cost:</strong> ${formatCurrency(calculations.materialCost, calculations.currency)}</div>
                <div class="summary-row"><strong>Process Cost:</strong> ${formatCurrency(calculations.processCost, calculations.currency)}</div>
                <div class="summary-row"><strong>Factory Overhead:</strong> ${formatCurrency(calculations.fohCost, calculations.currency)}</div>
                <div class="summary-row total"><strong>Total Cost:</strong> ${formatCurrency(calculations.totalCost, calculations.currency)}</div>
                <div class="summary-row"><strong>Profit Margin:</strong> ${calculations.profitMargin}%</div>
                <div class="summary-row"><strong>Sale Price:</strong> ${formatCurrency(calculations.salePrice, calculations.currency)}</div>
                <div class="summary-row"><strong>Sale Price (PKR):</strong> ${formatCurrency(calculations.salePricePKR, 'PKR')}</div>
            </div>
        </body>
        </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    if (rightsLoading) {
        return (
            <div className="pc-loading-container">
                <Icons.Loader size={24} className="pc-spin" />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="pc-container">
            {/* Header */}
            <div className="pc-header">
                <h1>Product Costing</h1>
                <div className="pc-header-actions">
                    <button
                        type="button"
                        className="pc-btn pc-btn-primary"
                        onClick={handleCalculateRequiredSummary}
                        disabled={isCalculating || !selectedProduct}
                    >
                        {isCalculating ? <Icons.Loader size={16} className="pc-spin" /> : <Icons.Calculator size={16} />}
                        Calculate BOM Cost
                    </button>
                    <button
                        type="button"
                        className="pc-btn pc-btn-secondary"
                        onClick={exportToPDF}
                        disabled={bomDetails.length === 0}
                    >
                        <Icons.FileText size={16} />
                        PDF
                    </button>
                    <button
                        type="button"
                        className="pc-btn pc-btn-secondary"
                        onClick={exportToExcel}
                        disabled={bomDetails.length === 0}
                    >
                        <Icons.FileSpreadsheet size={16} />
                        Excel
                    </button>
                    <button
                        type="button"
                        className="pc-btn pc-btn-secondary"
                        onClick={generateReport}
                        disabled={bomDetails.length === 0}
                    >
                        <Icons.BarChart3 size={16} />
                        Report
                    </button>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`pc-toast ${message.includes('✅') ? 'pc-success' : message.includes('⚠️') ? 'pc-warning' : 'pc-error'}`}>
                    <div className="pc-toast-content">
                        {message.includes('✅') && <Icons.CheckCircle size={16} />}
                        {message.includes('❌') && <Icons.AlertCircle size={16} />}
                        {message.includes('⚠️') && <Icons.AlertTriangle size={16} />}
                        <span>{message.replace(/[✅❌⚠️]/g, '')}</span>
                    </div>
                    <button type="button" className="pc-toast-close" onClick={() => setMessage('')}>
                        <Icons.X size={12} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="pc-main-content">
                {/* Input Section */}
                <div className="pc-input-section">
                    <div className="pc-input-group">
                        <label>Product Code / Name</label>
                        <select
                            className="pc-select"
                            value={selectedProduct?.ItemCode || ''}
                            onChange={(e) => {
                                const product = products.find(p => p.ItemCode === e.target.value);
                                handleProductChange(product);
                            }}
                        >
                            <option value="">-- Select Product --</option>
                            {products.map(product => (
                                <option key={product.ItemCode} value={product.ItemCode}>
                                    {product.ItemCode} - {product.ItemName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pc-input-group">
                        <label>Rate Selection</label>
                        <div className="pc-radio-group">
                            <label className="pc-radio-label">
                                <input
                                    type="radio"
                                    value="profile"
                                    checked={rateType === 'profile'}
                                    onChange={() => setRateType('profile')}
                                />
                                Item Profile Rate
                            </label>
                            <label className="pc-radio-label">
                                <input
                                    type="radio"
                                    value="lastSale"
                                    checked={rateType === 'lastSale'}
                                    onChange={() => setRateType('lastSale')}
                                />
                                Last Sale Rate
                            </label>
                            <label className="pc-radio-label">
                                <input
                                    type="radio"
                                    value="average"
                                    checked={rateType === 'average'}
                                    onChange={() => setRateType('average')}
                                />
                                Average Rate
                            </label>
                        </div>
                    </div>

                    <div className="pc-input-group">
                        <label>Production QTY</label>
                        <input
                            type="number"
                            className="pc-input"
                            value={productionQty}
                            onChange={(e) => setProductionQty(parseFloat(e.target.value) || 1)}
                            min="1"
                            step="1"
                        />
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="pc-tabs">
                    <button
                        className={`pc-tab ${activeTab === 'required' ? 'pc-active' : ''}`}
                        onClick={() => setActiveTab('required')}
                    >
                        Required Summary
                    </button>
                    <button
                        className={`pc-tab ${activeTab === 'detail' ? 'pc-active' : ''}`}
                        onClick={() => setActiveTab('detail')}
                    >
                        Detail Required
                    </button>
                    <button
                        className={`pc-tab ${activeTab === 'process' ? 'pc-active' : ''}`}
                        onClick={() => setActiveTab('process')}
                    >
                        Process OverHead
                    </button>
                </div>

                {/* BOM Details Section */}
                <div className="pc-bom-section">
                    {isLoading ? (
                        <div className="pc-loading-state">
                            <Icons.Loader size={24} className="pc-spin" />
                            <p>Loading BOM data...</p>
                        </div>
                    ) : bomDetails.length === 0 ? (
                        <div className="pc-empty-state">
                            <Icons.Package size={32} />
                            <p>No BOM data available. Please select a product and calculate BOM cost.</p>
                        </div>
                    ) : (
                        <>
                            <div className="pc-bom-header">
                                <div className="pc-bom-cell pc-bom-index">#</div>
                                <div className="pc-bom-cell pc-bom-process">Process</div>
                                <div className="pc-bom-cell pc-bom-material">Raw Material Name</div>
                                <div className="pc-bom-cell pc-bom-uom">UOM</div>
                                <div className="pc-bom-cell pc-bom-qty">Required Qty</div>
                                <div className="pc-bom-cell pc-bom-price">Cost Price</div>
                                <div className="pc-bom-cell pc-bom-value">Value</div>
                                <div className="pc-bom-cell pc-bom-available">Available Qty</div>
                            </div>

                            <div className="pc-bom-body">
                                {bomDetails.map((item, idx) => (
                                    <BOMDetailRow key={idx} index={idx} data={item} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Process & Factory Overhead Section */}
                <div className="pc-overhead-section">
                    <div className="pc-overhead-left">
                        <h3>Process and Rates</h3>
                        <div className="pc-overhead-table">
                            <div className="pc-overhead-header">
                                <div className="pc-overhead-cell">#</div>
                                <div className="pc-overhead-cell">Process</div>
                                <div className="pc-overhead-cell">Rate</div>
                                <div className="pc-overhead-cell">Default</div>
                            </div>
                            <div className="pc-overhead-body">
                                {processes.map((process, idx) => (
                                    <ProcessOverheadRow
                                        key={process.ProcessID || process.ccode || idx}
                                        index={idx}
                                        process={process}
                                        rate={processRates[process.ProcessID || process.ccode] || 0}
                                        defaultRate={workflowRates[process.ProcessID || process.ccode] || 0}
                                        onRateChange={handleProcessRateChange}
                                        canEdit={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pc-overhead-right">
                        <h3>Factory Over Head Detail (F.O.H)</h3>
                        <div className="pc-overhead-table">
                            <div className="pc-overhead-header">
                                <div className="pc-overhead-cell">#</div>
                                <div className="pc-overhead-cell">Over Head Description</div>
                                <div className="pc-overhead-cell">Rate</div>
                            </div>
                            <div className="pc-overhead-body">
                                {factoryOverheads.map((foh, idx) => (
                                    <FactoryOverheadRow
                                        key={foh.ccode}
                                        index={idx}
                                        overhead={foh}
                                        rate={fohRates[foh.ccode] || 0}
                                        onRateChange={handleFOHRateChange}
                                        canEdit={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="pc-summary-section">
                    <div className="pc-summary-grid">
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Material Cost:</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.materialCost, calculations.currency)}</span>
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Process Cost:</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.processCost, calculations.currency)}</span>
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">F.O.H:</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.fohCost, calculations.currency)}</span>
                        </div>
                        <div className="pc-summary-item pc-summary-total">
                            <span className="pc-summary-label">Total Cost:</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.totalCost, calculations.currency)}</span>
                        </div>
                    </div>

                    <div className="pc-summary-row">
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Currency:</span>
                            <select
                                className="pc-select-small"
                                value={calculations.currency}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="PKR">PKR</option>
                            </select>
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Exchange Rate:</span>
                            <input
                                type="number"
                                className="pc-input-small"
                                value={calculations.exchangeRate}
                                onChange={(e) => handleExchangeRateChange(e.target.value)}
                                step="0.01"
                            />
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Total Cost (F.C.):</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.totalCost, calculations.currency)}</span>
                        </div>
                    </div>

                    <div className="pc-summary-row">
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Profit Margin %:</span>
                            <input
                                type="number"
                                className="pc-input-small"
                                value={calculations.profitMargin}
                                onChange={(e) => handleProfitMarginChange(e.target.value)}
                                step="0.1"
                                min="0"
                            />
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Sale Price:</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.salePrice, calculations.currency)}</span>
                        </div>
                        <div className="pc-summary-item">
                            <span className="pc-summary-label">Sale Price (PKR):</span>
                            <span className="pc-summary-value">{formatCurrency(calculations.salePricePKR, 'PKR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="pc-modal-overlay">
                    <div className="pc-modal-content pc-modal-large">
                        <div className="pc-modal-header">
                            <h2>Product Cost Report</h2>
                            <button type="button" className="pc-modal-close" onClick={() => setShowReportModal(false)}>
                                <Icons.X size={18} />
                            </button>
                        </div>
                        <div className="pc-modal-body">
                            <div className="pc-report-info">
                                <p><strong>Product:</strong> {selectedProduct?.ItemCode} - {selectedProduct?.ItemName}</p>
                                <p><strong>Production Qty:</strong> {formatNumber(productionQty)}</p>
                                <p><strong>Rate Type:</strong> {rateType === 'profile' ? 'Item Profile Rate' : rateType === 'lastSale' ? 'Last Sale Rate' : 'Average Rate'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                            </div>

                            <div className="pc-report-table-container">
                                <h3>BOM Details</h3>
                                <table className="pc-report-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Process</th>
                                            <th>Material Code</th>
                                            <th>Material Name</th>
                                            <th>UOM</th>
                                            <th>Required Qty</th>
                                            <th>Cost Price</th>
                                            <th>Value</th>
                                            <th>Available Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>{item.processName || item.ProcessName || '-'}</td>
                                                <td>{item.rawMaterialCode || item.RawMaterialCode}</td>
                                                <td>{item.rawMaterialName || item.RawMaterialName}</td>
                                                <td>{item.uomName || item.UOMName}</td>
                                                <td className="pc-text-right">{formatNumber(item.requiredQty || item.RequiredQty)}</td>
                                                <td className="pc-text-right">{formatNumber(item.costPrice || item.CostPrice)}</td>
                                                <td className="pc-text-right">{formatNumber(item.value || item.Value)}</td>
                                                <td className="pc-text-right">{formatNumber(item.availableQty || item.AvailableQty)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pc-report-summary">
                                <h3>Summary</h3>
                                <div className="pc-summary-lines">
                                    <div><strong>Material Cost:</strong> {formatCurrency(calculations.materialCost, calculations.currency)}</div>
                                    <div><strong>Process Cost:</strong> {formatCurrency(calculations.processCost, calculations.currency)}</div>
                                    <div><strong>Factory Overhead:</strong> {formatCurrency(calculations.fohCost, calculations.currency)}</div>
                                    <div className="pc-total-line"><strong>Total Cost:</strong> {formatCurrency(calculations.totalCost, calculations.currency)}</div>
                                    <div><strong>Profit Margin:</strong> {calculations.profitMargin}%</div>
                                    <div><strong>Sale Price:</strong> {formatCurrency(calculations.salePrice, calculations.currency)}</div>
                                    <div><strong>Sale Price (PKR):</strong> {formatCurrency(calculations.salePricePKR, 'PKR')}</div>
                                </div>
                            </div>

                            <div className="pc-modal-footer">
                                <button type="button" className="pc-btn pc-btn-secondary" onClick={printReport}>
                                    <Icons.Printer size={14} /> Print
                                </button>
                                <button type="button" className="pc-btn pc-btn-primary" onClick={exportToExcel}>
                                    <Icons.FileSpreadsheet size={14} /> Export to Excel
                                </button>
                                <button type="button" className="pc-btn pc-btn-primary" onClick={exportToPDF}>
                                    <Icons.FileText size={14} /> Export to PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCosting;