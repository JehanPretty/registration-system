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

PH_LOCATIONS_FILE = "philippine_locations.json"
PH_DATA = {}

if os.path.exists(PH_LOCATIONS_FILE):
    try:
        with open(PH_LOCATIONS_FILE, "r", encoding="utf-8") as f:
            PH_DATA = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error loading {PH_LOCATIONS_FILE}: {e}")
        PH_DATA = {}

@router.get("/countries")
async def get_countries():
    if CACHE["countries"]:
        return CACHE["countries"]
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://restcountries.com/v3.1/all?fields=name")
            data = resp.json()
            countries = sorted([c["name"]["common"] for c in data])
            CACHE["countries"] = countries
            return countries
    except Exception as e:
        # Fallback
        return ["Philippines", "United States", "United Kingdom", "Canada", "Australia"]

@router.get("/states")
async def get_states(country: str = Query(...)):
    if country == "Philippines":
        return sorted(list(PH_DATA.keys()))
    
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
        # For PH, "state" is Region. We need all provinces/cities within it.
        cities = []
        if state and state in PH_DATA:
            for province in PH_DATA[state]:
                cities.extend(list(PH_DATA[state][province].keys()))
        else:
            # Return all cities if no region
            for region in PH_DATA:
                for province in PH_DATA[region]:
                    cities.extend(list(PH_DATA[region][province].keys()))
        return sorted(list(set(cities)))
    
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
    # Currently only PH supports barangays in this system
    barangays = []
    found = False
    
    for r_name, r_data in PH_DATA.items():
        if region and r_name != region:
            continue
        for p_name, p_data in r_data.items():
            if province and p_name != province:
                continue
            if city in p_data:
                barangays.extend(list(p_data[city].keys()))
                found = True
                
    if not found:
        return []
        
    return sorted(list(set(barangays)))

@router.get("/zipcode")
async def get_zipcode(city: str = Query(...), barangay: str = Query(...)):
    for r_data in PH_DATA.values():
        for p_data in r_data.values():
            if city in p_data and barangay in p_data[city]:
                return {"zipcode": p_data[city][barangay]}
    return {"zipcode": ""}
