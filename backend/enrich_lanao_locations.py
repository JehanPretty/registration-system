import json
import os

PH_LOCATIONS_FILE = "backend/philippine_locations.json"

LANAO_DEL_SUR_DATA = {
    "Amai Manabilang": {"Poblacion": "9320"},
    "Bacolod-Kalawi": {"Poblacion": "9316"},
    "Balabagan": {"Poblacion": "9302"},
    "Balindong": {"Poblacion": "9318"},
    "Bayang": {"Poblacion": "9309"},
    "Binidayan": {"Poblacion": "9310"},
    "Buadiposo-Buntong": {"Poblacion": "9714"},
    "Bubong": {"Poblacion": "9708"},
    "Butig": {"Poblacion": "9305"},
    "Calanogas": {"Poblacion": "9319"},
    "Ditsaan-Ramain": {"Poblacion": "9713"},
    "Ganassi": {"Poblacion": "9311"},
    "Kapai": {"Poblacion": "9709"},
    "Kapatagan": {"Poblacion": "9322"},
    "Lumba-Bayabao": {"Poblacion": "9703"},
    "Lumbaca-Unayan": {"Poblacion": "9308"},
    "Lumbatan": {"Poblacion": "9307"},
    "Lumbayanague": {"Poblacion": "9306"},
    "Macadar Andong": {"Poblacion": "9308"},
    "Madalum": {"Poblacion": "9315"},
    "Madamba": {"Poblacion": "9314"},
    "Maguing": {"Poblacion": "9715"},
    "Malabang": {"Poblacion": "9300"},
    "Marantao": {"Poblacion": "9711"},
    "Marogong": {"Poblacion": "9303"},
    "Masiu": {"Poblacion": "9706"},
    "Mulondo": {"Poblacion": "9702"},
    "Pagayawan": {"Poblacion": "9312"},
    "Pantar": {"Poblacion": "9218"},
    "Piagapo": {"Poblacion": "9710"},
    "Picong": {"Poblacion": "9301"},
    "Poona Bayabao": {"Poblacion": "9705"},
    "Pualas": {"Poblacion": "9313"},
    "Saguiaran": {"Poblacion": "9701"},
    "Sultan Dumalondong": {"Poblacion": "9324"},
    "Tagoloan II": {"Poblacion": "9321"},
    "Tamparan": {"Poblacion": "9704"},
    "Taraka": {"Poblacion": "9712"},
    "Tubaran": {"Poblacion": "9304"},
    "Tugaya": {"Poblacion": "9317"},
    "Wao": {"Poblacion": "9716"},
    "Marawi City": {
        "Bacolod-Kalawi": "9700",
        "Banga": "9700",
        "Dansalan": "9700",
        "East Basak": "9700",
        "Lilod Saduc": "9700",
        "Raya Madaya I": "9700",
        "Poblacion": "9700"
    }
}

def enrich_locations():
    if not os.path.exists(PH_LOCATIONS_FILE):
        print(f"File {PH_LOCATIONS_FILE} not found.")
        return

    with open(PH_LOCATIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Find BARMM -> Lanao del Sur
    if "BARMM (Bangsamoro)" in data:
        print("Enriching Lanao del Sur in BARMM...")
        data["BARMM (Bangsamoro)"]["Lanao del Sur"] = LANAO_DEL_SUR_DATA
    else:
        # Check other regions just in case
        found = False
        for region in data:
            if "Lanao del Sur" in data[region]:
                print(f"Enriching Lanao del Sur in {region}...")
                data[region]["Lanao del Sur"] = LANAO_DEL_SUR_DATA
                found = True
                break
        if not found:
            print("Lanao del Sur not found in any region.")

    with open(PH_LOCATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Enrichment complete.")

if __name__ == "__main__":
    enrich_locations()
