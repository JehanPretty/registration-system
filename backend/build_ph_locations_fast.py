import urllib.request, json, os

url = 'https://raw.githubusercontent.com/flores-jacob/philippine-regions-provinces-cities-municipalities-barangays/master/philippine_provinces_cities_municipalities_and_barangays_2019v2.json'
OUT = os.path.join(os.path.dirname(__file__), 'philippine_locations.json')

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla'})
print("Downloading data...")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

print("Transforming data...")
result = {}
for reg_code, reg_info in data.items():
    reg_name = reg_info.get("region_name", reg_code)
    result[reg_name] = {}
    
    for prov_name, prov_info in reg_info.get("province_list", {}).items():
        result[reg_name][prov_name] = {}
        
        for muni_name, muni_info in prov_info.get("municipality_list", {}).items():
            result[reg_name][prov_name][muni_name] = {}
            
            for brgy in muni_info.get("barangay_list", []):
                result[reg_name][prov_name][muni_name][brgy] = ""

print("Saving data to", OUT)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print("Done!")
