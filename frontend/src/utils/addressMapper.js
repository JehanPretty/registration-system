/**
 * addressMapper.js
 * Utility to map form labels (cased/spaced) to normalized attribute keys and vice-versa.
 */

const labelToKeyMap = {
  "country": "country",
  "province": "state",
  "state": "state",
  "region": "state",
  "city": "city",
  "municipality": "city",
  "city / municipality": "city",
  "city/municipality": "city",
  "barangay": "barangay",
  "zip code": "zipcode",
  "zipcode": "zipcode",
  "zip": "zipcode",
  "postal": "zipcode",
  "postal code": "zipcode",
  "street": "street",
  "street name": "street",
  "street address": "street",
  "house / unit / building number": "unit",
  "house/unit": "unit",
  "house/unit no": "unit",
  "house / unit": "unit",
  "unit": "unit",
  "house": "unit",
  "floor": "unit"
};

/**
 * Gets the normalized key for a given label.
 * @param {string} label 
 * @returns {string}
 */
export const getNormalizedKey = (label) => {
  if (!label) return "";
  const low = label.toLowerCase().trim();
  
  // Direct map check
  if (labelToKeyMap[low]) return labelToKeyMap[low];
  
  // Partial matches
  if (low.includes("country")) return "country";
  if (low.includes("province") || low.includes("state")) return "state";
  if (low.includes("city") || low.includes("municipality")) return "city";
  if (low.includes("barangay")) return "barangay";
  if (low.includes("zip") || low.includes("postal")) return "zipcode";
  if (low.includes("street")) return "street";
  if (low.includes("house") || low.includes("unit") || low.includes("building")) return "unit";
  
  return label; // Fallback to original label if no match
};

/**
 * Resolves a value from an attributes object using a label,
 * trying both the label itself and the normalized key.
 */
export const resolveAttributeValue = (attributes = {}, label) => {
  if (!label) return null;
  
  // 1. Try exact label match (as saved by some forms)
  if (attributes[label] !== undefined) return attributes[label];
  
  // 2. Try normalized key (e.g. "Country" -> "country")
  const normKey = getNormalizedKey(label);
  if (attributes[normKey] !== undefined) return attributes[normKey];
  
  // 3. Try lowercase label
  const lowLabel = label.toLowerCase().trim();
  if (attributes[lowLabel] !== undefined) return attributes[lowLabel];

  // 4. Common alternate labels from AddressForm / legacy saves
  const alternates = {
    country: ["Country"],
    state: ["Province", "Region", "State", "State / Province"],
    city: ["City / Municipality", "City", "Municipality", "City/Municipality"],
    barangay: ["Barangay"],
    zipcode: ["Zip Code", "ZipCode", "Zip code", "Postal Code"],
    street: ["Street Name", "Street Address", "Street"],
    unit: ["House / Unit / Building Number", "House/Unit", "House / Unit"],
  };
  const norm = getNormalizedKey(label);
  if (alternates[norm]) {
    for (const alt of alternates[norm]) {
      if (attributes[alt] !== undefined && attributes[alt] !== null && attributes[alt] !== "") {
        return attributes[alt];
      }
    }
  }
  
  return null;
};

/** Whether a form field label belongs to address information. */
export const isAddressFieldLabel = (label = "") => {
  const norm = getNormalizedKey(label);
  return ["country", "state", "city", "barangay", "zipcode", "street", "unit"].includes(norm);
};

export const isAddressSectionTitle = (title = "") =>
  (title || "").toLowerCase().includes("address");
