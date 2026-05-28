import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
  Download, RefreshCw, TrendingUp, Users, UserCheck,
  Clock, ShieldAlert, FileText, BarChart2, PieChart as PieIcon,
  Layers, CreditCard, Calendar, Filter
} from "lucide-react";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f2a56] text-white p-3 rounded-xl shadow-xl text-xs font-bold border border-white/10">
      <p className="text-white/50 text-[9px] tracking-widest mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#fff" }}>{p.name}: <span className="font-black">{p.value}</span></p>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-emerald-50 text-emerald-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-500",
    blue:   "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-black text-[#1a234b] dark:text-white">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
      {sub && <p className="text-[10px] font-bold text-slate-300 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-[#1a234b]/10 text-[#1a234b] dark:bg-white/10 dark:text-white rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black text-[#1a234b] dark:text-white">{title}</h3>
        {subtitle && <p className="text-[10px] font-bold text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Reports() {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("all");

  const parseUTC = (isoString) => {
    if (!isoString) return new Date();
    let parsedStr = String(isoString);
    if (!parsedStr.endsWith('Z') && !parsedStr.match(/[+-]\d{2}:\d{2}$/)) {
      parsedStr += 'Z';
    }
    return new Date(parsedStr);
  };

  // Derived data
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0, newToday: 0, idApps: 0 });
  const [roleData, setRoleData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [appStatusData, setAppStatusData] = useState([]);

  const processUsers = (data, apps = []) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const cutoff = dateRange === "7d"
      ? new Date(now - 7 * 86400000)
      : dateRange === "30d"
      ? new Date(now - 30 * 86400000)
      : null;

    const filtered = data.filter(u => {
      const isSA = (u.role_context || "").trim().toLowerCase() === "super admin";
      if (isSA) return false;
      if (cutoff) return parseUTC(u.created_at) >= cutoff;
      return true;
    });

    const filteredApps = apps.filter(a => {
      if (cutoff) {
        const appDate = a.updated_at || a.submitted_at;
        if (appDate) return parseUTC(appDate) >= cutoff;
      }
      return true;
    });

    let verified = 0, pending = 0, rejected = 0, newToday = 0;
    const roleCounts = {}, dateCounts = {};

    filtered.forEach(u => {
      if (u.status === "verified") verified++;
      else if (u.status === "rejected") rejected++;
      else pending++;
      if (parseUTC(u.created_at).toDateString() === todayStr) newToday++;
      const role = u.role_context || "Unassigned";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
      const dateKey = parseUTC(u.created_at).toISOString().split("T")[0];
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    setStats({ total: filtered.length, verified, pending, rejected, newToday, idApps: filteredApps.length });

    setRoleData(
      Object.entries(roleCounts)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / filtered.length) * 100) }))
        .sort((a, b) => b.count - a.count)
    );

    setStatusData([
      { name: "Verified", value: verified, fill: "#4f46e5" },
      { name: "Pending",  value: pending,  fill: "#f59e0b" },
      { name: "Rejected", value: rejected, fill: "#ef4444" },
    ]);

    const sorted = Object.keys(dateCounts).sort();
    // Fill zero-days for cleaner trend line
    const filled = [];
    sorted.forEach((d, i) => {
      if (i > 0) {
        let prev = new Date(sorted[i - 1]);
        prev.setDate(prev.getDate() + 1);
        while (prev.toISOString().split("T")[0] < d) {
          filled.push({ date: prev.toISOString().split("T")[0].slice(5), registrations: 0 });
          prev.setDate(prev.getDate() + 1);
        }
      }
      filled.push({ date: d.slice(5), registrations: dateCounts[d] });
    });
    setTrendData(filled.slice(-30));

    const appCounts = {};
    filteredApps.forEach(a => { appCounts[a.status || "unknown"] = (appCounts[a.status || "unknown"] || 0) + 1; });
    setAppStatusData(Object.entries(appCounts).map(([name, value]) => ({ name, value })));
  };

  const fetchAll = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/applications`).catch(() => ({ ok: false })),
      ]);
      const uData = uRes.ok ? await uRes.json() : [];
      const aData = aRes.ok ? await aRes.json() : [];
      setUsers(uData);
      setApplications(aData);
      processUsers(uData, aData);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (!loading) processUsers(users, applications); }, [dateRange]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  const exportCSV = () => {
    const now = new Date();
    const cutoff = dateRange === "7d"
      ? new Date(now - 7 * 86400000)
      : dateRange === "30d"
      ? new Date(now - 30 * 86400000)
      : null;

    const rows = [
      ["Name", "Role", "Status", "ID Number", "Registered"],
      ...users
        .filter(u => {
          if ((u.role_context || "").trim().toLowerCase() === "super admin") return false;
          if (cutoff) return parseUTC(u.created_at) >= cutoff;
          return true;
        })
        .map(u => [u.name, u.role_context || "—", u.status, u.external_id || "—", parseUTC(u.created_at).toLocaleDateString()])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-in fade-in">
        <div className="w-10 h-10 border-4 border-[#1a234b]/20 border-t-[#1a234b] rounded-full animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Building your report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1a234b] dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-400 text-xs font-bold mt-0.5">Full system metrics, registration trends, and exportable data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
            {[["all", "All Time"], ["30d", "30 Days"], ["7d", "7 Days"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setDateRange(val)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${dateRange === val ? "bg-[#1a234b] text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
              >{lbl}</button>
            ))}
          </div>
          <button onClick={handleRefresh} className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all ${refreshing ? "opacity-60" : ""}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#1a234b] rounded-xl text-[11px] font-black text-white hover:bg-[#1f2d5e] transition-all shadow-md">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />}     label="Total Users"     value={stats.total}    color="indigo" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="Verified"         value={stats.verified}  color="green" />
        <StatCard icon={<Clock className="w-5 h-5" />}     label="Pending"          value={stats.pending}   color="amber" />
        <StatCard icon={<ShieldAlert className="w-5 h-5" />} label="Rejected"       value={stats.rejected}  color="red" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="New Today"       value={stats.newToday}  color="blue" />
        <StatCard icon={<CreditCard className="w-5 h-5" />} label="ID Applications" value={stats.idApps}   color="purple" />
      </div>

      {/* ── CHARTS ROW 1: Trend + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Registration Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Registration Trend" subtitle={`Last ${trendData.length} recorded days`} />
          <div className="h-64">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="registrations" stroke="#4f46e5" strokeWidth={2.5} fill="url(#trendGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#4f46e5" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-xs font-bold tracking-widest">Not enough data for trend</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col">
          <SectionHeader icon={<PieIcon className="w-4 h-4" />} title="Verification Status" subtitle="User account breakdown" />
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.fill }} />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.name}</span>
                </div>
                <span className="text-sm font-black text-[#1a234b] dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2: Role Bar + App Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Users by Role Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <SectionHeader icon={<Layers className="w-4 h-4" />} title="Users by Role" subtitle={`${roleData.length} active roles`} />
          <div className="h-56">
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300">
                <p className="text-xs font-bold">No role data available</p>
              </div>
            )}
          </div>
        </div>

        {/* ID Application Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col">
          <SectionHeader icon={<CreditCard className="w-4 h-4" />} title="ID Applications" subtitle="By current status" />
          {appStatusData.length > 0 ? (
            <>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={appStatusData} cx="50%" cy="50%" outerRadius={64} paddingAngle={3} dataKey="value" stroke="none">
                      {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {appStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize">{s.name}</span>
                    </div>
                    <span className="text-sm font-black text-[#1a234b] dark:text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <CreditCard className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-bold tracking-widest text-center">No application data</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ROLE BREAKDOWN TABLE ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Role Breakdown Report</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{roleData.length} roles</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/40">
                {["Role", "Users", "Verified", "Pending", "Rejected", "Share"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {roleData.map((role, i) => {
                const roleUsers = users.filter(u => (u.role_context || "Unassigned") === role.name);
                const rv = roleUsers.filter(u => u.status === "verified").length;
                const rp = roleUsers.filter(u => u.status !== "verified" && u.status !== "rejected").length;
                const rr = roleUsers.filter(u => u.status === "rejected").length;
                return (
                  <tr key={role.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[11px] font-black text-[#1a234b] dark:text-white">{role.count}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{rv}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{rp}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{rr}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 w-20 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${role.pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{role.pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {roleData.length === 0 && (
            <div className="p-12 text-center">
              <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No data to report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Trigger HMR
