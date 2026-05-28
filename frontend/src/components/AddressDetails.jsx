import React from "react";
import { resolveAttributeValue } from "../utils/addressMapper";

/**
 * AddressDetails
 * Consistent UI version - matches renderFieldRow style in Users.jsx.
 */
const AddressDetails = ({ attributes = {}, visibleFields = [] }) => {
  const getValue = (label) => resolveAttributeValue(attributes, label) || "N/A";

  const renderRow = (label) => {
    const value = getValue(label);
    const isEmpty = value === "N/A";

    return (
      <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-1.5 border-b border-slate-50 last:border-0 px-3 rounded-xl transition-all">
        <span className="text-[11px] font-black text-slate-400 shrink-0">{label}:</span>
        <div className="flex-1">
          <span className="text-sm font-bold text-[#1a234b]">
            {isEmpty ? <span className="text-slate-300 font-medium">N/A</span> : value}
          </span>
        </div>
      </div>
    );
  };

  const labels = [
    "Country",
    "Province",
    "City / Municipality",
    "Barangay",
    "Zip Code",
    "Street Name",
    "House / Unit / Building Number"
  ];

  return (
    <div className="space-y-0.5 animate-in fade-in duration-500">
      {labels.map(label => renderRow(label))}
    </div>
  );
};

export default AddressDetails;
