import { useState, useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./Context/AuthContext.jsx";
import Login from "./components/Login";
import SheetBrowser from "./components/SheetBrowser";
import Dashboard from "./components/Dashboard";
import Streak from "./components/Streak";
import Weekly from "./components/Weekly";

function App() {
  // We extract 'logout' so we can use it if the token dies
  const { isAuthenticated, token, logout } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);

  // ── THE DATA BRIDGE ──
  const fetchProgress = () => {
    if (!isAuthenticated || !token) return;
    
    fetch("https://interview-prep-dashboard.onrender.com/my-progress", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(async (res) => {
      // SECURITY FIX: If token is expired (401), wipe it and kick user to login
      if (!res.ok) {
        if (res.status === 401) logout(); 
        throw new Error("Data bridge failed or unauthorized");
      }
      return res.json();
    })
    .then(data => {
      // PREVENT CRASH: Only save if it's an actual array
      if (Array.isArray(data)) setProblems(data);
    })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated, token]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/sheets" />} />
      <Route path="/streak" element={isAuthenticated ? <Streak problems={problems} /> : <Navigate to="/login" />} />
      <Route path="/weekly" element={isAuthenticated ? <Weekly problems={problems} /> : <Navigate to="/login" />} />
      <Route path="/sheets" element={isAuthenticated ? <SheetBrowser problems={problems} onUpdate={fetchProgress} /> : <Navigate to="/login" />} />
      <Route path="/" element={isAuthenticated ? <Dashboard problems={problems} onUpdate={fetchProgress} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;