import React, { useState, useEffect } from "react";
import { Palette, X, Check } from "lucide-react";
import { API_BASE_URL } from "../config";

const THEME_PRESETS = [
  { name: "RegisSys Blue", hex: "#1f2a56" },
  { name: "Crimson Red", hex: "#9f1239" },
  { name: "Emerald Green", hex: "#065f46" },
  { name: "Amethyst Purple", hex: "#4c1d95" },
  { name: "Midnight Charcoal", hex: "#1e293b" },
  { name: "Ocean Teal", hex: "#0f766e" },
  { name: "Steel Blue", hex: "#1e3a8a" },
  { name: "Warm Amber", hex: "#b45309" },
  { name: "Cool Cyan", hex: "#155e75" },
  { name: "Graphite Dark", hex: "#111827" },
  { name: "Lavender Mist", hex: "#6d28d9" },
  { name: "Olive Green", hex: "#4d7c0f" },
  { name: "Coral Pink", hex: "#e11d48" },
  { name: "Ice Blue", hex: "#0284c7" },
  { name: "Golden Bronze", hex: "#92400e" },
  { name: "Clean Black", hex: "#000000" },
  { name: "Slate Gray", hex: "#475569" },
  { name: "Galaxy Deep", hex: "#140a2e" }
];

export default function ThemeCustomizer({ onClose, userId }) {
  const [primaryColor, setPrimaryColor] = useState("#1f2a56");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load this user's saved theme from localStorage
    if (userId) {
      const saved = localStorage.getItem(`regisSys_primaryColor_${userId}`);
      if (saved) setPrimaryColor(saved);
    }
  }, [userId]);

  const handleApplyTheme = async () => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("regisSys_user") || "{}");
      const isAdmin = ["Super Admin", "Administrator"].includes(user.role_context);

      // 1. Save theme per-user in localStorage (for local UI responsiveness)
      if (userId) {
        localStorage.setItem(`regisSys_primaryColor_${userId}`, primaryColor);
      }

      // 2. If user is an admin, save as GLOBAL system theme in backend
      if (isAdmin) {
        const res = await fetch(`${API_BASE_URL}/settings/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primary_color: primaryColor })
        });
        
        if (!res.ok) {
          throw new Error("Failed to save theme to server");
        }
        
        // Broadcast that the global theme has changed
        window.dispatchEvent(new CustomEvent('theme-updated'));
      }

      // 3. Broadcast instant update so Dashboard sidebar updates immediately
      window.dispatchEvent(new CustomEvent('theme-update-instant', {
        detail: { primary_color: primaryColor }
      }));
      
      onClose();
    } catch (err) {
      console.error("Failed to apply theme:", err);
      alert("Error saving theme: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-[200] border-l border-slate-100">

      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full opacity-50 pointer-events-none"></div>
        <div>
          <h2 className="text-sm font-black text-[#1a234b] tracking-widest flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600" /> Theme
          </h2>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 mt-1">Theme Customization</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">



        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-[#1a234b] tracking-[2px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Primary Color
          </h3>

          {/* Native Picker */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-14 h-14 rounded-2xl border-none p-0 cursor-pointer overflow-hidden shadow-md shrink-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-xs font-black text-[#1a234b] outline-none shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-[#1a234b] tracking-[2px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Recommended Presets
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {THEME_PRESETS.map(preset => (
              <button
                key={preset.hex}
                onClick={() => setPrimaryColor(preset.hex)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${primaryColor === preset.hex ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-200'}`}
              >
                <div className="w-6 h-6 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: preset.hex }}></div>
                <span className="text-[9px] font-bold text-slate-600 text-center leading-tight truncate w-full">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <button
          disabled={isSaving}
          onClick={handleApplyTheme}
          className="w-full flex items-center justify-center gap-2 bg-[#1f2a56] hover:bg-blue-900 active:scale-95 text-white py-3.5 rounded-2xl font-black text-[11px] tracking-widest shadow-xl shadow-[#1f2a56]/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Check className="w-4 h-4" />
          )}
          {isSaving ? "Applying..." : "Apply My Theme"}
        </button>
      </div>

    </div>
  );
}
