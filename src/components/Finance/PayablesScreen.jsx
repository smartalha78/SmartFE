// import React, { useState, useEffect, useContext, useCallback } from "react";
// import axios from "axios";
// import { AuthContext } from "../../AuthContext";
// import Pagination from "../Common/Pagination";
// import { 
//   Search, Plus, Edit, Trash2, Save, X, FileText, DollarSign, 
//   Calendar, Building, Users, Filter, CheckCircle, 
//   AlertCircle, Loader2, RefreshCw, Eye, ChevronDown, Download,
//   Send, Lock, Unlock, Tag, Clock, CheckSquare, Square, MoreVertical,
//   Ban, RotateCcw, BookOpen, ExternalLink, TrendingUp, TrendingDown,
//   CreditCard, Receipt, Banknote, Wallet, BarChart, PieChart,
//   ChevronRight, ChevronLeft, Printer, Mail, Share2, 
//   FileSpreadsheet, FileText as FileTextIcon, CalendarDays,
//   Truck, Package, ShoppingCart
// } from "lucide-react";
// import "./ReceivablesPayables.css";

// const PayablesScreen = () => {
//   const { credentials } = useContext(AuthContext);
//   const currentOffcode = credentials?.company?.offcode || "0101";
//   const currentUsername = credentials?.username || "administrator";
  
//   // State management (same as receivables but for payables)
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFilter, setDateFilter] = useState("all");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [supplierFilter, setSupplierFilter] = useState("");
//   const [chequeStatusFilter, setChequeStatusFilter] = useState("all");
//   const [showPopup, setShowPopup] = useState(false);
//   const [popupMode, setPopupMode] = useState("new");
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [notification, setNotification] = useState({ type: "", message: "" });
//   const [showAgingReport, setShowAgingReport] = useState(false);
  
//   // Data states
//   const [payables, setPayables] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [totalItems, setTotalItems] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [summary, setSummary] = useState({
//     totalAmount: 0,
//     totalWhtAmount: 0,
//     totalCount: 0,
//     averageAmount: 0
//   });
  
//   // Form states
//   const [formData, setFormData] = useState(getInitialFormData());
//   const [chequeDetails, setChequeDetails] = useState([getInitialChequeDetail()]);
  
//   // Aging report state
//   const [agingData, setAgingData] = useState({
//     agingData: [],
//     supplierSummary: [],
//     agingSummary: { current: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0 },
//     asOfDate: new Date().toISOString().split('T')[0],
//     totalSuppliers: 0,
//     totalInvoices: 0
//   });
//   const [loadingAging, setLoadingAging] = useState(false);
  
//   // API Configuration for Payables
//   const API_CONFIG = {
//     BASE_URL: "http://192.168.100.113:8081",
//     GET_PAYABLES: "http://192.168.100.113:8081/api/get-receivables-payables",
//     GET_SUPPLIERS: "http://192.168.100.113:8081/api/get-payable-suppliers",
//     GET_DETAIL: "http://192.168.100.113:8081/api/get-receivable-payable-detail",
//     CREATE_RECORD: "http://192.168.100.113:8081/api/create-receivable-payable",
//     UPDATE_STATUS: "http://192.168.100.113:8081/api/update-receivable-payable-status",
//     GET_AGING_REPORT: "http://192.168.100.113:8081/api/get-payables-aging"
//   };
  
//   // Initial form data for payables
//   function getInitialFormData() {
//     const now = new Date();
//     const currentDate = now.toISOString().split('T')[0];
    
//     return {
//       vockey: "",
//       vno: "",
//       vdate: currentDate,
//       vtype: "BPV", // Default: Bank Payment Voucher
//       suppliercode: "",
//       suppliername: "",
//       posted: "false",
//       currencyCode: "1",
//       compcode: "01",
//       offcode: currentOffcode,
//       createdby: currentUsername,
//       createdate: currentDate,
//       editby: currentUsername,
//       editdate: currentDate,
//       uid: credentials?.uid || "2",
//       status: "1",
//       YCode: "9",
//       pk: "",
//       city: "",
//       Amount: "0.00",
//       CashAdjust: "false",
//       manualRefNo: "",
//       bcode: currentOffcode + "01",
//       CashAdjustAmount: "0",
//       BankCode: "",
//       WhtAmount: "0.00",
//       NetAmount: "0.00",
//       SaleTaxWHLAmount: "0.00",
//       FCAmount: "0.00",
//       woVno: "",
//       acBalHeadAmount: "0.00",
//       postedDateTime: "",
//       narration: "",
//       // Cheque specific fields
//       chequeBankCode: "",
//       chequeNo: "",
//       chequeDate: currentDate,
//       chequeStatus: "1", // 1 = pending, 2 = issued, 3 = cleared, 4 = cancelled
//       chequeDepositDate: "",
//       chequeClearBonusDate: "",
//       chequepath: ""
//     };
//   }
  
