import { useState, useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./provider/AuthContext.jsx";
import Login from "./components/Login";
import SheetBrowser from "./components/SheetBrowser";
import Dashboard from "./components/Dashboard";
import Streak from "./components/Streak";
import Weekly from "./components/Weekly";

// THE MISSING IMPORT YOU FORGOT
import Problemspage from "./components/Problemspage";

function App() {
  const { isAuthenticated, token, logout } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);

  // ── THE DATA BRIDGE ──
  const fetchProgress = () => {
    // 1. Guard clause: Do not fetch if there is no token
    if (!isAuthenticated || !token) return;
    
    fetch("https://interview-prep-dashboard.onrender.com/my-progress", {
      method: "GET", // Explicitly state the method
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" // Good practice
      }
    })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          console.error("Session expired or invalid token. Logging out.");
          logout(); 
        }
        throw new Error(`Data bridge failed: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        setProblems(data);
      }
    })
    .catch(err => {
      // Don't crash the app on a network error, just log it
      console.error("Fetch Progress Error:", err);
    });
  };

  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated, token]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/streak" element={isAuthenticated ? <Streak problems={problems} /> : <Navigate to="/login" />} />
      <Route path="/weekly" element={isAuthenticated ? <Weekly problems={problems} /> : <Navigate to="/login" />} />
      <Route path="/sheets" element={isAuthenticated ? <SheetBrowser problems={problems} onUpdate={fetchProgress} /> : <Navigate to="/login" />} />
      
      {/* The route that caused the crash because the import was missing */}
      <Route path="/problems" element={isAuthenticated ? <Problemspage problems={problems} /> : <Navigate to="/login" />} />
      
      <Route path="/" element={isAuthenticated ? <Dashboard problems={problems} onUpdate={fetchProgress} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;