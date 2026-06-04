import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Loader2 } from "lucide-react";

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option", 
  label = "", 
  disabled = false,
  loading = false,
  error = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter(opt => {
    const stringOpt = String(opt || "");
    return stringOpt.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-black text-slate-500 mb-1.5 ml-1 tracking-widest">
          {label}
        </label>
      )}
      
      <div 
        className={`relative w-full bg-slate-50 border rounded-lg text-sm font-semibold transition-all flex items-center justify-between
          ${disabled || loading ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'hover:border-blue-600 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/5'}
          ${isOpen ? 'border-blue-600 bg-white shadow-md' : 'border-slate-200'}
          ${error ? 'border-red-500 ring-red-500/10' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled || loading}
          className={`w-full p-2.5 bg-transparent border-none outline-none text-sm font-semibold truncate ${value ? 'text-[#1a234b]' : 'text-slate-400'}`}
          placeholder={placeholder}
          value={isOpen ? search : (value || "")}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch("");
          }}
          autoComplete="off"
        />
        <div className="pr-2 flex items-center gap-2">
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
            onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  className={`px-4 py-2.5 text-xs font-bold font-sans flex items-center justify-between cursor-pointer transition-colors
                    ${String(value) === String(option) ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-[#1a234b]'}`}
                >
                  <span className="truncate">{option}</span>
                  {String(value) === String(option) && <Check className="w-3.5 h-3.5" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs font-bold text-slate-400 italic">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && <p className="mt-1 ml-1 text-[10px] font-bold text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
