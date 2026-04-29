// ReceivablesScreen.jsx - Fixed Customer Dropdown Issue
import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../AuthContext";
import Pagination from "../Common/Pagination";
import { 
  Search, Plus, Edit, Trash2, Save, X, FileText, DollarSign, 
  Calendar, Building, Receipt, Users, Filter, CheckCircle, 
  AlertCircle, Loader2, RefreshCw, Eye, ChevronDown, Download,
  Send, Lock, Unlock, Tag, Clock, CheckSquare, Square, MoreVertical,
  Ban, RotateCcw, BookOpen, ExternalLink, CreditCard, ArrowUpRight,
  ArrowDownRight, Banknote, Wallet, UserCheck, UserX, TrendingUp,
  TrendingDown, Mail, Phone, MapPin
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

const ReceivablesScreen = () => {
  const { credentials } = useContext(AuthContext);
  const currentOffcode = credentials?.company?.offcode || "0101";
  const currentUsername = credentials?.username || "administrator";
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("new");
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  
  // Status control state
  const [voucherStatusData, setVoucherStatusData] = useState({});
  const [statusLoading, setStatusLoading] = useState({});
  
  // Data states
  const [receivables, setReceivables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Screen menu ID state
  const [screenMenuId, setScreenMenuId] = useState("0203000001");
  const [initializing, setInitializing] = useState(true);
  
  // Form states for popup
  const [formData, setFormData] = useState(getInitialReceivableData());
  const [branches, setBranches] = useState([]);
  
  // Voucher types for receivables
  const receivableVoucherTypes = [
    { code: "PCA", name: "Payment Collection Account" },
    { code: "CAS", name: "Cash Receipt" },
    { code: "CHQ", name: "Cheque Receipt" }
  ];

  // Initial state functions
  function getInitialReceivableData() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    return {
      vockey: "",
      vno: "",
      vdate: currentDate,
      vtype: "CAS",
      custcode: "",
      custname: "",
      posted: "false",
      currencyCode: "1",
      compcode: "01",
      offcode: currentOffcode,
      createdby: currentUsername,
      createdate: currentDate,
      editby: currentUsername,
      editdate: currentDate,
      uid: credentials?.uid || "2",
      status: "1",
      YCode: "9",
      city: "",
      Amount: "0.00",
      CashAdjust: "false",
      manualRefNo: "",
      bcode: `${currentOffcode}01`,
      CashAdjustAmount: "0",
      BankCode: "",
      WhtAmount: "0.00",
      NetAmount: "0.00",
      SaleTaxWHLAmount: "0.00",
      FCAmount: "0.00",
      woVno: "",
      acBalHeadAmount: "0.00",
      postedDateTime: "",
      chequeBankCode: "",
      chequeNo: "",
      chequeDate: currentDate,
      chequeStatus: "1",
      chequepath: "",
      chequeDepositDate: "",
      chequeClearBonusDate: ""
    };
  }

  // Load customers - FIXED: Map database fields to frontend expected fields
  const loadCustomers = async () => {
    try {
      console.log("🔍 Loading customers...");
      
      const response = await authFetch(`${API_BASE_URL}/get-customers-or-suppliers`, {
        method: 'POST',
        body: JSON.stringify({
          type: "customer",
          offcode: currentOffcode
        })
      });

      const data = await response.json();

      if (data.success) {
        const rawCustomers = data.rows || [];
        console.log("✅ Raw customers from API:", rawCustomers);
        
        // Map database fields to frontend expected fields
        const mappedCustomers = rawCustomers.map(customer => ({
          code: customer.code || customer.Code || customer.custcode || "",
          name: customer.CustomerName || customer.Name || customer.name || customer.custname || "",
          city: customer.City || customer.city || "",
          phone: customer.Phone || customer.phone || "",
          email: customer.Email || customer.email || ""
        }));
        
        console.log("✅ Mapped customers:", mappedCustomers);
        setCustomers(mappedCustomers);
        return mappedCustomers;
      } else {
        console.warn("Failed to load customers:", data.error);
        setCustomers([]);
        return [];
      }
    } catch (err) {
      console.error("❌ Error loading customers:", err);
      setCustomers([]);
      return [];
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔍 Loading receivables data...");
      
      // Load customers first
      await loadCustomers();

      const response = await authFetch(`${API_BASE_URL}/get-receivables-table-data`, {
        method: 'POST',
        body: JSON.stringify({
          tableName: "acChequeHead",
          page: currentPage,
          limit: itemsPerPage,
          usePagination: true,
          type: "receivable"
        })
      });

      const data = await response.json();
      console.log("📨 Receivables response:", data);

      if (data.success) {
        let receivablesList = data.rows || [];
        
        // Apply filters client-side
        if (statusFilter !== "all") {
          if (statusFilter === "posted") {
            receivablesList = receivablesList.filter(r => r.posted === "true" || r.status === "2");
          } else if (statusFilter === "unposted") {
            receivablesList = receivablesList.filter(r => r.posted !== "true" && r.status !== "2" && r.status !== "3");
          } else if (statusFilter === "cancelled") {
            receivablesList = receivablesList.filter(r => r.status === "3");
          }
        }

        if (voucherTypeFilter !== "all") {
          receivablesList = receivablesList.filter(r => r.vtype === voucherTypeFilter);
        }

        if (customerFilter) {
          receivablesList = receivablesList.filter(r => r.custcode === customerFilter);
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          receivablesList = receivablesList.filter(r => 
            r.vno?.toLowerCase().includes(term) ||
            r.custname?.toLowerCase().includes(term) ||
            r.custcode?.toLowerCase().includes(term) ||
            r.manualRefNo?.toLowerCase().includes(term) ||
            r.chequeNo?.toLowerCase().includes(term)
          );
        }
        
        console.log(`✅ Loaded ${receivablesList.length} receivables after filtering`);
        
        setReceivables(receivablesList);
        setTotalItems(receivablesList.length);
        setTotalPages(Math.ceil(receivablesList.length / itemsPerPage));
        
        // Load status for all receivables
        await loadStatusForAllReceivables(receivablesList);
      } else {
        throw new Error(data.error || "Failed to fetch receivables");
      }

      // Set branches
      if (credentials?.company?.branches) {
        setBranches(credentials.company.branches.map(branch => ({
          code: branch.code,
          name: branch.branch
        })));
      } else {
        setBranches([{ code: currentOffcode, name: `Branch ${currentOffcode}` }]);
      }

    } catch (err) {
      console.error("❌ Error loading data:", err);
      const errorMessage = err.message || "Failed to load data";
      setError(errorMessage);
      setNotification({ type: "error", message: errorMessage });
      setReceivables([]);
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
      console.log("🚀 Initializing receivables screen...");
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

  // Load when page changes
  useEffect(() => {
    if (!initializing) {
      loadAllData();
    }
  }, [currentPage]);

  // Load status for a receivable
  const loadReceivableStatus = async (receivable) => {
    const voucherKey = `${receivable.vockey}_${receivable.vtype}`;
    setStatusLoading(prev => ({ ...prev, [voucherKey]: true }));
    
    try {
      let currentStatusId = "1";
      if (receivable.posted === "true" || receivable.status === "2") {
        currentStatusId = "2";
      } else if (receivable.status === "3" || receivable.cancelled === "true") {
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
      console.error(`❌ Failed to load status for receivable ${receivable.vno}:`, err);
    } finally {
      setStatusLoading(prev => ({ ...prev, [voucherKey]: false }));
    }
  };

  // Load status for all receivables
  const loadStatusForAllReceivables = async (receivablesList) => {
    const statusPromises = receivablesList.map(receivable => loadReceivableStatus(receivable));
    await Promise.allSettled(statusPromises);
  };

  // Helper to determine if receivable can be edited
  const canEditReceivable = (receivable) => {
    if (receivable.posted === "true" || receivable.cancelled === "true") {
      return false;
    }
    if (receivable.status === "2" || receivable.status === "3") {
      return false;
    }
    const voucherKey = `${receivable.vockey}_${receivable.vtype}`;
    const statusData = voucherStatusData[voucherKey];
    if (statusData) {
      if (statusData.currentStatusId === "2" || statusData.currentStatusId === "3") {
        return false;
      }
    }
    return true;
  };

  // Generate next voucher number
  const generateNextVoucherNo = useCallback(async (offcode = currentOffcode, vtype = "CAS") => {
    try {
      const bcode = `${offcode}01`;
      const currentDate = new Date().toISOString().split('T')[0];
      
      const response = await authFetch(`${API_BASE_URL}/GetVnoVockey`, {
        method: 'POST',
        body: JSON.stringify({
          Tablename: "acChequeHead",
          Vdate: currentDate,
          Vtype: vtype,
          Offcode: offcode,
          Bcode: bcode
        })
      });

      const data = await response.json();
      
      if (data.status === "success") {
        return { vno: data.vno, vockey: data.vockey, bcode };
      } else {
        throw new Error(data.message || "Failed to get voucher number");
      }
    } catch (error) {
      console.error("❌ Error getting voucher number:", error);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const year = new Date().getFullYear().toString().slice(-2);
      const vno = `00001/${month}${year}`;
      const bcode = `${offcode}01`;
      const vockey = `${bcode}${vno}`;
      return { vno, vockey, bcode };
    }
  }, [currentOffcode]);

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
      loadAllData();
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Handle new receivable
  const handleNewReceivable = async () => {
    const { vno, vockey, bcode } = await generateNextVoucherNo(currentOffcode, "CAS");
    
    const initialData = getInitialReceivableData();
    initialData.vno = vno;
    initialData.vockey = vockey;
    initialData.bcode = bcode;
    
    console.log("📝 Creating new receivable with:", { vno, vockey, bcode });
    
    setFormData(initialData);
    setPopupMode("new");
    setSelectedReceivable(null);
    setShowPopup(true);
  };

  // Handle edit receivable
  const handleEditReceivable = async (receivable) => {
    if (!canEditReceivable(receivable)) {
      setNotification({ type: "error", message: "Cannot edit posted or cancelled receivable" });
      return;
    }

    setLoading(true);

    try {
      const editedFormData = {
        ...getInitialReceivableData(),
        ...receivable,
        vdate: receivable.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(receivable.Amount || 0).toFixed(2),
        NetAmount: parseFloat(receivable.NetAmount || 0).toFixed(2),
        WhtAmount: parseFloat(receivable.WhtAmount || 0).toFixed(2),
        SaleTaxWHLAmount: parseFloat(receivable.SaleTaxWHLAmount || 0).toFixed(2)
      };

      setFormData(editedFormData);
      setSelectedReceivable(receivable);
      setPopupMode("edit");
      setShowPopup(true);
    } catch (error) {
      console.error("❌ Edit receivable failed:", error);
      setNotification({ type: "error", message: "Failed to load receivable for editing" });
    } finally {
      setLoading(false);
    }
  };

  // Handle view receivable
  const handleViewReceivable = async (receivable) => {
    setLoading(true);
    try {
      setFormData({
        ...getInitialReceivableData(),
        ...receivable,
        vdate: receivable.vdate?.split("T")[0] || new Date().toISOString().split("T")[0],
        Amount: parseFloat(receivable.Amount || 0).toFixed(2)
      });
      setSelectedReceivable(receivable);
      setPopupMode("view");
      setShowPopup(true);
    } catch (error) {
      console.error("❌ View receivable failed:", error);
      setNotification({ type: "error", message: "Failed to load receivable" });
    } finally {
      setLoading(false);
    }
  };

  // Handle close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedReceivable(null);
    setPopupMode("new");
  };

  // Handle form field changes - FIXED: Get customer name from mapped customers
  const handleFormChange = async (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    
    if (field === "custcode") {
      const selectedCustomer = customers.find(c => String(c.code) === String(value));
      console.log("Selected customer:", selectedCustomer);
      if (selectedCustomer) {
        updatedForm.custname = selectedCustomer.name || "";
        updatedForm.city = selectedCustomer.city || "";
        
        // Load customer balance
        try {
          const balanceResponse = await authFetch(`${API_BASE_URL}/get-account-balance`, {
            method: 'POST',
            body: JSON.stringify({
              custcode: value,
              offcode: updatedForm.offcode,
              type: "receivable"
            })
          });
          
          const balanceData = await balanceResponse.json();
          if (balanceData.success) {
            setNotification({
              type: "info",
              message: `Customer balance: ${balanceData.balance.netBalance} ${balanceData.balance.netBalanceType}`
            });
          }
        } catch (err) {
          console.warn("Could not load customer balance:", err);
        }
      }
    }
    
    if (field === "Amount") {
      const amount = parseFloat(value) || 0;
      const whtAmount = parseFloat(updatedForm.WhtAmount || 0);
      const saleTaxAmount = parseFloat(updatedForm.SaleTaxWHLAmount || 0);
      updatedForm.NetAmount = (amount - whtAmount - saleTaxAmount).toFixed(2);
    }
    
    if (field === "WhtAmount" || field === "SaleTaxWHLAmount") {
      const amount = parseFloat(updatedForm.Amount || 0);
      const whtAmount = field === "WhtAmount" ? parseFloat(value) : parseFloat(updatedForm.WhtAmount || 0);
      const saleTaxAmount = field === "SaleTaxWHLAmount" ? parseFloat(value) : parseFloat(updatedForm.SaleTaxWHLAmount || 0);
      updatedForm.NetAmount = (amount - whtAmount - saleTaxAmount).toFixed(2);
    }
    
    if (field === "vtype" && value === "CHQ") {
      updatedForm.chequeDate = updatedForm.vdate;
      updatedForm.chequeStatus = "1";
    }
    
    if (field === "offcode") {
      const { vno, vockey, bcode } = await generateNextVoucherNo(value, updatedForm.vtype);
      updatedForm.vno = vno;
      updatedForm.vockey = vockey;
      updatedForm.bcode = bcode;
    }
    
    if (field === "vtype") {
      const { vno, vockey, bcode } = await generateNextVoucherNo(updatedForm.offcode, value);
      updatedForm.vno = vno;
      updatedForm.vockey = vockey;
      updatedForm.bcode = bcode;
      
      if (value === "CHQ") {
        updatedForm.chequeDate = updatedForm.vdate;
        updatedForm.chequeStatus = "1";
      }
    }
    
    setFormData(updatedForm);
  };

  // Calculate totals
  const calculateTotals = () => {
    const amount = parseFloat(formData.Amount || 0);
    const whtAmount = parseFloat(formData.WhtAmount || 0);
    const saleTaxAmount = parseFloat(formData.SaleTaxWHLAmount || 0);
    const netAmount = amount - whtAmount - saleTaxAmount;
    
    return {
      amount: amount.toFixed(2),
      whtAmount: whtAmount.toFixed(2),
      saleTaxAmount: saleTaxAmount.toFixed(2),
      netAmount: netAmount.toFixed(2)
    };
  };

  // Validate form
  const validateReceivable = () => {
    if (!formData.custcode) return "Please select a customer";
    if (!formData.vdate) return "Please select a date";
    if (!formData.Amount || parseFloat(formData.Amount) <= 0) return "Please enter a valid amount";
    if (formData.vtype === "CHQ" && !formData.chequeNo) return "Please enter cheque number for cheque payment";
    return null;
  };

  // Save receivable
  const handleSaveReceivable = async () => {
    const validationError = validateReceivable();
    if (validationError) {
      setNotification({ type: "error", message: validationError });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // Prepare head data
      const headData = {
        vdate: formData.vdate,
        vtype: formData.vtype,
        custcode: formData.custcode,
        Amount: parseFloat(formData.Amount).toFixed(2),
        WhtAmount: parseFloat(formData.WhtAmount || 0).toFixed(2),
        SaleTaxWHLAmount: parseFloat(formData.SaleTaxWHLAmount || 0).toFixed(2),
        FCAmount: parseFloat(formData.FCAmount || 0).toFixed(2),
        manualRefNo: formData.manualRefNo,
        city: formData.city,
        BankCode: formData.BankCode,
        createdby: currentUsername,
        editby: currentUsername,
        chequeBankCode: formData.chequeBankCode,
        chequeNo: formData.chequeNo,
        chequeDate: formData.chequeDate,
        chequeStatus: formData.chequeStatus
      };
      
      let response;
      
      if (popupMode === "new") {
        response = await authFetch(`${API_BASE_URL}/insert-receivable-payable`, {
          method: 'POST',
          body: JSON.stringify({
            head: {
              tableName: "acChequeHead",
              data: headData
            },
            details: [],
            selectedBranch: formData.bcode,
            type: "receivable"
          })
        });
      } else {
        response = await authFetch(`${API_BASE_URL}/update-receivable-payable`, {
          method: 'POST',
          body: JSON.stringify({
            head: {
              tableName: "acChequeHead",
              data: headData,
              where: {
                vockey: formData.vockey,
                vtype: formData.vtype,
                offcode: formData.offcode
              }
            },
            details: [],
            selectedBranch: formData.bcode,
            type: "receivable"
          })
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({ type: "success", message: data.message || `Receivable ${formData.vno} saved successfully!` });
        handleClosePopup();
        await loadAllData();
      } else {
        throw new Error(data.error || "Failed to save receivable");
      }
    } catch (err) {
      console.error("❌ Save failed:", err);
      setNotification({ type: "error", message: err.message || "Error saving receivable" });
    } finally {
      setLoading(false);
    }
  };

  // Change receivable status
  const handleChangeReceivableStatus = async (receivable, newStatusCode) => {
    const statusNameMap = { "1": "Unpost", "2": "Post", "3": "Cancel" };
    const action = statusNameMap[newStatusCode] || "change status";
    
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} receivable ${receivable.vno}?`)) {
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (newStatusCode === "2" || newStatusCode === "3") {
        response = await authFetch(`${API_BASE_URL}/gl_Posting`, {
          method: 'POST',
          body: JSON.stringify({
            vockey: receivable.vockey,
            offcode: receivable.offcode,
            bcode: receivable.bcode || `${receivable.offcode}01`,
            vtype: receivable.vtype,
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
        setNotification({ type: "success", message: `Receivable ${receivable.vno} ${action}ed successfully!` });
        await loadAllData();
        await loadReceivableStatus(receivable);
      } else {
        throw new Error(data.error || `Failed to ${action} receivable`);
      }
    } catch (err) {
      console.error("❌ Status change failed:", err);
      setNotification({ type: "error", message: err.message || `Error ${action}ing receivable` });
    } finally {
      setLoading(false);
    }
  };

  // Get status display for a receivable
  const getReceivableStatusDisplay = (receivable) => {
    const voucherKey = `${receivable.vockey}_${receivable.vtype}`;
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
    
    const isPosted = receivable.posted === "true" || receivable.status === "2";
    const isCancelled = receivable.cancelled === "true" || receivable.status === "3";
    
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
                    onClick={() => handleChangeReceivableStatus(receivable, option.code)}
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

  // Format amount
  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString.split('T')[0] || dateString;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Get voucher type name
  const getVoucherTypeName = (code) => {
    const type = receivableVoucherTypes.find(t => t.code === code);
    return type ? type.name : code;
  };

  // Get cheque status display
  const getChequeStatusDisplay = (receivable) => {
    if (receivable.vtype !== "CHQ") return null;
    
    const statusMap = {
      "1": { text: "Issued", className: "issued", icon: <Clock size={12} /> },
      "2": { text: "Cleared", className: "cleared", icon: <CheckCircle size={12} /> },
      "3": { text: "Bounced", className: "bounced", icon: <Ban size={12} /> }
    };
    
    const status = statusMap[receivable.chequeStatus] || statusMap["1"];
    
    return (
      <div className={`cheque-status-badge ${status.className}`}>
        {status.icon}
        <span>{status.text}</span>
      </div>
    );
  };

  // Clear search and filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setVoucherTypeFilter("all");
    setCustomerFilter("");
    setCurrentPage(1);
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return receivables.slice(startIndex, endIndex);
  };

  const currentReceivables = getCurrentPageItems();
  const totals = calculateTotals();
  const isViewMode = popupMode === "view";
  const isPosted = formData.posted === "true";
  const isCancelled = formData.status === "3";
  const isDisabled = isViewMode || isPosted || isCancelled;
  const isChequeType = formData.vtype === "CHQ";

  return (
    <div className="voucher-management-container">
      {/* Notification */}
      {notification.message && (
        <div className={`voucher-notification ${notification.type}`}>
          {notification.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ type: "", message: "" })}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="voucher-header">
        <div className="voucher-header-content">
          <div className="voucher-title-section">
            <div className="voucher-title-icon"><ArrowDownRight size={24} /></div>
            <div className="voucher-title-text">
              <h1>Receivables Management</h1>
              <p className="voucher-subtitle">Track and manage customer receivables</p>
            </div>
          </div>
          
          <div className="voucher-header-stats">
            <div className="voucher-stat"><span className="voucher-stat-label">Total Receivables</span><span className="voucher-stat-value">{totalItems}</span></div>
            <div className="voucher-stat"><span className="voucher-stat-label">Active Customers</span><span className="voucher-stat-value">{customers.length}</span></div>
            <div className="voucher-stat"><span className="voucher-stat-label">User</span><span className="voucher-stat-value">{currentUsername}</span></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="voucher-toolbar">
        <div className="voucher-search">
          <Search size={18} className="voucher-search-icon" />
          <input type="text" placeholder="Search by voucher no, customer, cheque no..." value={searchTerm} onChange={handleSearchChange} className="voucher-search-input" />
          {searchTerm && (<button className="voucher-clear-search" onClick={() => setSearchTerm("")}><X size={14} /></button>)}
        </div>
        
        <div className="voucher-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="voucher-filter-select">
            <option value="all">All Status</option>
            <option value="unposted">UnPosted</option>
            <option value="posted">Posted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select value={voucherTypeFilter} onChange={(e) => setVoucherTypeFilter(e.target.value)} className="voucher-filter-select">
            <option value="all">All Types</option>
            {receivableVoucherTypes.map(type => (<option key={type.code} value={type.code}>{type.code} - {type.name}</option>))}
          </select>
          
          {/* Customer Filter Dropdown - FIXED: Use mapped customer name */}
          <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="voucher-filter-select">
            <option value="">All Customers</option>
            {customers.map(customer => (
              <option key={customer.code} value={customer.code}>
                {customer.code} - {customer.name}
              </option>
            ))}
          </select>
          
          {(searchTerm || statusFilter !== "all" || voucherTypeFilter !== "all" || customerFilter) && (
            <button className="voucher-clear-filters-btn" onClick={handleClearFilters}><X size={16} /> Clear</button>
          )}
          
          <button className="voucher-refresh-btn" onClick={() => initializeAll()} disabled={loading || initializing}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
        
        <button className="voucher-new-btn" onClick={handleNewReceivable} disabled={loading || initializing}>
          <Plus size={20} /> New Receivable
        </button>
      </div>

      {/* Receivables List */}
      <div className="voucher-list-container">
        {initializing ? (
          <div className="voucher-loading-full"><Loader2 className="spin" size={32} /><p>Initializing Receivables Management...</p></div>
        ) : loading ? (
          <div className="voucher-loading-full"><Loader2 className="spin" size={32} /><p>Loading receivables...</p></div>
        ) : error ? (
          <div className="voucher-error">
            <AlertCircle size={24} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button onClick={() => initializeAll()} className="voucher-retry-btn"><RefreshCw size={16} /> Retry</button>
          </div>
        ) : currentReceivables.length === 0 ? (
          <div className="voucher-empty">
            <ArrowDownRight size={48} />
            <p>No receivables found</p>
            <button onClick={handleNewReceivable} className="voucher-empty-btn"><Plus size={16} /> Create Your First Receivable</button>
          </div>
        ) : (
          <>
            <div className="voucher-list">
              <div className="voucher-list-header">
                <div className="voucher-list-column">Voucher No</div>
                <div className="voucher-list-column">Type</div>
                <div className="voucher-list-column">Date</div>
                <div className="voucher-list-column">Customer</div>
                <div className="voucher-list-column">Amount</div>
                <div className="voucher-list-column">Net Amount</div>
                <div className="voucher-list-column">Payment Details</div>
                <div className="voucher-list-column">Status</div>
                <div className="voucher-list-column">Created By</div>
                <div className="voucher-list-column">Actions</div>
              </div>
              
              <div className="voucher-list-body">
                {currentReceivables.map((receivable, index) => (
                  <div key={`${receivable.vockey}_${index}`} className="voucher-list-item">
                    <div className="voucher-list-cell">
                      <div className="voucher-code">{receivable.vno}</div>
                      <div className="voucher-ref">{receivable.manualRefNo || "No Ref"}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-type"><FileText size={14} /><span>{getVoucherTypeName(receivable.vtype)}</span></div>
                      <div className="voucher-type-code">{receivable.vtype}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-date"><Calendar size={14} /><span>{formatDate(receivable.vdate)}</span></div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-customer">
                        <Users size={14} />
                        <div className="customer-details">
                          <div className="customer-code">{receivable.custcode}</div>
                          <div className="customer-name">{receivable.custname}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-amount positive"><DollarSign size={14} /><span>{formatAmount(receivable.Amount)}</span></div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-amount positive"><DollarSign size={14} /><span>{formatAmount(receivable.NetAmount)}</span></div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-payment-details">
                        {receivable.vtype === "CHQ" ? (
                          <><Banknote size={12} /><span>Cheque: {receivable.chequeNo}</span></>
                        ) : receivable.vtype === "CAS" ? (
                          <><Wallet size={12} /><span>Cash Payment</span></>
                        ) : (
                          <><CreditCard size={12} /><span>Bank Transfer</span></>
                        )}
                      </div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      {getReceivableStatusDisplay(receivable)}
                      {getChequeStatusDisplay(receivable)}
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-created-by">{receivable.createdby || "-"}</div>
                    </div>
                    
                    <div className="voucher-list-cell">
                      <div className="voucher-actions">
                        <button className="voucher-action-btn view" onClick={() => handleViewReceivable(receivable)}><Eye size={16} /></button>
                        {canEditReceivable(receivable) && (
                          <button className="voucher-action-btn edit" onClick={() => handleEditReceivable(receivable)} disabled={loading}><Edit size={16} /></button>
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
                <Pagination currentPage={currentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} maxVisiblePages={5} loading={loading} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Popup Form */}
      {showPopup && (
        <>
          <div className="voucher-popup-backdrop" onClick={handleClosePopup}></div>
          <div className="voucher-popup-container">
            <div className="voucher-popup-content">
              <div className="voucher-popup-header">
                <div className="voucher-popup-title">
                  <ArrowDownRight size={20} />
                  <div className="voucher-popup-title-text">
                    <h2>{popupMode === "new" ? "Create New Receivable" : popupMode === "edit" ? `Edit Receivable: ${formData.vno}` : `View Receivable: ${formData.vno}`}</h2>
                    <div className="voucher-popup-subtitle">
                      <span className={`voucher-popup-mode-badge ${popupMode}`}>{popupMode === "new" ? "NEW" : popupMode === "edit" ? "EDIT" : "VIEW"}</span>
                      <span className="voucher-popup-code">Voucher No: {formData.vno}</span>
                      <span className="voucher-popup-amount">Amount: ${formData.Amount}</span>
                      {isPosted && <span className="voucher-popup-posted-badge"><Lock size={12} />Posted</span>}
                      {isCancelled && <span className="voucher-popup-cancelled-badge"><Ban size={12} />Cancelled</span>}
                      {!isPosted && !isCancelled && <span className="voucher-popup-unposted-badge"><Unlock size={12} />UnPosted</span>}
                    </div>
                  </div>
                </div>
                <button className="voucher-popup-close" onClick={handleClosePopup}><X size={24} /></button>
              </div>

              <div className="voucher-popup-body">
                <div className="voucher-form-section">
                  <h3 className="voucher-form-section-title"><Users size={16} />Receivable Information</h3>
                  
                  <div className="voucher-form-grid">
                    <div className="voucher-form-group">
                      <label>Voucher Type *</label>
                      <select value={formData.vtype} onChange={(e) => handleFormChange("vtype", e.target.value)} className="voucher-form-select" disabled={isDisabled || popupMode === "edit"}>
                        {receivableVoucherTypes.map(type => (<option key={type.code} value={type.code}>{type.code} - {type.name}</option>))}
                      </select>
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Date *</label>
                      <div className="voucher-form-input-with-icon">
                        <Calendar size={16} />
                        <input type="date" value={formData.vdate} onChange={(e) => handleFormChange("vdate", e.target.value)} className="voucher-form-input" disabled={isDisabled} />
                      </div>
                    </div>
                    
                    {/* Customer Dropdown - FIXED: Use mapped customer name */}
                    <div className="voucher-form-group">
                      <label>Customer *</label>
                      <select value={formData.custcode} onChange={(e) => handleFormChange("custcode", e.target.value)} className="voucher-form-select" disabled={isDisabled}>
                        <option value="">Select Customer</option>
                        {customers.map(customer => (
                          <option key={customer.code} value={customer.code}>
                            {customer.code} - {customer.name}
                          </option>
                        ))}
                      </select>
                      {formData.custname && (<div className="voucher-field-hint"><UserCheck size={12} /><span>{formData.custname}</span></div>)}
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Branch</label>
                      <select value={formData.offcode} onChange={(e) => handleFormChange("offcode", e.target.value)} className="voucher-form-select" disabled={isDisabled || popupMode === "edit"}>
                        <option value="">Select Branch</option>
                        {branches.map(branch => (<option key={branch.code} value={branch.code}>{branch.code} - {branch.name}</option>))}
                      </select>
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Amount *</label>
                      <div className="voucher-form-input-with-icon">
                        <DollarSign size={16} />
                        <input type="number" step="0.01" min="0" value={formData.Amount} onChange={(e) => handleFormChange("Amount", e.target.value)} className="voucher-form-input" placeholder="0.00" disabled={isDisabled} />
                      </div>
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>WHT Amount</label>
                      <input type="number" step="0.01" min="0" value={formData.WhtAmount} onChange={(e) => handleFormChange("WhtAmount", e.target.value)} className="voucher-form-input" placeholder="0.00" disabled={isDisabled} />
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Sales Tax</label>
                      <input type="number" step="0.01" min="0" value={formData.SaleTaxWHLAmount} onChange={(e) => handleFormChange("SaleTaxWHLAmount", e.target.value)} className="voucher-form-input" placeholder="0.00" disabled={isDisabled} />
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Manual Reference</label>
                      <input type="text" value={formData.manualRefNo} onChange={(e) => handleFormChange("manualRefNo", e.target.value)} className="voucher-form-input" placeholder="Optional reference" disabled={isDisabled} />
                    </div>
                    
                    <div className="voucher-form-group">
                      <label>Bank Code</label>
                      <input type="text" value={formData.BankCode} onChange={(e) => handleFormChange("BankCode", e.target.value)} className="voucher-form-input" placeholder="Bank account code" disabled={isDisabled} />
                    </div>
                  </div>
                  
                  {/* Cheque Specific Fields */}
                  {isChequeType && (
                    <div className="voucher-form-subsection">
                      <h4 className="voucher-form-subtitle"><Banknote size={14} />Cheque Details</h4>
                      <div className="voucher-form-grid">
                        <div className="voucher-form-group"><label>Cheque No. *</label><input type="text" value={formData.chequeNo} onChange={(e) => handleFormChange("chequeNo", e.target.value)} className="voucher-form-input" disabled={isDisabled} /></div>
                        <div className="voucher-form-group"><label>Cheque Date</label><div className="voucher-form-input-with-icon"><Calendar size={16} /><input type="date" value={formData.chequeDate} onChange={(e) => handleFormChange("chequeDate", e.target.value)} className="voucher-form-input" disabled={isDisabled} /></div></div>
                        <div className="voucher-form-group"><label>Cheque Bank Code</label><input type="text" value={formData.chequeBankCode} onChange={(e) => handleFormChange("chequeBankCode", e.target.value)} className="voucher-form-input" disabled={isDisabled} /></div>
                        <div className="voucher-form-group"><label>Cheque Status</label><select value={formData.chequeStatus} onChange={(e) => handleFormChange("chequeStatus", e.target.value)} className="voucher-form-select" disabled={isDisabled}><option value="1">Issued</option><option value="2">Cleared</option><option value="3">Bounced</option></select></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Totals Display */}
                  <div className="voucher-totals-display">
                    <div className="voucher-total-item"><span>Gross Amount:</span><strong>${totals.amount}</strong></div>
                    <div className="voucher-total-item"><span>WHT Deduction:</span><strong className="negative">-${totals.whtAmount}</strong></div>
                    <div className="voucher-total-item"><span>Sales Tax:</span><strong className="negative">-${totals.saleTaxAmount}</strong></div>
                    <div className="voucher-total-item total"><span>Net Amount:</span><strong className="primary">${totals.netAmount}</strong></div>
                  </div>
                </div>
              </div>

              <div className="voucher-popup-footer">
                <div className="voucher-footer-info">
                  <span className="voucher-footer-stats">Type: {formData.vtype} • Customer: {formData.custcode} • Net Amount: ${totals.netAmount}</span>
                </div>
                <div className="voucher-footer-actions">
                  <button className="voucher-btn-secondary" onClick={handleClosePopup} disabled={loading}>{isViewMode ? "Close" : "Cancel"}</button>
                  {!isViewMode && !isPosted && !isCancelled && (
                    <button className="voucher-btn-primary" onClick={handleSaveReceivable} disabled={loading}>
                      {loading ? <><Loader2 className="spin" size={16} />Saving...</> : <><Save size={16} />{popupMode === "new" ? "Create Receivable" : "Update Receivable"}</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReceivablesScreen;