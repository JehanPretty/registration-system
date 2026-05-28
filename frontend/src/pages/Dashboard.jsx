import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, ChevronDown, UserCircle, QrCode, ShieldCheck, Menu, X, CheckCircle2, AlertTriangle, BellRing, CreditCard, Moon, Sun, Search, LogOut, Settings, Palette, Key, History, ChevronRight } from "lucide-react";
import ManageRoles from "./ManageRoles";
import FormDesigner from "./FormDesigner";
import ProfileDetails from "./ProfileDetails";
import IDBuilder from "./IDBuilder";
import Users from "./Users";
import Analytics from "./Analytics";
import RegistrationAnalytics from "./RegistrationAnalytics";
import AuditLog from "./AuditLog";
import Reports from "./Reports";
import AccountSettings from "./AccountSettings";
import DigitalID from "./DigitalID";
import MissionControl from "./MissionControl";
import ThemeCustomizer from "../components/ThemeCustomizer";

import { API_BASE_URL } from "../config";
import { clearSession } from "../utils/session";
import {
  sidebarByRole,
  defaultSidebar,
  navItemRegistry,
  adminToolItems,
  viewTitles,
} from "../config/sidebarConfig";

const resolveImageUrl = (url) => {
  if (!url) return url;
  if (typeof url === 'string') {
    if (url.startsWith('/static')) {
      return `${API_BASE_URL}${url}`;
    }
    if (url.includes('/static/') && url.startsWith('http')) {
      const path = '/static/' + url.split('/static/').pop();
      return `${API_BASE_URL}${path}`;
    }
  }
  return url;
};

