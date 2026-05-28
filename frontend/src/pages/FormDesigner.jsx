import React, { useState, useEffect } from "react";
import { message } from "antd";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Layout,
    ArrowRight,
    User,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    Users,
    Heart,
    FileText,
    Camera,
    Calendar,
    Globe,
    Building2,
    Info,
    Check,
    X,
    Eye,
    Shield,
    Cpu,
    Briefcase,
    Search,
    Sparkles,
    BookOpen,
    ShieldAlert,
    Terminal,
    Fingerprint,
    Save
} from "lucide-react";
import { API_BASE_URL } from "../config";
import AddressForm from "../components/AddressForm";
import { getFieldSpan, getSectionGridClass, isAddressSection } from "../utils/formLayout";

const FormDesigner = ({
    userRoles,
    formSections,
    setFormSections,
    selectedRole,
    setSelectedRole,
    showFullPreview,
    setShowFullPreview
}) => {
    const [previewValues, setPreviewValues] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showCategorySelection, setShowCategorySelection] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");


    const saveFormConfig = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        setIsSaved(false);

        const currentRoleSections = formSections.filter(s => (s.role_name || s.role) === selectedRole);

        const payload = currentRoleSections.map((sec, index) => ({
            role_name: selectedRole,
            title: sec.sectionTitle || sec.title || "Untitled Section",
            order: index,
            fields: (sec.fields || []).map((f, fIndex) => ({
                label: f.label || "Unnamed Field",
                type: f.type || "text",
                required: f.required ?? false,
                placeholder: f.placeholder || "",
                options: Array.isArray(f.options) ? f.options : [],
                order: fIndex
            }))
        }));

        const url = `${API_BASE_URL}/forms/save-all?role_name=${encodeURIComponent(selectedRole)}`;
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsSaved(true);
                message.destroy();
                message.success("Form template saved successfully!");
                setTimeout(() => setIsSaved(false), 4000);
            } else {
                message.destroy();
                message.error("Failed to save configuration. Please try again.");
            }
        } catch (err) {
            console.error("[FormDesigner] Save error:", err);
            message.destroy();
            message.error("Connection error while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const SECTION_TEMPLATES = {
        basic: {
            title: "Basic Details",
            icon: <User className="w-5 h-5 md:w-6 md:h-6" />,
            fields: [
                { label: "First Name", type: "text", required: true },
                { label: "Last Name", type: "text", required: true },
                { label: "Middle Name", type: "text", required: false },
                { label: "Suffix", type: "text", required: false },
                { label: "Gender", type: "gender", required: true },
                { label: "Birth Date", type: "date", required: true },
                { label: "Place of Birth", type: "text", required: true },
                { label: "Civil Status", type: "status", required: true },
            ]
        },
        contact: {
            title: "Contact Information",
            icon: <Phone className="w-5 h-5 md:w-6 md:h-6" />,
            fields: [
                { label: "Email Address", type: "email", required: true },
                { label: "Mobile Number", type: "number", required: true },
                { label: "Telephone", type: "number", required: false },
            ]
        },
        address: {
            title: "Address Information",
            icon: <MapPin className="w-5 h-5 md:w-6 md:h-6" />,
            fields: [
                { label: "Country", type: "country", required: true },
                { label: "Province", type: "text", required: true },
                { label: "City / Municipality", type: "text", required: true },
                { label: "Barangay", type: "text", required: true },
                { label: "Street Name", type: "text", required: true },
                { label: "House / Unit / Building Number", type: "text", required: true },
                { label: "Zip Code", type: "text", required: true },
            ]
        },
        academic: {
            title: "Academic Information",
            icon: <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />,
            fields: [
                { label: "ID Number", type: "text", required: true },
                { label: "Course/Program", type: "text", required: true },
                { label: "Department", type: "text", required: true },
                { label: "Year Level", type: "yearLevel", required: true },
                { label: "Section", type: "text", required: true },
                { label: "School address", type: "text", required: true },
            ]
        },
        guardian: {
            title: "Guardian Information",
            icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
            fields: [
                { label: "Guardian Full Name", type: "text", required: true },
                { label: "Guardian Mobile Number", type: "number", required: true },
                { label: "Relationship", type: "text", required: true },
                { label: "Occupation", type: "text", required: false },
                { label: "Guardian Address", type: "text", required: true },
            ]
        }
    };

    const addTemplateSection = (templateKey) => {
        const template = SECTION_TEMPLATES[templateKey];
        const alreadyExists = formSections.some(s => (s.role_name || s.role) === selectedRole && s.sectionTitle === template.title);
        if (alreadyExists) return message.warning(`The "${template.title}" is already in your form!`);

        const newSection = {
            id: `sec-${Date.now()}`,
            role_name: selectedRole,
            sectionTitle: template.title,
            fields: template.fields.map((f, i) => ({ ...f, id: `f-${Date.now()}-${i}` }))
        };
        setFormSections(prev => [...prev, newSection]);
        message.success(`"${template.title}" added successfully!`);
    };

    const addNewSection = () => {
        setFormSections(prev => [...prev, {
            id: `sec-${Date.now()}`,
            role_name: selectedRole,
            sectionTitle: "New Custom Section",
            fields: []
        }]);
    };

    const updateSectionTitle = (secId, title) => {
        setFormSections(prev => prev.map(s => s.id === secId ? { ...s, sectionTitle: title } : s));
    };

    const removeSection = (secId) => {
        if (window.confirm(`Delete this section?`)) {
            const sectionToDelete = formSections.find(s => s.id === secId);
            if (sectionToDelete && sectionToDelete.fields) {
                const newPreviewValues = { ...previewValues };
                sectionToDelete.fields.forEach(f => {
                    delete newPreviewValues[f.label];
                    delete newPreviewValues[f.id];
                });
                setPreviewValues(newPreviewValues);
            }
            setFormSections(prev => prev.filter(s => s.id !== secId));
        }
    };

    const addNewFieldToSection = (secId) => {
        setFormSections(prev => prev.map(s => (s.id === secId ? {
            ...s,
            fields: [...s.fields, { id: `f-${Date.now()}`, label: "New Field", type: "text", required: false }]
        } : s)));
    };

    const updateNestedField = (secId, fieldId, key, value) => {
        setFormSections(prev => prev.map(s => (s.id === secId ? {
            ...s,
            fields: s.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
        } : s)));
    };

    const removeNestedField = (secId, fieldId) => {
        if (!window.confirm("Are you sure you want to delete this label?")) return;
        setFormSections(prev => prev.map(s => (s.id === secId ? {
            ...s,
            fields: s.fields.filter(f => f.id !== fieldId)
        } : s)));
    };

    const renderPreviewInput = (field, isFullPage = false) => {
        const baseClasses = isFullPage
            ? "w-full p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-white/80 outline-none appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-400 dark:placeholder:text-white/25"
            : "w-full p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-white/80 outline-none appearance-none";

        const handlePreviewChange = (e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value });

        if (["gender", "status", "country", "yearLevel"].includes(field.type)) {
            const options = {
                gender: ["Male", "Female", "Other"],
                status: ["Single", "Married", "Divorced", "Widowed"],
                yearLevel: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"],
                country: ["Philippines", "United States", "Canada", "Australia", "United Kingdom"]
            };
            return (
                <div className="relative group/select">
                    <select className={`${baseClasses} pr-10`} value={previewValues[field.id] || ""} onChange={handlePreviewChange}>
                        <option value="" disabled>Select {field.label}</option>
                        {(options[field.type] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-white/30 group-focus-within/select:text-blue-500">
                        <ChevronLeft className="w-4 h-4 rotate-[270deg]" strokeWidth={3} />
                    </div>
                </div>
            );
        }

        if (field.type === "date") {
            return (
                <div className="relative group/date">
                    <input type="date" className={`${baseClasses}`} value={previewValues[field.id] || ""} onChange={handlePreviewChange} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-white/30 group-focus-within/date:text-blue-500">
                        <Calendar className="w-4 h-4" strokeWidth={2} />
                    </div>
                </div>
            );
        }

        if (["file", "image"].includes(field.type)) {
            return (
                <div className="w-full bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 flex flex-col items-center justify-center relative hover:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-full flex items-center justify-center mb-2 border border-slate-100 dark:border-white/10 shadow-sm">
                        {field.type === "image" ? <Camera className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-white/40">Attach {field.label}</span>
                </div>
            );
        }

        return <input type={field.type === "number" ? "number" : "text"} className={baseClasses} placeholder={field.placeholder || `Enter ${field.label}`} value={previewValues[field.id] || ""} onChange={handlePreviewChange} />;
    };

    if (showCategorySelection) {
        const getRoleIcon = (role) => {
            const r = (role || "").toLowerCase();
            if (r.includes("student")) return <GraduationCap className="w-8 h-8" />;
            if (r.includes("teacher") || r.includes("faculty")) return <Users className="w-8 h-8" />;
            if (r.includes("it")) return <Cpu className="w-8 h-8" />;
            if (r.includes("registrar")) return <FileText className="w-8 h-8" />;
            if (r.includes("admin")) return <Shield className="w-8 h-8" />;
            if (r.includes("staff")) return <Briefcase className="w-8 h-8" />;
            return <Layout className="w-8 h-8" />;
        };


        return (
            <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in duration-700 relative overflow-hidden">
                {/* Visual Fillers */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] dark:opacity-[0.03] pointer-events-none scale-[2]">
                    <Layout className="w-96 h-96 rotate-12 animate-pulse" />
                </div>

                {/* Selection Header */}
                <div className="bg-[var(--bg-sidebar)] p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden shrink-0 transition-all duration-500 border border-white/5">
                    {/* Decorative radial glows - softened for theme compatibility */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <Layout className="w-64 h-64 -rotate-12 text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white shadow-md backdrop-blur-sm">
                                    <Layout className="w-4 h-4" style={{ stroke: 'white' }} />
                                </div>
                                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                    Form <span className="text-blue-300">Architect</span>
                                </h1>
                                <div className="hidden sm:flex items-center gap-2 ml-3 px-2 py-0.5 bg-white/10 rounded-md border border-white/10 backdrop-blur-sm">
                                    <span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Active roles: {userRoles.length}</span>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-blue-200/60 font-medium max-w-2xl leading-relaxed">
                                Deploy role-specific registration environments with precision. Select a deployment category to manage field architectures and validation logic.
                            </p>
                        </div>

                        {/* Search Filter */}
                        <div className="relative w-full md:w-80 group mt-4 md:mt-0">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors z-10">
                                <Search className="w-4 h-4" style={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: '2.5px' }} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/15 rounded-2xl text-[11px] font-bold text-white placeholder:text-white/30 focus:ring-4 focus:ring-blue-400/20 focus:border-blue-400/40 outline-none transition-all backdrop-blur-sm"
                                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Full Length Category List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 gap-4 pb-12">
                        {userRoles.filter(role =>
                            (role || "").toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((role, index) => (
                            <button
                                key={role}
                                onClick={() => {
                                    setSelectedRole(role);
                                    setShowCategorySelection(false);
                                }}
                                className="group w-full relative flex items-center gap-6 p-4 md:p-6 rounded-[1.5rem] bg-[var(--bg-card)] border border-[var(--border-muted)] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-3 transition-all duration-500 shadow-sm shrink-0">
                                    {getRoleIcon(role)}
                                </div>

                                <div className="flex-1 text-left">
                                    <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors tracking-tight mb-1">
                                        {role}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                        <span className="text-[9px] text-slate-400 dark:text-white/20 font-medium">Registration Form · Last modified: May 15, 2026</span>
                                    </div>
                                </div>

                                <div className="flex items-center shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Top/Bottom border lines for "fill the spaces" look */}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-muted)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-muted)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-5 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar">
            {/* Prominent Outside Back Button */}
            <div className="flex items-center">
                <button
                    onClick={() => setShowCategorySelection(true)}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-white/60 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[11px] font-bold tracking-tight">Back to Categories</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-white dark:bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[2rem] shadow-sm shrink-0 mt-4 mx-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 text-white">
                        <Layout className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a234b] dark:text-white tracking-tight leading-none mb-2">Form Architect</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                            <p className="text-sm text-slate-400 dark:text-white/40 font-medium">
                                Editing template for: <span className="text-blue-600 font-bold">{selectedRole}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                    <button
                        onClick={saveFormConfig}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg ${isSaved ? 'bg-green-500 text-white shadow-green-200' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95'}`}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaved ? "Successfully Saved" : isSaving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
                {/* DESIGNER PANEL */}
                <div className="xl:col-span-5 bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-muted)] shadow-sm overflow-y-auto custom-scrollbar relative flex flex-col h-full">
                    <div className="space-y-6">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Plus className="w-3.5 h-3.5 text-blue-500" />
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-white/60">Quick templates</p>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                {Object.keys(SECTION_TEMPLATES).map((key) => (
                                    <button key={key} onClick={() => addTemplateSection(key)} className="flex flex-col items-center justify-center p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-blue-400 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/10 transition-all group relative overflow-hidden">
                                        <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-sm mb-2 text-slate-400 dark:text-white/40 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-all border border-slate-100 dark:border-white/5">
                                            {SECTION_TEMPLATES[key].icon}
                                        </div>
                                        <span className="text-[8px] font-semibold text-slate-500 dark:text-white/50 group-hover:text-slate-800 dark:group-hover:text-white/80 text-center leading-tight">{SECTION_TEMPLATES[key].title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={addNewSection} className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 font-semibold text-[9px] hover:border-blue-400 dark:hover:border-blue-400/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-slate-700 dark:hover:text-white/80 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create custom field group
                        </button>

                        <div className="space-y-6 mt-8">
                            {formSections.filter(s => (s.role_name || s.role) === selectedRole).map((section) => (
                                <div key={section.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm animate-in fade-in zoom-in-95 duration-500 hover:border-blue-200 dark:hover:border-blue-400/20 transition-colors">
                                    <div className="flex gap-4 items-center mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                        <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center text-blue-500 border border-slate-100 dark:border-white/5 shadow-sm">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[8px] font-semibold text-blue-500 dark:text-blue-400/80 mb-1 block tracking-wide">Section name</label>
                                            <input type="text" value={section.sectionTitle} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="w-full bg-transparent font-bold text-slate-700 dark:text-white/80 outline-none text-sm tracking-tight" />
                                        </div>
                                        <button onClick={() => removeSection(section.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-all bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-red-200 dark:hover:border-red-400/30">✕</button>
                                    </div>
                                    <div className="space-y-4 px-0 sm:pl-6 border-l-0 sm:border-l-2 border-blue-100/50 sm:ml-5">
                                        {section.fields.map((field) => (
                                            <div key={field.id} className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-white/5 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 items-start sm:items-end relative overflow-hidden group/field shadow-sm">
                                                <div className="w-full sm:flex-[3]">
                                                    <label className="text-[8px] font-semibold text-slate-400 dark:text-white/40 mb-1.5 block tracking-wide">Label name</label>
                                                    <input type="text" value={field.label} onChange={(e) => updateNestedField(section.id, field.id, 'label', e.target.value)} className="w-full text-xs font-bold text-slate-700 dark:text-white/80 outline-none bg-slate-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-white/5 focus:border-blue-400/40 transition-all" />
                                                </div>
                                                <div className="flex-[2] w-full sm:w-auto">
                                                    <label className="text-[8px] font-semibold text-slate-400 dark:text-white/40 mb-1.5 block tracking-wide">Field type</label>
                                                    <select value={field.type} onChange={(e) => updateNestedField(section.id, field.id, 'type', e.target.value)} className="w-full text-[10px] bg-slate-100 dark:bg-white/10 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-white/5 font-semibold text-slate-700 dark:text-white/80 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400/20">
                                                        <option value="text">Short Text</option>
                                                        <option value="address">Smart Address</option>
                                                        <option value="date">Date Picker</option>
                                                        <option value="email">Email</option>
                                                        <option value="number">Numeric</option>
                                                        <option value="gender">Gender</option>
                                                        <option value="status">Civil Status</option>
                                                        <option value="country">Country</option>
                                                        <option value="file">Document</option>
                                                        <option value="image">Image</option>
                                                        <option value="yearLevel">Year Level</option>
                                                    </select>
                                                </div>
                                                <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 w-full sm:w-auto">
                                                    <label className="text-[7px] font-semibold text-slate-400 dark:text-white/40">Required</label>
                                                    <button onClick={() => updateNestedField(section.id, field.id, 'required', !field.required)} className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 relative ${field.required ? 'bg-blue-500 shadow-md shadow-blue-500/20' : 'bg-slate-200 dark:bg-white/20'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-transform ${field.required ? 'left-4' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                <button onClick={() => removeNestedField(section.id, field.id)} className="p-2.5 text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => addNewFieldToSection(section.id)} className="w-full py-4 text-slate-400 dark:text-white/30 text-[9px] font-semibold hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-400/20 transition-all">+ Add new input field</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PREVIEW PANEL */}
                <div className="xl:col-span-7 bg-[var(--bg-main)] rounded-[2.5rem] border border-[var(--border-muted)] overflow-hidden flex flex-col h-full shadow-inner">
                    <div className="p-6 bg-[var(--bg-card)] border-b border-[var(--border-muted)] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-sm border border-blue-100">
                                <Eye className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-700 dark:text-white/80 leading-tight tracking-tight">Real-time Interface Preview</h3>
                                <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium tracking-tight">Active for: <span className="text-blue-500 dark:text-blue-400 font-semibold">{selectedRole}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar bg-slate-50/20">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-[var(--bg-card)] rounded-[3rem] shadow-2xl border border-[var(--border-muted)] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                                <div className="p-10 md:p-16">
                                    <div className="mb-14 text-center">
                                        <div className="h-2 w-16 bg-blue-500 rounded-full mx-auto mb-8 shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white/90 tracking-tighter leading-none mb-5">Registration</h1>
                                        <p className="text-slate-400 dark:text-white/40 text-[13px] font-medium">Authorized interface for <span className="text-blue-500 dark:text-blue-400 font-semibold">{selectedRole}</span> profile registration</p>
                                    </div>

                                    <div className="space-y-20">
                                        {formSections.filter(s => (s.role_name || s.role) === selectedRole).length === 0 ? (
                                            <div className="py-28 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[3rem] bg-slate-50 dark:bg-white/5">
                                                <div className="w-24 h-24 bg-white dark:bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-slate-100 dark:border-white/10">🏗️</div>
                                                <h3 className="text-lg font-bold text-slate-700 dark:text-white/70">Ready to Architect</h3>
                                                <p className="text-[12px] text-slate-400 dark:text-white/30 font-medium mt-3 px-16 leading-relaxed">Start your design by selecting a Quick Template or creating a custom field group from the designer panel.</p>
                                            </div>
                                        ) : (
                                            formSections.filter(s => (s.role_name || s.role) === selectedRole).map((section) => {
                                                const title = section?.title || section?.sectionTitle || "";
                                                const addressSection = isAddressSection(title);

                                                return (
                                                    <div key={section.id} className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                                                        <div className="flex items-center gap-5 mb-12">
                                                            <div className="w-4 h-4 bg-blue-500 rotate-45 shadow-[0_0_25px_rgba(59,130,246,0.4)]" />
                                                            <h3 className="text-slate-600 dark:text-white/70 font-bold text-[14px] border-b border-slate-100 dark:border-white/10 flex-1 pb-3">{title}</h3>
                                                        </div>

                                                        {addressSection ? (
                                                            <AddressForm
                                                                values={previewValues}
                                                                onChange={(field, val) => {
                                                                    setPreviewValues(prev => ({ ...prev, [field]: val }));
                                                                }}
                                                                visibleFields={section.fields}
                                                            />
                                                        ) : (
                                                            <div className={getSectionGridClass()}>
                                                                {section.fields.map(field => (
                                                                    <div key={field.id} className={`group ${getFieldSpan(field.label, field.type)}`}>
                                                                        <label className="text-[13px] font-medium text-slate-500 dark:text-white/50 mb-4 block tracking-tight ml-1 group-focus-within:text-slate-700 dark:group-focus-within:text-white/80 transition-colors">
                                                                            {field.label} {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                                                                        </label>
                                                                        {renderPreviewInput(field, true)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-20 pb-24 text-slate-400/50 text-[11px] font-medium tracking-widest">
                                &copy; 2026 RegisSys
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormDesigner;
