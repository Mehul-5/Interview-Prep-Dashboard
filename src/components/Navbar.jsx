import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../provider/AuthContext";

function Navbar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Centralized routing for easy updating
  const navLinks = [
    { name: "Sheets", path: "/sheets" },
    { name: "Problems", path: "/problems" },
    { name: "Streak", path: "/streak" },
    { name: "Weekly", path: "/weekly" },
  ];

  return (
    <nav className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md gap-4 sm:gap-0">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <Link to="/" className="text-white font-bold text-lg tracking-wide hover:text-orange-400 transition-colors">
          DSA Tracker
        </Link>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {navLinks.map((link) => (
             <Link 
               key={link.name} 
               to={link.path} 
               className={`text-sm font-medium transition-colors ${
                 location.pathname === link.path 
                 ? "text-orange-400 border-b border-orange-400 pb-0.5" 
                 : "text-slate-400 hover:text-white"
               }`}
             >
               {link.name}
             </Link>
          ))}
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