const VerifiedView = ({ userData, isSuperAdmin, navigate, children }) => {
  if (userData.status === 'verified' || isSuperAdmin) {
    return children;
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-20">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-center p-8 sm:p-12 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter italic text-center">Verification Required</h3>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10 text-center">
          This system feature is restricted to verified accounts. Please complete your identity verification to unlock full access.
        </p>
        <button 
          onClick={() => navigate("/complete-registration")}
          className="w-full py-5 bg-[#1a234b] dark:bg-blue-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Verify Account Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showDeletedAlert, setShowDeletedAlert] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all"); // "all" or "unread"
  const [unreadKeys, setUnreadKeys] = useState(["admin-pending", "user-status"]);
  const [userApplication, setUserApplication] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const dropdownRef = React.useRef(null);
  const notificationDropdownRef = React.useRef(null);
  const searchContainerRef = React.useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("regisSys_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [primaryColor, setPrimaryColor] = useState("#1f2a56");

  const generateInitialsAvatar = (name) => {
    const formattedName = name ? name.replace(/\s+/g, '+') : 'User';
    return `https://ui-avatars.com/api/?name=${formattedName}&background=e2e8f0&color=1e293b&size=256&bold=true`;
  };

  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("regisSys_user");
    return saved ? JSON.parse(saved) : { name: "Guest", role_context: "" };
  });

  const [profileAvatar, setProfileAvatar] = useState(() => {
    const savedUser = localStorage.getItem("regisSys_user");
    const userName = savedUser ? JSON.parse(savedUser).name : "User";
    return localStorage.getItem("regisSys_profileAvatar") || generateInitialsAvatar(userName);
  });
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("regisSys_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // --- PER-USER THEME SYNC (localStorage, not global) ---
  React.useEffect(() => {
    if (!userData?.id) return;
    // Load this user's saved theme from localStorage
    const saved = localStorage.getItem(`regisSys_primaryColor_${userData.id}`);
    if (saved) setPrimaryColor(saved);

    const handleInstantUpdate = (e) => {
      if (e.detail?.primary_color) setPrimaryColor(e.detail.primary_color);
    };

    window.addEventListener('theme-update-instant', handleInstantUpdate);
    return () => {
      window.removeEventListener('theme-update-instant', handleInstantUpdate);
    };
  }, [userData?.id]);

  React.useEffect(() => {
    // Only apply primary color as sidebar bg if NOT in dark mode, 
    // OR if we want the custom theme to ALWAYS override the sidebar bg.
    // Given the user request, let's make it applicable to the sidebar.
    document.documentElement.style.setProperty('--bg-sidebar', primaryColor);

    // Create an active/hover state derived from the primary color
    // We use a white overlay with 15% opacity to make it look good on any primary color
    document.documentElement.style.setProperty('--bg-sidebar-active', 'rgba(255, 255, 255, 0.15)');
  }, [primaryColor]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchContainerRef.current) {
          const input = searchContainerRef.current.querySelector('input');
          if (input) input.focus();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);



  const isSuperAdmin = userData.role_context === "Super Admin";
  const isProfileIncomplete = !userData.role_context || !userData.attributes || !userData.attributes.is_profile_complete;
  const userRole = userData.role_context || "default";

  // Resolve sidebar items for current role
  const sidebarItems = sidebarByRole[userRole] || defaultSidebar;

  const [activeView, setActiveView] = useState(() => {
    // Try to restore from localStorage first
    const savedView = localStorage.getItem(`regisSys_activeView_${userData.id}`);
    
    // Validate if the saved view is allowed for this user's role
    const isValidView = savedView && (sidebarItems.includes(savedView) || 
                        (sidebarItems.includes("admin-tools") && adminToolItems.some(item => item.key === savedView)));
    
    if (isValidView) return savedView;

    const firstItem = sidebarItems[0];
    return firstItem === "admin-tools" ? "analytics" : firstItem;
  });

  // Persist activeView whenever it changes
  React.useEffect(() => {
    if (userData?.id && activeView) {
      localStorage.setItem(`regisSys_activeView_${userData.id}`, activeView);
    }
  }, [activeView, userData?.id]);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [formSections, setFormSections] = useState([]);

  // Derived state for Quick Find Search
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const availableKeys = [...sidebarItems];
    if (sidebarItems.includes("admin-tools")) {
      adminToolItems.forEach(tool => availableKeys.push(tool.key));
    }

    const navResults = availableKeys
      .map(key => ({
        type: 'nav',
        key,
        title: viewTitles[key] || key.replace(/-/g, " "),
        action: () => {
          setActiveView(key);
          setSearchQuery("");
          setShowSearchResults(false);
        }
      }))
      .filter(item => {
        if (!item.title) return false;
        const searchStr = `${item.title} ${item.key}`.toLowerCase();
        return searchStr.includes(query);
      })
      .slice(0, 4);

    let userResults = [];
    if (globalUsers.length > 0) {
      userResults = globalUsers
        .filter(u => (u.name && u.name.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query)))
        .map(u => ({
          type: 'user',
          key: `user-${u.id}`,
          title: u.name,
          subtitle: u.role_context || "User",
          action: () => {
            setActiveView("users");
            setSearchQuery("");
            setShowSearchResults(false);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('global-search', { detail: { query: u.name } }));
            }, 100);
          }
        }))
        .slice(0, 3);
    }

    let roleResults = [];
    if (["Super Admin", "Administrator"].includes(userData?.role_context) && userRoles.length > 0) {
      roleResults = userRoles
        .filter(r => r.toLowerCase().includes(query))
        .map(r => ({
          type: 'role',
          key: `role-${r}`,
          title: `Role: ${r}`,
          subtitle: "Manage Settings",
          action: () => {
            setActiveView("add-section");
            setSelectedRole(r);
            setSearchQuery("");
            setShowSearchResults(false);
          }
        }))
        .slice(0, 2);
    }

    const actionResults = [
      {
        type: 'action',
        key: 'action-logout',
        title: 'Logout / Sign Out',
        subtitle: 'Securely exit system',
        action: () => { setShowLogoutModal(true); setSearchQuery(""); setShowSearchResults(false); }
      },
      {
        type: 'action',
        key: 'action-theme',
        title: 'Theme: Toggle Dark/Light',
        subtitle: 'Switch application appearance',
        action: () => { setIsDarkMode(!isDarkMode); setSearchQuery(""); setShowSearchResults(false); }
      },
      {
        type: 'action',
        key: 'action-customize',
        title: 'Theme: Customize Colors',
        subtitle: 'Modify system branding',
        action: () => { setShowThemeCustomizer(true); setSearchQuery(""); setShowSearchResults(false); }
      },
      {
        type: 'action',
        key: 'action-password',
        title: 'Settings: Change Password',
        subtitle: 'Security and credentials',
        action: () => { setActiveView("account-settings"); setSearchQuery(""); setShowSearchResults(false); }
      },
      {
        type: 'action',
        key: 'action-photo',
        title: 'Settings: Update Profile Photo',
        subtitle: 'Personal details and avatar',
        action: () => { setActiveView("personal-details"); setSearchQuery(""); setShowSearchResults(false); }
      },
      {
        type: 'action',
        key: 'action-qr',
        title: 'View Digital ID / QR Code',
        subtitle: 'Access your identity badge',
        action: () => { setActiveView("qr-code"); setSearchQuery(""); setShowSearchResults(false); }
      }
    ].filter(a => a.title.toLowerCase().includes(query) || a.subtitle.toLowerCase().includes(query));

    return [...navResults, ...roleResults, ...userResults, ...actionResults];
  }, [searchQuery, sidebarItems, globalUsers, userRoles, userData?.role_context, isDarkMode]);

  const fileInputRef = React.useRef(null);

  // Fetch initial roles and forms
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const rolesRes = await fetch(`${API_BASE_URL}/roles/`);
        if (rolesRes.ok) {
          const roles = await rolesRes.json();
          const roleNames = roles.map(r => r.name);
          setUserRoles(roleNames.length > 0 ? roleNames : ["Student", "Teacher", "Staff"]);
          if (roleNames.length > 0 && !selectedRole) setSelectedRole(roleNames[0]);
          else if (!selectedRole) setSelectedRole("Student");
        }

        const savedUser = localStorage.getItem("regisSys_user");
        if (savedUser) {
          const { id, role_context } = JSON.parse(savedUser);

          if (["Super Admin", "Administrator", "Registrar Staff"].includes(role_context)) {
            fetch(`${API_BASE_URL}/users/`)
              .then(res => res.json())
              .then(data => setGlobalUsers(data))
              .catch(err => console.error("Failed to load global users:", err));
          }

          const userRes = await fetch(`${API_BASE_URL}/users/${id}`);
          if (userRes.ok) {
            const user = await userRes.json();
            setUserData(user);
            if (user.avatar_url) {
              setProfileAvatar(user.avatar_url);
              localStorage.setItem("regisSys_profileAvatar", user.avatar_url);
            }
          } else if (userRes.status === 404) {
            setShowDeletedAlert(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch current user data:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Poll for pending applications count for Admin/Registrar notifications
  React.useEffect(() => {
    if (!["Super Admin", "Registrar Staff", "Administrator"].includes(userData.role_context)) return;

    const fetchPendingCount = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/applications?status=pending`);
        if (res.ok) {
          const data = await res.json();
          const newCount = data.length;

          setPendingAppsCount(newCount);
        }
      } catch (err) {
        console.error("Failed to poll pending apps count:", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000); // Poll every 15s to be polite but responsive
    return () => clearInterval(interval);
  }, [userData.role_context]);

  // Fetch user application for personal notifications
  React.useEffect(() => {
    if (!userData?.id) return;
    const fetchUserApp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/applications/user/${userData.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserApplication(data);
        }
      } catch (err) {
        console.error("Failed to fetch user application for notification:", err);
      }
    };
    fetchUserApp();
    const interval = setInterval(fetchUserApp, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [userData.id]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  React.useEffect(() => {
    const saved = localStorage.getItem("regisSys_user");
    if (!saved) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  React.useEffect(() => {
    if (!selectedRole) return;
    const fetchForm = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/forms/${encodeURIComponent(selectedRole)}`, {
          headers: { "Bypass-Tunnel-Reminder": "true" }
        });
        if (res.ok) {
          const data = await res.json();
          // Map Backend structure to Frontend structure (Standardized for Designer)
          const mappedSections = data.map(sec => ({
            id: `sec-${sec.id}`,
            role_name: sec.role_name || selectedRole,
            sectionTitle: sec.title,
            fields: (sec.fields || []).map(f => ({
              id: `f-${f.id}`,
              label: f.label,
              type: f.type,
              required: f.required,
              placeholder: f.placeholder,
              options: f.options || []
            }))
          }));

          // Update only sections for current role, keep others to avoid flickering
          setFormSections(prev => {
            const filtered = prev.filter(s => (s.role_name || s.role) !== selectedRole);
            return [...filtered, ...mappedSections];
          });
        }
      } catch (err) {
        console.error("Failed to fetch form sections:", err);
      }
    };
    fetchForm();
  }, [selectedRole]);

  const updateAvatarInBackend = async (url) => {
    if (!userData?.id) return;
    try {
      await fetch(`${API_BASE_URL}/users/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
    } catch (error) {
      console.error("Failed to update avatar in backend:", error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setProfileAvatar(base64String);
        localStorage.setItem("regisSys_profileAvatar", base64String);
        await updateAvatarInBackend(base64String);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] font-sans text-[var(--text-primary)] system-theme-root overflow-hidden">
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center animate-in zoom-in-95 duration-300 border border-white/10 relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100 dark:border-red-500/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3-6l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Confirm Logout</h3>
              <p className="text-gray-500 dark:text-slate-400 text-base mt-3 leading-relaxed">Are you sure you want to end your current session? You will need to login again to access your dashboard.</p>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-4 px-6 rounded-2xl bg-red-600 text-white font-bold shadow-lg shadow-red-200 dark:shadow-red-900/20 hover:bg-red-700 hover:shadow-red-300 dark:hover:shadow-red-900/40 transition-all active:scale-95"
                >
                  Logout Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BACKDROP ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />

      {/* ── SIDEBAR (Responsive) ── */}
      <aside className={`
        bg-[var(--bg-sidebar)] text-white flex flex-col transition-all duration-300 shadow-2xl z-[70] overflow-hidden
        fixed inset-y-0 left-0 w-[min(400px,85vw)] md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isOpen ? "md:w-80" : "md:w-24"}
      `}>
        {/* Galaxy Theme Stars & Nebula Background */}
        {primaryColor === "#140a2e" && (
          <>
            {/* Colorful Nebula Glows */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 60%, rgba(14, 165, 233, 0.3) 0%, transparent 60%), radial-gradient(circle at 50% 90%, rgba(217, 70, 239, 0.25) 0%, transparent 60%)'
              }}
            />
            {/* Brighter Dense Stars */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-100"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.4) 1px, transparent 1.5px), radial-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.2) 1px, transparent 1.5px), radial-gradient(rgba(255,255,255,1), rgba(255,255,255,0.3) 2px, transparent 2px)',
                backgroundSize: '150px 150px, 250px 250px, 350px 350px',
                backgroundPosition: '0 0, 40px 60px, 130px 270px'
              }}
            />
          </>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="flex items-center justify-between h-16 px-6 md:px-4 mb-2">
            <div className={`flex items-center gap-3 w-full ${(!isOpen && "md:justify-center")}`}>
              <svg className="w-7 h-7 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              {(isOpen || isMobileMenuOpen) && (
                <h1 className="text-lg font-black text-white tracking-tight leading-none animate-in fade-in duration-300">
                  Regis<span className="text-blue-400">Sys</span>
                </h1>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className={`px-4 py-6 border-b border-white/5 space-y-3 mb-2 ${(!isOpen && !isMobileMenuOpen) && "md:px-2"}`}>
            <div className={`flex items-center gap-3 px-2 ${(!isOpen && !isMobileMenuOpen) && "md:justify-center"}`}>
              <div className="relative shrink-0">
                <img src={resolveImageUrl(profileAvatar)} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-sm object-cover" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full shadow-sm"></div>
              </div>
              {(isOpen || isMobileMenuOpen) && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-lg font-black text-white tracking-tight truncate leading-none mb-1">{userData.name}</p>
                  <p className="text-xs font-black text-blue-400 truncate leading-none flex items-center gap-1.5">{userData.role_context}</p>
                  {userData.external_id && (
                    <p className="text-[9px] font-black text-white/40 truncate leading-none mt-1 uppercase tracking-wider">{userData.external_id}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-1.5 px-4">
            <div className="pt-4 pb-2">
              <p className={`text-[9px] font-black text-slate-500 mb-2 ${(!isOpen && !isMobileMenuOpen) && "md:hidden text-center"}`}>
                {isSuperAdmin ? "Management Suite" : "Navigation"}
              </p>
              <div className="h-[1px] bg-white/5 w-full mb-1" />
            </div>

            {sidebarItems.map((itemKey) => {
              if (itemKey === "admin-tools") {
                return (
                  <div key="admin-tools" className="pt-4 pb-2">
                    <p className={`text-[9px] font-black text-slate-500 mb-2 ${(!isOpen && !isMobileMenuOpen) && "md:hidden text-center"}`}>
                      Admin Tools
                    </p>
                    <div className="h-[1px] bg-white/5 w-full mb-2" />
                    <div className="space-y-1.5">
                      {adminToolItems.map((tool) => (
                        <button
                          key={tool.key}
                          type="button"
                          onClick={() => { setActiveView(tool.key); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeView === tool.key ? "bg-[var(--bg-sidebar-active)] text-white" : "text-slate-400 hover:text-white hover:bg-white/5"} ${(!isOpen && !isMobileMenuOpen) ? "md:justify-center" : "px-4"}`}
                        >
                          {navItemRegistry[tool.key]?.icon || tool.icon}
                          {(isOpen || isMobileMenuOpen) && (
                            <span className="font-bold text-[11px] whitespace-nowrap">{tool.label}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              const item = navItemRegistry[itemKey];
              if (!item) return null;
              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => { setActiveView(itemKey); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeView === itemKey ? "bg-[var(--bg-sidebar-active)] text-white" : "text-slate-400 hover:text-white hover:bg-white/5"} ${(!isOpen && !isMobileMenuOpen) ? "md:justify-center" : "px-4"}`}
                >
                  {item.icon}
                  {(isOpen || isMobileMenuOpen) && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-bold text-[11px] whitespace-nowrap">{item.label}</span>
                      {itemKey === "mission-control" && pendingAppsCount > 0 && (
                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                          {pendingAppsCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 space-y-4">
          {/* ── DARK MODE TOGGLE ── */}
          <div className={`relative px-4 py-3 bg-white/5 rounded-[1.25rem] flex items-center justify-between transition-all ${(!isOpen && !isMobileMenuOpen) && "md:px-2 md:justify-center"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-400"}`}>
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              {(isOpen || isMobileMenuOpen) && (
                <span className="text-[11px] font-bold text-slate-300">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </span>
              )}
            </div>
            {(isOpen || isMobileMenuOpen) && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? "bg-blue-600" : "bg-slate-600"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            )}
            {(!isOpen && !isMobileMenuOpen) && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="absolute inset-0 z-10 opacity-0 cursor-pointer"
              />
            )}
          </div>

          <div className="border-t border-white/5 pt-4">
            <button onClick={() => setShowLogoutModal(true)} className={`flex items-center gap-3 py-3 rounded-xl w-full hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all group ${(!isOpen && !isMobileMenuOpen) ? "md:justify-center" : "px-4"}`}>
              <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              {(isOpen || isMobileMenuOpen) && <span className="font-bold text-[11px] tracking-tight">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen transition-all duration-300">
        <header className="bg-[var(--bg-sidebar)] text-white px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center shadow-md z-40 shrink-0 sticky top-0">
          <div className="flex items-center gap-3 md:gap-5">
            {/* Burger Menu Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Collapse Sidebar Button (Desktop Only) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden md:flex w-9 h-9 items-center justify-center text-white/70 hover:text-white transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="hidden lg:block text-base md:text-lg font-black text-white tracking-tighter truncate max-w-[150px] sm:max-w-none">
              {viewTitles[activeView] || activeView.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-5 relative" ref={dropdownRef}>
            {/* QUICK FIND SEARCH */}
            <div className="w-[180px] md:w-[450px] hidden sm:block relative group" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    e.preventDefault();
                    searchResults[0].action();
                  }
                }}
                placeholder="Quick find..."
                className="w-full bg-white/90 backdrop-blur-sm text-slate-700 placeholder-slate-400 text-[10px] font-bold rounded-xl py-2 pl-9 pr-4 outline-none transition-all border border-white/20 focus:border-blue-400 shadow-sm focus:shadow-md"
              />

              {showSearchResults && searchQuery.trim() !== "" && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <button
                        key={result.key}
                        onClick={result.action}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 group/item"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${result.type === 'user'
                          ? 'bg-emerald-50 text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white'
                          : result.type === 'role'
                            ? 'bg-purple-50 text-purple-500 group-hover/item:bg-purple-500 group-hover/item:text-white'
                            : result.type === 'action'
                              ? 'bg-amber-50 text-amber-500 group-hover/item:bg-amber-500 group-hover/item:text-white'
                              : 'bg-blue-50 text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white'
                          }`}>
                          {result.type === 'user' ? <UserCircle className="w-4 h-4" /> :
                            result.type === 'role' ? <ShieldCheck className="w-4 h-4" /> :
                              result.type === 'action' ? (
                                result.key === 'action-logout' ? <LogOut className="w-4 h-4" /> :
                                  result.key === 'action-theme' ? <Sun className="w-4 h-4" /> :
                                    result.key === 'action-password' ? <Key className="w-4 h-4" /> :
                                      result.key === 'action-photo' ? <UserCircle className="w-4 h-4" /> :
                                        result.key === 'action-qr' ? <QrCode className="w-4 h-4" /> :
                                          <Palette className="w-4 h-4" />
                              ) :
                                <Search className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{result.title}</span>
                          {(result.type === 'user' || result.type === 'role' || result.type === 'action') && <span className="text-[9px] font-bold text-slate-400 block">{result.subtitle}</span>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Search className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="hidden sm:flex w-10 h-10 items-center justify-center text-white/50 hover:text-white transition-all relative active:scale-90"
              >
                <Bell className="w-5 h-5" />
                {(pendingAppsCount > 0 || (userApplication && userApplication.status !== 'completed')) && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full border-2 border-[var(--bg-sidebar)] shadow-sm flex items-center justify-center animate-bounce">
                    {pendingAppsCount > 0 ? (pendingAppsCount > 9 ? "9+" : pendingAppsCount) : "!"}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute top-full right-[-50px] mt-2 w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-800 tracking-widest">Notifications</h3>
                      <button 
                        onClick={() => setUnreadKeys([])}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNotificationFilter("all")}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
                          notificationFilter === "all" 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setNotificationFilter("unread")}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center gap-2 ${
                          notificationFilter === "unread" 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        Unread
                        {unreadKeys.length > 0 && (
                          <span className={`${notificationFilter === 'unread' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'} px-1.5 py-0.5 rounded-full text-[8px]`}>
                            {unreadKeys.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {pendingAppsCount > 0 && ["Super Admin", "Registrar Staff", "Administrator"].includes(userData.role_context) && (notificationFilter === "all" || unreadKeys.includes("admin-pending")) && (
                      <button
                        onClick={() => { 
                          setActiveView("mission-control"); 
                          setShowNotificationDropdown(false); 
                          setUnreadKeys(prev => prev.filter(k => k !== "admin-pending"));
                        }}
                        className="w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 flex gap-4 relative"
                      >
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 mb-1">Pending ID Applications</p>
                          <p className="text-[10px] font-bold text-slate-400">There are {pendingAppsCount} new applications waiting for your review in the dock.</p>
                        </div>
                        {unreadKeys.includes("admin-pending") && <div className="w-2 h-2 bg-blue-500 rounded-full self-center shrink-0 ml-auto" />}
                      </button>
                    )}

                    {userApplication && (notificationFilter === "all" || unreadKeys.includes("user-status")) && (
                      <button
                        onClick={() => { 
                          setActiveView("qr-code"); 
                          setShowNotificationDropdown(false); 
                          setUnreadKeys(prev => prev.filter(k => k !== "user-status"));
                        }}
                        className="w-full p-4 text-left bg-indigo-50/10 hover:bg-indigo-50/30 transition-colors border-b border-slate-50 flex gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] font-black text-slate-800 mb-1">PVC ID Request Status</p>

                          {userApplication.status === "pending" && (
                            <p className="text-[10px] font-bold text-slate-500">Your PVC Request has been submitted and is currently pending registrar review.</p>
                          )}
                          {userApplication.status === "rejected" && (
                            <p className="text-[10px] font-bold text-rose-600">Your PVC Request was rejected by the registrar. Please check your profile details.</p>
                          )}
                          {userApplication.status === "approved" && (
                            <p className="text-[10px] font-bold text-blue-600">Your PVC card has been approved! It is currently queued in print production.</p>
                          )}
                          {userApplication.status === "printed" && userApplication.fulfillment_method === "delivery" && !userApplication.tracking_number && (
                            <p className="text-[10px] font-bold text-indigo-600">Your PVC card has been printed! We are packaging it for shipment.</p>
                          )}
                          {userApplication.status === "printed" && userApplication.fulfillment_method === "delivery" && userApplication.tracking_number && (
                            <p className="text-[10px] font-bold text-indigo-600">Your PVC card has been shipped via J&T Express! Tracking No: <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded">{userApplication.tracking_number}</span>.</p>
                          )}
                          {userApplication.status === "printed" && userApplication.fulfillment_method === "pickup" && !userApplication.is_ready && (
                            <p className="text-[10px] font-bold text-slate-500">Your PVC card has been printed! Our team is currently filing it in organizing drawers.</p>
                          )}
                          {userApplication.status === "printed" && userApplication.fulfillment_method === "pickup" && userApplication.is_ready && (
                            <p className="text-[10px] font-bold text-amber-600 font-black">ID Ready for Pickup! Your physical PVC ID is ready for pick-up at: <span className="underline">{userApplication.collection_location || "Main Registrar Windows"}</span>.</p>
                          )}
                          {userApplication.status === "completed" && (
                            <p className="text-[10px] font-bold text-emerald-600">Fulfillment Complete! Your physical PVC ID card handover is successfully recorded.</p>
                          )}

                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">Track Claim Stub</span>
                        </div>
                        {unreadKeys.includes("user-status") && <div className="w-2 h-2 bg-blue-500 rounded-full self-center shrink-0 ml-auto" />}
                      </button>
                    )}

                    {pendingAppsCount === 0 && !userApplication && (
                      <div className="p-10 text-center">
                        <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-[11px] font-bold text-slate-400 italic">No new notifications</p>
                      </div>
                    )}

                    {/* Dummy Previous Notifications for Scroll Testing */}
                    {(pendingAppsCount > 0 || userApplication) && (
                      <>
                        <div className="px-5 py-3 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-50">
                          Earlier
                        </div>
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-full p-4 text-left hover:bg-slate-50/50 transition-colors border-b border-slate-50 flex gap-4 opacity-60">
                            <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                              <History className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-600 mb-1">Previous system activity</p>
                              <p className="text-[10px] font-bold text-slate-400">Activity record from {i+1} days ago.</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">See Previous notifications</button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 group p-1 pr-1 sm:pr-2 rounded-full hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/10 group-hover:border-blue-400 transition-all overflow-hidden shadow-sm">
                <img src={resolveImageUrl(profileAvatar)} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-slate-50 mb-2">
                  <p className="text-xs font-black text-slate-900 truncate tracking-tight">{userData.name}</p>
                  <p className="text-[10px] font-bold text-blue-500 truncate">{userData.role_context}</p>
                </div>
                <button
                  onClick={() => { setActiveView("personal-details"); setShowUserDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all"
                >
                  <UserCircle className="w-4 h-4" /> Personal Details
                </button>
                <button
                  onClick={() => { setActiveView("account-settings"); setShowUserDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all"
                >
                  <HelpCircle className="w-4 h-4" /> Account Settings
                </button>
                {["Super Admin", "Administrator"].includes(userData.role_context) && (
                  <button
                    onClick={() => { setShowThemeCustomizer(true); setShowUserDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" /> Custom Theme
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-y-auto custom-scrollbar bg-[var(--bg-main)] flex flex-col">
          {isProfileIncomplete && !isSuperAdmin ? (
            <div className="shrink-0 mb-6 p-4 md:p-6 bg-[#1e293b] rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-700 border-l-4 border-amber-500">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Verification Pending</h3>
                  <p className="text-white/60 text-[11px] font-medium max-w-sm">Please complete your registration to verify your identity and unlock all system features.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/complete-registration")} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] transition-all backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center gap-2 group">Complete Now</button>
              </div>
            </div>
          ) : activeView !== "qr-code" && !isSuperAdmin && !localStorage.getItem("regisSys_hideVerifiedNotice") && (
            <div className="mb-6 p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-green-100 flex flex-col md:flex-row items-start justify-between gap-6 animate-in fade-in duration-700 relative pr-12 group/verified">
              <button
                onClick={() => { localStorage.setItem("regisSys_hideVerifiedNotice", "true"); window.location.reload(); }}
                className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-all p-1 hover:bg-slate-50 rounded-full"
                title="Dismiss focus"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-green-100/50">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="pt-1">
                  <h3 className="font-black text-base text-slate-900 tracking-tight leading-none mb-2">Verified Account</h3>
                  <p className="text-slate-500 text-[11px] font-bold leading-relaxed max-w-xl">Your identity has been fully verified. You have unrestricted access to all system modules.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50/50 text-green-700 rounded-2xl text-[10px] font-black border border-green-100 self-start md:self-center">
                <ShieldCheck className="w-4 h-4" /> SECURE IDENTITY
              </div>
            </div>
          )}

          {activeView === "analytics" && <Analytics userRoles={userRoles} userName={userData.name} />}
          {activeView === "registration-analytics" && ["Super Admin", "Administrator", "Registrar Staff"].includes(userRole) && <RegistrationAnalytics />}
          {activeView === "reports" && ["Super Admin", "Administrator"].includes(userRole) && <Reports />}
          {activeView === "audit-log" && ["Super Admin", "Administrator"].includes(userRole) && <AuditLog userData={userData} />}
          {activeView === "personal-details" && <ProfileDetails profileAvatar={profileAvatar} fileInputRef={fileInputRef} userRoles={userRoles} userData={userData} />}
          {activeView === "account-settings" && <AccountSettings userData={userData} onNameChange={(name) => setUserData(prev => ({ ...prev, name }))} />}
          {activeView === "users" && <Users />}
          {activeView === "add-section" && ["Super Admin", "Administrator"].includes(userRole) && <ManageRoles userRoles={userRoles} setUserRoles={setUserRoles} formSections={formSections} setFormSections={setFormSections} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />}
          {activeView === "add-details" && ["Super Admin", "Administrator", "Registrar Staff"].includes(userRole) && <FormDesigner userRoles={userRoles} formSections={formSections} setFormSections={setFormSections} selectedRole={selectedRole} setSelectedRole={setSelectedRole} showFullPreview={showFullPreview} setShowFullPreview={setShowFullPreview} />}
          {activeView === "id-builder" && ["Super Admin", "Administrator", "Assistant Admin", "Registrar Staff"].includes(userRole) && <IDBuilder />}
          {activeView === "mission-control" && ["Super Admin", "Registrar Staff"].includes(userRole) && <MissionControl />}
          {activeView === "qr-code" && (
            <VerifiedView userData={userData} isSuperAdmin={isSuperAdmin} navigate={navigate}>
              <DigitalID userData={userData} setUserData={setUserData} />
            </VerifiedView>
          )}
          {["attendance", "documents", "schedule", "feedback"].includes(activeView) && (
            <VerifiedView userData={userData} isSuperAdmin={isSuperAdmin} navigate={navigate}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center max-w-lg mx-auto mt-12 animate-in slide-in-from-bottom-4">
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6 text-blue-400">
                  {navItemRegistry[activeView]?.icon || <HelpCircle className="w-10 h-10" />}
                </div>
                <h3 className="text-sm font-black text-[#1a234b] dark:text-white mb-1">{viewTitles[activeView]}</h3>
                <p className="text-slate-400 font-medium text-sm">Coming soon!</p>
              </div>
            </VerifiedView>
          )}
        </main>
      </div>

      {showThemeCustomizer && <ThemeCustomizer userId={userData?.id} onClose={() => setShowThemeCustomizer(false)} />}

      {/* Account Deletion Modal */}
      {showDeletedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a234b]/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-[0_30px_70px_-15px_rgba(26,35,75,0.4)] relative animate-in zoom-in-95 duration-500 overflow-hidden border border-red-100 text-center">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-sm border border-red-100">
              <AlertTriangle className="w-8 h-8" strokeWidth={2} />
            </div>

            <h3 className="text-xl font-black text-[#1a234b] mb-2 tracking-tight">Security Alert</h3>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8 px-2">
              Your account has been restricted or removed by a secure system administrator. Your current session is no longer active.
            </p>

            <button
              onClick={() => {
                setShowDeletedAlert(false);
                handleLogout();
              }}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] tracking-widest uppercase shadow-xl shadow-red-500/20 hover:bg-red-600 transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;