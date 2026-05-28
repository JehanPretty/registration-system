import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import IDCard from "../components/IDCard";
import AddressDetails from "../components/AddressDetails";
import { resolveAttributeValue, getNormalizedKey } from "../utils/addressMapper";
import {
  Globe, MapPin, ExternalLink, Clock, Trash2, Eye, Users as UsersIcon, Search, Filter,
  Plus, Key, Info, UserPlus, ShieldCheck, Mail, XCircle, Loader2, Calendar, User, FileText,
  CreditCard, FlipVertical
} from "lucide-react";

function Users() {
  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (typeof url === 'string') {
      if (url.startsWith('/static')) {
        return `${API_BASE_URL}${url}`;
      }
      if (url.includes('/static/')) {
        const path = '/static/' + url.split('/static/').pop();
        return `${API_BASE_URL}${path}`;
      }
    }
    return url;
  };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToReview, setUserToReview] = useState(null);
  const [reviewTemplate, setReviewTemplate] = useState(null);
  const [reviewIdTemplate, setReviewIdTemplate] = useState(null);
  const [reviewModalTab, setReviewModalTab] = useState("details"); // "details" | "id-card"
  const [reviewCardSide, setReviewCardSide] = useState("front");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role_context: "Student"
  });

  // Global Search Integration
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      if (e.detail?.query) {
        setSearchTerm(e.detail.query);
      }
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  // Derived filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const roleMatch = user.role_context || "Unassigned";
    const matchesRole = filterRole === "all" || roleMatch.toLowerCase() === filterRole.toLowerCase();

    const statusMatch = user.status || "pending";
    const matchesStatus = filterStatus === "all" || statusMatch.toLowerCase() === filterStatus.toLowerCase();

    // Robust Super Admin check
    const isSuperAdmin = (user.role_context || "").trim().toLowerCase() === "super admin";

    return matchesSearch && matchesRole && matchesStatus && !isSuperAdmin;
  });

  // Analytics Calculations
  const nonAdminUsers = users.filter(u => (u.role_context || "").trim().toLowerCase() !== "super admin");
  const totalUsers = nonAdminUsers.length;
  const verifiedUsers = nonAdminUsers.filter(u => u.status === 'verified').length;
  const pendingUsers = nonAdminUsers.filter(u => u.status === 'pending' || !u.status).length;
  
  const roleCounts = nonAdminUsers.reduce((acc, user) => {
    const role = user.role_context || "Unassigned";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles/`);
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        await fetchUsers();
        setIsCreateModalOpen(false);
        setNewUser({ name: "", email: "", password: "", role_context: "Student" });
        alert("User created successfully!");
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.detail || "Failed to create user"}`);
      }
    } catch (err) {
      console.error("Create user error:", err);
      alert("Network error occurred.");
    } finally {
      setIsCreating(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewUser(prev => ({ ...prev, password: pass }));
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("regisSys_user")) || {};
      const res = await fetch(`${API_BASE_URL}/users/${userToDelete.id}?requester_id=${currentUser.id || 0}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to delete user: ${errorData.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error connecting to server. Please ensure the backend is running.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        if (userToReview && userToReview.id === userId) {
          setUserToReview(updatedUser);
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchRoleTemplate = async (roleName) => {
    if (!roleName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/forms/${roleName}`);
      if (res.ok) {
        const data = await res.json();
        setReviewTemplate(data);
      }
    } catch (err) {
      console.error("Failed to fetch template:", err);
    }
  };

  const fetchRoleIdTemplate = async (roleName) => {
    if (!roleName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/id-builder/${roleName}`);
      if (res.ok) {
        const data = await res.json();
        setReviewIdTemplate(data);
      }
    } catch (err) {
      console.error("Failed to fetch ID template:", err);
      setReviewIdTemplate(null);
    }
  };

  useEffect(() => {
    if (userToReview) {
      fetchRoleTemplate(userToReview.role_context);
      fetchRoleIdTemplate(userToReview.role_context);
      setReviewModalTab("details");
      setReviewCardSide("front");
    } else {
      setReviewTemplate(null);
      setReviewIdTemplate(null);
    }
  }, [userToReview]);

  useEffect(() => {
    fetchUsers();
    fetchAvailableRoles();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2 text-gray-900 shadow-sm">
      <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">User Management</h2>
              <p className="text-gray-500 text-[10px] md:text-xs font-medium">Manage and view all registered users in the system.</p>
            </div>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1f2a56] text-white rounded-xl font-black text-[10px] hover:bg-blue-900 transition-all shadow-md shadow-blue-100 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>
          <button
            onClick={fetchUsers}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-blue-600"
            title="Refresh List"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <div className="hidden md:block px-1 py-1 text-slate-500 font-bold text-[11px] tracking-widest uppercase">
            {users.filter(u => (u.role_context || "").trim().toLowerCase() !== "super admin").length} Total
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION - ROLES */}
      <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-3 mb-5 pb-2">
        {(() => {
          const allRolesSet = new Set(availableRoles.map(r => r.name));
          Object.keys(roleCounts).forEach(r => allRolesSet.add(r));
          const combinedRoles = Array.from(allRolesSet);

          if (combinedRoles.length === 0) {
            return (
              <div className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
                <p className="text-gray-400 font-bold text-sm">No roles found.</p>
              </div>
            );
          }

          return combinedRoles.map((roleName) => {
            const count = roleCounts[roleName] || 0;
            
            return (
              <div key={roleName} className="flex flex-1 items-center gap-3.5 bg-white border border-gray-100 rounded-xl p-3 shadow-sm shrink-0 min-w-[140px] transition-transform hover:scale-[1.02] duration-300">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <UsersIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 leading-none">{count}</h3>
                  <p className="text-gray-500 text-[11px] font-bold mt-1 leading-tight break-words" title={roleName}>
                    {roleName}
                  </p>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">

        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black tracking-wider text-gray-600 appearance-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-sm cursor-pointer min-w-[120px] uppercase"
            >
              <option value="all">Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black tracking-wider text-gray-600 appearance-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-sm cursor-pointer min-w-[120px] uppercase"
            >
              <option value="all">Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400 font-bold tracking-widest text-[10px]">Loading Database...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-4 text-gray-300">👤</div>
          <p className="text-gray-400 font-bold">No users registered yet.</p>
          <p className="text-gray-300 text-xs mt-1">Users will appear here once they sign up via the mobile app.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar -mx-4 md:mx-0 px-4 md:px-0">
          <div className="min-w-[800px] md:min-w-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left">
                  <span className="text-[11px] font-black text-slate-400">Member Info</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[11px] font-black text-slate-400">Email / Contact</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[11px] font-black text-slate-400">Role Type</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[11px] font-black text-slate-400">Status</span>
                </th>
                <th className="px-6 py-4 text-right">
                  <span className="text-[11px] font-black text-slate-400">Joined Date</span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="text-[11px] font-black text-slate-400">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 text-sm font-medium italic">
                    No users matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-slate-900 overflow-hidden border border-blue-100 shadow-sm transition-transform group-hover:scale-105">
                          {user.avatar_url ? (
                            <img src={resolveImageUrl(user.avatar_url)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-slate-900 text-sm tracking-tight">{user.name || "Unknown User"}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-slate-500 font-bold">{user.email}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                        {user.role_context || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.status === 'verified' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                            user.status === 'rejected' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                          }`}></div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          user.status === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 
                          user.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {user.status || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-[10px] font-black text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setUserToReview(user)}
                          className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100"
                          title="View Summary"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm border border-red-100"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Delete User?</h3>
            <p className="text-gray-500 text-sm mt-2 font-medium">Are you sure you want to remove <span className="text-gray-900 font-bold">{userToDelete.name}</span>? This action cannot be undone.</p>

            <div className="flex gap-3 mt-8">
              <button
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Delete Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* USER REVIEW MODAL */}
      {userToReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-[#f8faff] rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[92vh] max-h-[900px] flex flex-col animate-in slide-in-from-bottom-10 duration-500 overflow-hidden border border-white">

            {/* Modal Header — sticky, compact */}
            <div className="bg-[var(--bg-sidebar)] px-6 pt-5 pb-4 text-white relative shrink-0">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setUserToReview(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/5"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-5 pr-10">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-400/30 shadow-xl">
                    <img
                      src={resolveImageUrl(userToReview.avatar_url) || `https://ui-avatars.com/api/?name=${userToReview.name ? userToReview.name.replace(/\s+/g, '+') : 'User'}&background=e2e8f0&color=1e293b&size=256&bold=true`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[8px] font-black border-2 border-[#1f264d] shadow ${
                    userToReview.status === 'verified' ? 'bg-green-500' :
                    userToReview.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    {userToReview.status || 'Pending'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-black tracking-tight truncate text-white">{userToReview.name}</h2>
                    {userToReview.status === 'verified' && <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />}
                  </div>
                  <div className="flex flex-wrap gap-3 text-blue-200/60 font-bold text-[10px]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {userToReview.email}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {userToReview.role_context}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(userToReview.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Tab Bar — compact, inline with user info */}
              <div className="flex gap-1 mt-4 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                <button
                  onClick={() => setReviewModalTab("details")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                    reviewModalTab === "details"
                      ? "bg-white text-[#1f264d] shadow-md"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <FileText className="w-3 h-3" /> Profile Details
                </button>
                <button
                  onClick={() => setReviewModalTab("id-card")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                    reviewModalTab === "id-card"
                      ? "bg-white text-[#1f264d] shadow-md"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <CreditCard className="w-3 h-3" /> ID Card
                  {userToReview.attributes?.signature && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" title="Has signature" />
                  )}
                </button>
              </div>
            </div>

            {/* ── TAB: Profile Details ── */}
            {reviewModalTab === "details" && (
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                {!reviewTemplate ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="font-black text-[10px]">Retrieving Role Template...</p>
                  </div>
                ) : (!userToReview.attributes?.is_profile_complete) ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
                      <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1f264d] tracking-tighter">User Inspection</h2>
                    <p className="text-xs font-bold text-slate-400">Identity Audit & Clearance</p>
                    <p className="text-slate-400 font-bold text-xs max-w-sm leading-relaxed mx-auto mt-4">
                      This user signed up but has not completed their registration wizard.
                      No identity data or documents have been submitted for review.
                    </p>
                    <div className="mt-8 px-6 py-2 bg-amber-100/50 text-amber-700 rounded-full text-[10px] font-black border border-amber-200">
                      Registration In-Progress
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-12 pb-10">
                    {(() => {
                      const renderedKeys = new Set();
                      reviewTemplate.forEach(section => {
                        section.fields.forEach(field => renderedKeys.add(field.label));
                      });
                      const allAttributes = userToReview.attributes || {};
                      const unassignedKeys = Object.keys(allAttributes).filter(key => {
                        const isMapped = Array.from(renderedKeys).some(label => getNormalizedKey(label) === key);
                        return !renderedKeys.has(key) &&
                          !isMapped &&
                          allAttributes[key] !== null &&
                          allAttributes[key] !== "" &&
                          key !== 'is_profile_complete' &&
                          key !== 'signed_up_at' &&
                          key !== 'completed_at' &&
                          key !== 'kyc_document' &&
                          key !== 'selfie_document';
                      });

                      const formatDate = (dateStr) => {
                        if (!dateStr || dateStr === "N/A") return dateStr;
                        try {
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return dateStr;
                          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        } catch (e) { return dateStr; }
                      };

                      const renderFieldRow = (field, value) => {
                        const isMedia = field.type === 'image' || field.type === 'file';
                        const isDate = field.type === 'date' || field.label.toLowerCase().includes('date');
                        return (
                          <div key={field.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-slate-50 last:border-0 px-3 rounded-xl transition-all">
                            <span className="text-[11px] font-black text-slate-400 shrink-0">{field.label}:</span>
                            <div className="flex-1">
                              {isMedia ? (
                                value === "N/A" || !value ? (
                                  <span className="text-sm font-bold text-slate-300 italic">Not provided</span>
                                ) : (
                                  <div className="mt-1 relative group/img inline-block overflow-hidden rounded-2xl border border-slate-200 bg-white p-1">
                                    <img src={resolveImageUrl(value)} alt={field.label} className="h-40 w-auto object-contain transition-transform duration-500 hover:scale-105" />
                                    <a href={resolveImageUrl(value)} download target="_blank" className="absolute inset-0 bg-[#1a234b]/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                      <ExternalLink className="w-6 h-6 text-white" />
                                    </a>
                                  </div>
                                )
                              ) : (
                                <span className="text-sm font-bold text-[#1a234b]">
                                  {value === "N/A" ? <span className="text-slate-300 font-medium">N/A</span> : isDate ? formatDate(value) : value}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {reviewTemplate.map((section) => {
                            const isAddressSection = section.title.toLowerCase().includes("address");
                            return (
                              <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-3 px-3">
                                  <h3 className="text-[10px] font-black text-[#1a234b]/50 uppercase tracking-wider">
                                    {section.title?.replace(/ Info$/i, " Information")}
                                  </h3>
                                  <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>
                                <div className="space-y-0.5">
                                  {isAddressSection ? (
                                    <div className="px-3 pt-2">
                                      <AddressDetails attributes={allAttributes} visibleFields={section.fields} />
                                    </div>
                                  ) : (
                                    section.fields.map((field) =>
                                      renderFieldRow(field, resolveAttributeValue(allAttributes, field.label) || "N/A")
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {unassignedKeys.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                              <div className="flex items-center gap-3 mb-3 px-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Additional Details</h3>
                                <div className="h-[1px] flex-1 bg-slate-100" />
                              </div>
                              <div className="space-y-0.5">
                                {unassignedKeys.map((key) => {
                                  const value = allAttributes[key];
                                  const isMedia = typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('http'));
                                  return (
                                    <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-slate-50 last:border-0 group/row hover:bg-slate-50/30 px-3 rounded-xl transition-all">
                                      <span className="text-[11px] font-black text-slate-400 group-hover/row:text-blue-500 transition-colors shrink-0">{key}:</span>
                                      <div className="flex-1">
                                        {isMedia ? (
                                          <div className="mt-1 relative group/img inline-block overflow-hidden rounded-xl border border-slate-200">
                                            <img src={resolveImageUrl(value)} alt={key} className="h-24 w-auto object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                            <a href={resolveImageUrl(value)} download target="_blank" className="absolute inset-0 bg-[#1a234b]/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                              <ExternalLink className="w-5 h-5 text-white" />
                                            </a>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-bold text-[#1a234b]">
                                            {key.toLowerCase().includes('date') ? formatDate(String(value)) : String(value)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: ID Card Preview ── */}
            {reviewModalTab === "id-card" && (
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 flex flex-col items-center justify-start py-6 px-6">

                {/* Dot grid backdrop */}
                <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(#1a234b 1px, transparent 0)", backgroundSize: "20px 20px" }} />

                {/* Info banner */}
                <div className="w-full mb-5">
                  <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-[#1a234b] tracking-wide">
                        {userToReview.name} — {userToReview.role_context} ID Card
                      </p>
                      <p className="text-[9px] font-bold text-slate-400">
                        {userToReview.attributes?.signature
                          ? "✓ Cardholder signature loaded from profile"
                          : "No personal signature on file — only authorized signature will appear"}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black border border-indigo-100 shrink-0">
                      Both Sides
                    </div>
                  </div>
                </div>

                {/* Check Profile Completion State */}
                {!userToReview.attributes?.is_profile_complete ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
                      <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1f264d] tracking-tighter">ID Card Not Available</h2>
                    <p className="text-xs font-bold text-slate-400">Identity Audit & Clearance</p>
                    <p className="text-slate-400 font-bold text-xs max-w-sm leading-relaxed mx-auto mt-4">
                      This user has not completed their ID application yet. Once they submit their photo and signature via the application wizard, their ID Card preview will appear here.
                    </p>
                    <div className="mt-8 px-6 py-2 bg-amber-100/50 text-amber-700 rounded-full text-[10px] font-black border border-amber-200 uppercase tracking-widest">
                      Awaiting Application
                    </div>
                  </div>
                ) : !userToReview.attributes?.has_applied_for_id ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200 shadow-inner">
                      <CreditCard className="w-10 h-10 text-slate-500" />
                    </div>
                    <h2 className="text-xl font-black text-[#1f264d] tracking-tighter">Digital ID Not Requested</h2>
                    <p className="text-xs font-bold text-slate-400">No digital ID application found</p>
                    <p className="text-slate-400 font-bold text-xs max-w-sm leading-relaxed mx-auto mt-4">
                      This user has not applied for a digital ID yet. The ID number will remain hidden until they submit a digital ID request.
                    </p>
                    <div className="mt-8 px-6 py-2 bg-slate-100/60 text-slate-600 rounded-full text-[10px] font-black border border-slate-200 uppercase tracking-widest">
                      Not Applied
                    </div>
                  </div>
                ) : !reviewIdTemplate ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="font-black text-[10px] tracking-widest">Loading ID Template...</p>
                  </div>
                ) : (
                  <div className="print-mode w-full">
                    {/* ── Dual Card Preview Station ── */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-items-center">

                        {/* FRONT SIDE */}
                        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-left-6 duration-700">
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1f264d] text-white rounded-full text-[10px] font-black shadow-lg ring-4 ring-[#1f264d]/10">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            Front Side View
                          </div>
                          <div
                            className="transition-all duration-500"
                            style={{ transform: "scale(0.65)", transformOrigin: "top center", marginBottom: "-120px" }}
                          >
                            <IDCard
                              user={{
                                id: userToReview.id,
                                name: userToReview.name,
                                role_context: userToReview.role_context,
                                external_id: userToReview.external_id,
                                avatar_url: userToReview.attributes?.id_picture || userToReview.avatar_url,
                                signature_url: userToReview.attributes?.signature || null,
                              }}
                              template={reviewIdTemplate}
                              side="front"
                            />
                          </div>
                        </div>

                        {/* BACK SIDE */}
                        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-6 duration-700">
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-700 text-white rounded-full text-[10px] font-black shadow-lg ring-4 ring-slate-700/10">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
                            Back Side View
                          </div>
                          <div
                            className="transition-all duration-500"
                            style={{ transform: "scale(0.65)", transformOrigin: "top center", marginBottom: "-120px" }}
                          >
                            <IDCard
                              user={{
                                id: userToReview.id,
                                name: userToReview.name,
                                role_context: userToReview.role_context,
                                external_id: userToReview.external_id,
                                avatar_url: userToReview.attributes?.id_picture || userToReview.avatar_url,
                                signature_url: userToReview.attributes?.signature || null,
                              }}
                              template={reviewIdTemplate}
                              side="back"
                            />
                          </div>
                        </div>
                      </div>

                    {/* ── Signature Legend ── */}
                    <div className="w-full mt-2 grid grid-cols-2 gap-3 max-w-xl mx-auto">
                      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                          Cardholder Signature
                        </p>
                        {userToReview.attributes?.signature ? (
                          <img src={resolveImageUrl(userToReview.attributes.signature)} alt="Cardholder Sig" className="h-9 object-contain mix-blend-multiply" />
                        ) : (
                          <p className="text-[9px] font-bold text-slate-300 italic">Not uploaded yet</p>
                        )}
                      </div>
                      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                          Authorized Signature
                        </p>
                        {reviewIdTemplate.authorized_signature_url ? (
                          <img src={resolveImageUrl(reviewIdTemplate.authorized_signature_url)} alt="Auth Sig" className="h-9 object-contain mix-blend-multiply" />
                        ) : (
                          <p className="text-[9px] font-bold text-slate-300 italic">No official signature set</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
              <button
                onClick={() => setUserToReview(null)}
                className="flex-1 py-3 bg-[#1f264d] text-white rounded-2xl font-black text-xs hover:bg-[#2a3469] transition-all shadow-xl shadow-[#1f264d]/10 active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#1f264d] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Register New User</h3>
                  <p className="text-[10px] text-blue-200/60 font-bold">Manual administrative onboarding</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <input
                      required
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <input
                      required
                      type="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                      placeholder="john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Password Cluster */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Password</label>
                    <button 
                      type="button"
                      onClick={generatePassword}
                      className="text-[9px] font-black text-blue-600 hover:underline"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Key className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <input
                      required
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>

                {/* Role Picker */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assigned Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UsersIcon className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <select
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black tracking-wider text-slate-600 appearance-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all cursor-pointer uppercase"
                      value={newUser.role_context}
                      onChange={(e) => setNewUser({...newUser, role_context: e.target.value})}
                    >
                      {availableRoles.length > 0 ? (
                        availableRoles.map(role => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))
                      ) : (
                        <option value="Student">Student</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-blue-700 leading-relaxed">
                  The user will be automatically <span className="font-black">Verified</span>. 
                  Ensure you provide them with the password generated above.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
