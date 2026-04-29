// GenericVoucherScreen.jsx - Complete Working Version with Correct Backend Routes
import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../AuthContext";
import Pagination from "../Common/Pagination";
import { 
  Search, Plus, Edit, Trash2, Save, X, FileText, DollarSign, 
  Calendar, Building, Receipt, Package, Filter, CheckCircle, 
  AlertCircle, Loader2, RefreshCw, Eye, ChevronDown, Download,
  Send, Lock, Unlock, Tag, Clock, CheckSquare, Square, MoreVertical,
  Ban, RotateCcw, BookOpen, ExternalLink
} from "lucide-react";
import "./VoucherScreen.css";

// API Configuration for Flask Backend
const API_BASE_URL = "http://192.168.100.113:8000";

// Helper function for authenticated API calls
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

const VoucherScreen = ({
  voucherType = "CPV",
  screenTitle = "Cash Payment Voucher",
  voucherTypeName = "Cash Payment Voucher",
  voucherTypes = [],
  defaultVoucherType = "CPV",
  showVoucherTypeFilter = false
}) => {
  const { credentials } = useContext(AuthContext);
  const currentOffcode = credentials?.company?.offcode || "0101";
  const currentUsername = credentials?.username || "administrator";
  
  // Debug auth context
  useEffect(() => {
    console.log("🔐 Auth Context Debug:", {
      credentials,
      username: credentials?.username,
      company: credentials?.company,
      offcode: currentOffcode
    });
  }, [credentials]);

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState(voucherType || "all");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("new");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  
  // Status control state for each voucher
  const [voucherStatusData, setVoucherStatusData] = useState({});
  const [statusLoading, setStatusLoading] = useState({});
  
  // Data states
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Account references state
  const [accountReferences, setAccountReferences] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  
  // Form states for popup
  const [formData, setFormData] = useState(getInitialVoucherData());
  const [details, setDetails] = useState([getInitialDetail()]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Screen menu ID state
  const [screenMenuId, setScreenMenuId] = useState("0202000001");
  const [initializing, setInitializing] = useState(true);
  
  // Default voucher types if not provided
  const availableVoucherTypes = voucherTypes.length > 0 ? voucherTypes : [
    { code: "CPV", name: "Cash Payment Voucher" },
    { code: "CRV", name: "Cash Receipt Voucher" },
    { code: "BPV", name: "Bank Payment Voucher" },
    { code: "BRV", name: "Bank Receipt Voucher" },
    { code: "JV", name: "Journal Voucher" },
    { code: "JVM", name: "Journal Voucher Manual" }
  ];

  // Helper function to determine if voucher can be edited
  const canEditVoucher = (voucher) => {
    if (voucher.posted === "true" || voucher.cancelled === "true") {
      return false;
    }
    if (voucher.status === "2" || voucher.status === "3") {
      return false;
    }
    const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
    const statusData = voucherStatusData[voucherKey];
    if (statusData) {
      if (statusData.currentStatusId === "2" || statusData.currentStatusId === "3") {
        return false;
      }
    }
    return true;
  };

  // Initial state functions
  function getInitialVoucherData() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    return {
      vockey: "",
      vno: "",
      vdate: currentDate,
      vtype: defaultVoucherType,
      Amount: "0.00",
      posted: "false",
      currencyrate: "1",
      compcode: "01",
      offcode: currentOffcode,
      createdby: currentUsername,
      createdate: currentDate,
      createdtime: currentTime,
      editby: currentUsername,
      editdate: currentDate,
      edittime: currentTime,
      Code: "",
      uid: credentials?.uid || "2",
      status: "1",
      YCode: "9",
      pk: "",
      AmountE: "0.00",
      ProjectCode: "",
      bcode: `${currentOffcode}01`,
      ManualRefNo: "",
      acBalHeadAmount: "0.00",
      TotalAmt: "0",
      ReceivedAmt: "0",
      FCAmount: "0.00",
      TotalCostExpence: "0",
      TotalCostDuty: "0",
      TotalCostAdvanceTax: "0",
      TotalCostIncomeTax: "0",
      AccountReference: "",
      AccountReferenceName: ""
    };
  }

  function getInitialDetail() {
    return {
      vockey: "",
      code: "",
      name: "",
      narration: "",
      chequeno: "",
      debit: "0.00",
      credit: "0.00",
      vtype: defaultVoucherType,
      EntryType: getDefaultEntryType(defaultVoucherType),
      amount: "0.00",
      IsActive: "false",
      offcode: currentOffcode,
      woVno: "",
      acBalDetAmount: "0.00",
      FCdebit: "0.00",
      FCcredit: "0.00",
      acBalDetFCAmount: "0.00",
      FCAmount: "0.00",
      pk: ""
    };
  }

  function getDefaultEntryType(vtype) {
    if (["CPV", "BPV"].includes(vtype)) return "D";
    if (["CRV", "BRV"].includes(vtype)) return "C";
    return "D";
  }

  // Load account references from API
  const loadAccountReferences = async (offcode = currentOffcode, vtype = defaultVoucherType) => {
    setLoadingReferences(true);
    try {
      console.log(`📥 Loading account references for offcode: ${offcode}, vtype: ${vtype}`);
      
      const response = await authFetch(`${API_BASE_URL}/getAccountReferences`, {
        method: 'POST',
        body: JSON.stringify({
          offcode: offcode,
          vtype: vtype
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const references = data.accounts.map(acc => ({
          code: acc.code || acc.Code || '',
          name: acc.name || acc.Name || '',
          offcode: acc.offcode || '',
          fullName: `${acc.code || acc.Code || ''} - ${acc.name || acc.Name || ''}`
        }));
        
        setAccountReferences(references);
        setAccounts(references);
        console.log(`✅ Loaded ${references.length} account references`);
      } else {
        console.warn('Failed to load account references:', data.error);
        setAccountReferences([]);
        setAccounts([]);
      }
    } catch (err) {
      console.error("❌ Failed to load account references:", err);
      setAccountReferences([]);
      setAccounts([]);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log(`🔍 Loading vouchers with type: ${voucherType}`);
      
      // Build where clause for filtering
      let whereClauses = [];
      
      if (voucherType && voucherType !== "all") {
        whereClauses.push(`vtype = '${voucherType}'`);
      }
      
      // Handle status filter
      if (statusFilter !== "all") {
        if (statusFilter === "posted") {
          whereClauses.push(`(posted = 'true' OR status = '2')`);
        } else if (statusFilter === "unposted") {
          whereClauses.push(`(posted = 'false' AND status = '1' AND (cancelled IS NULL OR cancelled = 'false'))`);
        } else if (statusFilter === "cancelled") {
          whereClauses.push(`(cancelled = 'true' OR status = '3')`);
        }
      }
      
      // Handle search
      if (searchTerm) {
        const escapedSearchTerm = searchTerm.replace(/'/g, "''");
        whereClauses.push(`(vno LIKE '%${escapedSearchTerm}%' OR ManualRefNo LIKE '%${escapedSearchTerm}%' OR createdby LIKE '%${escapedSearchTerm}%')`);
      }
      
      const whereSQL = whereClauses.length > 0 ? whereClauses.join(" AND ") : "";
      
      console.log("📤 WHERE clause:", whereSQL);
      
      const response = await authFetch(`${API_BASE_URL}/getTableData`, {
        method: 'POST',
        body: JSON.stringify({
          tableName: "acGLhead",
          where: whereSQL,
          page: currentPage,
          limit: itemsPerPage,
          usePagination: true
        })
      });

      const data = await response.json();
      console.log("📨 Vouchers response:", data);

      if (data.success) {
        const vouchersList = data.rows || [];
        console.log(`✅ Loaded ${vouchersList.length} vouchers`);
        
        // Log the first voucher to see its structure
        if (vouchersList.length > 0) {
          console.log("📋 First voucher keys:", Object.keys(vouchersList[0]));
          console.log("📋 First voucher:", vouchersList[0]);
        }
        
        setVouchers(vouchersList);
        setTotalItems(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        
        // Load status for all fetched vouchers
        await loadStatusForAllVouchers(vouchersList);
        
        // Extract branches from vouchers
        const uniqueBranches = new Set();
        vouchersList.forEach(voucher => {
          if (voucher.offcode) uniqueBranches.add(voucher.offcode);
        });
        uniqueBranches.add(currentOffcode);
        
        setBranches(Array.from(uniqueBranches).map(code => ({
          code: code,
          name: `Branch ${code}`
        })));
      } else {
        throw new Error(data.error || "Failed to fetch vouchers");
      }

      // Load account references
      await loadAccountReferences(currentOffcode, voucherType || defaultVoucherType);

    } catch (err) {
      console.error("❌ Error loading data:", err);
      const errorMessage = err.message || "Failed to load data from server";
      setError(errorMessage);
      setNotification({ type: "error", message: errorMessage });
      setVouchers([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Initialize everything
  const initializeAll = async () => {
    setInitializing(true);
    setError("");
    try {
      console.log("🚀 Initializing voucher screen...");
      await loadAllData();
      console.log("✅ Initialization complete");
    } catch (err) {
      console.error("❌ Initialization failed:", err);
      const errorMessage = "Failed to initialize: " + (err.message || "Unknown error");
      setError(errorMessage);
      setNotification({ type: "error", message: errorMessage });
    } finally {
      setInitializing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    initializeAll();
  }, []);

  // Load when filters change
  useEffect(() => {
    if (!initializing) {
      setCurrentPage(1);
      loadAllData();
    }
  }, [searchTerm, statusFilter, voucherTypeFilter]);

  useEffect(() => {
    if (!initializing && currentPage !== 1) {
      loadAllData();
    }
  }, [currentPage]);

  // Load status for a specific voucher
  const loadVoucherStatus = async (voucher) => {
    const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
    setStatusLoading(prev => ({ ...prev, [voucherKey]: true }));
    
    try {
      let currentStatusId = "1";
      if (voucher.posted === "true" || voucher.status === "2") {
        currentStatusId = "2";
      } else if (voucher.status === "3" || voucher.cancelled === "true") {
        currentStatusId = "3";
      }

      setVoucherStatusData(prev => ({
        ...prev,
        [voucherKey]: {
          currentStatus: currentStatusId === "2" ? "Posted" : currentStatusId === "3" ? "Cancelled" : "Unposted",
          currentStatusId: currentStatusId,
          nextStatusOptions: currentStatusId === "1" ? [
            { code: "2", name: "Post" },
            { code: "3", name: "Cancel" }
          ] : [],
          menuId: screenMenuId
        }
      }));
    } catch (err) {
      console.error(`❌ Failed to load status for voucher ${voucher.vno}:`, err);
    } finally {
      setStatusLoading(prev => ({ ...prev, [voucherKey]: false }));
    }
  };

  // Load status for all vouchers
  const loadStatusForAllVouchers = async (vouchersList) => {
    const statusPromises = vouchersList.map(voucher => loadVoucherStatus(voucher));
    await Promise.allSettled(statusPromises);
  };

  // Generate next voucher number
  const getVoucherNumber = useCallback(async (offcode = currentOffcode, vtype = defaultVoucherType) => {
    try {
      const bcode = `${offcode}01`;
      const currentDate = new Date().toISOString().split('T')[0];
      
      console.log("📞 Calling GetVnoVockey with:", {
        Tablename: "acGLhead",
        Vdate: currentDate,
        Vtype: vtype,
        Offcode: offcode,
        Bcode: bcode
      });
      
      const response = await authFetch(`${API_BASE_URL}/GetVnoVockey`, {
        method: 'POST',
        body: JSON.stringify({
          Tablename: "acGLhead",
          Vdate: currentDate,
          Vtype: vtype,
          Offcode: offcode,
          Bcode: bcode
        })
      });

      const data = await response.json();
      
      if (data.status === "success") {
        return { 
          vno: data.vno, 
          vockey: data.vockey, 
          bcode: bcode 
        };
      } else {
        throw new Error(data.message || "Failed to get voucher number");
      }
    } catch (error) {
      console.error("❌ Error getting voucher number:", error);
      // Fallback generation
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const year = new Date().getFullYear().toString().slice(-2);
      const vno = `00001/${month}${year}`;
      const bcode = `${offcode}01`;
      const vockey = `${bcode}${vno}`;
      return { vno, vockey, bcode };
    }
  }, [currentOffcode, defaultVoucherType]);

  // Handle search with debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle new voucher
  const handleNewVoucher = async () => {
    const { vno, vockey, bcode } = await getVoucherNumber(currentOffcode, defaultVoucherType);
    
    const initialData = getInitialVoucherData();
    initialData.vno = vno;
    initialData.vockey = vockey;
    initialData.bcode = bcode;
    
    console.log("📝 Creating new voucher with:", {
      vno,
      vockey,
      bcode,
      createdby: initialData.createdby,
      editby: initialData.editby
    });
    
    const initialDetail = getInitialDetail();
    initialDetail.vockey = vockey;
    
    setFormData(initialData);
    setDetails([initialDetail]);
    setPopupMode("new");
    setSelectedVoucher(null);
    
    await loadAccountReferences(currentOffcode, defaultVoucherType);
    
    setShowPopup(true);
  };

  // Load voucher details
  const loadVoucherDetails = async (voucher) => {
    try {
      const whereClause = `vockey = '${voucher.vockey}' AND vtype = '${voucher.vtype}' AND offcode = '${voucher.offcode}'`;
      
      const response = await authFetch(`${API_BASE_URL}/getTableData`, {
        method: 'POST',
        body: JSON.stringify({
          tableName: "acGLdet",
          where: whereClause,
          usePagination: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.rows.map(detail => ({
          code: detail.code || detail.Code || "",
          name: detail.name || detail.Name || "",
          narration: detail.narration || detail.Narration || "",
          chequeno: detail.chequeno || detail.Chequeno || "",
          debit: parseFloat(detail.debit || detail.Debit || 0).toFixed(2),
          credit: parseFloat(detail.credit || detail.Credit || 0).toFixed(2),
          amount: parseFloat(detail.amount || detail.Amount || 0).toFixed(2)
        }));
      }
      return [];
    } catch (error) {
      console.error("Error loading voucher details:", error);
      return [];
    }
  };

  // Handle edit voucher
  const handleEditVoucher = async (voucher) => {
    if (!canEditVoucher(voucher)) {
      setNotification({ type: "error", message: "Cannot edit posted or cancelled voucher" });
      return;
    }

    setLoading(true);
    try {
      await loadAccountReferences(voucher.offcode, voucher.vtype);
      const voucherDetails = await loadVoucherDetails(voucher);
      const accountRefCode = voucher.Code || voucher.AccountReference || "";

      const editedFormData = {
        ...voucher,
        vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        createdate: voucher.createdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        editdate: voucher.editdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(voucher.Amount || 0).toFixed(2),
        AccountReference: accountRefCode,
        Code: accountRefCode,
        AccountReferenceName: voucher.AccountReferenceName || voucher.Name || ""
      };

      setFormData(editedFormData);
      setDetails(voucherDetails.length > 0 ? voucherDetails : [getInitialDetail()]);
      setSelectedVoucher(voucher);
      setPopupMode("edit");
      setShowPopup(true);
      setNotification({ type: "success", message: `Loaded ${voucherDetails.length} entries for voucher ${voucher.vno}` });
    } catch (error) {
      console.error("❌ Edit voucher failed:", error);
      const accountRefCode = voucher.Code || voucher.AccountReference || "";
      const fallbackFormData = {
        ...getInitialVoucherData(),
        ...voucher,
        vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(voucher.Amount || 0).toFixed(2),
        AccountReference: accountRefCode,
        Code: accountRefCode,
        AccountReferenceName: voucher.AccountReferenceName || voucher.Name || ""
      };
      setFormData(fallbackFormData);
      setDetails([getInitialDetail()]);
      setSelectedVoucher(voucher);
      setPopupMode("edit");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle view voucher
  const handleViewVoucher = async (voucher) => {
    setLoading(true);
    try {
      await loadAccountReferences(voucher.offcode, voucher.vtype);
      const voucherDetails = await loadVoucherDetails(voucher);
      const accountRefCode = voucher.Code || voucher.AccountReference || "";

      setFormData({
        ...voucher,
        vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(voucher.Amount || 0).toFixed(2),
        AccountReference: accountRefCode,
        Code: accountRefCode,
        AccountReferenceName: voucher.AccountReferenceName || voucher.Name || ""
      });
      setDetails(voucherDetails.length > 0 ? voucherDetails : [getInitialDetail()]);
      setSelectedVoucher(voucher);
      setPopupMode("view");
      setShowPopup(true);
    } catch (error) {
      console.error("❌ View voucher failed:", error);
      const accountRefCode = voucher.Code || voucher.AccountReference || "";
      setFormData({
        ...getInitialVoucherData(),
        ...voucher,
        vdate: voucher.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(voucher.Amount || 0).toFixed(2),
        AccountReference: accountRefCode,
        Code: accountRefCode
      });
      setDetails([getInitialDetail()]);
      setSelectedVoucher(voucher);
      setPopupMode("view");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedVoucher(null);
    setPopupMode("new");
  };

  // Handle form field changes in popup
  const handleFormChange = async (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    
    if (field === "AccountReference") {
      const selectedAccount = accountReferences.find(ref => ref.code === value);
      updatedForm.AccountReference = value;
      updatedForm.AccountReferenceName = selectedAccount ? selectedAccount.name : "";
      updatedForm.Code = value;
    }
    
    if (field === "offcode") {
      const { vno, vockey, bcode } = await getVoucherNumber(value, updatedForm.vtype);
      updatedForm.vno = vno;
      updatedForm.vockey = vockey;
      updatedForm.bcode = bcode;
      
      setDetails(prev => prev.map(detail => ({
        ...detail,
        vockey: vockey,
        offcode: value
      })));
      
      await loadAccountReferences(value, updatedForm.vtype);
    }
    
    if (field === "vtype") {
      const { vno, vockey, bcode } = await getVoucherNumber(updatedForm.offcode, value);
      updatedForm.vno = vno;
      updatedForm.vockey = vockey;
      updatedForm.bcode = bcode;
      
      setDetails(prev => prev.map(detail => ({
        ...detail,
        vtype: value,
        vockey: vockey,
        EntryType: getDefaultEntryType(value)
      })));
      
      await loadAccountReferences(updatedForm.offcode, value);
      updatedForm.AccountReference = "";
      updatedForm.AccountReferenceName = "";
      updatedForm.Code = "";
    }
    
    setFormData(updatedForm);
  };

  // Handle detail row field changes
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    const currentVType = formData.vtype;
    
    if (field === "code") {
      const selectedAccount = accounts.find(acc => acc.code === value);
      updated[index].code = value;
      updated[index].name = selectedAccount ? selectedAccount.name : "";
      
      if (["CPV", "BPV"].includes(currentVType)) {
        updated[index].EntryType = "D";
        updated[index].debit = updated[index].debit || "0.00";
        updated[index].credit = "0.00";
      } else if (["CRV", "BRV"].includes(currentVType)) {
        updated[index].EntryType = "C";
        updated[index].credit = updated[index].credit || "0.00";
        updated[index].debit = "0.00";
      }
    } else if (field === "debit") {
      const numValue = parseFloat(value) || 0;
      updated[index][field] = numValue.toFixed(2);
      updated[index].amount = numValue.toFixed(2);
      updated[index].FCAmount = numValue.toFixed(2);
      
      if (["CPV", "BPV"].includes(currentVType)) {
        updated[index].credit = "0.00";
        updated[index].EntryType = "D";
      }
    } else if (field === "credit") {
      const numValue = parseFloat(value) || 0;
      updated[index][field] = numValue.toFixed(2);
      updated[index].amount = numValue.toFixed(2);
      updated[index].FCAmount = numValue.toFixed(2);
      
      if (["CRV", "BRV"].includes(currentVType)) {
        updated[index].debit = "0.00";
        updated[index].EntryType = "C";
      }
    } else {
      updated[index][field] = value;
    }
    
    setDetails(updated);
    
    const totalAmount = updated.reduce((sum, row) => {
      if (["CPV", "BPV", "JV", "JVM"].includes(currentVType)) {
        return sum + (parseFloat(row.debit) || 0);
      } else if (["CRV", "BRV"].includes(currentVType)) {
        return sum + (parseFloat(row.credit) || 0);
      }
      return sum;
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      Amount: totalAmount.toFixed(2),
      FCAmount: totalAmount.toFixed(2)
    }));
  };

  // Add detail row
  const handleAddDetail = () => {
    const newDetail = {
      ...getInitialDetail(),
      vockey: formData.vockey,
      vtype: formData.vtype,
      offcode: formData.offcode,
      EntryType: getDefaultEntryType(formData.vtype)
    };
    
    if (["CPV", "BPV"].includes(formData.vtype)) {
      newDetail.EntryType = "D";
      newDetail.debit = "0.00";
    } else if (["CRV", "BRV"].includes(formData.vtype)) {
      newDetail.EntryType = "C";
      newDetail.credit = "0.00";
    }
    
    setDetails(prev => [...prev, newDetail]);
  };

  // Remove detail row
  const handleRemoveDetail = (index) => {
    if (details.length > 1) {
      const updated = details.filter((_, i) => i !== index);
      setDetails(updated);
      
      const totalAmount = updated.reduce((sum, row) => {
        if (["CPV", "BPV", "JV", "JVM"].includes(formData.vtype)) {
          return sum + (parseFloat(row.debit) || 0);
        } else if (["CRV", "BRV"].includes(formData.vtype)) {
          return sum + (parseFloat(row.credit) || 0);
        }
        return sum;
      }, 0);
      
      setFormData(prev => ({
        ...prev,
        Amount: totalAmount.toFixed(2),
        FCAmount: totalAmount.toFixed(2)
      }));
    }
  };

  // Calculate totals for display only
  const calculateTotals = () => {
    const totalDebit = details.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
    const totalCredit = details.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
    return { totalDebit, totalCredit };
  };

  // Validate basic form
  const validateVoucher = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    
    if (!formData.offcode) return "Please select a branch";
    if (!formData.vdate) return "Please select a date";
    if (details.some(row => !row.code)) return "Please select account for all rows";
    
    const vtype = formData.vtype;
    
    if (["CPV", "BPV"].includes(vtype)) {
      if (totalDebit <= 0) return `${vtype} must have at least one debit entry`;
    } else if (["CRV", "BRV"].includes(vtype)) {
      if (totalCredit <= 0) return `${vtype} must have at least one credit entry`;
    } else if (["JV", "JVM"].includes(vtype)) {
      if (totalDebit <= 0 && totalCredit <= 0) return `${vtype} must have at least one entry`;
    }
    
    return null;
  };

  // Save voucher
  const handleSaveVoucher = async () => {
    const validationError = validateVoucher();
    if (validationError) {
      setNotification({ type: "error", message: validationError });
      return;
    }

    setLoading(true);
    try {
      const bcode = formData.bcode || `${formData.offcode}01`;
      
      // Prepare head data
      const headData = {
        vdate: formData.vdate,
        vtype: formData.vtype,
        Amount: parseFloat(formData.Amount).toFixed(2),
        currencyrate: formData.currencyrate || "1",
        compcode: formData.compcode || "01",
        createdby: popupMode === "new" ? currentUsername : formData.createdby,
        editby: currentUsername,
        Code: formData.AccountReference || formData.Code || "",
        ProjectCode: formData.ProjectCode || "",
        ManualRefNo: formData.ManualRefNo || ""
      };
      
      // Add vockey and vno for edit mode
      if (popupMode === "edit") {
        headData.vockey = formData.vockey;
        headData.vno = formData.vno;
      }
      
      // Prepare details data
      const detailsData = details.map(row => ({
        data: {
          code: row.code,
          name: row.name,
          narration: row.narration,
          chequeno: row.chequeno,
          debit: parseFloat(row.debit || 0).toFixed(2),
          credit: parseFloat(row.credit || 0).toFixed(2),
          amount: parseFloat(row.amount || 0).toFixed(2)
        },
        tableName: "acGLdet"
      }));
      
      const payload = {
        head: {
          tableName: "acGLhead",
          data: headData
        },
        details: detailsData,
        selectedBranch: bcode
      };
      
      console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));
      
      const endpoint = popupMode === "new" ? `${API_BASE_URL}/insertVouchersHeadDet` : `${API_BASE_URL}/updateVoucherHeadDet`;
      
      const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          type: "success",
          message: data.message || `Voucher ${formData.vno} saved successfully!`
        });
        handleClosePopup();
        await loadAllData();
      } else {
        throw new Error(data.error || "Failed to save voucher");
      }
    } catch (err) {
      console.error("❌ Save failed:", err);
      setNotification({
        type: "error",
        message: err.message || "Error saving voucher"
      });
    } finally {
      setLoading(false);
    }
  };

  // Change voucher status
  const handleChangeVoucherStatus = async (voucher, newStatusCode) => {
    const statusNameMap = { "1": "Unpost", "2": "Post", "3": "Cancel" };
    const action = statusNameMap[newStatusCode] || "change status";
    
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} voucher ${voucher.vno}?`)) {
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (newStatusCode === "2" || newStatusCode === "3") {
        response = await authFetch(`${API_BASE_URL}/gl_Posting`, {
          method: 'POST',
          body: JSON.stringify({
            vockey: voucher.vockey,
            offcode: voucher.offcode,
            bcode: voucher.bcode || `${voucher.offcode}01`,
            vtype: voucher.vtype,
            ostatus: newStatusCode === "2" ? 1 : 2,
            posted_by: currentUsername
          })
        });
      } else {
        setNotification({ type: "info", message: "Unpost functionality coming soon" });
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({ type: "success", message: `Voucher ${voucher.vno} ${action}ed successfully!` });
        await loadAllData();
        await loadVoucherStatus(voucher);
      } else {
        throw new Error(data.error || `Failed to ${action} voucher`);
      }
    } catch (err) {
      console.error("❌ Status change failed:", err);
      setNotification({ type: "error", message: err.message || `Error ${action}ing voucher` });
    } finally {
      setLoading(false);
    }
  };

  // Get status display for a voucher
  const getVoucherStatusDisplay = (voucher) => {
    const voucherKey = `${voucher.vockey}_${voucher.vtype}`;
    const statusData = voucherStatusData[voucherKey];
    const isLoading = statusLoading[voucherKey];
    
    if (isLoading) {
      return (
        <div className="voucher-status-loading">
          <Loader2 size={12} className="spin" />
          <span>Loading...</span>
        </div>
      );
    }
    
    const isPosted = voucher.posted === "true" || voucher.status === "2";
    const isCancelled = voucher.cancelled === "true" || voucher.status === "3";
    
    let statusDisplay;
    if (isCancelled) {
      statusDisplay = (
        <div className="voucher-status-badge cancelled">
          <Ban size={12} />
          <span>Cancelled</span>
        </div>
      );
    } else if (isPosted) {
      statusDisplay = (
        <div className="voucher-status-badge posted">
          <Lock size={12} />
          <span>Posted</span>
        </div>
      );
    } else {
      statusDisplay = (
        <div className="voucher-status-badge unposted">
          <Unlock size={12} />
          <span>UnPosted</span>
        </div>
      );
    }
    
    return (
      <div className="voucher-status-display">
        {statusDisplay}
        {statusData?.nextStatusOptions?.length > 0 && (
          <div className="voucher-status-options">
            <div className="voucher-status-dropdown">
              <button className="voucher-status-dropdown-btn">
                <MoreVertical size={14} />
              </button>
              <div className="voucher-status-dropdown-content">
                {statusData.nextStatusOptions.map((option, index) => (
                  <button
                    key={index}
                    className={`voucher-status-option ${option.code === "3" ? 'cancel' : option.code === "2" ? 'post' : 'unpost'}`}
                    onClick={() => handleChangeVoucherStatus(voucher, option.code)}
                    disabled={loading}
                  >
                    {option.code === "3" ? <Ban size={14} /> : 
                     option.code === "2" ? <Lock size={14} /> : 
                     <Unlock size={14} />}
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get voucher type name
  const getVoucherTypeName = (code) => {
    const type = availableVoucherTypes.find(t => t.code === code);
    return type ? type.name : code;
  };

  // Get voucher type rules for display
  const getVoucherRules = (vtype) => {
    const rules = {
      'CPV': 'Cash Payment Voucher - Only DEBIT entries allowed',
      'BPV': 'Bank Payment Voucher - Only DEBIT entries allowed',
      'CRV': 'Cash Receipt Voucher - Only CREDIT entries allowed',
      'BRV': 'Bank Receipt Voucher - Only CREDIT entries allowed',
      'JV': 'Journal Voucher - Both debit and credit allowed',
      'JVM': 'Journal Voucher Manual - Both debit and credit allowed'
    };
    return rules[vtype] || '';
  };

  // Get account reference name for display
  const getAccountReferenceDisplay = (voucher) => {
    const accountRefCode = voucher.Code || voucher.AccountReference || "";
    if (!accountRefCode) return "-";
    const accountRef = accountReferences.find(ref => ref.code === accountRefCode);
    if (accountRef) {
      return `${accountRefCode} - ${accountRef.name}`;
    }
    const accountName = voucher.AccountReferenceName || voucher.Name || "";
    return accountName ? `${accountRefCode} - ${accountName}` : accountRefCode;
  };

  // Clear search and filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVoucherTypeFilter(voucherType || "all");
    setCurrentPage(1);
  };

  return (
    <div className="voucher-management-container">
      {/* Notification */}
      {notification.message && (
        <div className={`voucher-notification ${notification.type}`}>
          {notification.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
          <button className="voucher-notification-close" onClick={() => setNotification({ type: "", message: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="voucher-header">
        <div className="voucher-header-content">
          <div className="voucher-title-section">
            <div className="voucher-title-icon"><Receipt size={24} /></div>
            <div className="voucher-title-text">
              <h1>{screenTitle}</h1>
              <p className="voucher-subtitle">Manage and track all {voucherTypeName.toLowerCase()}s</p>
            </div>
          </div>
          
          <div className="voucher-header-stats">
            <div className="voucher-stat">
              <span className="voucher-stat-label">Total Vouchers</span>
              <span className="voucher-stat-value">{totalItems.toLocaleString()}</span>
            </div>
            <div className="voucher-stat">
              <span className="voucher-stat-label">Showing</span>
              <span className="voucher-stat-value">{vouchers.length} of {totalItems}</span>
            </div>
            <div className="voucher-stat">
              <span className="voucher-stat-label">Voucher Type</span>
              <span className="voucher-stat-value">{voucherType}</span>
            </div>
            <div className="voucher-stat">
              <span className="voucher-stat-label">User</span>
              <span className="voucher-stat-value">{currentUsername}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="voucher-toolbar">
        <div className="voucher-search">
          <Search size={18} className="voucher-search-icon" />
          <input
            type="text"
            placeholder="Search by voucher no, reference, account, or created by..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="voucher-search-input"
          />
          {searchTerm && (
            <button className="voucher-clear-search" onClick={() => setSearchTerm("")}>
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="voucher-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="voucher-filter-select">
            <option value="all">All Status</option>
            <option value="unposted">UnPosted</option>
            <option value="posted">Posted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {showVoucherTypeFilter && (
            <select value={voucherTypeFilter} onChange={(e) => setVoucherTypeFilter(e.target.value)} className="voucher-filter-select">
              <option value="all">All Types</option>
              {availableVoucherTypes.map(type => (
                <option key={type.code} value={type.code}>{type.code} - {type.name}</option>
              ))}
            </select>
          )}
          
          {(searchTerm || statusFilter !== "all" || (showVoucherTypeFilter && voucherTypeFilter !== "all")) && (
            <button className="voucher-clear-filters-btn" onClick={handleClearFilters}>
              <X size={16} /> Clear
            </button>
          )}
          
          <button className="voucher-refresh-btn" onClick={() => initializeAll()} disabled={loading || initializing}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
        
        <button className="voucher-new-btn" onClick={handleNewVoucher} disabled={loading || initializing}>
          <Plus size={20} /> New {voucherTypeName}
        </button>
      </div>

      {/* Vouchers List */}
      <div className="voucher-list-container">
        {initializing ? (
          <div className="voucher-loading-full"><Loader2 className="spin" size={32} /><p>Initializing {screenTitle}...</p></div>
        ) : loading ? (
          <div className="voucher-loading-full"><Loader2 className="spin" size={32} /><p>Loading {voucherTypeName.toLowerCase()}s...</p></div>
        ) : error ? (
          <div className="voucher-error">
            <AlertCircle size={24} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <div className="voucher-error-actions">
              <button onClick={() => initializeAll()} className="voucher-retry-btn"><RefreshCw size={16} /> Retry</button>
              <button onClick={() => {
                setError("");
                setSearchTerm("");
                setStatusFilter("all");
                setVoucherTypeFilter(voucherType || "all");
                setCurrentPage(1);
                initializeAll();
              }} className="voucher-retry-btn secondary">Clear Filters & Reload</button>
            </div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="voucher-empty">
            <Receipt size={48} />
            <p>No {voucherTypeName.toLowerCase()}s found</p>
            {searchTerm || statusFilter !== "all" ? (
              <div className="voucher-empty-filters">
                <p className="voucher-empty-subtext">Try adjusting your search or filter</p>
                <button onClick={handleClearFilters} className="voucher-empty-btn secondary">Clear All Filters</button>
              </div>
            ) : null}
            <button onClick={handleNewVoucher} className="voucher-empty-btn">
              <Plus size={16} /> Create Your First {voucherTypeName}
            </button>
          </div>
        ) : (
          <>
            <div className="voucher-list">
              <div className="voucher-list-header">
                <div className="voucher-list-column">Voucher No</div>
                <div className="voucher-list-column">Type</div>
                <div className="voucher-list-column">Date</div>
                <div className="voucher-list-column">Amount</div>
                <div className="voucher-list-column">Account Reference</div>
                <div className="voucher-list-column">Branch</div>
                <div className="voucher-list-column">Status</div>
                <div className="voucher-list-column">Created By</div>
                <div className="voucher-list-column">Actions</div>
              </div>
              
              <div className="voucher-list-body">
                {vouchers.map((voucher, index) => (
                  <div key={`${voucher.vockey}_${index}`} className="voucher-list-item">
                    <div className="voucher-list-cell">
                      <div className="voucher-code">{voucher.vno || "-"}</div>
                      <div className="voucher-ref">{voucher.ManualRefNo || "No Ref"}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-type">
                        <FileText size={14} />
                        <span>{getVoucherTypeName(voucher.vtype)}</span>
                      </div>
                      <div className="voucher-type-code">{voucher.vtype}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-date">
                        <Calendar size={14} />
                        <span>{formatDate(voucher.vdate)}</span>
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-amount">
                        <DollarSign size={14} />
                        <span>{formatAmount(voucher.Amount)}</span>
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-account-reference">
                        <BookOpen size={14} />
                        <span className="voucher-account-ref-code">{getAccountReferenceDisplay(voucher)}</span>
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-branch">
                        <Building size={14} />
                        <span>{voucher.offcode}</span>
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">{getVoucherStatusDisplay(voucher)}</div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-created-by">{voucher.createdby || "-"}</div>
                      <div className="voucher-created-date">{voucher.createdate ? formatDate(voucher.createdate) : ""}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-actions">
                        <button className="voucher-action-btn view" onClick={() => handleViewVoucher(voucher)} title="View Voucher">
                          <Eye size={16} />
                        </button>
                        {canEditVoucher(voucher) && (
                          <button className="voucher-action-btn edit" onClick={() => handleEditVoucher(voucher)} title="Edit Voucher" disabled={loading}>
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="voucher-pagination-wrapper">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  maxVisiblePages={5}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Popup Form */}
      <VoucherPopupForm
        isOpen={showPopup}
        onClose={handleClosePopup}
        mode={popupMode}
        formData={formData}
        details={details}
        accounts={accounts}
        branches={branches}
        projects={projects}
        voucherTypes={availableVoucherTypes}
        accountReferences={accountReferences}
        loadingReferences={loadingReferences}
        onRefreshReferences={() => loadAccountReferences(formData.offcode, formData.vtype)}
        onChangeForm={handleFormChange}
        onChangeDetail={handleDetailChange}
        onAddDetail={handleAddDetail}
        onRemoveDetail={handleRemoveDetail}
        onSave={handleSaveVoucher}
        loading={loading}
        calculateTotals={calculateTotals}
        getVoucherRules={getVoucherRules}
      />
    </div>
  );
};

// VoucherPopupForm Component
const VoucherPopupForm = ({
  isOpen,
  onClose,
  mode,
  formData,
  details,
  accounts,
  branches,
  projects,
  voucherTypes,
  accountReferences,
  loadingReferences,
  onRefreshReferences,
  onChangeForm,
  onChangeDetail,
  onAddDetail,
  onRemoveDetail,
  onSave,
  loading,
  calculateTotals,
  getVoucherRules
}) => {
  const popupRef = useRef(null);
  const bodyRef = useRef(null);
  
  const { totalDebit, totalCredit } = calculateTotals();
  const voucherRules = getVoucherRules(formData.vtype);
  const isViewMode = mode === "view";
  const isPosted = formData.posted === "true" || formData.status === "2";
  const isCancelled = formData.cancelled === "true" || formData.status === "3";
  
  const currentAccountRef = formData.AccountReference || formData.Code || "";
  
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const isCreditDisabled = ["CPV", "BPV"].includes(formData.vtype);
  const isDebitDisabled = ["CRV", "BRV"].includes(formData.vtype);
  const isDisabled = isViewMode || isPosted || isCancelled;

  if (!isOpen) return null;

  return (
    <>
      <div className="voucher-popup-backdrop" onClick={onClose}></div>
      <div className="voucher-popup-container" ref={popupRef}>
        <div className="voucher-popup-content">
          <div className="voucher-popup-header">
            <div className="voucher-popup-title">
              <Receipt size={20} />
              <div className="voucher-popup-title-text">
                <h2>{mode === "new" ? "Create New Voucher" : mode === "edit" ? `Edit Voucher: ${formData.vno}` : `View Voucher: ${formData.vno}`}</h2>
                <div className="voucher-popup-subtitle">
                  <span className={`voucher-popup-mode-badge ${mode}`}>
                    {mode === "new" ? "NEW" : mode === "edit" ? "EDIT" : "VIEW"}
                  </span>
                  <span className="voucher-popup-code">Voucher No: {formData.vno}</span>
                  <span className="voucher-popup-amount">Amount: ${formData.Amount}</span>
                  {isPosted && <span className="voucher-popup-posted-badge"><Lock size={12} />Posted</span>}
                  {isCancelled && <span className="voucher-popup-cancelled-badge"><Ban size={12} />Cancelled</span>}
                  {!isPosted && !isCancelled && <span className="voucher-popup-unposted-badge"><Unlock size={12} />UnPosted</span>}
                </div>
              </div>
            </div>
            <button className="voucher-popup-close" onClick={onClose}><X size={24} /></button>
          </div>
          
          <div className="voucher-popup-body" ref={bodyRef}>
            <div className="voucher-rules-banner">
              <AlertCircle size={16} />
              <span>{voucherRules}</span>
              {isViewMode && <span className="voucher-view-mode-note">(View Mode - Read Only)</span>}
              {(isPosted || isCancelled) && <span className="voucher-status-mode-note">{isPosted ? "Posted voucher cannot be edited" : "Cancelled voucher cannot be edited"}</span>}
            </div>

            <div className="voucher-form-section">
              <h3 className="voucher-form-section-title"><FileText size={16} />Voucher Information</h3>
              <div className="voucher-form-grid">
                <div className="voucher-form-group">
                  <label>Voucher Type *</label>
                  <select value={formData.vtype} onChange={(e) => onChangeForm("vtype", e.target.value)} className="voucher-form-select" disabled={loading || isDisabled || mode === "edit"}>
                    {voucherTypes.map(type => (<option key={type.code} value={type.code}>{type.code} - {type.name}</option>))}
                  </select>
                </div>
                
                <div className="voucher-form-group">
                  <label>Date *</label>
                  <div className="voucher-form-input-with-icon">
                    <Calendar size={16} />
                    <input type="date" value={formData.vdate} onChange={(e) => onChangeForm("vdate", e.target.value)} className="voucher-form-input" disabled={loading || isDisabled} />
                  </div>
                </div>
                
                <div className="voucher-form-group">
                  <label>Branch *</label>
                  <select value={formData.offcode} onChange={(e) => onChangeForm("offcode", e.target.value)} className="voucher-form-select" disabled={loading || isDisabled || mode === "edit"}>
                    <option value="">Select Branch</option>
                    {branches.map(branch => (<option key={branch.code} value={branch.code}>{branch.code} - {branch.name}</option>))}
                  </select>
                </div>
                
                <div className="voucher-form-group">
                  <label>Account Reference{loadingReferences && <Loader2 size={14} className="spin inline-ml" />}
                    <button type="button" className="voucher-refresh-references-btn" onClick={onRefreshReferences} disabled={loadingReferences || loading || isDisabled}>
                      <RefreshCw size={14} />
                    </button>
                  </label>
                  <select value={currentAccountRef} onChange={(e) => onChangeForm("AccountReference", e.target.value)} className="voucher-form-select" disabled={loading || isDisabled || loadingReferences}>
                    <option value="">Select Account Reference</option>
                    {accountReferences.map(ref => (<option key={ref.code} value={ref.code}>{ref.fullName || `${ref.code} - ${ref.name}`}</option>))}
                    {currentAccountRef && !accountReferences.find(r => r.code === currentAccountRef) && (<option value={currentAccountRef} selected>{currentAccountRef} - {formData.AccountReferenceName || "Current selection"}</option>)}
                  </select>
                  {currentAccountRef && (<div className="voucher-field-hint"><BookOpen size={12} /><span>{accountReferences.find(r => r.code === currentAccountRef)?.name || formData.AccountReferenceName || formData.Name || "Account selected"}</span></div>)}
                </div>
                
                <div className="voucher-form-group">
                  <label>Project</label>
                  <select value={formData.ProjectCode} onChange={(e) => onChangeForm("ProjectCode", e.target.value)} className="voucher-form-select" disabled={loading || isDisabled}>
                    <option value="">Select Project</option>
                    {projects.map(project => (<option key={project.code} value={project.code}>{project.code} - {project.name}</option>))}
                  </select>
                </div>
                
                <div className="voucher-form-group">
                  <label>Manual Reference No.</label>
                  <input type="text" value={formData.ManualRefNo} onChange={(e) => onChangeForm("ManualRefNo", e.target.value)} className="voucher-form-input" placeholder="Optional reference" disabled={loading || isDisabled} />
                </div>
                
                <div className="voucher-form-group">
                  <label>Currency Rate</label>
                  <input type="number" step="0.0001" value={formData.currencyrate} onChange={(e) => onChangeForm("currencyrate", e.target.value)} className="voucher-form-input" disabled={loading || isDisabled} />
                </div>
              </div>
            </div>

            <div className="voucher-form-section">
              <div className="voucher-section-header">
                <h3 className="voucher-form-section-title"><DollarSign size={16} />Voucher Details ({details.length} entries)</h3>
                {!isDisabled && (<button className="voucher-add-btn" onClick={onAddDetail} disabled={loading}><Plus size={16} />Add Entry</button>)}
              </div>
              
              {details.length === 0 ? (<div className="voucher-empty-state"><DollarSign size={32} /><p>No voucher entries added yet</p></div>) : (
                <>
                  <div className="voucher-details-table">
                    <div className="voucher-details-header"><div>Account</div><div>Narration</div><div>Cheque No.</div><div>Debit</div><div>Credit</div>{!isDisabled && <div>Action</div>}</div>
                    <div className="voucher-details-body">
                      {details.map((row, index) => (
                        <div key={index} className="voucher-detail-row">
                          {isDisabled ? (<div className="voucher-view-field">{row.code} - {row.name || accounts.find(a => a.code === row.code)?.name || 'Unknown'}</div>) : (
                            <select value={row.code} onChange={(e) => onChangeDetail(index, "code", e.target.value)} className="voucher-form-select account-select" disabled={loading}>
                              <option value="">Select Account</option>
                              {accounts.map(acc => (<option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>))}
                            </select>
                          )}
                          {isDisabled ? (<div className="voucher-view-field">{row.narration || "-"}</div>) : (<input type="text" value={row.narration} onChange={(e) => onChangeDetail(index, "narration", e.target.value)} className="voucher-form-input" placeholder="Enter narration" disabled={loading} />)}
                          {isDisabled ? (<div className="voucher-view-field">{row.chequeno || "-"}</div>) : (<input type="text" value={row.chequeno} onChange={(e) => onChangeDetail(index, "chequeno", e.target.value)} className="voucher-form-input" placeholder="Cheque No." disabled={loading} />)}
                          {isDisabled ? (<div className="voucher-view-field amount-view">${parseFloat(row.debit || 0).toFixed(2)}</div>) : (<input type="number" step="0.01" value={row.debit} onChange={(e) => onChangeDetail(index, "debit", e.target.value)} className={`voucher-form-input ${isDebitDisabled ? 'disabled-field' : ''}`} placeholder="0.00" disabled={loading || isDebitDisabled} title={isDebitDisabled ? "Debit not allowed for this voucher type" : ""} />)}
                          {isDisabled ? (<div className="voucher-view-field amount-view">${parseFloat(row.credit || 0).toFixed(2)}</div>) : (<input type="number" step="0.01" value={row.credit} onChange={(e) => onChangeDetail(index, "credit", e.target.value)} className={`voucher-form-input ${isCreditDisabled ? 'disabled-field' : ''}`} placeholder="0.00" disabled={loading || isCreditDisabled} title={isCreditDisabled ? "Credit not allowed for this voucher type" : ""} />)}
                          {!isDisabled && (<button className="voucher-remove-btn" onClick={() => onRemoveDetail(index)} disabled={loading || details.length <= 1}><Trash2 size={16} /></button>)}
                        </div>
                      ))}
                    </div>
                    <div className="voucher-totals-row"><div></div><div></div><div className="voucher-total-label">Totals:</div><div className="voucher-total-amount">${totalDebit.toFixed(2)}</div><div className="voucher-total-amount">${totalCredit.toFixed(2)}</div>{!isDisabled && <div></div>}</div>
                  </div>
                  <div className="voucher-voucher-info">
                    <div className="voucher-info-item"><span>Total Debit:</span><strong>${totalDebit.toFixed(2)}</strong></div>
                    <div className="voucher-info-item"><span>Total Credit:</span><strong>${totalCredit.toFixed(2)}</strong></div>
                    <div className="voucher-info-item"><span>Voucher Amount:</span><strong className="voucher-main-amount">${formData.Amount}</strong></div>
                  </div>
                </>
              )}
            </div>
            
            <button className="voucher-scroll-top-btn" onClick={() => bodyRef.current?.scrollTo(0, 0)}><ChevronDown size={16} /></button>
          </div>

          <div className="voucher-popup-footer">
            <div className="voucher-footer-info">
              <span className="voucher-footer-stats">{details.length} entries • Type: {formData.vtype} • Branch: {formData.offcode}{currentAccountRef && ` • Account: ${currentAccountRef}`}{isPosted && " • Posted"}{isCancelled && " • Cancelled"}{!isPosted && !isCancelled && " • UnPosted"}</span>
              <div className="voucher-footer-amount">Total Amount: <strong>${formData.Amount}</strong></div>
            </div>
            <div className="voucher-footer-actions">
              <button className="voucher-btn-secondary" onClick={onClose} disabled={loading}>{isViewMode ? "Close" : "Cancel"}</button>
              {!isViewMode && !isPosted && !isCancelled && (<button className="voucher-btn-primary" onClick={onSave} disabled={loading}>{loading ? (<><Loader2 className="spin" size={16} />Saving...</>) : (<><Save size={16} />{mode === "new" ? "Create Voucher" : "Update Voucher"}</>)}</button>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoucherScreen;