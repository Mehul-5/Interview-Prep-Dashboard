import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let response;
      let data;

      if (isLoginMode) {
        // LOGIN: FastAPI requires URL-encoded form data
        const formData = new URLSearchParams();
        formData.append("username", email); 
        formData.append("password", password);

        response = await fetch("http://127.0.0.1:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });
      } else {
        // SIGNUP: FastAPI expects JSON
        // We split the email at the '@' and chop it to 15 characters to satisfy the strict DB limit
        const safeUsername = email.split("@")[0].substring(0, 15);
        
        response = await fetch("http://127.0.0.1:8000/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, username: safeUsername, password: password }),
        });
      }

      data = await response.json();

      if (!response.ok) {
        // NEW: Unpack FastAPI's detailed 422 validation errors into readable text
        let errorMessage = "Authentication failed";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Extracts the specific missing/invalid field name and the reason
            errorMessage = data.detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(" | ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        throw new Error(errorMessage);
      }

      if (isLoginMode) {
        login(data.access_token);
        navigate("/sheets");
      } else {
        setIsLoginMode(true);
        setError("Account created successfully! Please log in.");
        setPassword("");
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isLoginMode ? "System Access" : "Create Account"}
          </h1>
        </div>

        {error && (
          <div className={`mb-6 p-3 rounded-xl border text-sm text-center ${error.includes("successfully") ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm text-gray-100 bg-white/[0.06] border border-white/10 focus:outline-none focus:border-orange-500/30" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm text-gray-100 bg-white/[0.06] border border-white/10 focus:outline-none focus:border-orange-500/30" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3.5 mt-4 rounded-2xl text-sm font-semibold bg-orange-500 text-white disabled:opacity-50">
            {isLoading ? "Processing..." : (isLoginMode ? "Initialize Session →" : "Register Account →")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }} className="text-sm text-slate-400 hover:text-white transition-colors">
            {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;