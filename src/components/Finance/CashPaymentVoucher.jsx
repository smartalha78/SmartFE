// import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
// import axios from "axios";
// import { AuthContext } from "../../AuthContext";
// import Pagination from "../Common/Pagination";
// import { 
//   Search, Plus, Edit, Trash2, Save, X, FileText, DollarSign, 
//   Calendar, Building, Receipt, Package, Filter, CheckCircle, 
//   AlertCircle, Loader2, RefreshCw, Eye, ChevronDown, Download,
//   Send, Lock, Unlock, Tag, Clock, CheckSquare, Square, MoreVertical,
//   Ban, RotateCcw
// } from "lucide-react";
// import "./CashPaymentVoucher.css";

// const CashPaymentVoucher = () => {
//   const { credentials, menu } = useContext(AuthContext);
//   const currentOffcode = credentials?.company?.offcode || "0101";
  
//   // State management
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(5);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [voucherTypeFilter, setVoucherTypeFilter] = useState("all");
//   const [showPopup, setShowPopup] = useState(false);
//   const [popupMode, setPopupMode] = useState("new");
//   const [selectedVoucher, setSelectedVoucher] = useState(null);
//   const [notification, setNotification] = useState({ type: "", message: "" });
  
//   // Status control state for each voucher
//   const [voucherStatusData, setVoucherStatusData] = useState({});
//   const [statusLoading, setStatusLoading] = useState({});
  
//   // Data states
//   const [vouchers, setVouchers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [totalItems, setTotalItems] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
  
//   // Form states for popup
//   const [formData, setFormData] = useState(getInitialVoucherData());
//   const [details, setDetails] = useState([getInitialDetail()]);
//   const [accounts, setAccounts] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [voucherTypes] = useState([
//     { code: "CPV", name: "Cash Payment Voucher" },
//     { code: "CRV", name: "Cash Receipt Voucher" },
//     { code: "BPV", name: "Bank Payment Voucher" },
//     { code: "BRV", name: "Bank Receipt Voucher" },
//     { code: "JV", name: "Journal Voucher" },
//     { code: "JVM", name: "Journal Voucher Manual" }
//   ]);

//   // Get screen ID from menu data
//   const getScreenMenuId = () => {
//     const screenTitle = "Cash Payment Voucher";
//     const screenMenu = menu?.find(item => 
//       item.title === screenTitle || item.url === "frmVoucher"
//     );
//     return screenMenu?.id || "0202000001"; // Default fallback
//   };

//   // Get screen ID from AuthContext menu
//   const screenMenuId = getScreenMenuId();

//   // API Configuration
//   const API_CONFIG = {
//     BASE_URL: "http://192.168.100.113:8081",
//     GET_TABLE_DATA: "http://192.168.100.113:8081/api/get-table-data",
//     INSERT_HEAD_DET: "http://192.168.100.113:8081/api/insert-VoucherHeadDet",
//     UPDATE_VOUCHER: "http://192.168.100.113:8081/api/update-Vouchertable-data",
//     DELETE_TABLE_DATA: "http://192.168.100.113:8081/api/delete-table-data",
//     LOAD_STATUS: "http://192.168.100.113:8081/api/load-status-controls",
//     POST_METHOD: "http://192.168.100.113:8081/api/Post-Method"
//   };

//   // Initial state functions
//   function getInitialVoucherData() {
//     return {
//       vockey: "",
//       vno: "",
//       vdate: new Date().toISOString().split("T")[0],
//       vtype: "CPV",
//       Amount: "0.00",
//       posted: "false",
//       currencyrate: "1",
//       compcode: "01",
//       offcode: currentOffcode,
//       createdby: credentials?.username || "",
//       createdate: new Date().toISOString().split("T")[0],
//       editby: credentials?.username || "",
//       editdate: new Date().toISOString().split("T")[0],
//       Code: "",
//       uid: credentials?.uid || "2",
//       status: "1",
//       YCode: "9",
//       pk: "",
//       AmountE: "0.00",
//       ProjectCode: "",
//       bcode: "",
//       ManualRefNo: "",
//       acBalHeadAmount: "0.00",
//       TotalAmt: "0",
//       ReceivedAmt: "0",
//       FCAmount: "0.00",
//       TotalCostExpence: "0",
//       TotalCostDuty: "0",
//       TotalCostAdvanceTax: "0",
//       TotalCostIncomeTax: "0"
//     };
//   }

//   function getInitialDetail() {
//     return {
//       vockey: "",
//       code: "",
//       name: "",
//       narration: "",
//       chequeno: "",
//       debit: "0.00",
//       credit: "0.00",
//       vtype: "CPV",
//       EntryType: "D",
//       amount: "0.00",
//       IsActive: "false",
//       offcode: currentOffcode,
//       woVno: "",
//       acBalDetAmount: "0.00",
//       FCdebit: "0.00",
//       FCcredit: "0.00",
//       acBalDetFCAmount: "0.00",
//       FCAmount: "0.00",
//       pk: ""
//     };
//   }

//   // Load all data on component mount and when filters change
//   useEffect(() => {
//     loadAllData();
//   }, [currentPage, itemsPerPage, searchTerm, statusFilter, voucherTypeFilter]);

//   // Load status for a specific voucher
//   const loadVoucherStatus = async (voucher) => {
//     const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
//     setStatusLoading(prev => ({ ...prev, [voucherKey]: true }));
    
//     try {
//       // Determine current status ID based on voucher posted status
//       let currentStatusId = "1"; // Default to Unposted
//       if (voucher.posted === "true") {
//         currentStatusId = "2"; // Posted
//       } else if (voucher.status === "3" || voucher.cancelled === "true") {
//         currentStatusId = "3"; // Cancel
//       }

//       const response = await axios.post(API_CONFIG.LOAD_STATUS, {
//         screenName: "Cash Payment Voucher",
//         createdby: credentials?.username || "administrator",
//         offcode: voucher.offcode || currentOffcode,
//         cStatusid: currentStatusId
//       });

//       if (response.data.success) {
//         // Parse XML response to get next status options
//         const soapResult = response.data.response?.CMB_LoadStatusControlsResult;
//         let nextStatusOptions = [];
        
//         if (soapResult && typeof soapResult === 'string') {
//           try {
//             const parser = new DOMParser();
//             const xmlDoc = parser.parseFromString(soapResult, "text/xml");
//             const tables = xmlDoc.getElementsByTagName("Table");
            
//             for (let i = 0; i < tables.length; i++) {
//               const ccode = tables[i].getElementsByTagName("ccode")[0]?.textContent;
//               const cname = tables[i].getElementsByTagName("cname")[0]?.textContent;
//               if (ccode && cname) {
//                 nextStatusOptions.push({
//                   code: ccode,
//                   name: cname
//                 });
//               }
//             }
//           } catch (parseError) {
//             console.error("Error parsing XML:", parseError);
//           }
//         }

