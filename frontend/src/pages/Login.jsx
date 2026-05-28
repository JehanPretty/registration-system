import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";

import { useGoogleLogin } from "@react-oauth/google";

import { API_BASE_URL } from "../config";
import { clearSession } from "../utils/session";
import illustration from "../assets/auth-illustration.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("regisSys_user");
    if (savedUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        localStorage.setItem("regisSys_user", JSON.stringify(user));
        localStorage.setItem("regisSys_pw", password);
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/users/google-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: tokenResponse.access_token }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("regisSys_user", JSON.stringify(data.user));
          navigate("/dashboard");
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Google Login failed");
        }
      } catch (err) {
        console.error("Google login fetch error:", err);
        setError("Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Error:", error);
      setError("Google Login was unsuccessful. Please try again.");
    },
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-2 sm:p-4 md:p-8 font-sans">
      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] bg-white rounded-[24px] md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(31,42,86,0.15)] overflow-hidden flex flex-col md:flex-row md:min-h-[600px] animate-in fade-in zoom-in-95 duration-700">

        {/* Left Side: Branding & Illustration (Primary Navy) - Hidden on Mobile */}
        <div className="hidden md:flex w-full md:w-1/2 p-12 lg:p-16 flex-col justify-center items-center bg-[#1f2a56] text-center relative overflow-hidden">
          {/* Subtle Background Accent */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[320px] relative z-10 w-full flex flex-col items-center">
            <img
              src={illustration}
              alt="RegiSys Services"
              className="w-32 md:w-full h-auto mb-6 md:mb-8 animate-in slide-in-from-left duration-1000 brightness-110 drop-shadow-2xl rounded-[20px] md:rounded-[32px] mx-auto"
            />
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-4 tracking-tighter italic">Registration System</h2>
            <p className="text-blue-100/60 text-[10px] md:text-sm font-medium leading-loose md:leading-relaxed">
              Access your unified institutional dashboard and manage your digital identity with ease.
            </p>
          </div>
        </div>

        {/* Right Side: Action Area (Soft White) */}
        <div className="w-full md:w-1/2 bg-[#f8fafc] p-6 sm:p-10 lg:p-16 flex flex-col justify-center relative">
          {/* Decorative Back Button */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Mobile Only Header */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <h2 className="text-xl font-black text-[#1f2a56] italic">Registration System</h2>
            <div className="h-1 w-12 bg-[#1f2a56] rounded-full mt-1" />
          </div>

          <div className="max-w-[360px] mx-auto w-full">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Welcome!</h1>
            <p className="text-slate-400 text-sm font-bold mb-10 tracking-wide ">Login to your portal</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {location.search.includes("registered=true") && !error && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Registration Successful!
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#1f2a56]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#1f2a56]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-14 pr-14 py-5 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end px-2">
                  <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-slate-400 hover:text-[#1f2a56] transition-colors tracking-widest">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-5 rounded-full bg-[#1f2a56] hover:bg-[#151c3a] text-white font-black text-xs uppercase tracking-[2px] shadow-lg shadow-blue-900/20 active:scale-[0.95] transition-all flex items-center justify-center gap-3 ${isLoading ? "opacity-90" : ""}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or continue with</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full py-5 rounded-full bg-white hover:bg-slate-50 border border-slate-100 shadow-sm text-slate-600 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-xs font-bold  tracking-wider">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-[#1f2a56] hover:text-[#151c3a] underline decoration-2 underline-offset-4 transition-colors">
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;