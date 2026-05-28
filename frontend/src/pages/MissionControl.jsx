import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Inbox, User, Shield, CreditCard, CheckCircle2, XCircle,
    AlertCircle, Calendar, Printer, Search, ArrowRight, ArrowLeft,
    Clock, ShieldAlert, History, MapPin, CheckCircle, BellRing,
    HandHelping, Trophy, Sparkles, Ticket, Download, ShieldCheck,
    Archive, Truck, AlertTriangle, RefreshCw, Barcode, Eye, FileText, Check, FileVideo,
    ScanLine, QrCode, X, UserCheck, Package, Fingerprint, IdCard, Maximize2, Minimize2
} from "lucide-react";
import { API_BASE_URL } from "../config";
import IDCard from "../components/IDCard";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

const MissionControl = () => {
    const currentUser = JSON.parse(localStorage.getItem("regisSys_user")) || {};
    // Pipeline States
    const [allApps, setAllApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [templateByRole, setTemplateByRole] = useState({});

    // Main Queue Tab Bar
    const [activeTab, setActiveTab] = useState("all"); // "all", "printing", "shipping", "pickup", "completed"
    const [printingSubTab, setPrintingSubTab] = useState("portrait"); // "portrait" or "landscape"

    // Batch operations
    const [selectedItems, setSelectedItems] = useState([]); // Array of application IDs

    // Courier Shipping Logistics Modal
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [shippingApps, setShippingApps] = useState([]); // Single or batch apps being shipped
    const [shippingStep, setShippingStep] = useState("idle"); // "idle", "connecting", "waybill"
    const [shipmentProgress, setShipmentProgress] = useState(0);
    const [shippingCarrier, setShippingCarrier] = useState("J&T Express");
    const [generatedWaybillNumbers, setGeneratedWaybillNumbers] = useState({});

    // Branch Pickup Modal
    const [collectionLocation, setCollectionLocation] = useState("Main Registrar Desk, Windows 2-3");
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [tempLocation, setTempLocation] = useState("");
    const [notifyApps, setNotifyApps] = useState([]); // Apps being notified

    // Print Batch Previews
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [selectedOrientation, setSelectedOrientation] = useState(null); // 'landscape' or 'portrait'
    const [previewSide, setPreviewSide] = useState('front'); // 'front' or 'back'
    const [isFullPreview, setIsFullPreview] = useState(false);

    // General Layout Settings
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployStatus, setDeployStatus] = useState("");
    const [activityLog, setActivityLog] = useState([
        { id: 1, type: 'system', message: 'Fulfillment Engine online. Courier tunnels established.', time: new Date() },
        { id: 2, type: 'system', message: 'Alphabetical filing cabinets sync complete.', time: new Date() }
    ]);

    // ── QR Scanner State ───────────────────────────────────────────────────────
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerPhase, setScannerPhase] = useState('scanning'); // 'scanning' | 'flash' | 'result' | 'success'
    const [scannedApp, setScannedApp] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [manualQuery, setManualQuery] = useState("");
    const [searchError, setSearchError] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [claimCardSide, setClaimCardSide] = useState('front');
    const [staffName, setStaffName] = useState(() => localStorage.getItem("regisSys_claimStaffName") || currentUser.name || "Jehan Admin");

    useEffect(() => {
        localStorage.setItem("regisSys_claimStaffName", staffName);
    }, [staffName]);

    const logActivity = (message, type = 'info') => {
        setActivityLog(prev => [
            { id: Date.now(), message, type, time: new Date() },
            ...prev.slice(0, 5) // Keep last 6 items
        ]);
    };

    // Calculate dynamic stats
    const stats = {
        all: allApps.filter(app => app.status === 'pending' || app.status === 'rejected').length,
        pending: allApps.filter(app => app.status === 'pending').length,
        vault: allApps.filter(app => app.status === 'approved' && app.admin_notes !== 'approved_for_printing').length,
        printing: allApps.filter(app => app.status === 'approved' && app.admin_notes === 'approved_for_printing').length,
        shipping: allApps.filter(app => app.status === 'printed' && app.fulfillment_method === 'delivery').length,
        pickup: allApps.filter(app => app.status === 'printed' && app.fulfillment_method === 'pickup').length,
        completed: allApps.filter(app => app.status === 'completed').length
    };

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/applications`);
            if (res.ok) {
                const data = await res.json();
                setAllApps(data);
            }
        } catch (err) {
            console.error("Failed to fetch applications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTemplateForRole = async (role) => {
        if (templateByRole[role]) return;
        try {
            const res = await fetch(`${API_BASE_URL}/id-builder/${role}`);
            if (res.ok) {
                const data = await res.json();
                setTemplateByRole(prev => ({ ...prev, [role]: data }));
            }
        } catch (err) {
            console.error(`Failed to fetch template for ${role}:`, err);
        }
    };

    useEffect(() => {
        fetchApplications();
        const interval = setInterval(() => {
            fetchApplications();
        }, 8000); // Polling every 8 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedApp?.user?.role_context) {
            fetchTemplateForRole(selectedApp.user.role_context);
        }
    }, [selectedApp]);

    useEffect(() => {
        if (allApps.length > 0) {
            const uniqueRoles = [...new Set(allApps.map(app => app.user?.role_context).filter(Boolean))];
            uniqueRoles.forEach(role => fetchTemplateForRole(role));
        }
    }, [allApps]);

    // ── Claim Station Scanner Stream Controller ──
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) {
            console.warn("Audio beep failed to synthesize:", e);
        }
    };

    const startScanning = async (camId) => {
        if (html5QrRef.current) {
            try { await html5QrRef.current.stop(); } catch (e) { }
        }

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader-claim-station');
            html5QrRef.current = scanner;
            await scanner.start(
                camId,
                { fps: 15, qrbox: { width: 200, height: 200 } },
                async (decodedText) => {
                    try {
                        const payload = JSON.parse(decodedText);
                        if (payload.type !== 'ID_CARD_CLAIM') {
                            setScanError('Invalid QR — not a Claim Stub.');
                            return;
                        }
                        playBeep();
                        setScannerPhase('flash');

                        await stopScanning();

                        const res = await fetch(`${API_BASE_URL}/applications/scan`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (!res.ok) {
                            const err = await res.json();
                            setScanError(err.detail || 'Scan verification failed.');
                            setScannerPhase('scanning');
                            return;
                        }
                        const app = await res.json();
                        setScannedApp(app);
                        setTimeout(() => setScannerPhase('result'), 600);
                    } catch (e) {
                        setScanError('Invalid or corrupted QR payload.');
                    }
                },
                () => { }
            );
            setScanError(null);
        } catch (err) {
            console.error("Camera startup failed:", err);
            setScanError("Failed to start camera scanner stream.");
        }
    };

    const stopScanning = async () => {
        if (html5QrRef.current) {
            try {
                await html5QrRef.current.stop();
            } catch (e) { }
            html5QrRef.current = null;
        }
    };

    const handleManualSearch = (query) => {
        if (!query.trim()) return;
        setSearchLoading(true);
        setSearchError(null);

        const found = allApps.find(app => {
            const nameMatch = app.user?.name?.toLowerCase().includes(query.toLowerCase());
            const emailMatch = app.user?.email?.toLowerCase().includes(query.toLowerCase());
            const idMatch = app.user?.external_id?.toLowerCase() === query.toLowerCase();
            return (nameMatch || emailMatch || idMatch) &&
                (app.status === 'printed' || app.status === 'completed') &&
                app.fulfillment_method === 'pickup';
        });


        if (found) {
            playBeep();
            setScannedApp(found);
            setScannerPhase('result');
            setManualQuery("");
            setSearchError("");
        } else {
            const anyFound = allApps.find(app => {
                const nameMatch = app.user?.name?.toLowerCase().includes(query.toLowerCase());
                const emailMatch = app.user?.email?.toLowerCase().includes(query.toLowerCase());
                const idMatch = app.user?.external_id?.toLowerCase() === query.toLowerCase();
                return nameMatch || emailMatch || idMatch;
            });

            if (anyFound) {
                setSearchError(`Found ${anyFound.user?.name} but status is '${anyFound.status}'. (Must be 'printed' to claim).`);
            } else {
                setSearchError("No active pickup application found for that name or ID.");
            }
        }
        setSearchLoading(false);
    };

    useEffect(() => {
        if (activeTab === "claim" && scannerPhase === "scanning") {
            import('html5-qrcode').then(({ Html5Qrcode }) => {
                Html5Qrcode.getCameras().then(devices => {
                    if (devices && devices.length > 0) {
                        setCameras(devices);
                        const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                        const camId = backCam ? backCam.id : devices[0].id;
                        setSelectedCameraId(camId);
                        startScanning(camId);
                    } else {
                        setScanError("No camera devices detected.");
                    }
                }).catch(err => {
                    setScanError("Failed to list camera devices.");
                });
            });
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [activeTab, scannerPhase]);

    // Filter and search application lists based on active tab
    const getFilteredApps = () => {
        let list = [];
        if (activeTab === "all") {
            list = allApps.filter(app => app.status === "pending" || app.status === "rejected");
        } else if (activeTab === "vault") {
            // Identity Vault / Approve Tab: approved but not yet approved for physical print queue
            list = allApps.filter(app => app.status === "approved" && app.admin_notes !== "approved_for_printing");
        } else if (activeTab === "printing") {
            // Physical ID Queue: approved AND admin approved for printing
            list = allApps.filter(app => {
                const isApproved = app.status === "approved" && app.admin_notes === "approved_for_printing";
                if (!isApproved) return false;
                const template = templateByRole[app.user?.role_context];
                const orient = template?.orientation || 'portrait';
                return orient === printingSubTab;
            });
        } else if (activeTab === "shipping") {
            list = allApps.filter(app => app.status === "printed" && app.fulfillment_method === "delivery");
        } else if (activeTab === "pickup") {
            list = allApps.filter(app => app.status === "printed" && app.fulfillment_method === "pickup");
        } else if (activeTab === "completed") {
            list = allApps.filter(app => app.status === "completed");
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(app =>
                (app.user?.name || "").toLowerCase().includes(q) ||
                (app.user?.email || "").toLowerCase().includes(q) ||
                (app.user?.attributes?.external_id || "").toLowerCase().includes(q)
            );
        }

        // Enforce FIFO: First In, First Out (oldest registrations first)
        list.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
        return list;
    };

    const filteredApps = getFilteredApps();

    // Toggle multi-select checkbox for batch processing
    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredApps.map(app => app.id);
        const allSelected = visibleIds.every(id => selectedItems.includes(id));
        if (allSelected) {
            setSelectedItems(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedItems(prev => [...new Set([...prev, ...visibleIds])]);
        }
    };

    // Smart Filing Box A-Z Drawer Helper
    const getFilingLetter = (name) => {
        if (!name) return "A";
        const parts = name.trim().split(" ");
        const lastName = parts[parts.length - 1];
        return lastName ? lastName.charAt(0).toUpperCase() : "A";
    };

    // Address verification validation helper
    const isAddressUnverified = (addressStr) => {
        if (!addressStr) return true;
        const lower = addressStr.toLowerCase();
        // Checked against coordinates and verified strings
        const hasCoords = lower.includes("lat:") || lower.includes("lng:") || lower.includes("coordinates") || lower.includes("map location");
        const hasLockSymbol = lower.includes("confirmed on map") || lower.includes("map confirmed");
        return !(hasCoords || hasLockSymbol);
    };

    // Action execution (approve/deny/handover)
    const handleAction = async (id, action, notes = "") => {
        try {
            const scheduled_at = action === "approved" ? new Date().toISOString() : null;
            const res = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: action,
                    admin_notes: notes,
                    scheduled_at: scheduled_at,
                    collection_location: null
                })
            });
            if (res.ok) {
                const updatedApp = await res.json();
                fetchApplications();
                setSelectedApp(null);

                const actionVerb = action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Closed';
                logActivity(`${actionVerb} identity request for ${updatedApp.user?.name}`, action);
            }
        } catch (err) {
            console.error("Action execution failed:", err);
        }
    };

    const handleBatchArchiveVault = async () => {
        const vaultSelected = filteredApps.filter(app =>
            selectedItems.includes(app.id) && app.status === 'approved' && app.admin_notes !== 'approved_for_printing'
        );
        if (vaultSelected.length === 0) {
            alert("No verified (digital-only) identities selected.");
            return;
        }
        setIsDeploying(true);
        setDeployStatus(`Archiving ${vaultSelected.length} digital identities...`);
        try {
            for (const app of vaultSelected) {
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "completed" })
                });
            }
            fetchApplications();
            setSelectedItems([]);
            logActivity(`Archived ${vaultSelected.length} digital-only identity records.`, 'info');
        } catch (err) {
            console.error("Batch vault archive failed:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    const handleBatchApprovePrint = async () => {
        const printSelected = filteredApps.filter(app =>
            selectedItems.includes(app.id) &&
            app.status === 'approved' &&
            app.user?.attributes?.physical_id_requested === true &&
            app.admin_notes !== 'approved_for_printing'
        );
        if (printSelected.length === 0) {
            alert("No identities with pending physical ID requests selected.");
            return;
        }
        setIsDeploying(true);
        setDeployStatus(`Sending ${printSelected.length} identities to the print queue...`);
        try {
            for (let i = 0; i < printSelected.length; i++) {
                const app = printSelected[i];
                setDeployStatus(`Queueing [${i + 1}/${printSelected.length}] ${app.user?.name}...`);
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "approved",
                        admin_notes: "approved_for_printing"
                    })
                });
            }
            fetchApplications();
            setSelectedItems([]);
            logActivity(`Batch approved printing for ${printSelected.length} identities.`, 'approved');
        } catch (err) {
            console.error("Batch print approval failed:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    const handleBatchApprove = async () => {
        const pendingOrRejectedSelected = filteredApps.filter(app =>
            selectedItems.includes(app.id) && (app.status === 'pending' || app.status === 'rejected')
        );

        if (pendingOrRejectedSelected.length === 0) {
            alert("No pending or rejected requests selected for approval.");
            return;
        }

        setIsDeploying(true);
        setDeployStatus(`Approving ${pendingOrRejectedSelected.length} identities...`);

        try {
            for (let i = 0; i < pendingOrRejectedSelected.length; i++) {
                const app = pendingOrRejectedSelected[i];
                setDeployStatus(`Approving [${i + 1}/${pendingOrRejectedSelected.length}] ${app.user?.name}...`);
                const scheduled_at = new Date().toISOString();
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "approved",
                        scheduled_at: scheduled_at,
                        collection_location: null
                    })
                });
            }
            fetchApplications();
            setSelectedItems([]);
            logActivity(`Batch Approved ${pendingOrRejectedSelected.length} identity requests.`, 'approved');
        } catch (err) {
            console.error("Batch approval failed:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    // Batch Print IDs Workflow
    const triggerBatchPrint = (orientation) => {
        setSelectedOrientation(orientation);
        setShowPrintPreview(true);
    };

    const handleProductionStart = async () => {
        setIsDeploying(true);
        setDeployStatus('Preparing PDF layout...');
        try {
            const isPortraitID = selectedOrientation === 'portrait';
            const pdfWidthMm = isPortraitID ? 297 : 210; // Portrait IDs use landscape A4, Landscape IDs use portrait A4
            const pdfHeightMm = isPortraitID ? 210 : 297;

            const sheets = document.querySelectorAll('[data-capture-sheet]');
            if (sheets.length === 0) throw new Error('Preview sheets not generated.');

            const pdf = new jsPDF({
                orientation: isPortraitID ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const appsToPrint = filteredApps.filter(app => {
                const template = templateByRole[app.user?.role_context];
                const orient = template?.orientation || 'portrait';
                return orient === selectedOrientation && selectedItems.includes(app.id);
            });

            for (let i = 0; i < sheets.length; i++) {
                setDeployStatus(`Capturing layout page ${i + 1} of ${sheets.length}...`);
                sheets[i].scrollIntoView({ behavior: 'instant', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(sheets[i], {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

                if (i > 0) pdf.addPage([pdfWidthMm, pdfHeightMm], isPortraitID ? 'landscape' : 'portrait');
                pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm);
            }

            const filename = `RegisSys_Batch_${selectedOrientation}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);

            setDeployStatus('Archiving print batch records...');
            for (const app of appsToPrint) {
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'printed' })
                });
            }

            setShowPrintPreview(false);
            setSelectedOrientation(null);
            setSelectedItems([]);
            fetchApplications();
            logActivity(`Batch generated: ${appsToPrint.length} IDs archived to Dispatch queue`, 'print');
        } catch (err) {
            console.error('PDF Batch generation failed:', err);
            alert(`Error generating printing sheet: ${err.message}`);
        } finally {
            setIsDeploying(false);
            setDeployStatus('');
        }
    };

    // Branch pickup notification modal trigger
    const triggerPickupNotification = (apps) => {
        setNotifyApps(Array.isArray(apps) ? apps : [apps]);
        setTempLocation(collectionLocation);
        setShowNotifyModal(true);
    };

    const confirmPickupNotification = async () => {
        setShowNotifyModal(false);
        setIsDeploying(true);
        setDeployStatus("Notifying users for pick-up...");
        const finalLocation = tempLocation || collectionLocation;
        try {
            for (const app of notifyApps) {
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        is_ready: true,
                        collection_location: finalLocation
                    })
                });
            }
            fetchApplications();
            setSelectedItems([]);
            logActivity(`Notified ${notifyApps.length} users for local card collection`, 'notify');
        } catch (err) {
            console.error("Failed to notify users:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    // Courier Shipment Logistics (Arrange Shipment)
    const triggerShippingArrangement = (apps) => {
        const appsList = Array.isArray(apps) ? apps : [apps];
        setShippingApps(appsList);
        setShippingStep("connecting");
        setShipmentProgress(0);
        setShowShippingModal(true);

        // Simulate connecting with high-fidelity logistics API
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setShipmentProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                // Generate tracking numbers
                const generated = {};
                appsList.forEach(app => {
                    generated[app.id] = `JT-PH-${Math.floor(100000000 + Math.random() * 900000000)}`;
                });
                setGeneratedWaybillNumbers(generated);
                setShippingStep("waybill");
            }
        }, 150);
    };

    const confirmShipmentDispatch = async () => {
        setShowShippingModal(false);
        setIsDeploying(true);
        setDeployStatus("Registering waybills...");
        try {
            for (const app of shippingApps) {
                const trkNum = generatedWaybillNumbers[app.id] || `JT-PH-${Math.floor(100000000 + Math.random() * 900000000)}`;
                await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tracking_number: trkNum,
                        fee_paid: true
                    })
                });
            }
            fetchApplications();
            setSelectedItems([]);
            logActivity(`Waybills registered & dispatched to J&T Courier for ${shippingApps.length} shipments`, 'delivery');
        } catch (err) {
            console.error("Fulfillment shipping fail:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    // Courier Scan Simulation
    const handleCourierRiderScan = async (app) => {
        setIsDeploying(true);
        setDeployStatus("Courier scanning barcode...");
        try {
            await fetch(`${API_BASE_URL}/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "completed"
                })
            });
            fetchApplications();
            logActivity(`Courier Rider scanned Waybill for ${app.user?.name}. Package status set to IN TRANSIT.`, 'scan');
        } catch (err) {
            console.error("Courier scan failed:", err);
        } finally {
            setIsDeploying(false);
            setDeployStatus("");
        }
    };

    const getGroupedApplications = () => {
        const landscape = [];
        const portrait = [];

        filteredApps.forEach(app => {
            const template = templateByRole[app.user?.role_context];
            if (template?.orientation === 'landscape') {
                landscape.push(app);
            } else {
                portrait.push(app);
            }
        });

        return { landscape, portrait };
    };

    const groupedApps = getGroupedApplications();

    return (
        <>
            <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-2 animate-in fade-in duration-700 font-sans">
                {/* ── TOP-LEVEL SPLIT-QUEUE TABS ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: "all", label: "All Requests", count: stats.all, icon: <Inbox className="w-4 h-4" />, color: "border-slate-200 text-slate-700 bg-slate-50" },
                            { id: "vault", label: "Approve", count: stats.vault, icon: <ShieldCheck className="w-4 h-4" />, color: "border-emerald-200 text-emerald-700 bg-emerald-50" },
                            { id: "printing", label: "Physical ID Queue", count: stats.printing, icon: <Printer className="w-4 h-4" />, color: "border-blue-200 text-blue-700 bg-blue-50" },
                            { id: "shipping", label: "To Ship", count: stats.shipping, icon: <Truck className="w-4 h-4" />, color: "border-indigo-200 text-indigo-700 bg-indigo-50" },
                            { id: "pickup", label: "For Pick-up", count: stats.pickup, icon: <MapPin className="w-4 h-4" />, color: "border-amber-200 text-amber-700 bg-amber-50" },
                            { id: "claim", label: "Claim Scanner", count: stats.pickup, icon: <QrCode className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />, color: "border-emerald-200 text-emerald-700 bg-emerald-50" },
                            { id: "completed", label: "Archived", count: stats.completed, icon: <Archive className="w-4 h-4" />, color: "border-slate-200 text-slate-600 bg-slate-50" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedApp(null);
                                    setSelectedItems([]);
                                }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-black tracking-widest transition-all ${activeTab === tab.id
                                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10 scale-95"
                                    : "bg-white hover:bg-slate-50 border-slate-100 text-slate-500"
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${activeTab === tab.id
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 text-slate-600"
                                    }`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                </div>

                {/* ── MAIN DISPATCH CONTENT AREA ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* ── PIPELINE VIEW CENTER (LEFT/MIDDLE) ── */}
                    <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-w-0 transition-all duration-500 ease-in-out">
                        {/* ── INTERNAL SEARCH TOOLBAR ── */}
                        <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/20 flex items-center justify-end shrink-0">
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2 pl-11 pr-4 text-[10px] font-black tracking-widest outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {activeTab === "printing" && (
                            <div className="px-6 pt-5 pb-4 border-b border-slate-100/60 bg-slate-50/20 flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-2 bg-slate-50 border border-slate-100/50 p-1.5 rounded-2xl w-fit">
                                    <button
                                        onClick={() => { setPrintingSubTab("portrait"); setSelectedItems([]); }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${printingSubTab === "portrait"
                                            ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600 border border-transparent"
                                            }`}
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Portrait ({allApps.filter(app => app.status === 'approved' && app.admin_notes === 'approved_for_printing' && (templateByRole[app.user?.role_context]?.orientation || 'portrait') === 'portrait').length})
                                    </button>
                                    <button
                                        onClick={() => { setPrintingSubTab("landscape"); setSelectedItems([]); }}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${printingSubTab === "landscape"
                                            ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600 border border-transparent"
                                            }`}
                                    >
                                        <FileVideo className="w-3.5 h-3.5" /> Landscape ({allApps.filter(app => app.status === 'approved' && app.admin_notes === 'approved_for_printing' && templateByRole[app.user?.role_context]?.orientation === 'landscape').length})
                                    </button>
                                </div>
                                <span className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-100/50 px-3.5 py-2 rounded-xl border border-slate-200/50">
                                    🖨️ Orientation Filter
                                </span>
                            </div>
                        )}

                        {/* Header Controls for selected items */}
                        {filteredApps.length > 0 && (
                            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center hover:border-slate-400 bg-white transition-all"
                                    >
                                        {filteredApps.every(app => selectedItems.includes(app.id)) && (
                                            <Check className="w-4 h-4 text-slate-800 stroke-[3]" />
                                        )}
                                    </button>
                                    <span className="text-xs font-black text-slate-500  tracking-widest">
                                        Select All Visible ({filteredApps.length})
                                    </span>
                                </div>


                                {/* Batch Action Triggers */}
                                {selectedItems.length > 0 && (
                                    <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
                                        <span className="text-xs font-black text-slate-400  tracking-widest self-center mr-2">
                                            {selectedItems.length} Selected
                                        </span>
                                        {activeTab === "all" && (
                                            <button
                                                onClick={handleBatchApprove}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black tracking-widest transition-all shadow-lg active:scale-95 shadow-slate-900/10"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Selected ({filteredApps.filter(app => selectedItems.includes(app.id) && (app.status === 'pending' || app.status === 'rejected')).length})
                                            </button>
                                        )}
                                        {activeTab === "vault" && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleBatchApprovePrint}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black  tracking-widest transition-all shadow-lg active:scale-95 shadow-emerald-900/10"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Approve Print Selected ({filteredApps.filter(app => selectedItems.includes(app.id) && app.user?.attributes?.physical_id_requested === true && app.admin_notes !== 'approved_for_printing').length})
                                                </button>
                                                <button
                                                    onClick={handleBatchArchiveVault}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black  tracking-widest transition-all shadow-lg active:scale-95 shadow-slate-900/10"
                                                >
                                                    <Archive className="w-3.5 h-3.5" /> Archive Selected ({selectedItems.length})
                                                </button>
                                            </div>
                                        )}
                                        {activeTab === "printing" && (
                                            <>
                                                {printingSubTab === "landscape" && (
                                                    <button
                                                        onClick={() => triggerBatchPrint("landscape")}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black  tracking-widest transition-all shadow-lg shadow-emerald-100"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" /> Batch Print Landscape ({selectedItems.length})
                                                    </button>
                                                )}
                                                {printingSubTab === "portrait" && (
                                                    <button
                                                        onClick={() => triggerBatchPrint("portrait")}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black  tracking-widest transition-all shadow-lg shadow-indigo-100"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" /> Batch Print Portrait ({selectedItems.length})
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {activeTab === "shipping" && (
                                            <button
                                                onClick={() => {
                                                    const selected = filteredApps.filter(app => selectedItems.includes(app.id));
                                                    triggerShippingArrangement(selected);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                                            >
                                                <Truck className="w-3.5 h-3.5" /> Arrange Batch Shipment
                                            </button>
                                        )}
                                        {activeTab === "pickup" && (
                                            <button
                                                onClick={() => {
                                                    const selected = filteredApps.filter(app => selectedItems.includes(app.id));
                                                    triggerPickupNotification(selected);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-100"
                                            >
                                                <BellRing className="w-3.5 h-3.5" /> Notify Batch for Pickup
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Pipeline Lists */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {activeTab === "claim" ? (
                                <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[500px] animate-in fade-in duration-500 text-slate-800">
                                    {/* Left Column: Live Scan Terminal */}
                                    <div className="flex-1 max-w-xl bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                        <ScanLine className="w-4 h-4 text-emerald-500 animate-pulse" /> Claim Scanner
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 w-fit">
                                                        <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={staffName}
                                                            onChange={(e) => setStaffName(e.target.value)}
                                                            placeholder="Staff Name..."
                                                            className="bg-transparent border-none outline-none text-[10px] font-black text-slate-700 placeholder:text-slate-300 w-32 uppercase tracking-wider"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Camera Selector Dropdown */}
                                                {cameras.length > 1 && (
                                                    <select
                                                        value={selectedCameraId}
                                                        onChange={(e) => {
                                                            setSelectedCameraId(e.target.value);
                                                            startScanning(e.target.value);
                                                        }}
                                                        className="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-xl px-3 py-1.5 outline-none text-slate-600 focus:ring-2 focus:ring-emerald-100"
                                                    >
                                                        {cameras.map(device => (
                                                            <option key={device.id} value={device.id}>
                                                                {device.label || `Camera ${device.id.substring(0, 5)}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            {/* Viewfinder Container */}
                                            {(scannerPhase === 'scanning' || scannerPhase === 'flash') ? (
                                                <div className="relative w-full aspect-square max-w-[360px] mx-auto rounded-[2rem] overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-2xl flex items-center justify-center">
                                                    <div id="qr-reader-claim-station" className="w-full h-full object-cover" />

                                                    {/* Retro Translucent Target Overlay */}
                                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                        <div className={`relative w-48 h-48 transition-all duration-300 ${scannerPhase === 'flash' ? 'scale-110 opacity-100' : 'opacity-80'
                                                            }`}>
                                                            {/* Brackets */}
                                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                                                            {/* Sweeper Scanning line */}
                                                            {scannerPhase === 'scanning' && (
                                                                <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.7)] animate-[scanSweep_2.5s_ease-in-out_infinite]" />
                                                            )}

                                                            {/* Flash Success Screen overlay */}
                                                            {scannerPhase === 'flash' && (
                                                                <div className="absolute inset-0 bg-emerald-400/40 rounded-xl animate-ping" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Static view when not scanning */
                                                <div className="w-full aspect-square max-w-[360px] mx-auto rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                                                        <CheckCircle className="w-8 h-8" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-600 tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">Capture Verified</span>
                                                    <p className="text-xs font-bold text-slate-400 mt-2">The camera has completed verification. Complete handover on the right panel.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Manual search input with state details */}
                                        <div className="mt-6 pt-6 border-t border-slate-100 text-left">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Or enter registration credentials</span>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search student name, email, or ID..."
                                                        value={manualQuery}
                                                        onChange={(e) => setManualQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleManualSearch(manualQuery)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-50 transition-all text-slate-800"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleManualSearch(manualQuery)}
                                                    disabled={searchLoading}
                                                    className="px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 shadow-lg shadow-slate-900/10 flex items-center gap-1.5"
                                                >
                                                    {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />} Search
                                                </button>
                                            </div>

                                            {searchError && (
                                                <div className="mt-3 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-1 duration-200">
                                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                                    <span>{searchError}</span>
                                                </div>
                                            )}
                                            {scanError && (
                                                <div className="mt-3 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-1 duration-200">
                                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                                    <span>{scanError}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Handover Actions Desk */}
                                    <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-center min-h-[460px]">
                                        {scannerPhase === 'scanning' && (
                                            <div className="text-center py-12 flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 mb-6 relative">
                                                    <QrCode className="w-10 h-10 animate-[pulse_2s_infinite]" />
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full" />
                                                </div>
                                                <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Fulfillment Desk Ready</h4>
                                                <p className="text-xs font-medium text-slate-400 leading-relaxed mt-2">
                                                    Waiting for cardholder identity credentials. Point the claimant's Claim QR code at the camera, or search manually.
                                                </p>
                                            </div>
                                        )}

                                        {/* verified preview details */}
                                        {scannerPhase === 'result' && scannedApp && (
                                            <div className="w-full flex flex-col justify-between h-full animate-in slide-in-from-right-6 duration-500">
                                                {scannedApp.status === 'pending' ? (
                                                    // Pending/Alert Screen: Simple clean layout without preview
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2.5 mb-6">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                                                    Identity Found
                                                                </span>
                                                            </div>

                                                            <div className="text-left pb-6 border-b border-slate-100">
                                                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{scannedApp.user?.name}</h4>
                                                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{scannedApp.user?.role_context}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">ID: {scannedApp.user?.external_id || scannedApp.user?.id}</p>
                                                            </div>

                                                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start text-left my-6">
                                                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">⚠️ ID Printing Verification Guard</span>
                                                                    <p className="text-[10px] font-bold text-amber-600 leading-normal mt-0.5">
                                                                        This card is marked as &ldquo;pending&rdquo; in our systems instead of printed. Please check if the physical PVC is indeed created before handing over.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3 mt-6">
                                                            <button
                                                                onClick={() => {
                                                                    setScannerPhase('scanning');
                                                                    setScannedApp(null);
                                                                    setScanError(null);
                                                                    setClaimCardSide('front');
                                                                }}
                                                                className="w-full py-3.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <ScanLine className="w-4 h-4" /> Scan Again
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Ready for Pick-Up Screen: Premium Split-Screen with Digital ID Twin Card Preview
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        {scannedApp.status === 'completed' ? (
                                                            <div className="flex-1 flex flex-col items-center justify-between py-12 px-6">
                                                                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-700 shadow-xl shadow-emerald-100 max-w-sm w-full border-b-4 border-b-emerald-200">
                                                                    <div className="w-20 h-20 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 flex items-center justify-center mx-auto mb-6 border-4 border-white ring-8 ring-emerald-50 relative">
                                                                        <Check className="w-10 h-10 text-white stroke-[3]" />
                                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-xl font-black text-emerald-800 tracking-tighter leading-none mb-2">Handover Already Completed</h4>
                                                                    <div className="space-y-1.5 py-4 border-y border-emerald-100/50 my-4">
                                                                        <p className="text-[11px] font-black text-emerald-600/70 tracking-widest whitespace-nowrap">Released by {currentUser.role_context || 'Super Admin'}: <span className="text-emerald-800 font-black underline decoration-emerald-300 underline-offset-4">{(scannedApp.claimed_by === 'Super Admin' || scannedApp.claimed_by === 'Admin') ? 'Jehan Admin' : (scannedApp.claimed_by || 'Jehan Admin')}</span></p>


                                                                        {(() => {
                                                                            const cDate = new Date(scannedApp.claimed_at.endsWith('Z') ? scannedApp.claimed_at : scannedApp.claimed_at + 'Z');
                                                                            return (
                                                                                <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                                                                                    on {cDate.toLocaleDateString('en-GB')} at {cDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                                                                                </p>
                                                                            );
                                                                        })()}
                                                                    </div>


                                                                    <div className="py-2 px-3 bg-white/50 rounded-xl border border-emerald-100">
                                                                        <p className="text-[9px] font-black text-emerald-400 tracking-tight">Recipient Identity</p>
                                                                        <p className="text-xs font-black text-emerald-900">{scannedApp.user?.name}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="w-full flex flex-col gap-3 mt-8">
                                                                    <button
                                                                        onClick={() => {
                                                                            setScannerPhase('scanning');
                                                                            setScannedApp(null);
                                                                            setScanError(null);
                                                                            setClaimCardSide('front');
                                                                        }}
                                                                        className="w-full py-3.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <ScanLine className="w-4 h-4" /> Scan Again
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (

                                                            <>
                                                                <div className="flex flex-col xl:flex-row gap-8 text-left">
                                                                    {/* Left Sub-column: User verification metadata & Cabinet/Filing info */}
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2.5 mb-6">
                                                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                                                                Identity Found
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                                                                            <div className="w-20 h-20 rounded-3xl bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-white shadow-xl relative overflow-hidden">
                                                                                {scannedApp.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{scannedApp.user?.name}</h4>
                                                                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{scannedApp.user?.role_context}</p>
                                                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">ID: {scannedApp.user?.external_id || scannedApp.user?.id}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
                                                                            {/* Cabinet Filing Box Dinamic */}
                                                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 flex gap-3.5 items-center">
                                                                                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                                                    <Package className="w-5 h-5" />
                                                                                </div>
                                                                                <div className="text-left">
                                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cabinet Drawer Filing</span>
                                                                                    <span className="text-sm font-black text-slate-850">Box &ldquo;{getFilingLetter(scannedApp.user?.name)}&rdquo;</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Physical Counter Location */}
                                                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 flex gap-3.5 items-center">
                                                                                <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                                                                    <MapPin className="w-5 h-5" />
                                                                                </div>
                                                                                <div className="text-left">
                                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Collection Location</span>
                                                                                    <span className="text-sm font-black text-slate-850">
                                                                                        {scannedApp.collection_location || <span className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Unassigned</span>}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Right Sub-column: Interactive Digital ID Card Preview */}
                                                                    <div className="w-full xl:w-[320px] flex flex-col items-center shrink-0 bg-slate-50/80 border border-slate-100/80 rounded-[2rem] p-6 shadow-inner animate-in fade-in slide-in-from-right-4 duration-500">
                                                                        <div className="w-full flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3 text-left">
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                                <IdCard className="w-4 h-4 text-indigo-500" /> Digital ID
                                                                            </span>
                                                                            <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-200/20">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setClaimCardSide('front')}
                                                                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${claimCardSide === 'front'
                                                                                        ? 'bg-white text-slate-800 shadow-sm'
                                                                                        : 'text-slate-400 hover:text-slate-600'
                                                                                        }`}
                                                                                >
                                                                                    Front
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setClaimCardSide('back')}
                                                                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${claimCardSide === 'back'
                                                                                        ? 'bg-white text-slate-800 shadow-sm'
                                                                                        : 'text-slate-400 hover:text-slate-600'
                                                                                        }`}
                                                                                >
                                                                                    Back
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="w-full flex items-center justify-center overflow-hidden py-4">
                                                                            <div className="origin-center scale-[0.68] -my-20">
                                                                                <IDCard
                                                                                    user={scannedApp.user}
                                                                                    template={templateByRole[scannedApp.user?.role_context] || {}}
                                                                                    side={claimCardSide}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col gap-3 mt-6">
                                                                    <button
                                                                        onClick={async () => {
                                                                            setIsConfirmingHandover(true);
                                                                            try {
                                                                                const res = await fetch(`${API_BASE_URL}/applications/${scannedApp.id}/claim`, {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ claimed_by: staffName })
                                                                                });
                                                                                if (!res.ok) throw new Error();

                                                                                setScannerPhase('success');
                                                                                fetchApplications();
                                                                                logActivity(`Handed over printed ID card to ${scannedApp.user?.name}`, 'notify');

                                                                                setTimeout(() => {
                                                                                    setScannerPhase('scanning');
                                                                                    setScannedApp(null);
                                                                                    setScanError(null);
                                                                                    setClaimCardSide('front');
                                                                                }, 2500);
                                                                            } catch (e) {
                                                                                setScanError('Fulfillment failed. Connection error.');
                                                                            } finally {
                                                                                setIsConfirmingHandover(false);
                                                                            }
                                                                        }}
                                                                        disabled={isConfirmingHandover}
                                                                        className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-65 text-white font-black text-[11px] uppercase tracking-[1.5px] rounded-2xl transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                                                                    >
                                                                        {isConfirmingHandover ? (
                                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <UserCheck className="w-4 h-4" />
                                                                        )}
                                                                        {isConfirmingHandover ? "Processing Handover..." : "Confirm Handover Completed"}
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setScannerPhase('scanning');
                                                                            setScannedApp(null);
                                                                            setScanError(null);
                                                                            setClaimCardSide('front');
                                                                        }}
                                                                        className="w-full py-3.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <ScanLine className="w-4 h-4" /> Scan Again
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Celebration phase */}
                                        {scannerPhase === 'success' && scannedApp && (
                                            <div className="text-center py-10 flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 text-slate-800">
                                                <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 relative">
                                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-30" />
                                                </div>
                                                <h4 className="text-xl font-black text-slate-800 tracking-tight">Handover Complete!</h4>
                                                <p className="text-xs font-bold text-slate-400 mt-2 mb-1">{scannedApp.user?.name}</p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    Card successfully issued &middot; logged in ledger
                                                </p>

                                                <div className="mt-8 px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Auto-returning to camera in 2s
                                                </div>
                                            </div>
                                        )}
                                        {/* ── RECENT CLAIMS AUDIT ── */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black text-slate-400  tracking-widest flex items-center gap-2">
                                                    <History className="w-3.5 h-3.5" /> Recent Scanner Audit
                                                </h4>
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Live Activity Log</span>
                                            </div>

                                            <div className="space-y-2.5">
                                                {allApps
                                                    .filter(app => app.status === 'completed' && app.claimed_at)
                                                    .sort((a, b) => new Date(b.claimed_at) - new Date(a.claimed_at))
                                                    .slice(0, 3)
                                                    .map(claim => (
                                                        <div key={claim.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 ring-2 ring-white">
                                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[9px] font-bold text-slate-400 tracking-tight">
                                                                        ID claimed: <span className="text-slate-800 font-black">{claim.user?.name}</span>
                                                                    </p>
                                                                    <p className="text-[9px] font-bold text-slate-400 tracking-tight">
                                                                        Released by {currentUser.role_context || 'Super Admin'}: <span className="text-indigo-700 font-black">{(claim.claimed_by === 'Super Admin' || claim.claimed_by === 'Admin') ? 'Jehan Admin' : (claim.claimed_by || 'Jehan Admin')}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-slate-400">{claim.claimed_at ? new Date(claim.claimed_at.endsWith('Z') ? claim.claimed_at : claim.claimed_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase() : '---'}</p>

                                                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Today</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                                {allApps.filter(app => app.status === 'completed' && app.claimed_at).length === 0 && (
                                                    <div className="py-8 text-center bg-slate-50/30 border border-dashed border-slate-100 rounded-2xl">
                                                        <ShieldCheck className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No recent claims in current session</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <RefreshCw className="w-12 h-12 text-slate-300 animate-spin mb-4" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Databases...</p>
                                </div>
                            ) : filteredApps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl p-8">
                                    <Inbox className="w-16 h-16 text-slate-200 mb-4" />
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">All Requests Processed</h3>
                                    <p className="text-xs font-bold text-slate-400 text-center mt-2 max-w-xs leading-relaxed">
                                        There are currently no pending requests in this queue. All items have been successfully dispatched.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="pb-4 w-12 text-center"></th>
                                                <th className="pb-4 pl-4">User Details</th>
                                                <th className="pb-4">Request Date</th>
                                                {activeTab === "shipping" && <th className="pb-4">Fulfillment / Method</th>}
                                                {activeTab === "shipping" && <th className="pb-4">Delivery Address</th>}
                                                {activeTab === "pickup" && <th className="pb-4">Pickup Location</th>}
                                                {activeTab === "pickup" && <th className="pb-4 w-48">Alphabet Box Tag</th>}
                                                <th className="pb-4 text-center">Status</th>
                                                <th className="pb-4 text-right pr-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredApps.map(app => {
                                                const fileLetter = getFilingLetter(app.user?.name);
                                                const isUnverified = app.fulfillment_method === 'delivery' && isAddressUnverified(app.shipping_address);

                                                return (
                                                    <tr
                                                        key={app.id}
                                                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                                                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer group/row ${selectedApp?.id === app.id ? "bg-slate-50/60" : ""}`}
                                                    >
                                                        <td className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => toggleSelect(app.id)}
                                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedItems.includes(app.id)
                                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                                    : "border-slate-200 hover:border-slate-400 bg-white"
                                                                    }`}
                                                            >
                                                                {selectedItems.includes(app.id) && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                            </button>
                                                        </td>
                                                        <td className="py-4 pl-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-100 text-xs shrink-0 uppercase">
                                                                    {app.user?.name ? app.user.name.charAt(0) : "U"}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800 leading-none mb-1 group-hover/row:text-slate-900 transition-colors">{app.user?.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{app.user?.role_context || "Student"}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-xs font-bold text-slate-600">
                                                            {new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>

                                                        {/* Fulfillment Column for Courier */}
                                                        {activeTab === "shipping" && (
                                                            <td className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Doorstep Delivery</span>
                                                                    <span className="text-[9px] font-medium text-slate-400 mt-0.5">J&T Express Courier</span>
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* Address Column with Smart Flagged Alert */}
                                                        {activeTab === "shipping" && (
                                                            <td className="py-4 max-w-[200px]">
                                                                {isUnverified ? (
                                                                    <div className="flex flex-col bg-rose-50 border border-rose-100 p-2 rounded-xl text-rose-700 animate-pulse">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Flagged: Invalid Address
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-rose-600 mt-1 truncate">{app.shipping_address || "No Address Provided"}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-slate-600 truncate">{app.shipping_address ? app.shipping_address.split(' | ')[2] || app.shipping_address : "Standard Address"}</span>
                                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">✓ Coordinates Confirmed</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}

                                                        {/* Pickup Location Column */}
                                                        {activeTab === "pickup" && (
                                                            <td className="py-4">
                                                                {app.collection_location ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                                                        <span className="text-xs font-bold text-slate-700">{app.collection_location}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-600/80">
                                                                        <MapPin className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest">Unassigned</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}

                                                        {/* Alphabet filing drawer indicator */}
                                                        {activeTab === "pickup" && (
                                                            <td className="py-4">
                                                                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px] uppercase shadow-sm">
                                                                        {fileLetter}
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                                        Filing drawer "{fileLetter}"
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* Color-Coded Status tags */}
                                                        <td className="py-4 text-center">
                                                            {app.status === 'pending' && (
                                                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100">
                                                                    Pending Review
                                                                </span>
                                                            )}
                                                            {app.status === 'rejected' && (
                                                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100">
                                                                    Rejected
                                                                </span>
                                                            )}
                                                            {app.status === 'approved' && app.admin_notes !== 'approved_for_printing' && (
                                                                app.user?.attributes?.physical_id_requested === true ? (
                                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100">
                                                                        Requesting Physical ID
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100">
                                                                        Identity Verified
                                                                    </span>
                                                                )
                                                            )}
                                                            {app.status === 'approved' && app.admin_notes === 'approved_for_printing' && (
                                                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100">
                                                                    Ready to Print
                                                                </span>
                                                            )}
                                                            {app.status === 'printed' && app.fulfillment_method === 'delivery' && (
                                                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100">
                                                                    {app.tracking_number ? "In Transit (Shipped)" : "To Ship"}
                                                                </span>
                                                            )}
                                                            {app.status === 'printed' && app.fulfillment_method === 'pickup' && (
                                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${app.is_ready
                                                                    ? "text-amber-600 bg-amber-50 border border-amber-100 animate-pulse"
                                                                    : "text-slate-500 bg-slate-100"
                                                                    }`}>
                                                                    {app.is_ready ? "Awaiting Pickup" : "Printed (Organizing)"}
                                                                </span>
                                                            )}
                                                            {app.status === 'completed' && (
                                                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Column Action buttons */}
                                                        <td className="py-4 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                                            {app.status === 'approved' && app.admin_notes === 'approved_for_printing' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrientation(templateByRole[app.user?.role_context]?.orientation || 'portrait');
                                                                        setSelectedItems([app.id]);
                                                                        setShowPrintPreview(true);
                                                                    }}
                                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-100"
                                                                >
                                                                    Print ID
                                                                </button>
                                                            )}
                                                            {app.status === 'approved' && app.admin_notes !== 'approved_for_printing' && app.user?.attributes?.physical_id_requested === true && (
                                                                <button
                                                                    onClick={() => handleAction(app.id, "approved", "approved_for_printing")}
                                                                    className="px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 animate-pulse"
                                                                >
                                                                    Go to Print
                                                                </button>
                                                            )}
                                                            {app.status === 'printed' && app.fulfillment_method === 'delivery' && !app.tracking_number && (
                                                                <button
                                                                    onClick={() => triggerShippingArrangement(app)}
                                                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100"
                                                                >
                                                                    Arrange Shipment
                                                                </button>
                                                            )}
                                                            {app.status === 'printed' && app.fulfillment_method === 'delivery' && app.tracking_number && (
                                                                <button
                                                                    onClick={() => handleCourierRiderScan(app)}
                                                                    className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-100"
                                                                >
                                                                    Scan Rider Handover
                                                                </button>
                                                            )}
                                                            {app.status === 'printed' && app.fulfillment_method === 'pickup' && !app.is_ready && (
                                                                <button
                                                                    onClick={() => triggerPickupNotification(app)}
                                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-100 pulsing-btn"
                                                                >
                                                                    Notify Ready
                                                                </button>
                                                            )}
                                                            {(app.status === 'pending' || app.status === 'rejected') && (
                                                                <button
                                                                    onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                                                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    Proof Info
                                                                </button>
                                                            )}
                                                            {app.status === 'completed' && (
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Done</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* ── RIGHT CANVAS DETAILS BAR ── */}
                    {activeTab !== "claim" && (
                        <div className={`flex flex-col gap-6 shrink-0 h-full overflow-hidden transition-all duration-500 ease-in-out ${selectedApp ? 'w-[660px] opacity-100 translate-x-0 ml-6' : 'w-0 opacity-0 translate-x-full ml-0 pointer-events-none'}`}>
                            {/* Live review Canvas */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center justify-between mb-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-slate-800" />
                                        <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">Live Review Canvas</h3>
                                    </div>
                                    {selectedApp && (
                                        <button
                                            onClick={() => setSelectedApp(null)}
                                            className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {selectedApp ? (
                                    <div className="w-full flex flex-col">
                                        <div className="flex gap-1.5 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100/50 mb-1 self-center">
                                            <button
                                                onClick={() => setPreviewSide('front')}
                                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${previewSide === 'front' ? 'bg-slate-900 text-white shadow-lg border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Front
                                            </button>
                                            <button
                                                onClick={() => setPreviewSide('back')}
                                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${previewSide === 'back' ? 'bg-slate-900 text-white shadow-lg border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Back
                                            </button>
                                        </div>

                                        <div
                                            onClick={() => setIsFullPreview(true)}
                                            className="flex flex-col gap-2 items-center scale-[0.6] origin-center -my-32 self-center relative group cursor-pointer hover:scale-[0.62] transition-all"
                                            title="Click to expand"
                                        >
                                            <div className="flex flex-col items-center gap-3">

                                                <IDCard
                                                    user={selectedApp.user}
                                                    template={templateByRole[selectedApp.user?.role_context] || {}}
                                                    side={previewSide}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2 w-full pt-2 space-y-4">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Verification</h4>
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                                        <span>Applicant Name</span>
                                                        <span className="text-slate-800">{selectedApp.user?.name}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                                        <span>Fulfillment Method</span>
                                                        <span className="text-indigo-600 font-black uppercase tracking-wider">{selectedApp.fulfillment_method}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons for selectedApp */}
                                            <div className="pt-2 space-y-2">
                                                {(selectedApp.status === "pending" || selectedApp.status === "rejected") && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(selectedApp.id, "approved")}
                                                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" /> Approve Identity
                                                        </button>
                                                        {selectedApp.status === "pending" && (
                                                            <button
                                                                onClick={() => handleAction(selectedApp.id, "rejected")}
                                                                className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95"
                                                            >
                                                                Deny Request
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {selectedApp.status === "rejected" && (
                                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                                                        <XCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                                                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Request Rejected</p>
                                                        <p className="text-[10px] font-medium text-rose-500/70 mt-1">This request was previously rejected. You can re-evaluate the proof details and approve it once resolved.</p>
                                                    </div>
                                                )}
                                                {selectedApp.status === "approved" && selectedApp.admin_notes !== "approved_for_printing" && (
                                                    selectedApp.user?.attributes?.physical_id_requested === true ? (
                                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center space-y-3">
                                                            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Requesting Physical ID</p>
                                                            <p className="text-[10px] font-medium text-amber-500/70">The user has requested a physical card ({selectedApp.fulfillment_method === 'delivery' ? 'Doorstep Delivery' : 'Self Collection'}). Approve the print request to move it to the production queue.</p>
                                                            <button
                                                                onClick={() => handleAction(selectedApp.id, "approved", "approved_for_printing")}
                                                                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md"
                                                            >
                                                                Go to Print
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                                                            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Identity Verified</p>
                                                            <p className="text-[10px] font-medium text-emerald-500/70 mt-1">This identity has been verified. The user hasn't requested a physical card yet — they'll appear in the Physical ID Queue once they apply.</p>
                                                        </div>
                                                    )
                                                )}
                                                {selectedApp.status === "approved" && selectedApp.admin_notes === "approved_for_printing" && (
                                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                                                        <Printer className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-bounce" />
                                                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Queued for Printing</p>
                                                        <p className="text-[10px] font-medium text-blue-500/70 mt-1">Physical ID requested. Use the Physical ID Queue tab to batch print the PVC card.</p>
                                                    </div>
                                                )}
                                                {selectedApp.status === "printed" && (
                                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                                                        <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-spin-slow" />
                                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Fulfillment Phase</p>
                                                        <p className="text-[10px] font-medium text-amber-500/70 mt-1">Physical card has been produced. Standard local/postal delivery processing in place.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-slate-300">
                                        <Eye className="w-12 h-12 mx-auto mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">Select record for Digital ID Preview</p>
                                    </div>
                                )}
                            </div>


                        </div>
                    )}
                </div>

                {/* ── COURIER SHIPPING LOGISTICS MODAL (Shopee/TikTok Style) ── */}
                {showShippingModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1a234b]/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500">
                            {shippingStep === "connecting" ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Connecting to J&T Courier Systems</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-2">Uploading metadata specifications and generating printable waybills...</p>

                                    <div className="w-full bg-slate-100 h-2 rounded-full mt-8 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-150 rounded-full"
                                            style={{ width: `${shipmentProgress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-indigo-600 mt-2">{shipmentProgress}% Complete</span>
                                </div>
                            ) : (
                                <>
                                    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Truck className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <h3 className="text-base font-black text-slate-800 tracking-tight">Arrange Shipment Waybill</h3>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">J&T Logistics Integrated Portal</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowShippingModal(false)}
                                            className="text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-100/30">
                                        {shippingApps.map(app => (
                                            <div key={app.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
                                                {/* WAYBILL TEMPLATE DESIGN */}
                                                <div className="border-2 border-slate-900 rounded-2xl p-4 flex flex-col relative overflow-hidden font-mono bg-white text-slate-900">
                                                    <div className="absolute right-0 top-0 bg-slate-900 text-white px-4 py-2 font-black text-xs uppercase tracking-widest rounded-bl-xl">
                                                        J&T Express
                                                    </div>

                                                    <div className="border-b-2 border-dashed border-slate-900 pb-3 flex justify-between items-end">
                                                        <div>
                                                            <span className="text-[10px] font-black block uppercase text-slate-400">WAYBILL TRACKING</span>
                                                            <span className="text-sm font-black tracking-tighter">{generatedWaybillNumbers[app.id]}</span>
                                                        </div>
                                                    </div>

                                                    <div className="py-4 border-b-2 border-dashed border-slate-900 flex flex-col items-center justify-center gap-2">
                                                        {/* Simulated Barcode */}
                                                        <div className="flex items-center gap-[2px] h-10 w-full px-4">
                                                            {Array.from({ length: 45 }).map((_, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-slate-900 h-full shrink-0"
                                                                    style={{ width: `${(idx % 3 === 0 || idx % 7 === 0) ? '3px' : '1px'}` }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[4px]">{generatedWaybillNumbers[app.id]}</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 py-4 text-[10px] leading-tight border-b-2 border-dashed border-slate-900">
                                                        <div>
                                                            <span className="font-black text-slate-400 uppercase block mb-1">SENDER</span>
                                                            <span className="font-bold block">UNIVERSITY REGISTRAR</span>
                                                            <span>Window 3, Main Administration Hall</span>
                                                            <span>Metro Manila, Philippines</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-black text-slate-400 uppercase block mb-1">RECIPIENT</span>
                                                            <span className="font-bold block">{app.user?.name}</span>
                                                            <span>{app.shipping_address ? app.shipping_address.split(' | ')[2] || app.shipping_address : "Standard Address"}</span>
                                                            <span>PH ({app.user?.attributes?.phone || "0917-XXXX"})</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 flex justify-between items-center text-[10px]">
                                                        <div>
                                                            <span className="font-black text-slate-400 uppercase block">CONTENT</span>
                                                            <span className="font-bold">1x Physical PVC ID Card</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-slate-400 uppercase block">COD AMOUNT</span>
                                                            <span className="font-bold text-xs">PHP 0.00 (PAID)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-3">
                                        <button
                                            onClick={() => setShowShippingModal(false)}
                                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmShipmentDispatch}
                                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                        >
                                            Print label & Dispatch
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── PICKUP LOCATION AND NOTIFY MODAL ── */}
                {showNotifyModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1a234b]/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500">
                            <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Confirm Pickup Desk</h3>
                                <p className="text-xs font-bold text-slate-400 mt-2">Where should the user claim their printed PVC card?</p>
                            </div>

                            <div className="p-8 pt-4 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Assignment Desk / Room</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={tempLocation}
                                        onChange={(e) => setTempLocation(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-100 transition-all font-sans"
                                        placeholder="e.g. Main Registrar Desk, Window 2"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowNotifyModal(false)}
                                        className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmPickupNotification}
                                        className="flex-1 py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                                    >
                                        Notify User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BATCH PRINT PREVIEW SHEET OVERLAY ── */}
                {showPrintPreview && (
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-slate-50 w-full max-w-7xl h-[92vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">

                            {/* Header Panel */}
                            <div className="p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                        <Printer className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Print Layout Preview</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            Orientation: {selectedOrientation?.toUpperCase()} Double-Sided Optimization
                                        </p>
                                    </div>
                                </div>

                                {/* Print Instruction Callout Banner */}
                                <div className="bg-amber-50/60 border border-amber-100/80 rounded-2xl p-4 flex items-start gap-3 max-w-xl text-left">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-0.5">🖨️ Required Print Setup Instructions</span>
                                        <p className="text-[10px] font-bold text-slate-600 leading-normal">
                                            Pre-scaled to standard PVC format (<strong className="text-slate-950">3.375 x 2.125 inches</strong>). In your browser/system print settings, you <strong className="text-amber-800">MUST</strong> select <strong className="text-slate-950">"Actual Size"</strong> or set <strong className="text-slate-950">"Scale: 100%"</strong> to prevent margins from stretching the cards.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowPrintPreview(false)}
                                        className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleProductionStart}
                                        className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[1.5px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Generate Print PDF
                                    </button>
                                </div>
                            </div>

                            {/* Sheets Preview Area */}
                            <div id="preview-sheets-container" className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-200/40 flex flex-col gap-16 items-center">
                                {(() => {
                                    const appsToPrint = filteredApps.filter(app => {
                                        const template = templateByRole[app.user?.role_context];
                                        const orient = template?.orientation || 'portrait';
                                        return orient === selectedOrientation && selectedItems.includes(app.id);
                                    });

                                    const itemsPerSheet = selectedOrientation === 'portrait' ? 5 : 4;
                                    const totalSheets = Math.ceil(appsToPrint.length / itemsPerSheet);

                                    return Array.from({ length: totalSheets }).map((_, sheetIndex) => {
                                        const chunk = appsToPrint.slice(sheetIndex * itemsPerSheet, (sheetIndex + 1) * itemsPerSheet);

                                        return (
                                            <div key={sheetIndex} className="relative group/sheet w-fit flex flex-col items-center">
                                                <div className="w-full flex items-center justify-between px-2 mb-3">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <span>Page {sheetIndex + 1} of {totalSheets}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        <span className="text-indigo-600 font-bold">{chunk.length} / {itemsPerSheet} PVC Cards</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/80 border border-slate-100 px-3 py-1 rounded-lg">
                                                        A4 Sheet ({selectedOrientation === 'portrait' ? 'Landscape View' : 'Portrait View'})
                                                    </span>
                                                </div>

                                                <div
                                                    data-capture-sheet={sheetIndex}
                                                    className={selectedOrientation === 'portrait' ? 'print-portrait-sheet' : 'print-landscape-sheet'}
                                                >
                                                    {selectedOrientation === 'portrait' ? (
                                                        <>
                                                            {/* Row 1: Fronts */}
                                                            <div className="portrait-row">
                                                                {chunk.map(app => (
                                                                    <div key={app.id + '_front'} className="print-card">
                                                                        <div className="id-wrapper-portrait">
                                                                            <IDCard
                                                                                user={app.user}
                                                                                template={templateByRole[app.user?.role_context] || {}}
                                                                                side="front"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {/* Row 2: Backs */}
                                                            <div className="portrait-row">
                                                                {chunk.map(app => (
                                                                    <div key={app.id + '_back'} className="print-card">
                                                                        <div className="id-wrapper-portrait">
                                                                            <IDCard
                                                                                user={app.user}
                                                                                template={templateByRole[app.user?.role_context] || {}}
                                                                                side="back"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Landscape Rows (Front & Back side-by-side) */}
                                                            {chunk.map(app => (
                                                                <div key={app.id} className="landscape-row">
                                                                    <div className="print-card">
                                                                        <div className="id-wrapper-landscape">
                                                                            <IDCard
                                                                                user={app.user}
                                                                                template={templateByRole[app.user?.role_context] || {}}
                                                                                side="front"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="print-card">
                                                                        <div className="id-wrapper-landscape">
                                                                            <IDCard
                                                                                user={app.user}
                                                                                template={templateByRole[app.user?.role_context] || {}}
                                                                                side="back"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom high fidelity waybill styles */}
                <style>
                    {`
                    .print-portrait-sheet {
                        width: 297mm;
                        height: 210mm;
                        padding: 10mm 15mm;
                        display: flex;
                        flex-direction: column;
                        gap: 10mm;
                        justify-content: center;
                        align-items: center;
                        background: white;
                        box-sizing: border-box;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.08);
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                    }
                    .portrait-row {
                        display: flex;
                        gap: 4mm;
                        justify-content: center;
                    }
                    .print-landscape-sheet {
                        width: 210mm;
                        height: 297mm;
                        padding: 15mm 10mm;
                        display: flex;
                        flex-direction: column;
                        gap: 8mm;
                        justify-content: center;
                        align-items: center;
                        background: white;
                        box-sizing: border-box;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.08);
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                    }
                    .landscape-row {
                        display: flex;
                        gap: 8mm;
                        justify-content: center;
                    }
                    .print-card {
                        border: 0.1mm dashed #cbd5e1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                        background: white;
                        border-radius: 4.8mm;
                    }
                    .id-wrapper-portrait {
                        width: 53.98mm;
                        height: 85.60mm;
                        overflow: hidden;
                        position: relative;
                        background: white;
                    }
                    .id-wrapper-portrait > div {
                        transform: scale(0.6375, 0.647);
                        transform-origin: top left;
                    }
                    .id-wrapper-landscape {
                        width: 85.60mm;
                        height: 53.98mm;
                        overflow: hidden;
                        position: relative;
                        background: white;
                    }
                    .id-wrapper-landscape > div {
                        transform: scale(0.6470);
                        transform-origin: top left;
                    }
                    .pulsing-btn {
                        animation: pulseGlow 2s infinite;
                    }
                    @keyframes pulseGlow {
                        0% {
                            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
                        }
                        70% {
                            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
                        }
                        100% {
                            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                        }
                    }
                `}
                </style>
            </div>

            {/* ── QR SCANNER MODAL REMOVED ── */}
            {false && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-sm">

                        {/* Close button */}
                        <button
                            onClick={() => {
                                if (html5QrRef.current) {
                                    try { html5QrRef.current.stop().catch(() => { }); } catch (e) { }
                                    html5QrRef.current = null;
                                }
                                setShowScannerModal(false);
                                setScannerPhase('scanning');
                                setScannedApp(null);
                                setScanError(null);
                            }}
                            className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* ── SCANNING PHASE ── */}
                        {(scannerPhase === 'scanning' || scannerPhase === 'flash') && (
                            <div className="flex flex-col items-center">
                                <div className="mb-6 text-center">
                                    <p className="text-white font-black text-lg tracking-tight">Scan Claim QR</p>
                                    <p className="text-white/50 text-xs font-medium mt-1">Point camera at the user's Digital Claim Stub</p>
                                </div>

                                {/* Camera container */}
                                <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl">
                                    {/* Live camera feed - rendered by html5-qrcode */}
                                    <div
                                        id="qr-reader-mc"
                                        ref={el => {
                                            if (el && !html5QrRef.current) {
                                                import('html5-qrcode').then(({ Html5Qrcode }) => {
                                                    const scanner = new Html5Qrcode('qr-reader-mc');
                                                    html5QrRef.current = scanner;
                                                    scanner.start(
                                                        { facingMode: 'environment' },
                                                        { fps: 15, qrbox: { width: 180, height: 180 } },
                                                        async (decodedText) => {
                                                            try {
                                                                const payload = JSON.parse(decodedText);
                                                                if (payload.type !== 'ID_CARD_CLAIM') {
                                                                    setScanError('Invalid QR — not a Claim Stub.');
                                                                    return;
                                                                }
                                                                setScannerPhase('flash');
                                                                try { await scanner.stop(); } catch (e) { }
                                                                html5QrRef.current = null;

                                                                // Resolve via backend
                                                                const res = await fetch(`${API_BASE_URL}/applications/scan`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify(payload)
                                                                });
                                                                if (!res.ok) {
                                                                    const err = await res.json();
                                                                    setScanError(err.detail || 'Scan failed.');
                                                                    setScannerPhase('scanning');
                                                                    return;
                                                                }
                                                                const app = await res.json();
                                                                setScannedApp(app);
                                                                setTimeout(() => setScannerPhase('result'), 600);
                                                            } catch (e) {
                                                                setScanError('Could not read QR. Try again.');
                                                            }
                                                        },
                                                        () => { }
                                                    ).catch(err => setScanError('Camera access denied. Please allow camera permission.'));
                                                });
                                            }
                                        }}
                                        className="w-full h-full"
                                    />

                                    {/* Crosshair overlay */}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className={`relative w-44 h-44 ${scannerPhase === 'flash' ? 'opacity-100' : 'opacity-80'
                                            }`}>
                                            {/* Corner brackets */}
                                            <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                                            {/* Scan sweep line */}
                                            {scannerPhase === 'scanning' && (
                                                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)] animate-[scanSweep_2s_ease-in-out_infinite]" />
                                            )}
                                            {/* Flash on success */}
                                            {scannerPhase === 'flash' && (
                                                <div className="absolute inset-0 bg-emerald-400/30 rounded-lg animate-ping" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {scanError && (
                                    <div className="mt-4 px-4 py-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                        <p className="text-rose-300 text-xs font-bold">{scanError}</p>
                                    </div>
                                )}

                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-6">
                                    Waiting for QR Code...
                                </p>
                            </div>
                        )}

                        {/* ── RESULT PHASE ── */}
                        {scannerPhase === 'result' && scannedApp && (
                            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                                {/* Header */}
                                <div className="bg-[#1a234b] px-8 pt-8 pb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">QR Verified</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white">
                                            {scannedApp.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-base leading-tight">{scannedApp.user?.name}</p>
                                            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-0.5">{scannedApp.user?.role_context}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="px-8 py-6 space-y-4">
                                    {/* Item */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                            <CreditCard className="w-4.5 h-4.5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item to Handover</p>
                                            <p className="text-sm font-black text-slate-800">Physical PVC ID Card</p>
                                        </div>
                                    </div>

                                    {/* Filing location */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                            <Package className="w-4.5 h-4.5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filing Drawer</p>
                                            <p className="text-sm font-black text-slate-880">
                                                Alphabet Box &ldquo;{getFilingLetter(scannedApp.user?.name)}&rdquo;
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collection location */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-4.5 h-4.5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup Counter</p>
                                            <p className="text-sm font-black text-slate-800">
                                                {scannedApp.collection_location || <span className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Unassigned</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status guard */}
                                    {scannedApp.status !== 'printed' && scannedApp.status !== 'completed' && (
                                        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                            <p className="text-xs font-bold text-amber-700">Card not yet marked as printed. Verify with admin before handing over.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-8 pb-8 space-y-3">
                                    <button
                                        disabled={isConfirmingHandover || scannedApp.status === 'completed'}
                                        onClick={async () => {
                                            setIsConfirmingHandover(true);
                                            try {
                                                const res = await fetch(`${API_BASE_URL}/applications/${scannedApp.id}/claim`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ claimed_by: 'Admin' })
                                                });
                                                if (!res.ok) throw new Error();
                                                setScannerPhase('success');
                                                fetchApplications();
                                                logActivity(`ID card handed over to ${scannedApp.user?.name}`, 'notify');
                                            } catch (e) {
                                                setScanError('Handover failed. Please try again.');
                                            } finally {
                                                setIsConfirmingHandover(false);
                                            }
                                        }}
                                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        {isConfirmingHandover ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UserCheck className="w-4 h-4" />
                                        )}
                                        {isConfirmingHandover ? 'Processing...' : 'Confirm Handover'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScannerPhase('scanning');
                                            setScannedApp(null);
                                            setScanError(null);
                                        }}
                                        className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-black text-[11px] uppercase tracking-widest transition-all"
                                    >
                                        Wrong Person — Rescan
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── SUCCESS PHASE ── */}
                        {scannerPhase === 'success' && (
                            <div className="bg-white rounded-[2rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <p className="text-[#1a234b] font-black text-xl tracking-tight">Handover Complete</p>
                                <p className="text-slate-400 text-sm font-medium mt-2 mb-1">{scannedApp?.user?.name}</p>
                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                    Logged at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <div className="mt-3 px-4 py-2 bg-slate-50 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status updated → Completed</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowScannerModal(false);
                                        setScannerPhase('scanning');
                                        setScannedApp(null);
                                    }}
                                    className="mt-8 w-full py-4 rounded-2xl bg-[#1a234b] hover:bg-blue-900 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── FULL VIEW OVERLAY ── */}
            {isFullPreview && selectedApp && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsFullPreview(false)}
                        className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-white flex items-center justify-center transition-all group active:scale-95 border border-white/10"
                    >
                        <X className="w-7 h-7" />
                    </button>

                    <div className="flex flex-col items-center gap-12 animate-in zoom-in-95 duration-500 ease-out">
                        {/* Toggle in Fullscreen */}
                        <div className="flex gap-2 bg-white/5 p-2 rounded-2xl backdrop-blur-2xl border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setPreviewSide('front')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${previewSide === 'front' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Front
                            </button>
                            <button
                                onClick={() => setPreviewSide('back')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${previewSide === 'back' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Back
                            </button>
                        </div>

                        <div className="scale-[1.15] origin-center shadow-[0_0_120px_rgba(255,255,255,0.15)] rounded-[2.5rem]">
                            <IDCard
                                user={selectedApp.user}
                                template={templateByRole[selectedApp.user?.role_context] || {}}
                                side={previewSide}
                            />
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <h2 className="text-4xl font-black text-white tracking-tighter">{selectedApp.user?.name}</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-4 flex items-center gap-4">
                                <span className="w-8 h-[1px] bg-white/20"></span>
                                {selectedApp.user?.role_context} Official Identity
                                <span className="w-8 h-[1px] bg-white/20"></span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            @keyframes scanSweep {
                0% { top: 8px; }
                50% { top: calc(100% - 8px); }
                100% { top: 8px; }
            }
        `}</style>
        </>
    );
};

export default MissionControl;
