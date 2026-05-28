import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CompleteRegistration from "./pages/CompleteRegistration";
import IDBuilder from "./pages/IDBuilder";
import { API_BASE_URL } from "./config";

function ThemeManager() {
  const location = useLocation();

  useEffect(() => {
    const updateStyles = (primary) => {
      let styleEl = document.getElementById('dynamic-theme');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-theme';
        document.head.appendChild(styleEl);
      }
      
      styleEl.innerHTML = `
        :root {
          --theme-primary: ${primary};
        }
        
        html.dark {
          /* Lighten the primary color for charts and accents in dark mode - better for matte backgrounds */
          --theme-primary: color-mix(in srgb, ${primary} 40%, #93c5fd);
        }
        
        /* Structural Navy Overrides */
        .system-theme-root .bg-\\[\\#1a234b\\], 
        .system-theme-root .bg-\\[\\#1f2a56\\], 
        .system-theme-root .bg-\\[\\#1f264d\\],
        .system-theme-root .bg-blue-600,
        .system-theme-root .bg-blue-700,
        .system-theme-root .bg-indigo-600 { background-color: ${primary} !important; }
        
        /* Active Indicators & Special Backgrounds */
        .system-theme-root .bg-blue-600\\/20,
        .system-theme-root .bg-blue-500\\/20 { background-color: ${primary}33 !important; } 

        .system-theme-root .bg-[#2a376b],
        .system-theme-root .hover\\:bg-blue-700:hover,
        .system-theme-root .hover\\:bg-indigo-700:hover { background-color: ${primary} !important; filter: brightness(1.2); }
        
        /* Text Color Overrides */
        html:not(.dark) .system-theme-root .text-\\[\\#1a234b\\], 
        html:not(.dark) .system-theme-root .text-\\[\\#1f2a56\\], 
        html:not(.dark) .system-theme-root .text-\\[\\#1f264d\\],
        html:not(.dark) .system-theme-root .text-blue-600,
        html:not(.dark) .system-theme-root .text-indigo-600,
        html:not(.dark) .system-theme-root .text-emerald-600,
        html:not(.dark) .system-theme-root .text-green-600,
        html:not(.dark) .system-theme-root .text-amber-500 { color: ${primary} !important; }

        html.dark .system-theme-root .dark\\:text-white\\/90 { color: rgba(255,255,255,0.9) !important; }
        html.dark .system-theme-root .dark\\:text-white { color: #ffffff !important; }
        
        /* Border & Ring Overrides */
        .system-theme-root .border-\\[\\#1a234b\\],
        .system-theme-root .border-blue-600,
        .system-theme-root .border-blue-400,
        .system-theme-root .border-blue-200,
        .system-theme-root .border-indigo-600,
        .system-theme-root .focus\\:border-blue-600:focus,
        .system-theme-root .focus\\:ring-blue-600:focus { border-color: ${primary} !important; --tw-ring-color: ${primary} !important; }
        
        /* Sidebar Active Bar / L-Border */
        .system-theme-root .border-l-2.border-blue-400,
        .system-theme-root .border-l-4.border-blue-600 { border-color: ${primary} !important; }

        /* Hover States */
        .system-theme-root .group:hover\\:bg-\\[\\#1f2a56\\]:hover,
        .system-theme-root .group-hover\\:text-blue-600,
        .system-theme-root .group-hover\\:text-indigo-600 { color: ${primary} !important; }

        /* Gradients */
        .system-theme-root .from-\\[\\#1a234b\\],
        .system-theme-root .from-blue-600 { --tw-gradient-from: ${primary} var(--tw-gradient-from-position) !important; }
      `;
    };

    const fetchTheme = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("regisSys_user") || "{}");
        // Only apply theme if user is Super Admin or Administrator AND on an admin-related path
        const isAdminPath = ["/dashboard", "/id-builder"].includes(location.pathname);
        const hasThemeAccess = ["Super Admin", "Administrator"].includes(user.role_context);

        if (!hasThemeAccess || !isAdminPath) {
          const styleEl = document.getElementById('dynamic-theme');
          if (styleEl) styleEl.remove();
          return;
        }

        const res = await fetch(`${API_BASE_URL}/settings/theme`);
        if (res.ok) {
          const data = await res.json();
          if (data.primary_color) updateStyles(data.primary_color);
        }
      } catch (e) {
        console.error("Theme load failed", e);
      }
    };

    const handleInstantUpdate = (e) => {
      if (e.detail && e.detail.primary_color) {
        updateStyles(e.detail.primary_color);
      }
    };
    
    fetchTheme();
    window.addEventListener('theme-updated', fetchTheme);
    window.addEventListener('theme-update-instant', handleInstantUpdate);
    window.addEventListener('storage', fetchTheme);
    return () => {
      window.removeEventListener('theme-updated', fetchTheme);
      window.removeEventListener('theme-update-instant', handleInstantUpdate);
      window.removeEventListener('storage', fetchTheme);
    };
  }, [location.pathname]);
  
  return null;
}

function SecurityGuard() {
  const [isRestricted, setIsRestricted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      const userStr = localStorage.getItem("regisSys_user");
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.id}`);
        if (res.status === 404 || res.status === 401) {
          setIsRestricted(true);
        }
      } catch (e) {
        // Silently ignore network errors during background check
      }
    };

    const isAdminPath = ["/dashboard", "/id-builder", "/complete-registration"].includes(location.pathname);
    if (!isAdminPath) return;

    checkStatus(); // Initial check on mount/route change
    const interval = setInterval(checkStatus, 5000); // Slower poll
    return () => clearInterval(interval);
  }, [location.pathname]); // Also re-check whenever the user navigates

  const handleExit = () => {
    localStorage.removeItem("regisSys_user");
    window.location.href = "/login";
  };

  const isAdminPath = ["/dashboard", "/id-builder", "/complete-registration"].includes(location.pathname);
  if (!isRestricted || !isAdminPath) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-rose-500/20 animate-in zoom-in-95 duration-700">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-4 italic">Security Alert</h2>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              Your account has been restricted or removed by a secure system administrator.
            </p>
            <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 py-3 rounded-xl px-4 inline-block">
              Your current session is no longer active
            </p>
          </div>
          
          <button 
            onClick={handleExit}
            className="w-full mt-8 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 active:scale-95"
          >
            OKAY
          </button>
        </div>
        <div className="h-1.5 bg-rose-500 w-full" />
      </div>
    </div>
  );
}

const isAuthenticated = () => {
  return localStorage.getItem("regisSys_user") !== null;
};

const isProfileComplete = () => {
  const user = JSON.parse(localStorage.getItem("regisSys_user") || "{}");
  if (user.role_context === "Super Admin") return true;
  return user.attributes?.is_profile_complete === true;
};

// Protected routes require authentication
function ProtectedRoute({ children, requireVerified = false }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (requireVerified && !isProfileComplete()) return <Navigate to="/complete-registration" replace />;
  return children;
}

// Public routes block authenticated users
function PublicRoute({ children }) {
  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <ThemeManager />
      <SecurityGuard />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/complete-registration" 
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/id-builder" 
          element={
            <ProtectedRoute requireVerified={true}>
              <IDBuilder />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;