import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import {
    Layout, Palette, Eye, Save, Loader2,
    MoveVertical, MoveHorizontal, CreditCard,
    ShieldCheck, GraduationCap, Minus, Award, Building2, Sparkles,
    ImagePlus, Type, X, Search, ArrowRight, ChevronLeft,
    Users, FileText, Shield, Cpu, Briefcase
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import IDCard from '../components/IDCard';
import formalPhoto from '../assets/images/Formal_photo.jpg';
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { formatExternalId } from '../utils/idFormatter';

// ── TEMPLATE PRESETS ────────────────────────────────────────
const templatePresets = [
    { id: "corporate", name: "Corporate", description: "Clean & professional", icon: <ShieldCheck className="w-4 h-4" />, preview: { bg: "#1a234b", accent: "#2563eb" } },
    { id: "modern", name: "Modern", description: "Gradient glassmorphism", icon: <Sparkles className="w-4 h-4" />, preview: { bg: "linear-gradient(135deg,#1a234b,#2563eb)", accent: "#8b5cf6" } },
    { id: "academic", name: "Academic", description: "Classic institutional", icon: <GraduationCap className="w-4 h-4" />, preview: { bg: "#1e3a5f", accent: "#c2922e" } },
    { id: "minimal", name: "Minimal", description: "Typography focused", icon: <Minus className="w-4 h-4" />, preview: { bg: "#ffffff", accent: "#3b82f6" } },
    { id: "bold", name: "Bold", description: "Full-color impact", icon: <Award className="w-4 h-4" />, preview: { bg: "#7c3aed", accent: "#f59e0b" } },
    { id: "government", name: "Government", description: "Official & formal", icon: <Building2 className="w-4 h-4" />, preview: { bg: "#1f2937", accent: "#dc2626" } },
    { id: "professional", name: "Professional", description: "Modern orange & navy accent", icon: <CreditCard className="w-4 h-4" />, preview: { bg: "#1a234b", accent: "#f59e0b" } },
];

const IDBuilder = () => {
    const [selectedRole, setSelectedRole] = useState("Student");
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showRoleSelection, setShowRoleSelection] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const logoInputRef = useRef(null);
    const frontTemplateRef = useRef(null);
    const backTemplateRef = useRef(null);
    const signatureRef = useRef(null);
    const cropperRef = useRef(null);
    const [removingBg, setRemovingBg] = useState(false);
    const [removingSigBg, setRemovingSigBg] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);

    const [template, setTemplate] = useState({
        role_name: "Student",
        template_style: "corporate",
        orientation: "portrait",
        primary_color: "#1a234b",
        secondary_color: "#2563eb",
        // Branding text & logo
        header_text: "",
        institution_name: "Global Institute",
        institution_subtitle: "Empowering Excellence",
        logo_url: "",
        header_color: "#ffffff",
        institution_color: "#ffffff",
        subtitle_color: "#ffffff",
        // Font Sizes / Zoom
        header_font_size: 6,
        institution_font_size: 10,
        subtitle_font_size: 7,
        logo_size: 40,
        // Front elements
        show_qr: true,
        show_avatar: true,
        show_id_number: true,
        // Back content
        back_content: "This card is the property of the issuing institution. If found, please return to the nearest security office.",
        back_contact: "+1 (555) 000-0000",
        show_barcode: true,
        signature_label: "University Registrar",
        custom_back_bg_url: "",
        authorized_name: "Registrar",
        authorized_signature_url: "",
        show_user_signature: true,
        custom_front_bg_url: "",
        name_color: "",
        role_color: "",
        id_number_color: "",
        name_font_size: 24,
        role_font_size: 10,
        id_number_font_size: 9,
    });


    const [previewUser] = useState({
        name: "Jehan Perez Macararic",
        role_context: "Student Representative",
        external_id: "STUD-2026-0001",
        avatar_url: formalPhoto,
        attributes: {
            "Guardian Full Name": "Guardian Name",
            "Guardian Address": "Address",
            "Guardian Mobile Number": "Contact Number"
        }
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/roles/`, {
                    headers: { "bypass-tunnel-reminder": "true" }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRoles(data);
                    if (data.length > 0) setSelectedRole(data[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) fetchTemplate(selectedRole);
    }, [selectedRole]);

    const fetchTemplate = async (role) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/id-builder/${role}`, {
                headers: { "bypass-tunnel-reminder": "true" }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
            }
        } catch (err) {
            setTemplate(prev => ({ ...prev, role_name: role }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`${API_BASE_URL}/id-builder/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "bypass-tunnel-reminder": "true"
                },
                body: JSON.stringify({ ...template, role_name: selectedRole }),
            });
            if (res.ok) {
                setSaveSuccess(true);
                message.success("Template saved successfully!");
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                const errData = await res.json();
                message.error(`Failed to save template: ${errData.detail || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Save error:", err);
            message.error("Network error while saving template");
        } finally {
            setIsSaving(false);
        }
    };

    const updateTemplate = (key, value) => {
        setTemplate(prev => ({ ...prev, [key]: value }));
    };

    // Canvas-based background removal — strips white/light pixels to transparent
    const removeBackground = (dataUrl) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const threshold = 230; // pixels brighter than this are considered "background"
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const brightness = (r + g + b) / 3;
                    if (brightness > threshold) {
                        // Soft-fade: pixels near the threshold get partial transparency
                        const alpha = Math.round(((255 - brightness) / (255 - threshold)) * 255);
                        data[i + 3] = Math.max(0, Math.min(alpha, data[i + 3]));
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = dataUrl;
        });

    // Upload logo + auto-remove background in one pipeline
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRemovingBg(true);
        const rawReader = new FileReader();
        rawReader.onload = async (ev) => {
            try {
                const transparentBase64 = await removeBackground(ev.target.result);
                
                // Convert base64 back to Blob to upload to server
                const fetchRes = await fetch(transparentBase64);
                const blob = await fetchRes.blob();
                const formData = new FormData();
                formData.append('file', blob, 'logo.png');
                
                const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'bypass-tunnel-reminder': 'true' }
                });
                
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    updateTemplate('logo_url', data.file_url);
                } else {
                    message.error("Failed to upload logo.");
                }
            } catch (err) {
                console.error('Logo process failed:', err);
                message.error("Network error during logo upload.");
            } finally {
                setRemovingBg(false);
                e.target.value = ""; // Reset input
            }
        };
        rawReader.readAsDataURL(file);
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
        
        e.target.value = "";
    };

    const handleCropConfirm = async () => {
        if (!cropperRef.current?.cropper) return;
        setCropModalOpen(false);
        setRemovingSigBg(true);
        
        try {
            const canvas = cropperRef.current.cropper.getCroppedCanvas();
            if (!canvas) {
                setRemovingSigBg(false);
                return;
            }
            
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setRemovingSigBg(false);
                    return;
                }
                const formData = new FormData();
                formData.append("file", blob, "signature.png");
                
                try {
                    const detectRes = await fetch(`${API_BASE_URL}/detect-face/detect-signature`, {
                        method: "POST",
                        body: formData,
                        headers: { "bypass-tunnel-reminder": "true" }
                    });
                    
                    if (detectRes.ok) {
                        const detectData = await detectRes.json();
                        if (detectData?.is_signature && detectData?.processed_url) {
                            updateTemplate("authorized_signature_url", detectData.processed_url);
                            message.success("Signature cropped and background removed successfully.");
                        } else if (detectData?.reason) {
                            message.warning(detectData.reason);
                        }
                    } else {
                        // Fallback to local background removal on cropped canvas if detect fails
                        const dataUrl = canvas.toDataURL("image/png");
                        const transparent = await removeBackground(dataUrl);
                        const fetchRes = await fetch(transparent);
                        const transparentBlob = await fetchRes.blob();
                        
                        const uploadData = new FormData();
                        uploadData.append("file", transparentBlob, "signature.png");
                        
                        const uploadRes = await fetch(`${API_BASE_URL}/uploads`, {
                            method: "POST",
                            body: uploadData,
                            headers: { "bypass-tunnel-reminder": "true" }
                        });
                        
                        if (uploadRes.ok) {
                            const data = await uploadRes.json();
                            updateTemplate("authorized_signature_url", data.file_url);
                            message.success("Signature cropped successfully.");
                        } else {
                            message.error("Failed to upload signature after crop.");
                        }
                    }
                } catch (err) {
                    console.error("Signature upload error:", err);
                    message.error("Network error during signature upload.");
                } finally {
                    setRemovingSigBg(false);
                }
            }, "image/png");
        } catch (err) {
            console.error("Signature crop error:", err);
            setRemovingSigBg(false);
        }
    };

    const handleFrontBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const hide = message.loading('Uploading front template...', 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${API_BASE_URL}/uploads`, {
                method: 'POST',
                body: formData,
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            
            if (res.ok) {
                const data = await res.json();
                updateTemplate('custom_front_bg_url', data.file_url);
                message.success('Front template uploaded!');
            } else {
                message.error('Failed to upload template.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            message.error('Network error during upload.');
        } finally {
            hide();
            e.target.value = ""; // Reset input
        }
    };

    const handleBackBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const hide = message.loading('Uploading back template...', 0);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${API_BASE_URL}/uploads`, {
                method: 'POST',
                body: formData,
                headers: { 'bypass-tunnel-reminder': 'true' }
            });
            
            if (res.ok) {
                const data = await res.json();
                updateTemplate('custom_back_bg_url', data.file_url);
                message.success('Back template uploaded!');
            } else {
                message.error('Failed to upload template.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            message.error('Network error during upload.');
        } finally {
            hide();
            e.target.value = ""; // Reset input
        }
    };

    const getRoleIcon = (role) => {
        const r = (role || "").toLowerCase();
        if (r.includes("student")) return <GraduationCap className="w-8 h-8" />;
        if (r.includes("teacher") || r.includes("faculty")) return <Users className="w-8 h-8" />;
        if (r.includes("it")) return <Cpu className="w-8 h-8" />;
        if (r.includes("registrar")) return <FileText className="w-8 h-8" />;
        if (r.includes("admin")) return <Shield className="w-8 h-8" />;
        if (r.includes("staff")) return <Briefcase className="w-8 h-8" />;
        return <CreditCard className="w-8 h-8" />;
    };

    if (showRoleSelection) {
        const filteredRoles = roles.filter(r =>
            (r.name || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
            <div className="h-full flex flex-col gap-6 p-6 animate-in fade-in duration-500">
                {/* Navy Header */}
                <div className="bg-[var(--bg-sidebar)] p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden shrink-0 transition-all duration-500 border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <CreditCard className="w-64 h-64 -rotate-12 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm">
                                    <CreditCard className="w-4 h-4" style={{stroke: 'white'}} />
                                </div>
                                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                                    ID Card <span className="text-blue-300">Builder</span>
                                </h1>
                                <div className="hidden sm:flex items-center gap-2 ml-3 px-2 py-0.5 bg-white/10 rounded-md border border-white/10 backdrop-blur-sm">
                                    <span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Active roles: {roles.length}</span>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-blue-200/60 font-medium max-w-2xl leading-relaxed">
                                Select a role to design its unique ID card template. Each category can have its own colors, branding, and layout.
                            </p>
                        </div>
                        {/* Search */}
                        <div className="relative w-full md:w-80 group mt-4 md:mt-0">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                                <Search className="w-4 h-4" style={{stroke: 'rgba(255,255,255,0.5)', strokeWidth: '2.5px'}} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl text-[11px] font-bold placeholder:text-white/30 focus:ring-4 focus:ring-blue-400/20 focus:border-blue-400/40 outline-none transition-all backdrop-blur-sm border border-white/15"
                                style={{backgroundColor: 'rgba(255,255,255,0.08)', color: 'white'}}
                            />
                        </div>
                    </div>
                </div>

                {/* Role List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 gap-4 pb-8">
                        {filteredRoles.map((r) => (
                            <button
                                key={r.name}
                                onClick={() => {
                                    setSelectedRole(r.name);
                                    setShowRoleSelection(false);
                                }}
                                className="group w-full relative flex items-center gap-6 p-4 md:p-6 rounded-[1.5rem] bg-[var(--bg-card)] border border-[var(--border-muted)] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-3 transition-all duration-500 shadow-sm shrink-0">
                                    {getRoleIcon(r.name)}
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors tracking-tight mb-1">
                                        {r.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                        <span className="text-[9px] text-slate-400 dark:text-white/20 font-medium">ID Card Template · Last modified: May 15, 2026</span>
                                    </div>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-white/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading && roles.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    const getPreviewId = (role) => {
        // use 0001 as the preview counter for the builder
        return formatExternalId("USER-2026-0001", role);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden system-theme-root">
            {/* Back Button */}
            <div className="flex items-center px-4 pt-4 pb-0 shrink-0">
                <button
                    onClick={() => setShowRoleSelection(true)}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-white/60 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">Back to Categories</span>
                </button>
            </div>

            {/* ── TOP BAR ─────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-white dark:bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[2rem] shadow-sm shrink-0 mt-4 mx-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white">
                        <CreditCard className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a234b] dark:text-white tracking-tight leading-none mb-2">ID Card Builder</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                            <p className="text-sm text-slate-400 dark:text-white/40 font-medium">
                                Editing template for: <span className="text-blue-600 font-bold">{selectedRole}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg ${saveSuccess ? 'bg-green-500 text-white shadow-green-200' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-95'}`}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saveSuccess ? "Successfully Saved" : isSaving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>

            {/* ── MAIN SPLIT VIEW ─────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: SCROLLABLE CONTROLS */}
                <div className="w-96 shrink-0 bg-[#f8fafc] border-r border-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-4">

                    {/* TEMPLATE PICKER */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400   mb-2 flex items-center gap-1.5">
                            <Layout className="w-3 h-3" /> Choose Template
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                            {templatePresets.map((preset) => {
                                const isActive = template.template_style === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => updateTemplate("template_style", preset.id)}
                                        className={`relative p-1.5 rounded-lg border-2 transition-all text-left ${isActive ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100" : "border-transparent bg-white hover:bg-slate-100 hover:border-slate-200"}`}
                                    >
                                        <div className="w-full h-8 rounded-md mb-1 relative overflow-hidden" style={{ background: preset.preview.bg }}>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-tl-md opacity-40" style={{ backgroundColor: preset.preview.accent }} />
                                            <div className="absolute top-1 right-1 opacity-70 text-white scale-50 origin-top-right">{preset.icon}</div>
                                        </div>
                                        <p className={`text-[9px] font-black  truncate ${isActive ? "text-blue-600" : "text-slate-600"}`}>{preset.name}</p>
                                        {isActive && (
                                            <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* CUSTOM BACKGROUNDS (TEMPLATE UPLOADS) */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1.5 ">
                            <ImagePlus className="w-3 h-3" /> Upload Front & Back Background
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {/* FRONT BACKGROUND */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400">Front Template</label>
                                <input
                                    ref={frontTemplateRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFrontBgUpload}
                                    className="hidden"
                                />
                                {template.custom_front_bg_url ? (
                                    <div className="relative group">
                                        <div className="h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                                            <img src={template.custom_front_bg_url} alt="Front" className="h-full object-cover rounded-sm" />
                                        </div>
                                        <button
                                            onClick={() => updateTemplate("custom_front_bg_url", "")}
                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="w-2 h-2" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => frontTemplateRef.current?.click()}
                                        className="w-full h-14 bg-white border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 transition-all"
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* BACK BACKGROUND */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400">Back Template</label>
                                <input
                                    ref={backTemplateRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackBgUpload}
                                    className="hidden"
                                />
                                {template.custom_back_bg_url ? (
                                    <div className="relative group">
                                        <div className="h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                                            <img src={template.custom_back_bg_url} alt="Back" className="h-full object-cover rounded-sm" />
                                        </div>
                                        <button
                                            onClick={() => updateTemplate("custom_back_bg_url", "")}
                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="w-2 h-2" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => backTemplateRef.current?.click()}
                                        className="w-full h-14 bg-white border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 transition-all"
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* INSTITUTION BRANDING — Name, Subtitle, Logo */}
                    <div>

                        <div className="space-y-4">
                            {/* Custom Header */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Top Header (Optional)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative bg-white p-[2px] rounded border border-slate-200 flex items-center justify-center group shadow-sm hover:border-slate-300 transition-colors">
                                            <input
                                                type="color"
                                                value={template.header_color || "#ffffff"}
                                                onChange={(e) => updateTemplate("header_color", e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div
                                                className="w-5 h-3.5 rounded-[1px] border border-slate-100"
                                                style={{ backgroundColor: template.header_color || "#ffffff" }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-300 ml-1">Zoom:</span>
                                        <input
                                            type="range" min="4" max="16" step="0.5"
                                            value={template.header_font_size}
                                            onChange={(e) => updateTemplate("header_font_size", parseFloat(e.target.value))}
                                            className="w-12 h-1 accent-indigo-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={template.header_text}
                                    onChange={(e) => updateTemplate("header_text", e.target.value)}
                                    placeholder="e.g. Republic of the Philippines"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>

                            {/* Institution Name */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Institution Name</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative bg-white p-[2px] rounded border border-slate-200 flex items-center justify-center group shadow-sm hover:border-slate-300 transition-colors">
                                            <input
                                                type="color"
                                                value={template.institution_color || "#ffffff"}
                                                onChange={(e) => updateTemplate("institution_color", e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div
                                                className="w-5 h-3.5 rounded-[1px] border border-slate-100"
                                                style={{ backgroundColor: template.institution_color || "#ffffff" }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-300 ml-1">Zoom:</span>
                                        <input
                                            type="range" min="6" max="24" step="1"
                                            value={template.institution_font_size}
                                            onChange={(e) => updateTemplate("institution_font_size", parseInt(e.target.value))}
                                            className="w-12 h-1 accent-indigo-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={template.institution_name}
                                    onChange={(e) => updateTemplate("institution_name", e.target.value)}
                                    placeholder="e.g. Global Institute"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>

                            {/* Subtitle / Tagline */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Tagline / Subtitle</label>
                                    <div className="flex items-center gap-2">
                                        {template.institution_subtitle && (
                                            <button
                                                onClick={() => updateTemplate("institution_subtitle", "")}
                                                className="text-[9px] font-black text-red-400 hover:text-red-600 transition-colors  "
                                            >
                                                Remove
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="relative bg-white p-[2px] rounded border border-slate-200 flex items-center justify-center group shadow-sm hover:border-slate-300 transition-colors">
                                                <input
                                                    type="color"
                                                    value={template.subtitle_color || "#ffffff"}
                                                    onChange={(e) => updateTemplate("subtitle_color", e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div
                                                    className="w-5 h-3.5 rounded-[1px] border border-slate-100"
                                                    style={{ backgroundColor: template.subtitle_color || "#ffffff" }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 ml-1">Zoom:</span>
                                            <input
                                                type="range" min="4" max="14" step="0.5"
                                                value={template.subtitle_font_size}
                                                onChange={(e) => updateTemplate("subtitle_font_size", parseFloat(e.target.value))}
                                                className="w-12 h-1 accent-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={template.institution_subtitle}
                                    onChange={(e) => updateTemplate("institution_subtitle", e.target.value)}
                                    placeholder="e.g. Empowering Excellence"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-500 outline-none focus:border-indigo-400 transition-colors"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black text-slate-400  ">Logo Image</label>
                                    {template.logo_url && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] font-bold text-slate-300">Zoom:</span>
                                            <input
                                                type="range" min="20" max="80" step="2"
                                                value={template.logo_size}
                                                onChange={(e) => updateTemplate("logo_size", parseInt(e.target.value))}
                                                className="w-12 h-1 accent-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                {removingBg ? (
                                    /* Processing state — AI is stripping the background */
                                    <div className="flex flex-col items-center justify-center gap-2 p-4 bg-violet-50 border-2 border-violet-200 border-dashed rounded-lg">
                                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                                        <p className="text-[10px] font-black text-violet-500  ">Removing Background…</p>
                                        <p className="text-[9px] text-violet-300 font-bold ">AI is processing your logo</p>
                                    </div>
                                ) : template.logo_url ? (
                                    <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                        {/* Checkerboard shows transparency clearly */}
                                        <div className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden shrink-0"
                                            style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 0 0 / 8px 8px' }}>
                                            <img src={template.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-green-600 ">BG removed ✓</p>
                                            <button
                                                onClick={() => updateTemplate('logo_url', '')}
                                                className="text-[9px] text-slate-400 hover:text-red-500 font-bold  flex items-center gap-0.5 mt-0.5 transition-colors"
                                            >
                                                <X className="w-2.5 h-2.5" /> Remove
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            className="text-[9px] font-black text-blue-500 hover:text-blue-700 "
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => logoInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                    >
                                        <ImagePlus className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-[11px] font-black text-slate-300 group-hover:text-blue-400  transition-colors">Upload Logo</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* ORIENTATION */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400   mb-1.5">Orientation</p>
                        <div className="flex gap-1.5">
                            {[
                                { val: "portrait", icon: <MoveVertical className="w-3 h-3" />, label: "Portrait" },
                                { val: "landscape", icon: <MoveHorizontal className="w-3 h-3" />, label: "Landscape" },
                            ].map((o) => (
                                <button
                                    key={o.val}
                                    onClick={() => updateTemplate("orientation", o.val)}
                                    className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center gap-1.5 transition-all text-[11px] font-black ${template.orientation === o.val ? "bg-[#1a234b] border-[#1a234b] text-white" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                                >
                                    {o.icon} {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* BRAND COLORS */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400   mb-1.5 flex items-center gap-1.5">
                            <Palette className="w-3 h-3" /> Brand Colors
                        </p>
                        <div className="space-y-2">
                            {[
                                { key: "primary_color", label: "Primary Color" },
                                { key: "secondary_color", label: "Secondary Color" },
                            ].map((c) => (
                                <div key={c.key}>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block">{c.label}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={template[c.key]} onChange={(e) => updateTemplate(c.key, e.target.value)} className="w-7 h-7 rounded-md border-none p-0 cursor-pointer overflow-hidden shadow" />
                                        <input type="text" value={template[c.key]} onChange={(e) => updateTemplate(c.key, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[12px] font-black text-[#1a234b] outline-none " />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* FRONT ELEMENTS */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400   mb-1.5 flex items-center gap-1.5">
                            <Eye className="w-3 h-3" /> Front Card Elements
                        </p>
                        <div className="space-y-1.5">
                            {[
                                { key: "show_avatar", label: "Profile Photo" },
                                { key: "show_qr", label: "QR Code" },
                                { key: "show_id_number", label: "ID Number" },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => updateTemplate(item.key, !template[item.key])}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <span className="text-[11px] font-black text-slate-600 ">{item.label}</span>
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 flex items-center ${template[item.key] ? "bg-indigo-600" : "bg-slate-300"}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${template[item.key] ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* USER INFO STYLES */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Type className="w-3 h-3" /> User Info Styles
                        </p>
                        <div className="space-y-1.5">
                            {[
                                { key: "name_color", label: "Name Color", defaultSize: 24, min: 12, max: 40 },
                                { key: "role_color", label: "Role Color", defaultSize: 10, min: 6, max: 20 },
                                { key: "id_number_color", label: "ID Number Color", defaultSize: 9, min: 6, max: 16 },
                            ].map((item) => (
                                <div key={item.key} className="flex flex-col gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-600 ">{item.label}</span>
                                        <div className="relative bg-white p-[2px] rounded border border-slate-200 flex items-center justify-center group shadow-sm hover:border-slate-300 transition-colors">
                                            <input
                                                type="color"
                                                value={template[item.key] || "#ffffff"}
                                                onChange={(e) => updateTemplate(item.key, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div
                                                className="w-5 h-3.5 rounded-[1px] border border-slate-100"
                                                style={{ backgroundColor: template[item.key] || "#ffffff" }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                                        <span className="text-[9px] font-bold text-slate-300">Size:</span>
                                        <input
                                            type="range" min={item.min} max={item.max} step="0.5"
                                            value={template[item.key.replace("_color", "_font_size")] || item.defaultSize}
                                            onChange={(e) => updateTemplate(item.key.replace("_color", "_font_size"), parseFloat(e.target.value))}
                                            className="flex-1 h-1 accent-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-[9px] font-black text-slate-400 w-6 text-right">
                                            {Math.round(template[item.key.replace("_color", "_font_size")] || item.defaultSize)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* BACK SIDE */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" /> Back Side Details
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block">Authorized Signatory Name</label>
                                <input
                                    type="text"
                                    value={template.authorized_name || ""}
                                    onChange={(e) => updateTemplate("authorized_name", e.target.value)}
                                    placeholder="e.g. Maria Clara"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block">Signature Label / Title</label>
                                <input
                                    type="text"
                                    value={template.signature_label || ""}
                                    onChange={(e) => updateTemplate("signature_label", e.target.value)}
                                    placeholder="e.g. University Registrar"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block">Terms & Conditions / Back Content</label>
                                <textarea
                                    value={template.back_content || ""}
                                    onChange={(e) => updateTemplate("back_content", e.target.value)}
                                    placeholder="This card is the property of the issuing institution..."
                                    rows="3"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block">Registrar Signature Image</label>
                                    <input
                                        ref={signatureRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload}
                                        className="hidden"
                                    />
                                    {removingSigBg ? (
                                        <div className="flex flex-col items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                            <span className="text-[6px] font-black text-blue-400 mt-1">Processing...</span>
                                        </div>
                                    ) : template.authorized_signature_url ? (
                                        <div className="relative group">
                                            <div className="h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                                                <img src={template.authorized_signature_url} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                            </div>
                                            <button
                                                onClick={() => updateTemplate("authorized_signature_url", "")}
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <X className="w-2 h-2" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => signatureRef.current?.click()}
                                            className="w-full h-12 bg-white border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-200 transition-all"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="space-y-1 bg-white p-2 border border-slate-100 rounded-lg">
                                    <div className="flex items-center justify-between mb-1 text-[10px] font-black text-slate-400">
                                        <label>Issue Date Label</label>
                                        <input type="checkbox" checked={template.show_issue_date ?? true} onChange={(e) => updateTemplate("show_issue_date", e.target.checked)} className="cursor-pointer" />
                                    </div>
                                    <select value={template.issue_date_label || "Issue Date"} onChange={(e) => updateTemplate("issue_date_label", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-400 transition-colors">
                                        <option value="Issue Date">Issue Date</option>
                                        <option value="Date Joined">Date Joined</option>
                                        <option value="Joined">Joined</option>
                                        <option value="Member Since">Member Since</option>
                                    </select>
                                </div>
                                <div className="space-y-1 bg-white p-2 border border-slate-100 rounded-lg">
                                    <div className="flex items-center justify-between mb-1 text-[10px] font-black text-slate-400">
                                        <label>Expiry Date Label</label>
                                        <input type="checkbox" checked={template.show_expiry_date ?? true} onChange={(e) => updateTemplate("show_expiry_date", e.target.checked)} className="cursor-pointer" />
                                    </div>
                                    <select value={template.expiry_date_label || "Valid Until"} onChange={(e) => updateTemplate("expiry_date_label", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-black text-slate-600 outline-none focus:border-indigo-400 transition-colors">
                                        <option value="Valid Until">Valid Until</option>
                                        <option value="Expires">Expires</option>
                                        <option value="Expire Date">Expire Date</option>
                                        <option value="Valid Thru">Valid Thru</option>
                                        <option value="Expired Date">Expired Date</option>
                                    </select>
                                </div>
                            </div>

                            {template.show_expiry_date && (
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block">Expiry Date Value (e.g. +3 Years, Fixed Date, or empty)</label>
                                <input
                                    type="text"
                                    value={template.expiry_date_value || ""}
                                    onChange={(e) => updateTemplate("expiry_date_value", e.target.value)}
                                    placeholder="Leave empty for auto calculate"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-[#1a234b] outline-none"
                                />
                            </div>
                            )}

                            <button
                                onClick={() => updateTemplate("show_barcode", !template.show_barcode)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-[11px] font-black text-slate-600 ">Show Barcode</span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${template.show_barcode ? "bg-indigo-600" : "bg-slate-300"}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${template.show_barcode ? "translate-x-4" : "translate-x-0"}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => updateTemplate("show_user_signature", !template.show_user_signature)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-[11px] font-black text-slate-600 ">Show Cardholder Signature</span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${template.show_user_signature ? "bg-indigo-600" : "bg-slate-300"}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${template.show_user_signature ? "translate-x-4" : "translate-x-0"}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: LIVE ID PREVIEW (Dual View) */}
                <div className="flex-1 bg-slate-100/60 overflow-y-auto custom-scrollbar flex flex-col items-center py-10 relative">
                    {/* dot grid */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(#1a234b 1px, transparent 0)", backgroundSize: "20px 20px" }} />


                    <div className="print-mode flex flex-row gap-8 items-start justify-center w-full px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 flex-wrap">
                        {/* FRONT SIDE */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#1a234b] text-white rounded-full text-[10px] font-black shadow-lg ring-4 ring-[#1a234b]/10">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                FRONT SIDE
                            </div>
                            <div className="relative z-10 transition-transform duration-300 origin-top no-dark" style={{ transform: "scale(0.85)" }}>
                                <IDCard user={{ ...previewUser, external_id: getPreviewId(selectedRole), role_context: selectedRole }} template={template} side="front" />
                            </div>
                        </div>

                        {/* BACK SIDE */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-600 text-white rounded-full text-[10px] font-black shadow-lg ring-4 ring-slate-600/10">
                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
                                BACK SIDE
                            </div>
                            <div className="relative z-10 transition-transform duration-300 origin-top no-dark" style={{ transform: "scale(0.85)" }}>
                                <IDCard user={{ ...previewUser, external_id: getPreviewId(selectedRole), role_context: selectedRole }} template={template} side="back" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white/20">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-[#1a234b]">Adjust Signature</h3>
                            <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-black/5 relative w-full h-[300px]">
                            <Cropper
                                src={cropImageSrc}
                                style={{ height: "100%", width: "100%" }}
                                initialAspectRatio={NaN}
                                guides={true}
                                ref={cropperRef}
                                viewMode={1}
                                dragMode="move"
                                background={false}
                                responsive={true}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                            <p className="text-[10px] text-slate-500 font-medium">Use mouse wheel/pinch to zoom. Drag to place.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button onClick={handleCropConfirm} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                                    <Save className="w-3.5 h-3.5" /> Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IDBuilder;
