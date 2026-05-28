import React, { useState } from "react";
import { Trash2 } from "lucide-react";

function AdminForm() {
  const [fields, setFields] = useState([
    { id: Date.now(), label: "First Name", type: "text", required: true }
  ]);

  // Function to add a new blank field
  const addField = () => {
    const newField = {
      id: Date.now(),
      label: "New Field",
      type: "text",
      required: false
    };
    setFields([...fields, newField]);
  };

  // Function to update field properties
  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // Function to remove a field
  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="p-6 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-black text-[#1a234b]">Form Configuration</h2>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold tracking-wider">Customize Registration Inputs</p>
        </div>
        <button
          onClick={addField}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span> Add New Field
        </button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col md:flex-row md:items-end gap-3 p-4 bg-[#f8faff] rounded-[1.25rem] border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] font-black text-slate-400 tracking-widest uppercase pl-1 block">Field Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, "label", e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-[#1a234b] focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
              />
            </div>

            <div className="flex flex-row md:w-auto gap-3 items-end">
              <div className="flex-1 md:w-32 space-y-1">
                <label className="text-[8px] font-black text-slate-400 tracking-widest uppercase pl-1 block">Input Type</label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, "type", e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-[#1a234b] outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all cursor-pointer bg-white"
                >
                  <option value="text">Short Text</option>
                  <option value="email">Email Address</option>
                  <option value="date">Date Picker</option>
                  <option value="select">Dropdown Menu</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mb-1 px-3 h-8 bg-white/80 rounded-lg border border-slate-100/50">
                <input
                  type="checkbox"
                  id={`req-${field.id}`}
                  checked={field.required}
                  onChange={(e) => updateField(field.id, "required", e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                />
                <label htmlFor={`req-${field.id}`} className="text-[8px] font-black text-slate-500 tracking-widest pt-0.5 cursor-pointer">REQ</label>
              </div>
            </div>

            <button
              onClick={() => removeField(field.id)}
              className="md:mb-1 p-2 text-slate-300 hover:text-white hover:bg-red-500 bg-transparent rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center self-end"
              title="Delete Field"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
        <button className="px-6 py-2.5 bg-[#1a234b] text-white rounded-xl text-[10px] tracking-widest uppercase font-black shadow-lg shadow-[#1a234b]/20 hover:bg-[#25326b] hover:-translate-y-0.5 active:translate-y-0 transition-all">
          Publish Changes
        </button>
      </div>
    </div>
  );
}