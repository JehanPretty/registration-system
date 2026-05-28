import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Steps, Upload, Result, Modal, Spin, Input, Form, Typography, Space, Row, Col, Card, message } from "antd";
import { UploadOutlined, CameraOutlined, CheckCircleOutlined, SyncOutlined, IdcardOutlined, QrcodeOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { Eye, X, ShieldCheck, ChevronRight, CheckCircle2, BadgeCheck, XCircle, Scan, Calendar, Ticket, MapPin, Sparkles, PenLine, AlertTriangle, Loader2, Truck, Plus, CreditCard } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { QRCode } from "react-qr-code";
import IDCard from "../components/IDCard";
import MapAddressPicker from "../components/MapAddressPicker";
import { API_BASE_URL } from "../config";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

import Step1Img from "../assets/images/Step1.png";
import Step2Img from "../assets/images/Step2.png";
import Step3Img from "../assets/images/Step3.png";
import FormalPhoto from "../assets/images/Formal_photo.jpg";
import InformalPhoto from "../assets/images/Informal_photo.png";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const ProgressTracker = ({ currentStep }) => {
    const steps = [
        { id: 1, label: "Data & Uploads" },
        { id: 2, label: "Biometric Syncing" },
        { id: 3, label: "Submission" },
    ];

    return (
        <div className="py-6 max-sm:py-4 px-6 max-sm:px-4 bg-white border border-slate-100 rounded-2xl shadow-sm mb-10 max-sm:mb-4 transition-all duration-500">
            <div className="max-w-sm mx-auto flex items-center justify-between relative">
                <div className="absolute top-3.5 left-0 right-0 h-[2px] bg-slate-100 z-0">
                    <div
                        className="h-full bg-[#1a234b] transition-all duration-700 ease-in-out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step) => {
                    const isActive = currentStep >= step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2
                  ${isActive ? 'bg-[#1a234b] border-[#1a234b] scale-110 shadow-lg shadow-blue-900/10' : 'bg-white border-slate-200'}
                  ${isCurrent ? 'ring-4 ring-blue-50' : ''}`}
                            >
                                {isActive ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                    <span className="text-[10px] font-black text-slate-400 mb-6">{step.id}</span>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold mt-2 transition-colors duration-500 ${isActive ? 'text-[#1a234b]' : 'text-slate-300'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DigitalID = ({ userData, setUserData }) => {
    const resolveImageUrl = (url) => {
        if (!url) return url;
        if (typeof url === 'string') {
            if (url.startsWith('/static')) {
                return `${API_BASE_URL}${url}`;
            }
            if (url.includes('/static/') && url.startsWith('http')) {
                const path = '/static/' + url.split('/static/').pop();
                return `${API_BASE_URL}${path}`;
            }
        }
        return url;
    };
    // File State (Persistent across refreshes)
    const [idPhoto, setIdPhoto] = useState(() => localStorage.getItem("digital_id_photo") || null);
    const [idDescriptor, setIdDescriptor] = useState(null);
    const [signature, setSignature] = useState(() => localStorage.getItem("digital_id_signature") || null);
    const [selfiePhoto, setSelfiePhoto] = useState(() => localStorage.getItem("digital_id_selfie") || null);

    // Application Flow State
    const [isApplying, setIsApplying] = useState(() => localStorage.getItem("digital_id_applying") === "true");
    const [currentStep, setCurrentStep] = useState(() => parseInt(localStorage.getItem("digital_id_step")) || 0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCongratsPopup, setShowCongratsPopup] = useState(false);

    // UI State
    const [showClaimingModal, setShowClaimingModal] = useState(false);
    const [biometricStatus, setBiometricStatus] = useState("idle"); // idle, matching, success
    const [faceMatchError, setFaceMatchError] = useState("");
    const [photoError, setPhotoError] = useState(false);
    const [signatureError, setSignatureError] = useState(false);
    const [removingSigBg, setRemovingSigBg] = useState(false);
    const [template, setTemplate] = useState(userData?.id_template || {});
    const [isTemplateLoaded, setIsTemplateLoaded] = useState(!!userData?.id_template);
    const [application, setApplication] = useState(null);
    const [isPhotoValid, setIsPhotoValid] = useState(null);
    const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFullPreview, setIsFullPreview] = useState(false);

    // Physical ID states
    const [showPhysicalIDRequest, setShowPhysicalIDRequest] = useState(false);
    const [fulfillmentMethod, setFulfillmentMethod] = useState(null); // 'pickup', 'delivery'
    const [scheduledDate, setScheduledDate] = useState(null);
    const [shippingAddress, setShippingAddress] = useState(userData?.attributes?.address || "");
    const [physicalIDStatus, setPhysicalIDStatus] = useState("idle"); // idle, production, ready, collected, shipping
    const [trackingId, setTrackingId] = useState("");

    // Delivery form state
    const [deliveryForm, setDeliveryForm] = useState({
        recipientName: userData?.name || "",
        phoneNumber: userData?.attributes?.phone || "",
        province: "",
        municipality: "",
        barangay: "",
        addressDetails: "",
    });
    const [phLocations, setPhLocations] = useState({});
    const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
    const [availableBarangays, setAvailableBarangays] = useState([]);
    const [mapConfirmed, setMapConfirmed] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    // FaceAPI State
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isFaceCentered, setIsFaceCentered] = useState(false);
    const [facePositionHint, setFacePositionHint] = useState("Face in the center");
    const [viewSide, setViewSide] = useState("front");

    // Liveness Detection State
    const [livenessProgress, setLivenessProgress] = useState(0);
    const [livenessInstruction, setLivenessInstruction] = useState('Position your face in the frame');
    const [livenessPhase, setLivenessPhase] = useState('idle'); // 'idle' | 'scanning' | 'success'
    const [frozenFrame, setFrozenFrame] = useState(null);
    const livenessRef = useRef({ challengeIndex: 0, holdFrames: 0, accumulated: 0 });
    const stubRef = useRef(null);

    const CHALLENGES = [
        { id: 'center', instruction: 'Look straight at camera', frames: 5, check: (nose, box) => Math.abs((nose.x - (box.x + box.width / 2)) / box.width) < 0.06 },
    ];
    const TOTAL_FRAMES = 5;

    // Camera Ref
    const videoRef = useRef(null);

    // Load PH locations for delivery form
    useEffect(() => {
        fetch(`${API_BASE_URL}/locations/ph`, { headers: { 'bypass-tunnel-reminder': 'true' } })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setPhLocations(data); })
            .catch(() => null);
    }, []);

    // Build province list from loaded PH locations (flat across all regions)
    const allProvinces = React.useMemo(() => {
        const provinces = new Set();
        Object.values(phLocations).forEach(regionData => {
            Object.keys(regionData).forEach(p => provinces.add(p));
        });
        return Array.from(provinces).sort();
    }, [phLocations]);

    const handleDeliveryFormChange = (field, value) => {
        setDeliveryForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'province') {
                next.municipality = '';
                next.barangay = '';
                // Find municipalities for this province
                let munis = [];
                Object.values(phLocations).forEach(regionData => {
                    if (regionData[value]) {
                        munis = Object.keys(regionData[value]).sort();
                    }
                });
                setAvailableMunicipalities(munis);
                setAvailableBarangays([]);
            }
            if (field === 'municipality') {
                next.barangay = '';
                let barangays = [];
                Object.values(phLocations).forEach(regionData => {
                    if (regionData[prev.province]?.[value]) {
                        barangays = Object.keys(regionData[prev.province][value]).sort();
                    }
                });
                setAvailableBarangays(barangays);
            }
            return next;
        });
    };

    const buildShippingAddress = () => {
        const { recipientName, phoneNumber, province, municipality, barangay, addressDetails } = deliveryForm;
        return [addressDetails, barangay, municipality, province].filter(Boolean).join(', ');
    };

    const handleMapLocationSelect = (mapped) => {
        const geoState = (mapped.state || "").toLowerCase();
        const geoCity = (mapped.city || "").toLowerCase();
        const geoBarangay = (mapped.barangay || "").toLowerCase();
        const geoStreet = mapped.street || "";

        let matchedProvince = "";
        let matchedMunicipality = "";
        let matchedBarangay = "";

        // Find closest matching Province
        const provKeys = allProvinces;
        for (const prov of provKeys) {
            const provLower = prov.toLowerCase();
            if (geoState.includes(provLower) || provLower.includes(geoState)) {
                matchedProvince = prov;
                break;
            }
        }

        if (matchedProvince) {
            // Find municipalities in this province
            let munis = [];
            Object.values(phLocations).forEach(regionData => {
                if (regionData[matchedProvince]) {
                    munis = Object.keys(regionData[matchedProvince]).sort();
                }
            });

            // Find closest matching Municipality
            for (const muni of munis) {
                const muniLower = muni.toLowerCase();
                const cleanMuniLower = muniLower.replace(/^(city of|municipality of)\s+/i, "").trim();
                const cleanGeoCity = geoCity.replace(/^(city of|municipality of)\s+/i, "").trim();
                if (cleanGeoCity.includes(cleanMuniLower) || cleanMuniLower.includes(cleanGeoCity)) {
                    matchedMunicipality = muni;
                    break;
                }
            }

            if (matchedMunicipality) {
                // Find barangays in this municipality
                let barangays = [];
                Object.values(phLocations).forEach(regionData => {
                    if (regionData[matchedProvince]?.[matchedMunicipality]) {
                        barangays = Object.keys(regionData[matchedProvince][matchedMunicipality]).sort();
                    }
                });

                // Find closest matching Barangay
                for (const brgy of barangays) {
                    const brgyLower = brgy.toLowerCase();
                    if (geoBarangay.includes(brgyLower) || brgyLower.includes(geoBarangay)) {
                        matchedBarangay = brgy;
                        break;
                    }
                }
            }
        }

        // Update form state
        setDeliveryForm(prev => {
            const updated = { ...prev };
            if (matchedProvince) {
                updated.province = matchedProvince;

                // Calculate municipalities
                let munis = [];
                Object.values(phLocations).forEach(regionData => {
                    if (regionData[matchedProvince]) {
                        munis = Object.keys(regionData[matchedProvince]).sort();
                    }
                });
                setAvailableMunicipalities(munis);

                if (matchedMunicipality) {
                    updated.municipality = matchedMunicipality;

                    // Calculate barangays
                    let barangays = [];
                    Object.values(phLocations).forEach(regionData => {
                        if (regionData[matchedProvince]?.[matchedMunicipality]) {
                            barangays = Object.keys(regionData[matchedProvince][matchedMunicipality]).sort();
                        }
                    });
                    setAvailableBarangays(barangays);

                    if (matchedBarangay) {
                        updated.barangay = matchedBarangay;
                    }
                }
            }

            updated.addressDetails = geoStreet || mapped.fullAddress.split(",")[0] || "";
            return updated;
        });

        setMapConfirmed(true);
        setShowMapModal(false);
        message.success("Address auto-filled from real-time map!");
    };
    const streamRef = useRef(null);
    const detectionRef = useRef(null);
    const canvasRef = useRef(null);

    // Check if user has formally applied for their Digital ID
    const hasApplied = userData?.attributes?.has_applied_for_id === true;
    const isStudent = userData?.role_context === "Student";

    const fetchApplicationStatus = async () => {
        if (!userData?.id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/applications/user/${userData.id}`);
            if (res.ok) {
                const data = await res.json();
                setApplication(data);
            }
        } catch (err) {
            console.error("Failed to fetch application status:", err);
        }
    };

    useEffect(() => {
        fetchApplicationStatus();
        const interval = setInterval(fetchApplicationStatus, 8000);
        return () => clearInterval(interval);
    }, [userData]);

    // Synchronize loaded application data with local states
    useEffect(() => {
        if (application) {
            if (application.fulfillment_method) {
                setFulfillmentMethod(application.fulfillment_method);
            }
            if (application.status) {
                const physicalIdRequested = !!application.fulfillment_method ||
                    ['printed', 'completed'].includes(application.status) ||
                    application.has_arrived || application.is_ready;

                if (!physicalIdRequested) {
                    setPhysicalIDStatus("idle");
                } else {
                    // Map application status to physicalIDStatus
                    if (application.status === 'pending' || application.status === 'approved') {
                        setPhysicalIDStatus("production");
                    } else if (application.status === 'printed') {
                        setPhysicalIDStatus(application.fulfillment_method === 'delivery' ? "shipping" : "ready");
                    } else if (application.status === 'completed') {
                        setPhysicalIDStatus("collected");
                    }
                }
            }
            if (application.scheduled_at) {
                setScheduledDate(application.scheduled_at);
            }
            if (application.tracking_number) {
                setTrackingId(application.tracking_number);
            }
        }
    }, [application, userData]);

    const mergedUserData = useMemo(() => {
        if (!userData) return null;
        
        const formData = application?.form_data || (Array.isArray(application) ? application[0]?.form_data : {}) || {};
        const attrs = userData?.attributes || {};
        
        const getVal = (keys) => {
            const formDataKeys = Object.keys(formData);
            for (const k of keys) {
                if (attrs[k]) return attrs[k];
                // Case-insensitive search in formData
                const match = formDataKeys.find(fk => fk.toLowerCase() === k.toLowerCase());
                if (match && formData[match]) return formData[match];
            }
            return null;
        };

        const dob = getVal(['dob', 'Date of Birth', 'Birth Date', 'Birthdate', 'Birthday', 'date_of_birth']);
        const phone = getVal(['phone', 'Phone Number', 'Mobile Number', 'Contact Number', 'Mobile No.', 'phone_number', 'mobile']);

        return {
            ...userData,
            attributes: {
                ...attrs,
                dob: dob || attrs.dob,
                phone: phone || attrs.phone
            }
        };
    }, [userData, application]);

    // Auto-populate delivery form when merged user data (including form data) becomes available
    useEffect(() => {
        if (mergedUserData) {
            setDeliveryForm(prev => ({
                ...prev,
                recipientName: prev.recipientName || mergedUserData.name || "",
                phoneNumber: prev.phoneNumber || mergedUserData.attributes?.phone || ""
            }));
        }
    }, [mergedUserData]);

    useEffect(() => {
        if (userData?.role_context) {
            const fetchTemplate = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/id-builder/${userData.role_context}`);
                    if (res.ok) {
                        const data = await res.json();
                        setTemplate(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch ID template:", err);
                } finally {
                    setIsTemplateLoaded(true);
                }
            };
            fetchTemplate();
        } else if (userData?.id_template) {
            setTemplate(userData.id_template);
            setIsTemplateLoaded(true);
        }
    }, [userData]);

    // Persist application state to localStorage
    useEffect(() => {
        if (idPhoto) localStorage.setItem("digital_id_photo", idPhoto);
        else localStorage.removeItem("digital_id_photo");
    }, [idPhoto]);

    useEffect(() => {
        if (signature) localStorage.setItem("digital_id_signature", signature);
        else localStorage.removeItem("digital_id_signature");
    }, [signature]);

    useEffect(() => {
        if (selfiePhoto) localStorage.setItem("digital_id_selfie", selfiePhoto);
        else localStorage.removeItem("digital_id_selfie");
    }, [selfiePhoto]);

    useEffect(() => {
        localStorage.setItem("digital_id_step", currentStep.toString());
    }, [currentStep]);

    useEffect(() => {
        localStorage.setItem("digital_id_applying", isApplying.toString());
    }, [isApplying]);

    // Cleanup: If user is logged out or account deleted, clear local storage
    useEffect(() => {
        if (!userData) {
            localStorage.removeItem("digital_id_photo");
            localStorage.removeItem("digital_id_signature");
            localStorage.removeItem("digital_id_selfie");
            localStorage.removeItem("digital_id_step");
            localStorage.removeItem("digital_id_applying");

            // Also reset local states to zero
            setIdPhoto(null);
            setSignature(null);
            setSelfiePhoto(null);
            setCurrentStep(0);
            setIsApplying(false);
        }
    }, [userData]);

    // Pre-load face-api models as soon as component mounts for fast matching later
    useEffect(() => {
        const preloadModels = async () => {
            if (modelsLoaded) return;
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'), // Tiny model for speed
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to pre-load Face AI models:", err);
            }
        };
        preloadModels();
    }, []);

    // Pre-compute ID photo descriptor as soon as it's uploaded
    useEffect(() => {
        const computeIdDescriptor = async () => {
            if (!idPhoto || !modelsLoaded || idDescriptor) return;
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = idPhoto;
                await new Promise(r => img.onload = r);
                const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 });
                const detection = await faceapi.detectSingleFace(img, opts).withFaceLandmarks(true).withFaceDescriptor();
                if (detection) {
                    setIdDescriptor(detection.descriptor);
                    console.log("ID Descriptor pre-computed");
                }
            } catch (err) {
                console.error("Failed to pre-compute ID descriptor:", err);
            }
        };
        computeIdDescriptor();
    }, [idPhoto, modelsLoaded]);

    // Lifecycle for Camera Stream & Detection
    useEffect(() => {
        if (isApplying && currentStep === 1 && !selfiePhoto) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isApplying, currentStep, !!selfiePhoto]);

    const startCamera = async () => {
        // Clear previous selfie photo and errors for a fresh start
        setSelfiePhoto(null);
        setFaceMatchError("");
        setBiometricStatus("idle");

        // Start the camera stream first so user sees immediate feedback
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => { });
            }
        } catch (err) {
            message.error("Could not access camera. Please check permissions.");
            return;
        }

        // Reset liveness state for fresh scan
        setLivenessProgress(0);
        setLivenessInstruction('Position your face in the frame');
        setLivenessPhase('idle');
        setFrozenFrame(null);
        setBiometricStatus("idle");
        setFaceMatchError("");
        livenessRef.current = { challengeIndex: 0, holdFrames: 0, accumulated: 0 };

        // Models are pre-loaded on mount; start detection immediately
        startFaceDetectionLoop();
    };

    const stopCamera = () => {
        stopFaceDetectionLoop();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startFaceDetectionLoop = () => {
        // Cancel any existing loop first
        stopFaceDetectionLoop();

        const detect = async () => {
            if (!videoRef.current || !videoRef.current.srcObject || videoRef.current.paused || videoRef.current.ended) {
                return;
            }

            // Wait for video to be ready
            if (videoRef.current.readyState < 2) {
                detectionRef.current = requestAnimationFrame(detect);
                return;
            }

            try {
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
                const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceLandmarks(true);

                if (result) {
                    const box = result.detection.box;
                    const videoWidth = videoRef.current.videoWidth || 640;
                    const videoHeight = videoRef.current.videoHeight || 480;

                    const faceCenterX = box.x + box.width / 2;
                    const faceCenterY = box.y + box.height / 2;

                    const roiX = videoWidth * 0.35;
                    const roiY = videoHeight * 0.32;
                    const tooFarLeft = faceCenterX < (roiX - 10);
                    const tooFarRight = faceCenterX > (videoWidth - roiX + 10);
                    const tooHigh = faceCenterY < (roiY - 10);
                    const tooLow = faceCenterY > (videoHeight - roiY + 10);
                    const tooSmall = box.width < (videoWidth * 0.23);
                    const tooLarge = box.width > (videoWidth * 0.52);

                    let hint = "Perfect! Hold still";
                    let centered = true;

                    if (tooSmall) { hint = "Move Closer"; centered = false; }
                    else if (tooLarge) { hint = "Too Close"; centered = false; }
                    else if (tooFarLeft) { hint = "Move Right →"; centered = false; }
                    else if (tooFarRight) { hint = "← Move Left"; centered = false; }
                    else if (tooHigh) { hint = "Move Down ↓"; centered = false; }
                    else if (tooLow) { hint = "Move Up ↑"; centered = false; }

                    setFacePositionHint(hint);
                    setIsFaceCentered(centered);

                    const ls = livenessRef.current;
                    if (centered && ls.challengeIndex < CHALLENGES.length) {
                        const challenge = CHALLENGES[ls.challengeIndex];
                        const noseTip = result.landmarks.getNose()[3];
                        const passed = challenge.check(noseTip, box);
                        setLivenessInstruction(challenge.instruction);
                        setLivenessPhase('scanning');

                        if (passed) {
                            ls.holdFrames += 1;
                            const progress = Math.min(100, Math.round(((ls.accumulated + ls.holdFrames) / TOTAL_FRAMES) * 100));
                            setLivenessProgress(progress);

                            if (ls.holdFrames >= challenge.frames) {
                                ls.accumulated += challenge.frames;
                                ls.challengeIndex += 1;
                                ls.holdFrames = 0;

                                if (ls.challengeIndex >= CHALLENGES.length) {
                                    setLivenessPhase('success');
                                    setLivenessInstruction('Liveness Verified!');
                                }
                            }
                        } else {
                            ls.holdFrames = Math.max(0, ls.holdFrames - 1);
                            setLivenessProgress(Math.round(((ls.accumulated + ls.holdFrames) / TOTAL_FRAMES) * 100));
                        }
                    } else if (!centered) {
                        setLivenessInstruction('Position your face in the frame');
                    }
                } else {
                    setIsFaceCentered(false);
                    setFacePositionHint("Searching for face...");
                    setLivenessInstruction("Position your face in the frame");
                }
            } catch (err) {
                console.error("Detection error:", err);
            }

            detectionRef.current = requestAnimationFrame(detect);
        };

        detect();
    };

    const stopFaceDetectionLoop = () => {
        if (detectionRef.current) {
            cancelAnimationFrame(detectionRef.current);
            detectionRef.current = null;
        }
    };

    const captureSelfie = async () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);

        // Use the raw canvas for AI processing to avoid Base64 overhead
        const selfieDataUrl = canvas.toDataURL("image/jpeg");
        setSelfiePhoto(selfieDataUrl);
        stopCamera();

        // Pass the canvas directly for instant matching
        await handleFaceMatch(canvas);
    };

    // Enhanced Canvas-based background removal for signatures
    // Mobile-safe: downscales large images first to avoid GPU/memory crashes on mobile Chrome
    const removeBackground = (dataUrl) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load signature image.'));
            img.onload = () => {
                try {
                    // --- Downscale for mobile safety (max 1200px on longest side) ---
                    const MAX_SIDE = 1200;
                    let drawW = img.width;
                    let drawH = img.height;
                    if (drawW > MAX_SIDE || drawH > MAX_SIDE) {
                        const scale = MAX_SIDE / Math.max(drawW, drawH);
                        drawW = Math.round(drawW * scale);
                        drawH = Math.round(drawH * scale);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = drawW;
                    canvas.height = drawH;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas 2D context unavailable.'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, drawW, drawH);
                    const imageData = ctx.getImageData(0, 0, drawW, drawH);
                    const data = imageData.data;

                    // More aggressive threshold for signatures
                    const threshold = 210;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        const brightness = (r + g + b) / 3;

                        if (brightness > threshold) {
                            data[i + 3] = 0; // Transparent
                        } else if (brightness > 160) {
                            // Soft fade
                            const alpha = Math.round(((brightness - 160) / (threshold - 160)) * 255);
                            data[i + 3] = 255 - alpha;
                        } else {
                            // Keep darker pixels and make them darker (black ink)
                            const darkBoost = brightness / 160;
                            data[i] *= darkBoost;
                            data[i + 1] *= darkBoost;
                            data[i + 2] *= darkBoost;
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (err) {
                    reject(err);
                }
            };
            img.src = dataUrl;
        });

    const handleFaceMatch = async (capturedCanvas) => {
        if (!idPhoto) return;

        setBiometricStatus("matching");
        setFaceMatchError("");

        try {
            const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

            // 1. Get/Compute ID Descriptor
            let currentIdDescriptor = idDescriptor;
            if (!currentIdDescriptor) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = idPhoto;
                await new Promise(r => img.onload = r);
                const idDet = await faceapi.detectSingleFace(img, opts).withFaceLandmarks(true).withFaceDescriptor();
                if (!idDet) throw new Error("Could not detect face on Formal ID.");
                currentIdDescriptor = idDet.descriptor;
                setIdDescriptor(currentIdDescriptor);
            }

            // 2. Compute Selfie Descriptor (using direct canvas or image)
            let selfieInput = capturedCanvas;
            if (!selfieInput && selfiePhoto) {
                const img = new Image();
                img.src = selfiePhoto;
                await new Promise(r => img.onload = r);
                selfieInput = img;
            }

            if (!selfieInput) return;

            const selfieDet = await faceapi.detectSingleFace(selfieInput, opts).withFaceLandmarks(true).withFaceDescriptor();
            if (!selfieDet) throw new Error("Could not detect your face. Please ensure good lighting and try again.");

            const distance = faceapi.euclideanDistance(currentIdDescriptor, selfieDet.descriptor);

            if (distance > 0.55) {
                throw new Error(`Identity mismatch. Please use your own authentic Formal ID.`);
            }

            setBiometricStatus("success");
            setTimeout(() => {
                setCurrentStep(2);
                simulateProcessing();
            }, 800);
        } catch (err) {
            console.error("Biometric match error:", err);
            setBiometricStatus("idle");
            setFaceMatchError(err.message || "Match failed. Please retry.");
        }
    };

    const simulateProcessing = async () => {
        setIsProcessing(true);
        setCurrentStep(3); // Transition to Processing step

        try {
            // Perform the actual backend sync
            await syncApplicationToBackend();

            // Artificial delay for high-end feel, similar to mobile
            setTimeout(() => {
                setIsProcessing(false);
                setShowCongratsPopup(true);
            }, 2500);
        } catch (err) {
            console.error("Processing failed:", err);
            setIsProcessing(false);
            setCurrentStep(2); // Revert to submission if failed
            message.error("Application submission failed. Please try again.");
        }
    };

    const handleCongratsOk = () => {
        setShowCongratsPopup(false);
        handleFinalizeApplication();
    };

    const handleFinalizeApplication = () => {
        // Final cleanup of application state
        localStorage.removeItem("digital_id_photo");
        localStorage.removeItem("digital_id_signature");
        localStorage.removeItem("digital_id_applying");
        localStorage.removeItem("digital_id_step");
        localStorage.removeItem("digital_id_selfie");

        setIsApplying(false);
        setCurrentStep(0);

        // Refresh application status to show the final ID card view
        fetchApplicationStatus();
        message.info("Welcome to your Digital Dashboard!");
    };

    const syncApplicationToBackend = async () => {
        // Prepare the updated profile data
        const updatedAttributes = {
            ...userData?.attributes,
            has_applied_for_id: true,
            id_picture: idPhoto?.replace(API_BASE_URL, ''),
            signature: signature?.replace(API_BASE_URL, '')
        };

        try {
            // 1. Persist to Backend: Update User Profile
            await fetch(`${API_BASE_URL}/users/${userData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attributes: updatedAttributes
                })
            });

            // 2. Persist to Backend: Submit ID Application record
            await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.id,
                    status: "pending"
                })
            });

            // 3. Update Local State (so the UI reflects the change immediately)
            if (setUserData) {
                setUserData(prev => {
                    const updatedUser = {
                        ...prev,
                        attributes: updatedAttributes
                    };
                    localStorage.setItem("regisSys_user", JSON.stringify(updatedUser));
                    return updatedUser;
                });
            }
            return true;
        } catch (err) {
            console.error("Sync failed:", err);
            throw err;
        }
    };

    const handlePrintID = async () => {
        setIsDownloading(true);
        message.loading({ content: "Generating PDF...", key: "pdf-gen" });

        try {
            await new Promise(r => setTimeout(r, 100)); // Minimal delay since elements are already mounted

            const frontEl = document.getElementById("pdf-front-capture");
            const backEl = document.getElementById("pdf-back-capture");

            if (!frontEl || !backEl) throw new Error("Could not find ID card elements.");

            const isPortrait = template?.orientation !== 'landscape';
            const pdfWidthMm = isPortrait ? 53.975 : 85.725;
            const pdfHeightMm = isPortrait ? 85.725 : 53.975;

            // Render front element to canvas using html2canvas with CORS support
            const frontCanvas = await html2canvas(frontEl, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff'
            });
            const frontDataUrl = frontCanvas.toDataURL("image/jpeg", 1.0);

            // Render back element to canvas
            const backCanvas = await html2canvas(backEl, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff'
            });
            const backDataUrl = backCanvas.toDataURL("image/jpeg", 1.0);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Add Header Text
            pdf.setTextColor(15, 23, 42); // slate-900
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text("Official Digital Identification Card", 105, 30, { align: "center" });

            pdf.setTextColor(71, 85, 105); // slate-600
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.text("Pre-scaled to standard ID format (3.375 x 2.125 inches).", 105, 38, { align: "center" });
            pdf.text("Please ensure print settings are set to 'Actual Size' or 'Scale: 100%'.", 105, 43, { align: "center" });

            // Place Images
            const startY = 65;
            if (isPortrait) {
                // Side by side for portrait
                const gap = 15;
                const totalWidth = (pdfWidthMm * 2) + gap;
                const startX = (210 - totalWidth) / 2;

                pdf.addImage(frontDataUrl, 'JPEG', startX, startY, pdfWidthMm, pdfHeightMm);
                pdf.addImage(backDataUrl, 'JPEG', startX + pdfWidthMm + gap, startY, pdfWidthMm, pdfHeightMm);
            } else {
                // Stacked vertically for landscape to fit comfortably
                const startX = (210 - pdfWidthMm) / 2;
                const gap = 20;

                pdf.addImage(frontDataUrl, 'JPEG', startX, startY, pdfWidthMm, pdfHeightMm);
                pdf.addImage(backDataUrl, 'JPEG', startX, startY + pdfHeightMm + gap, pdfWidthMm, pdfHeightMm);
            }

            const filename = `Digital_ID_${userData?.external_id || 'Card'}.pdf`;
            pdf.save(filename);

            message.success({ content: "PDF Downloaded successfully!", key: "pdf-gen" });
        } catch (err) {
            console.error("PDF generation failed:", err);
            message.error({ content: `PDF Error: ${err.message}`, key: "pdf-gen" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSaveStubAsPhoto = async () => {
        if (!stubRef.current) return;
        message.loading({ content: "Generating Image...", key: "stub-save" });
        try {
            const canvas = await html2canvas(stubRef.current, {
                useCORS: true,
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            const stubId = trackingId || `CLAIM-${(String(userData?.id || "").slice(0, 8)).toUpperCase()}`;
            link.download = `Claim_Stub_${stubId}.png`;
            link.href = dataUrl;
            link.click();
            message.success({ content: "Image saved successfully!", key: "stub-save" });
        } catch (err) {
            console.error("Failed to save stub as photo:", err);
            message.error({ content: "Failed to generate image.", key: "stub-save" });
        }
    };

    const handleSaveStubAsPDF = async () => {
        if (!stubRef.current) return;
        message.loading({ content: "Generating PDF...", key: "stub-save" });
        try {
            const canvas = await html2canvas(stubRef.current, {
                useCORS: true,
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Standardize voucher to CR-80 size (Portrait: 54mm x 85.6mm)
            const pdfWidthMm = 54;
            const pdfHeightMm = 85.6;

            // Center horizontally and place at reasonable vertical offset on A4
            const xOffset = (210 - pdfWidthMm) / 2;
            const yOffset = 30;

            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, pdfWidthMm, pdfHeightMm);

            // Add Dashed Cut Lines (Gray)
            pdf.setDrawColor(203, 213, 225); // slate-300
            pdf.setLineDashPattern([2, 1], 0);
            pdf.setLineWidth(0.2);
            pdf.rect(xOffset - 0.1, yOffset - 0.1, pdfWidthMm + 0.2, pdfHeightMm + 0.2);

            const stubId = trackingId || `CLAIM-${(String(userData?.id || "").slice(0, 8)).toUpperCase()}`;
            pdf.save(`Claim_Stub_${stubId}.pdf`);
            message.success({ content: "PDF saved successfully!", key: "stub-save" });
        } catch (err) {
            console.error("Failed to save stub as PDF:", err);
            message.error({ content: "Failed to generate PDF.", key: "stub-save" });
        }
    };

    const parsedShipping = React.useMemo(() => {
        if (!shippingAddress) return null;
        const parts = shippingAddress.split(' | ');
        if (parts.length >= 3) {
            return {
                name: parts[0],
                phone: parts[1],
                address: parts.slice(2).join(', '),
            };
        }
        return { name: "", phone: "", address: shippingAddress };
    }, [shippingAddress]);

    // --- RENDER CONTENT HELPER ---
    const renderPageContent = () => {
        if (!isApplying && !hasApplied) {
            return (
                <div className="flex-1 flex flex-col p-8 max-sm:p-4 animate-in fade-in duration-700 max-w-6xl mx-auto w-full overflow-y-auto max-h-[100dvh]">
                    <div className="mb-12 max-sm:mb-4 text-center">
                        <Title level={1} className="!text-[#1a234b] !font-black !mb-2 max-sm:!mb-0 max-sm:!text-2xl">Digital ID/QR</Title>
                        <Text className="text-slate-500 font-medium text-base max-sm:text-xs">
                            Complete your identity verification in three simple steps to unlock your digital ID.
                        </Text>
                    </div>

                    <Row gutter={[16, 16]} className="mb-16 max-sm:mb-6">
                        <Col xs={24} md={8}>
                            <Card hoverable className="h-full border-slate-100 shadow-sm text-center !rounded-2xl overflow-hidden max-sm:!p-2">
                                <div className="h-48 max-sm:h-20 bg-slate-50 -mx-6 -mt-6 mb-6 max-sm:mb-2 max-sm:-mx-2 max-sm:-mt-2 p-4 flex items-center justify-center">
                                    <img src={Step1Img} alt="Submission" className="h-full object-contain drop-shadow-md" />
                                </div>
                                <Title level={4} className="!text-[#1a234b] !font-black max-sm:!text-sm max-sm:!mb-1">Step 1: Submission</Title>
                                <Paragraph className="text-slate-500 text-sm max-sm:text-[10px] max-sm:mb-0 max-sm:leading-tight">
                                    Attach your formal ID photo and digital signature to begin your profile creation.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card hoverable className="h-full border-slate-100 shadow-sm text-center !rounded-2xl overflow-hidden max-sm:!p-2">
                                <div className="h-48 max-sm:h-20 bg-slate-50 -mx-6 -mt-6 mb-6 max-sm:mb-2 max-sm:-mx-2 max-sm:-mt-2 p-4 flex items-center justify-center">
                                    <img src={Step2Img} alt="Biometric Syncing" className="h-full object-contain drop-shadow-md" />
                                </div>
                                <Title level={4} className="!text-[#1a234b] !font-black max-sm:!text-sm max-sm:!mb-1">Step 2: Biometric Syncing</Title>
                                <Paragraph className="text-slate-500 text-sm max-sm:text-[10px] max-sm:mb-0 max-sm:leading-tight">
                                    Take a live selfie. Our system will instantly verify if it matches your uploaded formal photo.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card hoverable className="h-full border-slate-100 shadow-sm text-center !rounded-2xl overflow-hidden max-sm:!p-2">
                                <div className="h-48 max-sm:h-20 bg-slate-50 -mx-6 -mt-6 mb-6 max-sm:mb-2 max-sm:-mx-2 max-sm:-mt-2 p-4 flex items-center justify-center">
                                    <img src={Step3Img} alt="Processing" className="h-full object-contain drop-shadow-md" />
                                </div>
                                <Title level={4} className="!text-[#1a234b] !font-black max-sm:!text-sm max-sm:!mb-1">Step 3: Processing</Title>
                                <Paragraph className="text-slate-500 text-sm max-sm:text-[10px] max-sm:mb-0 max-sm:leading-tight">
                                    Submit your verified profile to the Registrar/ID Management for final approval and issuance.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>

                    <div className="flex justify-center max-sm:pb-8 shrink-0">
                        <Button
                            type="primary"
                            size="large"
                            icon={<ChevronRight className="w-4 h-4" />}
                            iconPosition="end"
                            onClick={() => {
                                setShowGuidelinesModal(true);
                            }}
                            className="bg-[#1a234b] hover:!bg-blue-900 !h-14 max-sm:!h-12 !px-12 max-sm:!px-8 !text-base max-sm:!text-sm !font-black !rounded-xl !tracking-widest shadow-xl shadow-blue-900/20"
                        >
                            Start Application
                        </Button>
                    </div>
                </div>
            );
        }

        if (isApplying) {
            return (
                <div className="flex-1 flex flex-col p-8 max-sm:p-4 animate-in fade-in duration-700 max-w-4xl mx-auto w-full overflow-y-auto max-h-[100dvh]">
                    <ProgressTracker currentStep={currentStep + 1} />

                    <div className="flex-1 bg-white p-8 max-sm:p-4 rounded-3xl max-sm:rounded-2xl shadow-sm border border-slate-100">
                        {/* STEP 1: Data Verification & Uploads */}
                        {currentStep === 0 && (
                            <div className="animate-in slide-in-from-right-4 duration-500">
                                <Title level={3} className="!text-[#1a234b] !font-black !mb-6 max-sm:!mb-3 max-sm:!text-lg">Data Verification & Uploads</Title>

                                {/* Data Verification Display */}
                                <div className="bg-white border border-slate-100 rounded-3xl max-sm:rounded-2xl p-8 max-sm:p-4 shadow-sm mb-8 max-sm:mb-4 relative overflow-hidden group">
                                    {/* Decorative accent */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110" />

                                    <Row gutter={[32, 24]}>
                                        <Col xs={24} md={12}>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1.5 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                    Full Name
                                                </span>
                                                <span className="text-base font-black text-[#1a234b]">{userData?.name || "Not Provided"}</span>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1.5 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                    ID Number
                                                </span>
                                                <span className="text-base font-black text-[#1a234b] tracking-wider">{userData?.external_id || "PENDING"}</span>
                                            </div>
                                        </Col>
                                        {isStudent && (
                                            <Col xs={24}>
                                                <div className="flex flex-col pt-4 border-t border-slate-50">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1.5 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                        Course / Program
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-600 italic">
                                                        {userData?.attributes?.Course || userData?.attributes?.Program || userData?.attributes?.['Course/Program'] || "Not Provided"}
                                                    </span>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </div>

                                <Row gutter={[24, 16]}>
                                    <Col xs={24} md={12}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Formal Portrait</span>
                                            <button
                                                onClick={() => setShowGuidelinesModal(true)}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5"
                                            >
                                                <CameraOutlined className="text-[11px]" />
                                                View Guidelines
                                            </button>
                                        </div>

                                        {/* Photo Helper Card */}
                                        <div className="mb-4 max-sm:mb-3 bg-emerald-50/30 border border-emerald-100/50 p-4 max-sm:p-3 rounded-2xl flex items-start gap-3 max-sm:gap-2 animate-in fade-in slide-in-from-top-2 duration-300 min-h-[110px] max-sm:min-h-0">
                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm border border-emerald-50 mt-0.5 flex-shrink-0">
                                                <CameraOutlined className="text-emerald-600 text-xs" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <span className="text-[9px] font-black text-emerald-600/80 uppercase tracking-widest block mb-0.5">Photo Requirements</span>
                                                <p className="text-[10px] font-bold text-slate-500 leading-normal">
                                                    Upload a high-resolution <strong className="text-slate-700">formal portrait with a plain white background</strong>. Neutral facial expressions, looking straight ahead.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <Dragger
                                                accept="image/*"
                                                maxCount={1}
                                                beforeUpload={async (file) => {
                                                    setIsPhotoValid(null);
                                                    setPhotoError(false);
                                                    const reader = new FileReader();
                                                    reader.onload = async (e) => {
                                                        const imgData = e.target.result;
                                                        setIdPhoto(imgData);

                                                        // Background validation
                                                        try {
                                                            const img = await faceapi.fetchImage(imgData);
                                                            const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
                                                            setIsPhotoValid(detections.length === 1);
                                                        } catch (err) {
                                                            console.error("Photo validation failed:", err);
                                                            setIsPhotoValid(false);
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                    return false;
                                                }}
                                                showUploadList={false}
                                                className={`!bg-slate-50/50 hover:!bg-blue-50/50 transition-all !rounded-3xl max-sm:!rounded-2xl border-2 border-dashed ${photoError ? 'border-red-500 bg-red-50/5 animate-pulse' : isPhotoValid === false ? 'border-red-200' : 'border-slate-100'} h-[200px] max-sm:h-[160px] flex items-center justify-center overflow-hidden`}
                                            >
                                                {idPhoto ? (
                                                    <div className="relative h-full w-full p-2">
                                                        <img src={resolveImageUrl(idPhoto)} alt="ID" className="h-full w-full object-contain rounded-2xl" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <Button ghost className="!text-white !border-white !rounded-full !font-black !text-[10px]" onClick={() => { setIdPhoto(null); setPhotoError(false); }}>Change Photo</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center">
                                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                            <UploadOutlined className="text-blue-500 text-lg" />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-600 mb-1">Click to Upload</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Formal white background portrait</p>
                                                    </div>
                                                )}
                                            </Dragger>

                                            {photoError && (
                                                <div className="mt-2 text-red-500 font-bold text-[10px] uppercase tracking-wider text-left animate-in fade-in slide-in-from-top-1 duration-200">
                                                    ⚠️ Please upload a formal portrait photo
                                                </div>
                                            )}

                                            {isPhotoValid === false && (
                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[90%] bg-red-600 text-white p-3 rounded-2xl text-center shadow-xl animate-in slide-in-from-top-2">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter">⚠️ No Clear Face Detected</p>
                                                    <p className="text-[9px] opacity-90 font-bold leading-tight mt-1">Please ensure it's a formal ID photo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">E-Signature</span>
                                            {signature && (
                                                <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider">Captured</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Signature Helper Card */}
                                        <div className="mb-4 max-sm:mb-3 bg-blue-50/30 border border-blue-100/50 p-4 max-sm:p-3 rounded-2xl flex items-start gap-3 max-sm:gap-2 animate-in fade-in slide-in-from-top-2 duration-300 min-h-[110px] max-sm:min-h-0">
                                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm border border-blue-50 mt-0.5 flex-shrink-0">
                                                <PenLine className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Signature Requirements</span>
                                                <p className="text-[10px] font-bold text-slate-500 leading-normal">
                                                    Please write your signature using a <strong className="text-slate-700">dark pen on plain white paper</strong>, take a clear photo, and upload it. The system will automatically isolate your signature.
                                                </p>
                                            </div>
                                        </div>

                                        <Dragger
                                            accept="image/*"
                                            maxCount={1}
                                            beforeUpload={(file) => {
                                                setRemovingSigBg(true);
                                                setSignatureError(false);

                                                // 1. Instant local background removal for immediate UI feedback
                                                const reader = new FileReader();
                                                reader.onload = async (e) => {
                                                    try {
                                                        const rawData = e.target.result;
                                                        const transparentData = await removeBackground(rawData);
                                                        setSignature(transparentData);
                                                        setRemovingSigBg(false); // Hide spinner instantly
                                                        message.success("Signature background removed instantly.");

                                                        // 2. Concurrently verify and process on backend for permanent storage
                                                        const formData = new FormData();
                                                        formData.append('file', file);

                                                        fetch(`${API_BASE_URL}/detect-face/detect-signature`, {
                                                            method: 'POST',
                                                            body: formData,
                                                        })
                                                            .then(res => res.json())
                                                            .then(result => {
                                                                if (result.is_signature && result.processed_url) {
                                                                    // Update with the permanent static URL once ready
                                                                    setSignature(`${API_BASE_URL}${result.processed_url}`);
                                                                } else {
                                                                    message.error(result.reason || "Invalid signature detected by server.");
                                                                    setSignature(null);
                                                                }
                                                            })
                                                            .catch(err => {
                                                                console.error("Backend signature process failed:", err);
                                                                // Keep the local transparent signature if backend fails
                                                            });

                                                    } catch (err) {
                                                        console.error("Local signature processing failed:", err);
                                                        message.error("Failed to process signature locally.");
                                                        setRemovingSigBg(false);
                                                    }
                                                };
                                                reader.readAsDataURL(file);

                                                return false;
                                            }}
                                            showUploadList={false}
                                            className={`!bg-slate-50/50 hover:!bg-blue-50/50 transition-all !rounded-3xl max-sm:!rounded-2xl border-2 border-dashed ${signatureError ? 'border-red-500 bg-red-50/5 animate-pulse' : 'border-slate-100'} h-[200px] max-sm:h-[160px] flex items-center justify-center overflow-hidden`}
                                        >
                                            {removingSigBg ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Processing...</span>
                                                </div>
                                            ) : signature ? (
                                                <div className="relative h-full w-full p-2 group/sig"
                                                    style={{ background: 'repeating-conic-gradient(#f1f5f9 0% 25%, #f8fafc 0% 50%) 0 0 / 12px 12px' }}>
                                                    <img src={resolveImageUrl(signature)} alt="Signature" className="h-full w-full object-contain mix-blend-multiply" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/sig:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover/sig:opacity-100">
                                                        <Button danger size="small" className="!rounded-full !font-black !text-[10px]" onClick={(e) => { e.stopPropagation(); setSignature(null); setSignatureError(false); }}>Clear</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <PenLine className="text-indigo-500 text-lg" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 mb-1">Click to Upload Signature</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Dark ink on clean white paper</p>
                                                </div>
                                            )}
                                        </Dragger>

                                        {signatureError && (
                                            <div className="mt-2 text-red-500 font-bold text-[10px] uppercase tracking-wider text-left animate-in fade-in slide-in-from-top-1 duration-200">
                                                ⚠️ Please upload your E-Signature
                                            </div>
                                        )}
                                    </Col>
                                </Row>

                                <div className="mt-10 max-sm:mt-6 flex justify-end max-sm:justify-center">
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => {
                                            let hasErr = false;
                                            if (!idPhoto) {
                                                setPhotoError(true);
                                                hasErr = true;
                                            } else {
                                                setPhotoError(false);
                                            }
                                            if (!signature) {
                                                setSignatureError(true);
                                                hasErr = true;
                                            } else {
                                                setSignatureError(false);
                                            }

                                            if (hasErr) return;
                                            setCurrentStep(1);
                                        }}
                                        className="bg-[#1a234b] hover:!bg-blue-900 !h-14 max-sm:!h-12 !px-12 max-sm:!px-8 !text-sm max-sm:!text-xs !font-black !rounded-xl !tracking-widest shadow-xl shadow-blue-900/10 max-sm:w-full"
                                    >
                                        Next Step
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Biometric Matching */}
                        {currentStep === 1 && (
                            <div className="animate-in slide-in-from-right-4 duration-500">
                                <Title level={3} className="!text-[#1a234b] !font-black !mb-2 max-sm:!text-lg">Biometric Syncing</Title>
                                <Paragraph className="text-slate-500 font-medium text-xs mb-8 max-sm:mb-4">
                                    Our AI will now verify if your live selfie matches the formal photo you uploaded.
                                </Paragraph>

                                <div className="flex flex-col items-center py-4 max-sm:py-2">
                                    <div className="relative w-[320px] h-[400px] max-sm:w-[260px] max-sm:h-[340px] rounded-[40px] max-sm:rounded-[28px] overflow-hidden shadow-2xl bg-slate-900 mb-8 max-sm:mb-4 group">
                                        {biometricStatus === "success" ? (
                                            <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center animate-in zoom-in duration-500 p-8 text-center z-50">
                                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 border-2 border-white/40">
                                                    <BadgeCheck className="w-12 h-12 text-white" />
                                                </div>
                                                <Title level={4} className="!text-white !font-black !mb-1">Identity Verified</Title>
                                                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Biometric Match Found</Text>
                                            </div>
                                        ) : (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover scale-x-[-1]"
                                                />
                                                <canvas ref={canvasRef} className="absolute inset-0" />

                                                {/* Oval HUD Overlay - MATCHING MOBILE */}
                                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                                    <div className={`w-[200px] h-[260px] max-sm:w-[160px] max-sm:h-[210px] rounded-[100px] border-4 transition-all duration-500 
                                                        ${isFaceCentered ? 'border-white/50 border-dashed scale-105' : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}
                                                    >
                                                        <div className={`absolute inset-0 rounded-[100px] border-2 ${isFaceCentered ? 'border-white opacity-20' : 'border-red-500 opacity-40'}`} />
                                                    </div>

                                                    {/* Scanning Line */}
                                                    {biometricStatus === "matching" && (
                                                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/50 blur-[2px] animate-[scan_2s_infinite]" />
                                                    )}

                                                    <div className="absolute bottom-8 left-0 right-0 px-6">
                                                        <div className={`py-2 px-4 rounded-full backdrop-blur-md border flex items-center justify-center gap-2 transition-all duration-300
                                                            ${isFaceCentered ? 'bg-black/40 border-white/20' : 'bg-red-500/80 border-red-400'}`}>
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">
                                                                {livenessPhase === 'success' ? '✓ Liveness Verified' : (isFaceCentered ? livenessInstruction : facePositionHint)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Matching Overlay */}
                                                {biometricStatus === "matching" && (
                                                    <div className="absolute inset-0 bg-[#1a234b]/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 z-40">
                                                        <SyncOutlined spin className="text-white text-3xl mb-4" />
                                                        <Text className="text-white font-black text-lg mb-1">Verifying Identity</Text>
                                                        <Text className="text-white/60 text-[10px] font-bold">Comparing ID photo with live face capture...</Text>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {faceMatchError && (
                                        <div className="mb-6 flex flex-col items-center gap-4 animate-in shake duration-500 w-full px-6">
                                            <div className="w-full py-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 px-4">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                <span className="text-[11px] font-bold text-rose-600">{faceMatchError}</span>
                                            </div>
                                            <Button
                                                icon={<SyncOutlined />}
                                                onClick={startCamera}
                                                className="!h-10 !rounded-full !bg-slate-100 !border-none !text-[#1a234b] !font-black !text-[10px] uppercase tracking-widest px-8 hover:!bg-slate-200 transition-all"
                                            >
                                                Try Again Camera
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                                        <div className="flex flex-col items-center">
                                            <button
                                                onClick={captureSelfie}
                                                disabled={!isFaceCentered || biometricStatus === "matching" || biometricStatus === "success" || !!faceMatchError}
                                                className={`group relative w-16 h-16 rounded-full border-[6px] p-1 transition-all duration-300
                                                    ${isFaceCentered ? 'border-slate-100' : 'border-red-100'} 
                                                    ${(!isFaceCentered || biometricStatus === "matching") && 'opacity-50'}`}
                                            >
                                                <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300
                                                    ${isFaceCentered ? 'bg-[#1a234b] group-hover:bg-blue-900' : 'bg-red-200'}`}>
                                                    <Scan className={`w-6 h-6 ${isFaceCentered ? 'text-white' : 'text-red-500'}`} />
                                                </div>
                                            </button>
                                            <Text className={`text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-300
                                                ${isFaceCentered ? 'text-[#1a234b]' : 'text-red-500'}`}>
                                                {isFaceCentered ? 'Capture & Verify' : 'Position Face'}
                                            </Text>
                                        </div>

                                        <div className="w-full max-w-[120px] mx-auto mt-4">
                                            <Button
                                                size="large"
                                                onClick={() => setCurrentStep(0)}
                                                className="w-full !h-10 !rounded-xl !font-black !text-[10px] uppercase tracking-widest !text-slate-400 hover:!text-[#1a234b] !border-none !bg-transparent shadow-none"
                                            >
                                                Go Back
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Final Submission */}
                        {currentStep === 2 && (
                            <div className="animate-in slide-in-from-right-4 duration-500 text-center py-8 max-sm:py-4">
                                <div className="w-20 h-20 max-sm:w-14 max-sm:h-14 bg-blue-50 rounded-[32px] max-sm:rounded-[20px] flex items-center justify-center mx-auto mb-6 max-sm:mb-4">
                                    <Sparkles className="w-10 h-10 max-sm:w-7 max-sm:h-7 text-[#1a234b]" />
                                </div>
                                <Title level={2} className="!text-[#1a234b] !font-black !mb-2 max-sm:!text-xl">Almost There!</Title>
                                <Paragraph className="text-slate-500 font-medium text-sm max-sm:text-xs mb-12 max-sm:mb-6 max-w-md mx-auto">
                                    Your profile is now verified. Click submit to send your application to the ID Management for final issuance of your Digital ID.
                                </Paragraph>

                                <div className="max-w-sm mx-auto space-y-4">
                                    <Button
                                        type="primary"
                                        size="large"
                                        loading={isProcessing}
                                        onClick={simulateProcessing}
                                        className="w-full bg-[#1a234b] hover:!bg-blue-900 !h-14 max-sm:!h-12 !text-sm max-sm:!text-xs !font-black !rounded-xl !tracking-widest shadow-xl shadow-blue-900/20"
                                    >
                                        Submit Application
                                    </Button>
                                    <Button
                                        size="large"
                                        onClick={() => setCurrentStep(1)}
                                        className="w-full !h-14 !rounded-xl !font-black !text-xs !text-slate-500 border-none shadow-none"
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Processing */}
                        {currentStep === 3 && (
                            <div className="animate-in zoom-in-95 duration-700 text-center py-12 max-sm:py-6">
                                <div className="py-20 max-sm:py-10 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-[#1a234b] animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <SyncOutlined className="text-2xl text-[#1a234b] animate-pulse" />
                                        </div>
                                    </div>
                                    <Title level={2} className="!text-[#1a234b] !font-black !mt-10 max-sm:!mt-6 !mb-2 tracking-tighter max-sm:!text-xl">Issuing Digital ID</Title>
                                    <Paragraph className="text-slate-500 font-medium text-base max-sm:text-sm">Finalizing your identity records in ID Management...</Paragraph>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // VIEW 3: Final Issued ID Card
        return (
            <div className="flex-1 flex flex-col p-8 max-sm:p-3 max-w-6xl mx-auto w-full overflow-y-auto max-h-[100dvh]">
                <div className="mb-12 max-sm:mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6 max-sm:gap-3">
                    <div className="max-sm:flex max-sm:items-center max-sm:justify-between max-sm:w-full">
                        <div>
                            <div className="flex items-center gap-2 mb-2 max-sm:mb-0">
                                <BadgeCheck className="w-5 h-5 max-sm:w-3.5 max-sm:h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[2px] max-sm:text-[8px]">Secured</span>
                            </div>
                            <Title level={1} className="!text-[#1a234b] !font-black !mb-0 max-sm:!text-xl">Digital ID Card</Title>
                        </div>
                        <div className="md:hidden flex gap-2">
                             {physicalIDStatus === "idle" ? (
                                 <Button
                                     icon={<CreditCard className="w-3 h-3" />}
                                     className="!rounded-lg !font-bold !h-9 !px-2.5 border-slate-200 text-[9px]"
                                     onClick={() => {
                                         const date = new Date();
                                         date.setDate(date.getDate() + 7);
                                         setScheduledDate(date.toISOString());
                                         setShowPhysicalIDRequest(true);
                                     }}
                                 >
                                     Request ID
                                 </Button>
                             ) : (
                                 <>
                                     {fulfillmentMethod === 'delivery' && (
                                         <Button
                                             icon={<Truck className="w-3 h-3 text-[#00b8b8]" />}
                                             className="!rounded-lg !font-bold !h-9 !px-2.5 border border-slate-200 bg-white hover:!bg-slate-50 !text-slate-700 shadow-sm text-[9px]"
                                             onClick={() => setShowTrackingModal(true)}
                                         >
                                             Track
                                         </Button>
                                     )}
                                     <Button
                                         icon={<CreditCard className="w-3 h-3 text-slate-500" />}
                                         className="!rounded-lg !font-bold !h-9 !px-2.5 border-slate-200 text-[9px]"
                                         onClick={() => setShowClaimingModal(true)}
                                     >
                                         Claim Stub
                                     </Button>
                                 </>
                             )}
                             <Button
                                type="primary"
                                icon={<Eye className="w-3 h-3" />}
                                className="bg-[#1a234b] !rounded-lg !font-bold !h-9 !px-3 shadow-md shadow-blue-900/10 text-[10px]"
                                onClick={() => setIsFullPreview(true)}
                            >
                                View
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3 max-sm:hidden">
                        {physicalIDStatus === "idle" ? (
                            <Button
                                icon={<CreditCard className="w-4 h-4" />}
                                className="!rounded-xl !font-bold !h-11 !px-6 border-slate-200 hover:scale-[1.02] transition-all"
                                onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + 7);
                                    setScheduledDate(date.toISOString());
                                    setShowPhysicalIDRequest(true);
                                }}
                            >
                                Request Physical ID
                            </Button>
                        ) : (
                            <>
                                {fulfillmentMethod === 'delivery' && (
                                    <Button
                                        type="primary"
                                        icon={<Truck className="w-4 h-4 text-[#00b8b8]" />}
                                        className="!rounded-xl !font-bold !h-11 !px-6 border border-slate-200 bg-white hover:!bg-slate-50 !text-slate-700 shadow-sm flex items-center gap-1.5 hover:scale-[1.02] transition-all"
                                        onClick={() => setShowTrackingModal(true)}
                                    >
                                        Track PVC Request
                                    </Button>
                                )}
                                <Button
                                    icon={<CreditCard className="w-4 h-4 text-slate-500" />}
                                    className="!rounded-xl !font-bold !h-11 !px-6 border-slate-200 hover:scale-[1.02] transition-all"
                                    onClick={() => setShowClaimingModal(true)}
                                >
                                    Claim Stub
                                </Button>
                            </>
                        )}
                        <Button
                            type="primary"
                            icon={<Eye className="w-4 h-4" />}
                            className="bg-[#1a234b] !rounded-xl !font-bold !h-11 !px-6 shadow-lg shadow-blue-900/10 hover:scale-[1.02] transition-all"
                            onClick={() => setIsFullPreview(true)}
                        >
                            Full View
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 max-sm:gap-4 items-center lg:items-start justify-center">
                    {/* ID Preview Section */}
                    <div className="flex flex-col items-center">
                        <div className="bg-white/60 backdrop-blur-md p-1.5 max-sm:p-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100 mb-6 max-sm:mb-3 relative">
                            <div
                                className="absolute top-1.5 max-sm:top-1 bottom-1.5 max-sm:bottom-1 w-[100px] max-sm:w-[70px] bg-[#1a234b] rounded-full transition-all duration-300 ease-out shadow-md"
                                style={{ left: viewSide === "front" ? (window.innerWidth < 640 ? '4px' : '6px') : 'calc(100% - ' + (window.innerWidth < 640 ? '74px' : '106px') + ')' }}
                            />
                            <button
                                onClick={() => setViewSide("front")}
                                className={`relative w-[100px] max-sm:w-[70px] py-2 max-sm:py-1 rounded-full text-[10px] max-sm:text-[8px] font-black tracking-widest transition-colors z-10 flex items-center justify-center gap-2 max-sm:gap-1
                                    ${viewSide === "front" ? 'text-white' : 'text-slate-500 hover:text-[#1a234b]'}`}
                            >
                                {viewSide === "front" && <div className="w-1.5 h-1.5 max-sm:w-1 max-sm:h-1 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                                FRONT
                            </button>
                            <button
                                onClick={() => setViewSide("back")}
                                className={`relative w-[100px] max-sm:w-[70px] py-2 max-sm:py-1 rounded-full text-[10px] max-sm:text-[8px] font-black tracking-widest transition-colors z-10 flex items-center justify-center gap-2 max-sm:gap-1
                                    ${viewSide === "back" ? 'text-white' : 'text-slate-500 hover:text-[#1a234b]'}`}
                            >
                                {viewSide === "back" && <div className="w-1.5 h-1.5 max-sm:w-1 max-sm:h-1 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                                BACK
                            </button>
                        </div>

                        {/* Local Zoom Hack for fitting ID explicitly into Mobile viewport height */}
                        <div 
                            className="print-mode relative cursor-pointer hover:scale-[1.02] transition-all group max-sm:[zoom:0.55]"
                            onClick={() => setIsFullPreview(true)}
                            title="Click for full view"
                        >
                            {isTemplateLoaded ? (
                                <IDCard user={mergedUserData} template={template} side={viewSide} />
                            ) : (
                                <div className="w-[320px] h-[500px] rounded-[24px] bg-slate-100 animate-pulse flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Side Panel */}
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-[32px] max-sm:rounded-[20px] p-8 max-sm:p-4 border border-slate-100 shadow-sm mb-6 max-sm:mb-4">
                            <div className="flex items-center justify-between mb-8 max-sm:mb-4 pb-4 max-sm:pb-2 border-b border-slate-50">
                                <h3 className="font-black text-[#1a234b] text-base max-sm:text-sm">Identity Details</h3>
                            </div>

                            <div className="space-y-5 max-sm:space-y-3">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</span>
                                    <span className="text-sm max-sm:text-xs font-bold text-slate-800">{userData?.name || <i className="text-slate-300 font-medium">Not Provided</i>}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Role Designation</span>
                                    <span className="text-sm max-sm:text-xs font-bold text-slate-800">{userData?.role_context || <i className="text-slate-300 font-medium">Not Provided</i>}</span>
                                </div>
                                <div className="pt-4 max-sm:pt-2 mt-2 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date of Birth</span>
                                        <span className="text-xs max-sm:text-[10px] font-bold text-slate-700">{mergedUserData?.attributes?.dob || <i className="text-slate-300 font-medium">Not Provided</i>}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</span>
                                        <span className="text-xs max-sm:text-[10px] font-bold text-slate-700">{mergedUserData?.attributes?.phone || <i className="text-slate-300 font-medium">Not Provided</i>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/30">
            {renderPageContent()}

            {/* ID Photo Guidelines Modal */}
            <Modal
                open={showGuidelinesModal}
                footer={null}
                onCancel={() => setShowGuidelinesModal(false)}
                width={600}
                centered
                closable={false}
                destroyOnClose
                className="guidelines-modal"
                styles={{ body: { padding: 0 }, content: { maxWidth: '95vw', margin: '0 auto' } }}
            >
                <div className="p-8 max-sm:p-5 text-center relative overflow-hidden">
                    <div className="w-16 h-16 max-sm:w-12 max-sm:h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 max-sm:mb-4 shadow-sm border border-blue-100">
                        <CameraOutlined className="text-2xl text-[#1a234b]" />
                    </div>

                    <Title level={2} className="!text-[#1a234b] !font-black !mb-2 max-sm:!text-xl">ID Photo Guidelines</Title>
                    <Paragraph className="text-slate-500 font-medium text-sm max-sm:text-xs mb-8 max-sm:mb-4">
                        Please ensure your photo meets these requirements for successful biometric verification.
                    </Paragraph>

                    <div className="flex flex-col md:flex-row gap-6 max-sm:gap-3 mb-10 max-sm:mb-6">
                        {/* DO Column */}
                        <div className="flex-1 bg-emerald-50/30 p-6 max-sm:p-4 rounded-[32px] max-sm:rounded-2xl border border-emerald-100 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-5 border-4 border-emerald-500 shadow-lg relative">
                                <img src={FormalPhoto} alt="Correct" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">DO</span>
                            <p className="text-[11px] font-bold text-emerald-600/80 leading-relaxed">Formal attire, white background, looking straight</p>
                        </div>

                        {/* DON'T Column */}
                        <div className="flex-1 bg-rose-50/30 p-6 max-sm:p-4 rounded-[32px] max-sm:rounded-2xl border border-rose-100 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-5 border-4 border-rose-500 shadow-lg relative">
                                <img src={InformalPhoto} alt="Incorrect" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
                                    <XCircle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1.5">DON'T</span>
                            <p className="text-[11px] font-bold text-rose-600/80 leading-relaxed">Winking, informal expressions, or non-neutral poses</p>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                            setShowGuidelinesModal(false);
                            if (!isApplying) setIsApplying(true);
                        }}
                        className="bg-[#1a234b] hover:!bg-blue-900 !h-14 max-sm:!h-12 !px-16 max-sm:!px-8 !text-base max-sm:!text-sm !font-black !rounded-2xl !tracking-widest shadow-xl shadow-blue-900/10 w-full"
                    >
                        I UNDERSTAND
                    </Button>
                </div>
            </Modal>

            {/* Physical ID Request Modal */}
            <Modal
                open={showPhysicalIDRequest}
                footer={null}
                onCancel={() => setShowPhysicalIDRequest(false)}
                width={600}
                centered
                closable={false}
                destroyOnClose
                className="physical-id-request-modal"
                styles={{ body: { padding: 0, maxHeight: '90vh', overflowY: 'auto' }, content: { maxWidth: '95vw', margin: '0 auto' } }}
            >
                <div className="p-8 max-sm:p-5 relative">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                        <CreditCard className="w-8 h-8 text-[#1a234b]" />
                    </div>

                    <Title level={2} className="!text-[#1a234b] !font-black !mb-2">Physical ID Issuance</Title>
                    <Paragraph className="text-slate-500 font-medium text-sm mb-8">
                        Your digital ID is ready! Would you like a high-fidelity printed PVC card?
                        <br /><span className="text-blue-600 font-black">Note: Production takes 7 business days.</span>
                    </Paragraph>

                    <div className="space-y-4 mb-10">
                        <div
                            onClick={() => setFulfillmentMethod('pickup')}
                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4
                                ${fulfillmentMethod === 'pickup' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm 
                                ${fulfillmentMethod === 'pickup' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <Text className="font-black text-[#1a234b] block">Self-Collection</Text>
                                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pick up at Registrar (Free)</Text>
                            </div>
                            {fulfillmentMethod === 'pickup' && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
                        </div>

                        <div
                            onClick={() => setFulfillmentMethod('delivery')}
                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4
                                ${fulfillmentMethod === 'delivery' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm 
                                ${fulfillmentMethod === 'delivery' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                                <Truck className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <Text className="font-black text-[#1a234b] block">Doorstep Delivery</Text>
                                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Delivered to your address (Fee applies)</Text>
                            </div>
                            {fulfillmentMethod === 'delivery' && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                        </div>
                    </div>

                    {fulfillmentMethod === 'pickup' && (
                        <div className="bg-slate-50 p-6 rounded-3xl mb-10 border border-slate-100 animate-in slide-in-from-top-4">
                            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Collection Schedule</Text>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <Text className="text-sm font-black text-[#1a234b] block">
                                        {new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                    <Text className="text-[10px] text-slate-400 font-bold">Standard 7-day production window</Text>
                                </div>
                            </div>
                            <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3 h-3" /> Reschedule Date
                            </button>
                        </div>
                    )}

                    {fulfillmentMethod === 'delivery' && (
                        <div className="mb-10 space-y-4 animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <Truck className="w-3 h-3 text-indigo-600" />
                                </div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Delivery Information</span>
                            </div>

                            {/* Recipient Name */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={deliveryForm.recipientName}
                                    onChange={e => handleDeliveryFormChange('recipientName', e.target.value)}
                                    placeholder="Full name of recipient"
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={deliveryForm.phoneNumber}
                                    onChange={e => handleDeliveryFormChange('phoneNumber', e.target.value)}
                                    placeholder="e.g. 09XX XXX XXXX"
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all"
                                />
                            </div>

                            {/* Province */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Province</label>
                                <select
                                    value={deliveryForm.province}
                                    onChange={e => handleDeliveryFormChange('province', e.target.value)}
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all appearance-none"
                                >
                                    <option value="">Select Province</option>
                                    {allProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            {/* Municipality */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Municipality / City</label>
                                <select
                                    value={deliveryForm.municipality}
                                    onChange={e => handleDeliveryFormChange('municipality', e.target.value)}
                                    disabled={!deliveryForm.province}
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all appearance-none disabled:opacity-40"
                                >
                                    <option value="">Select Municipality</option>
                                    {availableMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            {/* Barangay */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Barangay</label>
                                <select
                                    value={deliveryForm.barangay}
                                    onChange={e => handleDeliveryFormChange('barangay', e.target.value)}
                                    disabled={!deliveryForm.municipality}
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all appearance-none disabled:opacity-40"
                                >
                                    <option value="">Select Barangay</option>
                                    {availableBarangays.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            {/* Confirm Map Location */}
                            <button
                                type="button"
                                onClick={() => setShowMapModal(true)}
                                className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all font-black text-sm tracking-wide
                                    ${mapConfirmed ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:border-indigo-400'}`}
                            >
                                {mapConfirmed ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Location Confirmed on Map</>
                                ) : (
                                    <><MapPin className="w-4 h-4 animate-bounce" /> Pin Real-time Map Location</>
                                )}
                            </button>

                            {/* Address Details */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Address Details</label>
                                <textarea
                                    value={deliveryForm.addressDetails}
                                    onChange={e => handleDeliveryFormChange('addressDetails', e.target.value)}
                                    rows={2}
                                    placeholder="House/Unit no., Street, Building, Landmark..."
                                    className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all resize-none"
                                />
                            </div>

                            {/* Preview full address */}
                            {(deliveryForm.barangay || deliveryForm.addressDetails) && (
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Full Delivery Address</span>
                                    <span className="text-xs font-bold text-slate-700">{buildShippingAddress() || 'Fill all fields above'}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button
                            size="large"
                            onClick={() => setShowPhysicalIDRequest(false)}
                            className="flex-1 !h-14 !rounded-2xl !font-black !text-slate-400 border-none shadow-none"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            disabled={!fulfillmentMethod || (fulfillmentMethod === 'delivery' && (!deliveryForm.recipientName || !deliveryForm.phoneNumber || !deliveryForm.province || !deliveryForm.municipality || !deliveryForm.barangay))}
                            onClick={async () => {
                                if (!application?.id) {
                                    message.error("Application ID not found. Please try again.");
                                    return;
                                }
                                const finalAddress = fulfillmentMethod === 'delivery'
                                    ? `${deliveryForm.recipientName} | ${deliveryForm.phoneNumber} | ${buildShippingAddress()}${deliveryForm.addressDetails ? ` | ${deliveryForm.addressDetails}` : ''}`
                                    : null;
                                setShippingAddress(finalAddress || '');
                                try {
                                    // 1. Update the ID Application fulfillment details in backend
                                    await fetch(`${API_BASE_URL}/applications/${application.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            fulfillment_method: fulfillmentMethod,
                                            shipping_address: finalAddress,
                                            scheduled_at: scheduledDate
                                        })
                                    });

                                    // 2. Update user profile attributes to record that physical card has been requested
                                    const updatedAttributes = {
                                        ...userData?.attributes,
                                        physical_id_requested: true
                                    };
                                    await fetch(`${API_BASE_URL}/users/${userData.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            attributes: updatedAttributes
                                        })
                                    });

                                    // 3. Update parent/global React state
                                    if (setUserData) {
                                        setUserData(prev => ({
                                            ...prev,
                                            attributes: updatedAttributes
                                        }));
                                    }

                                    setPhysicalIDStatus("production");
                                    setShowPhysicalIDRequest(false);
                                    setShowClaimingModal(true);
                                    message.success("PVC Card Request Confirmed!");
                                } catch (err) {
                                    console.error("Failed to update fulfillment details:", err);
                                    message.error("Failed to process request.");
                                }
                            }}
                            className="flex-1 bg-[#1a234b] hover:!bg-blue-900 !h-14 !text-sm !font-black !rounded-2xl !tracking-widest shadow-xl shadow-blue-900/10"
                        >
                            Confirm Request
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* PVC Request Tracking Modal */}
            <Modal
                open={showTrackingModal}
                footer={null}
                onCancel={() => setShowTrackingModal(false)}
                width={500}
                centered
                destroyOnClose
                title={
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Truck className="w-5 h-5 text-[#00b8b8]" />
                        <span className="font-black text-[#1a234b] text-base">PVC Request Tracking</span>
                    </div>
                }
                className="pvc-tracking-modal font-black"
                styles={{ content: { maxWidth: '95vw', margin: '0 auto' } }}
            >
                <div className="pt-4 space-y-6">
                    {/* Fulfillment Details Panel */}
                    {fulfillmentMethod && (
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                            {fulfillmentMethod === 'delivery' ? (
                                <>
                                    {parsedShipping?.name && (
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Recipient Name</span>
                                            <span className="text-xs font-bold text-slate-800">{parsedShipping.name}</span>
                                        </div>
                                    )}
                                    {parsedShipping?.phone && (
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Contact Phone</span>
                                            <span className="text-xs font-bold text-slate-800">{parsedShipping.phone}</span>
                                        </div>
                                    )}
                                    {parsedShipping?.address && (
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Delivery Address</span>
                                            <span className="text-xs font-bold text-slate-800 leading-relaxed block">{parsedShipping.address}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Fulfillment Method</span>
                                        <span className="text-xs font-bold text-slate-800">Registrar Branch Pick-up</span>
                                    </div>
                                    {scheduledDate && (
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Scheduled Collection Date</span>
                                            <span className="text-xs font-bold text-slate-800">{scheduledDate}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {trackingId && (
                                <div className="pt-2.5 border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Tracking Number</span>
                                    <span className="text-xs font-black text-[#1a234b] tracking-wider uppercase">{trackingId}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tracking Timeline */}
                    <div className="px-1">
                        <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Request Progress</h4>
                        <div className="space-y-0">
                            {(() => {
                                const steps = [
                                    {
                                        key: 'placed',
                                        label: 'Request submitted',
                                        desc: 'Fulfillment request submitted successfully.',
                                        activeDesc: 'Fulfillment request submitted successfully.'
                                    },
                                    {
                                        key: 'production',
                                        label: 'In production',
                                        desc: 'Card is being manufactured.',
                                        activeDesc: 'Your physical PVC card is currently in production and being printed.'
                                    },
                                    {
                                        key: 'ready',
                                        label: fulfillmentMethod === 'delivery' ? 'Out for delivery' : 'Ready for collection',
                                        desc: fulfillmentMethod === 'delivery' ? 'Card is with courier partner.' : 'Card is ready at Registrar.',
                                        activeDesc: fulfillmentMethod === 'delivery' ? 'Your package has been dispatched and is out for doorstep delivery.' : 'Your card is ready and waiting for your branch pick-up.'
                                    },
                                    {
                                        key: fulfillmentMethod === 'delivery' ? 'delivered' : 'collected',
                                        label: fulfillmentMethod === 'delivery' ? 'PVC Card delivered' : 'PVC Card collected',
                                        desc: 'PVC card successfully received.',
                                        activeDesc: 'Card successfully delivered to your doorstep.'
                                    }
                                ];

                                const statusOrder = ['requested', 'production', 'ready', 'delivered', 'collected'];
                                let currentIdx = 0;
                                if (physicalIDStatus === 'delivered' || physicalIDStatus === 'collected') {
                                    currentIdx = 3;
                                } else if (physicalIDStatus === 'ready') {
                                    currentIdx = 2;
                                } else if (physicalIDStatus === 'production') {
                                    currentIdx = 1;
                                } else {
                                    currentIdx = 0;
                                }

                                return steps.map((step, idx) => {
                                    const isDone = currentIdx > idx;
                                    const isCurrent = currentIdx === idx;
                                    const isFuture = currentIdx < idx;

                                    return (
                                        <div key={step.key} className="flex gap-4">
                                            {/* Vertical Timeline Column */}
                                            <div className="flex flex-col items-center shrink-0 w-6">
                                                {/* Centered Dot Container */}
                                                <div className="h-6 flex items-center justify-center">
                                                    {isCurrent ? (
                                                        <div className="w-5 h-5 rounded-full border-[2.5px] border-[#00b8b8] bg-white flex items-center justify-center shadow-sm">
                                                            <div className="w-2.5 h-2.5 bg-[#00b8b8] rounded-full animate-pulse" />
                                                        </div>
                                                    ) : isDone ? (
                                                        <div className="w-[10px] h-[10px] bg-[#00b8b8] rounded-full shadow-sm" />
                                                    ) : (
                                                        <div className="w-[10px] h-[10px] bg-slate-300 rounded-full" />
                                                    )}
                                                </div>

                                                {/* Perfect Connector Line underneath Dot */}
                                                {idx < steps.length - 1 && (
                                                    <div className={`w-[2.5px] flex-grow rounded-full transition-colors duration-500 ${isDone ? 'bg-[#00b8b8]' : 'bg-slate-200'
                                                        }`} style={{ minHeight: '24px' }} />
                                                )}
                                            </div>

                                            {/* Content Column */}
                                            <div className={`pb-6 flex-1 select-none ${idx === steps.length - 1 ? 'pb-0' : ''}`}>
                                                <span className={`text-[13px] font-black block leading-6 ${isCurrent ? 'text-[#00b8b8]' : isDone ? 'text-slate-800 font-bold' : 'text-slate-400 font-bold'
                                                    }`}>{step.label}</span>

                                                {isCurrent && (
                                                    <div className="mt-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-[340px]">{step.activeDesc}</p>
                                                        <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase mt-1">
                                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 12:00 AM
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Real-time Map Modal */}
            <Modal
                open={showMapModal}
                footer={null}
                onCancel={() => setShowMapModal(false)}
                width={700}
                centered
                destroyOnClose
                title={<span className="font-black text-[#1a234b] text-base">Select Delivery Location</span>}
                className="realtime-map-modal font-black"
            >
                <div className="pt-4">
                    <MapAddressPicker
                        onSelect={handleMapLocationSelect}
                        initialQuery={deliveryForm.addressDetails || ""}
                    />
                </div>
            </Modal>

            {/* Digital Claim Stub Modal */}
            <Modal
                open={showClaimingModal}
                footer={null}
                onCancel={() => setShowClaimingModal(false)}
                width={450}
                centered
                closable={false}
                destroyOnClose
                className="claiming-modal"
                styles={{ body: { padding: 0 }, content: { maxWidth: '95vw', margin: '0 auto' } }}
            >
                <div className="p-8 max-sm:p-4 text-center relative overflow-hidden">
                    <div className={`absolute top-8 -right-12 px-12 py-1 rotate-45 shadow-sm z-50 
                        ${physicalIDStatus === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                            {physicalIDStatus === 'ready' ? 'Ready' : 'In Production'}
                        </Text>
                    </div>

                    <div ref={stubRef} className="bg-white p-5 rounded-[40px]">
                        <div className="text-center mb-4">
                            <Title level={4} className="!text-[#1a234b] !font-black !mb-0.5">Claim Stub</Title>
                            <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest block mb-1.5">
                                {fulfillmentMethod === 'pickup' ? 'Collection Voucher' : 'Shipping Manifest'}
                            </Text>
                            <div className="py-1 px-4 bg-slate-50 rounded-full border border-slate-100 inline-block">
                                <Text className="text-[#1a234b] font-black text-[11px] uppercase tracking-tight">
                                    {userData?.name || "Official Claimant"}
                                </Text>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[40px] mb-4 border border-slate-100 flex flex-col items-center shadow-inner">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                                <QRCode
                                    value={JSON.stringify({
                                        user_id: userData?.id,
                                        ticket_id: trackingId || `CLAIM-${(String(userData?.id || "").slice(0, 8)).toUpperCase()}`,
                                        type: "ID_CARD_CLAIM",
                                        fulfillment: fulfillmentMethod
                                    })}
                                    size={150}
                                />
                            </div>
                            <Text className="mt-4 font-black text-[#1a234b] tracking-[2px] uppercase text-[11px]">
                                {trackingId || `CLAIM-${(String(userData?.id || "").slice(0, 8)).toUpperCase()}`}
                            </Text>
                        </div>

                        <div className="space-y-2">
                            {fulfillmentMethod === 'pickup' ? (
                                application?.collection_location ? (
                                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <MapPin className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Collection Location</Text>
                                            <Text className="text-sm font-bold text-slate-700">{application.collection_location}</Text>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50/40 p-4 rounded-3xl border border-amber-100/50 flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <MapPin className="w-5 h-5 text-amber-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <Text className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Collection Location</Text>
                                            <Text className="text-xs font-bold text-amber-600/80 italic">Not yet assigned (Pending branch assignment)</Text>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="bg-indigo-50/30 p-4 rounded-3xl border border-indigo-100 flex items-center gap-3 text-left">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Truck className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Shipping to Address</Text>
                                        <Text className="text-xs font-bold text-slate-700 line-clamp-1">{shippingAddress}</Text>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3 text-left">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Calendar className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        {fulfillmentMethod === 'pickup' ? 'Collection Date' : 'Estimated Arrival'}
                                    </Text>
                                    <Text className="text-sm font-black text-slate-700">
                                        {(() => {
                                            const base = application?.submitted_at
                                                ? new Date(application.submitted_at)
                                                : new Date();
                                            const target = new Date(base);
                                            target.setDate(base.getDate() + 7);
                                            const formatted = target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                            return application?.is_ready ? formatted : `${formatted} (Estimated)`;
                                        })()}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                            <Text className="text-[9px] font-bold text-slate-400 leading-relaxed block px-2 italic">
                                Please present this official claim stub to the Registrar's Office for identity verification and card collection.
                            </Text>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={handleSaveStubAsPhoto}
                                className="!h-12 !rounded-2xl !font-black !text-[#1a234b] border-2 border-slate-100 hover:border-[#1a234b] flex items-center justify-center gap-2"
                            >
                                <CameraOutlined /> PHOTO
                            </Button>
                            <Button
                                onClick={handleSaveStubAsPDF}
                                className="!h-12 !rounded-2xl !font-black !text-[#1a234b] border-2 border-slate-100 hover:border-[#1a234b] flex items-center justify-center gap-2"
                            >
                                <DownloadOutlined /> PDF
                            </Button>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setShowClaimingModal(false)}
                            className="bg-[#1a234b] hover:!bg-blue-900 !h-14 !px-16 !text-base !font-black !rounded-2xl !tracking-widest shadow-xl shadow-blue-900/10 w-full"
                        >
                            CLOSE VOUCHER
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Congratulations Popup */}
            <Modal
                open={showCongratsPopup}
                footer={null}
                closable={false}
                centered
                width={400}
                className="rounded-3xl overflow-hidden p-0"
                bodyStyle={{ padding: 0 }}
                styles={{ content: { maxWidth: '95vw', margin: '0 auto' } }}
            >
                <div className="p-8 max-sm:p-5 text-center bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-50" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 max-sm:w-18 max-sm:h-18 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 max-sm:mb-4 shadow-lg shadow-emerald-200 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <Title level={2} className="!text-[#1a234b] !font-black !mb-2 tracking-tighter max-sm:!text-xl">Congratulations!</Title>
                        <Paragraph className="text-slate-500 font-medium text-sm mb-8 px-2 leading-relaxed">
                            Your official Digital ID has been successfully issued and verified.
                        </Paragraph>

                        <Button
                            type="primary"
                            size="large"
                            onClick={handleCongratsOk}
                            className="w-full !h-14 max-sm:!h-12 !rounded-2xl !font-black !bg-emerald-600 hover:!bg-emerald-700 border-none shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-all"
                        >
                            View Digital ID
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* PDF Generation Overlay */}
            {isDownloading && (
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center overflow-y-auto pt-20 pb-10 print-mode no-dark">
                    <div className="text-center mb-10">
                        <Loader2 className="w-16 h-16 text-[#1a234b] animate-spin mb-6 mx-auto" />
                        <Title level={2} className="!text-[#1a234b] !font-black !mb-2 tracking-tight">Generating Print File...</Title>
                        <Text className="text-slate-500 font-bold text-base">Please wait while we render high-fidelity assets.</Text>
                    </div>
                </div>
            )}
            {/* ── FULL VIEW OVERLAY ── */}
            {isFullPreview && (
                <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300 overflow-y-auto p-4">
                    <button 
                        onClick={() => setIsFullPreview(false)}
                        className="absolute top-6 right-6 max-sm:top-4 max-sm:right-4 w-14 h-14 max-sm:w-10 max-sm:h-10 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-white flex items-center justify-center transition-all group active:scale-95 border border-white/10 z-10"
                    >
                        <X className="w-7 h-7 max-sm:w-5 max-sm:h-5" />
                    </button>

                    <div className="flex flex-col items-center gap-12 max-sm:gap-6 animate-in zoom-in-95 duration-500 ease-out">
                         {/* Toggle in Fullscreen */}
                         <div className="flex gap-2 bg-white/5 p-2 rounded-2xl backdrop-blur-2xl border border-white/10 shadow-2xl">
                            <button 
                                onClick={() => setViewSide('front')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${viewSide === 'front' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Front
                            </button>
                            <button 
                                onClick={() => setViewSide('back')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${viewSide === 'back' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Back
                            </button>
                         </div>

                         <div className="max-sm:scale-[0.7] max-sm:origin-center scale-[1.15] origin-center shadow-[0_0_120px_rgba(255,255,255,0.15)] rounded-[2.5rem]">
                            <IDCard
                                user={userData}
                                template={template}
                                side={viewSide}
                            />
                         </div>

                         <div className="flex flex-col items-center text-center max-sm:hidden">
                            <h2 className="text-4xl font-black text-white tracking-tighter">{userData?.name}</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-4 flex items-center gap-4">
                                <span className="w-8 h-[1px] bg-white/20"></span>
                                Digital Identity Card
                                <span className="w-8 h-[1px] bg-white/20"></span>
                            </p>
                         </div>
                    </div>
                </div>
            )}

            {/* HIDDEN PERMANENT CAPTURE NODES
                These must stay mounted at all times. If conditionally mounted, 
                WebKit/Blink's SVG foreignObject pipeline fails to flush the layout 
                and renders solid bounding boxes instead of text. 
            */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} className="print-mode no-dark">
                <div id="pdf-front-capture" className="bg-white" style={{ width: template?.orientation === 'landscape' ? 500 : 320, height: template?.orientation === 'landscape' ? 320 : 500 }}>
                    {userData && template ? <IDCard user={userData} template={template} side="front" /> : null}
                </div>
                <div id="pdf-back-capture" className="bg-white" style={{ width: template?.orientation === 'landscape' ? 500 : 320, height: template?.orientation === 'landscape' ? 320 : 500 }}>
                    {userData && template ? <IDCard user={userData} template={template} side="back" /> : null}
                </div>
            </div>
        </div>
    );
};

export default DigitalID;
