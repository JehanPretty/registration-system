import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  BadgeCheck, 
  Cpu, 
  Info,
  Circle,
  Scan,
  CreditCard,
  Building2,
  GraduationCap
} from "lucide-react";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:8000";

// --- COMPONENTS ---

const ProgressTracker = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Profile", icon: User },
    { id: 2, label: "Account", icon: Lock },
    { id: 3, label: "Verify", icon: ShieldCheck },
  ];

  return (
    <div className="py-6 px-10 bg-white border-b border-slate-100 sticky top-14 z-40">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-3 left-0 right-0 h-[2px] bg-slate-100 z-0">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isActive = currentStep >= step.id;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isActive ? 'bg-[#1a234b] border-[#1a234b] scale-110 shadow-lg' : 'bg-white border-slate-200'}`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">{step.id}</span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${isActive ? 'text-[#1a234b]' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6 animate-in">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-2 h-2 bg-blue-600 rotate-45" />
      <h3 className="text-blue-600 font-black text-[10px] uppercase tracking-[2px]">{title}</h3>
    </div>
    {subtitle && <div className="h-[1px] bg-slate-100 w-full" />}
  </div>
);

const InputGroup = ({ label, required, children }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = Role Selection
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/roles/`);
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        } else {
          // Fallback
          setRoles([
            { name: "Student", title: "Student", icon: "GraduationCap", description: "Access student services and registration." },
            { name: "Staff", title: "Staff", icon: "Building2", description: "Administrative and support services." },
            { name: "Teacher", title: "Teacher", icon: "BookOpen", description: "Manage courses and academic data." }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Fetch Dynamic Form when role is selected
  useEffect(() => {
    if (selectedRole) {
      const fetchForm = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/forms/${selectedRole}`);
          if (res.ok) {
            const data = await res.json();
            const allFields = data.flatMap(section => section.fields);
            setDynamicFields(allFields);
          }
        } catch (err) {
          console.error("Failed to fetch form:", err);
        }
      };
      fetchForm();
    }
  }, [selectedRole]);

  const handleNext = () => {
    if (currentStep === 0 && !selectedRole) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsVerifying(true);
    // Simulate AI Scan
    setTimeout(async () => {
      try {
        const payload = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          external_id: formData.username,
          source: 'local',
          role_context: selectedRole,
          attributes: {
            ...dynamicValues,
            phone: formData.phone,
            password: formData.password // In real app, backend hashes this
          }
        };

        const res = await fetch(`${API_BASE_URL}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSuccess(true);
        } else {
          alert("Registration failed. Please check your details.");
        }
      } catch (err) {
        console.error("Submit error:", err);
        alert("Server connection error. Registration failed.");
      } finally {
        setIsVerifying(false);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      <header className="bg-[#1a234b] text-white px-6 py-4 sticky top-0 z-50 flex items-center justify-between shadow-lg">
        <button 
          onClick={handleBack} 
          disabled={currentStep === 0}
          className={`p-2 hover:bg-white/10 rounded-xl transition-all ${currentStep === 0 ? 'opacity-0' : 'opacity-100'}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-lg shadow-inner">
            <Scan className="text-[#1a234b] w-4 h-4" />
          </div>
          <h1 className="text-lg font-black tracking-tight m-0">Regis<span className="text-blue-400">Sys</span></h1>
        </div>
        <div className="w-9" />
      </header>

      {currentStep > 0 && <ProgressTracker currentStep={currentStep} />}

      <main className="flex-1 p-6 overflow-y-auto">
        {/* STEP 0: ROLE SELECTION */}
        {currentStep === 0 && (
          <div className="animate-in">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#1a234b] m-0 mb-2 leading-none tracking-tighter uppercase">Account Type</h2>
              <p className="text-slate-400 text-sm font-medium">Select your role to continue registration</p>
            </div>

            <div className="space-y-4">
              {roles.map((role) => (
                <button
                  key={role.name}
                  onClick={() => setSelectedRole(role.name)}
                  className={`w-full p-5 rounded-2xl border-2 flex items-center text-left transition-all duration-300 relative group
                    ${selectedRole === role.name ? 'bg-blue-50 border-blue-600 shadow-md transform -translate-y-1' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 transition-colors
                    ${selectedRole === role.name ? 'bg-blue-600' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    {role.name === "Student" ? <GraduationCap className={selectedRole === role.name ? "text-white" : "text-slate-400"} /> : 
                     role.name === "Teacher" ? <User className={selectedRole === role.name ? "text-white" : "text-slate-400"} /> : 
                     <Building2 className={selectedRole === role.name ? "text-white" : "text-slate-400"} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-black text-sm uppercase tracking-wider m-0 ${selectedRole === role.name ? 'text-blue-700' : 'text-[#1a234b]'}`}>{role.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{role.description}</p>
                  </div>
                  {selectedRole === role.name && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg border-2 border-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedRole}
              className={`w-full py-4 rounded-2xl mt-12 font-black text-sm uppercase tracking-[3px] transition-all shadow-lg active:scale-95
                ${selectedRole ? 'bg-[#1a234b] text-white' : 'bg-slate-200 text-slate-400'}`}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS */}
        {currentStep === 1 && (
          <div className="animate-in space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <div className="text-center mb-6">
                <h2 className="text-lg font-black text-[#1a234b] uppercase tracking-tighter m-0">Personal Information</h2>
                <div className="h-1 w-8 bg-blue-500 rounded-full mx-auto mt-2" />
              </div>

              <SectionHeader title="Names" subtitle />
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="First Name" required>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </InputGroup>
                <InputGroup label="Last Name" required>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </InputGroup>
              </div>
              <InputGroup label="Middle Name">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                  value={formData.middleName}
                  onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                />
              </InputGroup>

              <SectionHeader title="Contact" subtitle />
              <InputGroup label="Email" required>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="Phone" required>
                <div className="flex gap-2">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 flex items-center text-xs font-bold text-slate-500">+63</div>
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1a234b]" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </InputGroup>

              {/* Dynamic Fields */}
              {dynamicFields.length > 0 && (
                <>
                  <SectionHeader title={`${selectedRole} Details`} subtitle />
                  {dynamicFields.map((field) => (
                    <InputGroup key={field.label} label={field.label} required={field.required}>
                      <input 
                        type={field.type === "number" ? "number" : "text"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                        placeholder={field.placeholder}
                        value={dynamicValues[field.label] || ""}
                        onChange={e => setDynamicValues({ ...dynamicValues, [field.label]: e.target.value })}
                      />
                    </InputGroup>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-[#1a234b] text-white font-black text-sm uppercase tracking-[3px] shadow-lg active:scale-95"
            >
              Next Step
            </button>
          </div>
        )}

        {/* STEP 2: ACCOUNT SETUP */}
        {currentStep === 2 && (
          <div className="animate-in space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <div className="text-center mb-8">
                <h2 className="text-lg font-black text-[#1a234b] uppercase tracking-tighter m-0">Account Credentials</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[1px]">Step 2 of 3</p>
              </div>

              <InputGroup label="Username / External ID" required>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold placeholder:font-normal" 
                  placeholder="e.g. 2024-0001"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="Password" required>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </InputGroup>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-8 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                  These credentials will grant you access across the entire Central Hub ecosystem, including Attendance and Feedback modules.
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-[#1a234b] text-white font-black text-sm uppercase tracking-[3px] shadow-lg active:scale-95"
            >
              Confirm Account
            </button>
          </div>
        )}

        {/* STEP 3: VERIFICATION */}
        {currentStep === 3 && (
          <div className="animate-in space-y-6">
            {isSuccess ? (
              <div className="text-center py-10 animate-in">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm shadow-green-100">
                  <BadgeCheck className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-[#1a234b] tracking-tighter uppercase">Registration Complete!</h2>
                <p className="text-slate-500 text-sm mt-2 px-8">Your account has been successfully verified and added to the global registration database.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-12 text-[#1a234b] font-black text-xs uppercase tracking-widest border-b-2 border-[#1a234b] pb-1"
                >
                  Return to Start
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#1a234b] m-0">AI Face Verification</h2>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biometric Match Required</p>
                    </div>
                  </div>

                  {/* ID Upload Mock */}
                  <div className="space-y-4">
                    <div 
                      className={`h-48 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3
                        ${isVerifying ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <div className="relative">
                        <User className={`w-12 h-12 ${isVerifying ? 'text-blue-600' : 'text-slate-300'}`} />
                        {isVerifying && (
                          <div className="absolute inset-0 border-2 border-blue-600 rounded-lg animate-pulse" style={{ animationDuration: '0.8s' }} />
                        )}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isVerifying ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isVerifying ? 'Scanning Biometrics...' : 'Attach Identity Card'}
                      </p>
                      {!isVerifying && (
                        <button className="bg-white text-[#1a234b] px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm border border-slate-100">
                          Choose File
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <Circle className="w-2 h-2 text-green-500 fill-green-500" />
                          <span className="text-[8px] font-black text-slate-400 uppercase">Liveness</span>
                        </div>
                        <p className="text-xs font-bold text-[#1a234b]">FACE DATA</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                          <Circle className={`w-2 h-2 ${isVerifying ? 'text-blue-500 fill-blue-500' : 'text-slate-300 fill-slate-300'}`} />
                          <span className="text-[8px] font-black text-slate-400 uppercase">Status</span>
                        </div>
                        <p className="text-xs font-bold text-[#1a234b]">ID MATCH</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <div className="bg-amber-200 p-1.5 rounded-lg h-fit">
                    <Info className="w-4 h-4 text-amber-900" />
                  </div>
                  <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                    Facial mapping ensures you have a unique global ID within our system. This prevents duplicate registration and identity theft across other modules.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isVerifying}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[4px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                    ${isVerifying ? 'bg-blue-600 text-white cursor-wait' : 'bg-[#1a234b] text-white'}`}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Running Neural Match...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-5 h-5" />
                      Complete & Verify
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-6 bg-slate-50 border-t border-slate-200 mt-auto">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Group Project Ecosystem &bull; Registration System v1.0
        </p>
      </footer>
    </div>
  );
}
