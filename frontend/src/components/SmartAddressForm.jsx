import React, { useState, useEffect } from "react";
import { PHILIPPINE_LOCATIONS } from "../data/philippineLocations";

const SmartAddressForm = ({ values, onChange }) => {
  const [countries] = useState([
    "Philippines", "United States", "Canada", "United Kingdom", "Australia", 
    "Japan", "Singapore", "Others"
  ]);

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  useEffect(() => {
    if (values.country === "Philippines") {
      setRegions(Object.keys(PHILIPPINE_LOCATIONS));
    } else {
      setRegions([]);
      setProvinces([]);
      setCities([]);
      setBarangays([]);
    }
  }, [values.country]);

  useEffect(() => {
    if (values.region && PHILIPPINE_LOCATIONS[values.region]) {
      setProvinces(Object.keys(PHILIPPINE_LOCATIONS[values.region]));
    } else {
      setProvinces([]);
    }
  }, [values.region]);

  useEffect(() => {
    if (values.region && values.province && PHILIPPINE_LOCATIONS[values.region]?.[values.province]) {
      setCities(Object.keys(PHILIPPINE_LOCATIONS[values.region][values.province]));
    } else {
      setCities([]);
    }
  }, [values.province, values.region]);

  useEffect(() => {
    if (values.region && values.province && values.city && PHILIPPINE_LOCATIONS[values.region]?.[values.province]?.[values.city]) {
      setBarangays(Object.keys(PHILIPPINE_LOCATIONS[values.region][values.province][values.city]));
    } else {
      setBarangays([]);
    }
  }, [values.city, values.province, values.region]);

  const handleLocationChange = (field, value) => {
    const updates = { [field]: value };
    
    // Reset cascading fields
    if (field === "country") {
      updates.region = "";
      updates.province = "";
      updates.city = "";
      updates.barangay = "";
      updates.zipCode = "";
    } else if (field === "region") {
      updates.province = "";
      updates.city = "";
      updates.barangay = "";
      updates.zipCode = "";
    } else if (field === "province") {
      updates.city = "";
      updates.barangay = "";
      updates.zipCode = "";
    } else if (field === "city") {
      updates.barangay = "";
      updates.zipCode = "";
    } else if (field === "barangay") {
      const zip = PHILIPPINE_LOCATIONS[values.region]?.[values.province]?.[values.city]?.[value];
      if (zip) {
        updates.zipCode = zip;
      }
    }

    onChange(updates);
  };

  const renderDropdown = (label, field, options, placeholder, disabled = false) => (
    <div className="space-y-1.5 flex flex-col">
      <label className="text-[10px] font-black tracking-widest text-[#94a3b8] ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          value={values[field] || ""}
          onChange={(e) => handleLocationChange(field, e.target.value)}
          disabled={disabled || (field !== "country" && values.country !== "Philippines")}
          className={`w-full p-3 bg-[#f8faff] border border-[#f1f3f7] rounded-xl outline-none transition-all font-semibold text-sm text-[#1a234b] appearance-none cursor-pointer hover:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderInput = (label, field, placeholder, gridSpan = "col-span-1", type = "text") => (
    <div className={`space-y-1.5 flex flex-col ${gridSpan}`}>
      <label className="text-[10px] font-black tracking-widest text-[#94a3b8] ml-1">
        {label}
      </label>
      <input
        type={type}
        value={values[field] || ""}
        onChange={(e) => onChange({ [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full p-3 bg-[#f8faff] border border-[#f1f3f7] rounded-xl outline-none transition-all font-semibold text-sm text-[#1a234b] hover:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-in fade-in duration-500">
      {/* ROW 1: Country & Region */}
      <div className="md:col-span-2">
        {renderDropdown("Country", "country", countries, "Select Country")}
      </div>
      <div className="md:col-span-2">
        {renderDropdown("Region", "region", regions, values.country === "Philippines" ? "Select Region" : "Unavailable", !regions.length)}
      </div>

      {/* ROW 2: Province & City */}
      <div className="md:col-span-2">
        {renderDropdown("Province / State", "province", provinces, values.region ? "Select Province" : "Select Region First", !provinces.length)}
      </div>
      <div className="md:col-span-2">
        {renderDropdown("City / Municipality", "city", cities, values.province ? "Select City" : "Select Province First", !cities.length)}
      </div>

      {/* ROW 3: Barangay & ZIP */}
      <div className="md:col-span-3">
        {renderDropdown("Barangay", "barangay", barangays, values.city ? "Select Barangay" : "Select City First", !barangays.length)}
      </div>
      <div className="md:col-span-1">
        <div className="space-y-1.5 flex flex-col">
          <label className="text-[10px] font-black tracking-widest text-[#94a3b8] ml-1">
            ZIP Code
          </label>
          <input
            type="text"
            value={values.zipCode || ""}
            readOnly
            placeholder="Auto-filled"
            className="w-full p-3 bg-gray-100/50 border border-[#f1f3f7] rounded-xl font-bold text-sm text-blue-600 cursor-not-allowed shadow-inner"
          />
        </div>
      </div>

      {/* ROW 4: Specific Details */}
      {renderInput("House / Unit No.", "houseNo", "e.g. 123", "md:col-span-1")}
      {renderInput("Street Name", "streetName", "e.g. Rizal St.", "md:col-span-2")}
      {renderInput("Subdivision / Village", "subdivision", "Optional", "md:col-span-1")}

      {/* ROW 5: Block & Lot */}
      {renderInput("Block No.", "block", "e.g. Blk 1", "md:col-span-2")}
      {renderInput("Lot No.", "lot", "e.g. Lot 5", "md:col-span-2")}
    </div>
  );
};

export default SmartAddressForm;