//   function getInitialChequeDetail() {
//     return {
//       chequeNo: "",
//       chequeDate: new Date().toISOString().split('T')[0],
//       chequeAmount: "0.00",
//       chequeBank: "",
//       chequeStatus: "1",
//       remarks: ""
//     };
//   }
  
//   // Load all data
//   const loadAllData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       // Load suppliers first
//       await loadSuppliers();
      
//       // Load payables
//       const response = await axios.post(API_CONFIG.GET_PAYABLES, {
//         tableName: "acChequeHead",
//         type: "payable",
//         page: currentPage,
//         limit: itemsPerPage,
//         usePagination: true,
//         search: searchTerm,
//         fromDate: dateFilter === "custom" ? fromDate : "",
//         toDate: dateFilter === "custom" ? toDate : "",
//         supplierCode: supplierFilter,
//         chequeStatus: chequeStatusFilter !== "all" ? chequeStatusFilter : ""
//       });
      
//       if (response.data.success) {
//         setPayables(response.data.rows || []);
//         setTotalItems(response.data.totalCount || 0);
//         setTotalPages(response.data.totalPages || 1);
//         setSummary(response.data.summary || {
//           totalAmount: 0,
//           totalWhtAmount: 0,
//           totalCount: 0,
//           averageAmount: 0
//         });
//       } else {
//         throw new Error(response.data.error || "Failed to fetch payables");
//       }
//     } catch (err) {
//       console.error("❌ Error loading data:", err);
//       setError(err.response?.data?.error || err.message || "Failed to load data");
//       setNotification({
//         type: "error",
//         message: "Failed to load payables data"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Load suppliers
//   const loadSuppliers = async () => {
//     try {
//       const response = await axios.post(API_CONFIG.GET_SUPPLIERS, {
//         offcode: currentOffcode,
//         search: ""
//       });
      
//       if (response.data.success) {
//         setSuppliers(response.data.suppliers || []);
//       }
//     } catch (err) {
//       console.error("❌ Error loading suppliers:", err);
//     }
//   };
  
//   // Load aging report
//   const loadAgingReport = async () => {
//     setLoadingAging(true);
//     try {
//       const response = await axios.post(API_CONFIG.GET_AGING_REPORT, {
//         offcode: currentOffcode,
//         asOfDate: agingData.asOfDate
//       });
      
//       if (response.data.success) {
//         setAgingData(response.data);
//       }
//     } catch (err) {
//       console.error("❌ Error loading aging report:", err);
//       setNotification({
//         type: "error",
//         message: "Failed to load aging report"
//       });
//     } finally {
//       setLoadingAging(false);
//     }
//   };
  
//   // Initialize
//   useEffect(() => {
//     loadAllData();
//   }, [currentPage, itemsPerPage]);
  
//   // Handle search with debounce
//   const [searchTimeout, setSearchTimeout] = useState(null);
//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     setSearchTerm(value);
    
//     if (searchTimeout) {
//       clearTimeout(searchTimeout);
//     }
    
//     const timeout = setTimeout(() => {
//       setCurrentPage(1);
//       loadAllData();
//     }, 500);
    
//     setSearchTimeout(timeout);
//   };
  
//   // Apply filters
//   const applyFilters = () => {
//     setCurrentPage(1);
//     loadAllData();
//   };
  
//   // Clear filters
//   const clearFilters = () => {
//     setSearchTerm("");
//     setStatusFilter("all");
//     setDateFilter("all");
//     setFromDate("");
//     setToDate("");
//     setSupplierFilter("");
//     setChequeStatusFilter("all");
//     setCurrentPage(1);
//   };
  
//   // Handle new record
//   const handleNewRecord = () => {
//     setFormData(getInitialFormData());
//     setChequeDetails([getInitialChequeDetail()]);
//     setPopupMode("new");
//     setSelectedRecord(null);
//     setShowPopup(true);
//   };
  
//   // Handle view record
//   const handleViewRecord = async (record) => {
//     setLoading(true);
//     try {
//       const response = await axios.post(API_CONFIG.GET_DETAIL, {
//         vockey: record.vockey,
//         vtype: record.vtype,
//         offcode: record.offcode
//       });
      
