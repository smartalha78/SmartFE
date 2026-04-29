// GRNScreen.jsx - Complete working version with duplicate key fixes
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../AuthContext";
import {
  FaSave, FaSync, FaEdit, FaPlus, FaTrash,
  FaCalendarAlt, FaReceipt, FaMoneyBillWave,
  FaCodeBranch, FaProjectDiagram, FaFileAlt,
  FaSearchDollar, FaBalanceScale, FaCheckCircle,
  FaTimesCircle, FaDollarSign, FaCalculator,
  FaTruck, FaWarehouse, FaUser, FaBox,
  FaSearch, FaFilter, FaExclamationTriangle,
  FaDownload, FaList, FaShoppingCart,
  FaArrowLeft, FaArrowRight, FaCheckSquare,
  FaFileInvoiceDollar, FaBarcode, FaClipboardList,
  FaShippingFast, FaMoneyCheckAlt, FaPercent,
  FaHashtag, FaSignature, FaStickyNote,
  FaCheck, FaTimes, FaExpandAlt, FaCompressAlt,
  FaFilePdf
} from "react-icons/fa";
import "./SaleOrder.css";

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

// Helper to fetch JSON safely with better error handling
const fetchJson = async (url, options = {}) => {
  try {
    const res = await authFetch(url, options);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`API call failed to ${url}:`, error);
    throw error;
  }
};