//         setVoucherStatusData(prev => ({
//           ...prev,
//           [voucherKey]: {
//             currentStatus: response.data.status,
//             currentStatusId: currentStatusId,
//             nextStatusOptions: nextStatusOptions,
//             menuId: response.data.sentArgs.cMenuid
//           }
//         }));
//       }
//     } catch (err) {
//       console.error(`Failed to load status for voucher ${voucher.vno}:`, err);
//     } finally {
//       setStatusLoading(prev => ({ ...prev, [voucherKey]: false }));
//     }
//   };

//   // Load status for all vouchers
//   const loadStatusForAllVouchers = async (vouchersList) => {
//     const statusPromises = vouchersList.map(voucher => loadVoucherStatus(voucher));
//     await Promise.allSettled(statusPromises);
//   };

//   const loadAllData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       // Build filters for voucher head
//       const headFilters = {
//         page: currentPage,
//         limit: itemsPerPage,
//         usePagination: true
//       };

//       if (searchTerm) {
//         headFilters.search = searchTerm;
//         headFilters.searchFields = ["vno", "vtype", "ManualRefNo", "createdby"];
//       }

//       if (statusFilter !== "all") {
//         headFilters.filters = headFilters.filters || {};
//         if (statusFilter === "posted") {
//           headFilters.filters.posted = "true";
//         } else if (statusFilter === "draft") {
//           headFilters.filters.posted = "false";
//         } else if (statusFilter === "cancel") {
//           headFilters.filters.cancelled = "true";
//         }
//       }

//       if (voucherTypeFilter !== "all") {
//         headFilters.filters = headFilters.filters || {};
//         headFilters.filters.vtype = voucherTypeFilter;
//       }

//       // Always filter by offcode
//       headFilters.filters = headFilters.filters || {};
//       headFilters.filters.offcode = currentOffcode;

//       // Fetch vouchers with pagination
//       const vouchersResponse = await axios.post(API_CONFIG.GET_TABLE_DATA, {
//         tableName: "acglhead",
//         ...headFilters
//       });

//       if (vouchersResponse.data.success) {
//         const vouchersList = vouchersResponse.data.rows || [];
//         setVouchers(vouchersList);
//         setTotalItems(vouchersResponse.data.totalCount || 0);
//         setTotalPages(vouchersResponse.data.totalPages || 1);
        
//         // Load status for all fetched vouchers
//         loadStatusForAllVouchers(vouchersList);
//       }

//       // Load accounts from chart of accounts (assuming table name)
//       const accountsResponse = await axios.post(API_CONFIG.GET_TABLE_DATA, {
//         tableName: "acgldet",
//         limit: 1000,
//         fields: ["Code", "Name"]
//       });

//       if (accountsResponse.data.success) {
//         const accountList = accountsResponse.data.rows.map(row => ({
//           code: row.Code || row.code,
//           name: row.Name || row.name
//         }));
//         setAccounts(accountList);
//       }

//       // Extract branches and projects from existing vouchers
//       const uniqueBranches = new Set();
//       const uniqueProjects = new Map();
      
//       if (vouchersResponse.data.success) {
//         vouchersResponse.data.rows.forEach(voucher => {
//           if (voucher.offcode) uniqueBranches.add(voucher.offcode);
//           if (voucher.ProjectCode) {
//             uniqueProjects.set(voucher.ProjectCode, `Project ${voucher.ProjectCode}`);
//           }
//         });
//       }

//       setBranches(Array.from(uniqueBranches).map(code => ({
//         code: code,
//         name: `Branch ${code}`
//       })));

//       setProjects(Array.from(uniqueProjects.entries()).map(([code, name]) => ({
//         code: code,
//         name: name
//       })));

//     } catch (err) {
//       console.error("Error loading data:", err);
//       setError("Failed to load data from server");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Generate next voucher number
//   const generateNextVoucherNo = useCallback(async (offcode = currentOffcode, vtype = "CPV") => {
//     try {
//       const response = await axios.post(API_CONFIG.GET_TABLE_DATA, {
//         tableName: "acglhead",
//         filters: { offcode, vtype },
//         fields: ["vno"]
//       });

//       let nextNumber = 1;
//       if (response.data.success && response.data.rows.length > 0) {
//         const voucherNos = response.data.rows.map(v => {
//           const match = v.vno?.match(/^(\d+)\//);
//           return match ? parseInt(match[1]) : 0;
//         }).filter(n => !isNaN(n));
        
//         if (voucherNos.length > 0) {
//           const maxNo = Math.max(...voucherNos);
//           nextNumber = maxNo + 1;
//         }
//       }

//       const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
//       const year = new Date().getFullYear().toString().slice(-2);
//       const vno = `${nextNumber.toString().padStart(5, '0')}/${month}${year}`;
//       const bcode = `${offcode}01`;
//       const vockey = `${bcode}${vno}`;

//       return { vno, vockey, bcode };
//     } catch (error) {
//       console.error("Error generating voucher number:", error);
//       const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
//       const year = new Date().getFullYear().toString().slice(-2);
//       const vno = `00001/${month}${year}`;
//       const bcode = `${offcode}01`;
//       const vockey = `${bcode}${vno}`;
//       return { vno, vockey, bcode };
//     }
//   }, [currentOffcode, API_CONFIG.GET_TABLE_DATA]);

//   // Handle search
//   const [searchTimeout, setSearchTimeout] = useState(null);
//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     setSearchTerm(value);
    
//     if (searchTimeout) {
//       clearTimeout(searchTimeout);
//     }
    
//     const timeout = setTimeout(() => {
//       setCurrentPage(1);
//     }, 500);
    
//     setSearchTimeout(timeout);
//   };

//   // Handle page change
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Handle new voucher
//   const handleNewVoucher = async () => {
//     const { vno, vockey, bcode } = await generateNextVoucherNo(currentOffcode, "CPV");
    
//     const initialData = getInitialVoucherData();
//     initialData.vno = vno;
//     initialData.vockey = vockey;
//     initialData.bcode = bcode;
    
//     const initialDetail = getInitialDetail();
//     initialDetail.vockey = vockey;
    
//     setFormData(initialData);
//     setDetails([initialDetail]);
//     setPopupMode("new");
//     setSelectedVoucher(null);
//     setShowPopup(true);
//   };

//   // Handle edit voucher
//   const handleEditVoucher = async (voucher) => {
//     // Don't allow editing if posted or cancelled
//     if (voucher.posted === "true" || voucher.cancelled === "true") {
//       setNotification({
//         type: "error",
//         message: `Cannot edit ${voucher.posted === "true" ? "posted" : "cancelled"} voucher`
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       console.log("Loading details for voucher:", voucher.vockey);

//       // Build payload with both vockey and vtype filters
//       const payload = {
//         tableName: "acgldet",
//         where: `vockey = '${voucher.vockey}' AND vtype = '${voucher.vtype}' AND offcode = '${voucher.offcode}'`,
//         limit: 100
//       };

