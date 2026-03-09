// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UserRightsManager from "./components/BusinessAdministration/UserRights";
import EmployeeManagement from "./components/MasterData/EmployeeFiles/EmployeeManagement";
import { AuthProvider } from "./AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { RightsProvider } from "./context/RightsContext"; // Import RightsProvider

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <RightsProvider> {/* Add RightsProvider here */}
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/:appName/:companyName/Login" element={<Login />} />
              
              {/* Dashboard route */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/:appName/:companyName/dashboard" element={<Dashboard />} />
              
              {/* User Rights route */}
              <Route path="/user-rights" element={<UserRightsManager />} />
              <Route path="/:appName/:companyName/user-rights" element={<UserRightsManager />} />
              
              {/* Employee Management route */}
              <Route path="/employee-management" element={<EmployeeManagement />} />
              <Route path="/:appName/:companyName/employee-management" element={<EmployeeManagement />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </Router>
        </RightsProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;