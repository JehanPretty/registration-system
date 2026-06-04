/**
 * Utility to format ID numbers with role-specific prefixes.
 * Replaces generic "USER-" prefixes with appropriate abbreviations.
 */

const ROLE_PREFIX_MAPPING = {
    "Student": "STUD",
    "Teacher": "TEAC",
    "Employee": "EMPL",
    "Administrator": "ADMN",
    "Super Admin": "SADM",
    "Registrar Staff": "REGS",
    "Staff": "STAF",
    "OJT Trainee": "OJTI",
    "Intern": "INTR"
};

export const getRolePrefix = (role) => {
    if (!role) return "USER";
    
    // Check direct mapping
    if (ROLE_PREFIX_MAPPING[role]) return ROLE_PREFIX_MAPPING[role];
    
    // Heuristic for unknown roles
    const clean = role.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (clean.length >= 4) return clean.substring(0, 4);
    if (clean.length > 0) return clean.padEnd(4, 'X');
    
    return "USER";
};

export const formatExternalId = (externalId, role) => {
    const prefix = getRolePrefix(role);
    
    // If no ID, return a placeholder
    if (!externalId) return `${prefix}-XXXX-0000`;
    
    // If it starts with USER-, replace it
    if (externalId.startsWith("USER-")) {
        return externalId.replace("USER-", `${prefix}-`);
    }
    
    // If it's a numeric ID, prefix it
    if (/^\d+$/.test(externalId)) {
        return `${prefix}-${externalId}`;
    }
    
    return externalId;
};