const SaleOrderScreen = () => {
  const { credentials } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [items, setItems] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [filteredGrnList, setFilteredGrnList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState("new");
  const [showPOs, setShowPOs] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [selectedPODetails, setSelectedPODetails] = useState([]);
  const [salesTaxPercentage, setSalesTaxPercentage] = useState(17);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [uomList, setUomList] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const itemsPerPage = 10;

  // State for GRN header
  const [saleHeader, setsaleHeader] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    CustCode: "",
    CustomerName: "",
    customerCountry: "",
    customerCity: "",
    godownID: "",
    godownName: "",
    remarks: "",
    manualRefNo: "",
    status: "Unposted",
    createdby: credentials?.username || "",
    compcode: "01",
    offcode: "0101",
    vtype: "GRN",
    IGPNo: "",
    IGPDate: new Date().toISOString().split('T')[0],
    MTransportCode: "0000000001",
    MLabourCode: "0000000001"
  });

  // State for GRN details
  const [grnDetails, setGrnDetails] = useState([
    {
      itemCode: "",
      itemName: "",
      quantity: 0,
      unit: "PCS",
      rate: 0,
      amount: 0,
      salesTaxPercentage: 17,
      salesTaxAmount: 0,
      netAmount: 0,
      batchNo: "",
      expiryDate: "",
      remarks: "",
      poNo: "",
      poDate: "",
      alterCode: "",
      saleOrder: "",
      poQty: 0,
      grnQty: 0,
      thisQty: 0,
      value: 0,
      transporter: "",
      freightAmount: 0,
      netValue: 0,
      note: "",
      slipLcNo: "",
      POpk: 1,
      ROpk: 5417
    }
  ]);

  // Load customers, godowns, items, UOMs and GRN list
  useEffect(() => {
    if (credentials?.username) {
      setsaleHeader(prev => ({ ...prev, createdby: credentials.username }));
    }

    loadCustomers();
    loadGodowns();
    loadItems();
    loadUomList();
    loadGrnList();
  }, [credentials]);

  // Load UOMs from comUOM table
  const loadUomList = async () => {
    try {
      const data = await fetchJson(`${API_BASE_URL}/get-uoms`, {
        method: "GET",
      });

      if (data.success && data.data) {
        setUomList(data.data);
        console.log(`Loaded ${data.data.length} UOMs`);
      } else {
        setUomList([
          { id: "1", name: "PCS" },
          { id: "2", name: "BOX" },
          { id: "3", name: "KG" },
          { id: "4", name: "M" },
        ]);
      }
    } catch (err) {
      console.error("Error loading UOMs:", err);
      setUomList([
        { id: "1", name: "PCS" },
        { id: "2", name: "BOX" },
        { id: "3", name: "KG" },
        { id: "4", name: "M" },
      ]);
    }
  };

  // Load suppliers from dedicated endpoint
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${API_BASE_URL}/get-customers`, {
        method: "GET",
      });

      if (data.success && data.data) {
        setCustomers(data.data);
        console.log(`Loaded ${data.data.length} customer`);
      } else {
        console.warn("No customers found, using fallback data");
        setCustomers([
          
        ]);
      }
    } catch (err) {
      console.error("Error loading customer:", err);
      setCustomers([
        { CustCode: "0000000011", CustomerName: "Fauji Foods Limited", country: "Pakistan", city: "LAHORE", id: "1" },
        { CustCode: "0000001000", CustomerName: "DG Cement Company", country: "Pakistan", city: "KARACHI", id: "2" },
        { CustCode: "0000001001", CustomerName: "Best Suppliers", country: "Pakistan", city: "LAHORE", id: "3" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load godowns from comGodown table
  const loadGodowns = async () => {
    try {
      const data = await fetchJson(`${API_BASE_URL}/get-godowns`, {
        method: "GET",
      });

      if (data.success && data.data && data.data.length > 0) {
        setGodowns(data.data);
        console.log(`Loaded ${data.data.length} godowns`);
      } else {
        console.warn("No godowns found, using fallback data");
        setGodowns([
          { godownID: "1", description: "Main Godown", id: "1" },
          { godownID: "2", description: "Raw Material Godown", id: "2" },
          { godownID: "3", description: "Finished Goods Godown", id: "3" },
        ]);
      }
    } catch (err) {
      console.error("Error loading godowns:", err);
      setGodowns([
        { godownID: "1", description: "Main Godown (Fallback)", id: "1" },
        { godownID: "2", description: "Raw Material Godown (Fallback)", id: "2" },
        { godownID: "3", description: "Finished Goods Godown (Fallback)", id: "3" },
      ]);
    }
  };

  // Load items
  const loadItems = async () => {
    try {
      const data = await fetchJson(`${API_BASE_URL}/get-items`, {
        method: "GET",
      });

      if (data.success && data.data && data.data.length > 0) {
        const formattedItems = data.data.map(item => ({
          code: item.code || item.Itemcode,
          name: item.name || item.Itemname,
          unit: item.unit || item.uom || "PCS",
          id: item.code || item.Itemcode
        }));
        setItems(formattedItems.filter(item => item.code && item.name));
        console.log(`Loaded ${formattedItems.length} items`);
      } else {
        setItems([
          { code: "0101001", name: "P.G New abc", unit: "PCS", id: "0101001" },
          { code: "0101002", name: "Cement Bag", unit: "BAG", id: "0101002" },
          { code: "0101003", name: "Steel Rods", unit: "KG", id: "0101003" },
        ]);
      }
    } catch (err) {
      console.error("Error loading items:", err);
      setItems([
        { code: "0101001", name: "P.G New abc (Fallback)", unit: "PCS", id: "0101001" },
        { code: "0101002", name: "Cement Bag (Fallback)", unit: "BAG", id: "0101002" },
      ]);
    }
  };

  // Load GRN list
  const loadGrnList = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${API_BASE_URL}/get-saleorder-table-data`, {
        method: "POST",
        body: JSON.stringify({
          tableName: "invsaleOrderhead",
          offcode: "0101",
        }),
      });

      if (data.success && (data.rows || data.data)) {
        const rows = data.rows || data.data;
        setGrnList(rows);
        setFilteredGrnList(rows);
        console.log(`Loaded ${rows.length} GRNs`);
      } else {
        setGrnList([]);
        setFilteredGrnList([]);
      }
    } catch (err) {
      setError("Failed to load GRN list: " + err.message);
      setGrnList([]);
      setFilteredGrnList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load purchase orders for selected supplier
  const loadPurchaseOrders = async (supplierCode) => {
    try {
      setLoading(true);
      const data = await fetchJson(`${API_BASE_URL}/get-purchase-orders`, {
        method: "POST",
        body: JSON.stringify({
          supplierCode,
          offcode: "0101"
        }),
      });

      if (data.success && data.data && data.data.length > 0) {
        setPurchaseOrders(data.data);
        setShowPOs(true);
        setSelectedPOs([]);
        setSelectedPODetails([]);
      } else {
        setError("No purchase orders found for this supplier");
        setPurchaseOrders([]);
      }
    } catch (err) {
      setError("Failed to load purchase orders: " + err.message);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle PO selection
  const togglePOSelection = (po, detail) => {
    const poKey = `${po.vno}-${detail.Itemcode}`;

    if (selectedPODetails.some(p => `${p.poNo}-${p.itemCode}` === poKey)) {
      setSelectedPODetails(selectedPODetails.filter(p => `${p.poNo}-${p.itemCode}` !== poKey));
    } else {
      const newDetail = {
        poNo: po.vno,
        poDate: po.vdate,
        itemCode: detail.Itemcode,
        itemName: detail.Itemname,
        alterCode: detail.Altercode || "",
        unit: detail.uom || "PCS",
        poQty: parseFloat(detail.qty || 0),
        grnQty: parseFloat(detail.Recivedqty || 0),
        thisQty: parseFloat(detail.qty || 0) - parseFloat(detail.Recivedqty || 0),
        rate: parseFloat(detail.rate || 0),
        saleOrder: "",
        transporter: "",
        freightAmount: 0,
        note: "",
        slipLcNo: ""
      };

      setSelectedPODetails([...selectedPODetails, newDetail]);
    }
  };

  // Delete selected PO detail
  const deletePODetail = (index) => {
    const updatedDetails = [...selectedPODetails];
    updatedDetails.splice(index, 1);
    setSelectedPODetails(updatedDetails);
  };

  // Add selected PO items to GRN details
  const addPOItemsToGRN = () => {
    if (selectedPODetails.length === 0) {
      setError("Please select at least one item from purchase orders");
      return;
    }

    const newDetails = selectedPODetails.map(item => {
      const amount = item.thisQty * item.rate;
      const salesTaxAmount = amount * (salesTaxPercentage / 100);
      const netAmount = amount + salesTaxAmount + (item.freightAmount || 0);

      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.thisQty,
        unit: item.unit,
        rate: item.rate,
        amount: amount,
        salesTaxPercentage: salesTaxPercentage,
        salesTaxAmount: salesTaxAmount,
        netAmount: netAmount,
        batchNo: "",
        expiryDate: "",
        remarks: "",
        poNo: item.poNo,
        poDate: item.poDate,
        alterCode: item.alterCode,
        saleOrder: item.saleOrder,
        poQty: item.poQty,
        grnQty: item.grnQty,
        thisQty: item.thisQty,
        value: amount,
        transporter: item.transporter,
        freightAmount: item.freightAmount,
        netValue: netAmount,
        note: item.note,
        slipLcNo: item.slipLcNo,
        POpk: 1,
        ROpk: 5417
      };
    });

    setGrnDetails(newDetails);
    setShowPOs(false);
    setSelectedPOs([]);
    setSelectedPODetails([]);
  };

  // Update PO detail field
  const updatePODetail = (index, field, value) => {
    const updatedDetails = [...selectedPODetails];
    updatedDetails[index][field] = value;

    if (field === 'poQty' || field === 'grnQty') {
      updatedDetails[index].thisQty = updatedDetails[index].poQty - updatedDetails[index].grnQty;
    }

    setSelectedPODetails(updatedDetails);
  };

  // Toggle row expansion
  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Filtering
  useEffect(() => {
    let filtered = grnList;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((d) =>
        ["vno", "suppliername", "manualrefno", "supplierName", "manualRefNo"].some(
          (key) =>
            d[key] &&
            d[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (activeFilter !== "all") {
      const isActive = activeFilter === "posted";
      filtered = filtered.filter((d) => {
        const statusValue = d.status || 2;
        return statusValue === 1 === isActive;
      });
    }

    setFilteredGrnList(filtered);
  }, [searchTerm, activeFilter, grnList]);

  // Handle GRN header field change
  const handleHeaderChange = (e) => {
    const { name, value, options, selectedIndex } = e.target;

    if (name === "CustCode") {
      const selectedCustomer = customers.find(c => c.CustCode === value);
      setsaleHeader({
        ...saleHeader,
        [name]: value,
        CustomerName: selectedCustomer ? selectedCustomer.CustomerName : "",
        customerCountry: selectedCustomer ? selectedCustomer.country : "",
        customerCity: selectedCustomer ? selectedCustomer.city : ""
      });
    } else if (name === "godownID") {
      const selectedGodown = godowns.find(g => g.godownID === value);
      setsaleHeader({
        ...saleHeader,
        [name]: value,
        godownName: selectedGodown ? selectedGodown.description : ""
      });
    } else {
      setsaleHeader({ ...saleHeader, [name]: value });
    }
  };

  // Handle GRN detail field change
  const handleDetailChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...grnDetails];

    if (name === "itemCode") {
      const selectedItem = items.find(item => item.code === value);
      updated[index].itemCode = value;
      updated[index].itemName = selectedItem ? selectedItem.name : "";
      updated[index].unit = selectedItem ? selectedItem.unit : "PCS";
    } else if (name === "salesTaxPercentage") {
      updated[index][name] = parseFloat(value) || 0;
    } else {
      updated[index][name] =
        name === "quantity" || name === "rate" || name === "amount" || name === "salesTaxAmount" || name === "netAmount" ||
          name === "thisQty" || name === "poQty" || name === "grnQty" || name === "freightAmount"
          ? parseFloat(value) || 0
          : value;
    }

    if (name === "quantity" || name === "rate" || name === "salesTaxPercentage" || name === "thisQty" || name === "freightAmount") {
      const quantity = parseFloat(updated[index].thisQty || updated[index].quantity) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      const salesTaxPercentage = parseFloat(updated[index].salesTaxPercentage) || 0;
      const freightAmount = parseFloat(updated[index].freightAmount) || 0;

      const amount = quantity * rate;
      const salesTaxAmount = amount * (salesTaxPercentage / 100);
      const netAmount = amount + salesTaxAmount + freightAmount;

      updated[index].amount = amount;
      updated[index].salesTaxAmount = salesTaxAmount;
      updated[index].netAmount = netAmount;
      updated[index].value = amount;
      updated[index].netValue = netAmount;
    }

    setGrnDetails(updated);
  };

  // Update sales tax percentage for all items
  const updateAllSalesTax = (percentage) => {
    setSalesTaxPercentage(percentage);
    const updated = grnDetails.map(item => {
      const quantity = parseFloat(item.thisQty || item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const freightAmount = parseFloat(item.freightAmount) || 0;

      const amount = quantity * rate;
      const salesTaxAmount = amount * (percentage / 100);
      const netAmount = amount + salesTaxAmount + freightAmount;

      return {
        ...item,
        salesTaxPercentage: percentage,
        salesTaxAmount: salesTaxAmount,
        netAmount: netAmount,
        value: amount,
        netValue: netAmount
      };
    });

    setGrnDetails(updated);
  };

  const addRow = () => {
    setGrnDetails([
      ...grnDetails,
      {
        itemCode: "",
        itemName: "",
        quantity: 0,
        unit: "PCS",
        rate: 0,
        amount: 0,
        salesTaxPercentage: salesTaxPercentage,
        salesTaxAmount: 0,
        netAmount: 0,
        batchNo: "",
        expiryDate: "",
        remarks: "",
        poNo: "",
        poDate: "",
        alterCode: "",
        saleOrder: "",
        poQty: 0,
        grnQty: 0,
        thisQty: 0,
        value: 0,
        transporter: "",
        freightAmount: 0,
        netValue: 0,
        note: "",
        slipLcNo: "",
        POpk: 1,
        ROpk: 5417
      }
    ]);
  };

  const removeRow = (index) => {
    if (grnDetails.length > 1) {
      const updated = [...grnDetails];
      updated.splice(index, 1);
      setGrnDetails(updated);
    }
  };

  // Calculate totals
  const totalQuantity = grnDetails.reduce((sum, row) => sum + (parseFloat(row.thisQty || row.quantity) || 0), 0);
  const totalAmount = grnDetails.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const totalSalesTax = grnDetails.reduce((sum, row) => sum + (parseFloat(row.salesTaxAmount) || 0), 0);
  const totalFreight = grnDetails.reduce((sum, row) => sum + (parseFloat(row.freightAmount) || 0), 0);
  const totalNetAmount = grnDetails.reduce((sum, row) => sum + (parseFloat(row.netAmount) || 0), 0);

  // Generate PDF
  const generatePDF = async (vno, vockey) => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/generate-grn-pdf`, {
        method: "POST",
        body: JSON.stringify({
          vno: vno,
          vockey: vockey,
          offcode: "0101"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.pdfUrl) {
          window.open(result.pdfUrl, '_blank');
        } else {
          setSuccessMessage(result.message || "PDF generated successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } else {
        throw new Error(result.error || "PDF generation failed");
      }
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open form for new GRN
  const handleNew = () => {
    setsaleHeader({
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      CustCode: "",
      CustomerName: "",
      customerCountry: "",
      customerCity: "",
      godownID: "",
      godownName: "",
      remarks: "",
      manualRefNo: "",
      status: "Unposted",
      createdby: credentials?.username || "",
      compcode: "01",
      offcode: "0101",
      vtype: "GRN",
      IGPNo: "",
      IGPDate: new Date().toISOString().split('T')[0],
      MTransportCode: "0000000001",
      MLabourCode: "0000000001"
    });
    setGrnDetails([
      {
        itemCode: "",
        itemName: "",
        quantity: 0,
        unit: "PCS",
        rate: 0,
        amount: 0,
        salesTaxPercentage: salesTaxPercentage,
        salesTaxAmount: 0,
        netAmount: 0,
        batchNo: "",
        expiryDate: "",
        remarks: "",
        poNo: "",
        poDate: "",
        alterCode: "",
        saleOrder: "",
        poQty: 0,
        grnQty: 0,
        thisQty: 0,
        value: 0,
        transporter: "",
        freightAmount: 0,
        netValue: 0,
        note: "",
        slipLcNo: "",
        POpk: 1,
        ROpk: 5417
      }
    ]);
    setEditMode("new");
    setIsEditing(true);
    setError(null);
    setSelectedPOs([]);
    setSelectedPODetails([]);
    setPdfUrl(null);
  };

  // Load GRN details for editing
  const handleEdit = async (grn) => {
    try {
      setLoading(true);
      setError(null);

      const grnNo = grn.vno || grn.grnNo;
      const vockey = grn.vockey || `${grn.offcode || "0101"}${grnNo}`;

      const data = await fetchJson(`${API_BASE_URL}/get-saleorder-with-details`, {
        method: "POST",
        body: JSON.stringify({
          vno: grnNo,
          vockey: vockey,
          offcode: "0101"
        }),
      });

      if (data.success && data.data) {
        const headData = data.data.head;
        const detailsData = data.data.details || [];

        setsaleHeader({
          invoiceNo: headData.vno || grnNo,
          invoiceDate: headData.vdate ? headData.vdate.split(' ')[0] : new Date().toISOString().split('T')[0],
          CustCode: headData.CustCode || "",
          CustomerName: headData.CustomerName || "",
          customerCountry: headData.country || "",
          customerCity: headData.city || "",
          godownID: headData.godownid?.toString() || "",
          godownName: headData.godownname || "",
          remarks: headData.remarks || "",
          manualRefNo: headData.ManualRefNo || "",
          status: headData.status === "1" || headData.status === 1 ? "Posted" : "Unposted",
          createdby: headData.createdby || credentials?.username || "",
          compcode: headData.compcode || "01",
          offcode: headData.offcode || "0101",
          vtype: headData.vtype || "GRN",
          IGPNo: headData.IGPNo || "",
          IGPDate: headData.IGPDate ? headData.IGPDate.split(' ')[0] : new Date().toISOString().split('T')[0],
          MTransportCode: headData.MTransportCode || "0000000001",
          MLabourCode: headData.MLabourCode || "0000000001"
        });

        if (detailsData.length > 0) {
          const formattedDetails = detailsData.map(row => ({
            itemCode: row.Itemcode || "",
            itemName: row.Itemname || "",
            quantity: parseFloat(row.qty) || 0,
            unit: row.uom || "PCS",
            rate: parseFloat(row.rate) || 0,
            amount: parseFloat(row.value) || 0,
            salesTaxPercentage: parseFloat(row.saleTaxPer) || 0,
            salesTaxAmount: parseFloat(row.salestaxAmt) || 0,
            netAmount: parseFloat(row.netvalue) || 0,
            batchNo: row.batchCode || "",
            expiryDate: row.ExpDate ? row.ExpDate.split(' ')[0] : "",
            remarks: row.particular || "",
            poNo: row.PO || "",
            poDate: row.PODate || "",
            alterCode: row.ItemcodeAlter || "",
            saleOrder: "",
            poQty: parseFloat(row.qty) || 0,
            grnQty: parseFloat(row.Recivedqty) || 0,
            thisQty: parseFloat(row.qty) || 0,
            value: parseFloat(row.value) || 0,
            transporter: row.transportCode || "",
            freightAmount: parseFloat(row.freightAmount) || 0,
            netValue: parseFloat(row.netvalue) || 0,
            note: row.note || "",
            slipLcNo: row.SlipNo || "",
            POpk: row.POpk || 1,
            ROpk: row.ROpk || 5417
          }));

          setGrnDetails(formattedDetails);

          if (formattedDetails.length > 0 && formattedDetails.every(item => item.salesTaxPercentage === formattedDetails[0].salesTaxPercentage)) {
            setSalesTaxPercentage(formattedDetails[0].salesTaxPercentage);
          }
        } else {
          setGrnDetails([{
            itemCode: "",
            itemName: "",
            quantity: 0,
            unit: "PCS",
            rate: 0,
            amount: 0,
            salesTaxPercentage: salesTaxPercentage,
            salesTaxAmount: 0,
            netAmount: 0,
            batchNo: "",
            expiryDate: "",
            remarks: "",
            poNo: "",
            poDate: "",
            alterCode: "",
            saleOrder: "",
            poQty: 0,
            grnQty: 0,
            thisQty: 0,
            value: 0,
            transporter: "",
            freightAmount: 0,
            netValue: 0,
            note: "",
            slipLcNo: "",
            POpk: 1,
            ROpk: 5417
          }]);
        }

        setEditMode("edit");
        setIsEditing(true);
      } else {
        setError(data.error || "Failed to load GRN data");
      }
    } catch (err) {
      console.error("Error loading GRN:", err);
      setError(`Error loading GRN: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save GRN
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!saleHeader.CustCode) {
        setError("Please select a supplier");
        setLoading(false);
        return;
      }

      if (!saleHeader.godownID) {
        setError("Please select a godown");
        setLoading(false);
        return;
      }

      if (totalQuantity === 0) {
        setError("Please add at least one item with quantity");
        setLoading(false);
        return;
      }

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d)) return null;
        return d.toISOString().split("T")[0];
      };

      const headData = {
        vdate: formatDate(saleHeader.invoiceDate),
        vtype: "SIN",
        Ptype: 110,
        CustCode: saleHeader.CustCode,
        CustomerName: saleHeader.CustomerName,
        city: saleHeader.customerCity,
        country: saleHeader.customerCountry,
        godownid: parseInt(saleHeader.godownID),
        godownname: saleHeader.godownName,
        currencycode: 1,
        currencyrate: 1,
        compcode: "01",
        createdby: saleHeader.createdby,
        status: 2,
        ManualRefNo: saleHeader.manualRefNo || "",
        IGPNo: saleHeader.IGPNo || "",
        IGPDate: formatDate(saleHeader.IGPDate),
        MTransportCode: saleHeader.MTransportCode,
        MLabourCode: saleHeader.MLabourCode
      };

      if (editMode === "edit" && saleHeader.invoiceNo) {
        headData.vno = saleHeader.invoiceNo;
        headData.vockey = saleHeader.vockey || `${saleHeader.offcode || "0101"}${saleHeader.grnNo}`;
      }

      const payload = {
        head: {
          tableName: "invsaleorderhead",
          data: headData
        },
        details: grnDetails.map((row) => ({
          tableName: "insaledet",
          data: {
            Itemcode: row.itemCode || "",
            Itemname: row.itemName || "",
            uom: row.unit || "PCS",
            qty: row.thisQty || row.quantity || 0,
            rate: row.rate || 0,
            godownid: parseInt(saleHeader.godownID),
            godownname: saleHeader.godownName,
            saleTaxPer: row.salesTaxPercentage || 0,
            PO: row.poNo || "",
            POpk: row.POpk || 1,
            RO: row.poNo || "",
            ROpk: row.ROpk || 0,
            mfgDate: formatDate(saleHeader.grnDate),
            ExpDate: formatDate(row.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
            freightAmount: row.freightAmount || 0,
            batchCode: row.batchNo,
            particular: row.remarks,
            transporter: row.transporter,
            note: row.note,
            slipLcNo: row.slipLcNo
          }
        })),
        selectedBranch: saleHeader.customerCity || "Lahore",
      };

      console.log(`SIN ${editMode === "edit" ? "Update" : "Insert"} Payload:`, JSON.stringify(payload, null, 2));

      const apiUrl = editMode === "edit" && saleHeader.invoiceNo
        ? `${API_BASE_URL}/update-saleorder-table-data`
        : `${API_BASE_URL}/insert-saleorder-head-det`;

      const res = await fetchJson(apiUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        let successMsg = `GRN ${editMode === "edit" ? "updated" : "saved"} successfully!`;
        if (res.vno) {
          successMsg += ` GRN Number: ${res.vno}`;
        }

        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(""), 7000);

        await loadGrnList();
        setIsEditing(false);
        setError(null);
      } else {
        console.error("GRN save response error:", res);
        setError("Operation failed: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("GRN save error:", err);
      setError("Error saving GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setsaleHeader({
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      CustCode: "",
      CustomerName: "",
      customerCountry: "",
      customerCity: "",
      godownID: "",
      godownName: "",
      remarks: "",
      manualRefNo: "",
      status: "Unposted",
      createdby: credentials?.username || "",
      compcode: "01",
      offcode: "0101",
      vtype: "SIN",
      IGPNo: "",
      IGPDate: new Date().toISOString().split('T')[0],
      MTransportCode: "0000000001",
      MLabourCode: "0000000001"
    });
    setGrnDetails([
      {
        itemCode: "",
        itemName: "",
        quantity: 0,
        unit: "PCS",
        rate: 0,
        amount: 0,
        salesTaxPercentage: salesTaxPercentage,
        salesTaxAmount: 0,
        netAmount: 0,
        batchNo: "",
        expiryDate: "",
        remarks: "",
        poNo: "",
        poDate: "",
        alterCode: "",
        saleOrder: "",
        poQty: 0,
        grnQty: 0,
        thisQty: 0,
        value: 0,
        transporter: "",
        freightAmount: 0,
        netValue: 0,
        note: "",
        slipLcNo: "",
        POpk: 1,
        ROpk: 5417
      }
    ]);
    setError(null);
    setShowPOs(false);
    setSelectedPOs([]);
    setSelectedPODetails([]);
    setPdfUrl(null);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGrnList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGrnList.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && !isEditing) {
    return (
      <div className="grn-container">
      <div className="loading-spinner"></div>
        <p>Loading Invoices...</p>
      </div>
    );
  }

  return (
    <div className="grn-container">
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="grn-form glassmorphism">
          {/* GRN Header Section */}
          <div className="form-section">
            <h3><FaReceipt /> Invoice Header</h3>
            <div className="form-row">
              <div className="form-group">
                <label><FaFileAlt /> GRN No</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={saleHeader.invoiceNo}
                  className="modern-input"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label><FaCalendarAlt /> Invoice Date *</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={saleHeader.invoiceDate}
                  onChange={handleHeaderChange}
                  className="modern-input"
                  required
                />
              </div>

              <div className="form-group">
                <label><FaUser /> Customer *</label>
                <select
                  name="CustCode"
                  value={saleHeader.CustCode}
                  onChange={handleHeaderChange}
                  className="modern-input"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer, idx) => (
                    <option key={customer.id || customer.CustCode || idx} value={customer.CustCode}>
                      {customer.CustomerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FaWarehouse /> Godown *</label>
                <select
                  name="godownID"
                  value={saleHeader.godownID}
                  onChange={handleHeaderChange}
                  className="modern-input"
                  required
                >
                  <option value="">Select Godown</option>
                  {godowns.map((godown, idx) => (
                    <option key={godown.id || godown.godownID || idx} value={godown.godownID}>
                      {godown.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><FaFileAlt /> Manual Ref No.</label>
                <input
                  type="text"
                  name="manualRefNo"
                  value={saleHeader.manualRefNo}
                  onChange={handleHeaderChange}
                  className="modern-input"
                />
              </div>

              <div className="form-group">
                <label><FaFileAlt /> IGP No.</label>
                <input
                  type="text"
                  name="IGPNo"
                  value={saleHeader.IGPNo}
                  onChange={handleHeaderChange}
                  className="modern-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FaCalendarAlt /> IGP Date</label>
                <input
                  type="date"
                  name="IGPDate"
                  value={saleHeader.IGPDate}
                  onChange={handleHeaderChange}
                  className="modern-input"
                />
              </div>

              <div className="form-group">
                <label><FaPercent /> Sales Tax %</label>
                <input
                  type="number"
                  value={salesTaxPercentage}
                  onChange={(e) => updateAllSalesTax(parseFloat(e.target.value) || 0)}
                  className="modern-input"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label><FaCodeBranch /> Status</label>
                <input
                  type="text"
                  value={saleHeader.status}
                  className="modern-input"
                  readOnly
                />
              </div>
            </div>

            <div className="form-row">
              <button
                type="button"
                className="btn fetch-po"
                onClick={() => loadPurchaseOrders(saleHeader.CustCode)}
                disabled={!saleHeader.CustCode}
              >
                <FaDownload /> Fetch Purchase Orders
              </button>
            </div>
          </div>

          {/* PO Selection Modal */}
          {showPOs && (
            <div className="modal-overlay">
              <div className="modal-content item-select-modal">
                <div className="modal-header">
                  <h2><FaClipboardList /> Item Selection</h2>
                  <button className="modal-close" onClick={() => setShowPOs(false)}>
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="table-container">
                    {purchaseOrders.length > 0 ? (
                      <table className="item-table">
                        <thead>
                          <tr>
                            <th><FaCheckSquare /> Select</th>
                            <th><FaCalendarAlt /> PO Date</th>
                            <th><FaFileInvoiceDollar /> PO. No</th>
                            <th><FaBarcode /> Code</th>
                            <th><FaBarcode /> AlterCode</th>
                            <th><FaBox /> Item Name</th>
                            <th><FaHashtag /> UOM</th>
                            <th><FaHashtag /> PO Qty</th>
                            <th><FaHashtag /> GRN Qty</th>
                            <th><FaHashtag /> This Qty</th>
                            <th><FaDollarSign /> Rate</th>
                           </tr>
                        </thead>
                        <tbody>
                          {purchaseOrders.map((poGroup, groupIdx) => (
                            poGroup.poDetails
                              .filter(detail => {
                                const poQty = parseFloat(detail.qty || 0);
                                const grnQty = parseFloat(detail.Recivedqty || 0);
                                return (poQty - grnQty) > 0;
                              })
                              .map((detail, detIdx) => {
                                const poKey = `${poGroup.poHead.vno}-${detail.Itemcode}`;
                                const isSelected = selectedPODetails.some(p => `${p.poNo}-${p.itemCode}` === poKey);
                                const uniqueKey = `${groupIdx}-${detIdx}-${detail.Itemcode}`;

                                return (
                                  <tr key={uniqueKey} className={isSelected ? 'selected' : ''}>
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => togglePOSelection(poGroup.poHead, detail)}
                                      />
                                    </td>
                                    <td>{poGroup.poHead.vdate}</td>
                                    <td>{poGroup.poHead.vno}</td>
                                    <td>{detail.Itemcode}</td>
                                    <td>{detail.Altercode || ''}</td>
                                    <td>{detail.Itemname}</td>
                                    <td>{detail.uom}</td>
                                    <td>{parseFloat(detail.qty || 0).toFixed(2)}</td>
                                    <td>{parseFloat(detail.Recivedqty || 0).toFixed(2)}</td>
                                    <td>{(parseFloat(detail.qty || 0) - parseFloat(detail.Recivedqty || 0)).toFixed(2)}</td>
                                    <td>{parseFloat(detail.rate || 0).toFixed(2)}</td>
                                   </tr>
                                );
                              })
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-data">No purchase orders found</div>
                    )}
                  </div>

                  {/* Selected Items Section */}
                  {selectedPODetails.length > 0 && (
                    <div className="selected-items-section">
                      <h3><FaCheckSquare /> Selected Items</h3>
                      <div className="selected-items-container">
                        <table className="selected-items-table">
                          <thead>
                            <tr>
                              <th><FaTrash /> Delete</th>
                              <th><FaFileInvoiceDollar /> PO. No</th>
                              <th><FaBarcode /> Code</th>
                              <th><FaBox /> Item Name</th>
                              <th><FaHashtag /> PO Qty</th>
                              <th><FaHashtag /> GRN Qty</th>
                              <th><FaHashtag /> This Qty</th>
                              <th><FaDollarSign /> Rate</th>
                              <th><FaShippingFast /> Transporter</th>
                              <th><FaMoneyBillWave /> Freight Amt</th>
                              <th><FaStickyNote /> Note</th>
                             </tr>
                          </thead>
                          <tbody>
                            {selectedPODetails.map((item, idx) => (
                              <tr key={`selected-${idx}-${item.itemCode}`}>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => deletePODetail(idx)}
                                  >
                                    <FaTrash />
                                  </button>
                                </td>
                                <td>{item.poNo}</td>
                                <td>{item.itemCode}</td>
                                <td>{item.itemName}</td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.poQty}
                                    onChange={(e) => updatePODetail(idx, 'poQty', parseFloat(e.target.value) || 0)}
                                    className="qty-input"
                                    step="0.01"
                                    min="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.grnQty}
                                    onChange={(e) => updatePODetail(idx, 'grnQty', parseFloat(e.target.value) || 0)}
                                    className="qty-input"
                                    step="0.01"
                                    min="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.thisQty}
                                    readOnly
                                    className="qty-input"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.rate}
                                    readOnly
                                    className="rate-input"
                                    step="0.01"
                                    min="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={item.transporter}
                                    onChange={(e) => updatePODetail(idx, 'transporter', e.target.value)}
                                    className="transporter-input"
                                    placeholder="Transporter"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.freightAmount}
                                    onChange={(e) => updatePODetail(idx, 'freightAmount', parseFloat(e.target.value) || 0)}
                                    className="freight-input"
                                    step="0.01"
                                    min="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={item.note}
                                    onChange={(e) => updatePODetail(idx, 'note', e.target.value)}
                                    className="note-input"
                                    placeholder="Note"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="footer-container">
                    <button
                      className="submit-btn"
                      type="button"
                      onClick={addPOItemsToGRN}
                    >
                      <FaCheckCircle /> Add Selected to GRN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRN Details Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaBox /> GRN Details</h3>
              <button type="button" className="btn add-row" onClick={addRow}>
                <FaPlus /> Add Row
              </button>
            </div>

            <div className="table-container">
              <table className="grn-details-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Tax %</th>
                    <th>Tax Amt</th>
                    <th>Net Amt</th>
                    <th>PO No</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grnDetails.map((row, idx) => (
                    <tr key={`detail-${idx}-${row.itemCode || idx}`}>
                      <td>
                        <input
                          type="text"
                          name="itemCode"
                          value={row.itemCode}
                          onChange={(e) => handleDetailChange(idx, e)}
                          list={`itemCodes-${idx}`}
                        />
                        <datalist id={`itemCodes-${idx}`}>
                          {items.map((item, itemIdx) => (
                            <option key={item.id || item.code || itemIdx} value={item.code}>
                              {item.name}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="itemName"
                          value={row.itemName}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="thisQty"
                          value={row.thisQty || row.quantity}
                          onChange={(e) => handleDetailChange(idx, e)}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="rate"
                          value={row.rate}
                          onChange={(e) => handleDetailChange(idx, e)}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="amount"
                          value={row.amount}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="salesTaxPercentage"
                          value={row.salesTaxPercentage}
                          onChange={(e) => handleDetailChange(idx, e)}
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="salesTaxAmount"
                          value={row.salesTaxAmount}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="netAmount"
                          value={row.netAmount}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="poNo"
                          value={row.poNo}
                          onChange={(e) => handleDetailChange(idx, e)}
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => removeRow(idx)} className="btn-remove-row">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2"><strong>Total</strong></td>
                    <td><strong>{totalQuantity.toFixed(2)}</strong></td>
                    <td></td>
                    <td><strong>{totalAmount.toFixed(2)}</strong></td>
                    <td></td>
                    <td><strong>{totalSalesTax.toFixed(2)}</strong></td>
                    <td><strong>{totalNetAmount.toFixed(2)}</strong></td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn save" disabled={loading}>
              {loading ? "Processing..." : <><FaSave /> {editMode === "edit" ? "Update" : "Save"} GRN</>}
            </button>
            <button type="button" className="btn cancel" onClick={handleCancel}>
              <FaTimesCircle /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Toolbar */}
          <div className="grn-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search Invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="btn new" onClick={handleNew}>
              <FaPlus /> New Invoice
            </button>
          </div>

          {/* GRN List */}
          <div className="grn-list-container">
            <table className="grn-list-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((SaleOrder, idx) => (
                  <tr key={SaleOrder.vno || SaleOrder.id || idx}>
                    <td>{SaleOrder.vno}</td>
                    <td>{SaleOrder.vdate}</td>
                    <td>{SaleOrder.CustomerName}</td>
                    <td>{(parseFloat(SaleOrder.NetAmount) || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status ${SaleOrder.status === 1 ? 'posted' : 'unposted'}`}>
                        {SaleOrder.status === 1 ? 'Posted' : 'Unposted'}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button onClick={() => handleEdit(SaleOrder)} className="btn-edit">
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => generatePDF(SaleOrder.vno, SaleOrder.vockey)} className="btn-pdf">
                        <FaFilePdf /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <div className="modal-overlay">
          <div className="modal-content pdf-modal">
            <div className="modal-header">
              <h3>GRN PDF</h3>
              <button onClick={() => setPdfUrl(null)}>Close</button>
            </div>
            <div className="modal-body">
              <iframe src={pdfUrl} width="100%" height="600px" title="GRN PDF" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleOrderScreen;