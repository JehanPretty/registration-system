import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Info,
  Circle,
  Scan,
  Building2,
  GraduationCap,
  ChevronLeft,
  Loader2,
  BadgeCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  IdCard,
  FileText,
  Upload,
  Camera,
  AlertTriangle,
  ScanFace,
  FileSearch,
  Fingerprint,
  XCircle,
  Check,
  Search
} from "lucide-react";
import Tesseract from 'tesseract.js';

import { API_BASE_URL } from "../config";
import { clearSession } from "../utils/session";
import * as faceapi from "@vladmandic/face-api";
import { COUNTRIES } from "../constants/countries";
import AddressForm from "../components/AddressForm";
import Cropper from "react-cropper";
import { getFieldSpan, getSectionGridClass, isAddressSection } from "../utils/formLayout";
import { resolveAttributeValue } from "../utils/addressMapper";

// --- SUB-COMPONENTS ---

const ProgressTracker = ({ steps, activeIndex }) => {
  const verifyIdx = steps.findIndex(s => s.type === 'verify');

  return (
    <div className="py-3 md:py-5 px-2 md:px-6 bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm overflow-hidden">
      <div className="max-w-4xl mx-auto relative px-4 flex items-center justify-between w-full">
        {/* Background Track - Phase 1 */}
        <div className="absolute top-[14px] md:top-[18px] left-[40px] right-[40px] flex items-center z-0 pointer-events-none">
          <div className="h-[2px] md:h-[3px] bg-slate-50 rounded-full overflow-hidden flex-1 mr-[30px] md:mr-[100px]">
            <div
              className="h-full bg-[#1a234b] transition-all duration-700 ease-in-out"
              style={{
                width: activeIndex >= verifyIdx
                  ? '100%'
                  : `${(activeIndex / (verifyIdx || 1)) * 100}%`
              }}
            />
          </div>
          {/* Phase 2 Line */}
          <div className="h-[2px] md:h-[3px] bg-slate-50 rounded-full overflow-hidden w-[30px] md:w-[100px]">
            <div
              className="h-full bg-[#1a234b] transition-all duration-700 ease-in-out"
              style={{
                width: activeIndex < verifyIdx
                  ? '0%'
                  : `${((activeIndex - verifyIdx) / (steps.length - 1 - verifyIdx || 1)) * 100}%`
              }}
            />
          </div>
        </div>

        {steps.map((step, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const isVerifiedPhaseStart = idx === verifyIdx;

          return (
            <React.Fragment key={idx}>
              {isVerifiedPhaseStart && <div className="w-2 md:w-12" />}
              <div className="relative z-10 flex flex-col items-center group flex-1 min-w-0">
                <div
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive
                    ? 'bg-[#1a234b] border-[#1a234b] text-white shadow-lg'
                    : 'bg-white border-slate-100 text-slate-300'
                    } ${isCurrent ? 'scale-110 ring-4 ring-blue-50/50 shadow-xl shadow-blue-900/10' : ''}`}
                >
                  {idx < activeIndex ? (
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  ) : (
                    <span className="text-[10px] md:text-xs font-black">{idx + 1}</span>
                  )}
                </div>

                <span
                  className={`mt-2 md:mt-3 text-[7px] md:text-[9px] font-black tracking-normal md:tracking-[0.15em] whitespace-nowrap transition-colors duration-500 overflow-hidden text-ellipsis w-full text-center px-1 ${isActive ? 'text-[#1a234b]' : 'text-slate-300'
                    }`}
                >
                  {step.title?.split(' ')[0] || step.label}
                </span>

                {isCurrent && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div className="mb-3 animate-in fade-in slide-in-from-left-2 duration-500">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-blue-600 rotate-45 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
      <h3 className="text-[#1a234b] font-black text-sm">{title}</h3>
    </div>
    <div className="h-[1px] bg-slate-100 w-full" />
  </div>
);

const InputGroup = ({ label, required, children, error, hideStatus }) => (
  <div className={`mb-3 transition-all duration-300 ${error ? 'animate-in shake-subtle' : ''}`} id={`input-group-${label}`}>
    <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 transition-colors">
      {label} {!hideStatus && (required ? <span className="text-red-500">*</span> : <span className="text-slate-300 font-medium">(Optional)</span>)}
    </label>
    {children}
    {error && <p className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
  </div>
);

const CountryCodeSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedCountry = COUNTRIES.find(c => c.dial_code === value) || COUNTRIES.find(c => c.code === 'PH');

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial_code.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-r border-slate-200 rounded-l-lg hover:bg-slate-100 transition-colors group"
      >
        <img
          src={`https://flagcdn.com/w40/${selectedCountry?.code.toLowerCase()}.png`}
          alt={selectedCountry?.code}
          className="w-5 h-3.5 object-cover rounded-sm shadow-sm group-hover:scale-110 transition-transform"
        />
        <span className="text-sm font-bold text-[#1a234b]">{selectedCountry?.dial_code}</span>
        <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 transform transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search country..."
                className="bg-transparent border-none outline-none text-xs font-bold text-[#1a234b] w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.map((c) => (
              <button
                key={`${c.code}-${c.dial_code}`}
                type="button"
                onClick={() => {
                  onChange(c.dial_code);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                    alt={c.code}
                    className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                  />
                  <span className="text-xs font-bold text-[#1a234b]">{c.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">{c.dial_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SummaryView = ({ sections, values }) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {sections.map((section) => {
        const sectionTitle = section?.title || section?.sectionTitle || "";
        const addressSection = isAddressSection(sectionTitle);

        return (
          <div key={section.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <h4 className="text-xs font-black text-[#1a234b] uppercase tracking-wider">{sectionTitle}</h4>
            </div>
            <div className={addressSection ? "space-y-4" : getSectionGridClass()}>
              {section.fields.map((field) => {
                const val = values[field.id] || values[field.label] || "N/A";
                return (
                  <div
                    key={field.id}
                    className={`flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0 last:pb-0 ${addressSection ? "" : getFieldSpan(field.label, field.type)}`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</span>
                    <span className="text-sm font-semibold text-[#1a234b]">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("regisSys_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    if (!user) return 0;
    const saved = localStorage.getItem(`regisSys_activeStepIndex_${user.id}`);
    return saved ? parseInt(saved) : 0;
  });

  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [formSections, setFormSections] = useState([]);
  const [dynamicValues, setDynamicValues] = useState(() => {
    const saved = localStorage.getItem("regisSys_dynamic_values");
    return saved ? JSON.parse(saved) : {};
  });
  const [errors, setErrors] = useState({});
  const [noMiddleName, setNoMiddleName] = useState(() => JSON.parse(localStorage.getItem('regisSys_noMiddleName') || 'false'));
  const [noSuffix, setNoSuffix] = useState(() => JSON.parse(localStorage.getItem('regisSys_noSuffix') || 'false'));

  const steps = [
    ...formSections.map(s => ({ title: s.title, type: 'dynamic', section: s, icon: User })),
    { title: 'Review Summary', type: 'summary', icon: Cpu },
    { title: 'ID & Selfie Verification', type: 'verify', icon: ShieldCheck },
    { title: 'Login Credentials', type: 'security', icon: Lock }
  ];

  const currentStep = steps[activeStepIndex];

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropTargetField, setCropTargetField] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(3 / 4); // Default portrait
  const cropperRef = useRef(null);

  // Security Step State
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // KYC State (Persistent)
  const [kycFile, setKycFile] = useState(() => localStorage.getItem("regisSys_kyc_file") || null);
  const [kycFileError, setKycFileError] = useState(false);
  const [kycDocType, setKycDocType] = useState(() => localStorage.getItem("regisSys_kyc_type") || null);
  const [selfieFile, setSelfieFile] = useState(() => localStorage.getItem("regisSys_selfie_file") || null);
  const [selfieError, setSelfieError] = useState(false);
  const [kycSubStep, setKycSubStep] = useState(() => parseInt(localStorage.getItem("regisSys_kyc_substep")) || 1);
  const [kycDocTypeError, setKycDocTypeError] = useState(false);

  // Persistence Sync: Save step whenever it changes, scoped to user ID
  useEffect(() => {
    if (user?.id && !isSuccess) {
      localStorage.setItem(`regisSys_activeStepIndex_${user.id}`, activeStepIndex.toString());
    }
  }, [activeStepIndex, user?.id, isSuccess]);

  // Persist Form Values & KYC Docs
  useEffect(() => {
    if (Object.keys(dynamicValues).length > 0) localStorage.setItem("regisSys_dynamic_values", JSON.stringify(dynamicValues));
    else localStorage.removeItem("regisSys_dynamic_values");
  }, [dynamicValues]);

  useEffect(() => {
    if (kycFile) localStorage.setItem("regisSys_kyc_file", kycFile);
    else localStorage.removeItem("regisSys_kyc_file");
  }, [kycFile]);

  useEffect(() => {
    if (selfieFile) localStorage.setItem("regisSys_selfie_file", selfieFile);
    else localStorage.removeItem("regisSys_selfie_file");
  }, [selfieFile]);

  useEffect(() => {
    if (kycDocType) localStorage.setItem("regisSys_kyc_type", kycDocType);
    else localStorage.removeItem("regisSys_kyc_type");
  }, [kycDocType]);

  useEffect(() => {
    localStorage.setItem("regisSys_kyc_substep", kycSubStep.toString());
  }, [kycSubStep]);

  useEffect(() => {
    if (!user) {
      clearSession();

      // Reset local states
      setShowWebCamera(false);
      setDynamicValues({});
      setKycFile(null);
      setSelfieFile(null);
      setKycDocType(null);
      setKycSubStep(1);
    }
  }, [user]);

  // Session Integrity Guard: If the user swaps in another tab, refresh/boot
  useEffect(() => {
    if (!user?.id) return; // Only guard if we have an active session to protect

    const handleStorageChange = (e) => {
      // Correctly identifying which key changed
      if (e.key === "regisSys_user") {
        const activeUserStr = e.newValue;
        if (!activeUserStr) {
          window.location.reload();
          return;
        }
        try {
          const activeUser = JSON.parse(activeUserStr);
          if (activeUser.id !== user.id) {
            window.location.reload();
          }
        } catch (err) {
          window.location.reload();
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user?.id]);
  const [kycOcrBlockError, setKycOcrBlockError] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionRef = useRef(null);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [facePositionHint, setFacePositionHint] = useState("Positioning...");

  const [kycPipelineActive, setKycPipelineActive] = useState(false);
  const [kycPipelineResult, setKycPipelineResult] = useState(null); // null | 'pass' | 'fail'
  const [kycPipelineError, setKycPipelineError] = useState('');
  const [kycVerificationComplete, setKycVerificationComplete] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [scanMatchResult, setScanMatchResult] = useState(null); // null | 'pass' | 'fail'
  const [scanMatchError, setScanMatchError] = useState("");
  const [lastExtractedText, setLastExtractedText] = useState("");

  // Biometric matching state
  const [isMatchingFace, setIsMatchingFace] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState("");
  const [faceMatchResult, setFaceMatchResult] = useState(null); // 'pass' | 'fail'
  const [faceMatchError, setFaceMatchError] = useState("");

  // Liveness Detection State
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessInstruction, setLivenessInstruction] = useState('Position your face in the frame');
  const [livenessPhase, setLivenessPhase] = useState('idle'); // 'idle' | 'scanning' | 'success'
  const [frozenFrame, setFrozenFrame] = useState(null);
  const livenessRef = useRef({ challengeIndex: 0, holdFrames: 0, accumulated: 0 });

  const CHALLENGES = [
    { id: 'left', instruction: 'Turn your head left ←', frames: 8, check: (nose, box) => ((nose.x - (box.x + box.width / 2)) / box.width) > 0.13 },
    { id: 'right', instruction: 'Turn your head right →', frames: 8, check: (nose, box) => ((nose.x - (box.x + box.width / 2)) / box.width) < -0.13 },
    { id: 'center', instruction: 'Look straight at camera', frames: 10, check: (nose, box) => Math.abs((nose.x - (box.x + box.width / 2)) / box.width) < 0.06 },
  ];
  const TOTAL_FRAMES = 26;

  const startWebCamera = async () => {
    setShowWebCamera(true);
    if (!modelsLoaded) {
      try {
        setLivenessInstruction('Loading Security Models...'); // SPEED OPTIMIZATION: Load only Tiny models for instant camera startup
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
        ]);
        
        // Defer heavier models for the final match step
        window.heavierModelsPromise = (async () => {
          try {
            await Promise.all([
              faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
              faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
              faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);
            console.log("Heavier models loaded in background");
            return true;
          } catch (e) {
            console.warn("Background model load failed:", e);
            return false;
          }
        })();

        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load Face AI models", err);
      }
    }
    setLivenessProgress(0);
    setLivenessInstruction('Position your face in the frame');
    setLivenessPhase('idle');
    setFrozenFrame(null);
    setFaceMatchResult(null);
    setFaceMatchError('');
    livenessRef.current = { challengeIndex: 0, holdFrames: 0, accumulated: 0 };
    setIsFaceCentered(false);
  };

  // Lifecycle for Webcam Stream & Detection Loop
  useEffect(() => {
    let stream = null;
    const initStream = async () => {
      // alert("DEBUG: initStream called");
      
      // Feature detection with legacy fallbacks
      const getUserMedia = navigator.mediaDevices?.getUserMedia || 
                          navigator.webkitGetUserMedia || 
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia;

      if (!getUserMedia) {
        alert("Camera access is blocked. Please ensure you are using a secure connection (HTTPS) or have enabled Chrome Flags for this IP.");
        closeWebCamera();
        return;
      }
      try {
        const constraints = { 
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        };
        
        let localStream;
        if (navigator.mediaDevices?.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          // Fallback to legacy API
          localStream = await new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
        
        stream = localStream; // assign to outer variable for cleanup
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => {
               console.error("Video play error:", e);
            });
            startFaceDetectionLoop();
          };
        }
      } catch (err) {
        console.error("Camera Hardware Error:", err);
        let userMsg = `Camera Error: ${err.name}\n${err.message}`;
        
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          userMsg += "\n\nSuggestions:\n1. Close all other apps using the camera.\n2. Restart your phone.\n3. Ensure Chrome has Camera permission in Android Settings.";
        } else if (err.name === 'NotAllowedError') {
          userMsg += "\n\nPlease allow camera access when prompted by Chrome.";
        }
        
        alert(userMsg);
        closeWebCamera();
      }
    };

    if (showWebCamera) {
      initStream();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopFaceDetectionLoop();
    };
  }, [showWebCamera]);

  const captureWebPhoto = async (force = false) => {
    // Use the frozen frame from liveness verification (proven-live) if available
    if (frozenFrame) {
      setSelfieFile(frozenFrame);
      setFaceMatchResult(null);
      setFaceMatchError('');
      closeWebCamera();
      if (kycFile && scanMatchResult === 'pass') {
        await handleFaceMatch(frozenFrame);
      }
      return;
    }
    if (videoRef.current && canvasRef.current) {
      if (!force && !isFaceCentered) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Mirror the capture to match the CSS-mirrored video the user sees
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      const dataUrl = canvas.toDataURL('image/jpeg');

      setSelfieFile(dataUrl);
      setFaceMatchResult(null);
      setFaceMatchError('');
      closeWebCamera();
      if (kycFile && scanMatchResult === 'pass') {
        await handleFaceMatch(dataUrl);
      }
    }
  };

  const handleFaceMatch = async (capturedSelfie) => {
    console.log('[FaceMatch] Starting match. kycFile exists:', !!kycFile, ', selfie exists:', !!capturedSelfie);

    if (!kycFile) {
      return false;
    }
    if (!capturedSelfie) {
      setFaceMatchResult('fail');
      setFaceMatchError('No selfie captured. Please try again.');
      return false;
    }

    setIsMatchingFace(true);
    setFaceMatchResult(null);
    setFaceMatchError('');
    setFaceMatchStatus('Initializing AI security...');

    // Ensure models are loaded if they were deferred
    if (window.heavierModelsPromise) {
      console.log('[FaceMatch] Waiting for detailed models to finish loading...');
      const loaded = await window.heavierModelsPromise;
      if (!loaded) {
        throw new Error('Security models failed to load. Please check your internet connection.');
      }
    }
    setFaceMatchStatus('Processing biometric data...');

    try {
      const loadImage = (url) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      const [idImg, selfieImg] = await Promise.all([
        loadImage(kycFile),
        loadImage(capturedSelfie)
      ]);

      console.log('[FaceMatch] ID image:', idImg.width, 'x', idImg.height);
      console.log('[FaceMatch] Selfie image:', selfieImg.width, 'x', selfieImg.height);
      setFaceMatchStatus('Analyzing ID photo...');

      // Helper: try to detect a face with multiple strategies
      const detectFace = async (input, label) => {
        let det = await faceapi
          .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (det) { console.log(`[FaceMatch] ${label}: SSD detected (score: ${det.detection.score.toFixed(3)})`); return det; }

        const allFaces = await faceapi
          .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        if (allFaces.length > 0) {
          det = allFaces.sort((a, b) => b.detection.score - a.detection.score)[0];
          console.log(`[FaceMatch] ${label}: SSD-all detected (score: ${det.detection.score.toFixed(3)}, count: ${allFaces.length})`);
          return det;
        }

        det = await faceapi
          .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
          .withFaceLandmarks(true)
          .withFaceDescriptor();
        if (det) { console.log(`[FaceMatch] ${label}: Tiny detected`); return det; }
        
        return null;
      };

      // Detect face on ID — Skip heavy upscaling on mobile to prevent OOM
      let idDetection = await detectFace(idImg, 'ID');

      if (!idDetection) {
        throw new Error('No face detected on the uploaded ID. Please re-upload a clear photo of your ID with your face fully visible.');
      }

      // Detect face in selfie
      setFaceMatchStatus('Analyzing selfie biometric...');
      const selfieDetection = await detectFace(selfieImg, 'Selfie');

      if (!selfieDetection) {
        throw new Error('Could not detect your face in the captured photo. Please ensure good lighting and try again.');
      }

      setFaceMatchStatus('Comparing identities...');
      const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);
      const confidence = Math.max(0, Math.round((1 - distance) * 100));
      console.log(`[FaceMatch] ⚡ Distance: ${distance.toFixed(4)}, Confidence: ${confidence}%`);

      // Threshold: 0.65 — slightly more permissive for mobile front cameras
      if (distance > 0.65) {
        throw new Error(`Face does not match the attached ID document.`);
      }

      setFaceMatchResult('pass');
      closeWebCamera();
      return true;
    } catch (err) {
      console.error('Biometric match error:', err);
      setFaceMatchResult('fail');
      setFaceMatchError(err.message || 'Face matching failed. Please try again.');
      return false;
    } finally {
      setIsMatchingFace(false);
    }
  };

  const closeWebCamera = () => {
    setShowWebCamera(false);
    setIsFaceCentered(false);
    setFrozenFrame(null);
  };

  // Helper: Normalize text for OCR comparison
  // Helper: Normalize text for OCR comparison
  const normalize = (str, keepSpaces = false) => {
    if (!str) return "";
    let n = str.toLowerCase()
      .trim()
      .replace(/[0o]/g, 'o')
      .replace(/[1il|]/g, 'i')
      .replace(/[5s]/g, 's')
      .replace(/[8b]/g, 'b');

    if (keepSpaces) {
      return n.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    }
    return n.replace(/[^a-z0-9]/g, '');
  };

  // Helper: Perform the actual matching logic (Reusable)
  const validateMatch = (ocrText, values) => {
    if (!ocrText) return { pass: null, error: "" };

    // Get both a global string and a word list for flexible matching
    const normOcrGlobal = normalize(ocrText);
    const normOcrSpaced = normalize(ocrText, true);
    const ocrWords = normOcrSpaced.split(' ').filter(w => w.length >= 3);

    const firstNameParts = [];
    const lastNameParts = [];
    let targetBirthdate = null;

    // Helper: Split name into parts safely
    const splitName = (name) => {
      if (!name) return [];
      return name.split(/[\s,.-]+/).filter(p => p.length >= 2);
    };

    // Use dynamic form values with robust label matching
    formSections.forEach(section => {
      section.fields.forEach(field => {
        const value = values[field.id] || values[field.label];
        if (!value || typeof value !== 'string') return;

        const lowLabel = field.label.toLowerCase();

        if (lowLabel.includes('first') || lowLabel.includes('given')) {
          firstNameParts.push(...splitName(value));
        } else if (lowLabel.includes('last') || lowLabel.includes('surname') || lowLabel.includes('family')) {
          lastNameParts.push(...splitName(value));
        } else if (lowLabel.includes('name')) {
          const parts = splitName(value);
          if (parts.length >= 2) {
            firstNameParts.push(parts[0]);
            lastNameParts.push(parts[parts.length - 1]);
          } else {
            firstNameParts.push(...parts);
          }
        } else if (lowLabel.includes('birth') || lowLabel.includes('date')) {
          targetBirthdate = value;
        }
      });
    });

    // Fuzzy Match Helper
    const isNameMatch = (target) => {
      const normTarget = normalize(target);
      if (normTarget.length < 3) return false;

      // 1. Check if the target is exactly inside the global OCR string
      if (normOcrGlobal.includes(normTarget)) return true;

      // 2. Fuzzy word-by-word matching (Levenshtein)
      return ocrWords.some(word => {
        // For short names, allow 0 errors. For 5+, allow 1. For 9+, allow 2.
        const maxErrors = normTarget.length > 8 ? 2 : (normTarget.length >= 5 ? 1 : 0);
        const dist = levenshtein(normTarget, word);
        return dist <= maxErrors;
      });
    };

    // Simple Levenshtein Implementation
    function levenshtein(a, b) {
      const d = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) d[i][0] = i;
      for (let j = 0; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
      }
      return d[a.length][b.length];
    }

    const firstNameMatch = firstNameParts.length > 0 && firstNameParts.some(p => isNameMatch(p));
    const lastNameMatch = lastNameParts.length > 0 && lastNameParts.some(p => isNameMatch(p));

    let dobMatch = true;
    if (targetBirthdate) {
      const dateParts = targetBirthdate.split(/[-/]/);
      const year = dateParts.find(p => p.length === 4);
      const yearFound = year && normOcrGlobal.includes(normalize(year));
      dobMatch = !!yearFound; // Focus on year match for DOB to be less strict
    }

    // FINAL VALIDATION: Name and Last Name are mandatory
    if (firstNameMatch && lastNameMatch) {
      return {
        pass: 'pass',
        error: !dobMatch && targetBirthdate ? "Name matched. (Note: Birthdate year mismatch or unreadable)" : ""
      };
    } else {
      let msg = "The first name and last name on your ID do not match your profile.";
      if (!firstNameMatch && firstNameParts.length > 0) msg += " First name on the ID could not be verified.";
      if (!lastNameMatch && lastNameParts.length > 0) msg += " Last name on the ID could not be verified.";
      return { pass: 'fail', error: msg };
    }
  };

  // Re-validate name on ID when profile fields change
  useEffect(() => {
    if (lastExtractedText && !isScanningDoc) {
      const { pass, error } = validateMatch(lastExtractedText, dynamicValues);
      setScanMatchResult(pass);
      setScanMatchError(error);
      if (pass !== 'pass') {
        setFaceMatchResult(null);
        setFaceMatchError('');
      }
    }
  }, [dynamicValues, lastExtractedText, isScanningDoc]);

  const handleOcrScan = async (fileData) => {
    if (!fileData) return;
    setIsScanningDoc(true);
    setOcrProgress(0);
    setScanMatchResult(null);
    setScanMatchError("");
    setFaceMatchResult(null);
    setFaceMatchError("");

    const progressTimer = setInterval(() => {
      setOcrProgress(prev => (prev >= 90 ? prev : prev + 10));
    }, 300);

    try {
      const result = await Tesseract.recognize(fileData, 'eng');
      clearInterval(progressTimer);
      setOcrProgress(100);
      const extractedText = result.data.text;
      setLastExtractedText(extractedText);
      const { pass, error } = validateMatch(extractedText, dynamicValues);
      setScanMatchResult(pass);
      setScanMatchError(error || "");
    } catch (err) {
      console.error("OCR Error:", err);
      setScanMatchResult('fail');
      setScanMatchError("Failed to read document text. Please ensure the photo is clear.");
    } finally {
      clearInterval(progressTimer);
      setIsScanningDoc(false);
    }
  };

  const startFaceDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const result = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 }))
          .withFaceLandmarks(true);

        if (result) {
          const box = result.detection.box;
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;

          if (videoWidth > 0 && videoHeight > 0) {
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const roiX = videoWidth * 0.25; // Smaller margin = larger ROI
            const roiY = videoHeight * 0.22;
            const tooFarLeft = faceCenterX < (roiX - 20);
            const tooFarRight = faceCenterX > (videoWidth - roiX + 20);
            const tooHigh = faceCenterY < (roiY - 20);
            const tooLow = faceCenterY > (videoHeight - roiY + 20);
            const tooSmall = box.width < (videoWidth * 0.15); 
            const tooLarge = box.width > (videoWidth * 0.75);

            let hint = 'Perfect! Hold still';
            let centered = true;
            if (tooSmall) { hint = 'Move Closer'; centered = false; }
            else if (tooLarge) { hint = 'Too Close'; centered = false; }
            else if (tooFarLeft) { hint = 'Move Right →'; centered = false; }
            else if (tooFarRight) { hint = '← Move Left'; centered = false; }
            else if (tooHigh) { hint = 'Move Down ↓'; centered = false; }
            else if (tooLow) { hint = 'Move Up ↑'; centered = false; }

            setFacePositionHint(hint);
            setIsFaceCentered(centered);

            // ── LIVENESS CHALLENGE ENGINE ──────────────────────────────
            const ls = livenessRef.current;
            if (centered && ls.challengeIndex < CHALLENGES.length) {
              const challenge = CHALLENGES[ls.challengeIndex];
              const noseTip = result.landmarks.getNose()[3]; // nose tip (pt 30)
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
                    setLivenessProgress(100);
                    setLivenessPhase('success');
                    setLivenessInstruction('Liveness Verified!');
                    stopFaceDetectionLoop();
                    // Freeze the current video frame
                    try {
                      const video = videoRef.current;
                      if (video) {
                        const fc = document.createElement('canvas');
                        fc.width = video.videoWidth;
                        fc.height = video.videoHeight;
                        const fctx = fc.getContext('2d');
                        fctx.translate(fc.width, 0);
                        fctx.scale(-1, 1);
                        fctx.drawImage(video, 0, 0, fc.width, fc.height);
                        setFrozenFrame(fc.toDataURL('image/jpeg'));
                      }
                    } catch (e) { console.error('Freeze frame error:', e); }
                    return;
                  }
                }
              } else {
                ls.holdFrames = Math.max(0, ls.holdFrames - 1);
                setLivenessProgress(Math.round(((ls.accumulated + ls.holdFrames) / TOTAL_FRAMES) * 100));
              }
            } else if (!centered) {
              setLivenessInstruction('Position your face in the frame');
            }
          }
        } else {
          setIsFaceCentered(false);
          setFacePositionHint('Searching for face...');
          setLivenessInstruction('Position your face in the frame');
        }
      } catch (err) {
        console.error('Detection loop error:', err);
      }

      if (showWebCamera) {
        detectionRef.current = requestAnimationFrame(detect);
      }
    };
    detect();
  };

  const stopFaceDetectionLoop = () => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
  };

  // Redirect if not logged in or if already completed
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user?.attributes?.is_profile_complete || user?.attributes?.kyc_pipeline_passed) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // AUTOMATIC FACE MATCH TRIGGER
  useEffect(() => {
    if (livenessPhase === 'success' && frozenFrame) {
      console.log('[Liveness] Success detected! Triggering automatic face match...');
      // Small delay to let user see 'Liveness Verified!' message
      const timer = setTimeout(() => {
        captureWebPhoto();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [livenessPhase, frozenFrame]);

  // Fetch Dynamic Form when role is resolved (post-login)
  useEffect(() => {
    if (user?.role_context) {
      const fetchForm = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/forms/${user.role_context}`);
          if (res.ok) {
            const data = await res.json();
            setFormSections(data);
          }
        } catch (err) {
          console.error("Failed to fetch form:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchForm();
    } else {
      setLoading(false);
    }
  }, [user?.role_context]);

  const handleManualRoleSelect = async (roleName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_context: roleName })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem("regisSys_user", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Manual role select failed", err);
    }
  };


  const renderInput = (field) => {
    const displayLabel = field.label;
    const baseClasses = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-[#1a234b] outline-none appearance-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-400";

    const handleValueChange = (e) => {
      setDynamicValues({ ...dynamicValues, [field.id]: e.target.value });
      if (errors[field.id]) setErrors({ ...errors, [field.id]: null });
    };

    const lowLabel = displayLabel.toLowerCase();
    const type = (field.type || "").toLowerCase();

    // Specialized Phone Input with Flags
    const isPhoneNumber = lowLabel.includes("phone") || lowLabel.includes("mobile") || lowLabel.includes("hotline") || type === "tel";

    if (isPhoneNumber) {
      const fullValue = dynamicValues[field.id] || "";
      const parts = fullValue.split(' ');
      const countryCode = parts.length > 1 ? parts[0] : '+63';
      const number = parts.length > 1 ? parts.slice(1).join(' ') : (fullValue.startsWith('+') ? "" : fullValue);

      return (
        <div className={`flex items-center ${baseClasses} !p-0 ${errors[field.id] ? 'border-red-500 bg-red-50/10' : ''}`}>
          <CountryCodeSelector
            value={countryCode}
            onChange={(code) => {
              setDynamicValues({ ...dynamicValues, [field.id]: `${code} ${number}` });
              if (errors[field.id]) setErrors({ ...errors, [field.id]: null });
            }}
          />
          <input
            type="tel"
            placeholder={field.placeholder || "917 123 4567"}
            value={number}
            onChange={(e) => {
              setDynamicValues({ ...dynamicValues, [field.id]: `${countryCode} ${e.target.value}` });
              if (errors[field.id]) setErrors({ ...errors, [field.id]: null });
            }}
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-semibold text-[#1a234b] placeholder:text-slate-400"
          />
        </div>
      );
    }

    // Specialized Dropdowns matching Form Designer
    if (["gender", "status", "country", "yearlevel", "yearlevel"].some(t => t.toLowerCase() === type)) {
      const options = {
        gender: ["Male", "Female", "Other"],
        status: ["Single", "Married", "Divorced", "Widowed"],
        yearlevel: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"],
        country: [
          "Philippines", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
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
          "Paraguay", "Peru", "Poland", "Portugal", "Qatar", "Romania",
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

      const optionKey = type === "yearlevel" || type === "yearlevel" ? "yearlevel" : type;

      return (
        <div className="relative group/select">
          <select
            className={`${baseClasses} ${errors[field.id] ? 'border-red-500 bg-red-50/10' : ''} cursor-pointer hover:border-blue-400 pr-10`}
            value={dynamicValues[field.id] || ""}
            onChange={handleValueChange}
          >
            <option value="" disabled>Select {displayLabel}</option>
            {options[optionKey].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      );
    }

    if (type === "date") {
      return (
        <div className="relative group/date">
          <input
            type="date"
            className={`${baseClasses} ${errors[field.id] ? 'border-red-500 bg-red-50/10' : ''} cursor-pointer hover:border-blue-400`}
            value={dynamicValues[field.id] || ""}
            onChange={handleValueChange}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/date:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
      );
    }

    if (type === "image" || type === "file") {
      return (
        <div className="space-y-2">
          <input
            type="file"
            accept={type === "image" ? "image/*" : "*/*"}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (type === "image") {
                    setCropImageSrc(reader.result);
                    setCropTargetField(field.label);
                    setCropModalOpen(true);
                  } else {
                    setDynamicValues(prev => ({ ...prev, [field.id]: reader.result }));
                    if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: null }));
                  }
                  e.target.value = null; // reset input
                };
                reader.readAsDataURL(file);
              }
            }}
            className="hidden"
            id={`file-${field.id}`}
          />
          <label
            htmlFor={`file-${field.id}`}
            className={`w-full min-h-[120px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 transition-all overflow-hidden ${dynamicValues[field.label] ? 'border-blue-600 bg-blue-50/50' : ''}`}
          >
            {dynamicValues[field.id] ? (
              type === "image" ? (
                <div className="relative w-full h-full min-h-[120px]">
                  <img src={dynamicValues[field.id]} alt="Preview" className="w-full h-32 object-contain" />
                  <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="bg-white px-3 py-1 rounded-full text-[8px] font-black text-blue-600 shadow-sm">Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 p-4">
                  <BadgeCheck className="w-8 h-8 text-blue-600" />
                  <span className="text-[10px] font-black text-[#1a234b]">File Attached</span>
                  <span className="text-[8px] font-bold text-slate-400">Click to replace</span>
                </div>
              )
            ) : (
              <>
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                  {type === "image" ? <Eye className="w-5 h-5 text-blue-600" /> : <ShieldCheck className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#1a234b]">Upload {displayLabel}</p>
                  <p className="text-[8px] font-bold text-slate-400">Tap to browse files</p>
                </div>
              </>
            )}
          </label>
        </div>
      );
    }

    return (
      <input
        type={type === "num" || type === "number" ? "number" : type === "email" ? "email" : "text"}
        className={`${baseClasses} ${errors[field.id] ? 'border-red-500 bg-red-50/10' : ''}`}
        placeholder={field.placeholder || `Enter ${displayLabel}`}
        value={dynamicValues[field.id] || ""}
        onChange={handleValueChange}
      />
    );
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const fieldIsMiddleName = (label) => {
    const low = label.toLowerCase();
    return low.includes('middle') && low.includes('name');
  };

  const fieldIsSuffix = (label) => label.toLowerCase() === 'suffix';

  const handleBack = () => {
    window.scrollTo(0, 0);
    if (currentStep?.type === 'verify' && kycSubStep === 2) {
      setKycSubStep(1);
      return;
    }
    setActiveStepIndex(prev => Math.max(0, prev - 1));
  };

  const proceedToSelfieVerification = () => {
    if (!kycDocType) { setKycDocTypeError(true); return; }
    if (!kycFile) { setKycFileError(true); return; }
    if (scanMatchResult !== 'pass') {
      setScanMatchError('The first name and last name on your ID must match your profile before continuing.');
      return;
    }
    setKycSubStep(2);
    window.scrollTo(0, 0);
  };

  const proceedToLoginCredentials = async () => {
    if (!kycFile || scanMatchResult !== 'pass') {
      setScanMatchError('Please upload and verify your ID first.');
      setKycSubStep(1);
      return;
    }
    if (!selfieFile) {
      setSelfieError(true);
      return;
    }
    if (faceMatchResult !== 'pass') {
      const matched = await handleFaceMatch(selfieFile);
      if (!matched) return;
    }
    await runKycSecurityPipeline();
  };

  const handleNext = () => {
    const currentStep = steps[activeStepIndex];
    const newErrors = {};

    if (currentStep.type === 'dynamic') {
      const section = currentStep.section;
      if (isAddressSection(section.title)) {
        const requiredAddressFields = ["Country", "Province", "City / Municipality", "Zip Code", "Street Name"];
        requiredAddressFields.forEach(f => {
          // Only check this specific field — do NOT fall back to other address fields
          const val = dynamicValues[f]
            || dynamicValues[f.toLowerCase()]
            || dynamicValues[f.replace(/\//g, ' ').replace(/\s+/g, ' ').trim()];

          if (!val || (typeof val === 'string' && val.trim() === "")) {
            newErrors[f] = `${f} is required`;
          }
        });
      } else {
        section.fields.forEach(f => {
          if (f.required) {
            const val = dynamicValues[f.id] || dynamicValues[f.label];
            const isHidden = (fieldIsMiddleName(f.label) && noMiddleName) || (fieldIsSuffix(f.label) && noSuffix);
            if (!isHidden && (!val || val === "")) {
              newErrors[f.id] = `${f.label} is required`;
            }
          }
        });
      }
    } else if (currentStep.type === 'security') {
      const email = (emailConfirm || "").trim().toLowerCase();
      const accountEmail = (user?.email || "").trim().toLowerCase();
      if (!email) newErrors.email = "Email address is required";
      else if (email !== accountEmail) newErrors.email = "Email address does not match your account";
      if (!password) newErrors.password = "Account password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field with an error so the user sees the red indicators
      setTimeout(() => {
        const firstErrorKey = Object.keys(newErrors)[0];
        const el = document.getElementById(`input-group-${firstErrorKey}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setErrors({});
    window.scrollTo(0, 0);

    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const buildFinalAttributes = () => {
    const finalAttributes = { ...(user?.attributes || {}) };
    formSections.forEach(section => {
      section.fields.forEach(f => {
        const val =
          dynamicValues[f.id] ??
          dynamicValues[f.label] ??
          resolveAttributeValue(dynamicValues, f.label);
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          finalAttributes[f.label] = val;
        }
      });
    });
    return finalAttributes;
  };

  const runKycSecurityPipeline = async () => {
    if (kycVerificationComplete) {
      handleNext();
      return;
    }

    setKycPipelineActive(true);
    setKycPipelineResult(null);
    setKycPipelineError('');

    try {
      setKycPipelineError('Analyzing Biometrics...');
      await sleep(1500);

      if (faceMatchResult !== 'pass') {
        throw new Error("Identity Mismatch: Your selfie does not match the document photo.");
      }

      setKycPipelineError('Matching Profile Data...');
      await sleep(2000);

      if (scanMatchResult !== 'pass') {
        throw new Error("Identity Mismatch: Please make sure the document is truly yours.");
      }

      setKycPipelineError('Handshaking Server...');
      await sleep(1500);

      const latestUser = JSON.parse(localStorage.getItem('regisSys_user') || '{}');
      const targetId = latestUser.id || user.id;

      const payload = {
        role_context: user.role_context,
        attributes: {
          ...buildFinalAttributes(),
          kyc_document: kycFile,
          selfie_document: selfieFile,
          kyc_pipeline_passed: true,
        }
      };

      const res = await fetch(`${API_BASE_URL}/users/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Server validation failed. Please check your documents.');
      }

      const updatedUser = await res.json();
      localStorage.setItem('regisSys_user', JSON.stringify(updatedUser));
      setKycPipelineResult('pass');
      setKycVerificationComplete(true);
      await sleep(1200);
      setKycPipelineActive(false);
      window.scrollTo(0, 0);
      handleNext();
    } catch (err) {
      console.error('KYC pipeline error:', err);
      setKycPipelineResult('fail');
      setKycPipelineError(err.message || 'Verification could not be completed.');
    }
  };

  const validateCredentialsOnSubmit = () => {
    const email = (emailConfirm || "").trim();
    const accountEmail = (user?.email || "").trim();
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email address is required";
    } else if (email.toLowerCase() !== accountEmail.toLowerCase()) {
      newErrors.email = "Email address does not match your account";
    }

    if (!password) {
      newErrors.password = "Account password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const verifyAccountCredentials = async () => {
    const accountEmail = (user?.email || "").trim();

    const loginRes = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: accountEmail, password })
    });

    if (!loginRes.ok) {
      setErrors({ password: "Password does not match your account" });
      return false;
    }

    const loginData = await loginRes.json().catch(() => ({}));
    if (loginData.user?.id && loginData.user.id !== user.id) {
      setErrors({ email: "Email address does not match your account" });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!kycVerificationComplete) {
      alert('Please complete AI Document Verification after your selfie before continuing.');
      setActiveStepIndex(steps.findIndex(s => s.type === 'verify'));
      setKycSubStep(2);
      return;
    }

    if (!validateCredentialsOnSubmit()) {
      return;
    }

    setIsVerifying(true);
    try {
      const credentialsOk = await verifyAccountCredentials();
      if (!credentialsOk) return;

      const latestUser = JSON.parse(localStorage.getItem('regisSys_user') || '{}');
      const targetId = latestUser.id || user.id;

      const payload = {
        role_context: user.role_context,
        status: 'verified',
        attributes: {
          ...buildFinalAttributes(),
          kyc_document: kycFile,
          selfie_document: selfieFile,
          kyc_pipeline_passed: true,
          is_profile_complete: true,
          completed_at: new Date().toISOString()
        }
      };

      const res = await fetch(`${API_BASE_URL}/users/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setGeneratedId(updatedUser.external_id);
        localStorage.setItem('regisSys_user', JSON.stringify(updatedUser));
        setIsSuccess(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Could not complete registration.');
      }
    } catch (err) {
      console.error('Registration finalize error:', err);
      alert(err.message || 'Could not complete registration.');
    } finally {
      setIsVerifying(false);
    }
  };
  const resetKycPipeline = () => {
    setKycPipelineActive(false);
    setKycPipelineResult(null);
    setKycPipelineError('');
    setKycVerificationComplete(false);
    setSelfieFile(null);
    setSelfieError(false);
    setKycSubStep(2);
  };


  const handleSkip = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#1a234b] animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm relative text-center border border-slate-100">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#76d246] rounded-full flex items-center justify-center shadow-xl border-[6px] border-[#f8fafc]">
            <Check className="w-12 h-12 text-white stroke-[4px]" />
          </div>
          <div className="mt-8 space-y-4">
            <h2 className="text-3xl font-black text-[#1a234b] tracking-tighter">Congratulations!</h2>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              You have been successfully verified. Your details are now securely stored in our system.
            </p>
            {generatedId && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6">
                <span className="text-[10px] font-black text-slate-400 tracking-widest block mb-1">Your Unique ID Number</span>
                <span className="text-lg font-black text-[#1a234b] tracking-[4px]">{generatedId}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-10 w-full py-5 rounded-2xl bg-[#76d246] text-white font-black text-sm shadow-[0_10px_25px_rgba(118,210,70,0.3)] hover:bg-[#68bd3d] transition-all active:scale-95 uppercase tracking-widest"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans overflow-hidden">

      <ProgressTracker steps={steps} activeIndex={activeStepIndex} />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto w-full">

          {/* DYNAMIC SECTION STEPS */}
          {currentStep?.type === 'dynamic' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
              <div className="mb-8 text-center md:text-left">
                <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto md:ml-0 mb-4" />
                <h2 className="text-2xl font-black text-[#1a234b] tracking-tighter leading-none mb-3">{currentStep.title}</h2>
                <p className="text-slate-400 text-xs font-bold">Provide your {currentStep.title.toLowerCase()} for the registration</p>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(26,35,75,0.08)] border border-slate-100 p-6">
                <SectionHeader title={currentStep.title} />
                {isAddressSection(currentStep.title) ? (
                  <AddressForm
                    values={dynamicValues}
                    errors={errors}
                    visibleFields={currentStep.section.fields}
                    onChange={(f, v) => {
                      setDynamicValues(prev => ({ ...prev, [f]: v }));
                      if (errors[f]) setErrors(prev => ({ ...prev, [f]: null }));
                    }}
                  />
                ) : (
                  <div className={getSectionGridClass()}>
                    {currentStep.section.fields.map(field => {
                      const isHidden = (fieldIsMiddleName(field.label) && noMiddleName) || (fieldIsSuffix(field.label) && noSuffix);
                      return (
                        <div key={field.id} className={getFieldSpan(field.label, field.type)}>
                          <InputGroup
                            label={field.label}
                            required={!isHidden && field.required}
                            error={!isHidden ? (errors[field.id] || errors[field.label]) : null}
                            hideStatus={isHidden}
                          >
                            {isHidden ? (
                              <div className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-semibold text-slate-300 select-none">
                                N/A
                              </div>
                            ) : (
                              renderInput(field)
                            )}
                            {fieldIsMiddleName(field.label) && (
                              <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none group">
                                <input
                                  type="checkbox"
                                  checked={noMiddleName}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setNoMiddleName(val);
                                    localStorage.setItem('regisSys_noMiddleName', JSON.stringify(val));
                                    if (val) {
                                      setDynamicValues(prev => ({ ...prev, [field.id]: 'N/A' }));
                                      setErrors(prev => ({ ...prev, [field.id]: null }));
                                    } else {
                                      setDynamicValues(prev => ({ ...prev, [field.id]: '' }));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">I don't have a middle name</span>
                              </label>
                            )}
                            {fieldIsSuffix(field.label) && (
                              <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none group">
                                <input
                                  type="checkbox"
                                  checked={noSuffix}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setNoSuffix(val);
                                    localStorage.setItem('regisSys_noSuffix', JSON.stringify(val));
                                    if (val) {
                                      setDynamicValues(prev => ({ ...prev, [field.id]: 'N/A' }));
                                      setErrors(prev => ({ ...prev, [field.id]: null }));
                                    } else {
                                      setDynamicValues(prev => ({ ...prev, [field.id]: '' }));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">I don't have a suffix</span>
                              </label>
                            )}
                          </InputGroup>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                {activeStepIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-4 bg-white border border-slate-200 text-[#1a234b] rounded-2xl font-black text-[10px] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-[#1a234b] text-white rounded-2xl font-black text-[10px] hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/10 active:scale-95 flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SUMMARY STEP */}
          {currentStep?.type === 'summary' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-8 text-center md:text-left">
                <div className="h-1.5 w-12 bg-emerald-600 rounded-full mx-auto md:ml-0 mb-6" />
                <h2 className="text-2xl font-black text-[#1a234b] tracking-tighter leading-none mb-3">Review Your Information</h2>
                <p className="text-slate-400 text-xs font-bold">Please double check your details before proceeding to security setup</p>
              </div>

              <SummaryView sections={formSections} values={dynamicValues} />

              <div className="flex gap-4 mt-12">
                <button
                  onClick={handleBack}
                  className="flex-1 py-4 bg-white border border-slate-200 text-[#1a234b] rounded-2xl font-black text-[10px] hover:bg-slate-50 transition-all"
                >
                  Back to Form
                </button>
                <button
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-[#1a234b] text-white rounded-2xl font-black text-[10px] hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
                >
                  Looks Good, Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOGIN CREDENTIALS (SECURITY) */}
          {currentStep?.type === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(26,35,75,0.08)] border border-slate-100 p-10">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-[#f1f4ff] rounded-[22px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-50/50">
                    <Lock className="w-8 h-8 text-[#1a234b]" strokeWidth={1.5} />
                  </div>
                  <h1 className="text-2xl font-black text-[#1a234b] tracking-tight mb-2">Login Credentials</h1>
                  <p className="text-sm font-medium text-slate-400">Enter the email and password for your account</p>
                </div>

                <div id="login-credentials-form" className="space-y-6 max-w-md mx-auto">
                  <InputGroup label="Email Address" required hideStatus error={errors.email}>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="Enter your account email"
                        value={emailConfirm}
                        onChange={(e) => {
                          setEmailConfirm(e.target.value);
                          if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                        }}
                        autoComplete="email"
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-[#1a234b] transition-all ${errors.email ? 'border-red-400' : 'border-slate-100'}`}
                      />
                    </div>
                  </InputGroup>

                  <InputGroup label="Account Password" required hideStatus error={errors.password}>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a234b] transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                        }}
                        placeholder="Enter your account password"
                        autoComplete="current-password"
                        className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-[#1a234b] transition-all text-sm font-bold ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </InputGroup>
                </div>

                <div className="mt-14 flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button onClick={handleBack} className="px-8 py-5 rounded-2xl border border-slate-200 text-[#1a234b] font-black text-[10px]">Back</button>
                    <button
                      onClick={handleSubmit}
                      disabled={isVerifying}
                      className="flex-1 py-5 bg-[#1a234b] text-white rounded-2xl font-black text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Finish Registration
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="w-full py-4 text-slate-400 text-[11px] font-black hover:text-[#1a234b] transition-colors text-center"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION */}
          {currentStep?.type === 'verify' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in-95 duration-700">
                  <div className="bg-white rounded-[40px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm relative text-center border border-slate-100">
                    {/* Top Overlapping Icon */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#76d246] rounded-full flex items-center justify-center shadow-xl border-[6px] border-[#f8fafc]">
                      <Check className="w-12 h-12 text-white stroke-[4px]" />
                    </div>

                    <div className="mt-8 space-y-4">
                      <h2 className="text-3xl font-black text-[#1a234b] tracking-tighter">Congratulations!</h2>
                      <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                        You have been successfully verified. Your details are now securely stored in our system.
                      </p>

                      {generatedId && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-6">
                          <span className="text-[10px] font-black text-slate-400  tracking-widest block mb-1">Your Unique ID Number</span>
                          <span className="text-lg font-black text-[#1a234b] tracking-[4px]">{generatedId}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate("/dashboard")}
                      className="mt-10 w-full py-5 rounded-2xl bg-[#76d246] text-white font-black text-sm shadow-[0_10px_25px_rgba(118,210,70,0.3)] hover:bg-[#68bd3d] transition-all active:scale-95 uppercase tracking-widest"
                    >
                      OK
                    </button>
                  </div>
                </div>
              ) : kycSubStep === 1 ? (
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 text-center">
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-[#1a234b] p-4 rounded-3xl shadow-xl shadow-blue-950/20 mb-6">
                      <IdCard className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1a234b] tracking-tighter">Attach Government ID</h2>
                    <p className="text-[9px] font-black text-slate-500 mb-2">Step 1 of 2 — Scan &amp; match your name on the ID</p>
                  </div>

                  {/* Instructions */}
                  <div className="w-full bg-blue-50 rounded-[20px] p-4 mb-5 border border-blue-100 text-left">
                    <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-3">📋 Before You Upload</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { ok: true, text: 'Upload your own valid government ID' },
                        { ok: true, text: 'All four corners of the ID must be visible' },
                        { ok: true, text: 'We scan the ID and match first name & last name to your profile' },
                        { ok: true, text: 'After this step you will take a selfie to confirm the ID is yours' },
                        { ok: false, text: 'Cropped, edited, or photocopied IDs not accepted' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`text-sm mt-[-1px] ${item.ok ? 'text-green-500' : 'text-red-500'}`}>
                            {item.ok ? '✓' : '✗'}
                          </span>
                          <p className="text-[10px] text-slate-600 font-semibold">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Type Selector */}
                  <div className={`w-full mb-5 text-left rounded-2xl transition-all duration-300 ${kycDocTypeError ? 'bg-red-50 border border-red-300 p-3' : ''}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${kycDocTypeError ? 'text-red-500' : 'text-slate-500'}`}>
                      {kycDocTypeError ? '⚠ Please select an ID type first' : 'Select ID Type'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'passport', label: 'Passport' },
                        { key: 'drivers_license', label: "Driver's License" },
                        { key: 'philsys', label: 'PhilSys / National ID' },
                        { key: 'sss', label: 'SSS ID' },
                        { key: 'pagibig', label: 'Pag-IBIG ID' },
                        { key: 'philhealth', label: 'PhilHealth' },
                        { key: 'voters_id', label: "Voter's ID" },
                        { key: 'tin', label: 'TIN Card' },
                        { key: 'postal', label: 'Postal ID' },
                        { key: 'school_id', label: 'School ID' },
                        { key: 'company_id', label: 'Company ID' },
                        { key: 'other', label: 'Other' },
                      ].map((doc) => (
                        <button
                          key={doc.key}
                          type="button"
                          onClick={() => { setKycDocType(doc.key); setKycDocTypeError(false); }}
                          className={`py-1.5 px-3 rounded-2xl border text-[9px] font-black transition-all ${kycDocType === doc.key
                            ? 'bg-[#1a234b] border-[#1a234b] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#1a234b] hover:text-[#1a234b]'
                            }`}
                        >
                          {doc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ID Upload */}
                  <div
                    onClick={() => { if (!kycDocType) setKycDocTypeError(true); }}
                    className={`rounded-[32px] border-3 border-dashed transition-all duration-700 flex flex-col items-center justify-center relative overflow-hidden group mb-4
                        ${!kycDocType ? 'border-slate-200 bg-slate-100/60 opacity-60 cursor-not-allowed' :
                        kycFile ? 'border-indigo-400 bg-indigo-50/30' :
                          kycFileError ? 'border-red-400 bg-red-50/50' :
                            'border-slate-200 bg-slate-50/50 hover:bg-blue-50/10 hover:border-blue-400'
                      }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={!kycDocType}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          const fr = new FileReader();
                          fr.onload = () => {
                            setKycFile(fr.result);
                            setKycFileError(false);
                            setFaceMatchResult(null);
                            setFaceMatchError('');
                            handleOcrScan(fr.result);
                          };
                          fr.readAsDataURL(f);
                        }
                      }}
                      className={`absolute inset-0 w-full h-full opacity-0 z-10 ${kycDocType ? 'cursor-pointer' : 'cursor-not-allowed pointer-events-none'}`}
                    />

                    {isScanningDoc && (
                      <div className="absolute inset-0 z-30 bg-[#1a234b]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                          <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-[2px] animate-pulse">Matching name on ID to profile...</p>
                        <div className="mt-4 w-full max-w-[100px] h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                        </div>
                        <p className="mt-2 text-[8px] font-bold text-white/40">{ocrProgress}% Complete</p>
                      </div>
                    )}

                    {kycFile ? (
                      <div className="w-full relative">
                        <img src={kycFile} alt="ID Preview" className={`w-full h-44 object-contain rounded-[28px] p-2 transition-all ${isScanningDoc ? 'blur-[2px]' : ''}`} />

                        {!isScanningDoc && scanMatchResult === 'pass' && (
                          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black shadow-lg flex items-center gap-2 animate-in zoom-in-95 duration-500">
                            <BadgeCheck className="w-3.5 h-3.5" /> NAME MATCHED
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 rounded-[28px] flex items-center justify-center opacity-0 hover:opacity-100">
                          <span className="bg-white px-4 py-1.5 rounded-full text-[9px] font-black text-[#1a234b] shadow">Click to replace</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 p-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                          <Upload className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-sm font-black text-[#1a234b]">Upload Govt ID</p>
                        <p className="text-[10px] font-bold text-slate-400">Click to attach</p>
                      </div>
                    )}
                  </div>

                  {kycFile && !isScanningDoc && (
                    <div className={`mb-4 flex items-start gap-3 p-3 rounded-xl border text-left ${scanMatchResult === 'pass' ? 'bg-emerald-50 border-emerald-200' : scanMatchResult === 'fail' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      {scanMatchResult === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : scanMatchResult === 'fail' ? (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-[10px] font-black text-[#1a234b]">First name &amp; last name check</p>
                        <p className="text-[9px] font-semibold text-slate-500 mt-0.5">
                          {scanMatchResult === 'pass'
                            ? 'The name on your ID matches your registration profile.'
                            : scanMatchResult === 'fail'
                              ? (scanMatchError || 'Name on ID does not match your profile.')
                              : 'Verifying names on your ID...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={proceedToSelfieVerification}
                    disabled={isScanningDoc || scanMatchResult === 'fail' || scanMatchResult !== 'pass' || !kycFile}
                    className={`w-full py-5 rounded-3xl font-black text-[10px] shadow-2xl bg-[#1a234b] text-white flex items-center justify-center gap-3 hover:bg-blue-900 transition-all ${(isScanningDoc || scanMatchResult !== 'pass' || !kycFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isScanningDoc ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Selfie Verification <ArrowRight className="w-5 h-5" /></>}
                  </button>
                  <button onClick={handleBack} className="mt-6 text-slate-400 text-[10px] font-black hover:text-[#1a234b] transition-colors">Go Back</button>
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 text-center">
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-[#1a234b] p-4 rounded-3xl shadow-xl shadow-blue-950/20 mb-6">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1a234b] tracking-tighter">Selfie Verification</h2>
                    <p className="text-[9px] font-black text-slate-500 mb-2">Step 2 of 2 — Confirm the ID you uploaded is truly yours</p>
                  </div>

                  <div className="w-full bg-blue-50 rounded-[20px] p-4 mb-6 border border-blue-100 text-left">
                    <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-3">📸 Selfie Tips</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { ok: true, text: 'Your selfie will be compared to the photo on your uploaded ID' },
                        { ok: true, text: 'Face must be clearly visible and centered' },
                        { ok: true, text: 'Good lighting — remove sunglasses or hats' },
                        { ok: false, text: 'No filters, cropped or edited photos accepted' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`text-sm mt-[-1px] ${item.ok ? 'text-green-500' : 'text-red-500'}`}>
                            {item.ok ? '✓' : '✗'}
                          </span>
                          <p className="text-[10px] text-slate-600 font-semibold">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      if (!isVerifying && !isMatchingFace) {
                        setSelfieError(false);
                        startWebCamera();
                      }
                    }}
                    className={`min-h-[12rem] rounded-[32px] border-3 border-dashed transition-all duration-700 flex flex-col items-center justify-center p-4 relative overflow-hidden group mb-6 cursor-pointer
                        ${isVerifying || isMatchingFace ? 'border-blue-500 bg-blue-50/50'
                        : selfieFile && faceMatchResult === 'pass' ? 'border-green-500 bg-green-50'
                          : selfieFile && faceMatchResult === 'fail' ? 'border-red-500 bg-red-50'
                            : selfieError ? 'border-red-500 bg-red-50/50'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/10 hover:border-blue-400'}`}
                  >
                    {isVerifying || isMatchingFace ? (
                      <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative">
                          <div className="w-20 h-20 border-4 border-slate-100 rounded-full" />
                          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-black text-[#1a234b]">
                            {isMatchingFace ? 'Biometric Verification' : 'Processing...'}
                          </p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                            {isMatchingFace ? faceMatchStatus : 'Finalizing step...'}
                          </p>
                        </div>
                      </div>
                    ) : selfieFile ? (
                      <div className="w-full h-full relative flex flex-col items-center justify-center">
                        <img src={selfieFile} alt="Selfie" className="absolute inset-0 w-full h-full object-cover rounded-[28px] opacity-20" />
                        <div className="z-20 flex flex-col items-center gap-2">
                          <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 ${faceMatchResult === 'fail' ? 'border-red-500' : faceMatchResult === 'pass' ? 'border-emerald-500' : 'border-slate-300'}`}>
                            {faceMatchResult === 'fail' ? <XCircle className="w-12 h-12 text-red-500" /> : faceMatchResult === 'pass' ? <BadgeCheck className="w-12 h-12 text-emerald-500" /> : <Camera className="w-10 h-10 text-slate-400" />}
                          </div>
                          <p className={`text-sm font-black ${faceMatchResult === 'fail' ? 'text-red-600' : 'text-[#1a234b]'}`}>
                            {faceMatchResult === 'pass' ? 'ID Verified — Selfie Matches' : faceMatchResult === 'fail' ? 'Selfie Does Not Match ID' : (isMatchingFace ? faceMatchStatus : 'Selfie Captured — Verifying...')}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">Click to retake</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border-2 border-dashed border-slate-200 group-hover:scale-105 transition-transform">
                          <Camera className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-black text-[#1a234b]">Open Camera</p>
                        <p className="text-[10px] font-bold text-slate-400">Take a selfie to verify your ID</p>
                      </div>
                    )}
                  </div>

                  {faceMatchResult === 'fail' && !isMatchingFace && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-black text-red-600">{faceMatchError || 'Your selfie does not match the photo on your ID.'}</p>
                    </div>
                  )}

                  <button
                    onClick={proceedToLoginCredentials}
                    disabled={isVerifying || isMatchingFace || !selfieFile || faceMatchResult !== 'pass'}
                    className={`w-full py-5 rounded-3xl font-black text-[10px] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3
                        ${(isVerifying || isMatchingFace || !selfieFile || faceMatchResult !== 'pass') ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#1a234b] text-white shadow-blue-900/30'}`}
                  >
                    Start AI Document Verification <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => setKycSubStep(1)} disabled={isVerifying || isMatchingFace} className="mt-6 text-slate-400 text-[10px] font-black hover:text-[#1a234b] transition-colors">Back</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center bg-slate-50 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-300">Enterprise Identity Management</p>
      </footer>

      {/* ── ADVANCED KYC VERIFICATION PIPELINE MODAL ── */}
      {kycPipelineActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#070d1f]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-500 relative">

            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#1a234b] flex items-center justify-center shadow-lg shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1a234b] tracking-tight">AI Document Verification</h3>
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">KYC Security Pipeline</p>
                </div>
              </div>

              {/* FAIL STATE */}
              {kycPipelineResult === 'fail' && (
                <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-red-100">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h4 className="text-xl font-black text-[#1a234b] mb-2">Verification Failed</h4>
                  <p className="text-[10px] font-bold text-red-500 leading-relaxed mb-8 px-2">{kycPipelineError}</p>
                  <button
                    onClick={resetKycPipeline}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] tracking-widest uppercase shadow-lg hover:bg-red-600 transition-colors active:scale-95"
                  >
                    Retry Verification
                  </button>
                </div>
              )}

              {/* PASS STATE */}
              {kycPipelineResult === 'pass' && (
                <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                    <BadgeCheck className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-black text-[#1a234b] mb-2">Verification Complete!</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-4 px-2">All KYC checks passed. Taking you to login credentials...</p>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                </div>
              )}

              {/* PROCESSING STATE */}
              {kycPipelineResult === null && (
                <div className="py-12 text-center animate-in fade-in duration-700">
                  <div className="relative w-24 h-24 mx-auto mb-10">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-4 rounded-full bg-indigo-50 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-[#1a234b] mb-4">Verifying Identity</h4>

                  {ocrProgress < 100 ? (
                    <div className="space-y-4 px-6">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Scanning Document: {ocrProgress}%</p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                      <p className="text-[8px] font-medium text-slate-400 leading-relaxed italic">
                        Extracting text geometries for authentication...
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-400 px-6 leading-relaxed">
                      {kycPipelineError === 'Matching Profile Data...'
                        ? "Matching your government document details with your inputted profile information..."
                        : kycPipelineError === 'Analyzing Biometrics...'
                          ? "Comparing your identity document with your captured selfie..."
                          : "Our AI-powered security engine is currently validating your government documents and biometric data for authenticity."}
                    </p>
                  )}

                  <div className="mt-10 flex flex-col items-center gap-1.5">
                    <div className="text-[10px] font-black text-indigo-600 tracking-widest uppercase animate-pulse">
                      {ocrProgress < 100
                        ? "Analyzing Textures"
                        : (kycPipelineError === 'Matching Profile Data...'
                          ? "Identity Cross-Reference"
                          : (kycPipelineError === 'Analyzing Biometrics...'
                            ? "Biometric Security Check"
                            : "Running Security Checks"))}
                    </div>
                    <div className="text-[9px] font-bold text-slate-300">This usually takes less than 10 seconds</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showWebCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a234b]/95 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden max-w-lg w-full relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-black text-[#1a234b] uppercase tracking-tighter">Liveness Scan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anti-Spoofing Security Check</p>
              </div>
              <button onClick={closeWebCamera} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] ${frozenFrame ? 'hidden' : ''}`} />
              {frozenFrame && (
                <img src={frozenFrame} alt="Frozen capture" className="w-full h-full object-cover" />
              )}


              {/* ── BIOMETRIC MATCHING OVERLAY ── */}
              {isMatchingFace && (
                <div className="absolute inset-0 z-20 bg-[#1a234b]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                  <div className="w-20 h-20 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-4 bg-white/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-white mb-2">Verifying Identity</h4>
                  <p className="text-xs font-bold text-white/60 text-center leading-relaxed">Comparing document face with biometric signature...</p>
                </div>
              )}

              {/* ── SECURITY ERROR OVERLAY ── */}
              {faceMatchResult === 'fail' && !isMatchingFace && (
                <div className="absolute inset-0 z-20 bg-red-600/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-400">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-5 border-2 border-white/30">
                    <XCircle className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-lg font-black text-white mb-2 uppercase tracking-widest text-center">Identity Mismatch</h4>
                  <p className="text-[10px] font-bold text-white/90 leading-relaxed text-center mb-6 px-2">
                    {faceMatchError || 'The face does not match the uploaded document.'}
                  </p>
                  <button
                    onClick={() => {
                      setFaceMatchResult(null);
                      setFaceMatchError('');
                      setSelfieFile(null);
                      setLivenessProgress(0);
                      setLivenessPhase('idle');
                      setLivenessInstruction('Position your face in the frame');
                      setFrozenFrame(null);
                      livenessRef.current = { challengeIndex: 0, holdFrames: 0, accumulated: 0 };
                      startFaceDetectionLoop();
                    }}
                    className="w-full max-w-[220px] py-3 rounded-2xl bg-white text-red-600 font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-red-50 active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ── SVG FACE-SHAPED PROGRESS RING ── */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative" style={{ width: 220, height: 290 }}>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 290" fill="none">
                    {/* Track ring — face-shaped path (wider forehead, narrower chin) */}
                    <path
                      d="M 110 18
                         C 170 18, 206 72, 206 138
                         C 206 212, 164 272, 110 272
                         C 56 272, 14 212, 14 138
                         C 14 72, 50 18, 110 18 Z"
                      stroke={
                        livenessPhase === 'success' ? 'rgba(52,211,153,0.3)' :
                          isFaceCentered ? 'rgba(255,255,255,0.15)' :
                            'rgba(239,68,68,0.35)'
                      }
                      strokeWidth="5"
                      fill="none"
                      pathLength="100"
                      className="transition-all duration-300"
                    />
                    {/* Green progress fill — same face shape */}
                    <path
                      d="M 110 18
                         C 170 18, 206 72, 206 138
                         C 206 212, 164 272, 110 272
                         C 56 272, 14 212, 14 138
                         C 14 72, 50 18, 110 18 Z"
                      stroke="#22c55e"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - livenessProgress}
                      className="transition-all duration-200"
                      style={{ filter: livenessProgress > 0 ? 'drop-shadow(0 0 8px #22c55e)' : 'none' }}
                    />
                  </svg>

                  {/* ── SUCCESS CHECKMARK OVERLAY ── */}
                  {livenessPhase === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-500">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)]">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CHALLENGE INSTRUCTION + POSITION HINT ── */}
              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2.5">

                <div className={`backdrop-blur-md px-6 py-2.5 rounded-full border transition-all duration-300 shadow-lg ${livenessPhase === 'success' ? 'bg-emerald-500/90 border-emerald-400/60' :
                  isFaceCentered ? 'bg-black/50 border-white/20' :
                    'bg-red-600/80 border-red-400 shadow-red-900/40'
                  }`}>
                  <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">
                    {livenessPhase === 'success' ? '✓ Liveness Verified' :
                      isFaceCentered ? livenessInstruction : facePositionHint}
                  </p>
                </div>
                {isFaceCentered && livenessPhase === 'idle' && (
                  <p className="text-white/50 text-[9px] font-bold">Scanning automatically...</p>
                )}
              </div>
            </div>

            {/* ── BOTTOM PANEL ── */}
            <div className="p-6 bg-white flex flex-col items-center gap-3">
              {livenessPhase === 'success' ? (
                // OK button when liveness is complete
                <>
                  <p className="text-[9px] font-bold text-slate-400 text-center">Liveness confirmed. Press OK to capture your biometric photo and proceed.</p>
                  <button
                    onClick={() => captureWebPhoto(true)}
                    className="w-full py-4 mt-1 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    OK
                  </button>
                </>
              ) : (
                // Info panel during scanning
                <>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <p className="text-[10px] font-black text-[#1a234b] uppercase tracking-widest">Anti-Spoofing Active</p>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 text-center leading-relaxed max-w-xs">
                    Follow the on-screen instructions. The system scans automatically.
                  </p>

                </>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
      {/* ── PHOTO NORMALIZATION (CROPPER) MODAL ── */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4 bg-black/80 border-b border-white/10 z-10 backdrop-blur-md">
            <div>
              <h3 className="text-white font-black tracking-tight">Crop ID Photo</h3>
              <p className="text-slate-400 text-[10px] font-bold mt-0.5">Adjust the photo to fit your ID layout</p>
            </div>
            <button
              onClick={() => {
                setCropModalOpen(false);
                setCropImageSrc(null);
                setCropTargetField(null);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative bg-black/90 flex flex-col">
            <div className="flex-1 overflow-hidden relative">
              <Cropper
                src={cropImageSrc}
                style={{ height: "100%", width: "100%" }}
                initialAspectRatio={cropAspectRatio}
                aspectRatio={cropAspectRatio}
                guides={true}
                viewMode={1}
                dragMode="move"
                ref={cropperRef}
                background={false}
                responsive={true}
                autoCropArea={0.9}
                checkOrientation={false}
              />
            </div>

            {/* Controls */}
            <div className="p-6 bg-black/80 backdrop-blur-md border-t border-white/10 flex flex-col gap-5">
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setCropAspectRatio(3 / 4)}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${cropAspectRatio === 3 / 4 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  <div className="w-3 h-4 border-2 border-current rounded-sm"></div>
                  Portrait (3:4)
                </button>
                <button
                  onClick={() => setCropAspectRatio(1)}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${cropAspectRatio === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                  Square (1:1)
                </button>
              </div>

              <button
                onClick={() => {
                  if (typeof cropperRef.current?.cropper !== "undefined") {
                    const canvas = cropperRef.current?.cropper.getCroppedCanvas({
                      width: cropAspectRatio === 1 ? 600 : 600,
                      height: cropAspectRatio === 1 ? 600 : 800,
                      imageSmoothingEnabled: true,
                      imageSmoothingQuality: 'high',
                    });
                    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
                    setDynamicValues(prev => ({ ...prev, [cropTargetField]: croppedBase64 }));
                    if (errors[cropTargetField]) setErrors(prev => ({ ...prev, [cropTargetField]: null }));
                    setCropModalOpen(false);
                    setCropImageSrc(null);
                    setCropTargetField(null);
                  }
                }}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

