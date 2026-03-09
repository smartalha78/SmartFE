import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../AuthContext";
import Pagination from "../Common/Pagination";
import "./HRMSDesignation.css";
import { Pencil, Plus, ChevronDown } from "lucide-react";
import API_BASE1 from "../../config";
import {
    useGenericFunctions,
    getDefaultConfig,
    GenericFormPopup
} from "../Common/GenericFunctions";

const HRMSGenericManager = ({
    moduleType = "allowance",
    moduleConfig,
    onClose,
    onBack,
    mode,
    ...rest
}) => {
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);

    const useAuth = () => useContext(AuthContext);
    const { credentials } = useAuth();
    const API_BASE = API_BASE1;
    const itemsPerPage = 5;

    // ✅ Helper function to check if a value represents "active"
    const isActiveValue = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value === true;
        if (typeof value === 'number') return value === 1;
        if (typeof value === 'string') {
            return value === "true" || value === "1" || value === "True" || value === "TRUE";
        }
        return false;
    };

    // Get dynamic config
    const getDynamicConfig = (countriesList, citiesList) => {
        const baseConfig = moduleConfig || getDefaultConfig(moduleType);

        if (moduleType === "bank") {
            const updatedConfig = { ...baseConfig };

            if (countriesList && countriesList.length > 0) {
                updatedConfig.fields = {
                    ...updatedConfig.fields,
                    texts: updatedConfig.fields.texts?.filter(field => field !== "CountryCode") || [],
                    dropdowns: [
                        ...(updatedConfig.fields.dropdowns || []),
                        {
                            name: "CountryCode",
                            options: countriesList.map(country => ({
                                value: country.CountryID,
                                label: country.CountryName
                            }))
                        }
                    ]
                };
            }

            if (citiesList && citiesList.length > 0) {
                updatedConfig.fields = {
                    ...updatedConfig.fields,
                    texts: updatedConfig.fields.texts?.filter(field => field !== "CityCode") || [],
                    dropdowns: [
                        ...(updatedConfig.fields.dropdowns || []),
                        {
                            name: "CityCode",
                            options: citiesList.map(city => ({
                                value: city.CityID,
                                label: city.CityName
                            }))
                        }
                    ]
                };
            }

            return updatedConfig;
        }
        
        if (moduleType === "city") {
            const updatedConfig = { ...baseConfig };

            if (countriesList && countriesList.length > 0) {
                // Update CountryID dropdown options
                updatedConfig.fields = {
                    ...updatedConfig.fields,
                    dropdowns: [
                        {
                            name: "CountryID",
                            options: countriesList.map(country => ({
                                value: country.CountryID,
                                label: country.CountryName
                            }))
                        }
                    ]
                };
            }

            return updatedConfig;
        }
        
        return baseConfig;
    };

    const dynamicConfig = getDynamicConfig(countries, cities);

    // Use generic functions
    const {
        // State
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

        // Setters
        setError,
        setSuccessMessage,
    } = useGenericFunctions(dynamicConfig, API_BASE, credentials, itemsPerPage);

    // ✅ Helper to fetch JSON safely
    const fetchJson = async (url, options = {}) => {
        console.log(`🌐 Fetching from HRMSGenericManager: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                ...options,
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`❌ Fetch error in HRMSGenericManager:`, err);
            throw err;
        }
    };

    // ✅ Fetch countries for dropdown
    const fetchCountries = async () => {
        try {
            const currentOffcode = credentials?.company?.offcode || '0101';
            
            // Build where clause for active countries
            const whereClause = `offcode = '${currentOffcode}'`;
            
            const data = await fetchJson(`${API_BASE}/get-table-data`, {
                method: "POST",
                body: JSON.stringify({
                    tableName: "country",
                    usePagination: false,
                    where: whereClause
                }),
            });

            console.log("📥 Countries response:", data);

            if (data.success && data.rows) {
                const countryRows = data.rows;
                const activeCountries = countryRows.filter(country =>
                    isActiveValue(country.IsActive)
                );
                setCountries(activeCountries);
            }
        } catch (err) {
            console.error("Failed to fetch countries:", err);
        }
    };

    // ✅ Fetch cities for dropdown
    const fetchCities = async () => {
        try {
            const currentOffcode = credentials?.company?.offcode || '0101';
            
            // Build where clause for active cities
            const whereClause = `offcode = '${currentOffcode}'`;
            
            const data = await fetchJson(`${API_BASE}/get-table-data`, {
                method: "POST",
                body: JSON.stringify({
                    tableName: "cities",
                    usePagination: false,
                    where: whereClause
                }),
            });

            console.log("📥 Cities response:", data);

            if (data.success && data.rows) {
                const cityRows = data.rows;
                const activeCities = cityRows.filter(city =>
                    isActiveValue(city.IsActive)
                );
                setCities(activeCities);
            }
        } catch (err) {
            console.error("Failed to fetch cities:", err);
        }
    };

    // ✅ Initialize component
    useEffect(() => {
        const loadForeignData = async () => {
            if (moduleType === "bank" || moduleType === "city") {
                if (countries.length === 0) await fetchCountries();
            }
            
            if (moduleType === "bank") {
                if (cities.length === 0) await fetchCities();
            }
        };

        loadForeignData();
    }, [moduleType]);

    // ✅ Handle close with props
    const handleClose = () => {
        if (onClose) onClose();
    };

    // ✅ Handle back with props
    const handleBack = () => {
        if (onBack) onBack();
        else if (onClose) onClose();
    };

    // Get table headers based on configuration
    const getTableHeaders = () => {
        const headers = [];

        // Basic fields
        if (dynamicConfig.fields.basic) {
            headers.push(...dynamicConfig.fields.basic.map(field =>
                ({ key: field, label: field, type: 'basic' })
            ));
        }

        // Additional display fields
        if (dynamicConfig.fields.texts) {
            const displayTexts = dynamicConfig.fields.texts.filter(field =>
                !['Address', 'BranchManager'].includes(field)
            );
            headers.push(...displayTexts.map(field =>
                ({ key: field, label: field, type: 'text' })
            ));
        }

        // Dropdown fields - show friendly names
        if (dynamicConfig.fields.dropdowns) {
            headers.push(...dynamicConfig.fields.dropdowns.map(field => {
                // Show "Country" instead of "CountryCode" for bank module
                if (field.name === "CountryCode" && moduleType === "bank") {
                    return { key: field.name, label: "Country", type: 'dropdown' };
                }
                // Show "City" instead of "CityCode" for bank module
                if (field.name === "CityCode" && moduleType === "bank") {
                    return { key: field.name, label: "City", type: 'dropdown' };
                }
                // Show "Country" instead of "CountryID" for city module
                if (field.name === "CountryID" && moduleType === "city") {
                    return { key: field.name, label: "Country", type: 'dropdown' };
                }
                return { key: field.name, label: field.name, type: 'dropdown' };
            }));
        }

        // Checkbox status fields
        if (dynamicConfig.fields.checkboxes) {
            headers.push(...dynamicConfig.fields.checkboxes.map(field =>
                ({ key: field, label: field, type: 'status', center: true })
            ));
        }

        headers.push({ key: 'actions', label: 'Actions', type: 'actions', center: true });

        return headers;
    };

    // Helper function to get a unique ID from an item
    const getItemId = (item) => {
        return item.id || 
               item.Code || 
               item.code || 
               item.currencyCode || 
               item.CurrencyCode || 
               item.CityID || 
               item.CountryID || 
               item.ccaCode ||
               item.ccode ||
               JSON.stringify(item).substring(0, 20); // Fallback
    };

    // Render table cell based on item and header
    const renderTableCell = (item, header, itemId) => {
        if (header.type === 'actions') {
            return (
                <div className="hrms-list-cell" key={`${itemId}-actions`}>
                    <button
                        className="btn-edit"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            );
        }

        // Show country name instead of country ID for city module
        if (header.key === 'CountryID' && moduleType === "city") {
            const countryId = item[header.key];
            const country = countries.find(c => String(c.CountryID) === String(countryId));
            const displayName = country ? country.CountryName : (countryId || '-');

            return (
                <div className="hrms-list-cell" key={`${itemId}-${header.key}`}>
                    <h6>{displayName}</h6>
                </div>
            );
        }

        // Show country name instead of CountryCode for bank module
        if (header.key === 'CountryCode' && moduleType === "bank") {
            const countryId = item[header.key];
            const country = countries.find(c => String(c.CountryID) === String(countryId));
            const displayName = country ? country.CountryName : (countryId || '-');

            return (
                <div className="hrms-list-cell" key={`${itemId}-${header.key}`}>
                    <h6>{displayName}</h6>
                </div>
            );
        }

        // Show city name instead of city ID for bank module
        if (header.key === 'CityCode' && moduleType === "bank") {
            const cityId = item[header.key];
            const city = cities.find(c => String(c.CityID) === String(cityId));
            const displayName = city ? city.CityName : (cityId || '-');

            return (
                <div className="hrms-list-cell" key={`${itemId}-${header.key}`}>
                    <h6>{displayName}</h6>
                </div>
            );
        }

        // Handle status fields
        if (header.type === 'status') {
            const value = item[header.key];
            
            // Log the actual value for debugging (optional - remove in production)
            // console.log(`🔍 Status check for ${header.key}:`, {
            //     field: header.key,
            //     value: value,
            //     type: typeof value,
            //     isActive: isActiveValue(value)
            // });
            
            // Use the isActiveValue helper function for consistent checking
            const isActive = isActiveValue(value);

            return (
                <div className={`hrms-list-cell ${header.center ? 'center' : ''}`} key={`${itemId}-${header.key}`}>
                    <h6 className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </h6>
                </div>
            );
        }

        // Default text display
        return (
            <div className="hrms-list-cell" key={`${itemId}-${header.key}`}>
                <h6>{item[header.key] !== undefined && item[header.key] !== null ? String(item[header.key]) : '-'}</h6>
            </div>
        );
    };

    // Show loading state
    if (isInitialLoad && loading) {
        return (
            <div className="hrms-category-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading {dynamicConfig.formTitle.toLowerCase()}s...</p>
                </div>
            </div>
        );
    }

    const tableHeaders = getTableHeaders();

    return (
        <div className={`hrms-category-container ${showPopup ? 'popup-open' : ''}`}>
            {/* Popup Form */}
            {showPopup && (
                <GenericFormPopup
                    moduleConfig={dynamicConfig}
                    popupMode={popupMode}
                    selectedItem={selectedItem}
                    onClose={handleClosePopup}
                    onSave={handleSave}
                    countries={countries}
                    cities={cities}
                    moduleType={moduleType}
                />
            )}

            {/* Messages */}
            <div className="message-container">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}
            </div>

            {/* Header with navigation */}
            <div className="hrms-header-section">
                <div className="header-nav">
                    {/* Toolbar */}
                    <div className="hrms-flex">
                        <div className="hrms-search-box">
                            <input
                                type="text"
                                placeholder={dynamicConfig.searchPlaceholder}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="hrms-modern-input"
                            />
                        </div>

                        {/* Active Status Filter */}
                        {dynamicConfig.fields.hasActiveFilter && (
                            <div className="hrms-filter-buttons">
                                <div className="hrms-w-50">
                                    <span>Status:</span>
                                </div>
                                <div className="w-50 custom-select-wrapper">
                                    <select
                                        className="hrms-btn-filter"
                                        value={activeFilter}
                                        onChange={handleActiveFilterChange}
                                    >
                                        <option value="all">All</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <ChevronDown className="custom-select-icon" size={16} />
                                </div>
                            </div>
                        )}

                        {/* Custom Filter */}
                        {dynamicConfig.fields.hasCustomFilter && (
                            <div className="filter-buttons">
                                <span>Type:</span>
                                <select
                                    value={customFilter}
                                    onChange={handleCustomFilterChange}
                                    className="modern-select"
                                >
                                    {dynamicConfig.fields.customFilterOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="hrms-new-btn">
                            <button className="hrms-btn-new" onClick={handleNew}>
                                <Plus size={18} />
                                {dynamicConfig.newButtonText}
                            </button>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="hrms-category-list-header">
                        {tableHeaders.map(header => (
                            <h5
                                key={header.key}
                                className={`hrms-header-cell ${header.center ? 'center' : ''}`}
                            >
                                {header.label}
                            </h5>
                        ))}
                    </div>

                    {/* Table Body */}
                    <div className="popup-body hrms-category-list">
                        {loading && !isInitialLoad ? (
                            <div className="loading-inline">
                                <div className="small-spinner"></div>
                                <span>Loading...</span>
                            </div>
                        ) : paginatedItems.length > 0 ? (
                            <>
                                {paginatedItems.map((item, idx) => {
                                    const itemId = getItemId(item) || `row-${idx}`;
                                    return (
                                        <div key={itemId} className="hrms-category-item">
                                            {tableHeaders.map(header => renderTableCell(item, header, itemId))}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="no-data">
                                {searchTerm || activeFilter !== "all" || customFilter !== "all"
                                    ? `No ${dynamicConfig.formTitle.toLowerCase()}s match your search criteria`
                                    : `No ${dynamicConfig.formTitle.toLowerCase()}s found`}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                maxVisiblePages={3}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRMSGenericManager;