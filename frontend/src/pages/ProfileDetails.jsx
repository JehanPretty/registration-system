import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Loader2, Save, CheckCircle2, ChevronDown, PenLine, User as UserIcon,
  QrCode, RefreshCw, Download
} from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { API_BASE_URL } from "../config";
import IDCard from "../components/IDCard";
import { toPng } from "html-to-image";
import AddressForm from "../components/AddressForm";
import { resolveAttributeValue, getNormalizedKey } from "../utils/addressMapper";

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

function ProfileDetails({ profileAvatar, fileInputRef, userRoles, userData }) {
  /* ── Unified Profile Edit State ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userData?.name || "",
    external_id: userData?.external_id || "",
    email: userData?.email || "",
    attributes: userData?.attributes || {},
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  /* ── Fetch Dynamic Form Sections for categorization ── */
  const [formSections, setFormSections] = useState([]);

  /* ── Digital ID States ── */
  const [template, setTemplate] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [side, setSide] = useState("front");

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!userData?.role_context) { setIsLoadingTemplate(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/id-builder/${userData.role_context}`);
        if (res.ok) setTemplate(await res.json());
      } catch (err) {
        console.error("Failed to fetch ID template:", err);
      } finally {
        setIsLoadingTemplate(false);
      }
    };
    fetchTemplate();
  }, [userData?.role_context]);

  const handleDownloadID = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("digital-id-card");
      if (!element) return;
      const dataUrl = await toPng(element, { pixelRatio: 3, cacheBust: true, style: { borderRadius: "24px" } });
      const link = document.createElement("a");
      link.download = `${userData.name.replace(/\s+/g, "_")}_ID_${side}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (userData?.role_context) {
      const fetchFormSections = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/forms/${userData.role_context}`);
          if (res.ok) {
            const data = await res.json();
            setFormSections(data);
          }
        } catch (err) {
          console.error("Failed to fetch form sections:", err);
        }
      };
      fetchFormSections();
    }
  }, [userData?.role_context]);

  // Update edit form when userData changes
  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
        external_id: userData.external_id || "",
        email: userData.email || "",
        attributes: userData.attributes || {},
      });
    }
  }, [userData]);


  /* ── Save Unified Profile ── */
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        external_id: editForm.external_id,
        attributes: editForm.attributes,
        role_context: userData?.role_context,
      };

      const res = await fetch(`${API_BASE_URL}/users/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem("regisSys_user", JSON.stringify(updatedUser));
        setIsEditing(false);
        // Dispatch event to app to reload user
        window.dispatchEvent(new Event('storage'));
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Network error.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* ── Download ID as PNG ── (Removed: Moved to DigitalID view) */


  // Helper to format dynamic attribute keys into title case labels
  const formatKeyName = (key) => {
    if (!key) return "";
    let str = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    if (str.toLowerCase() === "telephone") return "Alternate Number";
    return str;
  };

  // Filter out internal attributes
  const renderableAttributes = Object.keys(editForm.attributes || {}).filter(
    key => !["is_profile_complete", "completed_at"].includes(key)
  );

  const displayName = userData?.name || "New User";
  const displayEmail = userData?.email || "No email provided";
  const displayRole = userData?.role_context || "Unassigned";
  const displayId = userData?.external_id || "PENDING-001";


  if (isEditing) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-6xl mx-auto pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-10">
            {/* ── Header ── */}
            <div className="mb-8 text-center">
              <div className="h-1 w-10 bg-indigo-600 rounded-full mx-auto mb-4" />
              <h2 className="text-2xl font-black text-[#1a234b]">Edit Profile</h2>
              <p className="text-slate-400 text-[10px] font-bold">Update your official information below</p>
            </div>

            <div className="space-y-6">
              {/* ── Identity Information (Read-only) ── */}
              <div className="p-5 rounded-xl border border-indigo-50 bg-indigo-50/20">
                <h3 className="text-[10px] font-bold text-indigo-600 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Identity Information (Read-only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-indigo-100 md:border-0 last:border-0 px-2">
                    <label className="text-[9px] text-gray-400 font-bold shrink-0 w-32 md:w-36">Account Name:</label>
                    <p className="text-sm font-semibold text-[#1a234b]">{displayName}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-indigo-100 last:border-0 px-2">
                    <label className="text-[9px] text-gray-400 font-bold shrink-0 w-32 md:w-36">ID Number:</label>
                    <p className="text-sm font-semibold text-[#1a234b]">{displayId}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-indigo-100 last:border-0 px-2">
                    <label className="text-[9px] text-gray-400 font-bold shrink-0 w-32 md:w-36">Verified Role:</label>
                    <p className="text-sm font-semibold text-[#1a234b]">{displayRole}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-indigo-100 last:border-0 px-2">
                    <label className="text-[9px] text-gray-400 font-bold shrink-0 w-32 md:w-36">Registered Email:</label>
                    <p className="text-sm font-semibold text-[#1a234b]">{displayEmail}</p>
                  </div>
                </div>
              </div>

              {/* ── Editable Personal Details ── */}
              {formSections?.map((section) => {
                const isAddressSection = section.sectionTitle?.toLowerCase().includes("address");
                
                return (
                  <div key={section.id} className={`p-5 rounded-xl border ${isAddressSection ? 'bg-slate-50/30 border-slate-100' : 'border-slate-100'}`}>
                    <h3 className="text-[10px] font-bold text-[#1a234b] mb-5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      {section.sectionTitle}
                    </h3>

                    {isAddressSection ? (
                      <AddressForm 
                        values={{
                          country: editForm.attributes["Country"],
                          state: editForm.attributes["Province"] || editForm.attributes["Region"],
                          city: editForm.attributes["City/Municipality"],
                          barangay: editForm.attributes["Barangay"],
                          zipcode: editForm.attributes["Zipcode"],
                          street: editForm.attributes["Street Address"],
                          unit: editForm.attributes["Unit/Floor"]
                        }}
                        onChange={(field, val) => {
                          const map = {
                            country: "Country",
                            state: "Province",
                            city: "City/Municipality",
                            barangay: "Barangay",
                            zipcode: "Zipcode",
                            street: "Street Address",
                            unit: "Unit/Floor"
                          };
                          setEditForm(prev => ({
                            ...prev,
                            attributes: { ...prev.attributes, [map[field] || field]: val }
                          }));
                        }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {section.fields?.map((field) => {
                          const key = field.label;
                          const displayLabel = formatKeyName(key);
                          const isPhone = displayLabel?.toLowerCase().includes("phone") || displayLabel?.toLowerCase().includes("number") || displayLabel?.toLowerCase().includes("mobile");
                          const isGender = displayLabel?.toLowerCase() === "gender";
                          const isCivilStatus = displayLabel?.toLowerCase().includes("civil status") || displayLabel?.toLowerCase().includes("marital status");
                          const isBirthdate = displayLabel?.toLowerCase().includes("birthdate") || displayLabel?.toLowerCase().includes("birthday") || field.type === "date";
                          
                          return (
                            <div key={key} className="space-y-1.5">
                              <label className="text-[9px] text-gray-400 font-bold pl-0.5">{displayLabel}</label>
                              {isPhone ? (
                                <PhoneInput
                                  international
                                  defaultCountry="PH"
                                  value={editForm.attributes[key] || ""}
                                  onChange={val => setEditForm(prev => ({
                                    ...prev,
                                    attributes: { ...prev.attributes, [key]: val }
                                  }))}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] focus-within:ring-2 focus-within:ring-indigo-600/5 focus-within:border-indigo-600 transition-all"
                                />
                              ) : isGender ? (
                                <select
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                                  value={editForm.attributes[key] || ""}
                                  onChange={e => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                  <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                              ) : isCivilStatus ? (
                                <select
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                                  value={editForm.attributes[key] || ""}
                                  onChange={e => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Widowed">Widowed</option>
                                  <option value="Separated">Separated</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : isBirthdate ? (
                                <input
                                  type="date"
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none focus:border-indigo-600 transition-all cursor-pointer"
                                  value={editForm.attributes[key] || ""}
                                  onChange={e => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                                />
                              ) : (
                                <input
                                  type="text"
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all placeholder:text-slate-300"
                                  value={editForm.attributes[key] || ""}
                                  onChange={e => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                                  placeholder={`Enter ${displayLabel}`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Handle attributes NOT in any section */}
              {(() => {
                const sectionFieldLabels = new Set();
                formSections?.forEach(s => s.fields?.forEach(f => sectionFieldLabels.add(f.label)));
                const extraKeys = Object.keys(editForm.attributes || {}).filter(k => 
                  !["is_profile_complete", "completed_at", "signature", "id_picture", "signed_up_at", "selfie_verification", "kyc_document", "selfie_document", "has_applied_for_id", "kyc_pipeline_passed", "physical_id_requested"].includes(k) && !sectionFieldLabels.has(k)
                );
                
                if (extraKeys.length === 0) return null;
                
                return (
                  <div className="p-5 rounded-xl border border-slate-100">
                    <h3 className="text-[10px] font-bold text-[#1a234b] mb-5 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                       Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {extraKeys.map(key => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-[9px] text-gray-400 font-bold pl-0.5">{formatKeyName(key)}</label>
                          <input
                            type="text"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
                            value={editForm.attributes[key] || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: e.target.value } }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-10 flex gap-4 pt-8 border-t border-slate-50">
              <button 
                onClick={() => setIsEditing(false)} 
                disabled={isSavingProfile} 
                className="flex-1 py-3 rounded-xl border border-slate-100 font-bold text-[11px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSavingProfile} 
                className="flex-1 py-3 rounded-xl bg-[#1a234b] font-bold text-[11px] text-white shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSavingProfile ? "Updating Record..." : "Confirm Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-6xl mx-auto pb-12">

      {/* ── PROFILE HEADER ── */}
      <div className="bg-white rounded-2xl p-5 mb-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="relative">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full ring-2 ring-offset-2 ring-gray-100 overflow-hidden shadow-lg transition-transform duration-500 hover:scale-105 cursor-pointer relative group/avatar-container"
            >
              <img src={resolveImageUrl(profileAvatar)} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar-container:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-600 transition-all border-2 border-white active:scale-90 z-20"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="text-center md:text-left pt-1">
            <h1 className="text-xl font-black text-[#1a234b] mb-0.5">
              {displayName}
            </h1>
            <p className="text-gray-400 text-[10px] font-medium">{displayEmail}</p>
          </div>
        </div>
      </div>



      {/* ── UNIFIED SUMMARY DETAILS ── */}
      <div className="relative z-10 bg-white rounded-2xl p-5 md:p-8 mb-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100/50">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1a234b]">Profile Summary</h2>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">Official Identity Record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="relative z-20 px-5 py-2 bg-[#1a234b] text-white rounded-lg text-[10px] font-bold shadow-md hover:bg-blue-900 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PenLine className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {(() => {
          const formatDate = (dateStr) => {
            if (!dateStr || dateStr === "—") return dateStr;
            try {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) return dateStr;
              return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              });
            } catch (e) { return dateStr; }
          };

          const renderFieldRow = (label, value, fieldType = "text") => {
            const isMedia = (fieldType === "image" || fieldType === "file") || (typeof value === "string" && (value.startsWith("data:image/") || value.startsWith("http")));
            const isDate = fieldType === "date" || (typeof label === "string" && label.toLowerCase().includes("date"));
            const displayValue = value === null || value === undefined || String(value).trim() === "" ? "N/A" : value;

            return (
              <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1 border-b border-slate-50 last:border-0 px-2 rounded-lg transition-all">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 w-32 md:w-36 lg:w-40">
                  {label}:
                </span>
                <div className="flex-1">
                  {isMedia && displayValue !== "N/A" ? (
                    <div className="mt-1 relative group/img inline-block overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                      <img src={resolveImageUrl(displayValue)} alt={label} className="h-32 w-auto object-contain transition-transform duration-500 hover:scale-105" />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-[#1a234b]">
                      {displayValue === "N/A" ? (
                        <span className="text-slate-300 font-medium">N/A</span>
                      ) : (
                        isDate ? formatDate(displayValue) : displayValue
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          };

          // 1. Render Identity Information Section
          const systemInfo = [
            { label: "Account Name", value: displayName },
            { label: "ID Number", value: displayId },
            { label: "Verified Role", value: displayRole },
            { label: "Registered Email", value: displayEmail, type: "email" }
          ];

          return (
            <div className="space-y-6">
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <h3 className="text-[11px] font-black text-[#1a234b] tracking-wide uppercase">Identity Information</h3>
                  <div className="h-[1px] flex-1 bg-indigo-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 mt-2">
                  {systemInfo.map(info => renderFieldRow(info.label, info.value, info.type))}
                </div>
              </section>

              {formSections.map((section) => {
                return (
                  <section key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <h3 className="text-[11px] font-black text-[#1a234b] tracking-wide uppercase">{section.sectionTitle}</h3>
                      <div className="h-[1px] flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 mt-2">
                      {section.fields.map(f => renderFieldRow(f.label, resolveAttributeValue(editForm.attributes, f.label), f.type))}
                    </div>
                  </section>
                );
              })}

              {/* Handle attributes NOT in any section */}
              {(() => {
                const sectionLabels = new Set();
                const normalizedSectionKeys = new Set();
                formSections.forEach(s => s.fields.forEach(f => {
                  sectionLabels.add(f.label);
                  normalizedSectionKeys.add(getNormalizedKey(f.label));
                }));
                const excludedKeys = ["is_profile_complete", "completed_at", "signature", "id_picture", "signed_up_at", "selfie_verification", "kyc_document", "selfie_document", "has_applied_for_id", "kyc_pipeline_passed", "physical_id_requested"];
                const extraKeys = Object.keys(editForm.attributes || {}).filter(k => 
                  !excludedKeys.includes(k) && !sectionLabels.has(k) && !normalizedSectionKeys.has(k)
                );
                if (extraKeys.length === 0) return null;

                return (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <h3 className="text-[11px] font-black text-[#1a234b] tracking-wide uppercase">Additional Details</h3>
                      <div className="h-[1px] flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 mt-2">
                      {extraKeys.map(key => renderFieldRow(key, editForm.attributes[key]))}
                    </div>
                  </section>
                );
              })()}
            </div>
          );
        })()}
      </div>


      {/* ── ACCOUNT SECURITY CTA ── */}
      <div className="mt-5 bg-[#1f2a56] p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 0110.382 7.04c.058.12.088.25.088.38v.63" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-black mb-0.5 tracking-tight">Account Security</h2>
            <p className="text-blue-300 text-[10px] font-medium">Your account is secured with advanced authentication.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-[10px] font-black px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 border border-blue-500/50">
            Manage Security
          </button>
        </div>
      </div>
    </div>

  );
}

export default ProfileDetails;
