import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  // Replaced the duplicate functions with this single, unified login function
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setIsAuthenticated(true);
    
    // --- THE EXTENSION BRIDGE BROADCAST ---
    // Safely broadcast the token to the window for the Chrome Extension to catch
    window.postMessage({ 
      type: "DSA_TRACKER_AUTH_SYNC", 
      token: newToken 
    }, "*"); 
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};