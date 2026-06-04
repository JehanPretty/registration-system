"""
Build a complete philippine_locations.json from the PSGC (Philippine Standard Geographic Code).
Uses the free public API at https://psgc.gitlab.io/api/
Structure: { region: { province: { city/municipality: { barangay: zipcode } } } }
"""
import json, time, os, urllib.request, urllib.error

BASE = "https://psgc.gitlab.io/api"
OUT  = os.path.join(os.path.dirname(__file__), "philippine_locations.json")

def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read())
        except Exception as e:
            print(f"  Retry {attempt+1}/{retries} for {url}: {e}")
            time.sleep(2)
    return []

print("Fetching regions...")
regions_raw = fetch(f"{BASE}/regions/")
print(f"  Got {len(regions_raw)} regions")

result = {}

for reg in regions_raw:
    reg_code = reg["code"]
    reg_name = reg.get("regionName") or reg.get("name", reg_code)
    print(f"\nRegion: {reg_name} ({reg_code})")

    result[reg_name] = {}

    # Fetch provinces in this region
    provinces_raw = fetch(f"{BASE}/regions/{reg_code}/provinces/")
    print(f"  {len(provinces_raw)} provinces")

    # Also fetch cities/municipalities directly under region (no province, e.g. NCR cities)
    cities_no_prov = fetch(f"{BASE}/regions/{reg_code}/cities-municipalities/")

    all_province_entries = []

    # Add a pseudo-province for cities directly under the region (NCR etc.)
    if cities_no_prov:
        all_province_entries.append(("__direct__", reg_name, cities_no_prov))

    for prov in provinces_raw:
        prov_code = prov["code"]
        prov_name = prov.get("name", prov_code)
        cities_raw = fetch(f"{BASE}/provinces/{prov_code}/cities-municipalities/")
        all_province_entries.append((prov_code, prov_name, cities_raw))
        time.sleep(0.05)

    for prov_code, prov_name, cities_raw in all_province_entries:
        if not cities_raw:
            continue
        result[reg_name][prov_name] = {}
        print(f"    Province: {prov_name} | {len(cities_raw)} cities/munis")

        for city in cities_raw:
            city_code = city["code"]
            city_name = city.get("name", city_code)
            result[reg_name][prov_name][city_name] = {}

            # Fetch barangays
            brgy_raw = fetch(f"{BASE}/cities-municipalities/{city_code}/barangays/")
            for brgy in brgy_raw:
                brgy_name = brgy.get("name", "")
                result[reg_name][prov_name][city_name][brgy_name] = ""  # zipcode unknown
            time.sleep(0.03)

# Count totals
total_p = sum(len(result[r]) for r in result)
total_c = sum(len(result[r][p]) for r in result for p in result[r])
total_b = sum(len(result[r][p][c]) for r in result for p in result[r] for c in result[r][p])
print(f"\nDone! Regions={len(result)}, Provinces={total_p}, Cities={total_c}, Barangays={total_b}")

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Saved to {OUT}")
