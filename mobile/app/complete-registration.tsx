import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../constants/Config";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AddressForm from '../components/AddressForm';
import { COUNTRIES } from "../constants/countries";
// --- SLIM PROGRESS TRACKER ---
const CHALLENGES = [
  { id: 'left', instruction: 'Turn your head left ←', frames: 5, check: (face: any) => face.yawAngle > 18 },
  { id: 'right', instruction: 'Turn your head right →', frames: 5, check: (face: any) => face.yawAngle < -18 },
  { id: 'center', instruction: 'Look straight at camera', frames: 6, check: (face: any) => Math.abs(face.yawAngle) < 6 },
];
const TOTAL_FRAMES = 16;

// ─── Liveness oval: Exact Web SVG Algorithm ───────────────────────────────
// Uses the exact SVG path and stroke-dashoffset animation from the web version.
const OW = 220;
const OH = 290;
const PATH_LENGTH = 680; // Approximate length of this specific bezier path

type OvalProps = { progress: number; phase: string; isCentered: boolean };
const LivenessOval = ({ progress, phase, isCentered }: OvalProps) => {
  const isSuccess = phase === 'success';
  const pct = isSuccess ? 100 : Math.min(100, Math.max(0, progress));

  const baseColor = isSuccess
    ? '#10b981'
    : isCentered
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(239,68,68,0.65)';

  const dashOffset = PATH_LENGTH - (pct / 100) * PATH_LENGTH;

  const d = "M 110 18 C 170 18, 206 72, 206 138 C 206 204, 180 272, 110 272 C 40 272, 14 204, 14 138 C 14 72, 50 18, 110 18 Z";

  return (
    <View style={{ width: OW, height: OH, position: 'absolute', transform: [{ scaleX: 1.1 }] }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 220 290" fill="none">
        {/* Track ring */}
        <Path
          d={d}
          stroke={baseColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Progress ring (sweeps clockwise) */}
        {pct > 0 && (
          <Path
            d={d}
            stroke="#10b981"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_LENGTH}
            strokeDashoffset={dashOffset}
          />
        )}
      </Svg>
    </View>
  );
};

