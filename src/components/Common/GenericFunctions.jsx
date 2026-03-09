import React, { useState, useCallback, useEffect } from "react";
import { X, Save } from "lucide-react";

// ✅ Create a hook for generic functionality
export const useGenericFunctions = (moduleConfig, API_BASE, credentials, itemsPerPage) => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [paginatedItems, setPaginatedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [customFilter, setCustomFilter] = useState("all");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMode, setPopupMode] = useState(null); // 'new' or 'edit'
    const [selectedItem, setSelectedItem] = useState(null);
    const [foreignData, setForeignData] = useState({
        countries: [],
        cities: []
    });

    // ✅ Helper to fetch JSON safely
    const fetchJson = async (url, options = {}) => {
        console.log(`🌐 Fetching: ${url}`);
        console.log(`📤 Request options:`, {
            method: options.method,
            headers: options.headers,
            body: options.body ? JSON.parse(options.body) : null
        });

        try {
            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                ...options,
            });

            console.log(`📡 Response status: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ HTTP error! status: ${res.status}`, errorText);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            console.log(`✅ Response data:`, data);
            return data;
        } catch (err) {
            console.error(`❌ Fetch error for ${url}:`, err);
            throw err;
        }
    };

    // ✅ Fetch foreign data (countries, cities, etc.)
    const fetchForeignData = async () => {
        try {
            const currentOffcode = credentials?.company?.offcode || '0101';

            // Fetch countries if needed
            if (moduleConfig.needsCountries) {
                const countriesData = await fetchJson(`${API_BASE}/get-table-data`, {
                    method: "POST",
                    body: JSON.stringify({
                        tableName: "country",
                        usePagination: false,
                        where: `offcode = '${currentOffcode}'`
                    }),
                });

                if (countriesData.success && countriesData.rows) {
                    const countryRows = countriesData.rows;
                    const activeCountries = countryRows.filter(country =>
                        country.IsActive === true ||
                        country.IsActive === "true" ||
                        country.IsActive === 1 ||
                        country.IsActive === "1"
                    );

                    setForeignData(prev => ({ ...prev, countries: activeCountries }));

                    // Update dropdown options in moduleConfig
                    if (moduleConfig.fields.dropdowns) {
                        const dropdownIndex = moduleConfig.fields.dropdowns.findIndex(d => d.name === "CountryID" || d.name === "CountryCode");
                        if (dropdownIndex !== -1) {
                            moduleConfig.fields.dropdowns[dropdownIndex].options = activeCountries.map(country => ({
                                value: country.CountryID,
                                label: country.CountryName
                            }));
                        }
                    }
                }
            }

            // Fetch cities if needed
            if (moduleConfig.needsCities) {
                const citiesData = await fetchJson(`${API_BASE}/get-table-data`, {
                    method: "POST",
                    body: JSON.stringify({
                        tableName: "cities",
                        usePagination: false,
                        where: `offcode = '${currentOffcode}'`
                    }),
                });

                if (citiesData.success && citiesData.rows) {
                    const cityRows = citiesData.rows;
                    const activeCities = cityRows.filter(city =>
                        city.IsActive === true ||
                        city.IsActive === "true" ||
                        city.IsActive === 1 ||
                        city.IsActive === "1"
                    );

                    setForeignData(prev => ({ ...prev, cities: activeCities }));

                    // Update dropdown options in moduleConfig for city dropdowns
                    if (moduleConfig.fields.dropdowns) {
                        const dropdownIndex = moduleConfig.fields.dropdowns.findIndex(d => d.name === "CityCode");
                        if (dropdownIndex !== -1) {
                            moduleConfig.fields.dropdowns[dropdownIndex].options = activeCities.map(city => ({
                                value: city.CityID,
                                label: city.CityName
                            }));
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch foreign data:", err);
        }
    };

    // ✅ Helper function to determine if a value represents "active"
    const isActiveValue = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value === true;
        if (typeof value === 'number') return value === 1;
        if (typeof value === 'string') {
            return value === "true" || value === "1" || value === "True" || value === "TRUE";
        }
        return false;
    };

    // ✅ Build WHERE clause for filters
    const buildWhereClause = () => {
        let conditions = [];

        // Add search condition
        if (searchTerm && searchTerm.trim() !== "") {
            const searchFields = moduleConfig.fields.basic || [];
            const searchConditions = searchFields.map(field => 
                `${field} LIKE '%${searchTerm}%'`
            );
            if (searchConditions.length > 0) {
                conditions.push(`(${searchConditions.join(" OR ")})`);
            }
        }

        // Add active filter
        if (moduleConfig.fields.hasActiveFilter && activeFilter !== "all") {
            // Find the active field name (usually IsActive, isActive, Isactive, etc.)
            const activeField = moduleConfig.fields.checkboxes?.find(f => 
                f.toLowerCase().includes('active')
            ) || "IsActive";
            
            const isActive = activeFilter === "active";
            conditions.push(`${activeField} = ${isActive ? 1 : 0}`);
        }

        // Add custom filter (like codetype for reason module)
        if (moduleConfig.fields.hasCustomFilter && customFilter !== "all") {
            conditions.push(`codetype = '${customFilter}'`);
        }

        return conditions.length > 0 ? conditions.join(" AND ") : "";
    };

    // ✅ Fetch items with server-side pagination and filtering
    const fetchItems = useCallback(async (page = 1, perPage = itemsPerPage) => {
        try {
            setLoading(true);
            const currentOffcode = credentials?.company?.offcode || '0101';

            const whereClause = buildWhereClause();

            const payload = {
                tableName: moduleConfig.tableName,
                page,
                limit: perPage,
                usePagination: true
            };

            // Add where clause if not empty
            if (whereClause) {
                payload.where = whereClause;
            }

            // Only add company offcode if the table has offcode field (not fixed with empty value)
            const hasFixedOffcode = moduleConfig.fields.fixed?.some(
                f => f.name.toLowerCase() === "offcode" && f.value === " "
            );
            
            if (!hasFixedOffcode) {
                payload.companyData = {
                    company: {
                        offcode: currentOffcode
                    }
                };
            }

            console.log("📤 Sending to get-table-data:", payload);

            const data = await fetchJson(`${API_BASE}/get-table-data`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            console.log("📥 Response from get-table-data:", {
                success: data.success,
                rowsCount: data.rows?.length || 0,
                totalCount: data.totalCount,
                page: data.page,
                totalPages: data.totalPages
            });

            if (data.success && data.rows) {
                setItems(data.rows);
                setFilteredItems(data.rows);
                setPaginatedItems(data.rows);
                setCurrentPage(page);
                setTotalItems(data.totalCount || 0);
                setTotalPages(data.totalPages || Math.ceil((data.totalCount || 1) / perPage));
                setError(null);

                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
            } else {
                console.error("❌ Server returned unsuccessful response:", data);
                setError(`Failed to load ${moduleConfig.formTitle.toLowerCase()} data: ${data.error || 'Unknown error'}`);
                setItems([]);
                setFilteredItems([]);
                setPaginatedItems([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("❌ Error fetching items:", err);
            setError(`Error: ${err.message}`);
            setItems([]);
            setFilteredItems([]);
            setPaginatedItems([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [moduleConfig.tableName, moduleConfig.fields, searchTerm, activeFilter, customFilter, 
        credentials?.company?.offcode, itemsPerPage, API_BASE, isInitialLoad]);

    // ✅ Initial data fetch
    useEffect(() => {
        // Fetch supporting data
        if (moduleConfig.needsCountries || moduleConfig.needsCities) {
            fetchForeignData();
        }

        // Initial data fetch
        fetchItems(1, itemsPerPage);
    }, []);

    // ✅ Handle search with debounce
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout for debouncing
        const timeout = setTimeout(() => {
            setCurrentPage(1);
            fetchItems(1, itemsPerPage);
        }, 500);

        setSearchTimeout(timeout);
    };

    // ✅ Handle filter changes
    const handleActiveFilterChange = (e) => {
        const value = e.target.value;
        setActiveFilter(value);
        setCurrentPage(1);
        fetchItems(1, itemsPerPage);
    };

    const handleCustomFilterChange = (e) => {
        const value = e.target.value;
        setCustomFilter(value);
        setCurrentPage(1);
        fetchItems(1, itemsPerPage);
    };

    // ✅ Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchItems(page, itemsPerPage);
    };

    // ✅ Helper to get next available code
    const fetchNextCodeFromServer = async () => {
        const codeField = moduleConfig.fields.basic?.[0] || "Code";

        const payload = {
            tableName: moduleConfig.tableName,
            usePagination: false
        };

        const data = await fetchJson(`${API_BASE}/get-table-data`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!data.success || !data.rows || data.rows.length === 0) {
            return "001";
        }

        const codes = data.rows
            .map(item => {
                const val = item[codeField];
                // Handle different formats
                if (typeof val === 'number') return val;
                if (typeof val === 'string') return parseInt(val, 10);
                return NaN;
            })
            .filter(n => !isNaN(n));

        if (codes.length === 0) return "001";

        const maxCode = Math.max(...codes);
        return (maxCode + 1).toString().padStart(3, "0");
    };

    // ✅ Handle new record
    const handleNew = async () => {
        const nextCode = await fetchNextCodeFromServer();

        const newFormData = {
            [moduleConfig.fields.basic?.[0]]: nextCode
        };

        if (moduleConfig.fields.checkboxes) {
            moduleConfig.fields.checkboxes.forEach(field => {
                newFormData[field] = field.toLowerCase().includes('active') ? true : false;
            });
        }

        setSelectedItem(newFormData);
        setPopupMode('new');
        setShowPopup(true);
        setError(null);
        setSuccessMessage(null);
    };

    // ✅ Open popup for editing item
    const handleEdit = (item) => {
        const formattedItem = {};
        const excludeFields = ['rn', '__rowNum__', 'rowIndex', 'key'];

        // Format item for form
        Object.keys(item).forEach(key => {
            // Skip non-database fields
            if (excludeFields.includes(key)) {
                return;
            }

            // Handle boolean/active fields
            if (moduleConfig.fields.checkboxes?.includes(key)) {
                formattedItem[key] = isActiveValue(item[key]);
            } else {
                formattedItem[key] = item[key] !== null && item[key] !== undefined ? item[key] : "";
            }
        });

        console.log("📝 Formatted item for edit:", formattedItem);
        setSelectedItem(formattedItem);
        setPopupMode('edit');
        setShowPopup(true);
        setError(null);
        setSuccessMessage(null);
    };

    // ✅ Close popup
    const handleClosePopup = () => {
        setShowPopup(false);
        setPopupMode(null);
        setSelectedItem(null);
        setError(null);
    };

    // ✅ Save using UPSERT endpoint
    const handleSave = async (formData) => {
        try {
            // Clear any previous messages
            setError(null);
            setSuccessMessage(null);

            // Validation
            const requiredFields = moduleConfig.fields.basic || [];
            for (const field of requiredFields) {
                if (!formData[field]?.toString().trim()) {
                    setError(`${field} is required`);
                    setTimeout(() => setError(null), 3000);
                    return false;
                }
            }

            const payloadData = {};
            const primaryKeyField = moduleConfig.fields.basic?.[0];

            // Build payload data - include ALL fields from formData
            Object.keys(formData).forEach(key => {
                // Skip fields that are fixed with empty values
                const isFixedEmpty = moduleConfig.fields.fixed?.some(
                    f => f.name === key && f.value === " " && f.disabled
                );

                if (isFixedEmpty) {
                    // For fixed fields with " " value, send empty string
                    payloadData[key] = "";
                    return;
                }

                // Handle number fields
                if (moduleConfig.fields.numbers?.includes(key)) {
                    const numValue = parseInt(formData[key] || "0", 10);
                    payloadData[key] = isNaN(numValue) ? 0 : numValue;
                }
                // Handle checkbox/boolean fields - convert to 1/0 for SQL Server
                else if (moduleConfig.fields.checkboxes?.includes(key)) {
                    payloadData[key] = isActiveValue(formData[key]) ? 1 : 0;
                }
                // Handle other fields
                else {
                    payloadData[key] = formData[key] !== null && formData[key] !== undefined ? formData[key] : "";
                }
            });

            // Debug log
            console.log("📤 Save Request Details:", {
                mode: popupMode,
                table: moduleConfig.tableName,
                primaryKeyField: primaryKeyField,
                primaryKeyValue: formData[primaryKeyField],
                payloadData: payloadData
            });

            // Use UPSERT endpoint for both insert and update
            const url = `${API_BASE}/table/upsert`;
            
            const payload = {
                tableName: moduleConfig.tableName,
                data: payloadData
            };

            console.log("📤 UPSERT Payload:", payload);

            const res = await fetchJson(url, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            console.log("📥 API Response:", res);

            if (res.success) {
                // Set success message
                const action = res.operation === 'update' ? 'updated' : 'created';
                const itemName = formData[moduleConfig.fields.basic?.[1] || primaryKeyField] || 'Item';
                const message = `${moduleConfig.formTitle} "${itemName}" ${action} successfully!`;
                setSuccessMessage(message);

                // Auto-close success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000);

                // Close popup
                handleClosePopup();

                // Refresh data
                await fetchItems(currentPage, itemsPerPage);

                return true;
            } else {
                const errorMsg = "❌ Operation failed: " + (res.error || JSON.stringify(res));
                setError(errorMsg);
                setTimeout(() => setError(null), 3000);
                return false;
            }
        } catch (err) {
            const errorMsg = "❌ Error: " + err.message;
            console.error("❌ Save error:", err);
            setError(errorMsg);
            setTimeout(() => setError(null), 3000);
            return false;
        }
    };

    return {
        // State
        items,
        filteredItems,
        paginatedItems,
        searchTerm,
        activeFilter,
        customFilter,
        error,
        loading,
        successMessage,
        currentPage,
        totalPages,
        totalItems,
        isInitialLoad,
        showPopup,
        popupMode,
        selectedItem,
        foreignData,
        // Functions
        fetchItems,
        handleSearchChange,
        handleActiveFilterChange,
        handleCustomFilterChange,
        handlePageChange,
        handleNew,
        handleEdit,
        handleClosePopup,
        handleSave,
        fetchForeignData,
        isActiveValue,
        // Setters
        setError,
        setSuccessMessage,
    };
};

// ✅ Export configuration function
export const getDefaultConfig = (type) => {
    const configs = {
        benefit: {
            tableName: "HRMSBenifit",
            title: "Benefit Management",
            formTitle: "Benefit",
            newButtonText: "New Benefit",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive"],
                hasActiveFilter: true
            }
        },
        employeetype: {
            tableName: "HRMSEmployeeType",
            title: "Employee Type Management",
            formTitle: "Employee Type",
            newButtonText: "New Employee Type",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive"],
                hasActiveFilter: true
            }
        },
        allowance: {
            tableName: "HRMSAllowanceType",
            title: "Allowance Type Management",
            formTitle: "Allowance Type",
            newButtonText: "New Allowance Type",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive", "isEmployeeGL", "IsDisable"],
                hasActiveFilter: true
            }
        },
        deduction: {
            tableName: "HRMSDeductionType",
            title: "Deduction Type Management",
            formTitle: "Deduction Type",
            newButtonText: "New Deduction Type",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive", "isEmployeeGL"],
                hasActiveFilter: true
            }
        },
        department: {
            tableName: "HRMSDepartment",
            title: "Department Management",
            formTitle: "Department",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive"],
                numbers: ["PayrollGrossPayAccount", "PayrollNetPayAccount"],
                hasActiveFilter: true
            }
        },
        designation: {
            tableName: "HRMSDesignation",
            title: "Designation Management",
            formTitle: "Designation",
            newButtonText: "New Designation",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive", "IsOverTimeAllow"],
                hasActiveFilter: true
            }
        },
        bank: {
            tableName: "HRMSBank",
            title: "Bank Management",
            formTitle: "Bank",
            newButtonText: "New Bank",
            searchPlaceholder: "Search by Code, Name or Short Name...",
            fields: {
                basic: ["Code", "Name"],
                texts: ["ShortName", "Address", "BranchManager"],
                dropdowns: [],
                checkboxes: ["IsActive"],
                hasActiveFilter: true
            },
            needsCountries: true,
            needsCities: true
        },
        currency: {
            tableName: "comCurrency",
            title: "Currency Management",
            formTitle: "Currency",
            newButtonText: "New Currency",
            searchPlaceholder: "Search by Code, Name or Label...",
            fields: {
                basic: ["currencyCode", "currencyName"],
                texts: ["currencyLable"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: false
            }
        },
        process: {
            tableName: "comProcess",
            title: "Process Management",
            formTitle: "Process",
            newButtonText: "New Process",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["ccode", "cname"],
                checkboxes: ["isActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        projects: {
            tableName: "comProjects",
            title: "Projects Management",
            formTitle: "Project",
            newButtonText: "New Project",
            searchPlaceholder: "Search by Code, Name or GL Code...",
            fields: {
                basic: ["Code", "Name"],
                texts: ["glCode"],
                checkboxes: ["IsActive"],
                hasActiveFilter: true
            }
        },
        reason: {
            tableName: "comReason",
            title: "Reason Management",
            formTitle: "Reason",
            newButtonText: "New Reason",
            searchPlaceholder: "Search by Code, Name or Type...",
            fields: {
                basic: ["ccode", "cname"],
                checkboxes: ["isActive"],
                dropdowns: [
                    {
                        name: "codetype",
                        options: [
                            { value: "OTS", label: "OTS" },
                            { value: "RWR", label: "Rework Reason" },
                            { value: "RJR", label: "Reject Reason" }
                        ]
                    }
                ],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true,
                hasCustomFilter: true,
                customFilterOptions: [
                    { value: "all", label: "All Types" },
                    { value: "OTS", label: "OTS" },
                    { value: "RWR", label: "Rework Reason" },
                    { value: "RJR", label: "Reject Reason" }
                ]
            }
        },
        dashboard: {
            tableName: "comtblDashboard",
            title: "Dashboard Management",
            formTitle: "Dashboard Item",
            newButtonText: "New Dashboard Item",
            searchPlaceholder: "Search by Code, Description or Type...",
            fields: {
                basic: ["DBCode", "DBDescription"],
                texts: [
                    "MenuSystem", "Remarks", "FeildToSum", "ImageURL",
                    "dbxxLabel", "dbyxLabel", "dbxxField", "dbyxField", "numberSuffix"
                ],
                numbers: ["dbSort", "dbWidth", "dbHeight"],
                checkboxes: ["IsActive"],
                dropdowns: [
                    {
                        name: "DBType",
                        options: [
                            { value: "TABLE", label: "Table" },
                            { value: "TILE", label: "Tile" },
                            { value: "CHART", label: "Chart" },
                            { value: "GRAPH", label: "Graph" }
                        ]
                    }
                ],
                special: ["BackColor"],
                fixed: [
                    { name: "DBParentCode", value: "00" },
                    { name: "offcode", value: " " }
                ],
                hasActiveFilter: true,
                hasCustomFilter: true,
                customFilterOptions: [
                    { value: "all", label: "All Types" },
                    { value: "TABLE", label: "Table" },
                    { value: "TILE", label: "Tile" },
                    { value: "CHART", label: "Chart" },
                    { value: "GRAPH", label: "Graph" }
                ]
            }
        },
        charges: {
            tableName: "comTypeofCharges",
            title: "Type of Charges Management",
            formTitle: "Charge Type",
            newButtonText: "New Charge Type",
            searchPlaceholder: "Search by Code, Name or GL Code...",
            fields: {
                basic: ["ccode", "cname"],
                texts: ["glCode"],
                checkboxes: ["isActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        uom: {
            tableName: "comUOM",
            title: "UOM (Unit of Measure) Management",
            formTitle: "UOM",
            newButtonText: "New UOM",
            searchPlaceholder: "Search by Code, Name or Short Code...",
            fields: {
                basic: ["ccode", "cname"],
                texts: ["cSHD"],
                checkboxes: ["Isactive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        vehicletype: {
            tableName: "comVehicleType",
            title: "Vehicle Type Management",
            formTitle: "Vehicle Type",
            newButtonText: "New Vehicle Type",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["ccode", "cname"],
                checkboxes: ["isActive"],
                hasActiveFilter: true
            }
        },
        country: {
            tableName: "country",
            title: "Country Management",
            formTitle: "Country",
            newButtonText: "New Country",
            searchPlaceholder: "Search by ID or Name...",
            fields: {
                basic: ["CountryID", "CountryName"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        loantype: {
            tableName: "HRMSLoanType",
            title: "Loan Types Management",
            formTitle: "Loan Type",
            newButtonText: "New Loan Type",
            searchPlaceholder: "Search by Code, Name or Account Code...",
            fields: {
                basic: ["Code", "Name"],
                texts: ["LoanTypeAccountCode"],
                checkboxes: ["IsActive", "isEmployeeGL"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        location: {
            tableName: "HRMSLocation",
            title: "Location Management",
            formTitle: "Location",
            newButtonText: "New Location",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["Code", "Name"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        imfcolor: {
            tableName: "IMFColor",
            title: "IMF Color Management",
            formTitle: "Color",
            newButtonText: "New Color",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["cCode", "cName"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        imfsize: {
            tableName: "IMFSize",
            title: "IMF Size Management",
            formTitle: "Size",
            newButtonText: "New Size",
            searchPlaceholder: "Search by Code, Name or Qty...",
            fields: {
                basic: ["cCode", "cName"],
                numbers: ["qty"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        imfthickness: {
            tableName: "IMFThickness",
            title: "IMF Thickness Management",
            formTitle: "Thickness",
            newButtonText: "New Thickness",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["cCode", "cName"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        floor: {
            tableName: "lndFloor",
            title: "Floor Management",
            formTitle: "Floor",
            newButtonText: "New Floor",
            searchPlaceholder: "Search by Code, Description or Short Name...",
            fields: {
                basic: ["FloorCode", "FloorDesc"],
                texts: ["FloorSHD"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        frequency: {
            tableName: "lndFrequency",
            title: "Frequency Management",
            formTitle: "Frequency",
            newButtonText: "New Frequency",
            searchPlaceholder: "Search by Code or Name...",
            fields: {
                basic: ["ccode", "cname"],
                numbers: ["Qty"],
                checkboxes: ["isactive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        paymenttype: {
            tableName: "lndPaymentType",
            title: "Payment Type Management",
            formTitle: "Payment Type",
            newButtonText: "New Payment Type",
            searchPlaceholder: "Search by Code, Desc, SHD or GL Code...",
            fields: {
                basic: ["TypeCode", "TypeDesc"],
                texts: ["TypeSHD", "TypeGLCode"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        plotcategory: {
            tableName: "lndPlotCatagory",
            title: "Plot Category Management",
            formTitle: "Category",
            newButtonText: "New Category",
            searchPlaceholder: "Search by Code, Description or Short Desc...",
            fields: {
                basic: ["CatCode", "CatDesc"],
                texts: ["CatSHD"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        relation: {
            tableName: "lndRelation",
            title: "Relation Management",
            formTitle: "Relation",
            newButtonText: "New Relation",
            searchPlaceholder: "Search by Code, Description or Short Desc...",
            fields: {
                basic: ["RelCode", "RelDesc"],
                texts: ["RelSHD"],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true
            }
        },
        city: {
            tableName: "cities",
            title: "City Management",
            formTitle: "City",
            newButtonText: "New City",
            searchPlaceholder: "Search by ID, Name or Region...",
            fields: {
                basic: ["CityID", "CityName"],
                texts: ["RegionID"],
                dropdowns: [
                    {
                        name: "CountryID",
                        options: []
                    }
                ],
                checkboxes: ["IsActive"],
                fixed: [{ name: "offcode", value: " ", disabled: true }],
                hasActiveFilter: true,
                hasCustomFilter: false
            },
            needsCountries: true
        }
    };

    return configs[type] || configs.allowance;
};

// ✅ Export form component
export const GenericFormPopup = ({
    moduleConfig,
    popupMode,
    selectedItem,
    onClose,
    onSave,
    countries = [],
    cities = [],
    moduleType = "allowance"
}) => {
    const [formData, setFormData] = useState({});
    const [localError, setLocalError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    // ✅ Initialize form data
    useEffect(() => {
        const initializeFormData = () => {
            const initialData = {};

            // Start with selected item data
            if (selectedItem) {
                Object.keys(selectedItem).forEach(key => {
                    initialData[key] = selectedItem[key];
                });
            }

            // Add missing fields based on configuration
            if (moduleConfig.fields.basic) {
                moduleConfig.fields.basic.forEach(field => {
                    if (initialData[field] === undefined) {
                        initialData[field] = "";
                    }
                });
            }

            // Add checkbox fields
            if (moduleConfig.fields.checkboxes) {
                moduleConfig.fields.checkboxes.forEach(field => {
                    if (initialData[field] === undefined) {
                        initialData[field] = popupMode === 'new' ? true : false;
                    }
                });
            }

            // Add number fields
            if (moduleConfig.fields.numbers) {
                moduleConfig.fields.numbers.forEach(field => {
                    if (initialData[field] === undefined) {
                        initialData[field] = "";
                    }
                });
            }

            // Add text fields
            if (moduleConfig.fields.texts) {
                moduleConfig.fields.texts.forEach(field => {
                    if (initialData[field] === undefined) {
                        initialData[field] = "";
                    }
                });
            }

            // Add fixed fields
            if (moduleConfig.fields.fixed) {
                moduleConfig.fields.fixed.forEach(field => {
                    initialData[field.name] = field.value;
                });
            }

            // Add dropdown fields
            if (moduleConfig.fields.dropdowns) {
                moduleConfig.fields.dropdowns.forEach(field => {
                    if (initialData[field.name] === undefined) {
                        initialData[field.name] = field.options[0]?.value || "";
                    }
                });
            }

            console.log("📝 Initialized form data:", initialData);
            return initialData;
        };

        setFormData(initializeFormData());

        // Show popup after a small delay for animation
        if (popupMode) {
            setTimeout(() => setIsVisible(true), 50);
        }
    }, [selectedItem, moduleConfig, popupMode]);

    // ✅ Input handler
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setLocalError(null);
    };

    // ✅ Handle save
    const handleSaveClick = async () => {
        const success = await onSave(formData);
        if (success) {
            setIsVisible(false);
            setTimeout(() => {
                onClose();
            }, 300);
        }
    };

    // ✅ Handle close with animation
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // ✅ Render form field based on type
    const renderFormField = (fieldName) => {
        const fieldConfig = {
            name: fieldName,
            value: formData[fieldName] !== undefined && formData[fieldName] !== null ? formData[fieldName] : "",
            onChange: handleInputChange,
            className: "modern-input",
            placeholder: `Enter ${fieldName}`
        };

        // Check if field is in fixed config
        const fixedField = moduleConfig.fields.fixed?.find(f => f.name === fieldName);
        if (fixedField) {
            return (
                <div className="form-group" key={fieldName}>
                    <label>{fieldName} <span className="optional">(Fixed)</span></label>
                    <input
                        {...fieldConfig}
                        value={fixedField.value}
                        disabled={true}
                        className="modern-input disabled-input"
                    />
                </div>
            );
        }

        // Auto-generated code field (disabled for new items)
        const isPrimaryCodeField = fieldName === moduleConfig.fields.basic?.[0];
        if (isPrimaryCodeField && popupMode === 'new') {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">{fieldName}</label>
                    <input
                        type="text"
                        {...fieldConfig}
                        disabled={true}
                        className="modern-input disabled-input"
                    />
                    <small className="form-hint">Auto-generated code</small>
                </div>
            );
        }

        // Check if field is CountryID dropdown for city module
        if (fieldName === "CountryID" && moduleType === "city") {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">Country</label>
                    <select 
                        name={fieldName}
                        value={formData[fieldName] || ""}
                        onChange={handleInputChange}
                        className="modern-input"
                    >
                        <option value="">Select Country</option>
                        {countries.length > 0 ? (
                            countries.map(country => (
                                <option key={country.CountryID} value={country.CountryID}>
                                    {country.CountryName}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Loading countries...</option>
                        )}
                    </select>
                </div>
            );
        }

        // Check if field is CountryCode dropdown for bank module
        if (fieldName === "CountryCode" && moduleType === "bank") {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">Country</label>
                    <select 
                        name={fieldName}
                        value={formData[fieldName] || ""}
                        onChange={handleInputChange}
                        className="modern-input"
                    >
                        <option value="">Select Country</option>
                        {countries.length > 0 ? (
                            countries.map(country => (
                                <option key={country.CountryID} value={country.CountryID}>
                                    {country.CountryName}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Loading countries...</option>
                        )}
                    </select>
                </div>
            );
        }

        // Check if field is CityCode dropdown for bank module
        if (fieldName === "CityCode" && moduleType === "bank") {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">City</label>
                    <select 
                        name={fieldName}
                        value={formData[fieldName] || ""}
                        onChange={handleInputChange}
                        className="modern-input"
                    >
                        <option value="">Select City</option>
                        {cities.length > 0 ? (
                            cities.map(city => (
                                <option key={city.CityID} value={city.CityID}>
                                    {city.CityName}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Loading cities...</option>
                        )}
                    </select>
                </div>
            );
        }

        // Check if field is in dropdowns config
        const dropdownField = moduleConfig.fields.dropdowns?.find(f => f.name === fieldName);
        if (dropdownField) {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">{fieldName}</label>
                    <select 
                        name={fieldName}
                        value={formData[fieldName] || ""}
                        onChange={handleInputChange}
                        className="modern-input"
                    >
                        <option value="">Select {fieldName}</option>
                        {dropdownField.options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // Check if field is a checkbox
        if (moduleConfig.fields.checkboxes?.includes(fieldName)) {
            return (
                <div className="com-checkbox-container" key={fieldName}>
                    <label className="com-checkbox-label">
                        <input
                            type="checkbox"
                            name={fieldName}
                            checked={formData[fieldName] === true || formData[fieldName] === 1 || formData[fieldName] === "1"}
                            onChange={handleInputChange}
                            className="com-checkbox"
                        />
                        <span className="com-active">{fieldName}</span>
                    </label>
                </div>
            );
        }

        // Check if field is a number
        if (moduleConfig.fields.numbers?.includes(fieldName)) {
            return (
                <div className="form-group" key={fieldName}>
                    <label>{fieldName}</label>
                    <input
                        type="number"
                        {...fieldConfig}
                    />
                </div>
            );
        }

        // Check if field is a textarea
        if (fieldName === "Address") {
            return (
                <div className="form-group full-width" key={fieldName}>
                    <label>{fieldName}</label>
                    <textarea
                        {...fieldConfig}
                        rows="3"
                        className="modern-input"
                    />
                </div>
            );
        }

        // Primary code field in edit mode (read-only)
        if (isPrimaryCodeField && popupMode === 'edit') {
            return (
                <div className="form-group" key={fieldName}>
                    <label className="required">{fieldName} <span className="read-only-indicator">(Read-only)</span></label>
                    <input
                        type="text"
                        {...fieldConfig}
                        disabled={true}
                        className="modern-input disabled-input"
                    />
                </div>
            );
        }

        // Regular text field
        return (
            <div className="form-group" key={fieldName}>
                <label className="required">{fieldName}</label>
                <input
                    type="text"
                    {...fieldConfig}
                    className="modern-input"
                />
            </div>
        );
    };

    // Don't render if no popup mode
    if (!popupMode) return null;

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`popup-backdrop ${isVisible ? 'visible' : ''}`}
                onClick={handleClose}
            ></div>

            {/* Popup container */}
            <div className={`popup-container ${isVisible ? 'visible' : ''}`}>
                <div className="popup-content">
                    <div className="com-popup-header">
                        <h3>
                            {popupMode === 'edit'
                                ? `Edit ${moduleConfig.formTitle}`
                                : `Add New ${moduleConfig.formTitle}`
                            }
                        </h3>
                        <button className="popup-close-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="com-popup-body">
                        {localError && <div className="error-message">{localError}</div>}

                        <div className="com-form-row">
                            {/* Basic fields */}
                            {moduleConfig.fields.basic?.map(field => renderFormField(field))}
                        </div>

                        {/* Additional text fields */}
                        {moduleConfig.fields.texts && moduleConfig.fields.texts.length > 0 && (
                            <div className="com-form-row">
                                {moduleConfig.fields.texts.map(field => renderFormField(field))}
                            </div>
                        )}

                        {/* Number fields */}
                        {moduleConfig.fields.numbers && moduleConfig.fields.numbers.length > 0 && (
                            <div className="com-form-row">
                                {moduleConfig.fields.numbers.map(field => renderFormField(field))}
                            </div>
                        )}

                        {/* Dropdown fields */}
                        {moduleConfig.fields.dropdowns && moduleConfig.fields.dropdowns.length > 0 && (
                            <div className="com-form-row">
                                {moduleConfig.fields.dropdowns.map(field => renderFormField(field.name))}
                            </div>
                        )}

                        {/* Fixed fields */}
                        {moduleConfig.fields.fixed && moduleConfig.fields.fixed.length > 0 && (
                            <div className="form-row">
                                {moduleConfig.fields.fixed.map(field => renderFormField(field.name))}
                            </div>
                        )}

                        {/* Checkbox fields */}
                        {moduleConfig.fields.checkboxes && moduleConfig.fields.checkboxes.length > 0 && (
                            <div className="form-row checkbox-row">
                                {moduleConfig.fields.checkboxes.map(field => renderFormField(field))}
                            </div>
                        )}
                    </div>

                    <div className="com-popup-footer">
                        <button className="com-btn-save" onClick={handleSaveClick}>
                            <Save size={16} /> {popupMode === 'edit' ? "Update" : "Save"}
                        </button>
                        <button className="com-btn-cancel" onClick={handleClose}>
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};