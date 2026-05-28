import React, { useState, useEffect } from "react";

const Settings = ({
    activeView,
    userRoles,
    setUserRoles,
    formSections,
    setFormSections,
    selectedRole,
    setSelectedRole,
    showFullPreview,
    setShowFullPreview
}) => {
    const [newRoleName, setNewRoleName] = useState("");
    const [roleEditing, setRoleEditing] = useState({ id: null, value: "" });
    const [previewValues, setPreviewValues] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // --- PERSISTENCE LOGIC ---

    // Fetch configuration from Backend when role changes
    useEffect(() => {
        if (selectedRole && activeView === "add-details") {
            fetchFormConfig(selectedRole);
        }
    }, [selectedRole, activeView]);

    const fetchFormConfig = async (role) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/forms/${role}`);
            if (res.ok) {
                const data = await res.json();
                // Map Backend structure to Frontend
                if (data && data.length > 0) {
                    const mappedSections = data.map(sec => ({
                        id: `sec-${sec.id}`,
                        role: sec.role_name,
                        sectionTitle: sec.title,
                        fields: sec.fields.map(f => ({
                            id: `f-${f.id}`,
                            label: f.label,
                            type: f.type,
                            required: f.required,
                            placeholder: f.placeholder,
                            options: f.options
                        }))
                    }));

                    // Update only sections for current role, keep others
                    const otherRolesSections = formSections.filter(s => s.role !== role);
                    setFormSections([...otherRolesSections, ...mappedSections]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch form config:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveFormConfig = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            const currentRoleSections = formSections.filter(s => s.role === selectedRole);

            // Map Frontend structure to Backend Schema
            const payload = currentRoleSections.map((sec, index) => ({
                role_name: selectedRole,
                title: sec.sectionTitle,
                order: index,
                fields: sec.fields.map((f, fIndex) => ({
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    placeholder: f.placeholder || "",
                    options: f.options || [],
                    order: fIndex
                }))
            }));

            const res = await fetch(`${API_BASE_URL}/forms/save-all?role_name=${selectedRole}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`Template for ${selectedRole} saved successfully!`);
            } else {
                alert("Failed to save configuration.");
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("Connection error while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const savedRoles = localStorage.getItem("regisSys_userRoles");
        if (savedRoles) setUserRoles(JSON.parse(savedRoles));
    }, [setUserRoles]);

    useEffect(() => {
        if (userRoles.length > 0) {
            localStorage.setItem("regisSys_userRoles", JSON.stringify(userRoles));
        }
    }, [userRoles]);

    useEffect(() => {
        document.body.style.overflow = showFullPreview ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [showFullPreview]);

    // --- TEMPLATE DEFINITIONS ---
    const SECTION_TEMPLATES = {
        basic: {
            title: "Basic Information",
            icon: "👤",
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
            title: "Contact Details",
            icon: "📞",
            fields: [
                { label: "Email Address", type: "email", required: true },
                { label: "Mobile Number", type: "number", required: true },
                { label: "Telephone", type: "number", required: false },
            ]
        },
        address: {
            title: "Address Information",
            icon: "📍",
            fields: [
                { label: "Current Address", type: "text", required: true },
                { label: "City", type: "text", required: true },
                { label: "Province", type: "text", required: true },
                { label: "Zip Code", type: "text", required: true },
                { label: "Country", type: "country", required: true },
            ]
        },
        academic: {
            title: "Academic Background",
            icon: "🎓",
            fields: [
                { label: "ID Number", type: "text", required: true },
                { label: "Course/Program", type: "text", required: true },
                { label: "Department", type: "text", required: true },
                { label: "Year Level", type: "yearLevel", required: true },
                { label: "Section", type: "text", required: true },
                { label: "School address", type: "text", required: true },
            ]
        }
    };



    // --- LOGIC FUNCTIONS ---
    const addNewRole = () => {
        if (newRoleName && !userRoles.includes(newRoleName)) {
            setUserRoles([...userRoles, newRoleName]);
            setNewRoleName("");
        }
    };

    const deleteRole = (roleToDelete) => {
        const updatedRoles = userRoles.filter(r => r !== roleToDelete);
        const updatedSections = formSections.filter(s => s.role !== roleToDelete);

        setUserRoles(updatedRoles);
        setFormSections(updatedSections);

        localStorage.setItem("regisSys_userRoles", JSON.stringify(updatedRoles));
        localStorage.setItem("regisSys_formSections", JSON.stringify(updatedSections));

        if (selectedRole === roleToDelete) setSelectedRole(updatedRoles[0] || "");
    };

    const updateRoleName = (oldName) => {
        const newName = roleEditing.value;
        if (!newName || userRoles.includes(newName) || oldName === newName) {
            setRoleEditing({ id: null, value: "" });
            return;
        }
        setUserRoles(userRoles.map(r => r === oldName ? newName : r));
        setFormSections(formSections.map(s => s.role === oldName ? { ...s, role: newName } : s));
        if (selectedRole === oldName) setSelectedRole(newName);
        setRoleEditing({ id: null, value: "" });
    };

    const addTemplateSection = (templateKey) => {
        const template = SECTION_TEMPLATES[templateKey];
        const newSection = {
            id: `sec-${Date.now()}`,
            role: selectedRole,
            sectionTitle: template.title,
            fields: template.fields.map((f, i) => ({
                ...f,
                id: `f-${Date.now()}-${i}`
            }))
        };
        setFormSections([...formSections, newSection]);
    };

    const addNewSection = () => {
        setFormSections([...formSections, {
            id: `sec-${Date.now()}`,
            role: selectedRole,
            sectionTitle: "New Custom Section",
            fields: []
        }]);
    };

    const updateSectionTitle = (secId, title) => {
        setFormSections(formSections.map(s => s.id === secId ? { ...s, sectionTitle: title } : s));
    };

    const removeSection = (secId) => {
        setFormSections(formSections.filter(s => s.id !== secId));
    };

    const addNewFieldToSection = (secId) => {
        setFormSections(formSections.map(s => (s.id === secId ? {
            ...s,
            fields: [...s.fields, {
                id: `f-${Date.now()}`,
                label: "New Field",
                type: "text",
                required: false
            }]
        } : s)));
    };

    const updateNestedField = (secId, fieldId, key, value) => {
        setFormSections(formSections.map(s => (s.id === secId ? {
            ...s,
            fields: s.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
        } : s)));
    };

    const removeNestedField = (secId, fieldId) => {
        setFormSections(formSections.map(s => (s.id === secId ? {
            ...s,
            fields: s.fields.filter(f => f.id !== fieldId)
        } : s)));
    };

    const getFieldSpan = (label, type, isFullPage) => {
        const lowLabel = label.toLowerCase();
        const midWideKeywords = ["place", "company", "location", "email", "school", "degree"];
        const fullWideKeywords = ["address", "description", "notes", "remarks", "objective"];

        if (["file", "image"].includes(type)) return "col-span-3";
        if (fullWideKeywords.some(k => lowLabel.includes(k))) return "col-span-3";
        if (midWideKeywords.some(k => lowLabel.includes(k))) return isFullPage ? "md:col-span-2" : "col-span-2";
        return "col-span-1";
    };

    const renderPreviewInput = (field, isFullPage = false) => {
        const baseClasses = isFullPage
            ? "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#1a234b] outline-none appearance-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-400"
            : "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-gray-700 outline-none appearance-none shadow-sm";

        const handlePreviewChange = (e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value });

        if (["gender", "status", "country", "yearLevel"].includes(field.type)) {
            const options = {
                gender: ["Male", "Female", "Other"],
                status: ["Single", "Married", "Divorced", "Widowed"],
                yearLevel: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"],
                country: [
                    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
                    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
                    "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
                    "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
                    "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
                    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
                    "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
                    "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
                    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
                    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
                    "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
                    "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
                    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
                    "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
                    "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
                    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
                    "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
                    "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
                    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia",
                    "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
                    "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
                    "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent",
                    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
                    "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
                    "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka",
                    "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
                    "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
                    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
                    "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
                    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
                    "Zambia", "Zimbabwe"
                ]
            };
            return (
                <div className="relative group/select">
                    <select className={`${baseClasses} cursor-pointer hover:border-blue-400 pr-10`} value={previewValues[field.id] || ""} onChange={handlePreviewChange}>
                        <option value="" disabled>Select {field.label}</option>
                        {options[field.type].map(opt => <option key={opt} value={opt.toLowerCase()}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-blue-600 transition-colors">
                        <svg className={isFullPage ? "w-4 h-4" : "w-3 h-3"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            );
        }

        if (field.type === "date") {
            return (
                <div className="relative group/date">
                    <input type="date" className={`${baseClasses} cursor-pointer hover:border-blue-400`} value={previewValues[field.id] || ""} onChange={handlePreviewChange} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/date:text-blue-600 transition-colors">
                        <svg className={isFullPage ? "w-4 h-4" : "w-3 h-3"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                </div>
            );
        }

        if (["file", "image"].includes(field.type)) {
            return (
                <div className={`${isFullPage ? 'p-8' : 'p-3'} border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:border-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer group/upload`}>
                    <div className={`mb-2 ${isFullPage ? 'w-12 h-12' : 'w-6 h-6'} bg-white rounded-full flex items-center justify-center shadow-sm group-hover/upload:scale-110 transition-transform`}>
                        <svg className={`${isFullPage ? 'w-6 h-6' : 'w-3 h-3'} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            {field.type === "image"
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            }
                        </svg>
                    </div>
                    <span className={`${isFullPage ? 'text-[11px]' : 'text-[8px]'} font-black text-slate-500 uppercase tracking-widest`}>Upload {field.label}</span>
                </div>
            );
        }

        return (
            <input type={field.type} className={baseClasses} placeholder={`Enter ${field.label}...`} value={previewValues[field.id] || ""} onChange={handlePreviewChange} />
        );
    };

    return (
        <>
            {activeView === "add-section" && (
                <div className="max-w-2xl bg-white p-8 rounded-2xl border shadow-sm">
                    <h2 className="text-2xl font-bold text-[#1f2a56]">Role Management</h2>
                    <p className="text-gray-400 text-sm mb-6">Create or remove user types from your system.</p>
                    <div className="flex gap-3 mb-8">
                        <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Alumni, Staff..." className="flex-1 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <button onClick={addNewRole} className="px-6 bg-[#1f2a56] text-white rounded-xl font-bold hover:bg-blue-900 transition-colors">Add Role</button>
                    </div>
                    <div className="grid gap-3">
                        {userRoles.map(role => (
                            <div key={role} className="p-4 bg-gray-50 border rounded-xl flex justify-between items-center group">
                                {roleEditing.id === role ? (
                                    <input autoFocus className="font-bold text-gray-700 bg-white border border-gray-300 px-2 py-1 rounded outline-none" value={roleEditing.value} onChange={(e) => setRoleEditing({ ...roleEditing, value: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && updateRoleName(role)} />
                                ) : (
                                    <span className="font-bold text-gray-700">👤 {role}</span>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => roleEditing.id === role ? updateRoleName(role) : setRoleEditing({ id: role, value: role })} className="text-blue-500 font-bold text-xs uppercase">{roleEditing.id === role ? "Save" : "Edit"}</button>
                                    <button onClick={() => deleteRole(role)} className="text-red-400 font-bold text-xs uppercase">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest">Reset System Data</button>
                </div>
            )}

            {activeView === "add-details" && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-h-[calc(100vh-160px)]">
                    <div className="xl:col-span-7 bg-white p-10 rounded-[32px] border border-slate-100 shadow-[0_10px_40px_-20px_rgba(26,35,75,0.1)] overflow-y-auto custom-scrollbar relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-[32px]">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6 sticky top-0 bg-white z-10">
                            <div>
                                <h1 className="text-2xl font-black text-[#1a234b] tracking-tighter uppercase leading-none mb-1">Form Designer</h1>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Architect Registration Templates</p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={saveFormConfig}
                                    disabled={isSaving}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2
                                        ${isSaving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-600 text-white shadow-green-200 hover:scale-105 active:scale-95'}`}
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {isSaving ? "Saving..." : "Save Template"}
                                </button>
                                <button onClick={() => setShowFullPreview(true)} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-transform active:scale-95">Full Preview</button>
                                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-[#1a234b] cursor-pointer outline-none focus:ring-2 focus:ring-blue-600/10">
                                    {userRoles.map(role => <option key={role} value={role}>👤 {role}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="mb-6">
                                <p className="text-[10px] text-slate-400 mb-4 uppercase font-black tracking-[3px] ml-1">Add Quick Template Configuration</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.keys(SECTION_TEMPLATES).map((key) => (
                                        <button key={key} onClick={() => addTemplateSection(key)} className="flex flex-col items-center justify-center p-5 rounded-[24px] border-2 border-dashed border-slate-100 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-600/5 rounded-bl-[20px] transition-all group-hover:w-full group-hover:h-full group-hover:rounded-none" />
                                            <span className="text-2xl mb-2 group-hover:scale-125 transition-transform relative z-10">{SECTION_TEMPLATES[key].icon}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-blue-700 text-center leading-tight tracking-widest relative z-10">{SECTION_TEMPLATES[key].title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={addNewSection} className="w-full py-4 bg-blue-50/50 text-blue-600 rounded-[20px] border border-dashed border-blue-200 font-black text-[10px] uppercase tracking-[2px] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">+ Create Custom Field Group</button>

                            {formSections.filter(s => s.role === selectedRole).map((section) => (
                                <div key={section.id} className="p-6 bg-slate-50/80 rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                                    <div className="flex gap-4 items-center mb-6 pb-4 border-b border-slate-200/50">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                                            <div className="w-2 h-2 bg-blue-600 rotate-45" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5 block">Section Identity</label>
                                            <input type="text" value={section.sectionTitle} onChange={(e) => updateSectionTitle(section.id, e.target.value)} className="w-full bg-transparent font-black text-[#1a234b] outline-none text-sm uppercase tracking-tight" />
                                        </div>
                                        <button onClick={() => removeSection(section.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-100 shadow-sm">✕</button>
                                    </div>
                                    <div className="space-y-3 pl-2 sm:pl-6 border-l-2 border-blue-100/50 ml-5">
                                        {section.fields.map((field) => (
                                            <div key={field.id} className="flex flex-wrap sm:flex-nowrap gap-4 bg-white p-4 rounded-2xl border border-slate-100 items-end shadow-[0_4px_15px_-5px_rgba(26,35,75,0.05)] relative overflow-hidden group/field">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                                <div className="flex-[3] min-w-[120px]">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Label Name</label>
                                                    <input type="text" value={field.label} onChange={(e) => updateNestedField(section.id, field.id, 'label', e.target.value)} className="w-full text-xs font-black text-[#1a234b] outline-none bg-slate-50 px-3 py-2 rounded-lg border border-transparent focus:border-blue-600/20 transition-all" />
                                                </div>
                                                <div className="flex-[2] min-w-[100px]">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Field Logic</label>
                                                    <select value={field.type} onChange={(e) => updateNestedField(section.id, field.id, 'type', e.target.value)} className="w-full text-[10px] bg-slate-100 p-2 rounded-lg border-none font-black text-[#1a234b] cursor-pointer">
                                                        <option value="text">Short Text</option>
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
                                                <div className="flex flex-col items-center mb-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                    <label className="text-[7px] font-black text-slate-400 uppercase mb-1.5">Required</label>
                                                    <button onClick={() => updateNestedField(section.id, field.id, 'required', !field.required)} className={`w-9 h-4.5 rounded-full p-0.5 transition-colors duration-300 ${field.required ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 shadow-sm ${field.required ? 'translate-x-4.5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <button onClick={() => removeNestedField(section.id, field.id)} className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-600 transition-colors bg-slate-50 rounded-xl hover:bg-red-50">🗑️</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addNewFieldToSection(section.id)} className="w-full py-3 text-slate-400 text-[9px] font-black uppercase tracking-[3px] hover:text-blue-600 hover:bg-blue-50/50 rounded-xl border-2 border-dashed border-transparent hover:border-blue-100 transition-all">+ Add New Input Field</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>




                </div>
            )}

            {showFullPreview && (
                <div className="fixed inset-0 z-[60] bg-[#f2f5f9] flex flex-col animate-in fade-in">
                    <header className="bg-white border-b px-8 py-3 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Previewing: {selectedRole}</span>
                            <h2 className="text-base font-bold text-gray-800 tracking-tight">System Interface Preview</h2>
                        </div>
                        <button onClick={() => setShowFullPreview(false)} className="px-5 py-1.5 bg-red-500 text-white rounded-lg font-bold text-xs uppercase shadow-lg shadow-red-200">Exit Preview</button>
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-14 flex justify-between items-center w-full max-w-2xl mx-auto px-4 sticky top-0 z-20 bg-[#f2f5f9]/80 backdrop-blur-md py-4 rounded-3xl">
                                    {[{ step: '01', title: 'Profile' }, { step: '02', title: 'Account' }, { step: '03', title: 'Verify' }].map((item, index) => (
                                        <React.Fragment key={item.step}>
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 shadow-sm
                                                ${index === 0 ? 'bg-[#1a234b] text-white border-[#1a234b] scale-110 shadow-blue-900/10' : 'bg-white text-slate-300 border-slate-200'}`}>
                                                    {index === 0 ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-[2px] transition-colors duration-500 ${index === 0 ? 'text-[#1a234b]' : 'text-slate-400'}`}>{item.title}</span>
                                            </div>
                                            {index < 2 && <div className="flex-1 h-[2px] bg-slate-200 mx-4 -mt-10 self-center">
                                                <div className={`h-full bg-blue-600 transition-all duration-700 ${index === 0 ? 'w-full' : 'w-0'}`} />
                                            </div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(26,35,75,0.12)] border border-slate-100 overflow-hidden">
                                    <div className="p-10 md:p-16">
                                        <div className="mb-16 text-center">
                                            <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mb-6" />
                                            <h1 className="text-3xl font-black text-[#1a234b] uppercase tracking-tighter leading-none mb-3">Personal Information</h1>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[2px]">Provide your details for your {selectedRole} account</p>
                                        </div>
                                        <div className="space-y-16">
                                            {formSections.filter(s => s.role === selectedRole).map((section) => (
                                                <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <div className="w-2.5 h-2.5 bg-blue-600 rotate-45 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                                                        <h3 className="text-blue-600 font-black text-[11px] uppercase tracking-[3px] border-b border-blue-100 flex-1 pb-1">{section.sectionTitle}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
                                                        {section.fields.map(field => (
                                                            <div key={field.id} className={`group ${getFieldSpan(field.label, field.type, true)}`}>
                                                                <label className="text-[11px] font-bold text-slate-500 mb-2.5 block uppercase tracking-tight ml-1 group-focus-within:text-blue-700 transition-colors">
                                                                    {field.label} {field.required && <span className="text-red-500 ml-1 font-black">*</span>}
                                                                </label>
                                                                {renderPreviewInput(field, true)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-20 p-8 bg-slate-50 rounded-[28px] border border-slate-200 flex items-center gap-6 group hover:border-blue-300 transition-all">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-[#1a234b] group-hover:scale-110 transition-transform">
                                                <ShieldCheck className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-[#1a234b] uppercase tracking-widest mb-1">Privacy Guaranteed</h4>
                                                <p className="text-[11px] font-bold text-slate-400">All data is processed through our secure encryption layer.</p>
                                            </div>
                                        </div>
                                        <div className="mt-12 pt-10 border-t border-slate-100 flex justify-end">
                                            <button className="px-14 py-5 bg-[#1a234b] text-white rounded-2xl font-black uppercase tracking-[3px] text-xs hover:bg-blue-900 hover:scale-105 transition-all active:scale-95 shadow-[0_15px_40px_-10px_rgba(26,35,75,0.3)] flex items-center gap-3">
                                                Next Step
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-12 pb-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                                    &copy; 2026 REGISSYS GLOBAL &bull; REAL-TIME PREVIEW
                                </div>
                            </div>
                        </div>
                </div>
                </div >
            )}
        </>
    );
};

export default Settings;