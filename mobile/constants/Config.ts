import Constants from 'expo-constants';

// Dynamically get the LAN IP address from the Expo packager
const debuggerHost = Constants.expoConfig?.hostUri;
const hostWithoutPort = debuggerHost?.split(':')[0] || '';
const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostWithoutPort);

// Cloudflare Tunnel URL: https://extends-functioning-conservative-parking.trycloudflare.com
export const API_BASE_URL = `https://regisys-backend.loca.lt`;

console.log(`[Config] API_BASE_URL set to: ${API_BASE_URL} (debuggerHost: ${debuggerHost})`);
