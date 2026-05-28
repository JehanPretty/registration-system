import {
  Shield, Layout, CreditCard,
  QrCode, ClipboardCheck, FileText, MessageSquare,
  CalendarDays, UserCircle, BarChart2, ClipboardList, Activity
} from "lucide-react";

// ─── ROLE-BASED SIDEBAR CONFIGURATION ──────────────────────────
// Each key maps to a view ID. Only listed views are shown per role.
// "Super Admin" gets the full management suite + admin tools dropdown.

export const sidebarByRole = {
  "Super Admin": [
    "analytics",
    "registration-analytics",
    "reports",
    "audit-log",
    "mission-control",
    "users",
    "qr-code",
    "admin-tools",
  ],
  "Administrator": [
    "analytics",
    "registration-analytics",
    "reports",
    "audit-log",
    "users",
    "qr-code",
    "admin-tools",
  ],
  "Assistant Admin": [
    "analytics",
    "users",
    "id-builder",
    "qr-code",
  ],
  "Registrar Staff": [
    "mission-control",
    "registration-analytics",
    "users",
    "add-details",
    "id-builder",
    "qr-code",
  ],
  Student: [
    "qr-code",
    "attendance",
    "documents",
    "account-settings",
  ],
  Teacher: [
    "qr-code",
    "attendance",
    "schedule",
    "documents",
    "account-settings",
  ],
  Staff: [
    "qr-code",
    "attendance",
    "documents",
    "account-settings",
  ],
};

// Fallback for any role not explicitly mapped (shows basic user items)
export const defaultSidebar = [
  "qr-code",
  "attendance",
  "documents",
  "account-settings",
];

// ─── NAV ITEM REGISTRY (icon, label, view key) ────────────────
export const navItemRegistry = {
  analytics: {
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  "registration-analytics": {
    label: "Registration Analytics",
    icon: <Activity className="w-5 h-5 shrink-0" />,
  },
  users: {
    label: "User Management",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  "personal-details": {
    label: "Personal Details",
    icon: <UserCircle className="w-5 h-5 shrink-0" />,
  },
  "qr-code": {
    label: "Digital ID / QR",
    icon: <QrCode className="w-5 h-5 shrink-0" />,
  },
  attendance: {
    label: "Attendance",
    icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
  },
  documents: {
    label: "Documents",
    icon: <FileText className="w-5 h-5 shrink-0" />,
  },
  schedule: {
    label: "Schedule",
    icon: <CalendarDays className="w-5 h-5 shrink-0" />,
  },
  feedback: {
    label: "Feedback",
    icon: <MessageSquare className="w-5 h-5 shrink-0" />,
  },
  "account-settings": {
    label: "Settings",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  "add-section": {
    label: "Manage Roles",
    icon: <Shield className="w-5 h-5 shrink-0" />,
  },
  "add-details": {
    label: "Form Designer",
    icon: <Layout className="w-5 h-5 shrink-0" />,
  },
  "id-builder": {
    label: "ID Card Builder",
    icon: <CreditCard className="w-5 h-5 shrink-0" />,
  },
  reports: {
    label: "Reports",
    icon: <BarChart2 className="w-5 h-5 shrink-0" />,
  },
  "audit-log": {
    label: "Audit Log",
    icon: <ClipboardList className="w-5 h-5 shrink-0" />,
  },
  "mission-control": {
    label: "ID Management",
    icon: <Shield className="w-5 h-5 shrink-0 text-indigo-400" />,
  },
};

// ─── ADMIN TOOLS SUB-ITEMS ─────────────────────────────────────
export const adminToolItems = [
  { key: "add-section", label: "Manage Roles", icon: <Shield className="w-3.5 h-3.5 opacity-70" /> },
  { key: "add-details", label: "Form Designer", icon: <Layout className="w-3.5 h-3.5 opacity-70" /> },
  { key: "id-builder", label: "ID Card Builder", icon: <CreditCard className="w-3.5 h-3.5 opacity-70" /> },
];

// ─── VIEW TITLE MAP ────────────────────────────────────────────
export const viewTitles = {
  analytics: "Dashboard",
  "registration-analytics": "Registration Analytics",
  users: "User Management",
  "personal-details": "Personal Details",
  "account-settings": "Account Settings",
  "qr-code": "Digital ID / QR",
  attendance: "Attendance",
  documents: "Documents",
  schedule: "Schedule",
  feedback: "Feedback",
  "add-section": "Manage Roles",
  "add-details": "Form Designer",
  "id-builder": "ID Card Builder",
  reports: "Reports & Analytics",
  "audit-log": "Audit Log",
  "mission-control": "ID Management",
};