//       if (response.data.success) {
//         setFormData(response.data.data);
//         setChequeDetails(response.data.relatedDetails || []);
//         setSelectedRecord(record);
//         setPopupMode("view");
//         setShowPopup(true);
//       }
//     } catch (err) {
//       console.error("❌ Error viewing record:", err);
//       setNotification({
//         type: "error",
//         message: "Failed to load record details"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Handle edit record
//   const handleEditRecord = async (record) => {
//     if (record.posted === "true" || record.status === "2") {
//       setNotification({
//         type: "error",
//         message: "Cannot edit posted payables"
//       });
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const response = await axios.post(API_CONFIG.GET_DETAIL, {
//         vockey: record.vockey,
//         vtype: record.vtype,
//         offcode: record.offcode
//       });
      
//       if (response.data.success) {
//         setFormData(response.data.data);
//         setChequeDetails(response.data.relatedDetails || []);
//         setSelectedRecord(record);
//         setPopupMode("edit");
//         setShowPopup(true);
//       }
//     } catch (err) {
//       console.error("❌ Error editing record:", err);
//       setNotification({
//         type: "error",
//         message: "Failed to load record for editing"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Handle form changes
//   const handleFormChange = (field, value) => {
//     const updated = { ...formData, [field]: value };
    
//     // If supplier code changes, update supplier name
//     if (field === "suppliercode") {
//       const supplier = suppliers.find(s => s.code === value);
//       if (supplier) {
//         updated.suppliername = supplier.name;
//         updated.city = supplier.city || "";
//       }
//     }
    
//     // If cheque amount changes, update NetAmount
//     if (field === "Amount") {
//       const whtAmount = parseFloat(updated.WhtAmount || 0);
//       const amount = parseFloat(value || 0);
//       updated.NetAmount = (amount - whtAmount).toFixed(2);
//     }
    
//     // If WHT amount changes, update NetAmount
//     if (field === "WhtAmount") {
//       const amount = parseFloat(updated.Amount || 0);
//       const whtAmount = parseFloat(value || 0);
//       updated.NetAmount = (amount - whtAmount).toFixed(2);
//     }
    
//     setFormData(updated);
//   };
  
//   // Handle cheque detail changes
//   const handleChequeDetailChange = (index, field, value) => {
//     const updated = [...chequeDetails];
//     updated[index][field] = value;
//     setChequeDetails(updated);
//   };
  
//   // Add cheque detail
//   const handleAddChequeDetail = () => {
//     setChequeDetails([...chequeDetails, getInitialChequeDetail()]);
//   };
  
//   // Remove cheque detail
//   const handleRemoveChequeDetail = (index) => {
//     if (chequeDetails.length > 1) {
//       const updated = chequeDetails.filter((_, i) => i !== index);
//       setChequeDetails(updated);
//     }
//   };
  
//   // Save record
//   const handleSaveRecord = async () => {
//     setLoading(true);
//     try {
//       const payload = {
//         head: {
//           data: formData
//         },
//         details: chequeDetails.map(detail => ({
//           data: detail
//         })),
//         type: "payable"
//       };
      
//       const response = await axios.post(API_CONFIG.CREATE_RECORD, payload);
      
//       if (response.data.success) {
//         setNotification({
//           type: "success",
//           message: `Payable ${response.data.vno} created successfully`
//         });
//         setShowPopup(false);
//         loadAllData();
//       }
//     } catch (err) {
//       console.error("❌ Error saving record:", err);
//       setNotification({
//         type: "error",
//         message: err.response?.data?.error || "Failed to save payable"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Update status
//   const handleUpdateStatus = async (record, newStatus) => {
//     if (!window.confirm(`Are you sure you want to ${newStatus} this payable?`)) {
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const payload = {
//         vockey: record.vockey,
//         vtype: record.vtype,
//         offcode: record.offcode,
//         status: newStatus === "post" ? "2" : newStatus === "cancel" ? "3" : "1",
//         posted: newStatus === "post" ? "true" : "false",
//         cancelled: newStatus === "cancel" ? "true" : "false"
//       };
      
//       const response = await axios.post(API_CONFIG.UPDATE_STATUS, payload);
      
//       if (response.data.success) {
//         setNotification({
//           type: "success",
//           message: `Payable ${newStatus}ed successfully`
//         });
//         loadAllData();
//       }
//     } catch (err) {
//       console.error("❌ Error updating status:", err);
//       setNotification({
//         type: "error",
//         message: err.response?.data?.error || "Failed to update status"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Format amount
//   const formatAmount = (amount) => {
//     const num = parseFloat(amount) || 0;
//     return num.toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };
  
//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric"
//     });
//   };
  
//   // Get status badge
//   const getStatusBadge = (record) => {
//     if (record.cancelled === "true" || record.status === "3") {
//       return <span className="status-badge cancelled">Cancelled</span>;
//     } else if (record.posted === "true" || record.status === "2") {
//       return <span className="status-badge posted">Posted</span>;
//     } else {
//       return <span className="status-badge unposted">UnPosted</span>;
//     }
//   };
  
//   // Get cheque status badge
//   const getChequeStatusBadge = (status) => {
//     const statusMap = {
//       "1": { label: "Pending", className: "pending" },
//       "2": { label: "Issued", className: "issued" },
//       "3": { label: "Cleared", className: "cleared" },
//       "4": { label: "Cancelled", className: "cancelled" }
//     };
    
//     const statusInfo = statusMap[status] || { label: "Unknown", className: "unknown" };
//     return <span className={`cheque-status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
//   };
  
//   // Get voucher type name
//   const getVoucherTypeName = (type) => {
//     const typeMap = {
//       "BPV": "Bank Payment Voucher",
//       "CPV": "Cash Payment Voucher",
//       "APV": "Advance Payment Voucher",
//       "ACH": "Account Payable Cheque"
//     };
//     return typeMap[type] || type;
//   };
  
//   return (
//     <div className="receivables-container">
//       {/* Notification */}
//       {notification.message && (
//         <div className={`notification ${notification.type}`}>
//           {notification.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
//           <span>{notification.message}</span>
//           <button onClick={() => setNotification({ type: "", message: "" })}>
//             <X size={16} />
//           </button>
//         </div>
//       )}
      
//       {/* Header */}
//       <div className="receivables-header">
//         <div className="header-left">
//           <div className="title-section">
//             <Truck size={28} className="title-icon" />
//             <div>
//               <h1>Accounts Payable</h1>
//               <p className="subtitle">Manage supplier invoices and payments</p>
//             </div>
//           </div>
//         </div>
        
//         <div className="header-right">
//           <div className="summary-cards">
//             <div className="summary-card">
//               <div className="summary-card-icon total">
//                 <DollarSign size={20} />
//               </div>
//               <div className="summary-card-content">
//                 <div className="summary-card-label">Total Payables</div>
//                 <div className="summary-card-value">${formatAmount(summary.totalAmount)}</div>
//               </div>
//             </div>
            
//             <div className="summary-card">
//               <div className="summary-card-icon count">
//                 <FileText size={20} />
//               </div>
//               <div className="summary-card-content">
//                 <div className="summary-card-label">Total Invoices</div>
//                 <div className="summary-card-value">{summary.totalCount}</div>
//               </div>
//             </div>
            
//             <div className="summary-card">
//               <div className="summary-card-icon average">
//                 <BarChart size={20} />
//               </div>
//               <div className="summary-card-content">
//                 <div className="summary-card-label">Avg. Amount</div>
//                 <div className="summary-card-value">${formatAmount(summary.averageAmount)}</div>
//               </div>
//             </div>
            
//             <div className="summary-card">
//               <div className="summary-card-icon wht">
//                 <CreditCard size={20} />
//               </div>
//               <div className="summary-card-content">
//                 <div className="summary-card-label">Total WHT</div>
//                 <div className="summary-card-value">${formatAmount(summary.totalWhtAmount)}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Toolbar */}
//       <div className="receivables-toolbar">
//         <div className="toolbar-left">
//           <div className="search-box">
//             <Search size={18} />
//             <input
//               type="text"
//               placeholder="Search by voucher no, supplier, cheque no..."
//               value={searchTerm}
//               onChange={handleSearchChange}
//             />
//           </div>
          
//           <div className="filters">
//             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//               <option value="all">All Status</option>
//               <option value="unposted">UnPosted</option>
//               <option value="posted">Posted</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
            
//             <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
//               <option value="all">All Dates</option>
//               <option value="today">Today</option>
//               <option value="thisWeek">This Week</option>
//               <option value="thisMonth">This Month</option>
//               <option value="custom">Custom Range</option>
//             </select>
            
//             {dateFilter === "custom" && (
//               <div className="date-range">
//                 <input
//                   type="date"
//                   value={fromDate}
//                   onChange={(e) => setFromDate(e.target.value)}
//                 />
//                 <span>to</span>
//                 <input
//                   type="date"
//                   value={toDate}
//                   onChange={(e) => setToDate(e.target.value)}
//                 />
//               </div>
//             )}
            
//             <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All Suppliers</option>
//               {suppliers.map(supplier => (
//                 <option key={supplier.code} value={supplier.code}>
//                   {supplier.code} - {supplier.name}
//                 </option>
//               ))}
//             </select>
            
//             <select value={chequeStatusFilter} onChange={(e) => setChequeStatusFilter(e.target.value)}>
//               <option value="all">All Cheque Status</option>
//               <option value="1">Pending</option>
//               <option value="2">Issued</option>
//               <option value="3">Cleared</option>
//               <option value="4">Cancelled</option>
//             </select>
            
//             <button className="apply-filters-btn" onClick={applyFilters}>
//               <Filter size={16} />
//               Apply
//             </button>
            
//             {(searchTerm || statusFilter !== "all" || dateFilter !== "all" || supplierFilter || chequeStatusFilter !== "all") && (
//               <button className="clear-filters-btn" onClick={clearFilters}>
//                 <X size={16} />
//                 Clear
//               </button>
//             )}
//           </div>
//         </div>
        
//         <div className="toolbar-right">
//           <button className="secondary-btn" onClick={() => setShowAgingReport(true)}>
//             <CalendarDays size={16} />
//             Aging Report
//           </button>
          
//           <button className="secondary-btn">
//             <Download size={16} />
//             Export
//           </button>
          
//           <button className="refresh-btn" onClick={loadAllData} disabled={loading}>
//             <RefreshCw size={16} className={loading ? "spin" : ""} />
//           </button>
          
//           <button className="primary-btn" onClick={handleNewRecord} disabled={loading}>
//             <Plus size={16} />
//             New Payable
//           </button>
//         </div>
//       </div>
      
//       {/* Main Content */}
//       <div className="receivables-content">
//         {loading ? (
//           <div className="loading-state">
//             <Loader2 className="spin" size={32} />
//             <p>Loading payables...</p>
//           </div>
//         ) : error ? (
//           <div className="error-state">
//             <AlertCircle size={32} />
//             <p>{error}</p>
//             <button onClick={loadAllData} className="retry-btn">
//               <RefreshCw size={16} />
//               Retry
//             </button>
//           </div>
//         ) : payables.length === 0 ? (
//           <div className="empty-state">
//             <Truck size={48} />
//             <p>No payables found</p>
//             <p className="empty-subtext">Try adjusting your filters or create a new payable</p>
//             <button onClick={handleNewRecord} className="empty-action-btn">
//               <Plus size={16} />
//               Create Payable
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="receivables-table">
//               <div className="table-header">
//                 <div className="table-cell">Voucher No</div>
//                 <div className="table-cell">Supplier</div>
//                 <div className="table-cell">Date</div>
//                 <div className="table-cell">Type</div>
//                 <div className="table-cell">Amount</div>
//                 <div className="table-cell">WHT</div>
//                 <div className="table-cell">Net Amount</div>
//                 <div className="table-cell">Cheque Status</div>
//                 <div className="table-cell">Status</div>
//                 <div className="table-cell">Actions</div>
//               </div>
              
//               <div className="table-body">
//                 {payables.map((record, index) => (
//                   <div key={`${record.vockey}_${index}`} className="table-row">
//                     <div className="table-cell">
//                       <div className="voucher-info">
//                         <div className="voucher-no">{record.vno}</div>
//                         <div className="voucher-ref">{record.manualRefNo || "No Ref"}</div>
//                       </div>
//                     </div>
                    
//                     <div className="table-cell">
//                       <div className="customer-info">
//                         <div className="customer-name">{record.suppliername}</div>
//                         <div className="customer-code">{record.suppliercode}</div>
//                       </div>
//                     </div>
                    
//                     <div className="table-cell">
//                       <div className="date-info">
//                         <Calendar size={14} />
//                         {formatDate(record.vdate)}
//                       </div>
//                     </div>
                    
//                     <div className="table-cell">
//                       <span className="voucher-type">{getVoucherTypeName(record.vtype)}</span>
//                     </div>
                    
//                     <div className="table-cell">
//                       <div className="amount-info">
//                         <DollarSign size={14} />
//                         ${formatAmount(record.Amount)}
//                       </div>
//                     </div>
                    
//                     <div className="table-cell">
//                       ${formatAmount(record.WhtAmount)}
//                     </div>
                    
//                     <div className="table-cell">
//                       <strong>${formatAmount(record.NetAmount)}</strong>
//                     </div>
                    
//                     <div className="table-cell">
//                       {record.chequeStatus ? getChequeStatusBadge(record.chequeStatus) : "-"}
//                     </div>
                    
//                     <div className="table-cell">
//                       {getStatusBadge(record)}
//                     </div>
                    
//                     <div className="table-cell">
//                       <div className="action-buttons">
//                         <button
//                           className="action-btn view"
//                           onClick={() => handleViewRecord(record)}
//                           title="View"
//                         >
//                           <Eye size={16} />
//                         </button>
                        
//                         {record.posted !== "true" && record.status !== "2" && record.cancelled !== "true" && (
//                           <button
//                             className="action-btn edit"
//                             onClick={() => handleEditRecord(record)}
//                             title="Edit"
//                           >
//                             <Edit size={16} />
//                           </button>
//                         )}
                        
//                         {record.posted !== "true" && record.status !== "2" && record.cancelled !== "true" && (
//                           <button
//                             className="action-btn post"
//                             onClick={() => handleUpdateStatus(record, "post")}
//                             title="Post"
//                           >
//                             <Lock size={16} />
//                           </button>
//                         )}
                        
//                         {record.posted !== "true" && record.cancelled !== "true" && (
//                           <button
//                             className="action-btn cancel"
//                             onClick={() => handleUpdateStatus(record, "cancel")}
//                             title="Cancel"
//                           >
//                             <Ban size={16} />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
            
//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="pagination-container">
//                 <Pagination
//                   currentPage={currentPage}
//                   totalItems={totalItems}
//                   itemsPerPage={itemsPerPage}
//                   onPageChange={setCurrentPage}
//                 />
//               </div>
//             )}
//           </>
//         )}
//       </div>
      
//       {/* Popup Form */}
//       {showPopup && (
//         <PayableFormPopup
//           isOpen={showPopup}
//           onClose={() => setShowPopup(false)}
//           mode={popupMode}
//           formData={formData}
//           suppliers={suppliers}
//           chequeDetails={chequeDetails}
//           onChangeForm={handleFormChange}
//           onChangeChequeDetail={handleChequeDetailChange}
//           onAddChequeDetail={handleAddChequeDetail}
//           onRemoveChequeDetail={handleRemoveChequeDetail}
//           onSave={handleSaveRecord}
//           loading={loading}
//         />
//       )}
      
//       {/* Aging Report Modal */}
//       {showAgingReport && (
//         <PayableAgingReportModal
//           isOpen={showAgingReport}
//           onClose={() => setShowAgingReport(false)}
//           agingData={agingData}
//           loading={loadingAging}
//           onRefresh={loadAgingReport}
//           onDateChange={(date) => setAgingData(prev => ({ ...prev, asOfDate: date }))}
//         />
//       )}
//     </div>
//   );
// };

// // Payable Form Popup Component
// const PayableFormPopup = ({
//   isOpen,
//   onClose,
//   mode,
//   formData,
//   suppliers,
//   chequeDetails,
//   onChangeForm,
//   onChangeChequeDetail,
//   onAddChequeDetail,
//   onRemoveChequeDetail,
//   onSave,
//   loading
// }) => {
//   const isViewMode = mode === "view";
//   const isPosted = formData.posted === "true" || formData.status === "2";
//   const isCancelled = formData.cancelled === "true" || formData.status === "3";
//   const isDisabled = isViewMode || isPosted || isCancelled;
  
//   if (!isOpen) return null;
  
//   return (
//     <>
//       <div className="popup-backdrop" onClick={onClose}></div>
//       <div className="popup-container">
//         <div className="popup-content">
//           {/* Header */}
//           <div className="popup-header">
//             <div className="popup-title">
//               <Truck size={20} />
//               <div>
//                 <h2>
//                   {mode === "new" ? "Create New Payable" : 
//                    mode === "edit" ? "Edit Payable" : "View Payable"}
//                 </h2>
//                 <div className="popup-subtitle">
//                   {formData.vno && <span className="voucher-no">Voucher: {formData.vno}</span>}
//                   {isPosted && <span className="status-badge posted">Posted</span>}
//                   {isCancelled && <span className="status-badge cancelled">Cancelled</span>}
//                   {!isPosted && !isCancelled && <span className="status-badge unposted">UnPosted</span>}
//                 </div>
//               </div>
//             </div>
//             <button className="popup-close" onClick={onClose}>
//               <X size={24} />
//             </button>
//           </div>
          
//           {/* Body */}
//           <div className="popup-body">
//             <div className="form-section">
//               <h3 className="section-title">Basic Information</h3>
//               <div className="form-grid">
//                 <div className="form-group">
//                   <label>Supplier *</label>
//                   <select
//                     value={formData.suppliercode}
//                     onChange={(e) => onChangeForm("suppliercode", e.target.value)}
//                     disabled={isDisabled || loading}
//                   >
//                     <option value="">Select Supplier</option>
//                     {suppliers.map(supplier => (
//                       <option key={supplier.code} value={supplier.code}>
//                         {supplier.code} - {supplier.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div className="form-group">
//                   <label>Date *</label>
//                   <input
//                     type="date"
//                     value={formData.vdate}
//                     onChange={(e) => onChangeForm("vdate", e.target.value)}
//                     disabled={isDisabled || loading}
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Voucher Type *</label>
//                   <select
//                     value={formData.vtype}
//                     onChange={(e) => onChangeForm("vtype", e.target.value)}
//                     disabled={isDisabled || loading || mode === "edit"}
//                   >
//                     <option value="BPV">Bank Payment Voucher</option>
//                     <option value="CPV">Cash Payment Voucher</option>
//                     <option value="APV">Advance Payment Voucher</option>
//                     <option value="ACH">Account Payable Cheque</option>
//                   </select>
//                 </div>
                
//                 <div className="form-group">
//                   <label>Amount *</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={formData.Amount}
//                     onChange={(e) => onChangeForm("Amount", e.target.value)}
//                     disabled={isDisabled || loading}
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>WHT Amount</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={formData.WhtAmount}
//                     onChange={(e) => onChangeForm("WhtAmount", e.target.value)}
//                     disabled={isDisabled || loading}
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Net Amount</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={formData.NetAmount}
//                     readOnly
//                     className="readonly"
//                   />
//                 </div>
                
//                 <div className="form-group full-width">
//                   <label>Narration</label>
//                   <textarea
//                     value={formData.narration || ""}
//                     onChange={(e) => onChangeForm("narration", e.target.value)}
//                     disabled={isDisabled || loading}
//                     rows={3}
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Manual Reference No.</label>
//                   <input
//                     type="text"
//                     value={formData.manualRefNo || ""}
//                     onChange={(e) => onChangeForm("manualRefNo", e.target.value)}
//                     disabled={isDisabled || loading}
//                   />
//                 </div>
//               </div>
//             </div>
            
//             {/* Cheque Details Section */}
//             {(formData.vtype === "ACH" || formData.vtype === "BPV") && (
//               <div className="form-section">
//                 <div className="section-header">
//                   <h3 className="section-title">Cheque Details</h3>
//                   {!isDisabled && (
//                     <button className="add-btn" onClick={onAddChequeDetail} disabled={loading}>
//                       <Plus size={16} />
//                       Add Cheque
//                     </button>
//                   )}
//                 </div>
                
//                 {chequeDetails.length === 0 ? (
//                   <div className="empty-cheque-details">
//                     <CreditCard size={24} />
//                     <p>No cheque details added</p>
//                   </div>
//                 ) : (
//                   <div className="cheque-details-table">
//                     <div className="cheque-details-header">
//                       <div>Cheque No</div>
//                       <div>Cheque Date</div>
//                       <div>Amount</div>
//                       <div>Bank</div>
//                       <div>Status</div>
//                       {!isDisabled && <div>Action</div>}
//                     </div>
                    
//                     <div className="cheque-details-body">
//                       {chequeDetails.map((detail, index) => (
//                         <div key={index} className="cheque-detail-row">
//                           {isDisabled ? (
//                             <div className="view-field">{detail.chequeNo}</div>
//                           ) : (
//                             <input
//                               type="text"
//                               value={detail.chequeNo}
//                               onChange={(e) => onChangeChequeDetail(index, "chequeNo", e.target.value)}
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="view-field">{formatDate(detail.chequeDate)}</div>
//                           ) : (
//                             <input
//                               type="date"
//                               value={detail.chequeDate}
//                               onChange={(e) => onChangeChequeDetail(index, "chequeDate", e.target.value)}
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="view-field">${formatAmount(detail.chequeAmount)}</div>
//                           ) : (
//                             <input
//                               type="number"
//                               step="0.01"
//                               value={detail.chequeAmount}
//                               onChange={(e) => onChangeChequeDetail(index, "chequeAmount", e.target.value)}
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="view-field">{detail.chequeBank}</div>
//                           ) : (
//                             <input
//                               type="text"
//                               value={detail.chequeBank}
//                               onChange={(e) => onChangeChequeDetail(index, "chequeBank", e.target.value)}
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="view-field">
//                               {getChequeStatusBadge(detail.chequeStatus)}
//                             </div>
//                           ) : (
//                             <select
//                               value={detail.chequeStatus}
//                               onChange={(e) => onChangeChequeDetail(index, "chequeStatus", e.target.value)}
//                               disabled={loading}
//                             >
//                               <option value="1">Pending</option>
//                               <option value="2">Issued</option>
//                               <option value="3">Cleared</option>
//                               <option value="4">Cancelled</option>
//                             </select>
//                           )}
                          
//                           {!isDisabled && (
//                             <button
//                               className="remove-btn"
//                               onClick={() => onRemoveChequeDetail(index)}
//                               disabled={loading || chequeDetails.length <= 1}
//                             >
//                               <Trash2 size={16} />
//                             </button>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
          
//           {/* Footer */}
//           <div className="popup-footer">
//             <div className="footer-info">
//               <span>
//                 {formData.vtype && `Type: ${getVoucherTypeName(formData.vtype)}`}
//                 {formData.suppliername && ` • Supplier: ${formData.suppliername}`}
//                 {formData.Amount && ` • Amount: $${formatAmount(formData.Amount)}`}
//               </span>
//             </div>
            
//             <div className="footer-actions">
//               <button className="secondary-btn" onClick={onClose} disabled={loading}>
//                 {isViewMode ? "Close" : "Cancel"}
//               </button>
              
//               {!isViewMode && !isPosted && !isCancelled && (
//                 <button className="primary-btn" onClick={onSave} disabled={loading}>
//                   {loading ? (
//                     <>
//                       <Loader2 className="spin" size={16} />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save size={16} />
//                       {mode === "new" ? "Create Payable" : "Update Payable"}
//                     </>
//                   )}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// // Payable Aging Report Modal Component
// const PayableAgingReportModal = ({ isOpen, onClose, agingData, loading, onRefresh, onDateChange }) => {
//   if (!isOpen) return null;
  
//   const { supplierSummary, agingSummary, asOfDate, totalSuppliers, totalInvoices } = agingData;
  
//   return (
//     <>
//       <div className="modal-backdrop" onClick={onClose}></div>
//       <div className="modal-container">
//         <div className="modal-content wide">
//           <div className="modal-header">
//             <div className="modal-title">
//               <CalendarDays size={20} />
//               <div>
//                 <h2>Payables Aging Report</h2>
//                 <p className="modal-subtitle">As of {formatDate(asOfDate)}</p>
//               </div>
//             </div>
//             <button className="modal-close" onClick={onClose}>
//               <X size={24} />
//             </button>
//           </div>
          
//           <div className="modal-body">
//             <div className="report-controls">
//               <div className="date-control">
//                 <label>As of Date:</label>
//                 <input
//                   type="date"
//                   value={asOfDate}
//                   onChange={(e) => onDateChange(e.target.value)}
//                 />
//                 <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
//                   <RefreshCw size={16} className={loading ? "spin" : ""} />
//                   Refresh
//                 </button>
//               </div>
              
//               <div className="export-controls">
//                 <button className="export-btn">
//                   <Printer size={16} />
//                   Print
//                 </button>
//                 <button className="export-btn">
//                   <FileSpreadsheet size={16} />
//                   Export Excel
//                 </button>
//               </div>
//             </div>
            
//             {/* Summary Cards */}
//             <div className="aging-summary-cards">
//               <div className="summary-card">
//                 <div className="card-header">Current (0-30 Days)</div>
//                 <div className="card-value">${formatAmount(agingSummary.current)}</div>
//                 <div className="card-percentage">
//                   {((agingSummary.current / agingSummary.total) * 100 || 0).toFixed(1)}%
//                 </div>
//               </div>
              
//               <div className="summary-card">
//                 <div className="card-header">31-60 Days</div>
//                 <div className="card-value">${formatAmount(agingSummary.days31_60)}</div>
//                 <div className="card-percentage">
//                   {((agingSummary.days31_60 / agingSummary.total) * 100 || 0).toFixed(1)}%
//                 </div>
//               </div>
              
//               <div className="summary-card">
//                 <div className="card-header">61-90 Days</div>
//                 <div className="card-value">${formatAmount(agingSummary.days61_90)}</div>
//                 <div className="card-percentage">
//                   {((agingSummary.days61_90 / agingSummary.total) * 100 || 0).toFixed(1)}%
//                 </div>
//               </div>
              
//               <div className="summary-card">
//                 <div className="card-header">Over 90 Days</div>
//                 <div className="card-value">${formatAmount(agingSummary.over90)}</div>
//                 <div className="card-percentage">
//                   {((agingSummary.over90 / agingSummary.total) * 100 || 0).toFixed(1)}%
//                 </div>
//               </div>
              
//               <div className="summary-card total">
//                 <div className="card-header">Total Payables</div>
//                 <div className="card-value">${formatAmount(agingSummary.total)}</div>
//                 <div className="card-info">{totalSuppliers} Suppliers, {totalInvoices} Invoices</div>
//               </div>
//             </div>
            
//             {/* Supplier Aging Table */}
//             <div className="aging-table-container">
//               <h3 className="table-title">Supplier Aging Summary</h3>
//               <div className="aging-table">
//                 <div className="table-header">
//                   <div className="table-cell">Supplier</div>
//                   <div className="table-cell">Current</div>
//                   <div className="table-cell">31-60 Days</div>
//                   <div className="table-cell">61-90 Days</div>
//                   <div className="table-cell">Over 90 Days</div>
//                   <div className="table-cell">Total</div>
//                 </div>
                
//                 <div className="table-body">
//                   {supplierSummary.map((supplier, index) => (
//                     <div key={index} className="table-row">
//                       <div className="table-cell">
//                         <div className="customer-name">{supplier.suppliername}</div>
//                       </div>
//                       <div className="table-cell">${formatAmount(supplier.current)}</div>
//                       <div className="table-cell">${formatAmount(supplier.days31_60)}</div>
//                       <div className="table-cell">${formatAmount(supplier.days61_90)}</div>
//                       <div className="table-cell">${formatAmount(supplier.over90)}</div>
//                       <div className="table-cell">
//                         <strong>${formatAmount(supplier.total)}</strong>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <div className="modal-footer">
//             <button className="secondary-btn" onClick={onClose}>
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// // Add these helper functions at the end of the PayablesScreen.jsx file, before the export

// // Format date helper
// const formatDate = (dateString) => {
//   if (!dateString) return "";
//   try {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return dateString; // Return original if invalid
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric"
//     });
//   } catch {
//     return dateString;
//   }
// };

// // Format amount helper
// const formatAmount = (amount) => {
//   const num = parseFloat(amount) || 0;
//   return num.toLocaleString("en-US", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   });
// };

// // Get cheque status badge helper
// const getChequeStatusBadge = (status) => {
//   const statusMap = {
//     "1": { label: "Pending", className: "pending" },
//     "2": { label: "Issued", className: "issued" },
//     "3": { label: "Cleared", className: "cleared" },
//     "4": { label: "Cancelled", className: "cancelled" }
//   };
  
//   const statusInfo = statusMap[status] || { label: "Unknown", className: "unknown" };
//   return <span className={`cheque-status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
// };

// // Get voucher type name helper
// const getVoucherTypeName = (type) => {
//   const typeMap = {
//     "BPV": "Bank Payment Voucher",
//     "CPV": "Cash Payment Voucher",
//     "APV": "Advance Payment Voucher",
//     "ACH": "Account Payable Cheque"
//   };
//   return typeMap[type] || type;
// };

// export default PayablesScreen;