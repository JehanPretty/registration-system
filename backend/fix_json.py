import json
import re
import os

js_path = '../frontend/src/data/philippineLocations.js'
json_path = 'philippine_locations.json'

if os.path.exists(js_path):
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the object literal starting with { and ending with }
    # We look for the first { and the last }
    start = content.find('{')
    end = content.rfind('}')
    
    if start != -1 and end != -1:
        json_str = content[start:end+1]
        
        # Verify it's valid JSON by loading it
        try:
            # We need to be careful if the JS object is not strict JSON (e.g. no quotes on keys)
            # But the previous check showed it had quotes for values, let's check keys.
            data = json.loads(json_str) 
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print("Successfully fixed JSON.")
        except json.JSONDecodeError as e:
            print(f"Failed to decode JSON: {e}")
            # If it's not strict JSON, we might need a more sophisticated parser or just manual cleanup
            # Let's try to just write it out if it fails, but we want it to be valid JSON.
    else:
        print("Could not find { or } in the file.")
else:
    print(f"Source file {js_path} not found.")
