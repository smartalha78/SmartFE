// src/context/CompanyContext.js
import React, { createContext, useState, useEffect } from "react";

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get company data from localStorage (stored during login)
    const loadCompanyData = () => {
      try {
        const appData = localStorage.getItem("appData");
        if (appData) {
          const parsed = JSON.parse(appData);
          if (parsed.company) {
            setCompanyName(parsed.company.name || parsed.company.offdesc || "SMART SOLUTIONS ORG.");
            setCompanyData(parsed.company);
            document.title = parsed.company.name || parsed.company.offdesc || "SMART SOLUTIONS ORG.";
          }
        } else {
          // Fallback if no appData
          setCompanyName("SMART SOLUTIONS ORG.");
          document.title = "SMART SOLUTIONS ORG.";
        }
      } catch (err) {
        console.error("Error loading company data:", err);
        setCompanyName("SMART SOLUTIONS ORG.");
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();

    // Optional: Listen for storage changes (if company data updates in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "appData") {
        loadCompanyData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <CompanyContext.Provider value={{ 
      companyName, 
      companyData,
      loading 
    }}>
      {children}
    </CompanyContext.Provider>
  );
};