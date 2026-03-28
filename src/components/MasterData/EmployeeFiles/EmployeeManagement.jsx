// EmployeeManagement.jsx - Complete Working Version with All Fixes
import React, { useState, useEffect, useCallback, useContext, lazy, Suspense } from "react";
import {
  FaEdit, FaPlus, FaTimes, FaSave, FaSearch, FaEye, FaGraduationCap,
  FaBriefcase, FaMoneyBill, FaMoneyCheck, FaUsers, FaClock,
  FaSpinner, FaFilePdf, FaUserTie, FaBuilding, FaTransgender,
  FaRing, FaEnvelope, FaPhone, FaMapMarker, FaCalendar, FaMoneyBillAlt,
  FaIdCard, FaGlobe, FaFlag, FaHeart, FaBriefcaseMedical, FaUniversity,
  FaCreditCard, FaQrcode, FaKey, FaCity, FaHome,
  FaAddressCard, FaUserCircle, FaBriefcase as FaBriefcaseIcon, FaMoneyBillWave,
  FaUniversity as FaUniversityIcon, FaCog, FaChevronDown, FaSyncAlt
} from "react-icons/fa";
import "./EmployeeManagement.css";
import { AuthContext } from "../../../AuthContext";
import { useRights } from "../../../context/RightsContext";
import pdfService from "./pdfService";
import PDFPreviewModal from "./PDFPreviewModal";
import usePDFGeneration from "./usePDFGeneration";
import Pagination from "../../Common/Pagination";
import Toast from "./Toast";
import DocumentStatusBar from "./DocumentStatusBar";
import StatusDropdown from "./StatusDropdown";
import API_BASE1 from "../../../config"

// Lazy load tab components
const AcademicTab = lazy(() => import("./AcademicTab"));
const EmploymentTab = lazy(() => import("./EmploymentTab"));
const AllowancesTab = lazy(() => import("./AllowancesTab"));
const DeductionsTab = lazy(() => import("./DeductionsTab"));
const FamilyTab = lazy(() => import("./FamilyTab"));
const AttendanceSpecTab = lazy(() => import("./AttendanceSpecTab"));

const TabLoading = () => (
  <div className="tab-loading">
    <FaSpinner className="spinner" /> Loading...
  </div>
);

