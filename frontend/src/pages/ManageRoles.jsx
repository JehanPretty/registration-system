import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import {
  Shield, Search, Filter, Trash2, Pencil, Plus,
  CheckCircle, XCircle, Users as UsersIcon
} from "lucide-react";

const ManageRoles = ({
  userRoles,
  setUserRoles,
  formSections,
  setFormSections,
  selectedRole,
  setSelectedRole,
}) => {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDomain, setNewRoleDomain] = useState("");
  const [fullRoles, setFullRoles] = useState([]);
  const [roleEditing, setRoleEditing] = useState({ id: null, name: "", email_domain: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [roleCounts, setRoleCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch full roles from backend
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles/`);
      if (res.ok) {
        const data = await res.json();
        setFullRoles(data);
        setUserRoles(data.map(r => r.name));
      }
    } catch (err) {
      console.error("Failed to fetch full roles:", err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch user counts per role
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (res.ok) {
          const users = await res.json();
          const counts = {};
          users.forEach(u => {
            const role = u.role_context || "Unassigned";
            counts[role] = (counts[role] || 0) + 1;
          });
          setRoleCounts(counts);
        }
      } catch (err) {
        console.error("Failed to fetch user counts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [userRoles]);

  // Filtered roles
  const filteredRoles = fullRoles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const count = roleCounts[role.name] || 0;
    if (filterType === "active") return matchesSearch && count > 0;
    if (filterType === "empty") return matchesSearch && count === 0;
    return matchesSearch;
  });

  const addNewRole = async () => {
    const trimmed = newRoleName.trim();
    if (trimmed && !userRoles.includes(trimmed)) {
      try {
        const res = await fetch(`${API_BASE_URL}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed,
            title: trimmed,
            icon: "Shield",
            description: `Role for ${trimmed}`,
            email_domain: newRoleDomain.trim() || null
          }),
        });
        if (res.ok) {
          await fetchRoles();
          setNewRoleName("");
          setNewRoleDomain("");
          setShowAddModal(false);
        }
      } catch (err) {
        console.error("Failed to add role:", err);
      }
    }
  };

  const saveRoleEdit = async () => {
    if (!roleEditing.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/roles/${roleEditing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleEditing.name,
          email_domain: roleEditing.email_domain,
          title: roleEditing.name,
          icon: "Shield",
          description: `Role for ${roleEditing.name}`
        }),
      });
      if (res.ok) {
        await fetchRoles();
        setRoleEditing({ id: null, name: "", email_domain: "" });
      }
    } catch (err) {
      console.error("Failed to save role edit:", err);
    }
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
       await fetch(`${API_BASE_URL}/roles/${roleToDelete.id}`, { method: "DELETE" });
       await fetchRoles();
       if (selectedRole === roleToDelete.name) {
         setSelectedRole(userRoles.find(r => r !== roleToDelete.name) || "");
       }
       setRoleToDelete(null);
    } catch (err) {
      console.error("Failed to delete role:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border animate-in slide-in-from-bottom-2 text-gray-900 shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#1f2a56] tracking-tight">Role Management</h2>
            <p className="text-gray-500 text-[11px] font-medium">Create, manage, and organize user roles in the system.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-indigo-600 font-bold text-sm">{userRoles.length} Roles</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2a56] text-white rounded-xl font-bold text-xs tracking-widest hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-5 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer min-w-[160px]"
            >
              <option value="all">All Roles</option>
              <option value="active">Has Users</option>
              <option value="empty">No Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* ROLES TABLE */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400 font-bold tracking-widest text-[10px]">Loading Roles...</p>
        </div>
      ) : userRoles.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-4 text-gray-300">🛡️</div>
          <p className="text-gray-400 font-bold">No roles configured yet.</p>
          <p className="text-gray-300 text-xs mt-1">Click "Add Role" to create your first role.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-bold text-[11px] text-gray-400 tracking-widest pl-4">Role Name</th>
                <th className="pb-4 font-bold text-[11px] text-gray-400 tracking-widest">Email Domain</th>
                <th className="pb-4 font-bold text-[11px] text-gray-400 tracking-widest">Assigned Users</th>
                <th className="pb-4 font-bold text-[11px] text-gray-400 tracking-widest">Status</th>
                <th className="pb-4 font-bold text-[11px] text-gray-400 tracking-widest text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-400 text-sm font-medium">
                    No roles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const count = roleCounts[role.name] || 0;
                  const isEditing = roleEditing.id === role.id;

                  return (
                    <tr key={role.id} className="group transition-all hover:bg-gray-50/50">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-all bg-indigo-100 text-indigo-600 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-700">{role.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-bold text-slate-600 dark:text-white/80">
                               {role.email_domain || "No Mapping"}
                             </span>
                          </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-bold text-gray-600">{count}</span>
                          <span className="text-[10px] font-medium text-gray-400">users</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${count > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300"}`}></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            {count > 0 ? "Active" : "Empty"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right pr-4 space-x-2">
                        <button
                          onClick={() => setRoleEditing({ id: role.id, name: role.name, email_domain: role.email_domain || "" })}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Role"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => setRoleToDelete(role)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD ROLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200 border dark:border-white/10">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight text-center">New Role</h3>
            <p className="text-gray-500 dark:text-white/70 text-sm mt-1 text-center font-medium">
              Create a new user role for the system.
            </p>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-[10px] font-black tracking-widest text-[#1f2a56] dark:text-white/90 ml-1 uppercase">Role Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Alumni, Intern..."
                  className="w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm shadow-sm dark:text-white dark:placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-[#1f2a56] dark:text-white/90 ml-1 uppercase">Email Domain (Optional)</label>
                <input
                  type="text"
                  value={newRoleDomain}
                  onChange={(e) => setNewRoleDomain(e.target.value)}
                  placeholder="e.g. university.edu"
                  className="w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm shadow-sm dark:text-white dark:placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setNewRoleName(""); }}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/80 font-bold text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addNewRole}
                disabled={!newRoleName.trim() || userRoles.includes(newRoleName.trim())}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1f2a56] text-white font-bold text-xs tracking-widest hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {roleEditing.id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200 border dark:border-white/10">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pencil className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight text-center">Edit Role</h3>
            <p className="text-gray-500 dark:text-white/70 text-sm mt-1 text-center font-medium">
              Update details for <span className="text-gray-900 dark:text-white font-bold">{roleEditing.name}</span>.
            </p>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-[10px] font-black tracking-widest text-[#1f2a56] dark:text-white/90 ml-1 uppercase">Role Name</label>
                <input
                  type="text"
                  autoFocus
                  value={roleEditing.name}
                  onChange={(e) => setRoleEditing({ ...roleEditing, name: e.target.value })}
                  placeholder="e.g. Alumni, Intern..."
                  className="w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm shadow-sm dark:text-white dark:placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-[#1f2a56] dark:text-white/90 ml-1 uppercase">Email Domain (Optional)</label>
                <input
                  type="text"
                  value={roleEditing.email_domain}
                  onChange={(e) => setRoleEditing({ ...roleEditing, email_domain: e.target.value })}
                  placeholder="e.g. university.edu"
                  className="w-full mt-1.5 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-sm shadow-sm dark:text-white dark:placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRoleEditing({ id: null, name: "", email_domain: "" })}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/80 font-bold text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveRoleEdit}
                disabled={!roleEditing.name.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {roleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center animate-in zoom-in-95 duration-200 border dark:border-white/10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Delete Role?</h3>
            <p className="text-gray-500 dark:text-white/70 text-sm mt-2 font-medium">
              Are you sure you want to remove <span className="text-gray-900 dark:text-white font-bold">"{roleToDelete.name}"</span>?
              {(roleCounts[roleToDelete.name] || 0) > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  ⚠️ {roleCounts[roleToDelete.name]} user(s) are currently assigned to this role.
                </span>
              )}
            </p>
            <div className="flex gap-3 mt-8">
              <button
                disabled={isDeleting}
                onClick={() => setRoleToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/80 font-bold text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={deleteRole}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold text-xs tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 flex items-center justify-center"
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
    </div>
  );
};

export default ManageRoles;