//       console.log("➡️ FRONTEND → BACKEND PAYLOAD:", payload);

//       // Fetch data from backend
//       const detailsResponse = await axios.post(
//         API_CONFIG.GET_TABLE_DATA,
//         payload
//       );

//       console.log("DETAILS RESPONSE:", detailsResponse.data);

//       if (!detailsResponse.data?.success) {
//         throw new Error("Failed to load voucher details");
//       }

//       const rows = detailsResponse.data.rows || [];

//       // Format details
//       const voucherDetails = rows.map(detail => ({
//         ...detail,
//         debit: parseFloat(detail.debit || 0).toFixed(2),
//         credit: parseFloat(detail.credit || 0).toFixed(2),
//         amount: parseFloat(detail.amount || 0).toFixed(2),
//         FCdebit: parseFloat(detail.FCdebit || 0).toFixed(2),
//         FCcredit: parseFloat(detail.FCcredit || 0).toFixed(2),
//         FCAmount: parseFloat(detail.FCAmount || 0).toFixed(2),
//         pk: detail.pk || ""
//       }));

//       console.log(
//         "Found",
//         voucherDetails.length,
//         "details for vockey",
//         voucher.vockey,
//         "with vtype",
//         voucher.vtype
//       );

//       // Set voucher header data
//       setFormData({
//         ...voucher,
//         vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         createdate: voucher.createdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         editdate: voucher.editdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         postedDate: voucher.postedDate ? voucher.postedDate.split("T")[0] : "",
//         Amount: parseFloat(voucher.Amount || 0).toFixed(2)
//       });

//       // Set details
//       setDetails(voucherDetails.length > 0 ? voucherDetails : [getInitialDetail()]);

//       setSelectedVoucher(voucher);
//       setPopupMode("edit");
//       setShowPopup(true);

//       setNotification({
//         type: "success",
//         message: `Loaded ${voucherDetails.length} entries for voucher ${voucher.vno} (${voucher.vtype})`
//       });

//     } catch (error) {
//       console.error("Edit voucher failed:", error);

//       // Fallback to empty form
//       setFormData({
//         ...getInitialVoucherData(),
//         ...voucher,
//         vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         Amount: parseFloat(voucher.Amount || 0).toFixed(2)
//       });

//       setDetails([getInitialDetail()]);
//       setSelectedVoucher(voucher);
//       setPopupMode("edit");
//       setShowPopup(true);

//       setNotification({
//         type: "info",
//         message: `No existing details found for voucher ${voucher.vno} (${voucher.vtype}). Creating new entry.`
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle view voucher (read-only for posted/cancelled vouchers)
//   const handleViewVoucher = async (voucher) => {
//     setLoading(true);

//     try {
//       console.log("Viewing details for voucher:", voucher.vockey);

//       // Build payload with both vockey and vtype filters
//       const payload = {
//         tableName: "acgldet",
//         where: `vockey = '${voucher.vockey}' AND vtype = '${voucher.vtype}' AND offcode = '${voucher.offcode}'`,
//         limit: 100
//       };

//       console.log("➡️ FRONTEND → BACKEND PAYLOAD:", payload);

//       // Fetch data from backend
//       const detailsResponse = await axios.post(
//         API_CONFIG.GET_TABLE_DATA,
//         payload
//       );

//       console.log("DETAILS RESPONSE:", detailsResponse.data);

//       const rows = detailsResponse.data.rows || [];

//       // Format details
//       const voucherDetails = rows.map(detail => ({
//         ...detail,
//         debit: parseFloat(detail.debit || 0).toFixed(2),
//         credit: parseFloat(detail.credit || 0).toFixed(2),
//         amount: parseFloat(detail.amount || 0).toFixed(2),
//         FCdebit: parseFloat(detail.FCdebit || 0).toFixed(2),
//         FCcredit: parseFloat(detail.FCcredit || 0).toFixed(2),
//         FCAmount: parseFloat(detail.FCAmount || 0).toFixed(2),
//         pk: detail.pk || ""
//       }));

//       console.log(
//         "Found",
//         voucherDetails.length,
//         "details for vockey",
//         voucher.vockey,
//         "with vtype",
//         voucher.vtype
//       );

//       // Set voucher header data
//       setFormData({
//         ...voucher,
//         vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         createdate: voucher.createdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         editdate: voucher.editdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         postedDate: voucher.postedDate ? voucher.postedDate.split("T")[0] : "",
//         Amount: parseFloat(voucher.Amount || 0).toFixed(2)
//       });

//       // Set details
//       setDetails(voucherDetails.length > 0 ? voucherDetails : [getInitialDetail()]);

//       setSelectedVoucher(voucher);
//       setPopupMode("view"); // Set to view mode
//       setShowPopup(true);

//       setNotification({
//         type: "success",
//         message: `Viewing ${voucherDetails.length} entries for voucher ${voucher.vno}`
//       });

//     } catch (error) {
//       console.error("View voucher failed:", error);

//       // Fallback to basic view
//       setFormData({
//         ...getInitialVoucherData(),
//         ...voucher,
//         vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         Amount: parseFloat(voucher.Amount || 0).toFixed(2)
//       });

//       setDetails([getInitialDetail()]);
//       setSelectedVoucher(voucher);
//       setPopupMode("view");
//       setShowPopup(true);

//       setNotification({
//         type: "info",
//         message: `Viewing basic information for voucher ${voucher.vno}`
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle close popup
//   const handleClosePopup = () => {
//     setShowPopup(false);
//     setSelectedVoucher(null);
//     setPopupMode("new");
//   };

//   // Handle form field changes in popup
//   const handleFormChange = async (field, value) => {
//     const updatedForm = { ...formData, [field]: value };
    
//     if (field === "offcode") {
//       const { vno, vockey, bcode } = await generateNextVoucherNo(value, updatedForm.vtype);
//       updatedForm.vno = vno;
//       updatedForm.vockey = vockey;
//       updatedForm.bcode = bcode;
      
//       // Update details with new vockey
//       setDetails(prev => prev.map(detail => ({
//         ...detail,
//         vockey: vockey,
//         offcode: value
//       })));
//     }
    
//     if (field === "vtype") {
//       const { vno, vockey, bcode } = await generateNextVoucherNo(updatedForm.offcode, value);
//       updatedForm.vno = vno;
//       updatedForm.vockey = vockey;
//       updatedForm.bcode = bcode;
      
//       // Update details with new vtype and vockey
//       setDetails(prev => prev.map(detail => ({
//         ...detail,
//         vtype: value,
//         vockey: vockey,
//         EntryType: ["CPV", "BPV"].includes(value) ? "D" : 
//                   ["CRV", "BRV"].includes(value) ? "C" : "D"
//       })));
//     }
    
