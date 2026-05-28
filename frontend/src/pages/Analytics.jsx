import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  Users, UserCheck, Clock, TrendingUp, AlertCircle, ShieldAlert,
  Activity, Layers, RefreshCw, ChevronRight
} from "lucide-react";

function Analytics({ userRoles = [], userName = "Admin" }) {
  const [users, setUsers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    newToday: 0
  });

  // Chart Data State
  const [trendData, setTrendData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [roleData, setRoleData] = useState([]);

  const fetchData = async () => {
    try {
      const [usersRes, attRes, appRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/attendance/`),
        fetch(`${API_BASE_URL}/applications`)
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
        processData(data);
      }
      if (attRes.ok) {
        setAttendances(await attRes.json());
      }
      if (appRes.ok) {
        setApplications(await appRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const processData = (data) => {
    const now = new Date();
    const todayStr = now.toDateString();

    let verified = 0;
    let pending = 0;
    let rejected = 0;
    let newToday = 0;
    let roleCounts = {};
    let dateCounts = {};

    data.forEach(user => {
      // Robust Super Admin check
      const isSuperAdmin = (user.role_context || "").trim().toLowerCase() === "super admin";
      if (isSuperAdmin) return;

      if (user.status === 'verified') verified++;
      else if (user.status === 'rejected') rejected++;
      else pending++;

      const createdDate = new Date(user.created_at);
      if (createdDate.toDateString() === todayStr) {
        newToday++;
      }

      const role = user.role_context || "Unassigned";
      roleCounts[role] = (roleCounts[role] || 0) + 1;

      const dateStr = createdDate.toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const filteredDataCount = data.filter(u => (u.role_context || "").trim().toLowerCase() !== "super admin").length;
    setStats({ total: filteredDataCount, verified, pending, rejected, newToday });

    setStatusData([
      { name: 'Verified', value: verified, color: 'var(--theme-primary)' },
      { name: 'Pending', value: pending, color: '#94a3b8' },
      { name: 'Rejected', value: rejected, color: '#475569' }
    ]);

    const formattedRoleData = Object.keys(roleCounts).map(role => ({
      name: role,
      users: roleCounts[role]
    })).sort((a, b) => b.users - a.users);
    setRoleData(formattedRoleData);

    const sortedDates = Object.keys(dateCounts).sort();
    const formattedTrendData = sortedDates.map(date => {
      const d = new Date(date);
      const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
      return { rawDate: date, date: displayDate, registrations: dateCounts[date] };
    });
    setTrendData(formattedTrendData);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f2a56] text-white p-3 rounded-xl border border-white/10 shadow-xl text-xs font-medium">
          <p className="mb-1 opacity-70 tracking-widest text-[9px]">{label}</p>
          <p className="text-sm font-bold">
            {payload[0].name === "users" ? "Users: " : ""}
            {payload[0].value}
            {payload[0].name === "registrations" ? " Registrations" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  const combinedActivity = useMemo(() => {
    const activities = [];

    // 1. Attendance Events
    attendances.forEach(att => {
      activities.push({
        id: `att-${att.id}`,
        title: 'Attendance Marked',
        user: att.user_name,
        desc: `Marked as ${att.status}`,
        timestamp: new Date(att.timestamp),
        icon: <Activity className="w-3.5 h-3.5" />,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      });
    });

    // 2. New Registrations
    users.forEach(u => {
      if ((u.role_context || "").trim().toLowerCase() === "super admin") return;
      activities.push({
        id: `user-${u.id}`,
        title: 'New Registration',
        user: u.name,
        desc: `Joined as ${u.role_context || 'Member'}`,
        timestamp: new Date(u.created_at),
        icon: <Users className="w-3.5 h-3.5" />,
        color: 'bg-blue-50 text-blue-600 border-blue-100'
      });
    });

    // 3. ID Applications
    applications.forEach(app => {
      let title = "ID Application";
      let color = 'bg-amber-50 text-amber-600 border-amber-100';
      let icon = <Layers className="w-3.5 h-3.5" />;
      let desc = app.status === 'pending' ? 'Applied for physical ID' : 'ID application processing';
      
      if (app.is_ready || app.status === 'approved') {
        title = "Application Approved";
        color = 'bg-indigo-50 text-indigo-600 border-indigo-100';
        icon = <UserCheck className="w-3.5 h-3.5" />;
        desc = "ID is ready for pickup";
      }

      activities.push({
        id: `app-${app.id}`,
        title: title,
        user: app.user?.name || "Member",
        desc: desc,
        timestamp: new Date(app.submitted_at || app.created_at),
        icon: icon,
        color: color
      });
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [users, attendances, applications]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-in fade-in duration-500">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold tracking-widest text-slate-400">Loading System Insights...</p>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* ── WELCOME HERO ──────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1f2a56] rounded-[32px] p-8 md:p-10 shadow-xl border border-white/5">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              Hi, {getGreeting()}, <span className="text-blue-400">{userName.split(' ')[0]}!</span>
            </h1>
            <p className="text-blue-100/60 text-xs md:text-sm font-medium max-w-xl leading-relaxed">
              Welcome back to the Command Center. All systems are operational, and the registration telemetry is syncing in real-time.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center md:items-end shadow-inner">
            <div className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-1 tabular-nums">
              {formattedTime}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold text-blue-300 uppercase tracking-widest">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">System Insights & Analytics</h1>
          <p className="text-slate-500 text-[9px] md:text-[10px] font-medium mt-1">Live metrics, real-time telemetry, and registration analytics across the ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:rotate-180 transition-all duration-500" />
            <span className="text-xs font-bold tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">Refresh</span>
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest text-slate-600">Live Data</span>
          </div>
        </div>
      </div>

      {/* ── HERO STAT CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

        {/* Total Users */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">
          <Users className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
          <div className="relative z-10 w-full">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Total Users</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{stats.total}</h3>
              {stats.newToday > 0 && (
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-bold text-[8px] shadow-sm">
                  <TrendingUp className="w-2 h-2" />
                  <span>+{stats.newToday}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verified */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">

          <UserCheck className="w-5 h-5 text-green-600 shrink-0 mt-1" />
          <div className="relative z-10">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Verified</p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{stats.verified}</h3>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
          <div className="relative z-10 w-full">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Pending</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{stats.pending}</h3>
              {stats.pending > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-bold text-[7px] animate-pulse shadow-sm whitespace-nowrap">
                  <AlertCircle className="w-2 h-2" />
                  <span>Action</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">

          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-1" />
          <div className="relative z-10">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Rejected</p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{stats.rejected}</h3>
          </div>
        </div>

        {/* Configured Roles */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">

          <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
          <div className="relative z-10">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Roles</p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{userRoles.length}</h3>
          </div>
        </div>

        {/* Live Attendances */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow group relative overflow-hidden">

          <Activity className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
          <div className="relative z-10">
            <p className="text-[7px] font-black tracking-widest text-slate-400 mb-1 uppercase">Attendance</p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-none">{attendances.length}</h3>
          </div>
        </div>
      </div>

      {/* ── USERS BY ROLE ─────────────────────────────── */}
      {roleData.length > 0 && (
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 p-4 md:p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black tracking-widest text-slate-800 dark:text-blue-300">Users by Role</h3>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-white/40">{roleData.length} Roles Active</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {roleData.map((role, index) => {
              const colors = [
                { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
                { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500" },
                { bg: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-500" },
                { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
                { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
                { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500" },
                { bg: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500" },
                { bg: "bg-teal-50", text: "text-teal-600", bar: "bg-teal-500" },
              ];
              const color = colors[index % colors.length];
              const percentage = stats.total > 0 ? Math.round((role.users / stats.total) * 100) : 0;

              return (
                <div
                  key={role.name}
                  className="group relative bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 transition-all hover:shadow-md cursor-default"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 ${color.bg} ${color.text} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 truncate">{role.name}</p>
                      <h4 className="text-xl font-black text-[#1f2a56] leading-none mt-0.5">{role.users}</h4>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${color.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-1.5 text-right">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CHARTS GRID ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Registration Growth Chart */}
        <div className="bg-white dark:bg-white/5 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black tracking-widest text-slate-800 dark:text-blue-300">Registration Growth</h3>
          </div>
          <div className="flex-1 min-h-[280px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="var(--theme-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReg)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--theme-primary)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-xs font-bold tracking-widest">Not enough data to map trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status Distribution */}
        <div className="bg-white dark:bg-white/5 justify-between p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 flex flex-col">
          <h3 className="text-sm font-black tracking-widest text-slate-800 dark:text-blue-300 mb-2">Audience Status</h3>
          <div className="flex-1 min-h-[220px] -mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="flex flex-col gap-2 mt-4 bg-slate-50 p-4 rounded-2xl">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-[#1f2a56]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution Chart */}
        <div className="bg-white dark:bg-white/5 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 lg:col-span-3">
          <h3 className="text-sm font-black tracking-widest text-slate-800 dark:text-blue-300 mb-6">User Demographics by Role</h3>
          <div className="h-[250px]">
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="users"
                    fill="var(--theme-primary)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--theme-primary)" opacity={index % 2 === 0 ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Users className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-xs font-bold tracking-widest">No demographic data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY FEED ──────────────────────── */}
      <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <h3 className="text-sm font-black text-slate-800 dark:text-blue-300 tracking-widest flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#1f2a56] dark:bg-blue-400 rounded-full"></span>
            Recent Activity
          </h3>
          <span className="text-[10px] font-black text-slate-400 dark:text-white/40 tracking-widest">Auto-updating (10s)</span>
        </div>

        <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar">
          {combinedActivity.length === 0 ? (
            <div className="py-20 text-center text-slate-300">
              <svg className="w-14 h-14 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-black tracking-widest text-xs">No activity tracked yet today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {combinedActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white rounded-3xl transition-all border border-slate-50 dark:border-white/5 hover:border-blue-100 hover:shadow-xl group animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl ${act.color} flex items-center justify-center border shadow-sm group-hover:scale-110 transition-all duration-300`}>
                      {act.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-blue-100 text-sm flex items-center gap-2">
                        {act.title}
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-blue-500">{act.user}</span>
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1 uppercase">{act.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-800 dark:text-blue-300">{act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{act.timestamp.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Analytics;
