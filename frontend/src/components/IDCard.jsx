import React from 'react';
import { ShieldCheck, BadgeCheck, Award, Building2, GraduationCap } from 'lucide-react';
import { QRCode } from "react-qr-code";
import { API_BASE_URL } from '../config';
import { formatExternalId } from '../utils/idFormatter';

const IDCard = ({ user, template, side = "front" }) => {
    if (!user || !template) return null;

    const isFront = side === "front";

    const isPortrait = template.orientation !== "landscape";
    const style = template.template_style || "corporate";

    const displayName = user.name || "Alex Johnson";
    const displayRole = user.role_context || "Representative";
    const displayID = formatExternalId(user.external_id, displayRole);
    const resolveImageUrl = (url) => {
        if (!url) return url;
        if (typeof url === 'string') {
            // If it's already a relative static path
            if (url.startsWith('/static')) {
                return `${API_BASE_URL}${url}`;
            }
            // If it's an absolute URL but points to our static directory (possibly on an old tunnel domain)
            if (url.includes('/static/') && url.startsWith('http')) {
                const path = '/static/' + url.split('/static/').pop();
                return `${API_BASE_URL}${path}`;
            }
        }
        return url;
    };

    const avatar = resolveImageUrl(user.attributes?.id_picture || user.avatar_url) || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";

    const institutionName = template.institution_name !== undefined ? template.institution_name : "Global Institute";
    const institutionSubtitle = template.institution_subtitle !== undefined ? template.institution_subtitle : "Empowering Excellence";
    const logoUrl = resolveImageUrl(template.logo_url) || "";

    // Reusable header brand block rendered inside each template
    const BrandHeader = ({ light = true, compact = false }) => {
        const headerText = template.header_text !== undefined && template.header_text !== null ? template.header_text : "Republic of the Philippines";
        const instName = template.institution_name !== undefined && template.institution_name !== null ? template.institution_name : "Philceb Innovation";
        const instSub = template.institution_subtitle !== undefined && template.institution_subtitle !== null ? template.institution_subtitle : "Empowering Technology";

        const hSize = template.header_font_size || (compact ? 5 : 6);
        const iSize = template.institution_font_size || (compact ? 10 : 12);
        const sSize = template.subtitle_font_size || (compact ? 6 : 7);
        const lSize = template.logo_size || (compact ? 36 : 48);

        // Helper to ensure visibility: If we are on a light background (light=false) 
        // and the user has chosen a white/very light color, we switch to a dark variant.
        const getAutoColor = (customColor, defaultLight, defaultDark) => {
            if (!customColor) return light ? defaultLight : defaultDark;

            // Simple check: if we are in "Dark Text" mode (light=false) and the color is white
            if (!light && (customColor.toLowerCase() === '#ffffff' || customColor.toLowerCase() === 'white')) {
                return defaultDark;
            }
            return customColor;
        };

        return (
            <div className={`flex items-center gap-3 ${compact ? "" : "flex-col"}`}>
                {logoUrl && (
                    <img
                        src={logoUrl}
                        alt="Logo"
                        className={`object-contain drop-shadow-sm`}
                        style={{ width: `${lSize}px`, height: `${lSize}px` }}
                    />
                )}
                <div className={compact ? "text-left" : "text-center"}>
                    {/* Header Line - Republic of the Philippines */}
                    <p
                        className={`font-black tracking-wider leading-none mb-1`}
                        style={{
                            fontSize: `${hSize}px`,
                            color: getAutoColor(template.header_color, "#ffffff99", "#64748b99")
                        }}
                    >
                        {headerText}
                    </p>
                    {/* Institution Name - Philceb Innovation */}
                    <p
                        className={`font-black tracking-wide leading-tight`}
                        style={{
                            fontSize: `${iSize}px`,
                            color: getAutoColor(template.institution_color, "#ffffff", "#1e1b4b")
                        }}
                    >
                        {instName}
                    </p>
                    {/* Subtitle - Empowering Technology */}
                    {instSub && (
                        <p
                            className={`font-bold tracking-wider leading-none mt-1`}
                            style={{
                                fontSize: `${sSize}px`,
                                color: getAutoColor(template.subtitle_color, "#ffffff80", "#64748b")
                            }}
                        >
                            {instSub}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const qrPayload = JSON.stringify({
        id: displayID,
        name: displayName,
        role: displayRole,
        sys_id: user.id || "preview"
    });

    const primary = template.primary_color || "#1a234b";
    const secondary = template.secondary_color || "#2563eb";

    // Helper to ensure text remains visible on light backgrounds
    const ensureContrast = (color) => {
        if (color && (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white")) {
            return "#1e293b"; // Fallback to dark if user picked white for a light-background template
        }
        return color;
    };

    // Helper: returns lightVariant when bg is dark (custom color set), darkVariant when bg is light/white
    // customColor: the user-set color field (e.g. template.header_color)
    // lightVariant: default value when bg is dark (e.g. "rgba(255,255,255,0.6)")
    // darkVariant: default value when bg is light (e.g. "#64748b99")
    const getAutoColor = (customColor, lightVariant, darkVariant) => {
        const isDarkBg = !!template.custom_front_bg_url || style === "modern" || style === "bold";
        if (customColor && customColor !== "" && customColor !== "#ffffff" && customColor !== "white") {
            return customColor;
        }
        return isDarkBg ? lightVariant : darkVariant;
    };

    const formatDate = (d) => {
        if (!d) return "";
        try {
            return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch(e) { return d; }
    };

    const issueDateStr = formatDate(user.created_at || new Date());
    const expiryDateStr = (() => {
        if (template.expiry_date_value) {
            let val = template.expiry_date_value.trim();
            if (val.toLowerCase().startsWith('+')) {
                const parts = val.toLowerCase().split(' ');
                const num = parseInt(parts[0].replace('+', ''), 10);
                const unit = parts[1] || '';
                let exp = new Date(user.created_at || new Date());
                if (unit.includes('year')) exp.setFullYear(exp.getFullYear() + num);
                else if (unit.includes('month')) exp.setMonth(exp.getMonth() + num);
                return formatDate(exp);
            }
            return val;
        }
        let autoExp = new Date(user.created_at || new Date());
        autoExp.setFullYear(autoExp.getFullYear() + 4);
        return formatDate(autoExp);
    })();

    const CardDatesUI = ({ isDarkBg = false, className = "" }) => {
        if (!template.show_issue_date && !template.show_expiry_date) return null;
        const mainColor = isDarkBg ? "#ffffff" : "#1e293b";
        const subColor = isDarkBg ? "rgba(255,255,255,0.6)" : "#94a3b8";
        return (
            <div className={`flex justify-center w-full relative z-10 ${isPortrait ? 'gap-8 py-3' : 'gap-4 py-0'} ${className}`}>
                {template.show_issue_date && (
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: subColor }}>{template.issue_date_label || "Issue Date"}</span>
                        <span className="text-[11px] font-bold" style={{ color: mainColor }}>{issueDateStr}</span>
                    </div>
                )}
                {template.show_expiry_date && (
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: subColor }}>{template.expiry_date_label || "Valid Until"}</span>
                        <span className="text-[11px] font-bold" style={{ color: mainColor }}>{expiryDateStr}</span>
                    </div>
                )}
            </div>
        );
    };

    const EmergencyContactUI = ({ isDarkBg = false, className = "" }) => {
        const gName = user.attributes?.["Guardian Full Name"] || user.attributes?.["Guardian Name"];
        const gAddress = user.attributes?.["Guardian Address"];
        const gPhone = user.attributes?.["Guardian Mobile Number"] || user.attributes?.["Guardian Contact Number"];

        if (!gName && !gPhone && !gAddress) return null;

        const mainColor = isDarkBg ? "#ffffff" : "#1e293b";
        const subColor = isDarkBg ? "rgba(255,255,255,0.6)" : "#64748b";

        return (
            <div className={`flex flex-col items-start w-full text-left relative z-10 ${isPortrait ? 'px-8 py-2' : 'px-4 py-0'} ${className}`}>
                <span className="text-[9px] font-black tracking-[1px] uppercase mb-1 opacity-70 block" style={{ color: subColor }}>
                    In case of emergency, please contact:
                </span>
                <div className="flex flex-col items-start w-full">
                    {gName && <span className="text-[10.5px] font-bold leading-tight tracking-wide block" style={{ color: mainColor }}>{gName}</span>}
                    {gAddress && <span className="text-[10.5px] font-bold leading-tight tracking-wide mt-0.5 block max-w-full" style={{ color: mainColor }}>{gAddress}</span>}
                    {gPhone && <span className="text-[10.5px] font-bold leading-tight tracking-wide mt-0.5 block" style={{ color: mainColor }}>{gPhone}</span>}
                </div>
            </div>
        );
    };

    // ── CORPORATE TEMPLATE ──────────────────────────────
    if (style === "corporate") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100">
                        {/* Header Section - Increased height to 200px for better font-size flexibility */}
                        <div className="h-[200px] relative flex flex-col items-center pt-6 overflow-hidden" style={{ backgroundColor: primary }}>
                            {template.custom_front_bg_url ? (
                                <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/40 to-transparent z-10 pointer-events-none" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${secondary}20 10px, ${secondary}20 20px)` }} />
                            )}
                            <div className="relative z-10 px-4 w-full">
                                <BrandHeader light={true} compact={false} />
                            </div>
                        </div>

                        {/* Avatar overlap - Adjusted to maintain clean spacing */}
                        {template.show_avatar && (
                            <div className="flex justify-center -mt-[65px] relative z-20">
                                <div className="w-[130px] h-[130px] rounded-full ring-[6px] ring-white overflow-hidden shadow-2xl bg-white">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col items-center pt-6 px-8 text-center">
                            <h3 className="font-black tracking-tight leading-tight mb-1" style={{ fontSize: `${template.name_font_size || 24}px`, color: template.name_color || primary }}>{displayName}</h3>
                            <div className="h-[2px] w-8 rounded-full mb-3" style={{ backgroundColor: secondary }} />
                            <p className="font-black tracking-[3px] uppercase" style={{ fontSize: `${template.role_font_size || 11}px`, color: template.role_color || secondary }}>{displayRole}</p>

                            <div className="w-full border-t border-slate-50 mt-auto mb-4" />
                        </div>

                        {/* Footer Section */}
                        <div className="px-8 pb-8 flex items-end justify-between">
                            {template.show_qr && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-110">
                                    <QRCode value={qrPayload} size={80} fgColor={primary} />
                                </div>
                            )}
                            {template.show_id_number && (
                                <div className="text-right">
                                    <span className="text-[8px] font-black text-slate-300 tracking-[3px] uppercase mb-1 block">ID Number</span>
                                    <span className="font-black tracking-[3px]" style={{ fontSize: `${template.id_number_font_size || 11}px`, color: template.id_number_color || primary }}>{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[24px] shadow-2xl relative overflow-hidden flex bg-white border border-slate-100">
                        <div className="w-[40px] h-full shrink-0" style={{ backgroundColor: primary }} />
                        <div className="flex-1 flex items-center p-8 gap-8 relative overflow-hidden">
                            {template.custom_front_bg_url && (
                                <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent pointer-events-none" />
                                </div>
                            )}
                            <div className="absolute top-6 left-8 z-20">
                                <BrandHeader light={false} compact={true} />
                            </div>

                            {template.show_avatar && (
                                <div className="w-[140px] h-[140px] rounded-2xl overflow-hidden shadow-xl shrink-0 ring-4 ring-slate-50 relative z-10 bg-white mt-12">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col h-full pt-28 pb-6 relative z-10">
                                <h3 className="font-black tracking-tight leading-none mb-1" style={{ fontSize: `${template.name_font_size || 24}px`, color: template.custom_front_bg_url ? (template.name_color || primary) : ensureContrast(template.name_color || primary) }}>{displayName}</h3>
                                <p className="font-bold tracking-wider mb-auto" style={{ fontSize: `${template.role_font_size || 10}px`, color: template.custom_front_bg_url ? (template.role_color || secondary) : ensureContrast(template.role_color || secondary) }}>{displayRole}</p>
                                <div className="flex items-end justify-between mt-4">
                                    {template.show_id_number && (
                                        <div>
                                            <span className="text-[7px] font-black tracking-wider block" style={{ color: template.custom_front_bg_url ? "rgba(255,255,255,0.4)" : "#cbd5e1" }}>ID Number</span>
                                            <span className="font-black tracking-[3px]" style={{ fontSize: `${template.id_number_font_size || 9}px`, color: template.custom_front_bg_url ? (template.id_number_color || primary) : ensureContrast(template.id_number_color || primary) }}>{displayID}</span>
                                        </div>
                                    )}
                                    {template.show_qr && (
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <QRCode value={qrPayload} size={62} fgColor={ensureContrast(primary)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - CORPORATE (MATCHING IMAGE 100%)
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100`}>
                    <div className={`shrink-0 ${isPortrait ? "h-14" : "h-10"} relative overflow-hidden`} style={{ backgroundColor: primary }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${secondary}20 10px, ${secondary}20 20px)` }} />
                    </div>

                    <div className={`flex-1 flex flex-col items-center text-center relative overflow-hidden ${isPortrait ? 'p-8' : 'px-4 py-2'}`}>
                        {template.custom_back_bg_url && (
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                                <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent pointer-events-none" />
                            </div>
                        )}

                        {/* Dynamic text color for back side */}
                        {(() => {
                            const isBackDark = !!template.custom_back_bg_url;
                            const mainColor = isBackDark ? "#ffffff" : "#0f172a";
                            const subColor = isBackDark ? "rgba(255,255,255,0.6)" : "#64748b";
                            const accentColor = isBackDark ? "#ffffffcc" : "#334155"; // Soft black for signature labels

                            return (
                                <>
                                    <div className={`w-full flex-shrink-0 relative z-10 ${isPortrait ? 'mb-8' : 'mb-1'} px-6 mt-4`}>
                                        <div className={`w-full rounded-[14px] ${isBackDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50/80 border border-slate-100'} p-3 flex flex-col items-center justify-center`}>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: mainColor }}>Terms and Conditions</h5>
                                            <p className={`text-[9px] font-bold ${isPortrait ? 'leading-relaxed' : 'leading-tight'} text-center`} style={{ color: subColor }}>
                                                {template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`w-full relative z-10 ${isPortrait ? 'mt-auto space-y-6' : 'mt-4 space-y-2'}`}>
                                        <div className={`flex flex-col w-full ${isPortrait ? 'gap-4' : 'gap-1'}`}>
                                            <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                            <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                                        </div>
                                        <div className="flex justify-between items-end w-full px-2">
                                            {/* Left Signature */}
                                            <div className="flex flex-col items-center flex-1">
                                                {(user.attributes?.signature || user.signature_url) ? (
                                                    <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                                        <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain mix-blend-multiply brightness-110 contrast-125" />
                                                    </div>
                                                ) : (
                                                    <div className={`${isPortrait ? 'h-10' : 'h-6'}`} />
                                                )}
                                                <span className={`font-black tracking-tight block px-2 whitespace-nowrap ${isPortrait ? 'text-[9px] pt-2' : 'text-[9px] pt-1'}`} style={{ color: mainColor }}>
                                                    {displayName}
                                                </span>
                                                <div className="w-32 h-[1px] my-0.5" style={{ backgroundColor: isBackDark ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)" }} />
                                                <span className="text-[8.5px] font-black tracking-[1px]" style={{ color: accentColor }}>{displayRole}'s Signature</span>
                                            </div>

                                            {/* Right Signature */}
                                            <div className="flex flex-col items-center flex-1">
                                                {template.authorized_signature_url ? (
                                                    <div className={`relative z-20 ${isPortrait ? 'h-18 mb-[-18px]' : 'h-12 mb-[-12px]'}`}>
                                                        <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Signature" className="h-full object-contain mix-blend-multiply brightness-110 contrast-125" />
                                                    </div>
                                                ) : (
                                                    <div className={`${isPortrait ? 'h-10' : 'h-6'}`} />
                                                )}
                                                <span className={`font-black tracking-tight block px-2 whitespace-nowrap ${isPortrait ? 'text-[9px] pt-2' : 'text-[9px] pt-1'}`} style={{ color: mainColor }}>
                                                    {template.authorized_name || "Registrar"}
                                                </span>
                                                <div className="w-32 h-[1px] my-0.5" style={{ backgroundColor: isBackDark ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)" }} />
                                                <span className="text-[8.5px] font-black tracking-[1px]" style={{ color: accentColor }}>{template.signature_label || "Authorized Signature"}</span>
                                            </div>
                                        </div>

                                        {template.show_barcode && (
                                            <div className={`flex flex-col items-center w-full border-t relative z-10 ${isPortrait ? 'gap-1.5 pt-4' : 'gap-0 pt-1'}`} style={{ borderColor: isBackDark ? "rgba(255,255,255,0.1)" : "rgba(241,245,249,1)" }}>
                                                <div className={`w-full max-w-[240px] ${isPortrait ? 'h-12' : 'h-6'}`} style={{ backgroundImage: `repeating-linear-gradient(90deg, ${isBackDark ? '#ffffff20' : '#e2e8f0'} 0, ${isBackDark ? '#ffffff20' : '#e2e8f0'} 1px, transparent 1px, transparent 3px, ${isBackDark ? '#ffffff40' : '#cbd5e1'} 3px, ${isBackDark ? '#ffffff40' : '#cbd5e1'} 5px, transparent 5px, transparent 8px)` }} />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] font-mono font-black tracking-[4px] uppercase" style={{ color: isBackDark ? "rgba(255,255,255,0.4)" : "#cbd5e1" }}>
                                                        BPC {new Date().getFullYear()} - {displayID.toString().slice(-4).padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            );
        }
    }

    // ── MODERN TEMPLATE ─────────────────────────────────
    if (style === "modern") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100">
                        <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col items-center pt-12 px-8">
                            <div className="items-center mb-8 text-center">
                                <p
                                    className="font-black tracking-[3px] uppercase mb-1"
                                    style={{ fontSize: '8px', color: getAutoColor(template.header_color, "rgba(255,255,255,0.6)", "#64748b99") }}
                                >
                                    {template.header_text || "Republic of the Philippines"}
                                </p>
                                <p
                                    className="text-xl font-black tracking-tight leading-none"
                                    style={{ color: getAutoColor(template.institution_color, "#ffffff", "#1e1b4b") }}
                                >
                                    {template.institution_name || "Philceb Innovation"}
                                </p>
                                <p
                                    className="font-bold tracking-widest mt-1 uppercase"
                                    style={{ fontSize: '9px', color: getAutoColor(template.institution_subtitle, "rgba(255,255,255,0.5)", "#64748b80") }}
                                >
                                    {template.institution_subtitle || "Empowering Technology"}
                                </p>
                            </div>

                            {template.show_avatar && (
                                <div className="w-40 h-40 rounded-[48px] overflow-hidden border-4 border-white/20 shadow-2xl mb-8 shrink-0 relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {template.custom_front_bg_url && (
                                <div className="absolute inset-0 z-0">
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                                </div>
                            )}

                            <div className="items-center mb-auto text-center">
                                <h3 className={`font-black tracking-tight leading-tight ${!template.name_font_size ? "text-2xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || getAutoColor(null, "#ffffff", "#1e1b4b") }}>{displayName}</h3>
                                <div className="bg-white/10 px-4 py-1.5 rounded-full mt-3 border border-white/10 inline-block mb-auto">
                                    <p className="font-black tracking-widest uppercase" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || getAutoColor(null, "#ffffff", "#1e1b4b") }}>{displayRole}</p>
                                </div>
                            </div>

                            <div className="w-full flex items-end justify-between pb-10">
                                {template.show_qr && (
                                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                                        <QRCode value={qrPayload} size={88} fgColor={primary} />
                                    </div>
                                )}
                                {template.show_id_number && (
                                    <div className="text-right">
                                        <span className="text-white/40 text-[8px] font-black tracking-widest uppercase block mb-1">ID Number</span>
                                        <span className="font-black tracking-[4px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "16px", color: template.id_number_color || "#ffffff" }}>{displayID}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            } else {
                // LANDSCAPE - MODERN
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[32px] shadow-2xl relative overflow-hidden flex bg-white border border-slate-100">
                        {/* Gradient background */}
                        <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />
                        </div>
                        {/* Blended background image */}
                        {template.custom_front_bg_url && (
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent pointer-events-none" />
                            </div>
                        )}
                        {/* Branding top-left */}
                        <div className="absolute top-6 left-8 z-20">
                            <BrandHeader light={true} compact={true} />
                        </div>
                        {/* Avatar */}
                        {template.show_avatar && (
                            <div className="w-[140px] h-[140px] rounded-[32px] overflow-hidden shadow-2xl shrink-0 ring-4 ring-white/20 relative z-10 bg-white mt-auto mb-auto ml-8">
                                <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {/* User info */}
                        <div className="flex-1 flex flex-col h-full pt-28 pb-6 px-6 relative z-10">
                            <h3 className="font-black tracking-tight leading-none mb-1" style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : "24px", color: template.name_color || "#ffffff" }}>{displayName}</h3>
                            <div className="bg-white/10 px-3 py-1 rounded-full mt-2 border border-white/10 inline-block self-start mb-auto">
                                <p className="font-black tracking-widest uppercase" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || "rgba(255,255,255,0.85)" }}>{displayRole}</p>
                            </div>
                            <div className="flex items-end justify-between mt-auto">
                                {template.show_id_number && (
                                    <div>
                                        <span className="text-[7px] font-black tracking-wider block text-white/40">ID Number</span>
                                        <span className="font-black tracking-[3px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "9px", color: template.id_number_color || "#ffffff" }}>{displayID}</span>
                                    </div>
                                )}
                                {template.show_qr && (
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <QRCode value={qrPayload} size={62} fgColor={primary} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - MODERN
            if (isPortrait) {
                return (
                    <div id="digital-id-card-back" className="w-[320px] h-[500px] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100">
                        <div className="h-4 w-full" style={{ backgroundColor: primary }} />
                        <div className="flex-1 p-10 flex flex-col items-center">
                            <div className="mb-10 text-center">
                                <h4 className="text-[12px] font-black tracking-[4px] uppercase mb-4" style={{ color: primary }}>Official Usage</h4>
                                <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto" />
                            </div>

                            <p className="text-slate-400 text-[10px] leading-relaxed font-bold tracking-wide text-center italic mb-auto px-4">
                                "{template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office. Unauthorized use is subject to legal action and immediate revocation of system access."}"
                            </p>

                            <div className="w-full space-y-6 mb-4">
                                <div className="flex flex-col gap-3 w-full">
                                    <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                    <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                                </div>
                                <div className="flex justify-between items-end w-full px-2">
                                    {/* Left Signature */}
                                    <div className="flex flex-col items-center flex-1 px-2 relative">
                                        <div className="w-full h-18 flex items-end justify-center relative">
                                            {(user.attributes?.signature || user.signature_url) && (
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="absolute bottom-[-8px] w-full h-[85px] object-contain mix-blend-multiply" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black mb-1 relative z-10" style={{ color: primary }}>{displayName}</span>
                                        <div className="w-full h-[1px] bg-slate-200" />
                                        <span className="text-[9px] font-black text-slate-400 mt-1 whitespace-nowrap">{displayRole}'s Signature</span>
                                    </div>
                                    {/* Right Signature */}
                                    <div className="flex flex-col items-center flex-1 px-2 relative">
                                        <div className="w-full h-18 flex items-end justify-center relative">
                                            {template.authorized_signature_url && (
                                                <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Authorized Signature" className="absolute bottom-[-8px] w-full h-[85px] object-contain mix-blend-multiply" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black mb-1 relative z-10" style={{ color: primary }}>{template.authorized_name || "Registrar"}</span>
                                        <div className="w-full h-[1px] bg-slate-200" />
                                        <span className="text-[9px] font-black text-slate-400 mt-1 whitespace-nowrap">{template.signature_label || "Authorized Signature"}</span>
                                    </div>
                                </div>

                                {template.show_barcode && (
                                    <div className="flex flex-col items-center opacity-30">
                                        <div className="flex gap-[2px] h-10 w-full justify-center items-end">
                                            {[1, 2, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 2].map((w, i) => (
                                                <div key={i} style={{ width: `${w}px`, backgroundColor: '#000', height: '100%' }} />
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-mono tracking-[6px] mt-2 text-slate-400 uppercase">{displayID}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            } else {
                // LANDSCAPE BACK - MODERN
                const isBackDark = !!template.custom_back_bg_url;
                const textCol = isBackDark ? "#ffffff" : "#1e293b";
                const subCol = isBackDark ? "rgba(255,255,255,0.55)" : "#64748b";
                return (
                    <div id="digital-id-card-back" className="w-[500px] h-[320px] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100">
                        {/* Back background */}
                        {template.custom_back_bg_url ? (
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }} />
                        )}
                        {/* Gradient accent top bar */}
                        <div className="h-10 w-full shrink-0 relative z-10" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />

                        <div className="flex-1 p-8 flex flex-col items-center text-center relative z-10">
                            <div className="mb-8 w-full">
                                <h4 className="text-[10px] font-black tracking-[3px] uppercase mb-2" style={{ color: primary }}>Official Usage</h4>
                                <div className="w-8 h-[2px] rounded-full mb-3 mx-auto" style={{ backgroundColor: secondary }} />
                                <p className="text-[9px] leading-relaxed font-bold tracking-wide italic px-6" style={{ color: subCol }}>
                                    "{template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office."}"
                                </p>
                            </div>

                            <div className="mt-auto w-full space-y-8">
                                <div className="flex flex-col gap-4 w-full">
                                    <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                    <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                                </div>
                                <div className="flex justify-between items-end w-full px-4">
                                    {/* Left Signature */}
                                    <div className="flex flex-col items-center flex-1 relative">
                                        <div className="w-full h-16 flex items-end justify-center relative">
                                            {(user.attributes?.signature || user.signature_url) && (
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="absolute bottom-0 w-full h-[75px] object-contain mix-blend-multiply" />
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black mb-0.5 relative z-10 truncate w-full text-center" style={{ color: textCol }}>{displayName}</span>
                                        <div className="w-32 h-[1px]" style={{ backgroundColor: isBackDark ? "rgba(255,255,255,0.3)" : "#e2e8f0" }} />
                                        <span className="text-[9px] font-black mt-0.5 whitespace-nowrap" style={{ color: subCol }}>{displayRole}'s signature</span>
                                    </div>
                                    {/* Auth Signature */}
                                    <div className="flex flex-col items-center flex-1 relative">
                                        <div className="w-full h-16 flex items-end justify-center relative">
                                            {template.authorized_signature_url && (
                                                <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Authorized Signature" className="absolute bottom-0 w-full h-[75px] object-contain mix-blend-multiply" />
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black mb-0.5 relative z-10 truncate w-full text-center" style={{ color: textCol }}>{template.authorized_name || "Registrar"}</span>
                                        <div className="w-32 h-[1px]" style={{ backgroundColor: isBackDark ? "rgba(255,255,255,0.3)" : "#e2e8f0" }} />
                                        <span className="text-[9px] font-black mt-0.5 whitespace-nowrap" style={{ color: subCol }}>{template.signature_label || "Authorized signature"}</span>
                                    </div>
                                </div>

                                {template.show_barcode && (
                                    <div className="flex flex-col items-center mt-3" style={{ opacity: isBackDark ? 0.7 : 0.3 }}>
                                        <div className="flex gap-[2px] h-8 justify-center items-end w-full max-w-[240px]">
                                            {[1, 2, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 2].map((w, i) => (
                                                <div key={i} style={{ width: `${w}px`, backgroundColor: isBackDark ? '#fff' : '#000', height: '100%' }} />
                                            ))}
                                        </div>
                                        <span className="text-[8px] font-mono tracking-[4px] mt-1 uppercase" style={{ color: subCol }}>{displayID}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        }
    }

    // ── ACADEMIC TEMPLATE ───────────────────────────────
    if (style === "academic") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[20px] shadow-2xl relative overflow-hidden flex flex-col bg-white border-2" style={{ borderColor: primary }}>
                        <div className="h-[64px] relative flex items-center justify-center px-4 overflow-hidden" style={{ backgroundColor: primary }}>
                            {template.custom_front_bg_url ? (
                                <div className="absolute inset-0 z-0">
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-50" />
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 via-white/20 to-transparent z-10" />
                                </div>
                            ) : (
                                <BrandHeader light={true} compact={true} />
                            )}
                            {template.custom_front_bg_url && (
                                <div className="relative z-10">
                                    <BrandHeader light={true} compact={true} />
                                </div>
                            )}
                        </div>

                        <div className="h-[3px] w-full" style={{ backgroundColor: secondary }} />

                        <div className="flex-1 flex flex-col items-center px-8 pt-6">
                            {template.show_avatar && (
                                <div className="w-[110px] h-[140px] overflow-hidden shadow-lg mb-4 border-2 relative z-10" style={{ borderColor: primary }}>
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h3 className={`font-black tracking-tight text-center leading-tight mb-1 ${!template.name_font_size ? "text-lg" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || ensureContrast(primary) }}>{displayName}</h3>
                            <p className="font-bold tracking-wider mb-2" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || ensureContrast(secondary) }}>{displayRole}</p>

                            <div className="w-full border-t border-dashed border-slate-200 my-4" />

                            {template.show_id_number && (
                                <div className="text-center mb-4">
                                    <span className="text-[8px] font-black text-slate-400 tracking-wider block mb-1">ID Number</span>
                                    <span className="font-black tracking-[4px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "14px", color: template.id_number_color || primary }}>{displayID}</span>
                                </div>
                            )}
                        </div>

                        <div className="px-8 pb-6 flex justify-center">
                            {template.show_qr && (
                                <div className="p-4 border-2 border-dashed rounded-xl" style={{ borderColor: `${primary}30` }}>
                                    <QRCode value={qrPayload} size={85} fgColor={primary} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[20px] shadow-2xl relative overflow-hidden flex flex-col bg-white border-2" style={{ borderColor: primary }}>
                        <div className="h-[44px] relative flex items-center justify-start px-6 overflow-hidden" style={{ backgroundColor: primary }}>
                            {template.custom_front_bg_url ? (
                                <div className="absolute inset-0 z-0">
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-50" />
                                </div>
                            ) : (
                                <BrandHeader light={true} compact={true} />
                            )}
                            {template.custom_front_bg_url && (
                                <div className="relative z-10">
                                    <BrandHeader light={true} compact={true} />
                                </div>
                            )}
                        </div>
                        <div className="h-[3px] w-full" style={{ backgroundColor: secondary }} />
                        <div className="flex-1 flex items-center p-6 gap-6">
                            {template.show_avatar && (
                                <div className="w-[120px] h-[150px] overflow-hidden shadow-lg shrink-0 border-2 relative z-10" style={{ borderColor: primary }}>
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col h-full pt-24 pb-6">
                                <h3 className={`font-black tracking-tight leading-none mb-1 ${!template.name_font_size ? "text-xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || primary }}>{displayName}</h3>
                                <p className="font-bold tracking-wider mb-auto" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || secondary }}>{displayRole}</p>
                                <div className="border-t border-dashed border-slate-200 my-2" />
                                <div className="flex items-end justify-between">
                                    {template.show_id_number && (
                                        <div>
                                            <span className="text-[7px] font-black text-slate-400 tracking-wider block">ID Number</span>
                                            <span className="font-black tracking-[3px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "10px", color: template.id_number_color || primary }}>{displayID}</span>
                                        </div>
                                    )}
                                    {template.show_qr && (
                                        <div className="p-2 border-2 border-dashed rounded-lg" style={{ borderColor: `${primary}30` }}>
                                            <QRCode value={qrPayload} size={58} fgColor={primary} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - ACADEMIC
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[20px] shadow-2xl relative overflow-hidden flex flex-col bg-white border-2`} style={{ borderColor: primary }}>
                    {template.custom_back_bg_url ? (
                        <div className="absolute inset-0 z-0">
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <>
                            <div className="h-[50px] flex items-center justify-center" style={{ backgroundColor: primary }} />
                            <div className="h-[3px] w-full" style={{ backgroundColor: secondary }} />
                        </>
                    )}

                    <div className="flex-1 p-8 flex flex-col relative z-10">
                        <div className="mb-6">
                            <h4 className="text-[9px] font-black tracking-wider mb-3" style={{ color: primary }}>University Policies</h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[9px] leading-relaxed text-slate-500 font-bold tracking-tight">
                                    {template.back_content || "Carry this card at all times. Use of campus facilities requires valid institutional identification."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="flex flex-col gap-3 w-full">
                                <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-6">
                                <div className="flex flex-col items-center">
                                    {template.show_user_signature ? (
                                        <div className="flex flex-col items-center">
                                            {(user.attributes?.signature || user.signature_url) && (
                                                <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                                    <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain mix-blend-multiply" />
                                                </div>
                                            )}
                                            <span className="text-[8px] font-black text-slate-800 tracking-widest block pt-2 px-2 whitespace-nowrap">
                                                {displayName}
                                            </span>
                                            <div className="w-full h-[1px] bg-slate-800 my-0.5 opacity-50" />
                                            <span className="text-[8.5px] font-black text-slate-400 tracking-[1px]">{displayRole}'s Signature</span>
                                        </div>
                                    ) : (
                                        <div className="text-left">
                                            <span className="text-[9px] font-black text-slate-400 tracking-wider block mb-1">Emergency Call</span>
                                            <span className="text-[10px] font-black tracking-widest" style={{ color: secondary }}>{template.back_contact || "+1 (555) 000-0000"}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-center">
                                    {template.authorized_signature_url && (
                                        <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                            <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}
                                    <span className="text-[8px] font-black text-slate-800 tracking-widest block pt-2 px-2 whitespace-nowrap">
                                        {template.authorized_name || "Name of Registrar"}
                                    </span>
                                    <div className="w-full h-[1px] bg-slate-800 my-0.5 opacity-50" />
                                    <span className="text-[8.5px] font-black text-slate-400 tracking-[1px]">{template.signature_label || "University Registrar"}</span>
                                </div>
                            </div>

                            {template.show_barcode && (
                                <div className="flex flex-col items-center gap-1.5 opacity-30">
                                    <div className="h-8 w-full" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${primary} 0, ${primary} 3px, transparent 3px, transparent 6px, ${primary} 6px, ${primary} 7px, transparent 7px, transparent 10px)` }} />
                                    <span className="text-[8px] font-mono tracking-[4px]">{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ── MINIMAL TEMPLATE ────────────────────────────────
    if (style === "minimal") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col bg-white">
                        <div className="h-[4px] w-full" style={{ backgroundColor: secondary }} />
                        <div className="pt-8 px-8 flex justify-center relative z-10">
                            <BrandHeader light={false} compact={true} />
                        </div>
                        {template.custom_front_bg_url && (
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                            </div>
                        )}

                        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center relative z-10">
                            {template.show_avatar && (
                                <div className="w-[100px] h-[100px] rounded-full overflow-hidden shadow-lg mb-6 ring-2 ring-slate-100 relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h3 className={`font-black tracking-tight leading-tight mb-2 ${!template.name_font_size ? "text-2xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || ensureContrast(primary) }}>{displayName}</h3>
                            <div className="w-8 h-[2px] rounded-full mb-3" style={{ backgroundColor: secondary }} />
                            <p className="font-bold tracking-wider" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || ensureContrast(secondary) }}>{displayRole}</p>
                        </div>

                        <div className="px-10 pb-8 flex items-end justify-between">
                            {template.show_id_number && (
                                <span className="font-black tracking-[3px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "9px", color: template.id_number_color || "#cbd5e1" }}>{displayID}</span>
                            )}
                            {template.show_qr && (
                                <div className="p-3 rounded-xl bg-slate-50">
                                    <QRCode value={qrPayload} size={68} fgColor={primary} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col bg-white">
                        <div className="h-[4px] w-full" style={{ backgroundColor: secondary }} />
                        <div className="pt-6 px-10 flex justify-start relative z-10">
                            <BrandHeader light={false} compact={true} />
                        </div>
                        {template.custom_front_bg_url && (
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: primary }}>
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-40" />
                            </div>
                        )}
                        <div className="flex-1 flex items-center p-10 gap-8 relative z-10">
                            {template.show_avatar && (
                                <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-lg shrink-0 ring-2 ring-slate-100 relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col h-full pt-20 pb-6">
                                <h3 className={`font-black tracking-tight leading-none mb-2 whitespace-nowrap ${!template.name_font_size ? "text-2xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || ensureContrast(primary) }}>{displayName}</h3>
                                <div className="w-8 h-[2px] rounded-full mb-2" style={{ backgroundColor: secondary }} />
                                <p className="font-bold tracking-wider mb-auto" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "10px", color: template.role_color || ensureContrast(secondary) }}>{displayRole}</p>
                                <div className="flex items-end justify-between">
                                    {template.show_id_number && (
                                        <span className="font-black tracking-[3px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "9px", color: template.id_number_color || "#cbd5e1" }}>{displayID}</span>
                                    )}
                                    {template.show_qr && (
                                        <div className="p-2.5 rounded-lg bg-slate-50">
                                            <QRCode value={qrPayload} size={58} fgColor={primary} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - MINIMAL
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col bg-white`}>
                    {template.custom_back_bg_url && (
                        <div className="absolute inset-0 z-0">
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="h-[4px] w-full relative z-10" style={{ backgroundColor: secondary }} />
                    <div className="flex-1 p-10 flex flex-col items-center relative z-10">
                        <div className="mb-auto py-4">
                            <p className="text-[9px] font-bold tracking-tight text-slate-400 italic max-w-[220px] leading-relaxed">
                                "{template.back_content || "This document is for official identification purposes only. If found, please return to the issuing institution."}"
                            </p>
                        </div>

                        <div className="w-full space-y-6">
                            <div className={`flex flex-col w-full ${isPortrait ? 'gap-4' : 'gap-0.5'}`}>
                                <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                            </div>
                            <div className="flex justify-between items-end w-full px-4">
                                {template.show_user_signature && (
                                    <div className="flex flex-col items-center flex-1">
                                        {(user.attributes?.signature || user.signature_url) && (
                                            <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain mix-blend-multiply" />
                                            </div>
                                        )}
                                        <span className="text-[9px] font-black tracking-tight text-slate-900 block pt-2 px-2 whitespace-nowrap">
                                            {displayName}
                                        </span>
                                        <div className="w-24 h-[1px] bg-slate-200 my-0.5" />
                                        <span className="text-[9px] font-bold tracking-wider text-slate-400">
                                            {displayRole}'s signature
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col items-center flex-1">
                                    {template.authorized_signature_url && (
                                        <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                            <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}
                                    <span className="text-[9px] font-black tracking-tight text-slate-900 block pt-2 px-2 whitespace-nowrap">
                                        {template.authorized_name || "Registrar"}
                                    </span>
                                    <div className="w-24 h-[1px] bg-slate-200 my-0.5" />
                                    <span className="text-[9px] font-bold tracking-wider text-slate-400">
                                        {template.signature_label || "Authorized signature"}
                                    </span>
                                </div>
                            </div>

                            {template.show_barcode && (
                                <div className="flex flex-col items-center gap-1.5 opacity-30 pt-4 border-t border-slate-50">
                                    <div className="h-8 w-full max-w-[200px]" style={{ backgroundImage: `repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 3px)` }} />
                                    <span className="text-[8px] font-mono tracking-[4px]">{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ── BOLD TEMPLATE ───────────────────────────────────
    if (style === "bold") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col" style={{ backgroundColor: primary }}>
                        {template.custom_front_bg_url ? (
                            <div className="absolute inset-0 z-0">
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover mix-blend-luminosity opacity-50" />
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full -mr-20 -mt-20 opacity-20" style={{ backgroundColor: secondary }} />
                                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] rounded-full -ml-16 -mb-16 opacity-10" style={{ backgroundColor: secondary }} />
                            </>
                        )}

                        <div className="relative z-10 flex-1 flex flex-col pt-8 px-8">
                            {/* Center Branding */}
                            <div className="mb-8 flex justify-center">
                                <BrandHeader light={true} compact={true} />
                            </div>

                            {template.show_avatar && (
                                <div className="w-[140px] h-[140px] rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-white/10 self-center relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center">
                                <h3 className={`font-black tracking-tight leading-tight mb-1 ${!template.name_font_size ? "text-3xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || "white" }}>{displayName}</h3>
                                <div className="px-4 py-1.5 rounded-full mt-2 mb-auto" style={{ backgroundColor: secondary }}>
                                    <p className="font-black tracking-wide" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "9px", color: template.role_color || "white" }}>{displayRole}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 px-8 pb-8 flex items-end justify-between mt-auto">
                            {template.show_qr && (
                                <div className="p-3 bg-white rounded-2xl shadow-xl">
                                    <QRCode value={qrPayload} size={75} fgColor={primary} />
                                </div>
                            )}
                            {template.show_id_number && (
                                <div className="text-right">
                                    <span className="text-white/30 text-[7px] font-black tracking-wider block">ID Number</span>
                                    <span className="font-black tracking-[4px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "11px", color: template.id_number_color || "white" }}>{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col p-8" style={{ backgroundColor: primary }}>
                        <div className="absolute top-0 right-0 w-[180px] h-[180px] rounded-full -mr-16 -mt-16 opacity-20" style={{ backgroundColor: secondary }} />
                        <div className="relative z-10 flex flex-col h-full">
                            {/* Top Left Branding */}
                            <div className="mb-4">
                                <BrandHeader light={true} compact={true} />
                            </div>

                            <div className="flex flex-1 items-center gap-8">
                                <div className="flex-1 flex flex-col items-start justify-center">
                                    <h3 className={`font-black tracking-tight leading-tight mb-2 ${!template.name_font_size ? "text-3xl" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || "white" }}>{displayName}</h3>
                                    <div className="px-4 py-1.5 rounded-full inline-block mb-6" style={{ backgroundColor: secondary }}>
                                        <p className="font-black tracking-wide" style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : "9px", color: template.role_color || "white" }}>{displayRole}</p>
                                    </div>

                                    <div className="flex items-end gap-6 mt-auto">
                                        {template.show_qr && (
                                            <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0">
                                                <QRCode value={qrPayload} size={68} fgColor={primary} />
                                            </div>
                                        )}
                                        {template.show_id_number && (
                                            <div className="pb-1">
                                                <span className="text-white/20 text-[7px] font-black tracking-wider block">ID Number</span>
                                                <span className="font-black tracking-[3px]" style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : "11px", color: template.id_number_color || "white" }}>{displayID}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {template.show_avatar && (
                                    <div className="w-[160px] h-[160px] rounded-[2rem] overflow-hidden shadow-2xl shrink-0 ring-4 ring-white/10 relative z-10">
                                        <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - BOLD
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            const isBackDark = !!template.custom_back_bg_url;
            const mainColor = isBackDark ? "#ffffff" : "#1e293b";
            const subColor = isBackDark ? "rgba(255,255,255,0.6)" : "#64748b";

            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col bg-white`}>
                    {template.custom_back_bg_url ? (
                        <div className="absolute inset-0 z-0">
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full -ml-40 -mt-40 opacity-10" style={{ backgroundColor: secondary }} />
                    )}
                    <div className="relative z-10 flex-1 p-10 flex flex-col">
                        <div className={`w-full flex-shrink-0 relative z-10 ${isPortrait ? 'mb-8' : 'mb-1'} px-6`}>
                            <div className={`w-full rounded-[14px] ${isBackDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50/80 border border-slate-100'} p-3 flex items-center justify-center`}>
                                <p className={`text-[7px] font-bold ${isPortrait ? 'leading-relaxed' : 'leading-tight'} text-center`} style={{ color: subColor }}>
                                    {template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office."}
                                </p>
                            </div>
                        </div>

                        <div className="w-full space-y-6">
                            <div className="flex flex-col gap-3 w-full">
                                <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                            </div>
                            <div className="flex items-end justify-between pt-6 border-t border-slate-100">
                                {template.show_user_signature ? (
                                    <div className="flex flex-col items-center">
                                        {(user.attributes?.signature || user.signature_url) && (
                                            <div className="h-16 mb-[-18px] relative z-20">
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain" />
                                            </div>
                                        )}
                                        <span className="text-slate-900 text-[9px] font-black tracking-widest block pt-2 px-2 whitespace-nowrap">
                                            {displayName}
                                        </span>
                                        <div className="w-24 h-[1px] bg-slate-200 my-0.5" />
                                        <span className="text-slate-400 text-[9px] font-black tracking-[1.5px]">
                                            {displayRole}'s Signature
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-slate-400 text-[10px] font-black tracking-wider block mb-2">Support</span>
                                        <span className="text-slate-900 text-[12px] font-black tracking-[2px]">{template.back_contact || "+1 (555) 000-0000"}</span>
                                    </div>
                                )}
                                <div className="text-right flex flex-col items-center">
                                    {template.authorized_signature_url && (
                                        <div className="h-16 mb-[-18px] relative z-20">
                                            <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Signature" className="h-full object-contain" />
                                        </div>
                                    )}
                                    <span className="text-slate-900 text-[9px] font-black tracking-widest block pt-2 px-2 whitespace-nowrap">
                                        {template.authorized_name || "Name of Registrar"}
                                    </span>
                                    <div className="w-full h-[1px] bg-slate-200 my-0.5" />
                                    <span className="text-slate-400 text-[9px] font-black tracking-[1.5px]">
                                        {template.signature_label || "University Registrar"}
                                    </span>
                                </div>
                            </div>

                            {template.show_barcode && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-10 w-full" style={{ backgroundImage: `repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 3px)` }} />
                                    <span className="text-slate-300 text-[9px] font-mono tracking-[4px]">{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ── GOVERNMENT TEMPLATE ─────────────────────────────
    if (style === "government") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[16px] shadow-2xl relative overflow-hidden flex flex-col bg-[#fafbfc] border border-slate-200">
                        {/* Top bar */}
                        <div className="h-[52px] relative flex items-center justify-between px-5" style={{ backgroundColor: template.custom_front_bg_url ? 'transparent' : primary }}>
                            {template.custom_front_bg_url ? (
                                <div className="absolute inset-0 z-0">
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="absolute inset-0" />
                            )}
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <BrandHeader light={true} compact={true} />
                            </div>
                        </div>
                        <div className="h-[3px] relative z-10" style={{ background: `repeating-linear-gradient(90deg, ${secondary}, ${secondary} 4px, transparent 4px, transparent 8px)` }} />

                        <div className="flex-1 flex flex-col items-center px-6 pt-6">
                            {template.show_avatar && (
                                <div className="w-[100px] h-[120px] overflow-hidden shadow-md mb-4 border border-slate-200 bg-white relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="w-full space-y-3 mt-2">
                                <div className="flex justify-between items-baseline border-b border-dotted border-slate-200 pb-1">
                                    <span className="text-[8px] font-black text-slate-400 tracking-wider">Full Name</span>
                                    <span className={`font-black ${!template.name_font_size ? "text-[11px]" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || primary }}>{displayName}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-dotted border-slate-200 pb-1">
                                    <span className="text-[8px] font-black text-slate-400 tracking-wider">Designation</span>
                                    <span className={`font-bold ${!template.role_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : undefined, color: template.role_color || secondary }}>{displayRole}</span>
                                </div>
                                 {template.show_id_number && (
                                    <div className="flex justify-between items-baseline border-b border-dotted border-slate-200 pb-1">
                                        <span className="text-[8px] font-black text-slate-400 tracking-wider">ID Number</span>
                                        <span className={`font-black tracking-[2px] ${!template.id_number_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : undefined, color: template.id_number_color || primary }}>{displayID}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex items-end justify-between">
                            {template.show_qr && (
                                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <QRCode value={qrPayload} size={72} fgColor={primary} />
                                </div>
                            )}
                            <div className="text-right">
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[16px] shadow-2xl relative overflow-hidden flex flex-col bg-[#fafbfc] border border-slate-200">
                        <div className="h-[40px] relative flex items-center justify-between px-5" style={{ backgroundColor: template.custom_front_bg_url ? 'transparent' : primary }}>
                            {template.custom_front_bg_url ? (
                                <div className="absolute inset-0 z-0">
                                    <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="absolute inset-0" />
                            )}
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <BrandHeader light={true} compact={true} />
                            </div>
                        </div>
                        <div className="h-[3px] relative z-10" style={{ background: `repeating-linear-gradient(90deg, ${secondary}, ${secondary} 4px, transparent 4px, transparent 8px)` }} />
                        <div className="flex-1 flex p-5 gap-5">
                            {template.show_avatar && (
                                <div className="w-[100px] h-[130px] overflow-hidden shadow-md shrink-0 border border-slate-200 bg-white relative z-10">
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col">
                                <div className="space-y-2 mb-auto">
                                    <div className="border-b border-dotted border-slate-200 pb-1">
                                        <span className="text-[7px] font-black text-slate-400 tracking-wider">Name</span>
                                        <p className={`font-black ${!template.name_font_size ? "text-sm" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || primary }}>{displayName}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 border-b border-dotted border-slate-200 pb-1">
                                            <span className="text-[7px] font-black text-slate-400 tracking-wider">Role</span>
                                            <p className={`font-bold ${!template.role_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : undefined, color: template.role_color || secondary }}>{displayRole}</p>
                                        </div>
                                        {template.show_id_number && (
                                            <div className="flex-1 border-b border-dotted border-slate-200 pb-1">
                                                <span className="text-[7px] font-black text-slate-400 tracking-wider">ID Number</span>
                                                <p className={`font-black tracking-[2px] ${!template.id_number_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : undefined, color: template.id_number_color || primary }}>{displayID}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                    </div>
                                </div>
                                <div className="flex items-end justify-between mt-auto">
                                    {template.show_id_number && (
                                        <div className="pb-1">
                                        </div>
                                    )}
                                    {template.show_qr && (
                                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm ml-auto">
                                            <QRCode value={qrPayload} size={65} fgColor={primary} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - GOVERNMENT
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[16px] shadow-2xl relative overflow-hidden flex flex-col bg-[#fafbfc] border border-slate-200`}>
                    {template.custom_back_bg_url ? (
                        <div className="absolute inset-0 z-0 text-white">
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <>
                            <div className="h-[40px] flex items-center px-5" style={{ backgroundColor: primary }}>

                            </div>
                            <div className="h-[3px]" style={{ background: `repeating-linear-gradient(90deg, ${secondary}, ${secondary} 4px, transparent 4px, transparent 8px)` }} />
                        </>
                    )}

                    <div className="flex-1 p-8 flex flex-col relative z-10">
                        <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-lg mb-auto">
                            <p className="text-[8px] font-black text-slate-400 tracking-wider mb-2 uppercase">Legal Notice</p>
                            <p className="text-[9px] leading-relaxed text-slate-600 font-bold tracking-tight">
                                {template.back_content || "Any alteration of this record is a criminal offense. This card must be presented upon request by authorized officials."}
                            </p>
                        </div>

                        <div className="w-full space-y-6">
                            <div className="flex flex-col gap-3 w-full">
                                <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                            </div>
                            <div className="flex justify-between items-end w-full px-4">
                                {template.show_user_signature && (
                                    <div className="flex flex-col items-center flex-1">
                                        {(user.attributes?.signature || user.signature_url) && (
                                            <div className={`relative z-20 ${isPortrait ? 'h-20 mb-[-20px]' : 'h-14 mb-[-14px]'}`}>
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain mix-blend-multiply" />
                                            </div>
                                        )}
                                        <span className="text-[9px] font-black text-slate-900 tracking-tight block pt-2 px-2 whitespace-nowrap">
                                            {displayName}
                                        </span>
                                        <div className="w-32 h-[1px] bg-slate-900 my-0.5 opacity-20" />
                                        <span className="text-[8.5px] font-black text-slate-300 tracking-[1px] block">{displayRole}'s signature</span>
                                    </div>
                                )}
                                <div className="flex flex-col items-center flex-1">
                                    {template.authorized_signature_url && (
                                        <div className={`relative z-20 ${isPortrait ? 'h-18 mb-[-18px]' : 'h-12 mb-[-12px]'}`}>
                                            <img crossOrigin="anonymous" src={resolveImageUrl(template.authorized_signature_url)} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}
                                    <span className="text-[9px] font-black text-slate-900 tracking-tight block pt-2 px-2 whitespace-nowrap">
                                        {template.authorized_name || "Name of Registrar"}
                                    </span>
                                    <div className="w-32 h-[1px] bg-slate-900 my-0.5 opacity-20" />
                                    <span className="text-[8.5px] font-black text-slate-300 tracking-[1px] block">{template.signature_label || "Authorized signature"}</span>
                                </div>
                            </div>

                            {template.show_barcode && (
                                <div className="flex flex-col items-center gap-1.5 opacity-40 pt-4 border-t border-slate-100">
                                    <div className="h-8 w-full max-w-[240px]" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${primary} 0, ${primary} 1px, transparent 1px, transparent 3px)` }} />
                                    <span className="text-[8px] font-mono tracking-[4px]">{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }

    // ── PROFESSIONAL TEMPLATE ───────────────────────────
    if (style === "professional") {
        if (isFront) {
            if (isPortrait) {
                return (
                    <div id="digital-id-card" className="w-[320px] h-[500px] rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100">
                        {/* Header Background layer */}
                        <div className="h-[200px] relative overflow-hidden" style={{ backgroundColor: template.custom_front_bg_url ? "transparent" : primary }}>
                            {template.custom_front_bg_url ? (
                                <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="absolute inset-0 w-full h-full object-cover z-0" />
                            ) : (
                                <>
                                    <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-white opacity-5 rounded-full -mr-32 -mt-32" />
                                    <div className="absolute bottom-0 left-0 w-[120px] h-[120px] bg-white opacity-5 rounded-full -ml-16 -mb-16" />
                                </>
                            )}

                            {/* Accent Curve */}
                            <div className="absolute bottom-0 left-0 w-full h-24 bg-white" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 100%)" }} />
                            <div className="absolute bottom-1 left-0 w-full h-24" style={{ backgroundColor: secondary, clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 100%)", opacity: 0.3 }} />

                            <div className="relative z-10 flex flex-col items-center pt-8">
                                {/* Top branding removed to match reference design (avoiding redundancy) */}
                            </div>
                        </div>

                        {/* Circular Avatar overlap */}
                        {template.show_avatar && (
                            <div className="flex justify-center -mt-24 relative z-20">
                                <div className="w-[140px] h-[140px] rounded-full border-[6px] border-white shadow-2xl overflow-hidden relative" style={{ backgroundColor: secondary }}>
                                    <div className="absolute inset-0 border-[3px] border-secondary p-1 rounded-full">
                                        <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Area */}
                        <div className="flex-1 flex flex-col px-8 pt-6">
                            <div className="text-center mb-6">
                                <h3 className={`font-black tracking-tight leading-none mb-1 whitespace-nowrap ${!template.name_font_size ? "text-[22px]" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || primary }}>{displayName}</h3>
                                <p className={`font-bold tracking-wider ${!template.role_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : undefined, color: template.role_color || secondary }}>{displayRole}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                                    <span className="text-[8px] font-black text-slate-500 tracking-wider">ID Number</span>
                                    <span className={`font-black tracking-wider ${!template.id_number_font_size ? "text-[11px]" : ""}`} style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : undefined, color: template.id_number_color || "#334155" }}># {displayID}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-500 tracking-wider">Official Email</span>
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[140px]">{user.email || "user@institution.com"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Station */}
                        <div className="h-[80px] relative overflow-hidden px-8 flex items-center justify-between">
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: secondary }} />
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent z-0" />

                            <div className="relative z-10 flex items-center gap-2">
                                {logoUrl && (
                                    <img crossOrigin="anonymous" src={logoUrl} alt="Institution Logo" className="h-10 object-contain drop-shadow-md brightness-0 invert" />
                                )}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white leading-none tracking-wide">{template.institution_name}</span>
                                    <span className="text-[6px] font-bold text-white/70 leading-normal tracking-wider">{template.institution_subtitle}</span>
                                </div>
                            </div>
                            {template.show_qr && (
                                <div className="relative z-10 p-3 bg-white rounded-lg shadow-xl shadow-black/10">
                                    <QRCode value={qrPayload} size={65} fgColor={primary} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else {
                // LANDSCAPE PROFESSIONAL
                return (
                    <div id="digital-id-card" className="w-[500px] h-[320px] rounded-[32px] shadow-2xl relative overflow-hidden flex bg-white border border-slate-100">
                        {/* Background Layer */}
                        {template.custom_front_bg_url ? (
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_front_bg_url)} alt="Front Template" className="absolute inset-0 w-full h-full object-cover z-0" />
                        ) : (
                            <div className="absolute inset-0 z-0 flex">
                                <div className="w-[180px] h-full" style={{ backgroundColor: primary }} />
                                <div className="w-[4px] h-full" style={{ backgroundColor: secondary }} />
                                <div className="flex-1 h-full bg-white" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16" />
                            </div>
                        )}

                        <div className="relative z-10 flex-1 flex p-8 gap-8 items-center">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="w-[140px] h-[140px] rounded-full border-[6px] border-white shadow-2xl overflow-hidden mb-4" style={{ backgroundColor: secondary }}>
                                    <img crossOrigin="anonymous" src={avatar} alt="User" className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                                    <span className="text-[10px] font-black tracking-widest" style={{ color: primary }}>ID Number:</span>
                                    <span className={`font-black ${!template.id_number_font_size ? "text-[10px]" : ""}`} style={{ fontSize: template.id_number_font_size ? `${template.id_number_font_size}px` : undefined, color: template.id_number_color || secondary }}>{displayID}</span>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 flex flex-col h-full py-8 text-left">
                                <div className="mb-8">
                                    <h3 className={`font-black tracking-tight leading-none mb-1 ${!template.name_font_size ? "text-[28px]" : ""}`} style={{ fontSize: template.name_font_size ? `${template.name_font_size}px` : undefined, color: template.name_color || ensureContrast(primary) }}>{displayName}</h3>
                                    <p className={`font-bold tracking-wider ${!template.role_font_size ? "text-[11px]" : ""}`} style={{ fontSize: template.role_font_size ? `${template.role_font_size}px` : undefined, color: template.role_color || ensureContrast(secondary) }}>{displayRole}</p>
                                </div>

                                <div className="space-y-3 mt-auto mb-6 max-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondary }} />
                                        <span className="text-[9px] font-bold text-slate-600 tracking-wider truncate">{user.email || "user@email.com"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full mt-auto">
                                    <BrandHeader light={false} compact={true} />
                                    {template.show_qr && (
                                        <div className="p-2.5 bg-white rounded-lg shadow-lg border border-slate-100">
                                            <QRCode value={qrPayload} size={68} fgColor={primary} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        } else {
            // BACK SIDE - PROFESSIONAL
            const dims = isPortrait ? "w-[320px] h-[500px]" : "w-[500px] h-[320px]";
            const isBackDark = !!template.custom_back_bg_url;
            const mainColor = isBackDark ? "#ffffff" : "#1e293b";
            const subColor = isBackDark ? "rgba(255,255,255,0.6)" : "#64748b";

            return (
                <div id="digital-id-card-back" className={`${dims} rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-100`}>
                    {template.custom_back_bg_url ? (
                        <div className="absolute inset-0 z-0">
                            <img crossOrigin="anonymous" src={resolveImageUrl(template.custom_back_bg_url)} alt="Back Template" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 opacity-5" style={{ backgroundColor: primary, backgroundImage: `radial-gradient(${secondary} 1px, transparent 0)`, backgroundSize: "16px 16px" }} />
                    )}

                    <div className="relative z-10 flex-1 p-8 flex flex-col">
                        <div className={`w-full flex-shrink-0 relative z-10 ${isPortrait ? 'mb-8' : 'mb-1'} px-6`}>
                            <div className={`w-full rounded-[14px] ${isBackDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50/80 border border-slate-100'} p-3 flex items-center justify-center`}>
                                <p className={`text-[7px] font-bold ${isPortrait ? 'leading-relaxed' : 'leading-tight'} text-center`} style={{ color: subColor }}>
                                    {template.back_content || "This card is the property of the issuing institution. If found, please return to the nearest security office."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 shrink-0 rounded-sm" style={{ backgroundColor: secondary }} />
                                <p className="text-[10px] leading-relaxed text-slate-600 font-medium" style={{ color: mainColor }}>
                                    Misuse of campus resources or facilities is subject to disciplinary action.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1.5 w-2 h-2 shrink-0 rounded-sm" style={{ backgroundColor: secondary }} />
                                <p className="text-[10px] leading-relaxed text-slate-600 font-medium italic" style={{ color: subColor }}>
                                    {template.back_contact || "Emergency Contact: +63 000 000 0000"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mt-auto">
                            <div className={`flex flex-col w-full ${isPortrait ? 'gap-4' : 'gap-2'}`}>
                                <EmergencyContactUI isDarkBg={!!template.custom_back_bg_url} />
                                <CardDatesUI isDarkBg={!!template.custom_back_bg_url} />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                {template.show_user_signature && (
                                    <>
                                        {(user.attributes?.signature || user.signature_url) && (
                                            <div className="h-16 mb-[-14px] relative z-20">
                                                <img crossOrigin="anonymous" src={resolveImageUrl(user.attributes?.signature || user.signature_url)} alt="User Signature" className="h-full object-contain mix-blend-multiply" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-black text-slate-800 tracking-widest block pt-2 px-2 whitespace-nowrap">
                                            {displayName}
                                        </span>
                                        <div className="w-48 h-[1px] bg-slate-800 my-1" />
                                        <span className="text-[9px] font-black text-slate-400 tracking-[2px]">{displayRole}'s Signature</span>
                                    </>
                                )}
                            </div>

                            {template.show_barcode && (
                                <div className="flex flex-col items-center gap-1.5 opacity-60">
                                    <div className="h-12 w-full max-w-[200px]" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${primary} 0, ${primary} 2px, transparent 2px, transparent 5px, ${primary} 5px, ${primary} 7px, transparent 7px, transparent 9px)` }} />
                                    <span className="text-[9px] font-bold tracking-[6px]" style={{ color: primary }}>{displayID}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Station */}
                    <div className="h-[60px] relative overflow-hidden px-8 flex items-center justify-center">
                        <div className="absolute inset-0 z-0" style={{ backgroundColor: secondary }} />
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-[11px] font-black text-white leading-none tracking-wide">{template.institution_name}</span>
                            <span className="text-[6px] font-bold text-white/70 leading-normal tracking-wider">{template.institution_subtitle}</span>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Fallback to corporate
    return null;
};

export default IDCard;
