// src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [credentials, setCredentials] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (creds, authToken) => {
    try {
      // Ensure offcode and bcode have default values if not provided
      const enhancedCreds = {
        ...creds,
        offcode: creds.offcode || "1010",
        bcode: creds.bcode || "",
        // Ensure uid is properly set
        uid: creds.uid || creds.Uid || creds.user_id || creds.userId || null,
        user_id: creds.uid || creds.Uid || creds.user_id || creds.userId || null
      };
      
      setCredentials(enhancedCreds);
      setToken(authToken);
      
      localStorage.setItem("authCredentials", JSON.stringify(enhancedCreds));
      localStorage.setItem("authToken", authToken);
      
      // Store uid separately for easy access
      if (enhancedCreds.uid) {
        localStorage.setItem("userUid", enhancedCreds.uid);
      }
      
      // Also store in sessionStorage as backup
      sessionStorage.setItem("authToken", authToken);
      if (enhancedCreds.uid) {
        sessionStorage.setItem("userUid", enhancedCreds.uid);
      }
    } catch (error) {
      console.error("Failed to save credentials:", error);
      throw new Error("Failed to save login credentials");
    }
  };

  const logout = () => {
    setCredentials(null);
    setToken(null);
    localStorage.removeItem("authCredentials");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userUid");
    localStorage.removeItem("appData");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userUid");
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Try localStorage first
        let storedCreds = localStorage.getItem("authCredentials");
        let storedToken = localStorage.getItem("authToken");
        
        // If not in localStorage, try sessionStorage
        if (!storedToken) {
          storedToken = sessionStorage.getItem("authToken");
        }
        
        if (storedCreds && storedToken) {
          const parsedCreds = JSON.parse(storedCreds);
          
          if (!parsedCreds.offcode) parsedCreds.offcode = "1010";
          if (!parsedCreds.bcode) parsedCreds.bcode = "";
          
          setCredentials(parsedCreds);
          setToken(storedToken);
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

  const getCurrentUserId = () => {
    return credentials?.uid || credentials?.user_id || localStorage.getItem("userUid") || "";
  };

  const getCurrentBcode = () => {
    return credentials?.bcode || "";
  };

  const getAuthToken = () => {
    return token || localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ 
      credentials,
      token,
      login, 
      logout, 
      isLoading,
      getCurrentUserId,
      getCurrentBcode,
      getAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};