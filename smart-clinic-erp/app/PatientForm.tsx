"use client";

import { useState, useEffect } from "react";

// Inlined clinic configuration to ensure single-file self-containment and fix import resolution errors
const clinicConfig = {
  clinicName: "Smart Clinic & Diagnostics",
  tagline: "Your Health, Our Top Priority",
  currency: "PKR", 
  doctor: {
    name: "Dr. Mohsin Shahzad",
    degree: "MBBS, FCPS (Medicine)",
    specialty: "Consultant Physician & Specialist",
    consultationFee: 500,
  },
  contact: {
    phone: "+92 300 1234567",
    address: "Main Multan Road, Near General Hospital, Pakistan",
  }
};

interface Patient {
  pid: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
}

interface Visit {
  id: string;
  pid: string;
  date: string;
  time: string;
  complaints: string;
  diagnosis: string;
  medicines: string;
  vitals: { bp: string; temp: string; weight: string };
  tokenNumber: number;
}

interface Token {
  tokenNumber: number;
  pid: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  vitals: { bp: string; temp: string; weight: string };
  time: string;
}

export default function PatientForm() {
  const [mounted, setMounted] = useState(false);

  // Core Persistent States
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsHistory, setVisitsHistory] = useState<Visit[]>([]);
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);

  // Form Inputs
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [vitals, setVitals] = useState({ bp: "", temp: "", weight: "" });
  
  // Track if we are registering an existing patient
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);

  // Search Returning Patient
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Active Doctor Desk States
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [prescription, setPrescription] = useState({ complaints: "", Diagnosis: "", medicines: "" });

  // Custom Alerts
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedPatients = localStorage.getItem("sc_patients");
    const storedVisits = localStorage.getItem("sc_visits");
    const storedTokens = localStorage.getItem("sc_tokens");
    const storedCounter = localStorage.getItem("sc_token_counter");

    if (storedPatients) setPatientsList(JSON.parse(storedPatients));
    if (storedVisits) setVisitsHistory(JSON.parse(storedVisits));
    if (storedTokens) setTokenList(JSON.parse(storedTokens));
    if (storedCounter) setTokenCounter(parseInt(storedCounter, 10));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_patients", JSON.stringify(patientsList));
  }, [patientsList, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_visits", JSON.stringify(visitsHistory));
  }, [visitsHistory, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_tokens", JSON.stringify(tokenList));
  }, [tokenList, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_token_counter", tokenCounter.toString());
  }, [tokenCounter, mounted]);

  if (!mounted) return <div className="text-center py-12 text-slate-500">Loading Smart Patient System...</div>;

  // Helper to trigger custom alerts
  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const filteredPatients = searchQuery.trim() === "" 
    ? [] 
    : patientsList.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
      );

  const handleSelectReturning = (patient: Patient) => {
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender);
    setPhone(patient.phone);
    setSelectedExistingPid(patient.pid);
    setSearchQuery("");
    setShowSearchResults(false);
    triggerAlert(`Existing Patient Selected: ${patient.name} (${patient.pid})`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) return triggerAlert("⚠️ Please enter Patient Name and Age!");

    let finalPid = selectedExistingPid;

    if (!finalPid) {
      const generatedNumber = 1001 + patientsList.length;
      finalPid = `PID-${generatedNumber}`;
      const newPatientRecord: Patient = {
        pid: finalPid,
        name,
        age,
        gender,
        phone
      };
      setPatientsList(prev => [newPatientRecord, ...prev]);
    }

    const newToken: Token = {
      tokenNumber: tokenCounter,
      pid: finalPid,
      name,
      age,
      gender,
      phone,
      vitals,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTokenList(prev => [newToken, ...prev]);
    setTokenCounter(prev => prev + 1);

    setName("");
    setAge("");
    setPhone("");
    setVitals({ bp: "", temp: "", weight: "" });
    setSelectedExistingPid(null);
    triggerAlert(`🎟️ Token #${tokenCounter} Issued Successfully for PID: ${finalPid}`);
  };

  const handleCheck = (token: Token) => {
    setSelectedToken(token);
    setPrescription({ complaints: "", Diagnosis: "", medicines: "" });
  };

  const handleCloneVisit = (pastVisit: Visit) => {
    setPrescription({
      complaints: pastVisit.complaints,
      Diagnosis: pastVisit.diagnosis,
      medicines: pastVisit.medicines
    });
    triggerAlert("📋 Past Prescription Copied to Current Desk!");
  };

  const handlePrint = () => {
    if (!selectedToken) return;

    const newVisitRecord: Visit = {
      id: `VISIT-${Date.now()}`,
      pid: selectedToken.pid,
      date: new Date().toLocaleDateString('en-GB'),
      time: selectedToken.time,
      complaints: prescription.complaints || "Routine Checkup",
      diagnosis: prescription.Diagnosis || "Under Observation",
      medicines: prescription.medicines || "No medicines prescribed.",
      vitals: selectedToken.vitals,
      tokenNumber: selectedToken.tokenNumber
    };

    setVisitsHistory(prev => [newVisitRecord, ...prev]);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return triggerAlert("⚠️ Please allow popups for this website to print prescriptions");

    const prescriptionHTML = `
      <html>
        <head>
          <title>Prescription - ${selectedToken.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 15px; margin-bottom: 30px; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #2563eb; margin: 0; }
            .clinic-tagline { font-size: 14px; color: #64748b; font-style: italic; margin: 5px 0 0 0; }
            .doctor-info { margin-top: 10px; font-size: 14px; color: #1e293b; }
            
            .patient-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #f8fafc; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 35px; font-size: 14px; gap: 10px; }
            .patient-bar strong { color: #0f172a; }
            
            .content-grid { display: grid; grid-template-columns: 1fr; gap: 25px; }
            .section-title { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 10px; }
            
            .rx-symbol { font-size: 24px; font-weight: bold; color: #2563eb; font-family: 'Times New Roman', serif; margin-bottom: 10px; }
            .medicines-text { font-family: monospace; font-size: 15px; white-space: pre-wrap; padding-left: 10px; color: #0f172a; }
            
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">🏥 ${clinicConfig.clinicName}</div>
            <div class="clinic-tagline">${clinicConfig.tagline}</div>
            <div class="doctor-info">
              <strong>${clinicConfig.doctor.name}</strong> • ${clinicConfig.doctor.degree}<br>
              <span style="color: #2563eb; font-weight: 500;">${clinicConfig.doctor.specialty}</span>
            </div>
          </div>

          <div class="patient-bar">
            <div><strong>Patient ID:</strong> ${selectedToken.pid}</div>
            <div><strong>Patient:</strong> ${selectedToken.name}</div>
            <div><strong>Age/Gender:</strong> ${selectedToken.age} Yrs / ${selectedToken.gender}</div>
            <div><strong>Phone:</strong> ${selectedToken.phone || "N/A"}</div>
            <div><strong>Token:</strong> #${selectedToken.tokenNumber}</div>
            <div><strong>Date/Time:</strong> ${new Date().toLocaleDateString('en-GB')} ${selectedToken.time}</div>
          </div>

          <div class="content-grid">
            ${selectedToken.vitals.bp || selectedToken.vitals.temp || selectedToken.vitals.weight ? `
              <div>
                <div class="section-title">Vitals / وائٹلز</div>
                <div style="font-size: 13px; display: flex; gap: 20px;">
                  ${selectedToken.vitals.bp ? `<span><strong>BP:</strong> ${selectedToken.vitals.bp}</span>` : ""}
                  ${selectedToken.vitals.temp ? `<span><strong>Temp:</strong> ${selectedToken.vitals.temp}</span>` : ""}
                  ${selectedToken.vitals.weight ? `<span><strong>Weight:</strong> ${selectedToken.vitals.weight}kg</span>` : ""}
                </div>
              </div>
            ` : ""}

            <div>
              <div class="section-title">Complaints &amp; Symptoms / علامات</div>
              <div style="font-size: 14px; padding-left: 5px;">${prescription.complaints || "Routine Checkup"}</div>
            </div>

            <div>
              <div class="section-title">Diagnosis / تشخیص</div>
              <div style="font-size: 14px; padding-left: 5px; font-weight: 500;">${prescription.Diagnosis || "Under Observation"}</div>
            </div>

            <div style="margin-top: 15px;">
              <div class="rx-symbol">Rx</div>
              <div class="medicines-text">${prescription.medicines || "No medicines prescribed."}</div>
            </div>
          </div>

          <div class="footer">
            📞 Phone: ${clinicConfig.contact.phone} • 📍 Address: ${clinicConfig.contact.address}<br>
            <span style="font-size: 10px; color: #cbd5e1; margin-top: 5px; display: block;">Generated by Smart Clinic ERP</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(prescriptionHTML);
    printWindow.document.close();

    setTokenList(prev => prev.filter(p => p.tokenNumber !== selectedToken.tokenNumber));
    setSelectedToken(null);
    setPrescription({ complaints: "", Diagnosis: "", medicines: "" });
  };

  const currentPatientHistory = selectedToken 
    ? visitsHistory.filter(v => v.pid === selectedToken.pid) 
    : [];

  return (
    <div className="space-y-8 mt-4">
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <span>🔔</span>
          <p className="text-xs font-bold">{alertMessage}</p>
        </div>
      )}

      {/* Quick Search */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-md text-white relative">
        <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">
          🔍 Search Returning Patient (پرانے مریض تلاش کریں)
        </h4>
        <p className="text-xs text-blue-100 mb-3">Type Name, Phone or Patient ID (PID) to quickly re-register without typing details.</p>
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            placeholder="e.g. Ali, 03001234567, PID-1002" 
            className="w-full px-4 py-2.5 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {showSearchResults && filteredPatients.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-52 overflow-y-auto z-10 text-slate-800">
              {filteredPatients.map(p => (
                <div 
                  key={p.pid} 
                  onClick={() => handleSelectReturning(p)}
                  className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-xs"
                >
                  <div>
                    <span className="font-extrabold text-blue-600 block">{p.name} ({p.gender})</span>
                    <span className="text-slate-400 font-medium">Age: {p.age} • Phone: {p.phone || "N/A"}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-bold text-[10px]">
                    {p.pid}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Form Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📝 New Patient Entry
            </h3>
            {selectedExistingPid && (
              <button 
                onClick={() => {
                  setSelectedExistingPid(null);
                  setName("");
                  setAge("");
                  setPhone("");
                  setGender("Male");
                }}
                className="text-[10px] text-red-500 font-extrabold border border-red-200 px-2 py-0.5 rounded-md hover:bg-red-50"
              >
                Clear Auto-Fill
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedExistingPid && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
                <span>🔄 Registering Existing PID:</span>
                <span className="bg-amber-100 px-1.5 py-0.5 rounded">{selectedExistingPid}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Muhammad Ali" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age *</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-blue-600 block mb-2">🩺 Vitals Check (Optional)</span>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={vitals.bp} onChange={(e) => setVitals({...vitals, bp: e.target.value})} placeholder="BP (120/80)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                <input type="text" value={vitals.temp} onChange={(e) => setVitals({...vitals, temp: e.target.value})} placeholder="Temp (98F)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                <input type="text" value={vitals.weight} onChange={(e) => setVitals({...vitals, weight: e.target.value})} placeholder="Weight (kg)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-blue-200 mt-2">
              🎟️ Issue Token &amp; Save
            </button>
          </form>
        </div>

        {/* Live Active Token Queue Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              ⏳ Active OPD Queue ({tokenList.length})
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
              Today's Fee: {clinicConfig.doctor.consultationFee} PKR
            </span>
          </div>

          {tokenList.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <p className="text-2xl mb-1">📭</p>
              <p className="text-sm font-semibold text-slate-400">No patients in queue yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Fill the form to generate a token number.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {tokenList.map((token) => (
                <div key={token.tokenNumber} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/60 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center font-black shadow-sm">
                      <span className="text-[10px] uppercase opacity-75 leading-none font-bold">Token</span>
                      <span className="text-lg leading-none mt-0.5">#{token.tokenNumber}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{token.name}</h4>
                        <span className="bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                          {token.pid}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {token.gender}, {token.age} Yrs • <span className="text-slate-400">{token.time}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {token.vitals.bp && <span className="text-[11px] bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-md border border-red-100">❤️ {token.vitals.bp}</span>}
                    {token.vitals.temp && <span className="text-[11px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-md border border-amber-100">🌡️ {token.vitals.temp}</span>}
                    {token.vitals.weight && <span className="text-[11px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-md border border-emerald-100">⚖️ {token.vitals.weight} kg</span>}
                    
                    <button onClick={() => handleCheck(token)} className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-sm px-3 py-1.5 rounded-lg ml-2 transition-colors">
                      Check ➡️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Doctor Prescription Checkup Desk with EHR Timeline */}
      {selectedToken && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
            <div>
              <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                Active Examination Desk
              </span>
              <h3 className="text-lg font-black mt-1.5">
                Checking: {selectedToken.name} (Token #{selectedToken.tokenNumber})
              </h3>
            </div>
            <button onClick={() => setSelectedToken(null)} className="text-xs font-bold text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl transition-colors">
              ❌ Close Desk
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 division-x divide-slate-200">
            
            {/* LEFT SIDEBAR: Patient Demographics & EHR Medical History Timeline (4 Cols) */}
            <div className="lg:col-span-4 bg-slate-50/60 p-6 border-r border-slate-200 flex flex-col h-[520px]">
              {/* Demographics Summary */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 mb-2 flex justify-between items-center">
                  <span>📋 Patient Demographics</span>
                  <span className="text-blue-600 font-black">{selectedToken.pid}</span>
                </h4>
                <p><strong className="text-slate-500">Gender/Age:</strong> {selectedToken.gender}, {selectedToken.age} Years</p>
                <p><strong className="text-slate-500">Phone:</strong> {selectedToken.phone || "N/A"}</p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                  <p className="font-semibold text-slate-700">Initial Vitals:</p>
                  <p>❤️ BP: {selectedToken.vitals.bp || "Not Checked"}</p>
                  <p>🌡️ Temp: {selectedToken.vitals.temp || "Not Checked"}</p>
                  <p>⚖️ Weight: {selectedToken.vitals.weight ? `${selectedToken.vitals.weight} kg` : "Not Checked"}</p>
                </div>
              </div>

              {/* EHR Medical History Timeline */}
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>📜 Medical History Timeline</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                    {currentPatientHistory.length} Previous Visits
                  </span>
                </h4>

                {currentPatientHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white p-6 text-center">
                    <p className="text-lg">🆕</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">First Time Visit</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No previous visits recorded for this patient yet.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
                    {currentPatientHistory.map((visit) => (
                      <div key={visit.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all relative">
                        <div className="absolute left-[-11px] top-5 w-2 h-2 rounded-full bg-blue-500"></div>
                        
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded text-[10px]">
                            📅 {visit.date}
                          </span>
                          <button 
                            onClick={() => handleCloneVisit(visit)}
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline"
                            title="Copy previous complaints, diagnosis & medicines to current prescription"
                          >
                            📋 Copy Rx (پرانی دوا کاپی کریں)
                          </button>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-600">
                          <p><strong className="text-slate-800">Complaints:</strong> {visit.complaints}</p>
                          <p><strong className="text-slate-800">Diagnosis:</strong> {visit.diagnosis}</p>
                          <p className="bg-slate-50 p-1.5 rounded text-slate-700 font-mono text-[10px] mt-1 whitespace-pre-wrap border-l-2 border-blue-400">
                            {visit.medicines}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Dynamic Treatment Form Area (8 Cols) */}
            <div className="lg:col-span-8 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Complaints / Symptoms</label>
                  <textarea rows={3} value={prescription.complaints} onChange={(e) => setPrescription({...prescription, complaints: e.target.value})} placeholder="e.g. Fever since 2 days, Cough, Body aches" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Diagnosis</label>
                  <textarea rows={3} value={prescription.Diagnosis} onChange={(e) => setPrescription({...prescription, Diagnosis: e.target.value})} placeholder="e.g. Acute Viral Infection" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Rx - Treatment &amp; Medicines (نسخہ تجویز کریں)</label>
                  <span className="text-[10px] text-slate-400 font-medium">Tips: Start each medicine in a new line</span>
                </div>
                <textarea rows={6} value={prescription.medicines} onChange={(e) => setPrescription({...prescription, medicines: e.target.value})} placeholder="e.g.&#10;1. Tab Paracetamol 500mg -- 1+1+1 (5 days)&#10;2. Syp Hydryll -- 2 tsp thrice daily" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-md shadow-emerald-100 flex items-center gap-2">
                  🖨️ Save Checkup &amp; Print Prescription
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}