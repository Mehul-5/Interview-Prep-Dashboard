import { useState, useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext.jsx";
import Login from "./components/Login";
import SheetBrowser from "./components/SheetBrowser";
import Dashboard from "./components/Dashboard";
import Streak from "./components/Streak";
import Weekly from "./components/Weekly";

function App() {
  const { isAuthenticated, token } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);

  // ── THE DATA BRIDGE ──
  const fetchProgress = () => {
    if (!isAuthenticated || !token) return;
    fetch("http://127.0.0.1:8000/my-progress", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setProblems(data))
    .catch(err => console.error("Bridge failed:", err));
  };

  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated, token]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/sheets" />} />
      <Route path="/streak" element={isAuthenticated ? <Streak problems={problems} /> : <Navigate to="/login" />} />
      <Route path="/weekly" element={isAuthenticated ? <Weekly problems={problems} /> : <Navigate to="/login" />} />
      
      {/* Notice we are passing the data and the refresh trigger down to the browser */}
      <Route path="/sheets" element={isAuthenticated ? <SheetBrowser problems={problems} onUpdate={fetchProgress} /> : <Navigate to="/login" />} />
      <Route path="/" element={isAuthenticated ? <Dashboard problems={problems} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;