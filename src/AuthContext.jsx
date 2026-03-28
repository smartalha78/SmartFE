// src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [credentials, setCredentials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (creds) => {
    try {
      // Ensure offcode has a default value if not provided
      const enhancedCreds = {
        ...creds,
        offcode: creds.offcode || "1010" // Default to "1010" if not provided
      };
      
      setCredentials(enhancedCreds);
      localStorage.setItem("authCredentials", JSON.stringify(enhancedCreds));
      
      // Also store uid separately if needed
      if (creds.uid) {
        localStorage.setItem("userUid", creds.uid);
      }
    } catch (error) {
      console.error("Failed to save credentials:", error);
      throw new Error("Failed to save login credentials");
    }
  };

  const logout = () => {
    setCredentials(null);
    localStorage.removeItem("authCredentials");
    localStorage.removeItem("userUid");
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedCreds = localStorage.getItem("authCredentials");
        if (storedCreds) {
          const parsedCreds = JSON.parse(storedCreds);
          // Ensure offcode exists when loading from storage
          if (!parsedCreds.offcode) {
            parsedCreds.offcode = "1010";
          }
          setCredentials(parsedCreds);
        }
      } catch (e) {
        console.error("Failed to initialize auth:", e);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper to get current user ID
  const getCurrentUserId = () => {
    return credentials?.uid || localStorage.getItem("userUid") || "";
  };

  return (
    <AuthContext.Provider value={{ 
      credentials, 
      login, 
      logout, 
      isLoading,
      getCurrentUserId  // Add this helper
    }}>
      {children}
    </AuthContext.Provider>
  );
};