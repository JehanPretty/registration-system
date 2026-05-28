from fastapi import APIRouter, Query, HTTPException
import httpx
import json
import os
from typing import List, Dict, Optional

router = APIRouter(prefix="/api/locations", tags=["locations"])

# Cache for location data
CACHE = {
    "countries": [],
    "states": {},
    "cities": {}
}

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
PH_LOCATIONS_FILE = os.path.join(BACKEND_DIR, "philippine_locations.json")
COUNTRIES_FILE = os.path.join(BACKEND_DIR, "countries.json")
PH_DATA = {}
LOCAL_COUNTRIES: List[str] = []


def _load_json_list(path: str) -> list:
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error loading {path}: {e}")
        return []


if os.path.exists(PH_LOCATIONS_FILE):
    try:
        with open(PH_LOCATIONS_FILE, "r", encoding="utf-8") as f:
            PH_DATA = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error loading {PH_LOCATIONS_FILE}: {e}")
        PH_DATA = {}
else:
    print(f"Warning: Philippine locations file not found at {PH_LOCATIONS_FILE}")

LOCAL_COUNTRIES = sorted(_load_json_list(COUNTRIES_FILE), key=str.lower)
if LOCAL_COUNTRIES and "Philippines" in LOCAL_COUNTRIES:
    LOCAL_COUNTRIES = ["Philippines"] + [c for c in LOCAL_COUNTRIES if c != "Philippines"]
elif not LOCAL_COUNTRIES:
    LOCAL_COUNTRIES = ["Philippines", "United States", "United Kingdom", "Canada", "Australia"]
    print(f"Warning: countries list not found at {COUNTRIES_FILE}, using minimal fallback")

def normalize_name(name: str) -> str:
    if not name:
        return ""
    # Handle common encoding issues and naming variants
    name = name.lower()
    name = name.replace("Ã±", "n").replace("ñ", "n")
    name = name.replace(" city", "").replace("province of ", "").replace("municipality of ", "")
    return name.strip()

@router.get("/countries")
async def get_countries():
    if CACHE["countries"]:
        return CACHE["countries"]

    # Prefer bundled list (works offline / when external APIs fail SSL)
    if LOCAL_COUNTRIES:
        CACHE["countries"] = LOCAL_COUNTRIES
        return LOCAL_COUNTRIES

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get("https://restcountries.com/v3.1/all?fields=name")
            resp.raise_for_status()
            data = resp.json()
            countries = sorted([c["name"]["common"] for c in data])
            if "Philippines" in countries:
                countries = ["Philippines"] + [c for c in countries if c != "Philippines"]
            CACHE["countries"] = countries
            return countries
    except Exception as e:
        print(f"Could not fetch countries from API: {e}")
        return LOCAL_COUNTRIES or ["Philippines"]

@router.get("/states")
async def get_states(country: str = Query(...)):
    if country == "Philippines":
        # Flatten all provinces from all regions
        provinces = []
        for region in PH_DATA:
            provinces.extend(list(PH_DATA[region].keys()))
        return sorted(list(set(provinces)))
    
    if country in CACHE["states"]:
        return CACHE["states"][country]
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://countriesnow.space/api/v0.1/countries/states",
                json={"country": country}
            )
            data = resp.json()
            if data.get("error"):
                return []
            states = [s["name"] for s in data["data"]["states"]]
            CACHE["states"][country] = states
            return states
    except Exception:
        return []

@router.get("/cities")
async def get_cities(country: str = Query(...), state: str = Query(None)):
    if country == "Philippines":
        # For PH, "state" is now Province.
        if not state:
            # Return all cities if no province
            all_cities = []
            for region in PH_DATA:
                for province in PH_DATA[region]:
                    all_cities.extend(list(PH_DATA[region][province].keys()))
            return sorted(list(set(all_cities)))
        
        # Find the province in any region
        norm_state = normalize_name(state)
        for region in PH_DATA:
            for p_name in PH_DATA[region]:
                if normalize_name(p_name) == norm_state:
                    return sorted(list(PH_DATA[region][p_name].keys()))
        return []
    
    cache_key = f"{country}-{state}"
    if cache_key in CACHE["cities"]:
        return CACHE["cities"][cache_key]
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://countriesnow.space/api/v0.1/countries/state/cities",
                json={"country": country, "state": state}
            )
            data = resp.json()
            if data.get("error"):
                return []
            cities = data["data"]
            CACHE["cities"][cache_key] = cities
            return cities
    except Exception:
        return []

@router.get("/barangays")
async def get_barangays(region: str = Query(None), province: str = Query(None), city: str = Query(...)):
    # Search for the city across all regions and provinces
    barangays = []
    norm_city = normalize_name(city)
    norm_province = normalize_name(province) if province else None
    norm_region = normalize_name(region) if region else None
    
    for r_name, r_data in PH_DATA.items():
        if norm_region and normalize_name(r_name) != norm_region:
            continue
        for p_name, p_data in r_data.items():
            if norm_province and normalize_name(p_name) != norm_province:
                continue
            # Look for city with normalization
            for c_name in p_data:
                if normalize_name(c_name) == norm_city:
                    barangays.extend(list(p_data[c_name].keys()))
                    return sorted(list(set(barangays))) # Return first match
                
    return []

@router.get("/zipcode")
async def get_zipcode(city: str = Query(...), barangay: str = Query(...)):
    norm_city = normalize_name(city)
    norm_barangay = normalize_name(barangay)
    for r_data in PH_DATA.values():
        for p_data in r_data.values():
            for c_name in p_data:
                if normalize_name(c_name) == norm_city:
                    for b_name in p_data[c_name]:
                        if normalize_name(b_name) == norm_barangay:
                            return {"zipcode": p_data[c_name][b_name]}
    return {"zipcode": ""}
