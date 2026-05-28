/** Shared field/section layout helpers used by FormDesigner and CompleteRegistration. */

export const isAddressSection = (title = "") =>
  (title || "").toLowerCase().includes("address");

export const getFieldSpan = (label, type) => {
  const lowLabel = (label || "").toLowerCase();
  const fullWideKeywords = ["address", "description", "notes", "remarks", "objective"];
  if (["file", "image"].includes(type)) return "col-span-full";
  if (fullWideKeywords.some((k) => lowLabel.includes(k))) return "col-span-full";
  return "col-span-1";
};

export const getSectionGridClass = () =>
  "grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4";
