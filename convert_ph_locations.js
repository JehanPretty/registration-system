import fs from 'fs';
import { PHILIPPINE_LOCATIONS } from './frontend/src/data/philippineLocations.js';

fs.writeFileSync('./backend/philippine_locations.json', JSON.stringify(PHILIPPINE_LOCATIONS, null, 2));
console.log('Successfully converted PH locations to JSON.');