//     setFormData(updatedForm);
//   };

//   // Handle detail row field changes
//   const handleDetailChange = (index, field, value) => {
//     const updated = [...details];
//     const currentVType = formData.vtype;
    
//     if (field === "code") {
//       const selectedAccount = accounts.find(acc => acc.code === value);
//       updated[index].code = value;
//       updated[index].name = selectedAccount ? selectedAccount.name : "";
      
//       // Auto-determine EntryType based on voucher type
//       if (["CPV", "BPV"].includes(currentVType)) {
//         updated[index].EntryType = "D";
//         updated[index].debit = updated[index].debit || "0.00";
//         updated[index].credit = "0.00";
//         updated[index].FCdebit = updated[index].debit;
//         updated[index].FCcredit = "0.00";
//       } else if (["CRV", "BRV"].includes(currentVType)) {
//         updated[index].EntryType = "C";
//         updated[index].credit = updated[index].credit || "0.00";
//         updated[index].debit = "0.00";
//         updated[index].FCcredit = updated[index].credit;
//         updated[index].FCdebit = "0.00";
//       }
//     } else if (field === "debit") {
//       const numValue = parseFloat(value) || 0;
//       updated[index][field] = numValue.toFixed(2);
//       updated[index].amount = numValue.toFixed(2);
//       updated[index].FCAmount = numValue.toFixed(2);
//       updated[index].FCdebit = numValue.toFixed(2);
      
//       // For payment vouchers (CPV, BPV), set credit to 0
//       if (["CPV", "BPV"].includes(currentVType)) {
//         updated[index].credit = "0.00";
//         updated[index].FCcredit = "0.00";
//         updated[index].EntryType = "D";
//       }
//     } else if (field === "credit") {
//       const numValue = parseFloat(value) || 0;
//       updated[index][field] = numValue.toFixed(2);
//       updated[index].amount = numValue.toFixed(2);
//       updated[index].FCAmount = numValue.toFixed(2);
//       updated[index].FCcredit = numValue.toFixed(2);
      
//       // For receipt vouchers (CRV, BRV), set debit to 0
//       if (["CRV", "BRV"].includes(currentVType)) {
//         updated[index].debit = "0.00";
//         updated[index].FCdebit = "0.00";
//         updated[index].EntryType = "C";
//       }
//     } else {
//       updated[index][field] = value;
//     }
    
//     setDetails(updated);
    
//     // Calculate total amount based on voucher type
//     const totalAmount = updated.reduce((sum, row) => {
//       if (["CPV", "BPV", "JV", "JVM"].includes(currentVType)) {
//         return sum + (parseFloat(row.debit) || 0);
//       } else if (["CRV", "BRV"].includes(currentVType)) {
//         return sum + (parseFloat(row.credit) || 0);
//       }
//       return sum;
//     }, 0);
    
//     setFormData(prev => ({
//       ...prev,
//       Amount: totalAmount.toFixed(2),
//       FCAmount: totalAmount.toFixed(2)
//     }));
//   };

//   // Add detail row
//   const handleAddDetail = () => {
//     const newDetail = {
//       ...getInitialDetail(),
//       vockey: formData.vockey,
//       vtype: formData.vtype,
//       offcode: formData.offcode
//     };
    
//     // Set default EntryType based on voucher type
//     if (["CPV", "BPV"].includes(formData.vtype)) {
//       newDetail.EntryType = "D";
//       newDetail.debit = "0.00";
//       newDetail.FCdebit = "0.00";
//     } else if (["CRV", "BRV"].includes(formData.vtype)) {
//       newDetail.EntryType = "C";
//       newDetail.credit = "0.00";
//       newDetail.FCcredit = "0.00";
//     }
    
//     setDetails(prev => [...prev, newDetail]);
//   };

//   // Remove detail row
//   const handleRemoveDetail = (index) => {
//     if (details.length > 1) {
//       const updated = details.filter((_, i) => i !== index);
//       setDetails(updated);
      
//       // Recalculate total
//       const totalAmount = updated.reduce((sum, row) => {
//         if (["CPV", "BPV", "JV", "JVM"].includes(formData.vtype)) {
//           return sum + (parseFloat(row.debit) || 0);
//         } else if (["CRV", "BRV"].includes(formData.vtype)) {
//           return sum + (parseFloat(row.credit) || 0);
//         }
//         return sum;
//       }, 0);
      
//       setFormData(prev => ({
//         ...prev,
//         Amount: totalAmount.toFixed(2),
//         FCAmount: totalAmount.toFixed(2)
//       }));
//     }
//   };

//   // Calculate totals for display only
//   const calculateTotals = () => {
//     const totalDebit = details.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
//     const totalCredit = details.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
//     return { totalDebit, totalCredit };
//   };

//   // Validate basic form
//   const validateVoucher = () => {
//     const { totalDebit, totalCredit } = calculateTotals();
    
//     if (!formData.offcode) return "Please select a branch";
//     if (!formData.vdate) return "Please select a date";
//     if (details.some(row => !row.code)) return "Please select account for all rows";
    
//     // Basic validation based on voucher type
//     const vtype = formData.vtype;
    
//     if (["CPV", "BPV"].includes(vtype)) {
//       if (totalDebit <= 0) return `${vtype} must have at least one debit entry`;
//     } else if (["CRV", "BRV"].includes(vtype)) {
//       if (totalCredit <= 0) return `${vtype} must have at least one credit entry`;
//     }
    
//     return null;
//   };

//   // Save voucher
//   const handleSaveVoucher = async () => {
//     const validationError = validateVoucher();
//     if (validationError) {
//       setNotification({
//         type: "error",
//         message: validationError
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       // Prepare data according to backend format
//       const headData = {
//         ...formData,
//         Amount: parseFloat(formData.Amount).toFixed(2),
//         createdate: new Date().toISOString().split('T')[0],
//         editdate: new Date().toISOString().split('T')[0],
//         vdate: formData.vdate,
//         YCode: formData.YCode || "9"
//       };

//       // Prepare details data
//       const detailsData = details.map(row => ({
//         ...row,
//         vockey: formData.vockey,
//         offcode: formData.offcode,
//         vtype: formData.vtype,
//         debit: parseFloat(row.debit || 0).toFixed(2),
//         credit: parseFloat(row.credit || 0).toFixed(2),
//         amount: parseFloat(row.amount || 0).toFixed(2),
//         FCdebit: parseFloat(row.FCdebit || 0).toFixed(2),
//         FCcredit: parseFloat(row.FCcredit || 0).toFixed(2),
//         FCAmount: parseFloat(row.FCAmount || 0).toFixed(2),
//         acBalDetAmount: "0.00",
//         acBalDetFCAmount: "0.00",
//         IsActive: "false"
//       }));

