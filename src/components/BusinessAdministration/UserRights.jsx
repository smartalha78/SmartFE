// components/BusinessAdministration/UserRights.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { CompanyContext } from '../../context/CompanyContext';
import apiService from '../services/apiService';
import './UserRights.css';

const UserRightsManager = () => {
  const { credentials } = useContext(AuthContext);
  const { companyName } = useContext(CompanyContext);

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSystemMenu, setSelectedSystemMenu] = useState('');
  const [userRights, setUserRights] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromCopyUser, setFromCopyUser] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [status, setStatus] = useState('Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [expandedMenus, setExpandedMenus] = useState({});

  // Permission definitions based on actual tbluserrights columns
  const permissions = [
    { key: 'IsAdd', label: 'Add', field: 'IsAdd' },
    { key: 'IsEdit', label: 'Edit', field: 'IsEdit' },
    { key: 'IsDelete', label: 'Delete', field: 'IsDelete' },
    { key: 'IsPrint', label: 'Print', field: 'IsPrint' },
    { key: 'IsPost', label: 'Post', field: 'IsPost' },
    { key: 'IsCopy', label: 'Copy', field: 'IsCopy' },
    { key: 'IsSearch', label: 'Search', field: 'IsSearch' },
    { key: 'IsUpload', label: 'Upload', field: 'IsUpload' },
    { key: 'IsBackDate', label: 'Back Date', field: 'IsBackDate' },
    { key: 'Isfavorite', label: 'Favorite', field: 'Isfavorite' },
    { key: 'IsActive', label: 'Active', field: 'IsActive' }
  ];

  // Helper function to check if a value is truthy
  const isTruthy = (value) => {
    if (value === true || value === 1 || value === '1' || value === 'True' || value === 'true') {
      return true;
    }
    return false;
  };

  // Load data from localStorage
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const appData = localStorage.getItem('appData');
        if (appData) {
          const parsed = JSON.parse(appData);
          
          // Set companies from login data
          if (parsed.company) {
            setCompanies([parsed.company]);
            setSelectedCompany(parsed.company.offcode || '1010');
          }
          
          // Set branches from login data
          if (parsed.branches && parsed.branches.length > 0) {
            setBranches(parsed.branches);
            setSelectedBranch(parsed.branches[0].bcode);
          }
          
          // Set menus from login data
          if (parsed.menu && parsed.menu.length > 0) {
            setMenus(parsed.menu);
            
            // Find top level menus (parentId === '00' or '0')
            const topLevel = parsed.menu.filter(m => m.parentId === '00' || m.parentId === '0');
            if (topLevel.length > 0) {
              setSelectedSystemMenu(topLevel[0].id);
            }
            setFilteredMenus(parsed.menu);
          }
        }
      } catch (error) {
        console.error('Error loading app data:', error);
      }
    };

    loadStoredData();
    loadUsers();
  }, []);

  // Filter menus based on selection and search
  useEffect(() => {
    if (!menus.length) return;

    let filtered = [...menus];
    
    // Filter by system menu (top level)
    if (selectedSystemMenu) {
      filtered = filtered.filter(menu => 
        menu.id?.startsWith(selectedSystemMenu) || 
        menu.parentId === selectedSystemMenu
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(menu => 
        menu.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.menuNarration?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMenus(filtered);
  }, [menus, selectedSystemMenu, searchTerm]);

  // Load users when component mounts
  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    }
  };

  // Load user rights when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserRights(selectedUser);
    } else {
      setUserRights({});
    }
  }, [selectedUser]);

  const loadUserRights = async (userId) => {
    setLoading(true);
    try {
      const response = await apiService.getUserRightsBulk(userId);
      if (response.success) {
        console.log('Loaded rights:', response.rights); // Debug log
        setUserRights(response.rights || {});
      }
    } catch (error) {
      console.error('Error loading user rights:', error);
      showToast('Failed to load user rights', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCompanyChange = (offcode) => {
    setSelectedCompany(offcode);
  };

  const handlePermissionChange = (menuId, permission, checked) => {
    setUserRights(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [permission]: checked ? 'True' : 'False'
      }
    }));
  };

  const handleSelectAllChange = (checked) => {
    setSelectAll(checked);
    
    const updatedRights = {};
    filteredMenus.forEach(menu => {
      const menuRights = {};
      permissions.forEach(p => {
        // Special handling for IsCopy which can be empty string
        if (p.field === 'IsCopy') {
          menuRights[p.field] = checked ? 'True' : '';
        } else {
          menuRights[p.field] = checked ? 'True' : 'False';
        }
      });
      updatedRights[menu.id] = menuRights;
    });
    
    setUserRights(prev => ({
      ...prev,
      ...updatedRights
    }));
  };

  const handleFromCopyUserChange = async (e) => {
    const copyUserId = e.target.value;
    setFromCopyUser(copyUserId);
    
    if (copyUserId) {
      try {
        const response = await apiService.getUserRightsBulk(copyUserId);
        if (response.success) {
          setUserRights(response.rights || {});
          showToast('Rights copied from selected user');
        }
      } catch (error) {
        console.error('Error copying user rights:', error);
        showToast('Failed to copy user rights', 'error');
      }
    }
  };

  const handleSaveRights = async () => {
    if (!selectedUser) {
      showToast('Please select a user', 'error');
      return;
    }

    setSaving(true);
    try {
      const rightsList = Object.entries(userRights).map(([menuId, rights]) => ({
        Menuid: menuId,
        Userid: selectedUser,
        IsAdd: rights.IsAdd || 'False',
        IsEdit: rights.IsEdit || 'False',
        IsDelete: rights.IsDelete || 'False',
        IsPrint: rights.IsPrint || 'False',
        IsPost: rights.IsPost || 'False',
        IsCopy: rights.IsCopy || '',
        IsSearch: rights.IsSearch || 'True',
        IsUpload: rights.IsUpload || 'False',
        IsBackDate: rights.IsBackDate || 'False',
        Isfavorite: rights.Isfavorite || 'False',
        IsActive: status === 'Active' ? 'True' : 'False',
        offcode: selectedCompany || '1010',
        isDesktop: 'False'
      }));

      console.log('Saving rights:', rightsList); // Debug log

      const response = await apiService.saveUserRightsBulk(selectedUser, rightsList);
      
      if (response.success) {
        showToast('User rights saved successfully');
        // Reload rights to show updated values
        loadUserRights(selectedUser);
      } else {
        showToast(response.error || 'Failed to save user rights', 'error');
      }
    } catch (error) {
      console.error('Error saving user rights:', error);
      showToast('Failed to save user rights', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getMenuRights = (menuId) => {
    return userRights[menuId] || {};
  };

  const getTopLevelMenus = () => {
    return menus.filter(m => m.parentId === '00' || m.parentId === '0');
  };

  const toggleMenuExpand = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Helper function to determine if checkbox should be checked
  const isChecked = (rights, field) => {
    const value = rights[field];
    
    // Handle different value types
    if (value === 'True' || value === true || value === 1 || value === '1') {
      return true;
    }
    
    // Special case for IsSearch which defaults to True
    if (field === 'IsSearch' && (value === undefined || value === null || value === '')) {
      return true;
    }
    
    // Special case for IsCopy which can be empty string
    if (field === 'IsCopy') {
      return value === 'True' || value === true;
    }
    
    return false;
  };

  const renderMenuRow = (menu, level = 0) => {
    const rights = getMenuRights(menu.id);
    const hasChildren = menus.some(m => m.parentId === menu.id);
    const isExpanded = expandedMenus[menu.id];
    const children = menus.filter(m => m.parentId === menu.id);

    return (
      <React.Fragment key={menu.id}>
        <tr className={`menu-row level-${level}`}>
          <td className="menu-cell">
            <div style={{ marginLeft: `${level * 20}px` }} className="menu-title-container">
              {hasChildren && (
                <button 
                  className="expand-btn"
                  onClick={() => toggleMenuExpand(menu.id)}
                  type="button"
                >
                  {isExpanded ? '▼' : '►'}
                </button>
              )}
              <span className="menu-name">
                {level > 0 ? '...' : ''}{menu.title || menu.menuNarration || 'Untitled'}
              </span>
              <span className="menu-id">({menu.id})</span>
            </div>
          </td>
          {permissions.map(perm => (
            <td key={perm.key} className="permission-cell">
              <input
                type="checkbox"
                checked={isChecked(rights, perm.field)}
                onChange={(e) => handlePermissionChange(menu.id, perm.field, e.target.checked)}
              />
            </td>
          ))}
        </tr>
        {hasChildren && isExpanded && children.map(child => renderMenuRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="user-rights-container">
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="header-section">
        <h1 className="page-title">Administration</h1>
      </div>

      {/* Company and User Selection */}
      <div className="selection-panel">
        <div className="company-section">
          <h3 className="section-title">Company</h3>
          <select 
            className="company-select"
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
          >
            {companies.map(company => (
              <option key={company.offcode} value={company.offcode}>
                {company.name || company.offdesc}
              </option>
            ))}
          </select>
        </div>

        {branches.length > 0 && (
          <div className="branch-section">
            <h3 className="section-title">Branch</h3>
            <select 
              className="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map(branch => (
                <option key={branch.bcode} value={branch.bcode}>
                  {branch.branch || branch.bname}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="user-rights-section">
          <h3 className="section-title">User Rights</h3>
          <div className="user-controls">
            <div className="user-selector">
              <label>Select User</label>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.Uid} value={user.Uid}>
                    {user.Userlogin} {user.UserFullName ? `- ${user.UserFullName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="system-menu">
              <label>System Menu</label>
              <select 
                value={selectedSystemMenu}
                onChange={(e) => setSelectedSystemMenu(e.target.value)}
              >
                <option value="">All Menus</option>
                {getTopLevelMenus().map(menu => (
                  <option key={menu.id} value={menu.id}>
                    {menu.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="menu-actions">
            <div className="copy-user">
              <label>From Copy User Right</label>
              <select 
                value={fromCopyUser}
                onChange={handleFromCopyUserChange}
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.Uid} value={user.Uid}>
                    {user.Userlogin}
                  </option>
                ))}
              </select>
            </div>
            <div className="select-all">
              <label>
                <input 
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAllChange(e.target.checked)}
                />
                Select All
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search menus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Rights Table */}
      <div className="rights-table-wrapper">
        <table className="rights-table">
          <thead>
            <tr>
              <th className="menu-header">Menu</th>
              {permissions.map(perm => (
                <th key={perm.key}>{perm.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={permissions.length + 1} className="loading-cell">
                  <div className="spinner"></div>
                  <span>Loading rights...</span>
                </td>
              </tr>
            ) : filteredMenus.length > 0 ? (
              filteredMenus
                .filter(menu => menu.parentId === '00' || menu.parentId === '0')
                .map(menu => renderMenuRow(menu))
            ) : (
              <tr>
                <td colSpan={permissions.length + 1} className="no-data-cell">
                  No menus found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status and Save */}
      <div className="footer-controls">
        <div className="status-section">
          <label>Status Name</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="save-section">
          <label>Save Screen Reports Rights</label>
          <button 
            className="save-btn"
            onClick={handleSaveRights}
            disabled={saving || !selectedUser}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="system-footer">
        <div className="footer-info">
          <span>Company: {companyName}</span>
          <span>Branch: {branches.find(b => b.bcode === selectedBranch)?.branch || branches.find(b => b.bcode === selectedBranch)?.bname || 'Not Selected'}</span>
          <span>Selected User: {users.find(u => u.Uid === selectedUser)?.Userlogin || 'Not Selected'}</span>
          <span>Current User: {credentials?.username || 'Unknown'}</span>
          {/* <span>Connect: SmartGold</span> */}
        </div>
      </div>
    </div>
  );
};

export default UserRightsManager;