import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/Config";

// Reusable Dropdown Modal - Search bar re-integrated as per user request
const SearchableSelectModal = ({ visible, title, options, onSelect, onClose, loading, search, setSearch }: any) => {
  const filtered = options.filter((o: string) => o.toLowerCase().includes((search || "").toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-[40px] p-8 max-h-[80%] h-[70%]">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-lg font-black text-[#1a234b]">{title}</Text>
              <Text className="text-[10px] font-bold text-slate-400  tracking-tight">Select from list below</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-50 rounded-full">
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Integrated Search Bar */}
          <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-row items-center mb-4">
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-2 text-sm text-[#1a234b] font-semibold"
              placeholder="Type to search..."
              placeholderTextColor="#cbd5e1"
              value={search}
              onChangeText={setSearch}
              autoFocus={options.length > 6}
            />
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#1a234b" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); onClose(); }}
                  className="py-4 border-b border-slate-50 flex-row justify-between items-center"
                >
                  <Text className="text-sm font-bold text-[#1a234b]">{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Ionicons name="search-outline" size={40} color="#cbd5e1" />
                  <Text className="text-center text-slate-400 mt-2 font-bold">No matches for "{search}"</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Combobox Trigger Field
const ComboboxField = ({ label, value, onSearch, placeholder, disabled, error, loading, onOpen }: any) => (
  <View className="mb-4">
    <Text className="text-[10px] font-bold text-slate-500 mb-1 ml-0.5  tracking-tight">
      {label} <Text className="text-red-500">*</Text>
    </Text>
    <View className={`bg-slate-50 border ${error ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-1 flex-row justify-between items-center opacity-${disabled ? '50' : '100'}`}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onSearch}
        onFocus={onOpen}
        editable={!disabled && !loading}
        className="flex-1 text-sm font-semibold text-[#1a234b] h-12"
      />
      <TouchableOpacity onPress={onOpen} disabled={disabled || loading}>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </TouchableOpacity>
    </View>
    {error && <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1">{error}</Text>}
  </View>
);

const InputField = ({ label, value, onChangeText, placeholder, error, required = true, icon, editable = true }: any) => (
  <View className="mb-4">
    <Text className="text-[10px] font-bold text-slate-500 mb-1 ml-0.5 tracking-tight">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <View className={`bg-slate-50 border ${error ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-4 flex-row items-center opacity-${editable ? '100' : '60'}`}>
      {icon && <Ionicons name={icon} size={18} color="#94a3b8" style={{ marginRight: 8 }} />}
      <TextInput
        className="flex-1 text-sm text-[#1a234b] font-semibold"
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
    </View>
    {error && <Text className="text-[10px] font-bold text-red-500 mt-1 ml-1">{error}</Text>}
  </View>
);

export default function AddressForm({ values = {}, onChange, errors = {} }: any) {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);

  const [loading, setLoading] = useState({ countries: false, states: false, cities: false, barangays: false });
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [search, setSearch] = useState("");

  // Map internal keys to dynamic label keys from the form schema
  const labelMap: any = {
    country: "Country",
    state: "Province",
    city: "City / Municipality",
    barangay: "Barangay",
    zipcode: "Zip Code",
    street: "Street Name",
    unit: "House / Unit / Building Number"
  };

  const getValue = (key: string) => values[labelMap[key]] || values[key] || "";
  const isPH = getValue("country") === "Philippines";

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(prev => ({ ...prev, countries: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/countries`, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) setCountries(await res.json());
      } catch (e) { }
      finally { setLoading(prev => ({ ...prev, countries: false })); }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const country = getValue("country");
    if (!country) { setStates([]); return; }
    const fetchStates = async () => {
      setLoading(prev => ({ ...prev, states: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/states?country=${country}`, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) setStates(await res.json());
      } catch (e) { }
      finally { setLoading(prev => ({ ...prev, states: false })); }
    };
    fetchStates();
  }, [getValue("country")]);

  useEffect(() => {
    const country = getValue("country");
    const state = getValue("state");
    if (!state && !isPH) { setCities([]); return; }
    const fetchCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        const url = isPH
          ? `${API_BASE_URL}/api/locations/cities?country=Philippines&state=${state || ""}`
          : `${API_BASE_URL}/api/locations/cities?country=${country}&state=${state}`;
        const res = await fetch(url, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) setCities(await res.json());
      } catch (e) { }
      finally { setLoading(prev => ({ ...prev, cities: false })); }
    };
    fetchCities();
  }, [getValue("state"), getValue("country"), isPH]);

  useEffect(() => {
    const city = getValue("city");
    if (!isPH || !city) { setBarangays([]); return; }
    const fetchBarangays = async () => {
      setLoading(prev => ({ ...prev, barangays: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/barangays?city=${city}`, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) setBarangays(await res.json());
      } catch (e) { }
      finally { setLoading(prev => ({ ...prev, barangays: false })); }
    };
    fetchBarangays();
  }, [getValue("city"), isPH]);

  const handleCountryChange = (val: string) => {
    onChange(labelMap.country, val);
    setSearch("");
    onChange(labelMap.state, ""); onChange(labelMap.city, ""); onChange(labelMap.barangay, ""); onChange(labelMap.zipcode, "");
  };

  const handleStateChange = (val: string) => {
    onChange(labelMap.state, val);
    setSearch("");
    onChange(labelMap.city, ""); onChange(labelMap.barangay, ""); onChange(labelMap.zipcode, "");
  };

  const handleCityChange = async (val: string) => {
    onChange(labelMap.city, val);
    setSearch("");
    onChange(labelMap.barangay, "");
    onChange(labelMap.zipcode, "");
    if (isPH && val) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/zipcode?city=${val}`, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) {
          const data = await res.json();
          if (data.zipcode) onChange(labelMap.zipcode, data.zipcode);
        }
      } catch (e) { }
    }
  };

  const handleBarangayChange = async (val: string) => {
    onChange(labelMap.barangay, val);
    setSearch("");
    if (isPH) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/zipcode?city=${getValue("city")}&barangay=${val}`, { headers: { "Bypass-Tunnel-Reminder": "true" } });
        if (res.ok) {
          const data = await res.json();
          onChange(labelMap.zipcode, data.zipcode);
        }
      } catch (e) { }
    }
  };

  const openModal = (title: string, options: string[], onSelect: (val: string) => void) => {
    setModalConfig({ visible: true, title, options, onSelect });
  };

  const handleSearchChange = (val: string, type: string) => {
    setSearch(val);
    if (!modalConfig || modalConfig.title.toLowerCase().indexOf(type) === -1) {
      if (type === "country") openModal("Select Country", countries, handleCountryChange);
      else if (type === "state") openModal(isPH ? "Select Region" : "Select State", states, handleStateChange);
      else if (type === "city") openModal("Select City", cities, handleCityChange);
      else if (type === "barangay") openModal("Select Barangay", barangays, handleBarangayChange);
    }
  };

  return (
    <View>
      <ComboboxField
        label={labelMap.country}
        value={search && modalConfig?.title.includes("Country") ? search : getValue("country")}
        onSearch={(val: string) => handleSearchChange(val, "country")}
        onOpen={() => { setSearch(""); openModal("Select Country", countries, handleCountryChange); }}
        placeholder="Search Country..."
        loading={loading.countries}
        error={errors[labelMap.country]}
      />

      <ComboboxField
        label={isPH ? "Region" : "State / Province"}
        value={search && modalConfig?.title.includes("Region") ? search : getValue("state")}
        onSearch={(val: string) => handleSearchChange(val, "state")}
        onOpen={() => { setSearch(""); openModal(isPH ? "Select Region" : "Select State", states, handleStateChange); }}
        disabled={!getValue("country")}
        placeholder={isPH ? "Search Region..." : "Search State..."}
        loading={loading.states}
        error={errors[labelMap.state]}
      />

      <ComboboxField
        label={labelMap.city}
        value={search && modalConfig?.title.includes("City") ? search : getValue("city")}
        onSearch={(val: string) => handleSearchChange(val, "city")}
        onOpen={() => { setSearch(""); openModal("Select City", cities, handleCityChange); }}
        disabled={!getValue("state") && !isPH}
        placeholder="Search City..."
        loading={loading.cities}
        error={errors[labelMap.city]}
      />

      {isPH && (
        <ComboboxField
          label={labelMap.barangay}
          value={search && modalConfig?.title.includes("Barangay") ? search : getValue("barangay")}
          onSearch={(val: string) => handleSearchChange(val, "barangay")}
          onOpen={() => { setSearch(""); openModal("Select Barangay", barangays, handleBarangayChange); }}
          disabled={!getValue("city")}
          placeholder="Search Barangay..."
          loading={loading.barangays}
          error={errors[labelMap.barangay]}
        />
      )}

      <InputField
        label={labelMap.zipcode}
        placeholder="Enter Zip Code"
        value={getValue("zipcode")}
        onChangeText={(val: string) => onChange(labelMap.zipcode, val)}
        error={errors[labelMap.zipcode]}
        icon="location-outline"
        keyboardType="numeric"
      />

      <InputField
        label={labelMap.street}
        placeholder="House No., Street Name, Phase/Subd."
        value={getValue("street")}
        onChangeText={(val: string) => onChange(labelMap.street, val)}
        error={errors[labelMap.street]}
        icon="map-outline"
      />

      <InputField
        label={labelMap.unit}
        placeholder="e.g. 4th Floor"
        value={getValue("unit")}
        onChangeText={(val: string) => onChange(labelMap.unit, val)}
        required={false}
        icon="home-outline"
      />

      {modalConfig && (
        <SearchableSelectModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          options={modalConfig.options}
          onSelect={modalConfig.onSelect}
          onClose={() => { setModalConfig(null); setSearch(""); }}
          search={search}
          setSearch={setSearch}
        />
      )}
    </View>
  );
}
