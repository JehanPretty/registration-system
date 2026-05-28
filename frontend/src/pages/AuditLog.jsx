import React, { useState, useEffect } from "react";
import {
  Shield, Search, Filter, Download, RefreshCw,
  UserCheck, UserX, CreditCard, Settings, LogIn, LogOut,
  FileEdit, Trash2, Plus, AlertTriangle, CheckCircle2, Clock,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { API_BASE_URL } from "../config";

const EVENT_ICONS = {
  login:       { icon: <LogIn className="w-4 h-4" />,    color: "text-emerald-500", bg: "bg-emerald-50" },
  logout:      { icon: <LogOut className="w-4 h-4" />,   color: "text-slate-500",   bg: "bg-slate-100" },
  user_create: { icon: <Plus className="w-4 h-4" />,     color: "text-blue-500",    bg: "bg-blue-50" },
  user_update: { icon: <FileEdit className="w-4 h-4" />, color: "text-amber-500",   bg: "bg-amber-50" },
  user_delete: { icon: <Trash2 className="w-4 h-4" />,  color: "text-red-500",     bg: "bg-red-50" },
  user_verify: { icon: <UserCheck className="w-4 h-4" />,color: "text-indigo-500",  bg: "bg-indigo-50" },
  user_reject: { icon: <UserX className="w-4 h-4" />,   color: "text-rose-500",    bg: "bg-rose-50" },
  id_approved: { icon: <CreditCard className="w-4 h-4" />, color: "text-teal-500", bg: "bg-teal-50" },
  id_claimed:  { icon: <UserCheck className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50" },
  settings:    { icon: <Settings className="w-4 h-4" />, color: "text-purple-500",  bg: "bg-purple-50" },
  warning:     { icon: <AlertTriangle className="w-4 h-4" />, color: "text-orange-500", bg: "bg-orange-50" },
};

const SEVERITY_STYLES = {
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error:   "bg-red-50 text-red-700 border-red-200",
};

function generateRealLogs(users, attendances, applications) {
  const logs = [];
  let logId = 1;

  // 1. User Creation Events
  users.forEach(u => {
    logs.push({
      id: logId++,
      type: "user_create",
      message: `New user account created: ${u.name || u.email}`,
      severity: "info",
      actor: "System",
      timestamp: u.created_at,
      ip: "N/A",
      module: "Users",
    });

    if (u.status === "verified") {
      logs.push({
        id: logId++,
        type: "user_verify",
        message: `User identity verified: ${u.name || u.email}`,
        severity: "success",
        actor: "Admin",
        timestamp: u.created_at, // Approximate timestamp for verification
        ip: "N/A",
        module: "Users",
      });
    } else if (u.status === "rejected") {
      logs.push({
        id: logId++,
        type: "user_reject",
        message: `User application rejected: ${u.name || u.email}`,
        severity: "warning",
        actor: "Admin",
        timestamp: u.created_at,
        ip: "N/A",
        module: "Users",
      });
    }
  });

  // 2. Attendance Events
  attendances.forEach(a => {
    logs.push({
      id: logId++,
      type: "login",
      message: `Attendance logged for ${a.user_name} (${a.role})`,
      severity: "info",
      actor: a.user_name,
      timestamp: a.timestamp,
      ip: "N/A",
      module: "Attendance",
    });
  });

  // 3. ID Application Events
  applications.forEach(app => {
    let type = "id_approved";
    let severity = "info";
    let message = `ID Application updated to ${app.status} for ${app.user?.name || "User ID " + app.user_id}`;
    
    if (app.status === "approved" || app.is_ready) {
      type = "id_approved";
      severity = "success";
    } else if (app.status === "completed" && app.claimed_at) {
      type = "id_claimed";
      severity = "success";
      message = `Physical ID card claimed by ${app.user?.name} (Released by ${app.claimed_by || "Admin"})`;
    } else if (app.status === "pending") {
      type = "warning";
      severity = "warning";
    }

    logs.push({
      id: logId++,
      type: type,
      message: message,
      severity: severity,
      actor: app.status === "completed" ? (app.claimed_by || "Admin") : (app.user?.name || "System"),
      timestamp: app.status === "completed" ? app.claimed_at : (app.updated_at || app.submitted_at),
      ip: "N/A",
      module: "Applications",
    });
  });

  return logs.sort((a, b) => {
    // We do a safe fallback in case timestamp is missing
    const tA = a.timestamp ? parseUTC(a.timestamp).getTime() : 0;
    const tB = b.timestamp ? parseUTC(b.timestamp).getTime() : 0;
    return tB - tA;
  });
}

function parseUTC(isoString) {
  if (!isoString) return new Date();
  let parsedStr = String(isoString);
  if (!parsedStr.endsWith('Z') && !parsedStr.match(/[+-]\d{2}:\d{2}$/)) {
    parsedStr += 'Z';
  }
  return new Date(parsedStr);
}

function formatTime(isoString) {
  const date = parseUTC(isoString);
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function timeAgo(isoString) {
  const date = parseUTC(isoString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const PAGE_SIZE = 15;

export default function AuditLog({ userData }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [uRes, aRes, appRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/`),
        fetch(`${API_BASE_URL}/attendance/`),
        fetch(`${API_BASE_URL}/applications`).catch(() => ({ ok: false }))
      ]);
      const usersData = uRes.ok ? await uRes.json() : [];
      const attendanceData = aRes.ok ? await aRes.json() : [];
      const applicationsData = appRes.ok ? await appRes.json() : [];
      
      setUsers(usersData);
      setLogs(generateRealLogs(usersData, attendanceData, applicationsData));
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(loadData, 800);
  };

  const filtered = logs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery);
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.severity === "error").length,
    warnings: logs.filter(l => l.severity === "warning").length,
    today: logs.filter(l => {
      if (!l.timestamp) return false;
      const d = parseUTC(l.timestamp);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  const exportCSV = () => {
    const headers = ["ID", "Timestamp", "Type", "Message", "Actor", "Module", "IP", "Severity"];
    const rows = filtered.map(l =>
      [l.id, l.timestamp, l.type, l.message, l.actor, l.module, l.ip, l.severity].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a234b] dark:text-white tracking-tight">Audit Log</h1>
          <p className="text-slate-400 text-xs font-bold mt-0.5">Complete system activity trail — admin only</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${isRefreshing ? "opacity-60" : ""}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a234b] rounded-xl text-[11px] font-black text-white hover:bg-[#1f2d5e] transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: stats.total, icon: <Shield className="w-5 h-5" />, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Today's Events", value: stats.today, icon: <Clock className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Warnings", value: stats.warnings, icon: <AlertTriangle className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Errors", value: stats.errors, icon: <UserX className="w-5 h-5" />, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-[#1a234b] dark:text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, actors, modules, IPs..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1a234b] dark:focus:border-blue-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={severityFilter}
            onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
            className="py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="user_create">User Created</option>
            <option value="user_verify">User Verified</option>
            <option value="user_update">User Updated</option>
            <option value="user_delete">User Deleted</option>
            <option value="id_approved">ID Approved</option>
            <option value="id_claimed">ID Claimed</option>
            <option value="settings">Settings</option>
            <option value="warning">Warnings</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Activity Log
          </h2>
          <span className="text-[10px] font-bold text-slate-400">{filtered.length} events</span>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#1a234b]/20 border-t-[#1a234b] rounded-full animate-spin" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading audit log...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-16 text-center">
            <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400">No events found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {paginated.map((log) => {
              const evt = EVENT_ICONS[log.type] || EVENT_ICONS.settings;
              return (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  {/* Event Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${evt.bg} ${evt.color}`}>
                    {evt.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{log.message}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[log.severity]}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {log.actor}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        {log.module}
                      </span>
                      <span>{log.ip}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-slate-400">{timeAgo(log.timestamp)}</p>
                    <p className="text-[9px] text-slate-300 dark:text-slate-500 mt-0.5 hidden group-hover:block">{formatTime(log.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400">
              Page {currentPage} of {totalPages} &middot; {filtered.length} events
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-black transition-all ${page === currentPage ? "bg-[#1a234b] text-white shadow-md" : "border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
