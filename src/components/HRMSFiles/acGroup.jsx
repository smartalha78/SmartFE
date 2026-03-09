import React, { useState, useEffect } from "react";
import { FaEdit, FaPlus, FaTimes, FaSave, FaSearch } from "react-icons/fa";
import "./HRMSDesignation.css";

const AcGroup = () => {
    const [groupList, setGroupList] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editMode, setEditMode] = useState("new");
    const [formData, setFormData] = useState({
        groupcode: "",
        description: "",
        IsActive: true,
        offcode: "",
    });

    const tableName = "acGroup";
    const API_BASE = "http://192.168.100.113:8081/api";

    const fetchJson = async (url, options = {}) => {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json", ...options.headers },
            ...options,
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    };

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await fetchJson(`${API_BASE}/get-table-data`, {
                method: "POST",
                body: JSON.stringify({ tableName, offcode: "" }),
            });

            if (data.success && (data.data || data.rows)) {
                const rows = data.data || data.rows;
                setGroupList(rows);
                setFilteredGroups(rows);
            } else {
                setError("Failed to load Account Group data");
            }
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        let filtered = groupList;

        if (searchTerm.trim() !== "") {
            filtered = filtered.filter((item) =>
                ["groupcode", "description"].some(
                    (key) =>
                        item[key] &&
                        item[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        if (activeFilter !== "all") {
            const isActive = activeFilter === "active";
            filtered = filtered.filter((item) => {
                const activeValue =
                    item.IsActive ?? item.isactive ?? item.ISACTIVE ?? item.Active ?? false;
                const itemActive =
                    typeof activeValue === "boolean"
                        ? activeValue
                        : activeValue === "true" ||
                        activeValue === "1" ||
                        activeValue === 1;
                return itemActive === isActive;
            });
        }

        setFilteredGroups(filtered);
    }, [searchTerm, activeFilter, groupList]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const getNextCode = () => {
        if (!groupList || groupList.length === 0) return "1";

        const codes = groupList
            .map((g) => parseInt(g.groupcode || "0", 10))
            .filter((n) => !isNaN(n));

        if (codes.length === 0) return "1";

        const maxCode = Math.max(...codes);
        return (maxCode + 1).toString();
    };

    const handleNew = () => {
        setFormData({
            groupcode: getNextCode(),
            description: "",
            IsActive: true,
            offcode: "0101",
        });
        setEditMode("new");
        setIsEditing(true);
    };

    const handleEdit = (item) => {
        setFormData({
            groupcode: item.groupcode || "",
            description: item.description || "",
            IsActive:
                item.IsActive === true ||
                item.IsActive === "true" ||
                item.IsActive === 1 ||
                item.IsActive === "1",
            offcode: item.offcode,
        });
        setEditMode("edit");
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.groupcode || !formData.description) {
                setError("Please fill in all required fields");
                return;
            }

            const payload =
                editMode === "edit"
                    ? {
                        tableName,
                        data: {
                            description: formData.description,
                            IsActive: formData.IsActive,
                            offcode: formData.offcode,
                        },
                        where: { groupcode: formData.groupcode },
                    }
                    : {
                        tableName,
                        data: {
                            groupcode: formData.groupcode,
                            description: formData.description,
                            IsActive: formData.IsActive,
                            offcode: formData.offcode,
                        },
                    };

            const url =
                editMode === "edit"
                    ? `${API_BASE}/update-table-data`
                    : `${API_BASE}/insert-table-data`;

            const res = await fetchJson(url, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (res.success) {
                await fetchGroups();
                setIsEditing(false);
                setError(null);
            } else {
                setError("❌ Operation failed: " + (res.error || "Unknown error"));
            }
        } catch (err) {
            setError("❌ Error: " + err.message);
        }
    };

    const handleCancel = () => setIsEditing(false);

    if (loading) {
        return (
            <div className="category-container">
                <h2>Account Group Management</h2>
                <div className="loading-spinner"></div>
                <p>Loading data...</p>
            </div>
        );
    }

    return (
        <div className="category-container">
            <div className="header-section">
                <h2>Account Group Management</h2>
                <div className="accent-line"></div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {isEditing ? (
                <div className="category-form glassmorphism">
                    <h3>{editMode === "edit" ? "Edit Group" : "Add New Group"}</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Group Code *</label>
                            <input
                                type="text"
                                name="groupcode"
                                value={formData.groupcode}
                                onChange={handleInputChange}
                                disabled={editMode === "edit"}
                                className="modern-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="modern-input"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group checkbox-container">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="IsActive"
                                    checked={formData.IsActive}
                                    onChange={handleInputChange}
                                    className="modern-checkbox"
                                />
                                <span className="checkmark"></span>
                                Active
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button className="btn save" onClick={handleSave}>
                            <FaSave /> {editMode === "edit" ? "Update" : "Save"}
                        </button>
                        <button className="btn cancel" onClick={handleCancel}>
                            <FaTimes /> Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="category-toolbar glassmorphism">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Code or Description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="modern-input"
                            />
                        </div>

                        <div className="filter-buttons">
                            <span>Status:</span>
                            <button
                                className={activeFilter === "all" ? "btn-filter active" : "btn-filter"}
                                onClick={() => setActiveFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={activeFilter === "active" ? "btn-filter active" : "btn-filter"}
                                onClick={() => setActiveFilter("active")}
                            >
                                Active
                            </button>
                            <button
                                className={activeFilter === "inactive" ? "btn-filter active" : "btn-filter"}
                                onClick={() => setActiveFilter("inactive")}
                            >
                                Inactive
                            </button>
                        </div>

                        <button className="btn new" onClick={handleNew}>
                            <FaPlus /> New Group
                        </button>
                    </div>

                    <div className="category-list-container glassmorphism">
                        <div className="category-list-header">
                            <div className="header-cell">Code</div>
                            <div className="header-cell">Description</div>
                            <div className="header-cell center">Status</div>
                            <div className="header-cell center">Actions</div>
                        </div>

                        <div className="category-list">
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((item, idx) => {
                                    const activeValue =
                                        item.IsActive ?? item.isactive ?? item.ISACTIVE ?? item.Active ?? false;
                                    const isActive =
                                        typeof activeValue === "boolean"
                                            ? activeValue
                                            : activeValue === "true" ||
                                              activeValue === "1" ||
                                              activeValue === 1;

                                    return (
                                        <div key={idx} className="category-item">
                                            <div className="list-cell">{item.groupcode}</div>
                                            <div className="list-cell">{item.description}</div>
                                            <div className="list-cell center">
                                                <span className={`status-badge ${isActive ? "active" : "inactive"}`}>
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="list-cell center actions">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-data">
                                    {searchTerm || activeFilter !== "all"
                                        ? "No account groups match your search criteria"
                                        : "No account groups found"}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AcGroup;