//       if (popupMode === "new") {
//         // Insert new voucher
//         const payload = {
//           head: {
//             tableName: "acGLhead",
//             data: headData
//           },
//           details: detailsData.map((row) => ({
//             tableName: "acGLdet",
//             data: row
//           })),
//           selectedBranch: headData.bcode
//         };

//         console.log("Insert payload:", JSON.stringify(payload, null, 2));
        
//         const response = await axios.post(API_CONFIG.INSERT_HEAD_DET, payload);
        
//         if (response.data.success) {
//           setNotification({
//             type: "success",
//             message: `Voucher ${formData.vno} created successfully!`
//           });
//           handleClosePopup();
//           await loadAllData();
//         } else {
//           throw new Error(response.data.error || "Failed to save voucher");
//         }
//       } else {
//         // Update existing voucher
//         const payload = {
//           head: {
//             tableName: "acGLhead",
//             data: headData,
//             where: {
//               vockey: formData.vockey,
//               vtype: formData.vtype,
//               offcode: formData.offcode
//             }
//           },
//           details: detailsData.map(row => ({
//             tableName: "acGLdet",
//             data: row,
//             where: {
//               vockey: row.vockey,
//               vtype: row.vtype,
//               offcode: row.offcode
//             }
//           }))
//         };

//         console.log("Update payload:", JSON.stringify(payload, null, 2));
        
//         const response = await axios.post(API_CONFIG.UPDATE_VOUCHER, payload);
        
//         if (response.data.success) {
//           setNotification({
//             type: "success",
//             message: `Voucher ${formData.vno} updated successfully!`
//           });
//           handleClosePopup();
//           await loadAllData();
//         } else {
//           throw new Error(response.data.error || "Failed to update voucher");
//         }
//       }
//     } catch (err) {
//       console.error("Save failed:", err);
//       setNotification({
//         type: "error",
//         message: err.response?.data?.error || err.message || "Error saving voucher"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Change voucher status (Post/Unpost/Cancel)
//   const handleChangeVoucherStatus = async (voucher, newStatusCode) => {
//     const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
//     const statusData = voucherStatusData[voucherKey];
    
//     if (!statusData) {
//       setNotification({
//         type: "error",
//         message: "Status data not loaded. Please refresh the page."
//       });
//       return;
//     }

//     const statusNameMap = {
//       "1": "Unpost",
//       "2": "Post",
//       "3": "Cancel"
//     };
    
//     const action = statusNameMap[newStatusCode] || "change status";
//     const confirmText = `Are you sure you want to ${action.toLowerCase()} voucher ${voucher.vno}?`;
    
//     if (!window.confirm(confirmText)) {
//       return;
//     }

//     setLoading(true);
//     try {
//       const postResponse = await axios.post(API_CONFIG.POST_METHOD, {
//         cMenuid: statusData.menuId || screenMenuId,
//         cTableName: "acGLhead",
//         cvockey: voucher.vockey,
//         cvtype: voucher.vtype,
//         cPostedby: credentials?.username || "administrator",
//         cValue: newStatusCode
//       });

//       if (postResponse.data.success) {
//         setNotification({
//           type: "success",
//           message: `Voucher ${voucher.vno} ${action}ed successfully!`
//         });
        
//         // Reload data and status
//         await loadAllData();
        
//         // Refresh status for this specific voucher
//         await loadVoucherStatus(voucher);
//       } else {
//         throw new Error(postResponse.data.error || `Failed to ${action} voucher`);
//       }
//     } catch (err) {
//       console.error("Status change failed:", err);
//       setNotification({
//         type: "error",
//         message: err.response?.data?.error || err.message || `Error ${action}ing voucher`
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get status display for a voucher
//   const getVoucherStatusDisplay = (voucher) => {
//     const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
//     const statusData = voucherStatusData[voucherKey];
//     const isLoading = statusLoading[voucherKey];
    
//     if (isLoading) {
//       return (
//         <div className="cpv-status-loading">
//           <Loader2 size={12} className="spin" />
//         </div>
//       );
//     }
    
//     if (!statusData) {
//       return (
//         <div className="cpv-status-not-loaded">
//           <AlertCircle size={12} />
//         </div>
//       );
//     }
    
//     const isPosted = voucher.posted === "true";
//     const isCancelled = voucher.cancelled === "true" || voucher.status === "3";
    
//     // Determine current status display
//     let statusDisplay;
//     if (isCancelled) {
//       statusDisplay = (
//         <div className="cpv-status-badge cancelled">
//           <Ban size={12} />
//           <span>Cancelled</span>
//         </div>
//       );
//     } else if (isPosted) {
//       statusDisplay = (
//         <div className="cpv-status-badge posted">
//           <Lock size={12} />
//           <span>Posted</span>
//         </div>
//       );
//     } else {
//       statusDisplay = (
//         <div className="cpv-status-badge draft">
//           <Unlock size={12} />
//           <span>Draft</span>
//         </div>
//       );
//     }
    
//     return (
//       <div className="cpv-status-display">
//         {statusDisplay}
        
//         {/* Status options dropdown */}
//         {statusData.nextStatusOptions && statusData.nextStatusOptions.length > 0 && (
//           <div className="cpv-status-options">
//             <div className="cpv-status-current">
//               Current: {statusData.currentStatus}
//             </div>
//             <div className="cpv-status-dropdown">
//               <button className="cpv-status-dropdown-btn">
//                 <MoreVertical size={14} />
//               </button>
//               <div className="cpv-status-dropdown-content">
//                 {statusData.nextStatusOptions.map((option, index) => (
//                   <button
//                     key={index}
//                     className={`cpv-status-option ${option.code === "3" ? 'cancel' : option.code === "2" ? 'post' : 'unpost'}`}
//                     onClick={() => handleChangeVoucherStatus(voucher, option.code)}
//                     disabled={loading}
//                   >
//                     {option.code === "3" ? <Ban size={14} /> : 
//                      option.code === "2" ? <Lock size={14} /> : 
//                      <Unlock size={14} />}
//                     {option.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
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

//   // Format amount
//   const formatAmount = (amount) => {
//     const num = parseFloat(amount) || 0;
//     return num.toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // Get voucher type name
//   const getVoucherTypeName = (code) => {
//     const type = voucherTypes.find(t => t.code === code);
//     return type ? type.name : code;
//   };

//   // Get voucher type rules for display
//   const getVoucherRules = (vtype) => {
//     const rules = {
//       'CPV': 'Cash Payment Voucher - Only DEBIT entries allowed',
//       'BPV': 'Bank Payment Voucher - Only DEBIT entries allowed',
//       'CRV': 'Cash Receipt Voucher - Only CREDIT entries allowed',
//       'BRV': 'Bank Receipt Voucher - Only CREDIT entries allowed',
//       'JV': 'Journal Voucher - Both debit and credit allowed',
//       'JVM': 'Journal Voucher Manual - Both debit and credit allowed'
//     };
//     return rules[vtype] || '';
//   };

//   return (
//     <div className="cpv-management-container">
//       {/* Notification */}
//       {notification.message && (
//         <div className={`cpv-notification ${notification.type}`}>
//           {notification.type === "success" ? (
//             <CheckCircle size={16} />
//           ) : (
//             <AlertCircle size={16} />
//           )}
//           <span>{notification.message}</span>
//           <button 
//             className="cpv-notification-close"
//             onClick={() => setNotification({ type: "", message: "" })}
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Header */}
//       <div className="cpv-header">
//         <div className="cpv-header-content">
//           <div className="cpv-title-section">
//             <div className="cpv-title-icon">
//               <Receipt size={24} />
//             </div>
//             <div className="cpv-title-text">
//               <h1>Cash Payment Vouchers</h1>
//               <p className="cpv-subtitle">Manage and track all payment vouchers</p>
//             </div>
//           </div>
          
//           <div className="cpv-header-stats">
//             <div className="cpv-stat">
//               <span className="cpv-stat-label">Total Vouchers</span>
//               <span className="cpv-stat-value">{totalItems.toLocaleString()}</span>
//             </div>
//             <div className="cpv-stat">
//               <span className="cpv-stat-label">Showing</span>
//               <span className="cpv-stat-value">{vouchers.length} of {totalItems}</span>
//             </div>
//             <div className="cpv-stat">
//               <span className="cpv-stat-label">Screen ID</span>
//               <span className="cpv-stat-value">{screenMenuId}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Toolbar */}
//       <div className="cpv-toolbar">
//         <div className="cpv-search">
//           <Search size={18} className="cpv-search-icon" />
//           <input
//             type="text"
//             placeholder="Search by voucher no, type, or ref..."
//             value={searchTerm}
//             onChange={handleSearchChange}
//             className="cpv-search-input"
//           />
//         </div>
        
//         <div className="cpv-filters">
//           <select 
//             value={statusFilter} 
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="cpv-filter-select"
//           >
//             <option value="all">All Status</option>
//             <option value="draft">Draft</option>
//             <option value="posted">Posted</option>
//             <option value="cancel">Cancelled</option>
//           </select>
          
//           <select 
//             value={voucherTypeFilter} 
//             onChange={(e) => setVoucherTypeFilter(e.target.value)}
//             className="cpv-filter-select"
//           >
//             <option value="all">All Types</option>
//             {voucherTypes.map(type => (
//               <option key={type.code} value={type.code}>
//                 {type.code} - {type.name}
//               </option>
//             ))}
//           </select>
          
//           <button 
//             className="cpv-refresh-btn"
//             onClick={() => loadAllData()}
//             disabled={loading}
//             title="Refresh data"
//           >
//             <RefreshCw size={18} className={loading ? "spin" : ""} />
//           </button>
//         </div>
        
//         <button 
//           className="cpv-new-btn"
//           onClick={handleNewVoucher}
//           disabled={loading}
//         >
//           <Plus size={20} />
//           New Voucher
//         </button>
//       </div>

//       {/* Vouchers List */}
//       <div className="cpv-list-container">
//         {loading ? (
//           <div className="cpv-loading-full">
//             <Loader2 className="spin" size={32} />
//             <p>Loading vouchers...</p>
//           </div>
//         ) : error ? (
//           <div className="cpv-error">
//             <AlertCircle size={24} />
//             <p>{error}</p>
//             <button onClick={() => loadAllData()} className="cpv-retry-btn">
//               Retry
//             </button>
//           </div>
//         ) : vouchers.length === 0 ? (
//           <div className="cpv-empty">
//             <Receipt size={48} />
//             <p>No vouchers found</p>
//             {searchTerm || statusFilter !== "all" || voucherTypeFilter !== "all" ? (
//               <p className="cpv-empty-subtext">
//                 Try adjusting your search or filter
//               </p>
//             ) : null}
//             <button onClick={handleNewVoucher} className="cpv-empty-btn">
//               <Plus size={16} />
//               Create Your First Voucher
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="cpv-list">
//               <div className="cpv-list-header">
//                 <div className="cpv-list-column">Voucher No</div>
//                 <div className="cpv-list-column">Type</div>
//                 <div className="cpv-list-column">Date</div>
//                 <div className="cpv-list-column">Amount</div>
//                 <div className="cpv-list-column">Branch</div>
//                 <div className="cpv-list-column">Status</div>
//                 <div className="cpv-list-column">Created By</div>
//                 <div className="cpv-list-column">Actions</div>
//               </div>
              
//               <div className="cpv-list-body">
//                 {vouchers.map((voucher) => (
//                   <div key={voucher.vockey} className="cpv-list-item">
//                     <div className="cpv-list-cell">
//                       <div className="cpv-code">{voucher.vno}</div>
//                       <div className="cpv-ref">{voucher.ManualRefNo || "No Ref"}</div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-type">
//                         <FileText size={14} />
//                         <span>{getVoucherTypeName(voucher.vtype)}</span>
//                       </div>
//                       <div className="cpv-type-code">{voucher.vtype}</div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-date">
//                         <Calendar size={14} />
//                         <span>{formatDate(voucher.vdate)}</span>
//                       </div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-amount">
//                         <DollarSign size={14} />
//                         <span>{formatAmount(voucher.Amount)}</span>
//                       </div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-branch">
//                         <Building size={14} />
//                         <span>{voucher.offcode}</span>
//                       </div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       {getVoucherStatusDisplay(voucher)}
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-created-by">{voucher.createdby || "-"}</div>
//                     </div>
                    
//                     <div className="cpv-list-cell">
//                       <div className="cpv-actions">
//                         {/* View Button - Always visible */}
//                         <button
//                           className="cpv-action-btn view"
//                           onClick={() => handleViewVoucher(voucher)}
//                           title="View Voucher"
//                         >
//                           <Eye size={16} />
//                         </button>
                        
//                         {/* Edit Button - Only for draft vouchers */}
//                         {voucher.posted === "false" && voucher.cancelled !== "true" && (
//                           <button
//                             className="cpv-action-btn edit"
//                             onClick={() => handleEditVoucher(voucher)}
//                             title="Edit Voucher"
//                           >
//                             <Edit size={16} />
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
//               <div className="cpv-pagination-wrapper">
//                 <Pagination
//                   currentPage={currentPage}
//                   totalItems={totalItems}
//                   itemsPerPage={itemsPerPage}
//                   onPageChange={handlePageChange}
//                   maxVisiblePages={5}
//                   loading={loading}
//                 />
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Popup Form */}
//       <VoucherPopupForm
//         isOpen={showPopup}
//         onClose={handleClosePopup}
//         mode={popupMode}
//         formData={formData}
//         details={details}
//         accounts={accounts}
//         branches={branches}
//         projects={projects}
//         voucherTypes={voucherTypes}
//         onChangeForm={handleFormChange}
//         onChangeDetail={handleDetailChange}
//         onAddDetail={handleAddDetail}
//         onRemoveDetail={handleRemoveDetail}
//         onSave={handleSaveVoucher}
//         loading={loading}
//         calculateTotals={calculateTotals}
//         getVoucherRules={getVoucherRules}
//       />
//     </div>
//   );
// };

