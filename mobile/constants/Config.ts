import Constants from 'expo-constants';

// Dynamically get the LAN IP address from the Expo packager
const debuggerHost = Constants.expoConfig?.hostUri;
const hostWithoutPort = debuggerHost?.split(':')[0] || '';
const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostWithoutPort);

// Tailscale or Local IP of your host machine
const HOST_IP = '100.118.98.124'; 

// Use the HOST_IP for the backend
export const API_BASE_URL = `http://${HOST_IP}:8000`;

console.log(`[Config] API_BASE_URL set to: ${API_BASE_URL} (debuggerHost: ${debuggerHost})`);