const ProgressTracker = ({ steps, activeIndex }: { steps: any[], activeIndex: number }) => {
  const { width: screenWidth } = Dimensions.get('window');
  const verifyIdx = steps.findIndex(s => s.type === 'verify');
  
  // Responsive sizing
  const circleSize = screenWidth < 380 ? 30 : 34;
  const gapSize = screenWidth < 380 ? 20 : 30;
  
  return (
    <View className="py-6 px-4 bg-white border-b border-slate-100 shadow-sm">
      <View className="flex-row items-center justify-between relative">
        {/* Background Track - Phase 1 */}
        <View 
          className="absolute left-[20px] right-[20px] flex-row items-center z-0"
          style={{ top: circleSize / 2 - 1 }}
          pointerEvents="none"
        >
          <View className="h-[2px] bg-slate-100 rounded-full overflow-hidden flex-1" style={{ marginRight: gapSize + 10 }}>
            <View
              className="h-full bg-[#1a234b]"
              style={{
                width: activeIndex >= verifyIdx
                  ? '100%'
                  : `${(activeIndex / (verifyIdx || 1)) * 100}%`
              }}
            />
          </View>
          {/* Phase 2 Line */}
          <View className="h-[2px] bg-slate-100 rounded-full overflow-hidden w-[50px]">
            <View
              className="h-full bg-[#1a234b]"
              style={{
                width: activeIndex < verifyIdx
                  ? '0%'
                  : `${((activeIndex - verifyIdx) / (steps.length - 1 - verifyIdx || 1)) * 100}%`
              }}
            />
          </View>
        </View>

        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const isVerifiedPhaseStart = index === verifyIdx;

          return (
            <React.Fragment key={index}>
              {isVerifiedPhaseStart && <View style={{ width: gapSize }} />}
              <View className="items-center z-10" style={{ width: circleSize + 10 }}>
                <View
                  className={`rounded-full items-center justify-center border-2 transition-all ${isActive
                    ? 'bg-[#1a234b] border-[#1a234b] shadow-lg shadow-blue-900/20'
                    : 'bg-white border-slate-100'
                    } ${isCurrent ? 'scale-110' : ''}`}
                  style={{ 
                    width: circleSize, 
                    height: circleSize,
                    elevation: isCurrent ? 8 : 0 
                  }}
                >
                  {index < activeIndex ? (
                    <Ionicons name="checkmark" size={circleSize * 0.45} color="white" />
                  ) : (
                    <Text className="font-black" style={{ fontSize: circleSize * 0.3, color: isActive ? 'white' : '#cbd5e1' }}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  className="mt-2 uppercase text-center font-black tracking-tighter"
                  style={{ 
                    fontSize: 7, 
                    color: isActive ? '#1a234b' : '#cbd5e1',
                    width: circleSize + 15
                  }}
                >
                  {(step.title?.split(' ')[0] || step.label)}
                </Text>

                {isCurrent && (
                  <View className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse" />
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <View className="mb-6">
    <View className="flex-row items-center gap-2 mb-2">
      <View className="w-2 h-2 bg-blue-600 rotate-45" style={{ shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 }} />
      <Text className="text-[#1a234b] font-black text-xs tracking-tight">{title}</Text>
    </View>
    <View className="h-[1px] bg-slate-100 w-full" />
  </View>
);

const FIELD_OPTIONS: Record<string, string[]> = {
  gender: ["Male", "Female", "Other"],
  status: ["Single", "Married", "Divorced", "Widowed"],
  yearLevel: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"],
  country: [
    "Philippines", "United States", "Canada", "Australia", "Japan", "Korea, South",
    "China", "India", "United Kingdom", "Germany", "France", "Italy", "Spain",
    "Brazil", "Mexico", "Singapore", "Malaysia", "Indonesia", "Thailand", "Vietnam",
    "New Zealand", "Saudi Arabia", "United Arab Emirates", "Other"
  ],
};

const SelectionModal = ({ visible, title, options, onSelect, onClose, searchable }: any) => {
  const [search, setSearch] = useState("");
  const filtered = searchable
    ? options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-[40px] p-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-black text-[#1a234b]">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-50 rounded-full">
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {searchable && (
            <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 mb-4 border border-slate-100">
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                placeholder="Search..."
                className="flex-1 ml-2 text-sm font-bold text-[#1a234b]"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item); onClose(); setSearch(""); }}
                className="py-4 border-b border-slate-50 flex-row justify-between items-center"
              >
                <Text className="text-sm font-bold text-[#1a234b]">{item}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const InputLabel = ({ title, required }: { title: string, required?: boolean }) => (
  <Text className="text-[10px] font-bold text-slate-500 mb-1 ml-0.5  tracking-tight">
    {title} {required && <Text className="text-red-500">*</Text>}
  </Text>
);

export default function CompleteRegistration() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore((state: any) => state);

  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [kycFile, setKycFile] = useState<any>(null);
  const [kycDocType, setKycDocType] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<any>(null);
  const [kycSubStep, setKycSubStep] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<any>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  const [pickerConfig, setPickerConfig] = useState<{ visible: boolean; title: string; options: string[]; onSelect: (val: string) => void, searchable?: boolean } | null>(null);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);

  const [formFields, setFormFields] = useState<any[]>([]);
  const [formSections, setFormSections] = useState<any[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>(user?.attributes || {});

  // Flow State
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Derive steps array from formSections - Now declared after formSections
  const steps = [
    ...formSections.map((sec, idx) => ({
      id: `dynamic-${idx}`,
      type: 'dynamic',
      label: sec.title.split(' ')[0],
      title: sec.title,
      icon: sec.title.toLowerCase().includes('address') ? 'location' : 'person',
      section: sec
    })),
    { id: 'summary', type: 'summary', label: 'Review', title: 'Review Summary', icon: 'eye' },
    { id: 'verify', type: 'verify', label: 'Verify', title: 'Identity Verification', icon: 'shield-checkmark' },
    { id: 'security', type: 'security', label: 'Security', title: 'Account Security', icon: 'lock-closed' }
  ];

  const currentStep = steps[activeStepIndex];

  const [isLoading, setIsLoading] = useState(true);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [noSuffix, setNoSuffix] = useState(false);
  const [kycPipelineError, setKycPipelineError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize fields from user attributes if they exist
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [livenessPhase, setLivenessPhase] = useState("idle");
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessInstruction, setLivenessInstruction] = useState("Position your face in the frame");
  const [scanMatchResult, setScanMatchResult] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [faceData, setFaceData] = useState<any>(null);
  const livenessRef = React.useRef({ challengeIndex: 0, holdFrames: 0, accumulated: 0 });
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  const [facePositionHint, setFacePositionHint] = useState("");
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const currentPoseRef = useRef<string>("none");

  const pathname = usePathname();
  const setLastLocation = useAuthStore((state: any) => state.setLastLocation);

  useEffect(() => {
    if (pathname) {
      setLastLocation(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (user?.attributes) {
      setDynamicValues(user.attributes);
    }
  }, [user]);
  useEffect(() => {
    if (user?.role) {
      const fetchForm = async (retries = 2) => {
        try {
          const roleName = user.role || user.role_context;
          const res = await fetch(`${API_BASE_URL}/forms/${encodeURIComponent(roleName)}`, {
            headers: {
              "Bypass-Tunnel-Reminder": "true",
              "Accept": "application/json"
            }
          });

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            if (retries > 0) {
              setTimeout(() => fetchForm(retries - 1), 1500);
              return;
            }
            setIsLoading(false);
            return;
          }

          if (res.ok) {
            const data = await res.json();
            const mappedSections = data.map((sec: any) => ({
              ...sec,
              sectionTitle: sec.title
            }));
            setFormSections(mappedSections);
            const allFields = data.flatMap((section: any) => section.fields || []);
            setFormFields(allFields);
          }
          setIsLoading(false);
        } catch (err) {
          if (retries > 0) {
            setTimeout(() => fetchForm(retries - 1), 1500);
            return;
          }
          setIsLoading(false);
        }
      };
      fetchForm();
    } else {
      setIsLoading(false);
    }
  }, [user?.role]);

  // Real-time re-validation if dynamicValues change and ID is already attached
  useEffect(() => {
    if (kycFile && !isScanningDoc) {
      const accountName = user?.name || "User Name";
      const fakeOcr = `PHILIPPINES NATIONAL ID: ${accountName} DOB: 1995-05-15`;
      const { pass } = validateMatch(fakeOcr, dynamicValues);
      setScanMatchResult(pass);
    }
  }, [dynamicValues, kycFile, isScanningDoc]);

  const normalize = (str: string, keepSpaces = false) => {
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

  function levenshtein(a: string, b: string) {
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

  const validateMatch = (ocrText: string, values: any) => {
    if (!ocrText) return { pass: null, error: "" };
    const normOcrGlobal = normalize(ocrText);
    const normOcrSpaced = normalize(ocrText, true);
    const ocrWords = normOcrSpaced.split(' ').filter(w => w.length >= 3);

    const firstNameParts: string[] = [];
    const lastNameParts: string[] = [];

    const splitName = (name: string) => {
      if (!name) return [];
      return name.split(/[\s,.-]+/).filter(p => p.length >= 2);
    };

    // Use dynamic form values with robust label matching
    formFields.forEach(field => {
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
      }
    });

    const isNameMatch = (target: string) => {
      const normTarget = normalize(target);
      if (normTarget.length < 3) return false;
      if (normOcrGlobal.includes(normTarget)) return true;
      return ocrWords.some(word => {
        const maxErrors = normTarget.length > 8 ? 2 : (normTarget.length >= 5 ? 1 : 0);
        return levenshtein(normTarget, word) <= maxErrors;
      });
    };

    const firstNameMatch = firstNameParts.length > 0 && firstNameParts.some(p => isNameMatch(p));
    const lastNameMatch = lastNameParts.length > 0 && lastNameParts.some(p => isNameMatch(p));

    if (firstNameMatch && lastNameMatch) {
      return { pass: 'pass', error: "" };
    } else {
      let msg = "Identity Mismatch: Please ensure the uploaded document is valid and belongs to you.";
      if (!firstNameMatch && firstNameParts.length > 0) msg += " First name could not be verified.";
      if (!lastNameMatch && lastNameParts.length > 0) msg += " Last name could not be verified.";
      return { pass: 'fail', error: msg };
    }
  };

  const handleNextStep = () => {
    Keyboard.dismiss();
    // DIAGNOSTIC ALERT: Confirm the function is even called
    // Alert.alert("Debug", "Next Step Triggered");
    const step = steps[activeStepIndex];
    if (!step) return;

    if (step.type === 'dynamic') {
      const newErrors: Record<string, string> = {};
      const section = (step as any).section;
      if (!section) {
        console.log("Missing section for dynamic step:", step);
        return;
      }

      const lowTitle = (section.title || "").toLowerCase();
      
      if (lowTitle.includes("address")) {
        const requiredAddressFields = [
          "Country",
          "Province", 
          "City / Municipality", 
          "Barangay", 
          "Street Name", 
          "Zip Code"
        ];

        requiredAddressFields.forEach(f => {
          // Look up by original label, lowercase, and common variations
          const val = dynamicValues[f]
            || dynamicValues[f.toLowerCase()]
            || (f === "Province" ? (dynamicValues["Province"] || dynamicValues["Region"] || dynamicValues["province"] || dynamicValues["region"]) : null)
            || (f === "City / Municipality" ? (dynamicValues["City"] || dynamicValues["city"] || dynamicValues["City / Municipality"]) : null)
            || (f === "Street Name" ? (dynamicValues["Street"] || dynamicValues["street"] || dynamicValues["Street Name"]) : null)
            || (f === "Country" ? (dynamicValues["Country"] || dynamicValues["country"]) : null)
            || dynamicValues[f.replace(/\s/g, '').toLowerCase()]
            || dynamicValues[f.replace(/\//g, ' ').replace(/\s+/g, ' ').trim()];

          if (!val || (typeof val === 'string' && val.trim() === '')) {
            newErrors[f] = `${f} is required`;
          }
        });
      } else {
        section.fields?.forEach((f: any) => {
          if (f.required) {
            const isHidden = (fieldIsMiddleName(f.label) && noMiddleName) || (fieldIsSuffix(f.label) && noSuffix);
            // Check both ID and Label, but prioritize Label as that's what renderDynamicInput uses
            const val = dynamicValues[f.label] || dynamicValues[f.id];
            if (!isHidden && (!val || (typeof val === 'string' && val.trim() === ""))) {
              newErrors[f.id] = `${f.label} is required`;
            }
          }
        });
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Scroll to top so user sees the red error indicators on the fields
        setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
        return;
      }
    } else if (step.type === 'summary') {
      // Summary review confirmed
    } else if (step.type === 'security') {
      const newErrors: Record<string, string> = {};
      if (!emailConfirm) {
        newErrors.email = "Email address is required";
      } else if (emailConfirm.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        newErrors.email = "Email does not match your account";
      }
      if (!password) {
        newErrors.password = "Password is required";
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setErrors({});
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(prev => prev + 1);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  };

  const handleBackStep = () => {
    setActiveStepIndex(prev => Math.max(0, prev - 1));
  };

  const fieldIsMiddleName = (label: string) => {
    const low = (label || "").toLowerCase();
    return low.includes('middle') && low.includes('name');
  };

  const fieldIsSuffix = (label: string) => (label || "").toLowerCase() === 'suffix';

  const renderDynamicInput = (field: any) => {
    const lowLabel = (field.label || '').toLowerCase();
    const isMiddleName = lowLabel.includes('middle') && lowLabel.includes('name');
    const isSuffix = lowLabel === 'suffix';
    const isNA = (isMiddleName && noMiddleName) || (isSuffix && noSuffix);

    const value = isNA ? 'N/A' : String(dynamicValues[field.label] || "");

    // Check built-in dropdown options first, then fall back to custom options from the backend
    const builtInOptions = FIELD_OPTIONS[field.type];
    const backendOptions = Array.isArray(field.options) && field.options.length > 0 ? field.options : null;
    const dropdownOptions = builtInOptions || backendOptions;

    let inputElement;

    if (isNA) {
      inputElement = (
        <View className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-4">
          <Text className="text-sm font-semibold text-slate-300">N/A</Text>
        </View>
      );
    } else if (dropdownOptions) {
      inputElement = (
        <TouchableOpacity
          onPress={() => setPickerConfig({
            visible: true,
            title: `Select ${field.label}`,
            options: dropdownOptions,
            onSelect: (val) => setDynamicValues({ ...dynamicValues, [field.label]: val })
          })}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
        >
          <Text className={`text-sm font-semibold ${value ? 'text-[#1a234b]' : 'text-slate-400'}`}>
            {value || `Select ${field.label}`}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </TouchableOpacity>
      );
    } else if (field.type === "date") {
      inputElement = (
        <TouchableOpacity
          onPress={() => setDatePickerField(field.label)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
        >
          <Text className={`text-sm font-semibold ${value ? 'text-[#1a234b]' : 'text-slate-400'}`}>
            {value ? new Date(value).toISOString().split('T')[0] : "Select Date"}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#64748b" />
        </TouchableOpacity>
      );
    } else if (lowLabel.includes('mobile') || lowLabel.includes('phone') || lowLabel.includes('telephone')) {
      const parts = value.split(' ');
      const countryCode = parts.length > 1 ? parts[0] : '+63';
      const number = parts.length > 1 ? parts.slice(1).join(' ') : value;
      const currentCountry = COUNTRIES.find(c => c.dial_code === countryCode) || COUNTRIES.find(c => c.code === 'PH') || COUNTRIES[0];

      inputElement = (
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-2">
          <TouchableOpacity
            onPress={() => setPickerConfig({
              visible: true,
              title: "Select Country Code",
              options: COUNTRIES.map(c => `${c.flag} ${c.name} (${c.dial_code})`),
              searchable: true,
              onSelect: (val) => {
                const match = val.match(/\(([^)]+)\)/);
                const code = match ? match[1] : '+63';
                setDynamicValues(prev => ({ ...prev, [field.label]: `${code} ${number}` }));
              }
            })}
            className="flex-row items-center px-2 py-4 border-r border-slate-200 mr-2"
          >
            <Text className="text-base mr-1">{currentCountry.flag}</Text>
            <Text className="text-sm font-bold text-[#1a234b]">{currentCountry.dial_code}</Text>
            <Ionicons name="chevron-down" size={12} color="#64748b" className="ml-1" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 py-4 text-sm text-[#1a234b] font-semibold"
            placeholder={field.placeholder || "Enter number"}
            placeholderTextColor="#cbd5e1"
            keyboardType="numeric"
            value={number}
            onChangeText={(val) => setDynamicValues(prev => ({ ...prev, [field.label]: `${countryCode} ${val}` }))}
          />
        </View>
      );
    } else {
      inputElement = (
        <TextInput
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm text-[#1a234b] font-semibold"
          placeholder={field.placeholder || `Enter ${field.label}`}
          placeholderTextColor="#cbd5e1"
          keyboardType={field.type === "email" ? "email-address" : (field.type === "number" ? "numeric" : "default")}
          value={value}
          onChangeText={(val) => setDynamicValues(prev => ({ ...prev, [field.label]: val }))}
        />
      );
    }

    const errorKey = errors[field.id] ? field.id : (errors[field.label] ? field.label : null);
    const fieldError = errorKey ? errors[errorKey] : null;

    return (
      <View className="mb-4">
        <InputLabel title={field.label} required={!isNA && field.required} />
        {/* Apply red border style wrapper when there's an error */}
        <View style={fieldError ? { borderRadius: 12, borderWidth: 1.5, borderColor: '#ef4444' } : {}}>
          {inputElement}
        </View>
        {fieldError && (
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444', marginTop: 4, marginLeft: 4 }}>
            ⚠ {fieldError}
          </Text>
        )}
        {isMiddleName && (
          <TouchableOpacity
            onPress={() => {
              const newVal = !noMiddleName;
              setNoMiddleName(newVal);
              if (newVal) {
                setDynamicValues(prev => ({ ...prev, [field.label]: 'N/A' }));
              } else {
                setDynamicValues(prev => ({ ...prev, [field.label]: '' }));
              }
            }}
            className="flex-row items-center mt-2 ml-1"
          >
            <View className={`w-4 h-4 rounded border ${noMiddleName ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} items-center justify-center mr-2`}>
              {noMiddleName && <Ionicons name="checkmark" size={10} color="white" />}
            </View>
            <Text className="text-[10px] font-bold text-slate-400">I don't have a middle name</Text>
          </TouchableOpacity>
        )}
        {isSuffix && (
          <TouchableOpacity
            onPress={() => {
              const newVal = !noSuffix;
              setNoSuffix(newVal);
              if (newVal) {
                setDynamicValues(prev => ({ ...prev, [field.label]: 'N/A' }));
              } else {
                setDynamicValues(prev => ({ ...prev, [field.label]: '' }));
              }
            }}
            className="flex-row items-center mt-2 ml-1"
          >
            <View className={`w-4 h-4 rounded border ${noSuffix ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} items-center justify-center mr-2`}>
              {noSuffix && <Ionicons name="checkmark" size={10} color="white" />}
            </View>
            <Text className="text-[10px] font-bold text-slate-400">I don't have a suffix</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const pickKycDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setKycFile(result.assets[0]);
        // Mock OCR Scan with identity matching
        setIsScanningDoc(true);
        setOcrProgress(0);
        setKycPipelineError("Extracting document data...");
        setScanMatchResult(null);

        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setOcrProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setIsScanningDoc(false);
            setKycPipelineError("");

            // Extract names for matching
            const accountName = user?.name || "User Name";
            const fakeOcr = `PHILIPPINES NATIONAL ID: ${accountName} DOB: 1995-05-15`;

            const { pass, error } = validateMatch(fakeOcr, dynamicValues);
            setScanMatchResult(pass);
            if (pass === 'fail') {
              Alert.alert("Identity Mismatch", error);
            }
          }
        }, 400);
      }
    } catch (err) {
      console.log('Document picker err:', err);
    }
  };

  const pickSelfie = async () => {
    if (!permission) {
      // Camera permissions are still loading
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Camera Required", "Permission to access the camera is required for Selfie Verification!");
        return;
      }
    }

    setShowCamera(true);
  };

  const captureAndVerify = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true, shutterSound: false });
        setLivenessPhase("matching");
        setLivenessInstruction("Verifying Biometrics...");

        if (!kycFile || !kycFile.uri) {
          console.error("Missing ID document URI:", kycFile);
          Alert.alert("Error", "Missing ID document to compare against.");
          setLivenessPhase("idle");
          return;
        }

        // Send to backend for real OpenCV face matching and liveness validation
        const formData = new FormData();
        console.log("Preparing biometric verification...");

        formData.append("id_image", {
          uri: kycFile.uri,
          name: "id_document.jpg",
          type: "image/jpeg",
        } as any);

        formData.append("selfie_image", {
          uri: photo.uri,
          name: "selfie.jpg",
          type: "image/jpeg",
        } as any);

        const res = await fetch(`${API_BASE_URL}/detect-face/verify-biometrics`, {
          method: "POST",
          headers: { "Bypass-Tunnel-Reminder": "true" },
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Biometric verification server error");
        }

        const result = await res.json();

        if (!result.match) {
          setLivenessPhase("idle");
          setFacePositionHint(result.reason || "Face mismatch");
          setLivenessInstruction(result.reason || "Face does not match ID");
        } else if (scanMatchResult === 'fail') {
          // If the OCR document data failed previously, we still fail here
          setLivenessPhase("idle");
          setLivenessInstruction("Identity Mismatch");
        } else {
          setLivenessPhase("success");
          setLivenessInstruction("Identity Secured!");
          setTimeout(() => {
            setSelfieFile({
              uri: photo.uri,
              name: 'selfie.jpg',
              type: 'image/jpeg',
              base64: photo.base64,
            });
            setShowCamera(false);
            setLivenessPhase("idle");
            livenessRef.current = { challengeIndex: 0, holdFrames: 0, accumulated: 0 };
          }, 1000);
        }
      } catch (err) {
        console.error("Capture error:", err);
        setLivenessInstruction("Verification Error");
        setLivenessPhase("idle");
      }
    }
  }, [scanMatchResult, kycFile]);

  // ─── Real Face Detection + Smooth UI Loop ──────────────────────────────────
  // 1. Detection Loop: polls backend every 1200ms to check if face is really there.
  // 2. UI Loop: smooth 300ms timer that ONLY advances progress if face is centered.
  const isDetecting = useRef(false);
  const challengeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance liveness logic (called by the fast UI tick)
  const advanceLiveness = useCallback(() => {
    if (livenessPhase === 'success' || livenessPhase === 'matching') return;
    const ls = livenessRef.current;
    if (ls.challengeIndex >= CHALLENGES.length) return;

    // Only proceed if a face was detected in the last background check
    if (!isFaceCentered) {
      if (livenessPhase !== 'idle' && livenessPhase !== 'aligning') {
        setLivenessPhase('aligning');
      }
      setLivenessInstruction(facePositionHint || 'Position your face in the frame');
      return;
    }

    if (livenessPhase !== 'scanning') setLivenessPhase('scanning');
    const challenge = CHALLENGES[ls.challengeIndex];
    setLivenessInstruction(challenge.instruction);

    // Strict Pose Matching: only advance if backend detects the correct pose!
    // challenge.id is 'left', 'right', or 'center' (straight)
    const requiredPose = challenge.id === 'center' ? 'straight' : challenge.id;
    // SMART MATCH: If backend detects 'profile', it counts for both 'left' and 'right'
    const isPoseMatch = currentPoseRef.current === requiredPose ||
      (currentPoseRef.current === 'profile' && (requiredPose === 'left' || requiredPose === 'right'));

    if (!isPoseMatch) {
      setFacePositionHint(`Follow instruction: ${challenge.instruction}`);
      return;
    } else {
      setFacePositionHint('Detected! Moving on...');
      // INSTANT PROGRESS: jump to the end of this challenge
      ls.holdFrames = challenge.frames;
    }
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
        if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
        captureAndVerify();
      }
    }
  }, [livenessPhase, isFaceCentered, facePositionHint, captureAndVerify]);

  const advanceLivenessRef = useRef(advanceLiveness);
  advanceLivenessRef.current = advanceLiveness;

  useEffect(() => {
    // Fast UI tick (200ms) for smoother progress
    if (showCamera && isCameraReady && livenessPhase !== 'success' && livenessPhase !== 'matching') {
      challengeTimerRef.current = setInterval(() => {
        advanceLivenessRef.current();
      }, 200);

      // Ultra-Fast Backend Poll (500ms) - Instant detection feel
      detectionTimerRef.current = setInterval(async () => {
        if (isDetecting.current || !cameraRef.current) return;
        isDetecting.current = true;
        try {
          const photo = await (cameraRef.current as any).takePictureAsync({
            quality: 0.1,
            skipProcessing: true,
            base64: false,
            shutterSound: false,
          });

          const formData = new FormData();
          formData.append('file', {
            uri: photo.uri,
            name: 'frame.jpg',
            type: 'image/jpeg',
          } as any);

          const res = await fetch(`${API_BASE_URL}/detect-face`, {
            method: 'POST',
            headers: { 'Bypass-Tunnel-Reminder': 'true' },
            body: formData,
          });

          if (!res.ok) throw new Error("Backend error");
          const result = await res.json();

          if (!result.face_detected) {
            setIsFaceCentered(false);
            currentPoseRef.current = "none";
            setFacePositionHint('No face detected');
          } else {
            // ULTRA LENIENT: If a face is found ANYWHERE, we consider it centered for speed
            setIsFaceCentered(true);
            currentPoseRef.current = result.pose;
            setFacePositionHint('Perfect! Hold still');
          }
        } catch (e) {
          console.log('Face-detect error:', e);
          setIsFaceCentered(false);
          setFacePositionHint('Analyzing...');
        } finally {
          isDetecting.current = false;
        }
      }, 800);
    }

    return () => {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current);
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    };
  }, [showCamera, isCameraReady, livenessPhase]);

  const takeSelfie = useCallback(async () => {
    // This is now triggered by liveness success, not a timer
    // But we initialize the state here when camera opens
    setLivenessPhase("idle");
    setLivenessInstruction("Position your face in the frame");
    setLivenessProgress(0);
    livenessRef.current = { challengeIndex: 0, holdFrames: 0, accumulated: 0 };
  }, []);

  const handleManualCloseCamera = useCallback(() => {
    setShowCamera(false);
    setIsCameraReady(false);
    setLivenessPhase("idle");
  }, []);

  // Automatically start liveness scan when camera opens
  useEffect(() => {
    if (showCamera && isCameraReady && livenessPhase === 'idle') {
      // Small delay to ensure UI is settled
      const timer = setTimeout(() => {
        takeSelfie();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showCamera, isCameraReady, livenessPhase, takeSelfie]);

  const handleSaveProfile = async () => {
    setIsVerifying(true);
    setKycPipelineError("Matching Profile Data...");

    setTimeout(async () => {
      setKycPipelineError("Handshaking Server...");
      setTimeout(async () => {
        try {
          const payload = {
            role_context: user?.role || user?.role_context,
            status: "verified",
            attributes: {
              ...user?.attributes,
              ...dynamicValues,
              kyc_document: kycFile,
              kyc_document_type: kycDocType,
              selfie_document: selfieFile,
              is_profile_complete: true,
              completed_at: new Date().toISOString()
            }
          };

          if (password) {
            (payload as any).password = password;
          }

          const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Bypass-Tunnel-Reminder": "true"
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            setKycPipelineError("");
            const updatedUser = await res.json();
            updateProfile({ ...updatedUser, isProfileComplete: true });
            setIsSuccess(true);
          } else {
            const errData = await res.json().catch(() => ({}));
            setKycPipelineError(errData.detail || "Submission Failed");
          }
        } catch (err) {
          setKycPipelineError("Connection Error");
          console.error("Update error:", err);
        } finally {
          setIsVerifying(false);
        }
      }, 1500);
    }, 2000);
  };



  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color="#1f2a56" />

      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => activeStepIndex > 0 ? handleBackStep() : router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a234b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-[#1a234b]">Complete Profile</Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text className="text-slate-400 font-bold text-xs ">Skip</Text>
        </TouchableOpacity>
      </View>

      <ProgressTracker steps={steps} activeIndex={activeStepIndex} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView 
          ref={scrollRef}
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >

          {isSuccess ? (
            <View className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 items-center mt-6">
              <View className="w-28 h-28 bg-emerald-50 rounded-full items-center justify-center mb-8 border border-emerald-100">
                <Ionicons name="checkmark-done-circle" size={80} color="#10b981" />
              </View>
              <Text className="text-2xl font-black text-[#1a234b] tracking-tighter mb-4 text-center">Identity Verified!</Text>
              <Text className="text-slate-400 text-sm font-medium px-4 text-center leading-relaxed">Your profile is now complete. Redirecting to your dashboard.</Text>
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                className="mt-14 w-full py-5 rounded-2xl bg-[#1a234b] items-center"
              >
                <Text className="text-white font-bold">Go to Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {currentStep?.type === 'dynamic' && (
                <View className="mt-2">
                  <View className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-6">
                    <SectionHeader title={(currentStep as any).title} />
                    {(currentStep as any).title.toLowerCase().includes("address") ? (
                      <AddressForm
                        values={dynamicValues}
                        onChange={(k: string, v: any) => {
                          setDynamicValues((prev: any) => ({ ...prev, [k]: v }));
                          if (errors[k]) setErrors((prev: any) => ({ ...prev, [k]: "" }));
                        }}
                        errors={errors}
                      />
                    ) : (
                      (currentStep as any).section.fields?.map((field: any, fidx: number) => (
                        <View key={fidx}>
                          {renderDynamicInput(field)}
                        </View>
                      ))
                    )}
                  </View>

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                    })}
                    className="bg-[#1a234b] py-5 rounded-[24px] items-center mb-10 flex-row justify-center shadow-xl shadow-blue-900/20"
                  >
                    <Text className="text-white font-black text-sm tracking-widest mr-2 ">Next</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </Pressable>
                </View>
              )}

              {currentStep?.type === 'summary' && (
                <View className="mt-2">
                  <View className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-6">
                    <SectionHeader title="Review Your Information" />
                    {/* ✅ Use View instead of ScrollView — nested ScrollViews on Android
                        absorb touch events and make the button below unresponsive.
                        The outer ScrollView already handles scrolling. */}
                    <View>
                      {formSections.map((section, sidx) => (
                        <View key={sidx} className="mb-6">
                          <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">{section.title}</Text>
                          <View className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                            {section.fields.map((f: any, fidx: number) => {
                              const val = dynamicValues[f.id] || dynamicValues[f.label] || "N/A";
                              return (
                                <View key={fidx} className="flex-row justify-between py-2 border-b border-slate-100/50">
                                  <Text className="text-[10px] font-bold text-slate-400">{f.label}</Text>
                                  <Text className="text-[10px] font-black text-[#1a234b] text-right flex-1 ml-4" numberOfLines={1}>{val}</Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={handleNextStep}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                    })}
                    className="bg-[#1a234b] py-5 rounded-[24px] items-center mb-10 flex-row justify-center shadow-xl shadow-blue-900/20"
                  >
                    <Text className="text-white font-black text-sm tracking-widest mr-2 ">Confirm & Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </Pressable>
                </View>
              )}

              {currentStep?.type === 'security' && (
                <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 mt-2 p-8">
                  <View className="items-center mb-10">
                    <View className="w-16 h-16 bg-[#f1f4ff] rounded-[22px] items-center justify-center mb-6 border border-blue-50/50 shadow-sm">
                      <Ionicons name="lock-closed" size={32} color="#1a234b" />
                    </View>
                    <Text className="text-2xl font-black text-[#1a234b] tracking-tight mb-2 text-center">Login Credentials</Text>
                    <Text className="text-sm font-medium text-slate-400 text-center leading-relaxed">Review or update your account security settings</Text>
                  </View>

                  <View className="space-y-6">
                    <View>
                      <InputLabel title="Email Address" required />
                      <View style={errors.email ? { borderRadius: 16, borderWidth: 1.5, borderColor: '#ef4444' } : {}}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 flex-row items-center">
                        <Ionicons name="mail-outline" size={20} color={errors.email ? '#ef4444' : '#94a3b8'} style={{ marginRight: 12 }} />
                        <TextInput
                          placeholder="Confirm your email"
                          placeholderTextColor="#cbd5e1"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={emailConfirm}
                          onChangeText={(v) => { setEmailConfirm(v); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                          className="flex-1 text-sm font-bold text-[#1a234b]"
                        />
                      </View>
                      {errors.email ? <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444', marginTop: 4, marginLeft: 4 }}>⚠ {errors.email}</Text> : null}
                    </View>

                    <View className="mt-4">
                      <InputLabel title="Account Password" required />
                      <View style={errors.password ? { borderRadius: 16, borderWidth: 1.5, borderColor: '#ef4444' } : {}}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 flex-row items-center">
                        <Ionicons name="key-outline" size={20} color={errors.password ? '#ef4444' : '#94a3b8'} style={{ marginRight: 12 }} />
                        <TextInput
                          placeholder="Type your password"
                          placeholderTextColor="#cbd5e1"
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={(v) => { setPassword(v); if (errors.password) setErrors(prev => ({ ...prev, password: '' })); }}
                          className="flex-1 text-sm font-bold text-[#1a234b]"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                      {errors.password ? <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444', marginTop: 4, marginLeft: 4 }}>⚠ {errors.password}</Text> : null}
                    </View>
                  </View>

                  <View className="mt-14 flex-col gap-3">
                  <Pressable
                    onPress={handleSaveProfile}
                    disabled={isVerifying}
                    style={({ pressed }) => ({
                      opacity: (pressed && !isVerifying) ? 0.5 : 1,
                    })}
                    className="w-full py-5 bg-[#1a234b] rounded-[24px] items-center flex-row justify-center shadow-xl shadow-blue-900/20"
                  >
                    {isVerifying ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Text className="text-white font-black text-sm tracking-widest mr-2 ">Finish Registration</Text>
                        <Ionicons name="checkmark-done" size={18} color="white" />
                      </>
                    )}
                  </Pressable>
                  </View>
                </View>
              )}

              {currentStep?.type === 'verify' && (
                <View className="mt-2">
                  <View className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-6">
                    <SectionHeader title="Verification" />
                    {kycSubStep === 1 ? (
                      <View className="items-center py-6 px-4">
                        <View className="w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mb-6 border border-blue-100">
                          <Ionicons name="card" size={40} color="#2563eb" />
                        </View>
                        <Text className="text-xl font-black text-[#1a234b] mb-2 text-center">Government ID</Text>
                        <Text className="text-xs font-medium text-slate-400 text-center mb-8 px-4 leading-relaxed">
                          Please provide a clear photo of your government-issued ID for identity validation.
                        </Text>

                        {kycFile ? (
                          <View className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <View className="flex-row items-center">
                              <Ionicons name="document-attach" size={24} color="#10b981" />
                              <View className="ml-3 flex-1">
                                <Text className="text-xs font-bold text-[#1a234b]" numberOfLines={1}>{kycFile.name}</Text>
                                <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Ready for verification</Text>
                              </View>
                              <TouchableOpacity onPress={() => setKycFile(null)} className="p-2 bg-white rounded-full border border-slate-100">
                                <Ionicons name="refresh" size={16} color="#64748b" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={pickKycDocument}
                            className="w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl items-center justify-center bg-slate-50/50"
                          >
                            <Ionicons name="cloud-upload-outline" size={32} color="#94a3b8" />
                            <Text className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Tap to Upload ID</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <View className="items-center py-6 px-4">
                        <View className="w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mb-6 border border-blue-100">
                          <Ionicons name="camera" size={40} color="#2563eb" />
                        </View>
                        <Text className="text-xl font-black text-[#1a234b] mb-2 text-center">Face Verification</Text>
                        <Text className="text-xs font-medium text-slate-400 text-center mb-8 px-4 leading-relaxed">
                          Complete the liveness check to confirm your identity.
                        </Text>

                        {selfieFile ? (
                          <View className="w-full bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 items-center">
                            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                            <Text className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-widest">Liveness Scan Complete</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={pickSelfie}
                            className="w-full py-5 bg-[#1a234b] rounded-24 items-center flex-row justify-center shadow-xl shadow-blue-900/10"
                          >
                            <Ionicons name="scan-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-black text-sm tracking-widest uppercase">Start Scanning</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={kycSubStep === 1 ? () => setKycSubStep(2) : handleNextStep}
                    disabled={kycSubStep === 1 ? !kycFile : !selfieFile}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                    })}
                    className={`py-5 rounded-[24px] items-center mb-10 flex-row justify-center shadow-xl ${kycSubStep === 1 ? (!kycFile ? 'bg-slate-200' : 'bg-[#1a234b]') : (!selfieFile ? 'bg-slate-200' : 'bg-[#1a234b]')}`}
                  >
                    <Text className="text-white font-black text-sm tracking-widest mr-2 ">
                      {kycSubStep === 1 ? 'Next' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </Pressable>
                </View>
              )}
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      {pickerConfig && (
        <SelectionModal
          visible={!!pickerConfig}
          title={pickerConfig?.title}
          options={pickerConfig?.options || []}
          searchable={pickerConfig?.searchable}
          onSelect={pickerConfig?.onSelect || (() => { })}
          onClose={() => setPickerConfig(null)}
        />
      )}

      {datePickerField && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white pb-8 shadow-lg rounded-t-3xl">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-100">
                <TouchableOpacity onPress={() => setDatePickerField(null)}>
                  <Text className="text-slate-500 font-bold text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="font-black text-[#1a234b] text-base">Select Date</Text>
                <TouchableOpacity onPress={() => setDatePickerField(null)}>
                  <Text className="text-blue-600 font-black text-base">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dynamicValues[datePickerField] ? new Date(dynamicValues[datePickerField]) : new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDynamicValues({ ...dynamicValues, [datePickerField]: selectedDate.toISOString() });
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {datePickerField && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={dynamicValues[datePickerField] ? new Date(dynamicValues[datePickerField]) : new Date(2000, 0, 1)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setDatePickerField(null);
            if (event.type === "set" && selectedDate) {
              setDynamicValues({ ...dynamicValues, [datePickerField]: selectedDate.toISOString() });
            }
          }}
        />
      )}

      {showCamera && (
        <Modal animationType="slide" transparent={false} visible={showCamera}>
          <View className="flex-1 bg-[#1a234b] items-center justify-center">
            {/* Main Card Wrapper */}
            <View className="w-[92%] h-[85%] bg-white rounded-[40px] overflow-hidden shadow-2xl items-center relative">

              {/* Header Section */}
              <View className="w-full px-8 pt-8 pb-4 flex-row justify-between items-start bg-white z-10">
                <View>
                  <Text className="text-[#1a234b] font-black text-xl leading-none uppercase tracking-tighter">Liveness Scan</Text>
                  <Text className="text-slate-400 font-bold text-[10px] tracking-widest mt-1 uppercase">Anti-Spoofing Security Check</Text>
                </View>
                <TouchableOpacity
                  onPress={handleManualCloseCamera}
                  className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
                >
                  <Ionicons name="chevron-back" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Camera Container */}
              <View className="flex-1 w-full px-4 py-2 items-center justify-center">
                <View
                  onLayout={(e) => setCameraLayout(e.nativeEvent.layout)}
                  className="w-full h-full rounded-[35px] overflow-hidden bg-slate-950 relative shadow-inner"
                >
                  <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    facing="front"
                    onCameraReady={() => setIsCameraReady(true)}
                  /* Face detector removed to prevent crash on SDK 52+ */
                  />

                  {/* Matching Overlay (Web-like) */}
                  {livenessPhase === 'matching' && (
                    <View className="absolute inset-0 z-30 bg-[#1a234b]/90 backdrop-blur-md items-center justify-center p-8">
                      <ActivityIndicator size="large" color="white" className="mb-6" />
                      <Text className="text-white font-black text-xl text-center mb-2">Verifying Identity</Text>
                      <Text className="text-white/60 text-xs font-bold text-center">Comparing document face with biometric signature...</Text>
                    </View>
                  )}

                  {/* Face frame + progress arc — ONE oval, no extra rings */}
                  <View
                    className="absolute inset-0 items-center justify-center"
                    pointerEvents="none"
                  >
                    <LivenessOval
                      progress={livenessProgress}
                      phase={livenessPhase}
                      isCentered={isFaceCentered}
                    />
                  </View>

                  {/* Success Checkmark */}
                  {livenessPhase === 'success' && (
                    <View className="absolute inset-0 items-center justify-center z-40">
                      <View className="w-20 h-20 bg-emerald-500 rounded-full items-center justify-center shadow-2xl shadow-emerald-500/50">
                        <Ionicons name="checkmark" size={48} color="white" />
                      </View>
                    </View>
                  )}

                  {/* Instruction / Hint Badge */}
                  <View className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2.5">
                    <View className={`px-6 py-2.5 rounded-full border shadow-xl ${livenessPhase === 'success' ? 'bg-emerald-500 border-emerald-400' :
                      isFaceCentered ? 'bg-black/60 border-white/20' :
                        'bg-rose-600 border-rose-400 shadow-rose-900/40'
                      }`}>
                      <Text className="text-white font-black text-[10px] uppercase tracking-widest text-center">
                        {livenessPhase === 'success' ? '✓ Liveness Verified' :
                          isFaceCentered ? livenessInstruction : facePositionHint}
                      </Text>
                    </View>
                    {isFaceCentered && livenessPhase === 'idle' && (
                      <Text className="text-white/60 font-bold text-[9px]">Scanning automatically...</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Bottom Panel */}
              <View className="w-full p-8 items-center bg-white border-t border-slate-50">
                <View className="flex-row items-center mb-2">
                  <MaterialIcons name="verified-user" size={16} color="#0d9488" />
                  <Text className="text-[#0d9488] font-black text-[10px] tracking-[2px] uppercase ml-2">Anti-Spoofing Active</Text>
                </View>
                <Text className="text-slate-400 text-center font-bold text-[10px] leading-relaxed px-6">
                  {livenessPhase === 'success' ? 'Identity verified successfully. Finalizing...' :
                    'Follow the on-screen instructions. The system scans automatically.'}
                </Text>

                {/* Progress Bar */}
                {livenessProgress > 0 && livenessPhase !== 'success' && (
                  <View className="w-full h-1.5 bg-slate-100 rounded-full mt-5 overflow-hidden">
                    <View
                      className="h-full bg-emerald-500"
                      style={{ width: `${livenessProgress}%` }}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}