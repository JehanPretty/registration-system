import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

function AccountSettings({ userData, onNameChange }) {
  const activityKey = useMemo(() => `regisSys_activity_log_${userData?.id || "admin"}`, [userData?.id]);
  const [activityLog, setActivityLog] = useState([]);

  const [twoFA, setTwoFA] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(() => {
    return localStorage.getItem("regisSys_pw") || "admin123";
  });

  // --- CHANGE NAME ---
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(userData?.name || "admin");
  const [nameLoading, setNameLoading] = useState(false);

  const appendActivity = (entry) => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts: new Date().toISOString(),
      ...entry,
    };
    setActivityLog((prev) => {
      const next = [item, ...(prev || [])].slice(0, 20);
      try {
        localStorage.setItem(activityKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const timeAgo = (iso) => {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const mins = Math.max(0, Math.floor(diff / 60000));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(activityKey) || "[]");
      if (Array.isArray(saved)) setActivityLog(saved);
    } catch {
      setActivityLog([]);
    }
  }, [activityKey]);

  const handleChangeName = async () => {
    if (!newName.trim()) return;
    setNameLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userData?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        // Update localStorage session
        const saved = JSON.parse(localStorage.getItem("regisSys_user") || "{}");
        saved.name = newName.trim();
        localStorage.setItem("regisSys_user", JSON.stringify(saved));
        if (onNameChange) onNameChange(newName.trim());
        appendActivity({ event: "Profile Updated", status: "Name changed", type: "info" });
        setEditingName(false);
      } else {
        appendActivity({ event: "Profile Update Failed", status: "Name change error", type: "warning" });
      }
    } catch (err) {
      console.error("Failed to update name:", err);
      appendActivity({ event: "Profile Update Failed", status: "Network error", type: "warning" });
    } finally {
      setNameLoading(false);
    }
  };

  // --- CHANGE PASSWORD MODAL ---
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData?.id,
          current_password: pwForm.current,
          new_password: pwForm.newPw,
        }),
      });
      if (res.ok) {
        setPwSuccess("✅ Password changed successfully!");
        setPwForm({ current: "", newPw: "", confirm: "" });
        // Update the displayed password
        setCurrentPassword(pwForm.newPw);
        localStorage.setItem("regisSys_pw", pwForm.newPw);
        appendActivity({ event: "Password Change", status: "Successful", type: "success" });
        setTimeout(() => { setShowChangeModal(false); setPwSuccess(""); }, 2000);
      } else {
        const err = await res.json();
        setPwError(err.detail || "Failed to change password.");
        appendActivity({ event: "Password Change", status: "Failed", type: "warning" });
      }
    } catch {
      setPwError("Cannot connect to server. Is the backend running?");
      appendActivity({ event: "Password Change", status: "Network error", type: "warning" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12 text-gray-900">
        {/* HEADER */}
        <div className="mb-5 md:mb-6">
          <h1 className="text-lg md:text-xl font-black text-[#1f2a56] tracking-tight">Account Settings</h1>
          <p className="text-gray-500 text-[10px] md:text-xs mt-1 font-medium">Manage your security, notifications, and account preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {/* LEFT COLUMN: SECURITY & NOTIFS */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECURITY SECTION */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1f2a56]">Security Settings</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-widest mt-0.5 uppercase">Protect your access</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* ADMIN ACCOUNT CREDENTIALS */}
                <div className="p-5 bg-blue-50/50 rounded-[1.25rem] border border-blue-100/50 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-600 tracking-widest mb-1 uppercase">Administrator Account</p>
                        {/* EDITABLE NAME */}
                        {editingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
                              autoFocus
                            />
                            <button onClick={handleChangeName} disabled={nameLoading} className="text-[9px] font-black text-white bg-green-500 px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all">{nameLoading ? "..." : "Save"}</button>
                            <button onClick={() => { setEditingName(false); setNewName(userData?.name || "admin"); }} className="text-[9px] font-black text-gray-500 px-2 py-1.5 hover:text-red-500 transition-all">✕</button>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            {userData?.name || "admin"}
                            <button onClick={() => setEditingName(true)} className="text-[9px] text-blue-500 hover:text-blue-700 font-black tracking-widest uppercase opacity-80 hover:opacity-100">[Edit]</button>
                          </p>
                        )}
                        <p className="text-[10px] font-medium text-gray-500 mt-1">{userData?.email || "admin@register.com"}</p>
                        <p className="text-[10px] font-medium text-gray-500 font-mono mt-1">
                          Password: {showPass ? currentPassword : "••••••••"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPass(!showPass)}
                      className="bg-white border text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-blue-50 transition-all shadow-sm self-start sm:self-auto"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* CHANGE PASSWORD */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Account Password</p>
                      <p className="text-xs text-gray-500 font-medium">Click Change to update your password</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowChangeModal(true); setPwError(""); setPwSuccess(""); }}
                    className="bg-[#1a234b] text-white px-5 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-900/10 w-full sm:w-auto"
                  >Change</button>
                </div>

                {/* 2FA TOGGLE */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${twoFA ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-10.382 7.04c.058.12.088.25.088.38v.63a11.336 11.336 0 01-9.408 10.708l-.517.076a.75.75 0 01-.448-1.428l.517-.076a9.837 9.837 0 008.16-9.288" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Two-Factor Authentication</p>
                      <p className="text-[10px] text-slate-500 font-medium">{twoFA ? "Active & Secure" : "Disabled (Recommended for security)"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !twoFA;
                      setTwoFA(next);
                      appendActivity({ event: "2FA", status: next ? "Enabled" : "Disabled", type: next ? "success" : "warning" });
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 self-end sm:self-auto ${twoFA ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${twoFA ? "left-5.5" : "left-0.5"}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS SECTION */}
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1f2a56]">Notifications</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-widest mt-0.5 uppercase">Manage updates</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Email Alerts</p>
                    <p className="text-[9px] text-gray-500 font-medium">Critical system updates</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !notifEmail;
                      setNotifEmail(next);
                      appendActivity({ event: "Notifications", status: next ? "Email enabled" : "Email disabled", type: "info" });
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${notifEmail ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifEmail ? "left-5.5" : "left-0.5"}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">SMS Alerts</p>
                    <p className="text-[9px] text-gray-500 font-medium">Login & security events</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !notifSms;
                      setNotifSms(next);
                      appendActivity({ event: "Notifications", status: next ? "SMS enabled" : "SMS disabled", type: "info" });
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${notifSms ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifSms ? "left-5.5" : "left-0.5"}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVITY LOGS */}
          <div className="space-y-6">
            <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1f2a56]">Activity Log</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-widest mt-0.5 uppercase">Recent actions</p>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                {(activityLog.length ? activityLog : [
                  { id: "seed-1", event: "Account", status: "No recent actions yet", ts: new Date().toISOString(), type: "info" },
                ]).map((log, i) => (
                  <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                    <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border-2 border-white ring-2 ring-offset-0 ${log.type === 'success' ? 'bg-green-500 ring-green-100' : log.type === 'info' ? 'bg-blue-500 ring-blue-100' : 'bg-orange-500 ring-orange-100'}`}></div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">{log.event}</p>
                    <p className="text-[9px] text-gray-400 font-medium mt-1 tracking-tight uppercase">{log.status} • {timeAgo(log.ts)}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-4 px-6 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black tracking-widest text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95">
                View Full History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      {showChangeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1f2a56]">Change Password</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Update your administrator password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="text-[11px] font-black text-gray-500 tracking-widest mb-2 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    value={pwForm.current}
                    onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {showCurrentPw ? <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                    </svg>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[11px] font-black text-gray-500 tracking-widest mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={pwForm.newPw}
                    onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                    placeholder="Enter new password (min. 6 chars)"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {showNewPw ? <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> : <><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[11px] font-black text-gray-500 tracking-widest mb-2 block">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Error / Success */}
              {pwError && <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">{pwError}</p>}
              {pwSuccess && <p className="text-green-600 text-xs font-bold bg-green-50 px-4 py-3 rounded-xl border border-green-100">{pwSuccess}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-3 rounded-xl bg-[#1a234b] text-white text-sm font-black hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >{pwLoading ? "Updating..." : "Update Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AccountSettings;
