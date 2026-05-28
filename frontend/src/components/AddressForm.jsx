import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import SearchableSelect from "./SearchableSelect";
import { MapPin, Home, LocateFixed } from "lucide-react";

const LABEL_MAP = {
  country: "Country",
  state: "Province",
  city: "City / Municipality",
  barangay: "Barangay",
  zipcode: "Zip Code",
  street: "Street Name",
  unit: "House / Unit / Building Number"
};

/**
 * AddressForm
 * 3-column grid layout:
 *   Row 1: Country | Province | City/Municipality
 *   Row 2: Barangay | Street Name | House/Unit No.
 *   Row 3: Zip Code (auto-populated, read-only)
 */
const AddressForm = ({ values = {}, onChange, errors = {}, visibleFields }) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    barangays: false
  });

  // Support both label keys ("Country") and internal keys (country) from callers
  const getValue = (key) => {
    const label = LABEL_MAP[key];
    const candidates = [values[label], values[key]];
    if (key === "state") {
      candidates.push(
        values["Region"],
        values["State"],
        values["State / Province"]
      );
    }
    if (key === "city") {
      candidates.push(values["City"], values["Municipality"], values["City/Municipality"]);
    }
    if (key === "zipcode") {
      candidates.push(values["ZipCode"], values["Zip code"]);
    }
    const found = candidates.find(v => v !== undefined && v !== null && v !== "");
    return found ?? "";
  };

  const countryVal = getValue("country");
  const stateVal = getValue("state");
  const cityVal = getValue("city");
  const barangayVal = getValue("barangay");
  const isPH = countryVal === "Philippines";

  const isFieldVisible = (fieldKey) => {
    if (!visibleFields) return true;
    const labelKeywords = {
      country: ["country"],
      state: ["region", "province", "state"],
      city: ["city", "city / municipality", "city/municipality", "municipality"],
      barangay: ["barangay"],
      zipcode: ["zipcode", "zip code", "zip", "postal"],
      street: ["street", "street name", "street address"],
      unit: ["house", "unit", "house / unit", "house/unit", "house/unit no", "house / unit / building number", "floor"],
    };
    const keywords = labelKeywords[fieldKey] || [];
    return visibleFields.some(f => {
      const low = (f.label || "").toLowerCase();
      return keywords.some(k => low.includes(k));
    });
  };

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(prev => ({ ...prev, countries: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/countries`);
        if (res.ok) setCountries(await res.json());
      } catch (e) { console.error("Fetch countries error:", e); }
      finally { setLoading(prev => ({ ...prev, countries: false })); }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!countryVal) { setStates([]); return; }
    const fetchStates = async () => {
      setLoading(prev => ({ ...prev, states: true }));
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/locations/states?country=${encodeURIComponent(countryVal)}`
        );
        if (res.ok) setStates(await res.json());
      } catch (e) { console.error("Fetch states error:", e); }
      finally { setLoading(prev => ({ ...prev, states: false })); }
    };
    fetchStates();
  }, [countryVal]);

  useEffect(() => {
    if (!countryVal) { setCities([]); return; }
    if (!isPH && !stateVal) { setCities([]); return; }
    const fetchCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        const params = new URLSearchParams({ country: countryVal });
        if (stateVal) params.set("state", stateVal);
        const res = await fetch(`${API_BASE_URL}/api/locations/cities?${params}`);
        if (res.ok) setCities(await res.json());
      } catch (e) { console.error("Fetch cities error:", e); }
      finally { setLoading(prev => ({ ...prev, cities: false })); }
    };
    fetchCities();
  }, [stateVal, countryVal, isPH]);

  useEffect(() => {
    if (!isPH || !cityVal) { setBarangays([]); return; }
    const fetchBarangays = async () => {
      setLoading(prev => ({ ...prev, barangays: true }));
      try {
        const params = new URLSearchParams({ city: cityVal });
        if (stateVal) params.set("province", stateVal);
        const res = await fetch(`${API_BASE_URL}/api/locations/barangays?${params}`);
        if (res.ok) setBarangays(await res.json());
      } catch (e) { console.error("Fetch barangays error:", e); }
      finally { setLoading(prev => ({ ...prev, barangays: false })); }
    };
    fetchBarangays();
  }, [cityVal, stateVal, isPH]);

  const handleCountryChange = (val) => {
    onChange(LABEL_MAP.country, val);
    onChange(LABEL_MAP.state, "");
    onChange(LABEL_MAP.city, "");
    onChange(LABEL_MAP.barangay, "");
    onChange(LABEL_MAP.zipcode, "");
  };

  const handleStateChange = (val) => {
    onChange(LABEL_MAP.state, val);
    onChange(LABEL_MAP.city, "");
    onChange(LABEL_MAP.barangay, "");
    onChange(LABEL_MAP.zipcode, "");
  };

  const handleCityChange = async (val) => {
    onChange(LABEL_MAP.city, val);
    onChange(LABEL_MAP.barangay, "");
    onChange(LABEL_MAP.zipcode, "");
    if (isPH && val) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/locations/zipcode?city=${encodeURIComponent(val)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.zipcode) onChange(LABEL_MAP.zipcode, data.zipcode);
        }
      } catch (e) { console.error("Fetch zipcode error:", e); }
    }
  };

  const handleBarangayChange = async (val) => {
    onChange(LABEL_MAP.barangay, val);
    if (isPH) {
      try {
        const params = new URLSearchParams({
          city: cityVal,
          barangay: val
        });
        const res = await fetch(`${API_BASE_URL}/api/locations/zipcode?${params}`);
        if (res.ok) {
          const data = await res.json();
          onChange(LABEL_MAP.zipcode, data.zipcode);
        }
      } catch (e) { console.error("Fetch zipcode error:", e); }
    }
  };

  const baseInputClasses = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none transition-all focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 placeholder:text-slate-400";

  return (
    <div className="space-y-4">

      {/* Row 1: Country | Province | City/Municipality */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isFieldVisible("country") && (
          <SearchableSelect
            label="Country"
            placeholder="Select Country"
            options={countries}
            value={countryVal}
            onChange={handleCountryChange}
            loading={loading.countries}
            error={errors[LABEL_MAP.country]}
          />
        )}

        {isFieldVisible("state") && (
          <SearchableSelect
            label="Province"
            placeholder={countryVal ? "Select Province" : "Select country first"}
            options={states}
            value={stateVal}
            onChange={handleStateChange}
            loading={loading.states}
            disabled={!countryVal}
            error={errors[LABEL_MAP.state]}
          />
        )}

        {isFieldVisible("city") && (
          <SearchableSelect
            label="City / Municipality"
            placeholder={
              stateVal || isPH ? "Select City/Municipality" : "Select province first"
            }
            options={cities}
            value={cityVal}
            onChange={handleCityChange}
            loading={loading.cities}
            disabled={!stateVal && !isPH}
            error={errors[LABEL_MAP.city]}
          />
        )}
      </div>

      {/* Row 2: Barangay | House/Unit No. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(!countryVal || isPH) && isFieldVisible("barangay") && (
          <SearchableSelect
            label="Barangay"
            placeholder={cityVal ? "Select Barangay" : "Select city first"}
            options={barangays}
            value={barangayVal}
            onChange={handleBarangayChange}
            loading={loading.barangays}
            disabled={!cityVal}
            error={errors[LABEL_MAP.barangay]}
          />
        )}

        {isFieldVisible("unit") && (
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 ml-1">House / Unit / Building No.</label>
            <div className="relative group">
              <input
                type="text"
                className={`${baseInputClasses} pr-9`}
                placeholder="e.g. #123, 4th Floor"
                value={getValue("unit")}
                onChange={(e) => onChange(LABEL_MAP.unit, e.target.value)}
              />
              <Home className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Street Name (full width) */}
      {isFieldVisible("street") && (
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-slate-500 ml-1">Street Name</label>
          <div className="relative group">
            <input
              type="text"
              className={`${baseInputClasses} ${errors[LABEL_MAP.street] ? "border-red-500 bg-red-50/10" : ""} pr-9`}
              placeholder="Enter full street name"
              value={getValue("street")}
              onChange={(e) => onChange(LABEL_MAP.street, e.target.value)}
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            {errors[LABEL_MAP.street] && <p className="text-[9px] font-bold text-red-500 mt-1">{errors[LABEL_MAP.street]}</p>}
          </div>
        </div>
      )}

      {/* Row 4: Zip Code */}
      {isFieldVisible("zipcode") && (
        <div className="space-y-1 w-44">
          <label className="block text-[10px] font-black text-slate-500 ml-1">Zip Code</label>
          <div className="relative group">
            <input
              type="text"
              className={`${baseInputClasses} pr-9`}
              placeholder="Enter zip code"
              value={getValue("zipcode")}
              onChange={(e) => onChange(LABEL_MAP.zipcode, e.target.value)}
            />
            <LocateFixed className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
