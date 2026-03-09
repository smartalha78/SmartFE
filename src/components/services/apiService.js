// services/apiService.js
import API_BASE1 from "../../config"

const API_BASE = API_BASE1;

class ApiService {
  // ===== USER RIGHTS MANAGEMENT =====
  
  async getUserRights(userId, menuId) {
    try {
      const response = await fetch(`${API_BASE}/user-rights/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, menuId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in getUserRights:', error);
      return { success: false, error: error.message };
    }
  }

  async saveUserRights(rights) {
    try {
      const response = await fetch(`${API_BASE}/user-rights/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rights })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in saveUserRights:', error);
      return { success: false, error: error.message };
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${API_BASE}/user-rights/users`);
      return await response.json();
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { success: false, error: error.message, users: [] };
    }
  }

  async getMenus() {
    try {
      const response = await fetch(`${API_BASE}/user-rights/menus`);
      return await response.json();
    } catch (error) {
      console.error('Error in getMenus:', error);
      return { success: false, error: error.message, menus: [], menuTree: [] };
    }
  }

  async getUserRightsBulk(userId) {
    try {
      const response = await fetch(`${API_BASE}/user-rights/bulk-get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in getUserRightsBulk:', error);
      return { success: false, error: error.message, rights: {} };
    }
  }

  async saveUserRightsBulk(userId, rights) {
    try {
      // Convert boolean values to strings "True"/"False" as expected by your database
      const formattedRights = rights.map(item => ({
        Userid: userId,
        Menuid: item.Menuid,
        IsAdd: item.IsAdd ? "True" : "False",
        IsEdit: item.IsEdit ? "True" : "False",
        IsDelete: item.IsDelete ? "True" : "False",
        IsPrint: item.IsPrint ? "True" : "False",
        IsPost: item.IsPost ? "True" : "False",
        IsCopy: item.IsCopy ? "True" : "False",
        IsSearch: item.IsSearch ? "True" : "False",
        IsUpload: item.IsUpload ? "True" : "False",
        IsBackDate: item.IsBackDate ? "True" : "False",
        Isfavorite: item.Isfavorite ? "True" : "False",
        IsActive: item.IsActive,
        offcode: item.offcode || "0101"
      }));

      const response = await fetch(`${API_BASE}/user-rights/bulk-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rights: formattedRights })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in saveUserRightsBulk:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== SCREEN CONFIGURATION =====
  
  async getScreenConfig(screenName) {
    try {
      const response = await fetch(`${API_BASE}/screen/get-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in getScreenConfig:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== DOCUMENT STATUSES =====
  
  async getDocumentStatuses(menuId, cname) {
    try {
      const response = await fetch(`${API_BASE}/screen/document-statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId, cname })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in getDocumentStatuses:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== TABLE DATA =====
  
  async getTableData(tableName, options = {}) {
    try {
      const response = await fetch(`${API_BASE}/get-table-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          ...options
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in getTableData:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== GENERIC CRUD =====
  
  async insertRecord(tableName, data) {
    try {
      const response = await fetch(`${API_BASE}/table/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, data })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in insertRecord:', error);
      return { success: false, error: error.message };
    }
  }

  async updateRecord(tableName, data, where) {
    try {
      const response = await fetch(`${API_BASE}/table/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, data, where })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in updateRecord:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteRecord(tableName, where) {
    try {
      const response = await fetch(`${API_BASE}/table/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, where })
      });
      return await response.json();
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();