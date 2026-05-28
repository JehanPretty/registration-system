import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config";
import { getNormalizedKey, resolveAttributeValue, isAddressSectionTitle } from "../utils/addressMapper";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, Users, ShieldCheck, PieChart as PieChartIcon, AlignLeft, BarChart3, Fingerprint, MapPin, Search
} from "lucide-react";

// Premium Soft Color Palette
const COLORS = [
  '#93c5fd', // Soft Blue
  '#6ee7b7', // Soft Emerald
  '#fde047', // Soft Yellow
  '#fda4af', // Soft Rose
  '#c4b5fd', // Soft Violet
  '#a5f3fc', // Soft Cyan
  '#f9a8d4', // Soft Pink
  '#99f6e4', // Soft Teal
  '#fdba74', // Soft Orange
  '#a78bfa'  // Soft Purple
];

const getColor = (idx) => {
  if (idx < COLORS.length) return COLORS[idx];
  // Generate soft HSL colors for high-cardinality data
  return `hsl(${(idx * 137.5) % 360}, 65%, 75%)`;
};

const buildStatsForField = (roleUsers, fieldLabel) => {
  const stats = {};
  roleUsers.forEach((user) => {
    const raw = resolveAttributeValue(user.attributes || {}, fieldLabel);
    if (raw === undefined || raw === null) return;
    const stringVal = typeof raw === "object" ? JSON.stringify(raw) : String(raw).trim();
    if (stringVal === "" || stringVal.toUpperCase() === "N/A") return;
    stats[stringVal] = (stats[stringVal] || 0) + 1;
  });
  return Object.keys(stats).length > 0 ? stats : null;
};

const RegistrationAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users`);
        if (res.ok) {
          const data = await res.json();
          const nonAdmins = data.filter(u =>
            (u.role_context || "").toLowerCase() !== "super admin" &&
            (u.role_context || "").toLowerCase() !== "administrator"
          );
          setUsers(nonAdmins);

          // Auto-select the first role that has users
          const roles = [...new Set(nonAdmins.map(u => u.role_context).filter(Boolean))];
          if (roles.length > 0) setSelectedRole(roles[0]);
        }
      } catch (e) {
        console.error("Failed to fetch user data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedRole) {
        setSections([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/forms/${encodeURIComponent(selectedRole)}`);
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (e) {
        console.error("Failed to fetch form sections", e);
        setSections([]);
      }
    };
    fetchSections();
  }, [selectedRole]);

  const availableRoles = useMemo(() => {
    return [...new Set(users.map(u => u.role_context).filter(Boolean))].sort();
  }, [users]);

  // Aggregate attributes for the selected role
  const { filteredUsers, fieldStats } = useMemo(() => {
    if (!selectedRole) return { filteredUsers: [], fieldStats: {} };

    const filtered = users.filter(u => u.role_context === selectedRole);
    const stats = {};

    filtered.forEach(user => {
      const attrs = user.attributes || {};
      const excludedKeys = [
        'is_profile_complete',
        'is_approved',
        'created_at',
        'updated_at',
        'physical_id_requested',
        'has_applied_for_id',
        'id_picture',
        'signature'
      ];

      Object.entries(attrs).forEach(([key, value]) => {
        if (excludedKeys.includes(key)) return;
        if (!value) return;

        // Convert arrays/objects to string if necessary, but assume strings for form answers
        let stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
        if (stringVal === "" || stringVal.toUpperCase() === "N/A") return;

        if (!stats[key]) stats[key] = {};
        stats[key][stringVal] = (stats[key][stringVal] || 0) + 1;
      });
    });

    return { filteredUsers: filtered, fieldStats: stats };
  }, [users, selectedRole]);

  const organizedAnalytics = useMemo(() => {
    if (!selectedRole || !filteredUsers.length) return [];

    const sectionGroups = sections.map((section) => {
      const fieldAnalytics = (section.fields || [])
        .map((field) => ({
          label: field.label,
          key: field.label,
          stats: buildStatsForField(filteredUsers, field.label),
        }))
        .filter((f) => f.stats);

      return {
        title: section.title?.replace(/ Info$/i, " Information"),
        isAddress: isAddressSectionTitle(section.title),
        fields: fieldAnalytics,
      };
    }).filter((s) => s.fields.length > 0);

    // Legacy/orphan attribute keys not tied to a form field label
    const otherFields = Object.keys(fieldStats)
      .filter((key) => {
        return !sections.some((s) =>
          (s.fields || []).some(
            (f) =>
              f.label === key ||
              getNormalizedKey(f.label) === key ||
              getNormalizedKey(key) === getNormalizedKey(f.label)
          )
        );
      })
      .map((key) => ({
        label: key.replace(/_/g, " "),
        key,
        stats: fieldStats[key],
      }))
      .filter((f) => f.stats);

    if (otherFields.length > 0) {
      sectionGroups.push({
        title: "Other Details",
        isAddress: false,
        fields: otherFields,
      });
    }

    return sectionGroups;
  }, [sections, fieldStats, filteredUsers, selectedRole]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f2a56] text-white p-3 rounded-xl border border-white/10 shadow-xl text-xs font-medium z-50">
          <p className="mb-1 opacity-70 tracking-widest text-[9px] ">{label || payload[0].name}</p>
          <p className="text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].payload.fill }}></span>
            {payload[0].value} Responses
          </p>
        </div>
      );
    }
    return null;
  };

  const renderFieldVisualization = (fieldKey, counts) => {
    // Sort counts descending
    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const uniqueAnswersCount = data.length;

    // 1. PIE CHART (1-6 Unique Answers)
    if (uniqueAnswersCount > 0 && uniqueAnswersCount <= 6) {
      return (
        <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-white/60 flex flex-col h-[380px] hover:shadow-xl transition-all duration-500 group/chart">
          <h3 className="text-xs font-black text-slate-800 tracking-widest mb-6 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-blue-500" />
            </div>
            {fieldKey}
          </h3>
          <div className="flex-1 min-h-0 flex items-center">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index)} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 tracking-tighter">Total</span>
                <span className="text-lg font-black text-slate-800">{filteredUsers.length}</span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="w-1/2 h-full overflow-y-auto custom-scrollbar flex flex-col gap-3 pl-6 py-2">
              {data.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getColor(idx) }}></div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-slate-700 truncate leading-none" title={item.name}>{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 2. BAR CHART (7-20 Unique Answers)
    if (uniqueAnswersCount > 6 && uniqueAnswersCount <= 20) {
      return (
        <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-white/60 flex flex-col h-[380px] hover:shadow-xl transition-all duration-500 group/chart">
          <h3 className="text-xs font-black text-slate-800 tracking-widest mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            {fieldKey}
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // 3. LIST / RAW RESPONSES (>20 Unique Answers)
    return (
      <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-white/60 flex flex-col h-[380px] hover:shadow-xl transition-all duration-500 group/chart">
        <h3 className="text-xs font-black text-slate-800  tracking-widest mb-1 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <AlignLeft className="w-4 h-4 text-purple-500" />
          </div>
          {fieldKey}
        </h3>
        <p className="text-[10px] font-black text-slate-400 mb-6  tracking-wider pl-10">{uniqueAnswersCount} Unique Entries</p>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-white/50 rounded-[1.25rem] border border-white/40 hover:border-blue-200 transition-all group/item">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/item:bg-blue-400 transition-colors" />
                <p className="text-[11px] font-bold text-slate-600 leading-tight break-words">
                  {item.name}
                </p>
              </div>
              {item.value > 1 && (
                <span className="shrink-0 bg-blue-50 text-blue-500 text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in duration-500">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold tracking-widest text-slate-400 ">Aggregating Form Responses...</p>
      </div>
    );
  }

  const fieldKeys = Object.keys(fieldStats);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            Dynamic Form Analytics
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Visualizing real responses from completed user registration forms.
          </p>
        </div>

        {/* Accurate Search Filter */}
        <div className="relative group w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter analytics by field name..."
            className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl py-3.5 pl-11 pr-5 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
            >
              <Fingerprint className="w-4 h-4 rotate-45" />
            </button>
          )}
        </div>
      </div>

      {/* ROLE SELECTOR & SUMMARY */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <p className="text-[10px] font-black text-slate-400 tracking-widest mb-3">Analyze Responses For</p>
          <div className="flex flex-wrap gap-2">
            {availableRoles.length === 0 ? (
              <span className="text-sm font-bold text-slate-500">No roles with active users found.</span>
            ) : (
              availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${selectedRole === role
                    ? "bg-[#1f2a56] text-white shadow-md scale-105"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                >
                  {role}
                </button>
              ))
            )}
          </div>
        </div>

        {selectedRole && (
          <div className="flex gap-4 shrink-0 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="text-center px-4 border-r border-blue-200/50">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Users</p>
              <h3 className="text-3xl font-black text-blue-700 leading-none">{filteredUsers.length}</h3>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Custom Fields</p>
              <h3 className="text-3xl font-black text-blue-700 leading-none">{fieldKeys.length}</h3>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC FIELD RENDERER */}
      {selectedRole && (
        <>
          {organizedAnalytics.length === 0 ? (
            <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-[2rem] p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <Fingerprint className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-2">No Form Data Found</h3>
              <p className="text-sm font-bold text-slate-400 max-w-md">
                Users in the <span className="text-blue-500">{selectedRole}</span> role have not completed their registration forms yet, or their form does not contain any custom fields.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {organizedAnalytics
                .map(section => {
                  const filteredFields = section.fields.filter(f =>
                    f.label.replace(/_/g, " ").toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  if (filteredFields.length === 0) return null;

                  return (
                    <div key={section.title} className="bg-slate-50/30 rounded-[3rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-4 mb-8 px-4">
                        <div className={`h-2 w-12 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] ${section.isAddress ? "bg-emerald-500" : "bg-blue-600"}`}></div>
                        {section.isAddress ? (
                          <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : null}
                        <h2 className="text-lg font-black text-[#1a234b] uppercase tracking-widest">{section.title}</h2>
                        <div className="flex-1 h-px bg-slate-200/50"></div>
                        <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                          {filteredFields.length} {filteredFields.length === 1 ? 'Metric' : 'Metrics'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFields.map(field => (
                          <React.Fragment key={field.key}>
                            {renderFieldVisualization(field.label, field.stats)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default RegistrationAnalytics;
