import React, { useState, useEffect, useContext, useRef } from "react";
import { Minus, Maximize2, Minimize2, X, Power } from "lucide-react";
import Logo from '../Assets/logo.png';
import API_BASE1 from "../config"
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import LogoutConfirm from "../components/LogoutConfirm";
import HRMSDepartment from "./HRMSFiles/HRMSDepartment";
import Portal from "./Portal";
import HRMSDesignation from "../components/HRMSFiles/HRMSDesignation";
import HRMSBank from "./HRMSFiles/HRMSBank";
import HRMSBenifit from "./HRMSFiles/HRMSBenifit";
// import Department from "../components/Department";
// import CashPaymentVoucher from "../components/Finance/CashPaymentVoucher";
// import BankPaymentVoucher from "../components/Finance/BankPaymentVoucher";
// import CashReceiptVoucher from "../components/Finance/CashReceiptVoucher";
// import BankReceiptVoucher from "../components/Finance/BankReceiptVoucher";
// import PayablesScreen from "../components/Finance/PayablesScreen";
// import ReceivablesScreen from "../components/Finance/ReceivablesScreen";
// import JournalVoucherManual from "../components/Finance/JournalVoucherManual";
import HRMSEmployeeType from "./HRMSFiles/HRMSEmployeeType";
import HRMSAllowanceType from "../components/HRMSFiles/HRMSAllowanceType";
import HRMSDeductionType from "./HRMSFiles/HRMSDeductionType";
import ShiftAndShiftTiming from "./HRMSFiles/ShiftAndShiftTiming";
import comReason from "../components/HRMSFiles/comReason";
import country from "../components/HRMSFiles/Country";
import cities from "../components/HRMSFiles/Cities";
import comVehicleType from "../components/HRMSFiles/comVehicleType";
import comTypeofCharges from "./HRMSFiles/comTypeofCharges";
import HRMSLocation from "./HRMSFiles/HRMSLocation";
import comCurrency from "./HRMSFiles/comCurrency";
import comUOM from "./HRMSFiles/comUOM";
import comProcess from "./HRMSFiles/comProcess";
import comProjects from "../components/HRMSFiles/comProjects";
import HRMSLoanType from "../components/HRMSFiles/HRMSLoanType";
import comtblDashboard from "./HRMSFiles/comtblDashboard";
import lndFloor from "./HRMSFiles/lndFloor";
import lndPaymentType from "./HRMSFiles/lndPaymentType";
import lndPlotCatagory from "./HRMSFiles/lndPlotCatagory";
import lndRelation from "./HRMSFiles/lndRelation";
import IMFThickness from "./HRMSFiles/IMFThickness";
import UserRights from "./BusinessAdministration/UserRights";
import Users from "./BusinessAdministration/Users";
import IMFColor from "./HRMSFiles/IMFColor";
// import IMFSize from "../components/HRMSFiles/IMFSize";
import acGroup from "./HRMSFiles/acGroup";
import lndFrequency from "../components/HRMSFiles/lndFrequency";
import HRMSEmployeeFile from "./MasterData/EmployeeFiles/EmployeeManagement";
// import GoodsReceiptNote from "../components/GoodsReceiptNote";
import ChartofAccount from "./MasterData/ChartofAccount";
import IMF from "./MasterData/IMF";
import CustomerSupplierProfile from "./MasterData/CustomerSupplierProfile";
import TransporterProfile from "./MasterData/TransporterProfile";
import WarehouseCodes from "./MasterData/WarehouseCodes";
import SalesManProfile from "./MasterData/SalesManProfile";
import CityProfile from "./MasterData/CityProfile";
import OrganizationalChart from "./MasterData/OrganizationalChart";
import LabourProfile from "./MasterData/LabourProfile";
import MonthlyVariableAllowance from "./Payroll/MonthlyVariableAllowance";
// import Vechiles from "../components/Vechiles";
import AttendanceMachines from "./MasterData/AttendanceMachines";
import AttendanceManagement from "./Payroll/AttendanceManagement";
// import BOMCreation from "./MRP/BOMCreation";
// import EInvoice from "../components/EInvioce";
import { FiMenu, FiChevronDown, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import {
  FaHome, FaChartLine, FaMoneyBillWave, FaUsers, FaCog, FaFileInvoiceDollar,
  FaBalanceScale, FaCashRegister, FaBook, FaShieldAlt, FaUserCog,
  FaDollarSign, FaShoppingCart, FaWarehouse, FaCogs, FaDatabase,
  FaUserShield, FaBuilding, FaUserCircle, FaSignOutAlt
} from "react-icons/fa";

import "./Dashboard.css";

const menuIcons = {
  "Dashboard": <FaHome />,
  "Reports": <FaChartLine />,
  "Finance Management": <FaMoneyBillWave />,
  "User Management": <FaUsers />,
  "Settings": <FaCog />,
  // "Invoices": <FaFileInvoiceDollar />,
  "Payments": <FaBalanceScale />,
  "Expenses": <FaCashRegister />,
  "Ledger": <FaBook />,
  "Security": <FaShieldAlt />,
  "User Roles": <FaUserCog />,
  // "Department": <FaUsers />,
  "Setup Data": <FaCog />,
  "HRMSDepartment": <FaBook />,
  "HRMSDesignation": <FaBook />,
  "HRMSBank": <FaBook />,
  "HRMSBenifit": <FaBook />,
  "CashPaymentVoucher": <FaBook />,
  "BankPaymentVoucher": <FaBook />,
  "CashReceiptVoucher": <FaBook />,
  "BankReceiptVoucher": <FaBook />,
  "JournalVoucherManual": <FaBook />,
  "PayablesScreen": <FaBook />,
  "ReceivablesScreen": <FaBook />,
  "HRMSEmployeeType": <FaBook />,
  "HRMSAllowanceType": <FaBook />,
  "HRMSDeductionType": <FaBook />,
  "ShiftAndShiftTiming": <FaBook />,
  "comCurrency": <FaBook />,
  "comReason": <FaBook />,
  "country": <FaBook />,
  "cities": <FaBook />,
  "HRMSLocation": <FaBook />,
  "comVehicleType": <FaBook />,
  "comTypeofCharges": <FaBook />,
  "comUOM": <FaBook />,
  "comProcess": <FaBook />,
  "comProjects": <FaBook />,
  "HRMSLoanType": <FaBook />,
  "comtblDashboard": <FaBook />,
  "lndFloor": <FaBook />,
  "lndPaymentType": <FaBook />,
  "lndPlotCatagory": <FaBook />,
  "lndRelation": <FaBook />,
  "IMFThickness": <FaBook />,
  "UserRights": <FaBook />,
  "Users": <FaBook />,
  "IMFColor": <FaBook />,
  "acGroup": <FaBook />,
  "IMFSize": <FaBook />,
  "lndFrequency": <FaBook />,
  "HRMSEmployeeFile": <FaBook />,
  "GoodsReceiptNote": <FaBook />,
  "ChartofAccount": <FaBook />,
  "IMF": <FaBook />,
  "CustomerSupplierProfile": <FaBook />,
  "TransporterProfile": <FaBook />,
   "WarehouseCodes": <FaBook />,
  "SalesManProfile": <FaBook />,
  "CityProfile": <FaBook />,
  "OrganizationalChart": <FaBook />,
  "AttendanceMachines": <FaBook />,
  "AttendanceManagement": <FaBook />,
  "BOMCreation": <FaBook />,
  "LabourProfile": <FaBook />,
    "MonthlyVariableAllowance": <FaBook />,
  "Vechiles": <FaBook />,
  // "E-Invoice": <FaFileInvoiceDollar />
};

function Dashboard() {
  const [data, setData] = useState({
    company: {},
    branches: [],
    menu: [],
    loading: true,
    error: null
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [expandedMenus, setExpandedMenus] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeMainMenu, setActiveMainMenu] = useState("");
  const [modalStack, setModalStack] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { credentials, logout: authLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const horizontalMenuRef = useRef(null);
  const [minimizedModals, setMinimizedModals] = useState([]);
  const [maximizedModal, setMaximizedModal] = useState(null);
  const [bouncingModal, setBouncingModal] = useState(null);
  const [modalStates, setModalStates] = useState({});

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  const handleOverlayClick = () => {
    setMobileMenuOpen(false);
  };

  // Effect hooks
  useEffect(() => {
    const handleBackButton = () => navigate("/login", { replace: true });
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = JSON.parse(localStorage.getItem("appData"));

        if (storedData) {
          setData({
            company: storedData.company,
            branches: storedData.branches,
            menu: storedData.menu,
            loading: false,
            error: null
          });
          if (storedData.branches.length) setSelectedBranch(storedData.branches[0].branch);

          // ✅ Dynamic tab title
          const appName = (storedData.company?.defaultApplicationName || "SMART_MIS").trim();
          const companyName = (storedData.company?.name || "").trim();
          document.title = `${appName} (${companyName})`;

          return;
        }

        if (credentials?.username && credentials?.password) {
          // Fetch all data
          const res = await fetch(`${API_BASE1}/GetMenu`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              userpassword: credentials.password,
              Menuid: "01",
              nooftables: "3"
            })
          });

          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.error || "Failed to fetch data");

          // Fetch company info separately
          const companyRes = await fetch(`${API_BASE1}/get-table-data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tableName: "comcompany" })
          });

          const companyResult = await companyRes.json();
          const companyInfo = companyResult.rows?.[0] || {};

          const newData = {
            company: companyInfo,
            branches: result.data.branches,
            menu: result.data.menu,
            loading: false,
            error: null
          };
          localStorage.setItem("appData", JSON.stringify(newData));
          setData(newData);

          if (result.data.branches.length) setSelectedBranch(result.data.branches[0].branch);

          // ✅ Set tab title safely
          const appName = (companyInfo.defaultApplicationName || "SMART_MIS").trim();
          const companyName = (companyInfo.compname || "").trim();
          document.title = `${appName} (${companyName})`;
        }
      } catch (err) {
        console.error(err);
        setData({
          company: {},
          branches: [],
          menu: [],
          loading: false,
          error: err.message
        });

        document.title = "SMART_MIS";
      }
    };

    loadData();
  }, [credentials]);


  // Menu filtering
  const mainMenuItems = [
    { name: "Finance Management", icon: <FaDollarSign /> },
    { name: "Sale", icon: <FaChartLine /> },
    { name: "Purchase System", icon: <FaShoppingCart /> },
    { name: "Inventory", icon: <FaWarehouse /> },
    { name: "Production", icon: <FaCogs /> },
    { name: "MRP", icon: <FaBook /> },
    { name: "Setup Data", icon: <FaCog /> },
    { name: "Master Data", icon: <FaDatabase /> },
    { name: "Payroll", icon: <FaDollarSign /> },

    { name: "Business Administration", icon: <FaUserShield /> },
    // { name: "E-Invoice", icon: <FaFileInvoiceDollar /> }
  ].filter(item => {
    if (item.name === "E-Invoice") return true;
    const match = data.menu.find(menu =>
      menu.title.trim().toLowerCase() === item.name.trim().toLowerCase() &&
      menu.parentId === "00"
    );
    return !!match;
  });

  // Auth functions
  const showLogoutConfirmation = () => setShowLogoutConfirm(true);
  const handleConfirmLogout = () => {
    localStorage.removeItem("appData");
    authLogout();
    navigate("/login", { replace: true });
  };
  const handleCancelLogout = () => setShowLogoutConfirm(false);

  // Modal management
  // Enhanced helper function to create consistent modal opening logic
  // Enhanced helper function to preserve state
  const createModalOpener = (modalType, props = {}) => {
    return (action = null, componentState = null, formData = null, editData = null) => {
      if (isModalAlreadyOpen(modalType)) {
        const existingMinimized = minimizedModals.find(modal => modal.type === modalType);
        if (existingMinimized) {
          setBouncingModal(existingMinimized.id);
          setTimeout(() => maximizeModal(existingMinimized.id), 500);
          return;
        }
        // If already active, bring to front
        const existingModalIndex = modalStack.findIndex(modal => modal.type === modalType);
        if (existingModalIndex !== -1) {
          const modal = modalStack[existingModalIndex];
          setModalStack(prev => [
            ...prev.filter((_, index) => index !== existingModalIndex),
            modal
          ]);
        }
        return;
      }

      const modalProps = action ?
        {
          mode: action,
          onClose: () => closeCurrentModal(),
          onBack: () => closeCurrentModal(),
          componentState,
          formData,
          editData
        } :
        {
          onClose: () => closeAllModals(),
          onDepartmentAction: openDepartmentModal,
          ...props,
          componentState,
          formData,
          editData
        };

      setModalStack(prev => [...prev, {
        type: modalType,
        props: modalProps
      }]);
    };
  };

  // Updated modal opening functions
  const openHRMSDepartmentModal = createModalOpener("HRMSDepartment");
  const openHRMSDesignationModal = createModalOpener("HRMSDesignation");
  const openHRMSBankModal = createModalOpener("HRMSBank");
  const openHRMSBenifitModal = createModalOpener("HRMSBenifit");
  const openCashPaymentVoucherModal = createModalOpener("CashPaymentVoucher");
  const openBankPaymentVoucherModal = createModalOpener("BankPaymentVoucher");
  const openCashReceiptVoucherModal = createModalOpener("CashReceiptVoucher");
  const openBankReceiptVoucherModal = createModalOpener("BankReceiptVoucher");
  const openPayablesScreenModal = createModalOpener("PayablesScreen");
  const openReceivablesScreenModal = createModalOpener("ReceivablesScreen");
  const openJournalVoucherManualModal = createModalOpener("JournalVoucherManual");
  const openHRMSEmployeeTypeModal = createModalOpener("HRMSEmployeeType");
  const openHRMSAllowanceTypeModal = createModalOpener("HRMSAllowanceType");
  const openHRMSDeductionTypeModal = createModalOpener("HRMSDeductionType");
  const openShiftAndShiftTimingTypeModal = createModalOpener("ShiftAndShiftTiming");
  const opencomCurrencyTypeModal = createModalOpener("comCurrency");
  const opencomReasonTypeModal = createModalOpener("comReason");
  const opencountryTypeModal = createModalOpener("country");
  const opencitiesTypeModal = createModalOpener("cities");
  const opencomVehicleTypeTypeModal = createModalOpener("comVehicleType");
  const opencomProcessTypeModal = createModalOpener("comProcess");
  const opencomTypeofChargesTypeModal = createModalOpener("comTypeofCharges");
  const openHRMSLocationTypeModal = createModalOpener("HRMSLocation");
  const opencomUOMTypeModal = createModalOpener("comUOM");
  const opencomProjectsTypeModal = createModalOpener("comProjects");
  const openHRMSLoanTypeTypeModal = createModalOpener("HRMSLoanType");
  const opencomtblDashboardTypeModal = createModalOpener("comtblDashboard");
  const openlndFloorTypeModal = createModalOpener("lndFloor");
  const openlndPaymentTypeTypeModal = createModalOpener("lndPaymentType");
  const openlndPlotCatagoryTypeModal = createModalOpener("lndPlotCatagory");
  const openlndRelationTypeModal = createModalOpener("lndRelation");
  const openIMFColorTypeModal = createModalOpener("IMFColor");
  const openacGroupTypeModal = createModalOpener("acGroup");
  const openlndFrequencyTypeModal = createModalOpener("lndFrequency");
  const openHRMSEmployeeFileTypeModal = createModalOpener("HRMSEmployeeFile");
  const openIMFSizeTypeModal = createModalOpener("IMFSize");
  const openIMFThicknessTypeModal = createModalOpener("IMFThickness");
  const openUserRightsTypeModal = createModalOpener("UserRights");
  const openUsersTypeModal = createModalOpener("Users");
  const openGoodsReceiptNoteTypeModal = createModalOpener("GoodsReceiptNote");
  const openChartofAccountTypeModal = createModalOpener("ChartofAccount");
  const openCustomerSupplierProfileTypeModal = createModalOpener("CustomerSupplierProfile");
  const openIMFTypeModal = createModalOpener("IMF");
  const openTransporterProfileTypeModal = createModalOpener("TransporterProfile");
  const openWarehouseCodesTypeModal = createModalOpener("WarehouseCodes");
  const openSalesManProfileTypeModal = createModalOpener("SalesManProfile");
  const openCityProfileTypeModal = createModalOpener("CityProfile");
  const openOrganizationalChartTypeModal = createModalOpener("OrganizationalChart");
  const openLabourProfileTypeModal = createModalOpener("LabourProfile");
  const openMonthlyVariableAllowanceTypeModal = createModalOpener("MonthlyVariableAllowance");
  const openVechilesTypeModal = createModalOpener("Vechiles");
  const openAttendanceMachinesTypeModal = createModalOpener("AttendanceMachines");
  const openAttendanceManagementTypeModal = createModalOpener("AttendanceManagement");
  const openBOMCreationTypeModal = createModalOpener("BOMCreation");

  // Special case for department modal (nested modal)
  const openDepartmentModal = (action) => {
    setModalStack(prev => [...prev, {
      type: "department",
      props: {
        mode: action,
        onClose: () => closeCurrentModal(),
        onBack: () => closeCurrentModal()
      }
    }]);
  };

  // Special case for E-Invoice (different props)
  // const openEInvoiceModal = () => {
  //   if (isModalAlreadyOpen("einvoice")) {
  //     const existingMinimized = minimizedModals.find(modal => modal.type === "einvoice");
  //     if (existingMinimized) {
  //       setBouncingModal(existingMinimized.id);
  //       setTimeout(() => maximizeModal(existingMinimized.id), 500);
  //       return;
  //     }
  //     const existingModalIndex = modalStack.findIndex(modal => modal.type === "einvoice");
  //     if (existingModalIndex !== -1) {
  //       const modal = modalStack[existingModalIndex];
  //       setModalStack(prev => [
  //         ...prev.filter((_, index) => index !== existingModalIndex),
  //         modal
  //       ]);
  //     }
  //     return;
  //   }

  //   setModalStack([{
  //     type: "einvoice",
  //     props: {
  //       onClose: () => closeAllModals(),
  //       branch: selectedBranch,
  //       username: credentials?.username
  //     }
  //   }]);
  // };

  const getModalTypeFromTitle = (title) => {
    const titleMap = {
      "Department": "HRMSDepartment",
      "Designation": "HRMSDesignation",
      "Bank": "HRMSBank",
      "Benifit Type": "HRMSBenifit",
      "Cash Payment Voucher": "CashPaymentVoucher",
      "Bank Payment Voucher": "BankPaymentVoucher",
      "Cash Receipt Voucher": "CashReceiptVoucher",
      "Bank Receipt Voucher": "BankReceiptVoucher",
      "Cash Pay Entry": "PayablesScreen",
      "Cash Receipt Entry": "ReceivablesScreen",
      "Journal Voucher": "JournalVoucherManual",
      "Employee Type": "HRMSEmployeeType",
      "Allowance Type": "HRMSAllowanceType",
      "Deduction Type": "HRMSDeductionType",
      "Shift & Shift Timing": "ShiftAndShiftTiming",
      "Currency Code": "comCurrency",
      "Rejection Reason Codes": "comReason",
      "Countries": "country",
      "Country wise Cities": "cities",
      "Vehicle Types": "comVehicleType",
      "Type of Charges": "comTypeofCharges",
      "Locations": "HRMSLocation",
      "Unit of Measurement": "comUOM",
      "Process": "comProcess",
      "Projects": "comProjects",
      "Loan Type": "HRMSLoanType",
      "DashBoard Creation": "comtblDashboard",
      "Payment Types": "lndPaymentType",
      "Floor Codes": "lndFloor",
      "Plot Categories": "lndPlotCatagory",
      "Relationship Types": "lndRelation",
      "ThickNess": "IMFThickness",
      "User Rights": "UserRights",
      "Users": "Users",
      "Color": "IMFColor",
      "Account Group .": "acGroup",
      "Land Frequency": "lndFrequency",
      "Employee Master File": "HRMSEmployeeFile",
      "Goods Receipt Note": "GoodsReceiptNote",
      "Chart Of Accounts": "ChartofAccount",
      "Item Profile": "IMF",
      "Customer/Supplier Profile": "CustomerSupplierProfile",
      "Transporter Profile": "TransporterProfile",
      "Warehouse Codes": "WarehouseCodes",
      "SalesMan Profile": "SalesManProfile",
      "City Profile": "CityProfile",
      "Organizational Chart": "OrganizationalChart",
      "Labour Profile": "LabourProfile",
      "Monthly Variable Allowance": "MonthlyVariableAllowance",
      "Vechiles": "Vechiles",
      "Attendance Machines": "AttendanceMachines",
      "Attendance": "AttendanceManagement",
      "BOM Creation": "BOMCreation",
      "Size": "IMFSize"
    };
    return titleMap[title] || title;
  };

  // Enhanced close functions
  const closeCurrentModal = () => {
    setModalStack(prev => prev.slice(0, -1));
    setMaximizedModal(null);
  };

  const closeAllModals = () => {
    setModalStack([]);
    setMaximizedModal(null);
    setBouncingModal(null);
  };
  // Menu functions
  const toggleMenu = (menuId) => {
    const clickedItem = data.menu.find(item => item.id === menuId);
    if (!clickedItem) return;

    const modalType = getModalTypeFromTitle(clickedItem.title);

    // Check if modal is already minimized
    const existingMinimizedModal = minimizedModals.find(modal => modal.type === modalType);
    if (existingMinimizedModal) {
      // Bounce effect and restore the minimized modal
      setBouncingModal(existingMinimizedModal.id);

      // Restore after bounce
      setTimeout(() => {
        maximizeModal(existingMinimizedModal.id);
      }, 500);
      return;
    }

    // Check if modal is already active
    if (isModalAlreadyOpen(modalType)) {
      // Bring to front if already active
      const existingModalIndex = modalStack.findIndex(modal => modal.type === modalType);
      if (existingModalIndex !== -1) {
        const modal = modalStack[existingModalIndex];
        setModalStack(prev => [
          ...prev.filter((_, index) => index !== existingModalIndex),
          modal
        ]);
      }
      return;
    }

    // Original modal opening logic
    if (clickedItem.title === "Department") {
      openHRMSDepartmentModal();
      return;
    }
    if (clickedItem.title === "Designation") {
      openHRMSDesignationModal();
      return;
    }

    if (clickedItem.title === "Department") {
      openHRMSDepartmentModal();
      return;
    }
    if (clickedItem.title === "Designation") {
      openHRMSDesignationModal();
      return;
    }
    if (clickedItem.title === "Bank") {
      openHRMSBankModal();
      return;
    }
    if (clickedItem.title === "Benifit Type") {
      openHRMSBenifitModal();
      return;
    }
    if (clickedItem.title === "Cash Payment Voucher") {
      openCashPaymentVoucherModal();
      return;
    }
    if (clickedItem.title === "Bank Payment Voucher") {
      openBankPaymentVoucherModal();
      return;
    }
    if (clickedItem.title === "Cash Receipt Voucher") {
      openCashReceiptVoucherModal();
      return;
    }
    if (clickedItem.title === "Cash Pay Entry") {
      openPayablesScreenModal();
      return;
    }
    if (clickedItem.title === "Cash Receipt Entry") {
      openReceivablesScreenModal();
      return;
    }
    if (clickedItem.title === "Bank Receipt Voucher") {
      openBankReceiptVoucherModal();
      return;
    }
    if (clickedItem.title === "Journal Voucher") {
      openJournalVoucherManualModal();
      return;
    }
    if (clickedItem.title === "Employee Type") {
      openHRMSEmployeeTypeModal();
      return;
    }
    if (clickedItem.title === "Allowance Type") {
      openHRMSAllowanceTypeModal();
      return;
    }
    if (clickedItem.title === "Deduction Type") {
      openHRMSDeductionTypeModal();
      return;
    }
    if (clickedItem.title === "Shift & Shift Timing") {
      openShiftAndShiftTimingTypeModal();
      return;
    }
    if (clickedItem.title === "Currency Code") {
      opencomCurrencyTypeModal();
      return;
    }
    if (clickedItem.title === "Rejection Reason Codes") {
      opencomReasonTypeModal();
      return;
    }
    if (clickedItem.title === "Countries") {
      opencountryTypeModal();
      return;
    }
    if (clickedItem.title === "Country wise Cities") {
      opencitiesTypeModal();
      return;
    }
    if (clickedItem.title === "Vehicle Types") {
      opencomVehicleTypeTypeModal();
      return;
    }
    if (clickedItem.title === "Type of Charges") {
      opencomTypeofChargesTypeModal();
      return;
    }
    if (clickedItem.title === "Locations") {
      openHRMSLocationTypeModal();
      return;
    }
    if (clickedItem.title === "Unit of Measurement") {
      opencomUOMTypeModal();
      return;
    }
    if (clickedItem.title === "Process") {
      opencomProcessTypeModal();
      return;
    }
    if (clickedItem.title === "Projects") {
      opencomProjectsTypeModal();
      return;
    }
    if (clickedItem.title === "Loan Type") {
      openHRMSLoanTypeTypeModal();
      return;
    }
    if (clickedItem.title === "DashBoard Creation") {
      opencomtblDashboardTypeModal();
      return;
    }
    if (clickedItem.title === "Payment Types") {
      openlndPaymentTypeTypeModal();
      return;
    }
    if (clickedItem.title === "Floor Codes") {
      openlndFloorTypeModal();
      return;
    }
    if (clickedItem.title === "Plot Categories") {
      openlndPlotCatagoryTypeModal();
      return;
    }
    if (clickedItem.title === "Relationship Types") {
      openlndRelationTypeModal();
      return;
    }
    if (clickedItem.title === "ThickNess") {
      openIMFThicknessTypeModal();
      return;
    }
    if (clickedItem.title === "User Rights") {
      openUserRightsTypeModal();
      return;
    }
    if (clickedItem.title === "Users") {
      openUsersTypeModal();
      return;
    }
    if (clickedItem.title === "Color") {
      openIMFColorTypeModal();
      return;
    }
    if (clickedItem.title === "Account Group .") {
      openacGroupTypeModal();
      return;
    }
    if (clickedItem.title === "Land Frequency") {
      openlndFrequencyTypeModal();
      return;
    }
    if (clickedItem.title === "Employee Master File") {
      openHRMSEmployeeFileTypeModal();
      return;
    }
    if (clickedItem.title === "Goods Receipt Note") {
      openGoodsReceiptNoteTypeModal();
      return;
    }
    if (clickedItem.title === "Chart Of Accounts") {
      openChartofAccountTypeModal();
      return;
    }
    if (clickedItem.title === "Item Profile") {
      openIMFTypeModal();
      return;
    }
    if (clickedItem.title === "Customer/Supplier Profile") {
      openCustomerSupplierProfileTypeModal();
      return;
    }
    if (clickedItem.title === "Transporter Profile") {
      openTransporterProfileTypeModal();
      return;
    }
    if (clickedItem.title === "Warehouse Codes") {
      openWarehouseCodesTypeModal();
      return;
    }
    if (clickedItem.title === "SalesMan Profile") {
      openSalesManProfileTypeModal();
      return;
    }
    if (clickedItem.title === "City Profile") {
      openCityProfileTypeModal();
      return;
    }
    if (clickedItem.title === "Organizational Chart") {
      openOrganizationalChartTypeModal();
      return;
    }
    if (clickedItem.title === "Labour Profile") {
      openLabourProfileTypeModal();
      return;
    }
     if (clickedItem.title === "Monthly Variable Allowance") {
      openMonthlyVariableAllowanceTypeModal();
      return;
    }
    if (clickedItem.title === "Vechiles") {
      openVechilesTypeModal();
      return;
    }
    if (clickedItem.title === "Attendance Machines") {
      openAttendanceMachinesTypeModal();
      return;
    }
    if (clickedItem.title === "Attendance") {
      openAttendanceManagementTypeModal();
      return;
    }
    if (clickedItem.title === "BOM Creation") {
      openBOMCreationTypeModal();
      return;
    }
    if (clickedItem.title === "Size") {
      openIMFSizeTypeModal();
      return;
    }
    const parentId = clickedItem?.parentId;
    setExpandedMenus(prev => {
      const updated = { ...prev };
      data.menu.forEach(item => {
        if (item.parentId === parentId && item.id !== menuId) {
          updated[item.id] = false;
        }
      });
      updated[menuId] = !prev[menuId];
      return updated;
    });
  };

  const closeMinimizedModal = (modalId, e) => {
    if (e) e.stopPropagation(); // Prevent triggering restore
    setMinimizedModals(prev => prev.filter(modal => modal.id !== modalId));
    setBouncingModal(null);
  };
  const isModalAlreadyOpen = (modalType) => {
    const isActive = modalStack.some(modal => modal.type === modalType);
    const isMinimized = minimizedModals.some(modal => modal.type === modalType);
    return isActive || isMinimized;
  };

  // Enhanced minimize function with simple state preservation
  const minimizeModal = (modalType) => {
    const currentModal = modalStack[modalStack.length - 1];
    if (currentModal && currentModal.type === modalType) {

      // Store the current modal state
      const modalState = {
        ...currentModal.props,
        timestamp: Date.now(),
        // Store any additional state you want to preserve
        searchTerm: "", // These will be populated by the component
        currentPage: 1,
        formData: {},
        isEditing: false
      };

      // Update modal states
      setModalStates(prev => ({
        ...prev,
        [modalType]: modalState
      }));

      setMinimizedModals(prev => [...prev, {
        ...currentModal,
        id: Date.now(),
        wasMaximized: maximizedModal === modalType,
        modalType: modalType
      }]);

      setMaximizedModal(null);
      closeCurrentModal();
    }
  };

  // Enhanced maximize function
  const maximizeModal = (modalId) => {
    const modalToRestore = minimizedModals.find(modal => modal.id === modalId);
    if (modalToRestore) {
      const existingModalIndex = modalStack.findIndex(modal => modal.type === modalToRestore.modalType);
      if (existingModalIndex !== -1) {
        setModalStack(prev => prev.filter((_, index) => index !== existingModalIndex));
      }

      // Get the preserved state
      const preservedState = modalStates[modalToRestore.modalType] || {};

      setModalStack(prev => [...prev, {
        type: modalToRestore.modalType,
        props: {
          ...preservedState,
          // Ensure essential functions are preserved
          onClose: preservedState.onClose || (() => closeAllModals()),
          onBack: preservedState.onBack || (() => closeCurrentModal()),
          // Pass the preserved state to the component
          preservedState: preservedState
        }
      }]);

      if (modalToRestore.wasMaximized) {
        setMaximizedModal(modalToRestore.modalType);
      }

      setMinimizedModals(prev => prev.filter(modal => modal.id !== modalId));
      setBouncingModal(null);
    }
  };
  const toggleMaximize = () => {
    if (modalStack.length > 0) {
      const currentModalType = modalStack[modalStack.length - 1].type;
      setMaximizedModal(prev => prev === currentModalType ? null : currentModalType);
    }
  };

  const closeModalHandler = () => {
    closeAllModals();
    setMaximizedModal(null);
  };

  const getIconForMenu = (title) => menuIcons[title] || <FaFileInvoiceDollar />;

  const renderMenuTree = (parentId, level = 0) => {
    return data.menu
      .filter(item => item.parentId === parentId)
      .map(item => {
        const children = data.menu.filter(child => child.parentId === item.id);
        const isExpanded = expandedMenus[item.id];
        return (
          <div key={item.id} className={`menu-parent level-${level}`}>
            <div
              className={`menu-item ${isExpanded ? "active" : ""}`}
              onClick={() => toggleMenu(item.id)}
            >
              {!sidebarCollapsed && (
                <>
                  <span className="menu-title">{item.title}</span>
                  {children.length > 0 && (
                    <span className="dropdown-arrow">
                      {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                    </span>
                  )}
                </>
              )}
            </div>
            {children.length > 0 && isExpanded && !sidebarCollapsed && (
              <div className={`submenu level-${level}`}>
                {renderMenuTree(item.id, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  const getRootId = () => {
    if (!activeMainMenu) return null;
    const match = data.menu.find(item =>
      item.title.trim().toLowerCase() === activeMainMenu.trim().toLowerCase() &&
      item.parentId === "00"
    );
    return match ? match.id : null;
  };

  // Modal rendering
  const renderModal = () => {
    if (modalStack.length === 0) return null;

    const currentModal = modalStack[modalStack.length - 1];
    const isMaximized = maximizedModal === currentModal.type;
    let ModalComponent;

    switch (currentModal.type) {
      case "HRMSDepartment":
        ModalComponent = HRMSDepartment;
        break;
      case "HRMSDesignation":
        ModalComponent = HRMSDesignation;
        break;
      case "HRMSBank":
        ModalComponent = HRMSBank;
        break;
      case "HRMSBenifit":
        ModalComponent = HRMSBenifit;
        break;
      // case "department":
      //   ModalComponent = Department;
      //   break;
      // case "CashPaymentVoucher":
      //   ModalComponent = CashPaymentVoucher;
      //   break;
      // case "BankPaymentVoucher":
      // ModalComponent = BankPaymentVoucher;
      // break;
      // case "CashReceiptVoucher":
      // ModalComponent = CashReceiptVoucher;
      // break;
      // case "BankReceiptVoucher":
      // ModalComponent = BankReceiptVoucher;
      // break;
      //  case "PayablesScreen":
      // ModalComponent = PayablesScreen;
      // break;
      //  case "ReceivablesScreen":
      // ModalComponent = ReceivablesScreen;
      // break;
      // case "JournalVoucherManual":
      // ModalComponent = JournalVoucherManual;
      // break;
      case "HRMSEmployeeType":
        ModalComponent = HRMSEmployeeType;
        break;
      case "HRMSAllowanceType":
        ModalComponent = HRMSAllowanceType;
        break;
      case "HRMSDeductionType":
        ModalComponent = HRMSDeductionType;
        break;
      case "ShiftAndShiftTiming":
        ModalComponent = ShiftAndShiftTiming;
        break;
      case "comCurrency":
        ModalComponent = comCurrency;
        break;
      case "comReason":
        ModalComponent = comReason;
        break;
      case "country":
        ModalComponent = country;
        break;
      case "cities":
        ModalComponent = cities;
        break;
      case "HRMSLocation":
        ModalComponent = HRMSLocation;
        break;
      case "comVehicleType":
        ModalComponent = comVehicleType;
        break;
      case "comTypeofCharges":
        ModalComponent = comTypeofCharges;
        break;
      case "comUOM":
        ModalComponent = comUOM;
        break;
      case "comProcess":
        ModalComponent = comProcess;
        break;
      case "comProjects":
        ModalComponent = comProjects;
        break;
      case "HRMSLoanType":
        ModalComponent = HRMSLoanType;
        break;
      case "comtblDashboard":
        ModalComponent = comtblDashboard;
        break;
      case "lndFloor":
        ModalComponent = lndFloor;
        break;
      case "lndPaymentType":
        ModalComponent = lndPaymentType;
        break;
      case "lndPlotCatagory":
        ModalComponent = lndPlotCatagory;
        break;
      case "lndRelation":
        ModalComponent = lndRelation;
        break;
      case "IMFThickness":
        ModalComponent = IMFThickness;
        break;
      case "UserRights":
        ModalComponent = UserRights;
        break;
      case "Users":
        ModalComponent = Users;
        break;
      case "IMFColor":
        ModalComponent = IMFColor;
        break;
      case "acGroup":
        ModalComponent = acGroup;
        break;
      case "lndFrequency":
        ModalComponent = lndFrequency;
        break;
      case "HRMSEmployeeFile":
        ModalComponent = HRMSEmployeeFile;
        break;
      // case "GoodsReceiptNote":
      //   ModalComponent = GoodsReceiptNote;
      //   break;
      // case "IMFSize":
      //   ModalComponent = IMFSize;
      //   break;
      case "ChartofAccount":
        ModalComponent = ChartofAccount;
        break;
      case "IMF":
        ModalComponent = IMF;
        break;
      case "TransporterProfile":
        ModalComponent = TransporterProfile;
        break;
      case "WarehouseCodes":
        ModalComponent = WarehouseCodes;
        break;
      case "SalesManProfile":
        ModalComponent = SalesManProfile;
        break;
      case "CityProfile":
        ModalComponent = CityProfile;
        break;
      case "OrganizationalChart":
        ModalComponent = OrganizationalChart;
        break;
      case "LabourProfile":
        ModalComponent = LabourProfile;
        break;
      case "MonthlyVariableAllowance":
        ModalComponent = MonthlyVariableAllowance;
        break;
      // case "Vechiles":
      //   ModalComponent = Vechiles;
      //   break;
      case "AttendanceMachines":
        ModalComponent = AttendanceMachines;
        break;
      case "AttendanceManagement":
        ModalComponent = AttendanceManagement;
        break;
      // case "BOMCreation":
      //   ModalComponent = BOMCreation;
      //   break;
      case "CustomerSupplierProfile":
        ModalComponent = CustomerSupplierProfile;
        break
      // case "einvoice":
      //   ModalComponent = EInvoice;
      //   break;
      default:
        return null;
    }

    return (
      <Portal portalId="active-modal-portal">
        <div className={`modal-overlay ${isMaximized ? 'maximized-overlay' : ''}`}>
          <div className={`hrms-modal-content ${isMaximized ? 'maximized' : ''}`}>
            {/* Top Bar Buttons */}
            <div className="modal-header-bar">
              <h2 className="hrms-modal-title">
                {getModalDisplayName(currentModal.type)}
                <div className="hrms-accent-line"></div>
              </h2>
              <div className="modal-actions">
                <a
                  className="window-btn minimize-btn"
                  onClick={() => minimizeModal(currentModal.type)}
                  title="Minimize"
                >
                  < Minus />
                </a>
                <a
                  className="window-btn maximize-btn"
                  onClick={toggleMaximize}
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 /> : < Maximize2 />}
                </a>
                <a
                  className="window-btn "
                  onClick={closeModalHandler}
                  title="Close"
                >
                  <X />
                </a>
              </div>
            </div>

            {/* Modal Content */}
            <div className="hrms-modal-body">
              <ModalComponent {...currentModal.props} />
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  const renderMinimizedModals = () => {
    if (minimizedModals.length === 0) return null;

    return (
      <Portal portalId="minimized-modals-portal">
        <div className="minimized-modals-container">
          {minimizedModals.map((modal) => (
            <div
              key={modal.id}
              className={`minimized-modal-tab ${bouncingModal === modal.id ? 'bouncing' : ''} ${modal.wasMaximized ? 'was-maximized' : ''}`}
              onClick={() => maximizeModal(modal.id)}
            >
              <span className="minimized-modal-title">
                {getModalDisplayName(modal.type)}
                {modal.wasMaximized && <span className="maximized-indicator"> ●</span>}
              </span>
              <div
                className="minimized-modal-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-minimized-btn"
                  onClick={(e) => closeMinimizedModal(modal.id, e)}
                  title="Close"
                >
                  <X />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Portal>
    );
  };
  // Helper function to get display names for modals
  const getModalDisplayName = (modalType) => {
    const nameMap = {
      'HRMSDepartment': 'Department ',
      'HRMSDesignation': 'Designation ',
      'HRMSBank': 'Bank ',
      'HRMSBenifit': 'Benefit Type ',
      'CashPaymentVoucher': 'Cash Payment Voucher',
      'BankPaymentVoucher': 'Bank Payment Voucherr',
      'CashReceiptVoucher': 'Cash Receipt Voucher',
      'BankReceiptVoucher': 'Bank Receipt Voucher',
      'PayablesScreen': 'Cash Pay Entry',
      'ReceivablesScreen': 'Cash Receipt Entry',
      'JournalVoucherManual': ' Journal Voucher',
      'HRMSEmployeeType': 'Employee Type ',
      'HRMSAllowanceType': 'Allowance Type ',
      'HRMSDeductionType': 'Deduction Type ',
      'ShiftAndShiftTiming': 'Shift ',
      'comCurrency': 'Currency ',
      'comReason': 'Reason Codes',
      'country': 'Countries',
      'cities': 'Cities ',
      'HRMSLocation': 'Location ',
      'comVehicleType': 'Vehicle Types',
      'comTypeofCharges': 'Type of Charges',
      'comUOM': 'Unit of Measurement',
      'comProcess': 'Process ',
      'comProjects': 'Projects ',
      'HRMSLoanType': 'Loan Type ',
      'comtblDashboard': 'Dashboard Creation',
      'lndFloor': 'Floor Codes',
      'lndPaymentType': 'Payment Types',
      'lndPlotCatagory': 'Plot Categories',
      'lndRelation': 'Relationship Types',
      'IMFThickness': 'Thickness ',
      'UserRights': 'User Rights ',
      'Users': 'Users ',
      'IMFColor': 'Color ',
      'acGroup': 'Account Group',
      'lndFrequency': 'Frequency ',
      'HRMSEmployeeFile': 'Employee Master File',
      'GoodsReceiptNote': 'Goods Receipt Note',
      'IMFSize': 'Size ',
      'ChartofAccount': 'Chart of Accounts',
      'IMF': 'Item Profile',
      'TransporterProfile': 'Transporter Profile',
      'WarehouseCodes': 'Warehouse Codes',
      'SalesManProfile': 'Salesman Profile',
      'CityProfile': 'City Profile',
      'OrganizationalChart': 'Organizational Chart',
      'LabourProfile': 'Labour Profile',
      'LabourProfile': 'Labour Profile',
      'MonthlyVariableAllowance': 'Monthly Variable Allowance ',
      'AttendanceMachines': 'Attendance Machines',
      'AttendanceManagement': 'Attendance',
      'BOMCreation': 'BOM Creation',
      'CustomerSupplierProfile': 'Customer/Supplier Profile',
      // 'einvoice': 'E-Invoice'
    };
    return nameMap[modalType] || modalType;
  };

  // Handle main menu click
  const handleMainMenuClick = (menuName) => {
    if (menuName === "E-Invoice") {
      // openEInvoiceModal();
      // setActiveMainMenu("E-Invoice"); // Keep E-Invoice as active menu
    } else {
      setActiveMainMenu(menuName);
      closeAllModals();
    }
    setMobileMenuOpen(false);
  };

  // Scroll horizontal menu
  const scrollMenu = (direction) => {
    if (horizontalMenuRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      horizontalMenuRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Main render
  return (
    <div className={`dashboard-container ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileMenuOpen ? "mobile-sidebar-open" : ""}`}>
      {showLogoutConfirm && (
        <LogoutConfirm
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}

      {renderModal()}
      {renderMinimizedModals()}
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={handleOverlayClick}
        />
      )}

      <div className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src={Logo} alt="Company Logo" className="logo-img" />
          </div>

          {!sidebarCollapsed && <h3>{data.company.name}</h3>}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <div className="sidebar-menu">
          {getRootId() ? renderMenuTree(getRootId()) : (
            <div className="menu-placeholder">
              {!sidebarCollapsed && <p>Select a menu from above</p>}
            </div>
          )}
        </div>

        {/* {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <button onClick={showLogoutConfirmation} className="logout-btn">
              <FaSignOutAlt className="logout-icon" />
              <span>Logout</span>
            </button>
          </div>
        )} */}
      </div>

      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <FiMenu />
            </button>
            <h2>Welcome to {data.company.name}</h2>
          </div>
          <div className="header-right">
            {data.branches.length > 0 && (
              <div className="branch-selector">
                <FaBuilding className="branch-icon" />
                <select
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  value={selectedBranch}
                  className="branch-select"
                >
                  {data.branches.map((b, i) => (
                    <option key={i} value={b.branch}>{b.branch}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="user-profile">
              <FaUserCircle className="user-icon" />
              <span>{credentials?.username || "User"}</span>
            </div>
            <button
              className="header-logout-btn"
              onClick={showLogoutConfirmation}
              title="Logout"
            >
              <Power />
            </button>
          </div>
        </header>

        <div className="horizontal-menu-container">

          <div className="horizontal-menu-scrollable" ref={horizontalMenuRef}>
            <div className="horizontal-menu-bar">
              {mainMenuItems.map((item, index) => (
                <div
                  key={index}
                  className={`horizontal-menu-item ${activeMainMenu === item.name ? 'active' : ''}`}
                  onClick={() => handleMainMenuClick(item.name)}
                >
                  <span className="horizontal-menu-icon">{item.icon}</span>
                  <span className="horizontal-menu-text">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="content-area">
          {data.loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading dashboard data...</p>
            </div>
          ) : data.error ? (
            <div className="error-container">
              <div className="error-icon">!</div>
              <p className="error-message">{data.error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <>
              {modalStack.length === 0 && (
                <div className="dashboard-content">
                  <div className="welcome-section">
                    <h3>Dashboard Overview</h3>
                    <p>You have selected branch: <strong>{selectedBranch}</strong></p>
                    <p>Logged in as: <strong>{credentials?.username}</strong></p>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon blue">
                        <FaChartLine />
                      </div>
                      <div className="stat-info">
                        <h4>Total Sales</h4>
                        <p>$24,560</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon green">
                        <FaUsers />
                      </div>
                      <div className="stat-info">
                        <h4>Active Users</h4>
                        <p>142</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon purple">
                        <FaFileInvoiceDollar />
                      </div>
                      <div className="stat-info">
                        <h4>Pending Invoices</h4>
                        <p>28</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon orange">
                        <FaShoppingCart />
                      </div>
                      <div className="stat-info">
                        <h4>New Orders</h4>
                        <p>56</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;