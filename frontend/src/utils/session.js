/**
 * Clears all system-related localStorage keys to ensure a fresh session.
 * Specifically targets keys starting with "regisSys_" and "digital_id_".
 */
export const clearSession = () => {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("regisSys_") || key.startsWith("digital_id_"))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log("Session storage cleared.");
    } catch (err) {
        console.error("Failed to clear localStorage:", err);
    }
};