// // Voucher Popup Form Component
// const VoucherPopupForm = ({
//   isOpen,
//   onClose,
//   mode,
//   formData,
//   details,
//   accounts,
//   branches,
//   projects,
//   voucherTypes,
//   onChangeForm,
//   onChangeDetail,
//   onAddDetail,
//   onRemoveDetail,
//   onSave,
//   loading,
//   calculateTotals,
//   getVoucherRules
// }) => {
//   const popupRef = useRef(null);
//   const bodyRef = useRef(null);
  
//   const { totalDebit, totalCredit } = calculateTotals();
//   const voucherRules = getVoucherRules(formData.vtype);
//   const isViewMode = mode === "view";
//   const isPosted = formData.posted === "true";
//   const isCancelled = formData.cancelled === "true" || formData.status === "3";
  
//   // Close on escape key
//   useEffect(() => {
//     const handleEscapeKey = (e) => {
//       if (e.key === "Escape" && isOpen) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("keydown", handleEscapeKey);
//       document.body.style.overflow = "hidden";
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscapeKey);
//       document.body.style.overflow = "auto";
//     };
//   }, [isOpen, onClose]);

//   // Disable credit field for payment vouchers
//   const isCreditDisabled = ["CPV", "BPV"].includes(formData.vtype);
//   // Disable debit field for receipt vouchers
//   const isDebitDisabled = ["CRV", "BRV"].includes(formData.vtype);
//   // Disable all fields in view mode or if posted/cancelled
//   const isDisabled = isViewMode || isPosted || isCancelled;

//   if (!isOpen) return null;

//   return (
//     <>
//       <div className="cpv-popup-backdrop" onClick={onClose}></div>
//       <div className="cpv-popup-container" ref={popupRef}>
//         <div className="cpv-popup-content">
//           {/* Header */}
//           <div className="cpv-popup-header">
//             <div className="cpv-popup-title">
//               <Receipt size={20} />
//               <div className="cpv-popup-title-text">
//                 <h2>
//                   {mode === "new" ? "Create New Voucher" : 
//                    mode === "edit" ? `Edit Voucher: ${formData.vno}` : 
//                    `View Voucher: ${formData.vno}`}
//                 </h2>
//                 <div className="cpv-popup-subtitle">
//                   <span className={`cpv-popup-mode-badge ${mode}`}>
//                     {mode === "new" ? "NEW" : mode === "edit" ? "EDIT" : "VIEW"}
//                   </span>
//                   <span className="cpv-popup-code">Voucher No: {formData.vno}</span>
//                   <span className="cpv-popup-amount">Amount: ${formData.Amount}</span>
//                   {isPosted && (
//                     <span className="cpv-popup-posted-badge">
//                       <Lock size={12} />
//                       Posted
//                     </span>
//                   )}
//                   {isCancelled && (
//                     <span className="cpv-popup-cancelled-badge">
//                       <Ban size={12} />
//                       Cancelled
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <button className="cpv-popup-close" onClick={onClose} title="Close (ESC)">
//               <X size={24} />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="cpv-popup-body" ref={bodyRef}>
//             {/* Voucher Type Rules Banner */}
//             <div className="cpv-rules-banner">
//               <AlertCircle size={16} />
//               <span>{voucherRules}</span>
//               {isViewMode && (
//                 <span className="cpv-view-mode-note">(View Mode - Read Only)</span>
//               )}
//               {(isPosted || isCancelled) && (
//                 <span className="cpv-status-mode-note">
//                   {isPosted ? "Posted voucher cannot be edited" : "Cancelled voucher cannot be edited"}
//                 </span>
//               )}
//             </div>

//             {/* Header Section */}
//             <div className="cpv-form-section">
//               <h3 className="cpv-form-section-title">
//                 <FileText size={16} />
//                 Voucher Information
//               </h3>
              
//               <div className="cpv-form-grid">
//                 <div className="cpv-form-group">
//                   <label>Voucher Type *</label>
//                   <select
//                     value={formData.vtype}
//                     onChange={(e) => onChangeForm("vtype", e.target.value)}
//                     className="cpv-form-select"
//                     disabled={loading || isDisabled || mode === "edit"}
//                   >
//                     {voucherTypes.map(type => (
//                       <option key={type.code} value={type.code}>
//                         {type.code} - {type.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div className="cpv-form-group">
//                   <label>Date *</label>
//                   <div className="cpv-form-input-with-icon">
//                     <Calendar size={16} />
//                     <input
//                       type="date"
//                       value={formData.vdate}
//                       onChange={(e) => onChangeForm("vdate", e.target.value)}
//                       className="cpv-form-input"
//                       disabled={loading || isDisabled}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="cpv-form-group">
//                   <label>Branch *</label>
//                   <select
//                     value={formData.offcode}
//                     onChange={(e) => onChangeForm("offcode", e.target.value)}
//                     className="cpv-form-select"
//                     disabled={loading || isDisabled || mode === "edit"}
//                   >
//                     <option value="">Select Branch</option>
//                     {branches.map(branch => (
//                       <option key={branch.code} value={branch.code}>
//                         {branch.code} - {branch.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div className="cpv-form-group">
//                   <label>Project</label>
//                   <select
//                     value={formData.ProjectCode}
//                     onChange={(e) => onChangeForm("ProjectCode", e.target.value)}
//                     className="cpv-form-select"
//                     disabled={loading || isDisabled}
//                   >
//                     <option value="">Select Project</option>
//                     {projects.map(project => (
//                       <option key={project.code} value={project.code}>
//                         {project.code} - {project.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
                
//                 <div className="cpv-form-group">
//                   <label>Manual Reference No.</label>
//                   <input
//                     type="text"
//                     value={formData.ManualRefNo}
//                     onChange={(e) => onChangeForm("ManualRefNo", e.target.value)}
//                     className="cpv-form-input"
//                     placeholder="Optional reference"
//                     disabled={loading || isDisabled}
//                   />
//                 </div>
                
//                 <div className="cpv-form-group">
//                   <label>Currency Rate</label>
//                   <input
//                     type="number"
//                     step="0.0001"
//                     value={formData.currencyrate}
//                     onChange={(e) => onChangeForm("currencyrate", e.target.value)}
//                     className="cpv-form-input"
//                     disabled={loading || isDisabled}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Details Section */}
//             <div className="cpv-form-section">
//               <div className="cpv-section-header">
//                 <h3 className="cpv-form-section-title">
//                   <DollarSign size={16} />
//                   Voucher Details ({details.length} entries)
//                 </h3>
//                 {!isDisabled && (
//                   <button 
//                     className="cpv-add-btn"
//                     onClick={onAddDetail}
//                     disabled={loading}
//                   >
//                     <Plus size={16} />
//                     Add Entry
//                   </button>
//                 )}
//               </div>
              