const EmployeeManagement = () => {
  const { credentials } = useContext(AuthContext);
  const { hasPermission, userRights, loading: rightsLoading, error: rightsError } = useRights();

  // ---- Screen Configuration from Menu ----
  const [screenConfig, setScreenConfig] = useState(null);
  const [menuPermissions, setMenuPermissions] = useState({
    isAdd: true,
    isEdit: true,
    isDelete: true,
    isPost: true,
    isPrint: true,
    isSearch: true,
    isCopy: false,
    isBackDate: true,
    isUpload: false
  });

  const menuId = screenConfig?.id;

  // Status change modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [pendingEmployeeCode, setPendingEmployeeCode] = useState(null);
  const [joiningDate, setJoiningDate] = useState("");
  const [leftDate, setLeftDate] = useState("");

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [statusCounts, setStatusCounts] = useState({});
  const [documentStatuses, setDocumentStatuses] = useState([]);
  const [documentStatusesAll, setAllDocumentStatuses] = useState([]);
  const [employeeStatusOptions, setEmployeeStatusOptions] = useState({});

  // Header navigation state
  const [openHeader, setOpenHeader] = useState(null);
  const [activeHeader, setActiveHeader] = useState('personal');
  const [activeSubmenu, setActiveSubmenu] = useState('basic');

  // PDF Generation hook
  const {
    pdfUrl,
    showPdf,
    isGenerating,
    error: pdfError,
    generatePDF,
    closePDF
  } = usePDFGeneration({
    companyName: "Your Company Name",
    companyAddress: "123 Business Avenue, City, Country",
    showWatermark: true,
    watermark: "CONFIDENTIAL"
  });

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // ---- Core State ----
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState("edit");
  const [formData, setFormData] = useState({});
  const [tableStructure, setTableStructure] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Pagination State ----
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(5);

  // ---- Reference Data ----
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [allowanceTypes, setAllowanceTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState({});
  const [banks, setBanks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [grades, setGrades] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [tableHeaders, setTableHeaders] = useState({});

  // ---- tbloption data ----
  const [genders, setGenders] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [religions, setReligions] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [salaryModes, setSalaryModes] = useState([]);
  const [employeePerDayTypes, setEmployeePerDayTypes] = useState([]);

  // ---- Tab-specific data ----
  const [tabData, setTabData] = useState({
    academic: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
    employment: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
    allowances: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
    deductions: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
    family: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
    attendance: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null }
  });

  // ---- Inline edit state for tabs ----
  const [editState, setEditState] = useState({
    academic: { editing: {}, newRows: [] },
    employment: { editing: {}, newRows: [] },
    allowances: { editing: {}, newRows: [] },
    deductions: { editing: {}, newRows: [] },
    family: { editing: {}, newRows: [] },
    attendance: { editing: {}, newRows: [] }
  });

  // ---- Saving state for tabs ----
  const [savingTab, setSavingTab] = useState(null);

  // ---- API Base ----
  const API_BASE = API_BASE1;

  // Header sections definition - Personal Info now shows all without submenus
  const headerSections = [
    {
      key: 'personal',
      title: "Personal Information",
      icon: <FaUserCircle />,
      submenus: [] // Empty array - no submenus, show all info
    },
    {
      key: 'address',
      title: "Address Information",
      icon: <FaHome />,
      submenus: [] // Empty array - no submenus, show all info
    },
    {
      key: 'employment',
      title: "Employment",
      icon: <FaBriefcaseIcon />,
      submenus: [] // Empty array - no submenus, show all info
    },
    {
      key: 'bank',
      title: "Bank Details",
      icon: <FaUniversityIcon />,
      submenus: [] // Empty array - no submenus, show all info
    },
    {
      key: 'system',
      title: "System Fields",
      icon: <FaCog />,
      submenus: [] // Empty array - no submenus, show all info
    }
  ];

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Header click handler
  const handleHeaderClick = (headerKey) => {
    if (openHeader === headerKey) {
      setOpenHeader(null);
    } else {
      setOpenHeader(headerKey);
      setActiveHeader(headerKey);
    }
  };

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.header-item')) {
        setOpenHeader(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ---- Load Screen Configuration from Menu ----
  const loadScreenConfig = async () => {
    try {
      setIsLoadingConfig(true);

      const configRes = await fetch(`${API_BASE}/screen/get-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenName: "Employee Master File" })
      });

      const configData = await configRes.json();

      if (configData.success) {
        setScreenConfig(configData.screen);
        setMenuPermissions({
          isAdd: configData.screen.isAdd || false,
          isEdit: configData.screen.isEdit || false,
          isDelete: configData.screen.isDelete || false,
          isPost: configData.screen.isPost || false,
          isPrint: configData.screen.isPrint || false,
          isSearch: configData.screen.isSearch || false,
          isCopy: configData.screen.isCopy || false,
          isBackDate: configData.screen.isBackDate || false,
          isUpload: configData.screen.isUpload || false
        });

        await loadAllStatuses(configData.screen.id);
      }
    } catch (err) {
      console.error("Error loading screen config:", err);
      showToast("Failed to load screen configuration", "error");
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // ---- Load ALL statuses for filter bar ----
  const loadAllStatuses = async (menuId) => {
    try {
      const payload = { menuId, cname: "Active" };

      const res = await fetch(`${API_BASE}/screen/document-statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.statuses) {
        let statuses = data.statuses.map(s => ({
          ccode: parseInt(s.ccode),
          cname: s.cname.trim(),
          nFilterSort: s.nFilterSort ? parseInt(s.nFilterSort) : 999,
          isactive: s.isactive === true || s.isactive === "true" || s.isactive === 1
        }));

        if (!statuses.some(s => s.ccode === 1)) {
          statuses.push({
            ccode: 1,
            cname: "Active",
            nFilterSort: 1,
            isactive: true
          });
        }

        statuses.sort((a, b) => (a.nFilterSort || 999) - (b.nFilterSort || 999));

        setAllDocumentStatuses(statuses);
        setSelectedStatus(null);

        const counts = {};
        statuses.forEach(status => {
          counts[status.ccode] = 0;
        });
        setStatusCounts(counts);

        return statuses;
      }
      return [];
    } catch (err) {
      console.error("Error loading ALL statuses:", err);
      return [];
    }
  };

  // ---- Load available next statuses for a specific employee ----
  const loadEmployeeStatusOptions = async (employeeCode, currentStatusCcode) => {
    if (!screenConfig?.id) return [];

    const cnameMap = {
      1: "Active",
      2: "InActive",
      3: "Retire",
      4: "Suspend"
    };

    const cname = cnameMap[currentStatusCcode] || "Active";

    try {
      const payload = {
        menuId: screenConfig.id,
        cname: cname
      };

      const res = await fetch(`${API_BASE}/screen/document-statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.statuses) {
        const options = data.statuses.map(s => ({
          ccode: parseInt(s.ccode),
          cname: s.cname.trim(),
          nFilterSort: s.nFilterSort ? parseInt(s.nFilterSort) : 999,
          isactive: s.isactive === true || s.isactive === "true" || s.isactive === 1
        }));

        setEmployeeStatusOptions(prev => ({
          ...prev,
          [employeeCode]: options
        }));

        return options;
      }
      return [];
    } catch (err) {
      console.error(`Error loading status options for employee ${employeeCode}:`, err);
      return [];
    }
  };

  // New function to handle status change with confirmation
  const handleStatusChangeWithConfirmation = (employeeCode, newStatus) => {
    const currentEmployee = employees.find(e => e.Code === employeeCode) || selectedEmployee;
    const today = getTodayDate();

    if (newStatus.ccode === 1) {
      const currentJoiningDate = currentEmployee?.JoiningDate;
      const defaultDate = (!currentJoiningDate ||
        currentJoiningDate === "" ||
        currentJoiningDate === "1900-01-01" ||
        currentJoiningDate === "1900-01-01 00:00:00")
        ? today
        : formatDateForInput(currentJoiningDate);
      setJoiningDate(defaultDate);
      setLeftDate("");
    } else if (newStatus.ccode === 2 || newStatus.ccode === 3) {
      const currentLeftDate = currentEmployee?.LeftDate;
      const defaultDate = (!currentLeftDate ||
        currentLeftDate === "" ||
        currentLeftDate === "1900-01-01" ||
        currentLeftDate === "1900-01-01 00:00:00")
        ? today
        : formatDateForInput(currentLeftDate);
      setLeftDate(defaultDate);
      setJoiningDate("");
    } else {
      setJoiningDate("");
      setLeftDate("");
    }

    setPendingStatusChange(newStatus);
    setPendingEmployeeCode(employeeCode);
    setShowStatusModal(true);
  };

  // New function to confirm and apply status change
  const confirmStatusChange = async () => {
    if (!pendingEmployeeCode || !pendingStatusChange) return;

    try {
      const updates = { EmploymentStatus: pendingStatusChange.ccode };

      if (pendingStatusChange.ccode === 1 && joiningDate) {
        updates.JoiningDate = joiningDate;
      } else if ((pendingStatusChange.ccode === 2 || pendingStatusChange.ccode === 3) && leftDate) {
        updates.LeftDate = leftDate;
      }

      const payload = {
        tableName: "HRMSEmployee",
        where: { Code: pendingEmployeeCode },
        data: updates
      };

      const res = await fetch(`${API_BASE}/table/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Status updated to ${pendingStatusChange.cname} successfully`, "success");
        await loadEmployees(currentPage);

        if (selectedEmployee && selectedEmployee.Code === pendingEmployeeCode) {
          const updatedEmp = {
            ...selectedEmployee,
            ...updates,
            EmploymentStatus: pendingStatusChange.ccode
          };
          setSelectedEmployee(updatedEmp);
          setFormData(updatedEmp);
        }

        await loadEmployeeStatusOptions(pendingEmployeeCode, pendingStatusChange.ccode);
      } else {
        showToast(`Failed to update status: ${data.error || "Unknown error"}`, "error");
      }
    } catch (err) {
      console.error("Error updating employment status:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setShowStatusModal(false);
      setPendingStatusChange(null);
      setPendingEmployeeCode(null);
      setJoiningDate("");
      setLeftDate("");
    }
  };

  // ---- Load document statuses for details view ----
  const loadDocumentStatuses = async (menuId, cname) => {
    try {
      if (!menuId || !cname) return [];

      const payload = {
        menuId: menuId,
        cname: cname
      };

      const res = await fetch(`${API_BASE}/screen/document-statuses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.statuses) {
        const mappedStatuses = data.statuses.map(status => ({
          ccode: parseInt(status.ccode),
          cname: status.cname.trim(),
          nFilterSort: status.nFilterSort ? parseInt(status.nFilterSort) : 999,
          isactive: status.isactive === true || status.isactive === "true" || status.isactive === 1
        }));

        setDocumentStatuses(mappedStatuses);
        return mappedStatuses;
      }
      return [];
    } catch (err) {
      console.error("Error loading available statuses:", err);
      return [];
    }
  };

  // ---- Helper Functions ----
  const fetchJson = async (url, options = {}) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return await res.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  const formatDateForDisplay = (d) => {
    if (!d || d === "1900-01-01" || d === "1900-01-01 00:00:00") return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatDateForInput = (d) => {
    if (!d || d === "1900-01-01" || d === "1900-01-01 00:00:00") return "";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const formatCNIC = (value) => {
    if (!value) return value;
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 5) return numericValue;
    if (numericValue.length <= 12) return `${numericValue.slice(0, 5)}-${numericValue.slice(5)}`;
    return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 12)}-${numericValue.slice(12, 13)}`;
  };

  const isEmployeeActive = (employee) => {
    if (employee.IsActive === 1 || employee.IsActive === true) return true;
    if (employee.IsActive === 0 || employee.IsActive === false) return false;
    if (employee.IsActive === "1" || employee.IsActive === "true") return true;
    if (employee.IsActive === "0" || employee.IsActive === "false") return false;
    return false;
  };

  const getEmploymentStatusInfo = (statusCode) => {
    const code = parseInt(statusCode);
    const status = documentStatusesAll.find(s => s.ccode === code);

    if (status) {
      return {
        name: status.cname,
        ccode: status.ccode,
        nFilterSort: status.nFilterSort,
        isActive: status.isactive === true
      };
    }

    return {
      name: `Status ${code}`,
      ccode: code,
      nFilterSort: 999,
      isActive: true
    };
  };

  const formatEmployeeCode = (code, expectedLength = 5) => {
    if (!code && code !== 0) return null;
    const codeStr = String(code).trim();
    if (codeStr === '') return null;
    const numericStr = codeStr.replace(/\D/g, '');
    if (numericStr === '') return codeStr;
    const num = parseInt(numericStr, 10);
    if (isNaN(num)) return codeStr;
    return num.toString().padStart(expectedLength, '0');
  };

  const formatReferenceCode = (code, expectedLength = 3) => {
    if (!code && code !== 0) return null;
    const codeStr = String(code).trim();
    if (codeStr === '') return null;
    const numericStr = codeStr.replace(/\D/g, '');
    if (numericStr === '') return codeStr;
    const num = parseInt(numericStr, 10);
    if (isNaN(num)) return codeStr;
    return num.toString().padStart(expectedLength, '0');
  };

  const getMaxLength = (fieldName) => {
    return tableStructure[fieldName]?.maxLength || null;
  };

  // ---- Load Table Structure ----
  const loadTableStructure = async () => {
    try {
      const res = await fetchJson(`${API_BASE}/get-table-structure`, {
        method: "POST",
        body: JSON.stringify({ tableName: "HRMSEmployee" })
      });

      if (res?.success) {
        const structureMap = {};
        res.structure.forEach(field => {
          structureMap[field.name] = field;
        });
        setTableStructure(structureMap);
      }
    } catch (err) {
      console.error("Error loading table structure:", err);
    }
  };

  // ---- Load All Employees for dropdowns ----
  const loadAllEmployees = async () => {
    try {
      const res = await fetchJson(`${API_BASE}/get-table-data`, {
        method: "POST",
        body: JSON.stringify({
          tableName: "HRMSEmployee",
          usePagination: false
        })
      });

      if (res?.success) {
        setAllEmployees(res.rows || []);
      }
    } catch (err) {
      console.error("Error loading all employees:", err);
    }
  };

  // ---- Reference Data Getters ----
  const getDepartmentName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const dept = departments.find(d => formatReferenceCode(d.Code) === formattedCode);
    return dept ? (dept.Name || dept.name || dept.description) : code;
  }, [departments]);

  const getDesignationName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const desig = designations.find(d => formatReferenceCode(d.Code) === formattedCode);
    return desig ? (desig.Name || desig.name || desig.description) : code;
  }, [designations]);

  const getBankName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const bank = banks.find(b => formatReferenceCode(b.Code) === formattedCode);
    return bank ? (bank.Name || bank.name || bank.description || code) : code;
  }, [banks]);

  const getLocationName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const location = locations.find(l => formatReferenceCode(l.Code) === formattedCode);
    return location ? (location.Name || location.name || location.description || code) : code;
  }, [locations]);

  const getGradeName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const grade = grades.find(g => formatReferenceCode(g.Code) === formattedCode);
    return grade ? (grade.Name || grade.name || grade.description || code) : code;
  }, [grades]);

  const getShiftName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const shift = shifts.find(s => formatReferenceCode(s.Code) === formattedCode);
    return shift ? (shift.Name || shift.name || shift.description || code) : code;
  }, [shifts]);

  const getJobTitleName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const job = jobTitles.find(j => formatReferenceCode(j.code || j.Code) === formattedCode);
    return job ? (job.name || job.Name || job.description || code) : code;
  }, [jobTitles]);

  const getAllowanceName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const allowance = allowanceTypes.find(a => formatReferenceCode(a.Code) === formattedCode);
    return allowance ? (allowance.Name || allowance.name || allowance.description || code) : code;
  }, [allowanceTypes]);

  const getDeductionName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const deduction = deductionTypes.find(d => formatReferenceCode(d.Code) === formattedCode);
    return deduction ? (deduction.Name || deduction.name || deduction.description || code) : code;
  }, [deductionTypes]);

  const getCountryName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const country = countries.find(c => formatReferenceCode(c.CountryID || c.Code || c.code) === formattedCode);
    return country ? (country.CountryName || country.name || country.cname || code) : code;
  }, [countries]);

  const getCityName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const city = cities.find(c => formatReferenceCode(c.CityID || c.Code || c.code) === formattedCode);
    return city ? (city.CityName || city.name || city.cname || code) : code;
  }, [cities]);

  const getEmployeeName = useCallback((code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatEmployeeCode(code);
    const emp = allEmployees.find(e => formatEmployeeCode(e.Code) === formattedCode);
    return emp ? (emp.Name || `${emp.FName || ''} ${emp.LName || ''}`.trim() || code) : code;
  }, [allEmployees]);

  const getOptionName = (options, code) => {
    if (!code && code !== 0) return "";
    const formattedCode = formatReferenceCode(code);
    const option = options.find(o => formatReferenceCode(o.ccode) === formattedCode);
    return option ? option.cname : code;
  };

  const getCitiesByCountry = (countryCode) => {
    if (!countryCode) return [];
    const formattedCode = formatReferenceCode(countryCode);
    return cities.filter(city => formatReferenceCode(city.CountryID) === formattedCode);
  };

  // ---- Load Reference Data ----
  const loadReferenceData = async () => {
    try {
      setLoading(true);
      const offcode = credentials?.offcode || "1010";

      const [
        deptRes,
        desigRes,
        allowRes,
        deductRes,
        countryRes,
        cityRes,
        bankRes,
        locRes,
        gradeRes,
        shiftRes,
        jobRes,
        optionRes
      ] = await Promise.allSettled([
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSDepartment",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSDesignation",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSAllowanceType",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSDeductionType",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "Country",
            usePagination: false
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "Cities",
            usePagination: false
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSBank",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSLocation",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSGrade",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "HRMSShift",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "comOrgchart",
            usePagination: false,
            where: `IsActive='1' AND offcode='${offcode}'`
          })
        }),
        fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({
            tableName: "tbloption",
            usePagination: false
          })
        })
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value?.success) setDepartments(deptRes.value.rows || []);
      if (desigRes.status === 'fulfilled' && desigRes.value?.success) setDesignations(desigRes.value.rows || []);
      if (allowRes.status === 'fulfilled' && allowRes.value?.success) setAllowanceTypes(allowRes.value.rows || []);
      if (deductRes.status === 'fulfilled' && deductRes.value?.success) setDeductionTypes(deductRes.value.rows || []);
      if (countryRes.status === 'fulfilled' && countryRes.value?.success) setCountries(countryRes.value.rows || []);

      if (cityRes.status === 'fulfilled' && cityRes.value?.success) {
        const allCities = cityRes.value.rows || [];
        setCities(allCities);
        const citiesByCountry = {};
        allCities.forEach(city => {
          const countryId = formatReferenceCode(city.CountryID);
          if (countryId) {
            if (!citiesByCountry[countryId]) citiesByCountry[countryId] = [];
            citiesByCountry[countryId].push(city);
          }
        });
        setFilteredCities(citiesByCountry);
      }

      if (bankRes.status === 'fulfilled' && bankRes.value?.success) setBanks(bankRes.value.rows || []);
      if (locRes.status === 'fulfilled' && locRes.value?.success) setLocations(locRes.value.rows || []);
      if (gradeRes.status === 'fulfilled' && gradeRes.value?.success) setGrades(gradeRes.value.rows || []);
      if (shiftRes.status === 'fulfilled' && shiftRes.value?.success) setShifts(shiftRes.value.rows || []);
      if (jobRes.status === 'fulfilled' && jobRes.value?.success) setJobTitles(jobRes.value.rows || []);

      if (optionRes.status === 'fulfilled' && optionRes.value?.success) {
        const options = optionRes.value.rows || [];
        setGenders(options.filter(opt => opt.codetype === "GND"));
        setMaritalStatuses(options.filter(opt => opt.codetype === "EMARID"));
        setReligions(options.filter(opt => opt.codetype === "ERLG"));
        setContractTypes(options.filter(opt => opt.codetype === "ECT"));
        setSalaryModes(options.filter(opt => opt.codetype === "ESM"));
      }

      setEmployeePerDayTypes([
        { ccode: "1", cname: "Pay" },
        { ccode: "2", cname: "Piece Rate" }
      ]);

      await loadAllEmployees();

    } catch (err) {
      console.error("Error loading reference data:", err);
      setError("Failed to load reference data: " + err.message);
      showToast("Failed to load reference data", "error");
    } finally {
      setLoading(false);
    }
  };

  // ---- Load Table Headers ----
  const loadTableHeaders = async () => {
    const tables = [
      "HRMSEmployee",
      "HRMSEmployeeAcademicInfo",
      "HRMSEmployementHistory",
      "HRMSEmployeeGrantAllowance",
      "HRMSEmployeeGrantDeduction",
      "HRMSEmployeeFamilyDet"
    ];

    const headers = {};
    for (const table of tables) {
      try {
        const res = await fetchJson(`${API_BASE}/get-table-headers`, {
          method: "POST",
          body: JSON.stringify({ tableName: table })
        });
        if (res?.success) headers[table] = res.fields;
      } catch (err) {
        console.warn(`Failed to load headers for ${table}:`, err);
      }
    }
    setTableHeaders(headers);
  };

  // ---- Load Employees with Pagination ----
  const loadEmployees = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      let whereClause = "";

      if (selectedStatus && selectedStatus.ccode !== 'all' && selectedStatus.ccode !== -1) {
        whereClause = `EmploymentStatus = ${selectedStatus.ccode}`;
      } else if (activeFilter !== "all") {
        const isActive = activeFilter === "active" ? 1 : 0;
        whereClause = `IsActive = ${isActive}`;
      }

      const payload = {
        tableName: "HRMSEmployee",
        usePagination: true,
        page: page,
        limit: pageSize,
        where: whereClause,
        orderBy: "Code DESC"
      };

      const res = await fetchJson(`${API_BASE}/get-table-data`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        setEmployees(res.rows || []);
        setFilteredEmployees(res.rows || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.totalCount || 0);
        setCurrentPage(res.page || 1);

        if (res.rows) {
          const counts = {};
          res.rows.forEach(emp => {
            const status = emp.EmploymentStatus;
            counts[status] = (counts[status] || 0) + 1;
          });
          setStatusCounts(counts);
        }
      }
    } catch (err) {
      setError("Failed to load employees: " + err.message);
      showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  // ---- Refresh All Data ----
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await loadEmployees(currentPage);
      if (selectedEmployee) {
        await refreshAllTabData(selectedEmployee.Code);
      }
      showToast("Data refreshed successfully", "success");
    } catch (err) {
      showToast("Refresh failed: " + err.message, "error");
    } finally {
      setRefreshing(false);
    }
  };

  // ---- Refresh All Tab Data ----
  const refreshAllTabData = async (employeeCode) => {
    const tabs = ['academic', 'employment', 'allowances', 'deductions', 'family', 'attendance'];

    setTabData(prev => {
      const newState = { ...prev };
      tabs.forEach(tab => {
        newState[tab] = { ...newState[tab], loading: true };
      });
      return newState;
    });

    try {
      const promises = tabs.map(tab => loadTabData(tab, true));
      await Promise.all(promises);
    } catch (err) {
      console.error("Error refreshing tab data:", err);
    }
  };

  // ---- Load Tab Data ----
  // ---- Load Tab Data ----
  const loadTabData = async (tabName, forceRefresh = false) => {
    if (!selectedEmployee?.Code) return;

    const tableMap = {
      academic: "HRMSEmployeeAcademicInfo",
      employment: "HRMSEmployementHistory",
      allowances: "HRMSEmployeeGrantAllowance",
      deductions: "HRMSEmployeeGrantDeduction",
      family: "HRMSEmployeeFamilyDet",
      attendance: "HRMSEmployee" // Keep as HRMSEmployee for attendance settings
    };

    const tableName = tableMap[tabName];
    if (!tableName) return;

    if (!forceRefresh && tabData[tabName].loaded) return;
    if (tabData[tabName].loading) return;

    setTabData(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName],
        loading: true,
        error: null,
        lastRefreshed: new Date().toISOString()
      }
    }));

    try {
      let rows = [];

      if (tabName === "attendance") {
        // For attendance tab, we just load the employee's attendance settings
        const where = `Code = '${selectedEmployee.Code}'`;
        const res = await fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({ tableName, where, usePagination: false })
        });

        if (res?.success && res.rows && res.rows.length > 0) {
          // Store the employee data for attendance settings
          rows = [res.rows[0]];
        } else {
          // If no data found, create a default object with the employee code
          rows = [{ Code: selectedEmployee.Code }];
        }
      } else {
        // For other tabs, load their specific data
        const where = `Code = '${selectedEmployee.Code}'`;
        const res = await fetchJson(`${API_BASE}/get-table-data`, {
          method: "POST",
          body: JSON.stringify({ tableName, where, usePagination: false })
        });

        if (res?.success) {
          rows = res.rows || [];
        }
      }

      setTabData(prev => ({
        ...prev,
        [tabName]: {
          data: rows,
          loaded: true,
          loading: false,
          error: null,
          lastRefreshed: new Date().toISOString()
        }
      }));
    } catch (err) {
      console.error(`Error loading ${tabName} data:`, err);
      setTabData(prev => ({
        ...prev,
        [tabName]: { ...prev[tabName], loading: false, error: err.message }
      }));
      showToast(`Failed to load ${tabName} data`, "error");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "basic") loadTabData(tab);
  };

  // ---- Handle Status Change ----
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    if (status.ccode === 'all' || status.ccode === -1) {
      setActiveFilter('all');
    }
    loadEmployees(1);
  };

  // ---- Initial Load ----
  useEffect(() => {
    const init = async () => {
      try {
        await loadScreenConfig();
        await loadTableStructure();
        await loadReferenceData();
        await loadTableHeaders();
        await loadEmployees(1);
      } catch (err) {
        console.error("Initialization error:", err);
        showToast("Failed to initialize: " + err.message, "error");
      }
    };
    init();
  }, []);

  // Load status options for all employees in current view
  useEffect(() => {
    if (screenConfig?.id && employees.length > 0) {
      employees.forEach(emp => {
        if (!employeeStatusOptions[emp.Code]) {
          loadEmployeeStatusOptions(emp.Code, emp.EmploymentStatus);
        }
      });
    }
  }, [employees, screenConfig]);

  // Filter employees based on search term
  useEffect(() => {
    let filtered = employees;
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((item) =>
        ["Code", "Name", "FName", "LName"].some(
          (key) => item[key] && item[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    loadEmployees(1);
  };

  const generateNextCode = async () => {
    try {
      const res = await fetchJson(`${API_BASE}/get-table-data`, {
        method: "POST",
        body: JSON.stringify({ tableName: "HRMSEmployee", usePagination: false, orderBy: "Code DESC" })
      });

      if (res?.success && res.rows && res.rows.length > 0) {
        const codes = res.rows
          .map(e => {
            const code = e.Code?.toString();
            return (code && !isNaN(parseInt(code, 10))) ? parseInt(code, 10) : null;
          })
          .filter(c => c !== null);

        if (codes.length > 0) {
          const maxCode = Math.max(...codes);
          return (maxCode + 1).toString().padStart(5, '0');
        }
      }
      return "00001";
    } catch (err) {
      console.error("Error generating next code:", err);
      return "00001";
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setActiveTab("basic");
    setIsEditing(false);
    setEditMode("edit");

    const cnameMap = {
      1: "Active",
      2: "InActive",
      3: "Retire",
      4: "Suspend"
    };

    const currentCname = cnameMap[employee.EmploymentStatus] || "Active";

    if (screenConfig?.id) {
      loadDocumentStatuses(screenConfig.id, currentCname);
    }

    setTabData({
      academic: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
      employment: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
      allowances: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
      deductions: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
      family: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
      attendance: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null }
    });

    setEditState({
      academic: { editing: {}, newRows: [] },
      employment: { editing: {}, newRows: [] },
      allowances: { editing: {}, newRows: [] },
      deductions: { editing: {}, newRows: [] },
      family: { editing: {}, newRows: [] },
      attendance: { editing: {}, newRows: [] }
    });
  };

  const handleCloseDetails = () => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setFormData({});
  };

  const handleGeneratePDF = async () => {
    if (!selectedEmployee && !isEditing) {
      showToast("Please select an employee first", "error");
      return;
    }

    try {
      const tabsToLoad = ['academic', 'employment', 'allowances', 'deductions', 'family'];
      for (const tab of tabsToLoad) {
        if (!tabData[tab].loaded && !tabData[tab].loading) await loadTabData(tab);
      }

      const employeeData = {
        ...(selectedEmployee || formData),
        DepartmentName: getDepartmentName((selectedEmployee || formData).DepartmentCode),
        DesignationName: getDesignationName((selectedEmployee || formData).DesignationCode)
      };

      const relatedDataForPDF = {
        academic: tabData.academic.data,
        employment: tabData.employment.data,
        allowances: tabData.allowances.data.map(item => ({
          ...item,
          AllowanceName: getAllowanceName(item.AllowancesCode)
        })),
        deductions: tabData.deductions.data.map(item => ({
          ...item,
          DeductionName: getDeductionName(item.DeductionsCode)
        })),
        family: tabData.family.data
      };

      generatePDF(employeeData, relatedDataForPDF, {
        fileName: `Employee_${employeeData.Code}_${employeeData.Name || 'Report'}.pdf`
      });

      showToast("PDF generated successfully", "success");
    } catch (err) {
      showToast("Failed to generate PDF", "error");
    }
  };

  const handleDownloadPDF = () => {
    const fileName = `Employee_${selectedEmployee?.Code || formData?.Code || 'Report'}.pdf`;
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const truncateDataForColumns = (tableName, data) => {
    const headers = tableHeaders[tableName];
    if (!headers) return data;

    const truncated = { ...data };
    Object.keys(truncated).forEach(key => {
      const columnInfo = headers[key];
      if (columnInfo && columnInfo.type === "string" && columnInfo.maxLength) {
        const maxLength = parseInt(columnInfo.maxLength);
        if (maxLength > 0 && truncated[key] && truncated[key].length > maxLength) {
          truncated[key] = truncated[key].substring(0, maxLength);
        }
      }
    });
    return truncated;
  };

  const filterEmployeeData = (data) => {
    const filtered = { ...data };
    ['Name', 'FullName', 'DisplayName'].forEach(col => delete filtered[col]);
    ['createdby', 'createdate', 'createddate', 'editby', 'editdate', 'uid', 'rn', 'RN'].forEach(col => delete filtered[col]);

    Object.keys(filtered).forEach(key => {
      if (filtered[key] === "") filtered[key] = null;
    });
    return filtered;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "IDNo") {
      setFormData(prev => ({ ...prev, [name]: formatCNIC(value) }));
      return;
    }

    if (name === "IsActive") {
      setFormData(prev => ({ ...prev, [name]: checked, LeftDate: checked ? "" : prev.LeftDate }));
      return;
    }

    if (name === "P_Country" || name === "H_Country") {
      const cityField = name === "P_Country" ? "P_City" : "H_City";
      setFormData(prev => ({ ...prev, [name]: value, [cityField]: "" }));
      return;
    }

    const columnInfo = tableStructure[name];

    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (columnInfo && (columnInfo.type === "nvarchar" || columnInfo.type === "varchar") && columnInfo.maxLength) {
      const maxLength = parseInt(columnInfo.maxLength);
      if (maxLength > 0 && value.length > maxLength) {
        setFormData(prev => ({ ...prev, [name]: value.substring(0, maxLength) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTabEdit = (tabName, index) => {
    setEditState(prev => ({
      ...prev,
      [tabName]: { ...prev[tabName], editing: { ...prev[tabName].editing, [index]: true } }
    }));
  };

  const handleTabCancel = (tabName, index) => {
    setEditState(prev => ({
      ...prev,
      [tabName]: { ...prev[tabName], editing: { ...prev[tabName].editing, [index]: false } }
    }));
  };

  const handleTabNew = (tabName) => {
    setEditState(prev => ({
      ...prev,
      [tabName]: { ...prev[tabName], newRows: [...(prev[tabName].newRows || []), { tempId: Date.now() + Math.random() }] }
    }));
  };

  const handleTabInputChange = (tabName, index, field, value, isNew = false) => {
    if (isNew) {
      setEditState(prev => ({
        ...prev,
        [tabName]: {
          ...prev[tabName],
          newRows: prev[tabName].newRows.map((row, i) => i === index ? { ...row, [field]: value } : row)
        }
      }));
    } else {
      setTabData(prev => ({
        ...prev,
        [tabName]: {
          ...prev[tabName],
          data: prev[tabName].data.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }
      }));
      setEditState(prev => ({
        ...prev,
        [tabName]: { ...prev[tabName], editing: { ...prev[tabName].editing, [index]: true } }
      }));
    }
  };

  const saveTabRow = async (tabName, index, isNew = false) => {
    if (!selectedEmployee?.Code) {
      showToast("Please save the employee first before adding details", "error");
      return;
    }

    const tableMap = {
      academic: "HRMSEmployeeAcademicInfo",
      employment: "HRMSEmployementHistory",
      allowances: "HRMSEmployeeGrantAllowance",
      deductions: "HRMSEmployeeGrantDeduction",
      family: "HRMSEmployeeFamilyDet",
      attendance: "HRMSEmployee"
    };

    const tableName = tableMap[tabName];
    if (!tableName) return;

    setSavingTab(tabName);

    try {
      let rowData = isNew ? { ...editState[tabName].newRows[index] } : { ...tabData[tabName].data[index] };
      if (isNew) delete rowData.tempId;

      // Special handling for attendance tab (updating employee settings)
      if (tabName === "attendance") {
        // These are the fields that belong to attendance settings in HRMSEmployee table
        const attendanceSettingsFields = [
          'offdayBonusAllow',
          'AutoAttendanceAllow',
          'OverTimeAllow',
          'LateTimeAllow',
          'EarlyLateAllow',
          'HolyDayBonusAllow',
          'PunctuailityAllown',
          'EmployeeCommisionBonusActive',
          'EmployeeEarlyLateDeductionOnTimeActive',
          'EarlyLateNoofDeductionExempt',
          'NoOfDependant',
          'EmployeeCommisionBonusPer',
          'OTAllowedPerDay'
        ];

        // Filter only attendance setting fields
        const filteredData = {};
        attendanceSettingsFields.forEach(field => {
          if (rowData[field] !== undefined) {
            // Convert checkbox values to "True"/"False" strings for database
            if (typeof rowData[field] === 'boolean') {
              filteredData[field] = rowData[field] ? "True" : "False";
            } else if (typeof rowData[field] === 'string' &&
              (rowData[field].toLowerCase() === 'true' || rowData[field].toLowerCase() === 'false')) {
              filteredData[field] = rowData[field].charAt(0).toUpperCase() + rowData[field].slice(1).toLowerCase();
            } else {
              filteredData[field] = rowData[field];
            }
          }
        });

        // Add edit information
        filteredData.editby = credentials?.username || "admin";
        filteredData.editdate = new Date().toISOString().split('T')[0] + ' 00:00:00';

        // Update the employee record
        const where = { Code: selectedEmployee.Code };

        const res = await fetchJson(`${API_BASE}/table/update`, {
          method: "POST",
          body: JSON.stringify({
            tableName,
            data: filteredData,
            where
          })
        });

        if (res?.success) {
          await loadTabData(tabName, true);
          setEditState(prev => ({
            ...prev,
            [tabName]: { ...prev[tabName], editing: { ...prev[tabName].editing, [index]: false } }
          }));
          showToast("Attendance settings updated successfully", "success");
        } else {
          showToast("Save failed: " + (res.error || "Unknown error"), "error");
        }

        setSavingTab(null);
        return;
      }

      // For family tab
      if (tabName === "family") {
        if (!rowData.Name || rowData.Name.trim() === '') {
          showToast("Name is required for family member", "error");
          setSavingTab(null);
          return;
        }
        rowData.Name = rowData.Name.trim();
        rowData.Code = selectedEmployee.Code;

        if (rowData.DOB && rowData.DOB !== "") {
          try {
            const date = new Date(rowData.DOB);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              rowData.DOB = `${year}-${month}-${day} 00:00:00`;
            }
          } catch (e) {
            console.error("Error formatting DOB:", e);
          }
        }

        if (rowData.CNIC) {
          rowData.CNIC = rowData.CNIC.replace(/\D/g, '');
        }
      }

      // For other tabs (academic, employment, allowances, deductions)
      if (tabName !== "attendance" && tabName !== "family") {
        rowData.Code = selectedEmployee.Code;

        // Clean up system fields
        const systemFields = ['offcode', 'createdby', 'createdate', 'editby', 'editdate', 'uid', 'rn', 'RN', 'FullName', 'DisplayName'];
        systemFields.forEach(field => delete rowData[field]);

        // Convert empty strings to null
        Object.keys(rowData).forEach(key => {
          if (rowData[key] === "") {
            rowData[key] = null;
          }
        });
      }

      // Determine if this is an UPDATE or INSERT for non-attendance tabs
      let apiEndpoint = `${API_BASE}/table/insert`;
      let apiPayload = { tableName, data: rowData };

      const possiblePkFields = ['PK', 'Pk', 'pk', 'FamilyID', 'FamilyId', 'familyid', 'EHID', 'AcademicID', 'EmploymentID', 'AllowanceID', 'DeductionID'];
      const hasPk = possiblePkFields.some(field => rowData[field] !== undefined && rowData[field] !== null && rowData[field] !== '');

      if (!isNew && hasPk) {
        apiEndpoint = `${API_BASE}/table/update`;
        const pkField = Object.keys(rowData).find(k => possiblePkFields.includes(k)) || 'PK';
        const pkValue = rowData[pkField];
        const updateData = { ...rowData };
        delete updateData[pkField];
        apiPayload = { tableName, data: updateData, where: { [pkField]: pkValue } };
      } else {
        possiblePkFields.forEach(field => delete rowData[field]);
      }

      const res = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify(apiPayload)
      });

      if (res?.success) {
        await loadTabData(tabName, true);
        if (isNew) {
          setEditState(prev => ({
            ...prev,
            [tabName]: { ...prev[tabName], newRows: prev[tabName].newRows.filter((_, i) => i !== index) }
          }));
          showToast(`${tabName === 'family' ? 'Family member' : tabName} record added successfully`, "success");
        } else {
          setEditState(prev => ({
            ...prev,
            [tabName]: { ...prev[tabName], editing: { ...prev[tabName].editing, [index]: false } }
          }));
          showToast(`${tabName === 'family' ? 'Family member' : tabName} record updated successfully`, "success");
        }
      } else {
        showToast("Save failed: " + (res.error || "Unknown error"), "error");
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast(`Failed to save: ${err.message}`, "error");
    } finally {
      setSavingTab(null);
    }
  };

  const deleteTabRow = async (tabName, index) => {
    if (!selectedEmployee?.Code) return;
    if (!window.confirm(`Are you sure you want to delete this ${tabName === 'family' ? 'family member' : 'record'}?`)) return;

    const tableMap = {
      academic: "HRMSEmployeeAcademicInfo",
      employment: "HRMSEmployementHistory",
      allowances: "HRMSEmployeeGrantAllowance",
      deductions: "HRMSEmployeeGrantDeduction",
      family: "HRMSEmployeeFamilyDet",
      attendance: "HRMSEmployeeAttendanceSpec"
    };

    const tableName = tableMap[tabName];
    if (!tableName) return;

    setSavingTab(tabName);

    try {
      const rowData = tabData[tabName].data[index];
      const pkField = Object.keys(rowData).find(k =>
        ['pk', 'id', 'ehid', 'academicid', 'employmentid', 'allowanceid', 'deductionid', 'familyid', 'attendanceid'].includes(k.toLowerCase())
      ) || 'PK';

      const where = { [pkField]: rowData[pkField] };

      const res = await fetchJson(`${API_BASE}/table/delete`, {
        method: "POST",
        body: JSON.stringify({ tableName, where })
      });

      if (res?.success) {
        await loadTabData(tabName, true);
        showToast(`${tabName === 'family' ? 'Family member' : tabName} record deleted successfully`, "success");
      } else {
        showToast("Delete failed: " + (res.error || "Unknown error"), "error");
      }
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setSavingTab(null);
    }
  };

  const saveEmployee = async () => {
    try {
      setIsSaving(true);
      if (editMode === "new") {
        await insertNewEmployee();
      } else {
        await updateExistingEmployee();
      }
    } catch (err) {
      console.error("Save employee error:", err);
      showToast("Failed to save employee: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const insertNewEmployee = async () => {
    try {
      const headData = { ...formData };

      ['Name', 'FullName', 'DisplayName', 'pictureimg', 'pictureURL', 'image', 'photo', 'Picture',
        'createdate', 'createddate', 'editby', 'editdate', 'uid', 'rn', 'RN'].forEach(col => delete headData[col]);

      if (!headData.createdby) headData.createdby = credentials?.username || "admin";

      headData.BarCode = null;
      headData.BenifitCode = null;
      headData.CheckInState = null;
      headData.CheckOutState = null;
      headData.EOBINo = null;
      headData.IsEOBI = false;
      headData.SocialSecurityNo = null;
      headData.IsSocialSecuirty = false;
      headData.GrossPay = 0;
      headData.HRDocNo = null;
      headData.OTAllowedPerDay = 0;
      headData.Payscale = null;

      if (!headData.EmploymentStatus && selectedStatus) {
        headData.EmploymentStatus = selectedStatus.ccode;
      }

      const numericFields = [
        'ManagerCode', 'ContractType', 'EmploymentStatus', 'SalaryMode', 'BasicPay', 'GrossPay',
        'PerDayAvgCap', 'EarlyLateNoofDeductionExempt', 'NoOfDependant', 'MUID', 'EmployeePerDayType',
        'Gender', 'MarriadStatus', 'Nationality', 'Religin', 'DepartmentCode', 'DesignationCode',
        'GradeCode', 'ShiftCode', 'EmployeeLocationCode', 'DepartmentHead', 'Subtitute', 'CardNo',
        'MachineRegistrationNo', 'BankCode', 'EmployeeReplacementCode'
      ];

      numericFields.forEach(field => {
        if (headData[field] !== undefined && headData[field] !== null && headData[field] !== '') {
          const num = Number(headData[field]);
          headData[field] = !isNaN(num) ? num : 0;
        } else if (headData[field] === '') {
          headData[field] = null;
        }
      });

      const MAX_LENGTHS = {};
      Object.keys(tableStructure).forEach(key => {
        if (tableStructure[key]?.maxLength) MAX_LENGTHS[key] = parseInt(tableStructure[key].maxLength);
      });

      Object.keys(headData).forEach(key => {
        if (headData[key] && typeof headData[key] === 'string') {
          const maxLen = MAX_LENGTHS[key];
          if (maxLen && maxLen > 0 && headData[key].length > maxLen) {
            headData[key] = headData[key].substring(0, maxLen);
          }
        }
      });

      const booleanFields = [
        'IsActive', 'offdayBonusAllow', 'AutoAttendanceAllow', 'OverTimeAllow', 'LateTimeAllow',
        'EarlyLateAllow', 'HolyDayBonusAllow', 'PunctuailityAllown', 'EmployeeCommisionBonusActive',
        'EmployeeEarlyLateDeductionOnTimeActive', 'isManagerFilter', 'isUserFilter', 'IsEOBI',
        'IsSocialSecuirty', 'IsManual'
      ];

      booleanFields.forEach(field => {
        if (headData[field] !== undefined && headData[field] !== null) {
          headData[field] = headData[field] === true || headData[field] === 1 ||
            headData[field] === "true" || headData[field] === "True" || headData[field] === "1";
        }
      });

      const formatDateForBackend = (date) => {
        if (!date || date === "") return null;
        try {
          const d = new Date(date);
          return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] + ' 00:00:00' : null;
        } catch { return null; }
      };

      const dateFields = [
        'DOB', 'JoiningDate', 'AppointmentDate', 'IDExpiryDate', 'PassportExpiryDate',
        'ProbitionDate', 'ContractStartDate', 'ContractEndDate', 'LeftDate'
      ];

      dateFields.forEach(field => {
        headData[field] = headData[field] && headData[field] !== "" ? formatDateForBackend(headData[field]) : null;
      });

      if (headData.Code) headData.Code = formatEmployeeCode(headData.Code);

      const referenceFields = [
        'DepartmentCode', 'DesignationCode', 'BankCode', 'EmployeeLocationCode', 'GradeCode',
        'ShiftCode', 'JobTitle', 'Nationality', 'P_Country', 'H_Country', 'P_City', 'H_City',
        'Gender', 'MarriadStatus', 'Religin', 'ContractType', 'EmploymentStatus', 'SalaryMode',
        'EmployeePerDayType'
      ];

      referenceFields.forEach(field => {
        if (headData[field] && headData[field] !== null && headData[field] !== '') {
          headData[field] = formatReferenceCode(headData[field]);
        }
      });

      const employeeCodeFields = ['ManagerCode', 'DepartmentHead', 'Subtitute', 'EmployeeReplacementCode'];

      employeeCodeFields.forEach(field => {
        if (headData[field] && headData[field] !== null && headData[field] !== '') {
          headData[field] = formatEmployeeCode(headData[field]);
        }
      });

      ['offcode', 'bcode'].forEach(f => delete headData[f]);
      Object.keys(headData).forEach(key => { if (headData[key] === undefined) delete headData[key]; });

      const payload = {
        head: { tableName: "HRMSEmployee", data: headData },
        details: [],
        selectedBranch: "",
        companyData: { company: {} }
      };

      const res = await fetchJson(`${API_BASE}/insert-EmployeeHeadDet`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        setError(null);
        await loadEmployees(currentPage);
        setTimeout(async () => {
          await loadEmployees(currentPage);
          const newEmp = employees.find(e => e.Code === headData.Code);
          if (newEmp) {
            setSelectedEmployee(newEmp);
            setFormData(newEmp);
          }
        }, 500);
        setIsEditing(false);
        setEditMode("edit");
        showToast("Employee created successfully!", "success");
      } else {
        showToast("Insert failed: " + (res.error || "Unknown error"), "error");
      }
    } catch (err) {
      showToast("Insert failed: " + err.message, "error");
    }
  };

  const updateExistingEmployee = async () => {
    try {
      let employeeData = filterEmployeeData(formData);

      if (employeeData.IsActive === true) delete employeeData.LeftDate;
      if (employeeData.IsActive !== undefined) {
        employeeData.IsActive = employeeData.IsActive === true || employeeData.IsActive === "true" || employeeData.IsActive === 1;
      }

      if (!employeeData.Code) {
        showToast("Employee Code is required", "error");
        return;
      }

      const dateFields = [
        'DOB', 'JoiningDate', 'AppointmentDate', 'IDExpiryDate', 'PassportExpiryDate',
        'ProbitionDate', 'ContractStartDate', 'ContractEndDate', 'LeftDate'
      ];

      dateFields.forEach(field => {
        if (employeeData[field] && employeeData[field] !== "") {
          employeeData[field] = employeeData[field].includes('T')
            ? employeeData[field].split('T')[0] + ' 00:00:00'
            : employeeData[field];
        } else {
          employeeData[field] = null;
        }
      });

      if (employeeData.Code) employeeData.Code = formatEmployeeCode(employeeData.Code);

      const referenceFields = [
        'DepartmentCode', 'DesignationCode', 'BankCode', 'EmployeeLocationCode', 'GradeCode',
        'ShiftCode', 'JobTitle', 'Nationality', 'P_Country', 'H_Country', 'P_City', 'H_City',
        'Gender', 'MarriadStatus', 'Religin', 'ContractType', 'EmploymentStatus', 'SalaryMode',
        'EmployeePerDayType'
      ];

      referenceFields.forEach(field => {
        if (employeeData[field] && employeeData[field] !== null && employeeData[field] !== '') {
          employeeData[field] = formatReferenceCode(employeeData[field]);
        }
      });

      const employeeCodeFields = ['ManagerCode', 'DepartmentHead', 'Subtitute', 'EmployeeReplacementCode'];

      employeeCodeFields.forEach(field => {
        if (employeeData[field] && employeeData[field] !== null && employeeData[field] !== '') {
          employeeData[field] = formatEmployeeCode(employeeData[field]);
        }
      });

      employeeData.editby = credentials?.username || "admin";
      employeeData.editdate = new Date().toISOString().split('T')[0] + ' 00:00:00';

      employeeData = truncateDataForColumns("HRMSEmployee", employeeData);

      const where = { Code: employeeData.Code };
      const updateData = { ...employeeData };
      delete updateData.Code;
      ['offcode', 'bcode'].forEach(f => delete updateData[f]);

      const res = await fetchJson(`${API_BASE}/table/update`, {
        method: "POST",
        body: JSON.stringify({ tableName: "HRMSEmployee", data: updateData, where })
      });

      if (res?.success) {
        setError(null);
        await loadEmployees(currentPage);
        setSelectedEmployee(employeeData);
        setFormData(employeeData);
        setIsEditing(false);
        setEditMode("edit");
        showToast("Employee updated successfully", "success");
      } else {
        showToast("Update failed: " + (res.error || "Unknown error"), "error");
      }
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    }
  };

  const handleNewEmployee = async () => {
    try {
      const nextCode = await generateNextCode();
      const today = getTodayDate();

      const defaultFormData = {
        Code: nextCode,
        FName: "", MName: "", LName: "", arName: "", FatherName: "",
        DOB: "", Gender: null, MarriadStatus: null, Nationality: null, Religin: null,
        IDNo: "", IDExpiryDate: "", PassportNo: "", PassportExpiryDate: "",
        Mobile: "", Email: "",
        P_Address: "", P_City: "", P_Provience: "", P_Country: "", P_PostalCode: "",
        P_ZipCode: "", P_Phone: "", P_Mobile: "", P_Email: "", P_ContactPerson: "",
        H_Address: "", H_City: "", H_Provience: "", H_Country: "", H_PostalCode: "",
        H_ZipCode: "", H_Phone: "", H_Mobile: "", H_Email: "", H_ContactPerson: "",
        DepartmentCode: null, DesignationCode: null, GradeCode: null, ShiftCode: null,
        EmployeeLocationCode: null, JobTitle: null, ManagerCode: 0, DepartmentHead: null,
        Subtitute: null, EmployeeReplacementCode: null,
        JoiningDate: today,
        AppointmentDate: "", ProbitionDate: "", ContractStartDate: "",
        ContractEndDate: "",
        LeftDate: "1900-01-01 00:00:00", // Set default LeftDate for new employees
        ContractType: 1, EmploymentStatus: 1, SalaryMode: 1,
        BasicPay: 0, GrossPay: 0, PerDayAvgCap: 0,
        BankCode: null, AccountNo: "", CardNo: null, MachineRegistrationNo: null,
        EOBINo: null, IsEOBI: false, SocialSecurityNo: null, IsSocialSecuirty: false, ProvidentFundNo: "",
        offdayBonusAllow: false, AutoAttendanceAllow: false, OverTimeAllow: false,
        LateTimeAllow: false, EarlyLateAllow: false, HolyDayBonusAllow: false,
        PunctuailityAllown: false, EarlyLateNoofDeductionExempt: 0, OTAllowedPerDay: 0,
        NoOfDependant: 0, EmployeeCommisionBonusActive: false, EmployeeCommisionBonusPer: 0,
        EmployeeEarlyLateDeductionOnTimeActive: false,
        IsActive: true, isManagerFilter: false, isUserFilter: false,
        createdby: credentials?.username || "admin",
        RefNo: null, Remarks: "", HRDocNo: null, BarCode: null, BenifitCode: null,
        CheckInState: null, CheckOutState: null, MainJobDuty: "", SecondryJobDuty: "",
        MUID: 0, MUserlogin: "", MUserpassword: "", pictureimg: null, pictureURL: null
      };

      setFormData(defaultFormData);
      setEditMode("new");
      setIsEditing(true);
      setSelectedEmployee(null);

      setTabData({
        academic: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
        employment: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
        allowances: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
        deductions: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
        family: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null },
        attendance: { data: [], loaded: false, loading: false, error: null, lastRefreshed: null }
      });

      setEditState({
        academic: { editing: {}, newRows: [] },
        employment: { editing: {}, newRows: [] },
        allowances: { editing: {}, newRows: [] },
        deductions: { editing: {}, newRows: [] },
        family: { editing: {}, newRows: [] },
        attendance: { editing: {}, newRows: [] }
      });

      showToast("Please fill in the employee details and click SAVE first", "info");
    } catch (err) {
      showToast("Failed to create new employee: " + err.message, "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(selectedEmployee || {});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadEmployees(page);
  };

  const getIconForField = (fieldName) => {
    const icons = {
      Code: <FaKey />, FName: <FaUserTie />, LName: <FaUserTie />,
      Email: <FaEnvelope />, Mobile: <FaPhone />, DOB: <FaCalendar />,
      Gender: <FaTransgender />, MarriadStatus: <FaRing />,
      Nationality: <FaFlag />, Religin: <FaHeart />, IDNo: <FaIdCard />,
      DepartmentCode: <FaBuilding />, DesignationCode: <FaUserTie />,
      BankCode: <FaUniversity />, AccountNo: <FaCreditCard />,
      P_Address: <FaMapMarker />, H_Address: <FaMapMarker />,
      BasicPay: <FaMoneyBillAlt />, CardNo: <FaQrcode />,
      JobTitle: <FaBriefcase />, GradeCode: <FaBriefcaseMedical />,
      P_Country: <FaGlobe />, H_Country: <FaGlobe />,
      P_City: <FaCity />, H_City: <FaCity />,
    };
    return icons[fieldName] || null;
  };

  const renderBasicTab = () => {
    // All sections - no submenus, everything shown together
    const sections = [
      {
        key: 'personal',
        title: "Personal Information",
        icon: <FaUserCircle />,
        fields: [
          { name: "Code", label: "Employee Code", disabled: true, colSpan: 1 },
          { name: "FName", label: "First Name", required: true, colSpan: 1 },
          { name: "MName", label: "Middle Name", colSpan: 1 },
          { name: "LName", label: "Last Name", colSpan: 1 },
          // { name: "arName", label: "Arabic Name", colSpan: 2 },
          { name: "FatherName", label: "Father's Name", colSpan: 2 },
          { name: "DOB", label: "Date of Birth", type: "date", colSpan: 1 },
          { name: "Gender", label: "Gender", type: "select", options: genders, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          { name: "MarriadStatus", label: "Marital Status", type: "select", options: maritalStatuses, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          { name: "Religin", label: "Religion", type: "select", options: religions, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          { name: "Nationality", label: "Nationality", type: "select", options: countries, valueKey: "CountryID", labelKey: "CountryName", colSpan: 1 },
          { name: "IDNo", label: "CNIC/NIC", placeholder: "12345-1234567-1", colSpan: 2 },
          { name: "IDExpiryDate", label: "ID Expiry", type: "date", colSpan: 1 },
          { name: "PassportNo", label: "Passport No", colSpan: 1 },
          { name: "PassportExpiryDate", label: "Passport Expiry", type: "date", colSpan: 1 },
          { name: "Mobile", label: "Mobile", colSpan: 1 },
          { name: "Email", label: "Email", type: "email", colSpan: 2 },
          { name: "P_Phone", label: "Phone", colSpan: 1 },
          { name: "NoOfDependant", label: "Number of Dependants", type: "number" },
         
          { name: "Remarks", label: "Remarks", type: "textarea", colSpan: 2 }
        ]
      },
      {
        key: 'address',
        title: "Address Information",
        icon: <FaHome />,
        fields: [
          { name: "P_Country", label: "Permanent Country", type: "select", options: countries, valueKey: "CountryID", labelKey: "CountryName", colSpan: 1 },
          { name: "P_City", label: "Permanent City", type: "select", options: formData.P_Country ? getCitiesByCountry(formData.P_Country) : [], valueKey: "CityID", labelKey: "CityName", dependsOn: "P_Country", colSpan: 1 },
          { name: "P_Provience", label: "Permanent Province", colSpan: 1 },
          { name: "P_Address", label: "Permanent Address", type: "textarea", colSpan: 3 },
          { name: "P_PostalCode", label: "Permanent Postal Code", colSpan: 1 },
          { name: "P_ContactPerson", label: "Permanent Contact Person", colSpan: 1 },
          { name: "H_Country", label: "Home Country", type: "select", options: countries, valueKey: "CountryID", labelKey: "CountryName", colSpan: 1 },
          { name: "H_City", label: "Home City", type: "select", options: formData.H_Country ? getCitiesByCountry(formData.H_Country) : [], valueKey: "CityID", labelKey: "CityName", dependsOn: "H_Country", colSpan: 1 },
          { name: "H_Provience", label: "Home Province", colSpan: 1 },
          { name: "H_Address", label: "Home Address", type: "textarea", colSpan: 3 },
          { name: "H_PostalCode", label: "Home Postal Code", colSpan: 1 },
          { name: "H_ContactPerson", label: "Home Contact Person", colSpan: 1 }
        ]
      },
      {
        key: 'employment',
        title: "Employment Information",
        icon: <FaBriefcaseIcon />,
        fields: [
          { name: "DepartmentCode", label: "Department", type: "select", options: departments, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "DesignationCode", label: "Designation", type: "select", options: designations, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "GradeCode", label: "Grade", type: "select", options: grades, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "ShiftCode", label: "Shift", type: "select", options: shifts, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "EmployeeLocationCode", label: "Location", type: "select", options: locations, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "JobTitle", label: "Job Title", type: "select", options: jobTitles, valueKey: "code", labelKey: "name", colSpan: 1 },
          { name: "ManagerCode", label: "Manager", type: "select", options: allEmployees, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "DepartmentHead", label: "Department Head", type: "select", options: allEmployees, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "Subtitute", label: "Substitute", type: "select", options: allEmployees, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "EmployeeReplacementCode", label: "Replacement", type: "select", options: allEmployees, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "JoiningDate", label: "Joining Date", type: "date", colSpan: 1 },
          { name: "AppointmentDate", label: "Appointment", type: "date", colSpan: 1 },
          { name: "ProbitionDate", label: "Probation", type: "date", colSpan: 1 },
          { name: "ContractStartDate", label: "Contract Start", type: "date", colSpan: 1 },
          { name: "ContractEndDate", label: "Contract End", type: "date", colSpan: 1 },
          { name: "CardNo", label: "Card No", colSpan: 1 },
          { name: "MachineRegistrationNo", label: "Machine Reg No", colSpan: 1 },
          // { name: "LeftDate", label: "Left Date", type: "date", disabled: formData.IsActive === true, colSpan: 1 },
          { name: "ContractType", label: "Contract Type", type: "select", options: contractTypes, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          // { name: "EmploymentStatus", label: "Status", type: "select", options: documentStatuses, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          { name: "SalaryMode", label: "Salary Mode", type: "select", options: salaryModes, valueKey: "ccode", labelKey: "cname", colSpan: 1 },
          { name: "BasicPay", label: "Basic Pay", type: "number", colSpan: 1 },
          { name: "PerDayAvgCap", label: "Per Day Cap", type: "number", colSpan: 1 },
          { name: "MainJobDuty", label: "Main Job Duty", type: "textarea", colSpan: 2 },
          { name: "EmployeePerDayType", label: "Pay Type", type: "select", options: employeePerDayTypes, valueKey: "ccode", labelKey: "cname", colSpan: 1 }
        ]
      },
      {
        key: 'bank',
        title: "Bank Details",
        icon: <FaUniversityIcon />,
        fields: [
          { name: "BankCode", label: "Bank", type: "select", options: banks, valueKey: "Code", labelKey: "Name", colSpan: 1 },
          { name: "AccountNo", label: "Account No", colSpan: 1 },

        ]
      },
      {
        key: 'system',
        title: "System Fields",
        icon: <FaCog />,
        fields: [
          { name: "IsActive", label: "Active", type: "checkbox", colSpan: 1 },
          { name: "isManagerFilter", label: "Manager Filter", type: "checkbox", colSpan: 1 },
          { name: "isUserFilter", label: "User Filter", type: "checkbox", colSpan: 1 },


        ]
      }
    ];

    // Filter sections based on active header (no submenus)
    const getVisibleSections = () => {
      if (activeHeader === 'personal') return sections.filter(s => s.key === 'personal');
      if (activeHeader === 'address') return sections.filter(s => s.key === 'address');
      if (activeHeader === 'employment') return sections.filter(s => s.key === 'employment');
      if (activeHeader === 'bank') return sections.filter(s => s.key === 'bank');
      if (activeHeader === 'system') return sections.filter(s => s.key === 'system');
      return sections;
    };

    const visibleSections = getVisibleSections();

    return (
      <div className="Employee-basic-info">
        {/* Header Navigation */}
        <div className="header-navigation">
          {headerSections.map(header => (
            <div key={header.key} className="header-item">
              <button
                className={`header-btn ${activeHeader === header.key ? 'active' : ''}`}
                onClick={() => handleHeaderClick(header.key)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {header.icon}
                  {header.title}
                </span>
                <FaChevronDown className={`header-arrow ${openHeader === header.key ? 'open' : ''}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Content Sections with IDs for scrolling */}
        {visibleSections.map((section) => (
          <div key={section.key} id={`section-${section.key}`} className="info-section">
            <div className="section-header">
              <div className="header-left">
                {section.icon}
                <h4>{section.title}</h4>
              </div>
            </div>

            <div className="form-grid">
              {section.fields.map(field => {
                const value = formData[field.name] !== undefined ? formData[field.name] : "";
                const maxLength = field.maxLength || getMaxLength(field.name);
                const colSpan = field.colSpan || 1;
                const style = { gridColumn: colSpan > 1 ? `span ${colSpan}` : 'auto' };

                if (!tableStructure[field.name] && !field.options && field.type !== "checkbox" && field.type !== "select") {
                  return null;
                }

                if (field.type === "checkbox") {
                  const isChecked = (val) => {
                    if (val === true) return true;
                    if (val === false) return false;
                    if (typeof val === 'string') {
                      return val.toLowerCase() === 'true';
                    }
                    return false;
                  };

                  const handleCheckboxChange = (e) => {
                    const { name, checked } = e.target;
                    const dbValue = checked ? "True" : "False";
                    const syntheticEvent = {
                      target: {
                        name: name,
                        value: dbValue,
                        type: 'checkbox',
                        checked: checked
                      }
                    };
                    handleInputChange(syntheticEvent);
                  };

                  return (
                    <div className="form-group checkbox-group" key={field.name} style={style}>
                      <label className="custom-checkbox-label">
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={isChecked(value)}
                          onChange={handleCheckboxChange}
                          disabled={!isEditing || field.disabled}
                          className="custom-checkbox-input"
                        />
                        <span className="custom-checkbox-box">
                          <span className="custom-checkbox-icon">✓</span>
                        </span>
                        <span className="custom-checkbox-text">{field.label}</span>
                      </label>
                      {field.required && <span className="required">*</span>}
                    </div>
                  );
                }

                if (field.type === "select") {
                  const options = field.options || [];
                  const isDisabled = !isEditing || field.disabled || (field.dependsOn && !formData[field.dependsOn]);

                  return (
                    <div className="form-group" key={field.name} style={style}>
                      <label>{field.label} {field.required && <span className="required">*</span>}</label>
                      {isEditing && !field.disabled ? (
                        <div className="input-with-icon">
                          {getIconForField(field.name)}
                          <select
                            name={field.name}
                            value={value || ""}
                            onChange={handleInputChange}
                            disabled={isDisabled}
                          >
                            <option value="">Select {field.label}</option>
                            {options.map(opt => {
                              const valueKey = field.valueKey || 'Code';
                              const labelKey = field.labelKey || 'Name';
                              let optValue = opt[valueKey];
                              let optLabel = opt[labelKey] || opt.name || opt.cname;

                              if (!optValue) {
                                optValue = opt.Code || opt.code || opt.ccode || opt.CityID || opt.CountryID;
                              }
                              if (!optLabel) {
                                optLabel = opt.Name || opt.name || opt.cname || opt.CityName || opt.CountryName;
                              }

                              return (
                                <option key={optValue || Math.random()} value={optValue}>
                                  {optLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <div className="info-value">
                          {field.name === "Gender" && getOptionName(genders, value)}
                          {field.name === "MarriadStatus" && getOptionName(maritalStatuses, value)}
                          {field.name === "Religin" && getOptionName(religions, value)}
                          {field.name === "ContractType" && getOptionName(contractTypes, value)}
                          {field.name === "EmploymentStatus" && getOptionName(documentStatuses, value)}
                          {field.name === "SalaryMode" && getOptionName(salaryModes, value)}
                          {field.name === "EmployeePerDayType" && getOptionName(employeePerDayTypes, value)}
                          {field.name === "Nationality" && getCountryName(value)}
                          {field.name === "P_Country" && getCountryName(value)}
                          {field.name === "H_Country" && getCountryName(value)}
                          {field.name === "P_City" && getCityName(value)}
                          {field.name === "H_City" && getCityName(value)}
                          {field.name === "DepartmentCode" && getDepartmentName(value)}
                          {field.name === "DesignationCode" && getDesignationName(value)}
                          {field.name === "BankCode" && getBankName(value)}
                          {field.name === "EmployeeLocationCode" && getLocationName(value)}
                          {field.name === "GradeCode" && getGradeName(value)}
                          {field.name === "ShiftCode" && getShiftName(value)}
                          {field.name === "JobTitle" && getJobTitleName(value)}
                          {(field.name === "ManagerCode" || field.name === "DepartmentHead" ||
                            field.name === "Subtitute" || field.name === "EmployeeReplacementCode") &&
                            getEmployeeName(value)}
                          {!value && ""}
                        </div>
                      )}
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div className="form-group" key={field.name} style={style}>
                      <label>{field.label} {field.required && <span className="required">*</span>}</label>
                      {isEditing && !field.disabled ? (
                        <div className="input-with-icon">
                          {getIconForField(field.name)}
                          <textarea
                            name={field.name}
                            value={value || ""}
                            onChange={handleInputChange}
                            rows="3"
                            maxLength={maxLength}
                            placeholder={field.placeholder || ""}
                            disabled={field.disabled}
                          />
                          {maxLength && (
                            <small className="char-counter">
                              {value?.length || 0}/{maxLength}
                            </small>
                          )}
                        </div>
                      ) : (
                        <div className="info-value">{value || ""}</div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="form-group" key={field.name} style={style}>
                    <label>{field.label} {field.required && <span className="required">*</span>}</label>
                    {isEditing && !field.disabled ? (
                      <div className="input-with-icon">
                        {getIconForField(field.name)}
                        <input
                          type={field.type === "date" ? "date" : field.type || "text"}
                          name={field.name}
                          value={field.type === "date" ? formatDateForInput(value) : value || ""}
                          onChange={handleInputChange}
                          maxLength={maxLength}
                          placeholder={field.placeholder || ""}
                          disabled={field.disabled}
                        />
                        {maxLength && field.type !== "date" && field.type !== "number" && (
                          <small className="char-counter">
                            {value?.length || 0}/{maxLength}
                          </small>
                        )}
                      </div>
                    ) : (
                      <div className="info-value">
                        {field.type === "date" ? formatDateForDisplay(value) : (value || "")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {(selectedEmployee?.createdby || formData.createdby) && (
          <div className="meta-info">
            <div className="meta-item">
              <strong>Created By:</strong> {selectedEmployee?.createdby || formData.createdby}
            </div>
            <div className="meta-item">
              <strong>Created Date:</strong> {formatDateForDisplay(selectedEmployee?.createdate || selectedEmployee?.createddate || formData.createdate || formData.createddate)}
            </div>
            {(selectedEmployee?.editby || formData.editby) && (
              <>
                <div className="meta-item">
                  <strong>Modified By:</strong> {selectedEmployee?.editby || formData.editby}
                </div>
                <div className="meta-item">
                  <strong>Modified Date:</strong> {formatDateForDisplay(selectedEmployee?.editdate || formData.editdate)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Status Change Modal Component
  const StatusChangeModal = () => {
    if (!showStatusModal) return null;

    const statusName = pendingStatusChange?.cname || "";
    const isActive = pendingStatusChange?.ccode === 1;
    const isInactiveOrRetire = pendingStatusChange?.ccode === 2 || pendingStatusChange?.ccode === 3;

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>Confirm Status Change</h3>
            <button
              className="modal-close"
              onClick={() => {
                setShowStatusModal(false);
                setPendingStatusChange(null);
                setPendingEmployeeCode(null);
              }}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to change employee status to <strong>{statusName}</strong>?</p>

            {isActive && (
              <div className="modal-field">
                <label htmlFor="joiningDate">Joining Date:</label>
                <input
                  type="date"
                  id="joiningDate"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  required
                />
              </div>
            )}

            {isInactiveOrRetire && (
              <div className="modal-field">
                <label htmlFor="leftDate">Left Date:</label>
                <input
                  type="date"
                  id="leftDate"
                  value={leftDate}
                  onChange={(e) => setLeftDate(e.target.value)}
                  required
                />
              </div>
            )}

            {!isActive && !isInactiveOrRetire && (
              <p>No date changes required for this status change.</p>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="modal-btn cancel"
              onClick={() => {
                setShowStatusModal(false);
                setPendingStatusChange(null);
                setPendingEmployeeCode(null);
              }}
            >
              Cancel
            </button>
            <button
              className="modal-btn confirm"
              onClick={confirmStatusChange}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while rights are loading
  if (rightsLoading && !menuId) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading user rights...</p>
      </div>
    );
  }

  return (
    <div className="employee-management">
      {error && <div className="error-message">{error}</div>}
      {rightsError && <div className="error-message">Rights Error: {rightsError}</div>}
      {pdfError && <div className="error-message">PDF Error: {pdfError}</div>}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {selectedEmployee || isEditing ? (
        <div className="employee-details">

          <div className="details-header">
            <h3>
              {isEditing ? (editMode === "new" ? "New Employee" : "Edit Employee") : "Employee Details"}
              {formData?.FName && ` - ${formData.FName} ${formData.LName || ''}`}
            </h3>
            <div className="header-actions">
              {/* Show buttons for both existing employee and new employee */}
              {isEditing ? (
                // Edit mode (both for existing and new employee)
                <>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
                    <FaTimes /> Cancel
                  </button>
                  <button className="btn-save" onClick={saveEmployee} disabled={isSaving}>
                    {isSaving ? <FaSpinner className="spinner" /> : <FaSave />}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : selectedEmployee ? (
                // View mode (only when not editing and employee selected)
                <>
                  {(!menuId || hasPermission(menuId, 'post')) && (
                    <StatusDropdown
                      statuses={employeeStatusOptions[selectedEmployee.Code] || []}
                      selectedStatus={
                        (employeeStatusOptions[selectedEmployee.Code] || []).find(
                          s => s.ccode === selectedEmployee.EmploymentStatus
                        ) || {
                          ccode: selectedEmployee.EmploymentStatus,
                          cname: getEmploymentStatusInfo(selectedEmployee.EmploymentStatus).name
                        }
                      }
                      onStatusChange={(status) => handleStatusChangeWithConfirmation(selectedEmployee.Code, status)}
                      disabled={
                        isLoadingConfig ||
                        (employeeStatusOptions[selectedEmployee.Code] || []).length === 0
                      }
                    />
                  )}

                  {menuId && hasPermission(menuId, 'edit') && (
                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                      <FaEdit /> Edit
                    </button>
                  )}

                  {menuId && hasPermission(menuId, 'print') && (
                    <button
                      className="btn-pdf"
                      onClick={handleGeneratePDF}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <FaSpinner className="spinner" /> : <FaFilePdf />}
                      {isGenerating ? "Generating..." : "PDF"}
                    </button>
                  )}
                </>
              ) : null}

              {/* Close button always shows when there's a selected employee OR in edit mode (but not for new employee? Actually keep it for new employee too) */}
              {(selectedEmployee || isEditing) && (
                <button className="btn-close" onClick={handleCloseDetails}>
                  <FaTimes /> Close
                </button>
              )}
            </div>
          </div>
          <div className="tabs-container">
            <div className="tabs-scroll">
              <button
                className={`tab-btn ${activeTab === "basic" ? "active" : ""}`}
                onClick={() => handleTabChange("basic")}
              >
                <FaUsers /> Basic
              </button>
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
                  onClick={() => handleTabChange("attendance")}
                >
                  <FaClock /> Attendance
                </button>
              )}
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "academic" ? "active" : ""}`}
                  onClick={() => handleTabChange("academic")}
                >
                  <FaGraduationCap /> Education
                </button>
              )}
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "employment" ? "active" : ""}`}
                  onClick={() => handleTabChange("employment")}
                >
                  <FaBriefcase /> Employment
                </button>
              )}
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "allowances" ? "active" : ""}`}
                  onClick={() => handleTabChange("allowances")}
                >
                  <FaMoneyBill /> Allowances
                </button>
              )}
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "deductions" ? "active" : ""}`}
                  onClick={() => handleTabChange("deductions")}
                >
                  <FaMoneyCheck /> Deductions
                </button>
              )}
              {(!menuId || hasPermission(menuId, 'view')) && (
                <button
                  className={`tab-btn ${activeTab === "family" ? "active" : ""}`}
                  onClick={() => handleTabChange("family")}
                >
                  <FaUsers /> Family
                </button>
              )}
            </div>
          </div>

          <div className="tab-content">
            {activeTab === "basic" && renderBasicTab()}

            {activeTab === "academic" && (
              <Suspense fallback={<TabLoading />}>
                <AcademicTab
                  data={tabData.academic}
                  editState={editState.academic}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("academic", index)}
                  onCancel={(index) => handleTabCancel("academic", index)}
                  onNew={() => handleTabNew("academic")}
                  onSave={(index, isNew) => saveTabRow("academic", index, isNew)}
                  onDelete={(index) => deleteTabRow("academic", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("academic", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("academic", true)}
                  saving={savingTab === "academic"}
                />
              </Suspense>
            )}

            {activeTab === "employment" && (
              <Suspense fallback={<TabLoading />}>
                <EmploymentTab
                  data={tabData.employment}
                  editState={editState.employment}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("employment", index)}
                  onCancel={(index) => handleTabCancel("employment", index)}
                  onNew={() => handleTabNew("employment")}
                  onSave={(index, isNew) => saveTabRow("employment", index, isNew)}
                  onDelete={(index) => deleteTabRow("employment", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("employment", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("employment", true)}
                  saving={savingTab === "employment"}
                />
              </Suspense>
            )}

            {activeTab === "allowances" && (
              <Suspense fallback={<TabLoading />}>
                <AllowancesTab
                  data={tabData.allowances}
                  editState={editState.allowances}
                  allowanceTypes={allowanceTypes}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("allowances", index)}
                  onCancel={(index) => handleTabCancel("allowances", index)}
                  onNew={() => handleTabNew("allowances")}
                  onSave={(index, isNew) => saveTabRow("allowances", index, isNew)}
                  onDelete={(index) => deleteTabRow("allowances", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("allowances", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("allowances", true)}
                  saving={savingTab === "allowances"}
                />
              </Suspense>
            )}

            {activeTab === "deductions" && (
              <Suspense fallback={<TabLoading />}>
                <DeductionsTab
                  data={tabData.deductions}
                  editState={editState.deductions}
                  deductionTypes={deductionTypes}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("deductions", index)}
                  onCancel={(index) => handleTabCancel("deductions", index)}
                  onNew={() => handleTabNew("deductions")}
                  onSave={(index, isNew) => saveTabRow("deductions", index, isNew)}
                  onDelete={(index) => deleteTabRow("deductions", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("deductions", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("deductions", true)}
                  saving={savingTab === "deductions"}
                />
              </Suspense>
            )}

            {activeTab === "family" && (
              <Suspense fallback={<TabLoading />}>
                <FamilyTab
                  data={tabData.family}
                  editState={editState.family}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("family", index)}
                  onCancel={(index) => handleTabCancel("family", index)}
                  onNew={() => handleTabNew("family")}
                  onSave={(index, isNew) => saveTabRow("family", index, isNew)}
                  onDelete={(index) => deleteTabRow("family", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("family", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("family", true)}
                  saving={savingTab === "family"}
                />
              </Suspense>
            )}

            {activeTab === "attendance" && (
              <Suspense fallback={<TabLoading />}>
                <AttendanceSpecTab
                  data={tabData.attendance}
                  editState={editState.attendance}
                  isEditing={isEditing}
                  onEdit={(index) => handleTabEdit("attendance", index)}
                  onCancel={(index) => handleTabCancel("attendance", index)}
                  onNew={() => handleTabNew("attendance")}
                  onSave={(index, isNew) => saveTabRow("attendance", index, isNew)}
                  onDelete={(index) => deleteTabRow("attendance", index)}
                  onInputChange={(index, field, value, isNew) =>
                    handleTabInputChange("attendance", index, field, value, isNew)
                  }
                  onRefresh={() => loadTabData("attendance", true)}
                  saving={savingTab === "attendance"}
                />
              </Suspense>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Code, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-actions">
              {(!menuId || hasPermission(menuId, 'add')) && (
                <button className="btn-new" onClick={handleNewEmployee}>
                  <FaPlus /> New Employee
                </button>
              )}
            </div>
          </div>

          <div className="list-container">
            {loading ? (
              <div className="loading-container">
                <FaSpinner className="spinner" />
                <p>Loading employees...</p>
              </div>
            ) : (
              <>
                <div className="list-header">
                  <div className="header-cell">Code</div>
                  <div className="header-cell">Name</div>
                  <div className="header-cell">Department</div>
                  <div className="header-cell">Designation</div>
                  <div className="header-cell">Basic Pay</div>
                  <div className="header-cell">Status</div>
                </div>

                <div className="list-body">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((item) => {
                      const deptName = getDepartmentName(item.DepartmentCode);
                      const desigName = getDesignationName(item.DesignationCode);
                      const statusInfo = getEmploymentStatusInfo(item.EmploymentStatus);

                      return (
                        <div key={item.Code} className="list-row" onClick={() => handleEmployeeSelect(item)}>
                          <div className="row-cell">{item.Code}</div>
                          <div className="row-cell">{item.Name || `${item.FName || ''} ${item.LName || ''}`.trim()}</div>
                          <div className="row-cell">{deptName}</div>
                          <div className="row-cell">{desigName}</div>
                          <div className="row-cell">{formatMoney(item.BasicPay)}</div>
                          <div className="row-cell">
                            <span className={`status-badge ${statusInfo.name.toLowerCase()}`}>
                              {statusInfo.name}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-data">
                      {searchTerm || activeFilter !== "all" || selectedStatus
                        ? "No employees match your criteria"
                        : "No employee records found"}
                    </div>
                  )}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={totalRecords}
                  itemsPerPage={pageSize}
                  onPageChange={handlePageChange}
                  maxVisiblePages={5}
                  loading={loading}
                />
              </>
            )}
          </div>
        </>
      )}

      <StatusChangeModal />

      <PDFPreviewModal
        isOpen={showPdf}
        onClose={closePDF}
        pdfUrl={pdfUrl}
        title={`Employee Report - ${selectedEmployee?.Name || formData?.FName || 'Employee'}`}
        fileName={`Employee_${selectedEmployee?.Code || formData?.Code || 'Report'}.pdf`}
        onDownload={handleDownloadPDF}
      />
    </div>
  );
};

export default EmployeeManagement;