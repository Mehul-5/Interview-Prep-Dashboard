import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../provider/AuthContext";

function Navbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md gap-4 sm:gap-0">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <Link to="/" className="text-white font-bold text-lg tracking-wide hover:text-orange-400 transition-colors">
          DSA Tracker
        </Link>
        {/* Removed 'hidden md:flex', added wrapping and centering for mobile */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link to="/sheets" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sheets</Link>
          <Link to="/streak" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Streak</Link>
          <Link to="/weekly" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Weekly</Link>
        </div>
      </div>
      
      <button 
        onClick={handleLogout}
        className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200"
      >
        Sign Out
      </button>
    </nav>
  );
}

export default Navbar;