//               {details.length === 0 ? (
//                 <div className="cpv-empty-state">
//                   <DollarSign size={32} />
//                   <p>No voucher entries added yet</p>
//                 </div>
//               ) : (
//                 <>
//                   <div className="cpv-details-table">
//                     <div className="cpv-details-header">
//                       <div>Account</div>
//                       <div>Narration</div>
//                       <div>Cheque No.</div>
//                       <div>Debit</div>
//                       <div>Credit</div>
//                       {!isDisabled && <div>Action</div>}
//                     </div>
                    
//                     <div className="cpv-details-body">
//                       {details.map((row, index) => (
//                         <div key={index} className="cpv-detail-row">
//                           {isDisabled ? (
//                             <div className="cpv-view-field">
//                               {row.code} - {row.name || accounts.find(a => a.code === row.code)?.name || 'Unknown'}
//                             </div>
//                           ) : (
//                             <select
//                               value={row.code}
//                               onChange={(e) => onChangeDetail(index, "code", e.target.value)}
//                               className="cpv-form-select account-select"
//                               disabled={loading}
//                             >
//                               <option value="">Select Account</option>
//                               {accounts.map(acc => (
//                                 <option key={acc.code} value={acc.code}>
//                                   {acc.code} - {acc.name}
//                                 </option>
//                               ))}
//                             </select>
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="cpv-view-field">{row.narration || "-"}</div>
//                           ) : (
//                             <input
//                               type="text"
//                               value={row.narration}
//                               onChange={(e) => onChangeDetail(index, "narration", e.target.value)}
//                               className="cpv-form-input"
//                               placeholder="Enter narration"
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="cpv-view-field">{row.chequeno || "-"}</div>
//                           ) : (
//                             <input
//                               type="text"
//                               value={row.chequeno}
//                               onChange={(e) => onChangeDetail(index, "chequeno", e.target.value)}
//                               className="cpv-form-input"
//                               placeholder="Cheque No."
//                               disabled={loading}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="cpv-view-field amount-view">
//                               ${parseFloat(row.debit || 0).toFixed(2)}
//                             </div>
//                           ) : (
//                             <input
//                               type="number"
//                               step="0.01"
//                               value={row.debit}
//                               onChange={(e) => onChangeDetail(index, "debit", e.target.value)}
//                               className={`cpv-form-input ${isDebitDisabled ? 'disabled-field' : ''}`}
//                               placeholder="0.00"
//                               disabled={loading || isDebitDisabled}
//                               title={isDebitDisabled ? "Debit not allowed for this voucher type" : ""}
//                             />
//                           )}
                          
//                           {isDisabled ? (
//                             <div className="cpv-view-field amount-view">
//                               ${parseFloat(row.credit || 0).toFixed(2)}
//                             </div>
//                           ) : (
//                             <input
//                               type="number"
//                               step="0.01"
//                               value={row.credit}
//                               onChange={(e) => onChangeDetail(index, "credit", e.target.value)}
//                               className={`cpv-form-input ${isCreditDisabled ? 'disabled-field' : ''}`}
//                               placeholder="0.00"
//                               disabled={loading || isCreditDisabled}
//                               title={isCreditDisabled ? "Credit not allowed for this voucher type" : ""}
//                             />
//                           )}
                          
//                           {!isDisabled && (
//                             <button
//                               className="cpv-remove-btn"
//                               onClick={() => onRemoveDetail(index)}
//                               disabled={loading || details.length <= 1}
//                               title="Remove Entry"
//                             >
//                               <Trash2 size={16} />
//                             </button>
//                           )}
//                         </div>
//                       ))}
//                     </div>
                    
//                     <div className="cpv-totals-row">
//                       <div></div>
//                       <div></div>
//                       <div className="cpv-total-label">Totals:</div>
//                       <div className="cpv-total-amount">
//                         ${totalDebit.toFixed(2)}
//                       </div>
//                       <div className="cpv-total-amount">
//                         ${totalCredit.toFixed(2)}
//                       </div>
//                       {!isDisabled && <div></div>}
//                     </div>
//                   </div>
                  
//                   <div className="cpv-voucher-info">
//                     <div className="cpv-info-item">
//                       <span>Total Debit:</span>
//                       <strong>${totalDebit.toFixed(2)}</strong>
//                     </div>
//                     <div className="cpv-info-item">
//                       <span>Total Credit:</span>
//                       <strong>${totalCredit.toFixed(2)}</strong>
//                     </div>
//                     <div className="cpv-info-item">
//                       <span>Voucher Amount:</span>
//                       <strong className="cpv-main-amount">${formData.Amount}</strong>
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
            
//             <button 
//               className="cpv-scroll-top-btn"
//               onClick={() => {
//                 if (bodyRef.current) {
//                   bodyRef.current.scrollTop = 0;
//                 }
//               }}
//               title="Scroll to top"
//             >
//               <ChevronDown size={16} />
//             </button>
//           </div>

//           {/* Footer */}
//           <div className="cpv-popup-footer">
//             <div className="cpv-footer-info">
//               <span className="cpv-footer-stats">
//                 {details.length} entries • Type: {formData.vtype} • Branch: {formData.offcode}
//                 {isPosted && " • Posted"}
//                 {isCancelled && " • Cancelled"}
//               </span>
//               <div className="cpv-footer-amount">
//                 Total Amount: <strong>${formData.Amount}</strong>
//               </div>
//             </div>
//             <div className="cpv-footer-actions">
//               <button 
//                 className="cpv-btn-secondary" 
//                 onClick={onClose}
//                 disabled={loading}
//               >
//                 {isViewMode ? "Close" : "Cancel"}
//               </button>
//               {!isViewMode && !isPosted && !isCancelled && (
//                 <button 
//                   className="cpv-btn-primary"
//                   onClick={onSave}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 className="spin" size={16} />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save size={16} />
//                       {mode === "new" ? "Create Voucher" : "Update Voucher"}
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

// export default CashPaymentVoucher;




// CashPaymentVoucher.jsx
import React from 'react';
import VoucherScreen from './GenericVoucherScreen';

const CashPaymentVoucher = () => {
  return (
    <VoucherScreen
      voucherType="CPV"  // This will filter by CPV only
      screenTitle="Cash Payment Voucher"
      voucherTypeName="Cash Payment Voucher"
      defaultVoucherType="CPV"
      showVoucherTypeFilter={false} // Hide type filter for single-type screen
      voucherTypes={[
        { code: "CPV", name: "Cash Payment Voucher" },
        // Only allow CPV type for this screen
      ]}
    />
  );
};

export default CashPaymentVoucher;