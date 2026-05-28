import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft
} from "lucide-react";

import { useGoogleLogin } from "@react-oauth/google";

import { API_BASE_URL } from "../config";
import { clearSession } from "../utils/session";
import illustration from "../assets/auth-illustration.png";

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("regisSys_user");
    if (!savedUser) {
      clearSession();
    }
  }, []);

  const [detectedRole, setDetectedRole] = useState(null);
  const [isResolvingRole, setIsResolvingRole] = useState(false);
  const debounceRef = useRef(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const email = formData.email.trim();
    const parts = email.split("@");
    const hasValidDomain = parts.length === 2 && parts[1].includes(".");

    if (!hasValidDomain) {
      setDetectedRole(null);
      setIsResolvingRole(false);
      return;
    }

    setIsResolvingRole(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(email);
        const res = await fetch(`${API_BASE_URL}/roles/resolve?email=${encoded}`);
        if (res.ok) {
          const data = await res.json();
          setDetectedRole(data);
        } else {
          setDetectedRole(null);
        }
      } catch {
        setDetectedRole(null);
      } finally {
        setIsResolvingRole(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullname,
          email: formData.email.trim(),
          password: formData.password,
          external_id: formData.email.split("@")[0],
          attributes: {
            signed_up_at: new Date().toISOString(),
            is_profile_complete: false,
          },
        }),
      });

      if (response.ok) {
        navigate("/login?registered=true");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Connection error. Is the backend running?");
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
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(31,42,86,0.15)] overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-700">

        {/* Left Side: Branding & Illustration (Primary Navy) */}
        <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center items-center bg-[#1f2a56] text-center relative overflow-hidden text-white">
          {/* Subtle Background Accent */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[320px] relative z-10">
            <img
              src={illustration}
              alt="Join RegiSys"
              className="w-full h-auto mb-8 animate-in slide-in-from-left duration-1000 brightness-110 drop-shadow-2xl rounded-[32px]"
            />
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter italic">Start Your Journey.</h2>
            <p className="text-blue-100/60 text-sm font-medium leading-loose">
              Join the most secure registration platform and manage your institutional profile effortlessly.
            </p>
          </div>
        </div>

        {/* Right Side: Action Area (Soft White) */}
        <div className="w-full md:w-1/2 bg-[#f8fafc] p-10 lg:p-14 flex flex-col justify-center relative">
          {/* Decorative Back Button */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="max-w-[380px] mx-auto w-full">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Create an account!</h1>
            <p className="text-slate-400 text-[10px] font-black mb-8 tracking-wide ">Create your Regisys account</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#1f2a56]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#1f2a56]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                />
                {isResolvingRole && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
                {detectedRole && (
                  <span className="absolute -top-3 right-4 text-[9px] font-black bg-[#1f2a56] text-white px-2 py-1 rounded-full  tracking-tighter shadow-sm border border-white/20 animate-in bounce-in">
                    {detectedRole.name} detected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full px-6 py-4 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm"
                    className="w-full px-6 py-4 bg-white border border-slate-100 rounded-full shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 mt-2 rounded-full bg-[#1f2a56] hover:bg-[#151c3a] text-white font-black text-xs uppercase tracking-[2px] shadow-lg shadow-blue-900/20 active:scale-[0.95] transition-all flex items-center justify-center gap-3 ${isLoading ? "opacity-90" : ""}`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">or join with</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-white hover:bg-slate-50 border border-slate-100 shadow-sm text-slate-600 font-bold text-sm transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-[10px] font-black text-slate-400 hover:text-[#1f2a56] tracking-[1px] transition-all">
                  Already have an account? <span className="text-[#1f2a56] underline decoration-2 underline-offset-4">Login here</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
