import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

function Overview({ userRoles }) {
  const [attendances, setAttendances] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const attRes = await fetch(`${API_BASE_URL}/attendance/`);
      if (attRes.ok) setAttendances(await attRes.json());

      const usersRes = await fetch(`${API_BASE_URL}/users/`);
      if (usersRes.ok) {
        const users = await usersRes.json();
        setTotalUsers(users.length);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 text-gray-900 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#1f2a56] tracking-tight">System Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Live metrics across the entire RegiSys ecosystem.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Live Status: Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] mb-2">Total Registrations</p>
          <h2 className="text-5xl font-black text-[#1f2a56]">{totalUsers}</h2>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] mb-2">Configured Roles</p>
          <h2 className="text-5xl font-black text-[#1f2a56]">{userRoles.length}</h2>
        </div>

        <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] mb-2">Live Attendances</p>
          <h2 className="text-5xl font-black text-[#1f2a56]">{attendances.length}</h2>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-[#1f2a56] tracking-tight flex items-center gap-3">
             <span className="w-1.5 h-6 bg-[#1f2a56] rounded-full"></span>
             Recent Activity
          </h3>
          <span className="text-[10px] font-black text-gray-400 tracking-widest">Auto-updating (10s)</span>
        </div>

        <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold text-xs animate-pulse">Synchronizing Data...</div>
          ) : attendances.length === 0 ? (
            <div className="py-32 text-center text-gray-300">
               <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p className="font-black tracking-widest text-xs">No activity tracked yet today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendances.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#1f2a56] font-black text-lg border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {att.user_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-[#1f2a56]">{att.user_name}</h4>
                      <p className="text-[10px] font-medium text-gray-400 tracking-widest mt-0.5">{att.role} &bull; {att.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-gray-900">{new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[9px] font-bold text-gray-300 mt-0.5">{new Date(att.timestamp).toLocaleDateString()}</p>
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

export default Overview;
