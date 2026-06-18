"use client";

import { useState, useEffect } from "react";
import { clinicConfig } from "./clinicConfig";

interface Patient {
  pid: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  vitals: { bp: string; temp: string; weight: string };
}

interface QueueItem extends Patient {
  tokenNumber: number;
  time: string;
}

export default function PatientForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [vitals, setVitals] = useState({ bp: "", temp: "", weight: "" });
  
  // لائیو کیو اور کاؤنٹرز کی سٹیٹ
  const [tokenList, setTokenList] = useState<QueueItem[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);
  const [pidCounter, setPidCounter] = useState(1001);
  const [patientsDb, setPatientsDb] = useState<Patient[]>([]); // مستقل مریضوں کا ڈیٹا بیس
  
  // سرچ اور سلیکشن کی سٹیٹ
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedReturning, setSelectedReturning] = useState<Patient | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null);
  const [prescription, setPrescription] = useState({ complaints: "", Diagnosis: "", medicines: "" });

  // 💾 لوکل اسٹوریج سے ڈیٹا لوڈ کرنے کا اثر (Next.js Hydration Safe)
  useEffect(() => {
    const savedQueue = localStorage.getItem("smart_clinic_active_queue");
    if (savedQueue) setTokenList(JSON.parse(savedQueue));

    const savedTokenCounter = localStorage.getItem("smart_clinic_token_counter");
    if (savedTokenCounter) setTokenCounter(parseInt(savedTokenCounter));

    const savedPidCounter = localStorage.getItem("smart_clinic_pid_counter");
    if (savedPidCounter) setPidCounter(parseInt(savedPidCounter));

    const savedPatientsDb = localStorage.getItem("smart_clinic_patients_db");
    if (savedPatientsDb) setPatientsDb(JSON.parse(savedPatientsDb));
  }, []);

  // 🔍 واپس آنے والے مریض کو تلاش کرنے کا فنکشن
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = patientsDb.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone.includes(query) ||
      p.pid.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // پرانے مریض کو سلیکٹ کر کے فارم آٹو فل کرنا
  const selectReturningPatient = (patient: Patient) => {
    setSelectedReturning(patient);
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender);
    setPhone(patient.phone);
    setSearchResults([]);
    setSearchQuery("");
  };

  // فارم کو دوبارہ خالی (Reset) کرنا
  const handleClearForm = () => {
    setSelectedReturning(null);
    setName("");
    setAge("");
    setGender("Male");
    setPhone("");
    setVitals({ bp: "", temp: "", weight: "" });
  };

  // 📝 نیا ٹوکن اور رجسٹریشن سبمٹ کرنا
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) return alert("Please enter Patient Name and Age");

    let finalPid = "";
    let isNewPatient = false;

    if (selectedReturning) {
      // اگر پرانا مریض ہے تو وہی پرانا PID استعمال کریں گے
      finalPid = selectedReturning.pid;
    } else {
      // اگر بالکل نیا مریض ہے تو نیا PID جنریٹ ہوگا
      finalPid = `PID-${pidCounter}`;
      isNewPatient = true;
    }

    const newToken: QueueItem = {
      tokenNumber: tokenCounter,
      pid: finalPid,
      name,
      age,
      gender,
      phone,
      vitals,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. ایکٹو کیو اپڈیٹ کریں
    const updatedQueue = [newToken, ...tokenList];
    setTokenList(updatedQueue);
    localStorage.setItem("smart_clinic_active_queue", JSON.stringify(updatedQueue));

    // 2. اگر نیا مریض تھا تو اسے اپنے لائف ٹائم ڈیٹا بیس میں سیو کریں
    if (isNewPatient) {
      const newPatientRecord: Patient = {
        pid: finalPid,
        name,
        age,
        gender,
        phone,
        vitals
      };
      const updatedDb = [newPatientRecord, ...patientsDb];
      setPatientsDb(updatedDb);
      localStorage.setItem("smart_clinic_patients_db", JSON.stringify(updatedDb));

      // PID کاؤنٹر بڑھائیں
      const nextPid = pidCounter + 1;
      setPidCounter(nextPid);
      localStorage.setItem("smart_clinic_pid_counter", nextPid.toString());
    }

    // 3. ٹوکن کاؤنٹر بڑھائیں
    const nextToken = tokenCounter + 1;
    setTokenCounter(nextToken);
    localStorage.setItem("smart_clinic_token_counter", nextToken.toString());

    // فارم ری سیٹ کریں
    handleClearForm();
  };

  const handleCheck = (patient: QueueItem) => {
    setSelectedPatient(patient);
    setPrescription({ complaints: "", Diagnosis: "", medicines: "" });
  };

  // 🖨️ لائیو پرچی پرنٹ کرنے کا جادوئی فنکشن (With PID Support)
  const handlePrint = () => {
    if (!selectedPatient) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups for this website to print prescriptions");

    const prescriptionHTML = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 15px; margin-bottom: 30px; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #2563eb; margin: 0; }
            .clinic-tagline { font-size: 14px; color: #64748b; font-style: italic; margin: 5px 0 0 0; }
            .doctor-info { margin-top: 10px; font-size: 14px; color: #1e293b; }
            
            .patient-bar { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 35px; font-size: 14px; flex-wrap: wrap; gap: 10px; }
            .patient-bar strong { color: #0f172a; }
            
            .content-grid { display: grid; grid-template-columns: 1fr; gap: 25px; }
            .section-title { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 10px; tracking-spacing: 1px; }
            
            .rx-symbol { font-size: 24px; font-weight: bold; color: #2563eb; font-family: 'Times New Roman', serif; margin-bottom: 10px; }
            .medicines-text { font-family: monospace; font-size: 15px; white-space: pre-wrap; padding-left: 10px; color: #0f172a; }
            
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; border-top: 1px solid #e2e8f0; pt: 10px; font-size: 12px; color: #94a3b8; }
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
            <div><strong>PID:</strong> <span style="font-family: monospace; font-weight: bold; color: #2563eb;">${selectedPatient.pid}</span></div>
            <div><strong>Patient:</strong> ${selectedPatient.name}</div>
            <div><strong>Age/Gender:</strong> ${selectedPatient.age} Yrs / ${selectedPatient.gender}</div>
            <div><strong>Token:</strong> #${selectedPatient.tokenNumber}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
          </div>

          <div class="content-grid">
            ${selectedPatient.vitals.bp || selectedPatient.vitals.temp || selectedPatient.vitals.weight ? `
              <div>
                <div class="section-title">Vitals / وائٹلز</div>
                <div style="font-size: 13px; display: flex; gap: 20px;">
                  ${selectedPatient.vitals.bp ? `<span><strong>BP:</strong> ${selectedPatient.vitals.bp}</span>` : ""}
                  ${selectedPatient.vitals.temp ? `<span><strong>Temp:</strong> ${selectedPatient.vitals.temp}</span>` : ""}
                  ${selectedPatient.vitals.weight ? `<span><strong>Weight:</strong> ${selectedPatient.vitals.weight}kg</span>` : ""}
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

    // مریض کا چیک اپ مکمل ہونے پر کیو سے ہٹانا اور محفوظ کرنا
    const updatedQueue = tokenList.filter(p => p.tokenNumber !== selectedPatient.tokenNumber);
    setTokenList(updatedQueue);
    localStorage.setItem("smart_clinic_active_queue", JSON.stringify(updatedQueue));
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-8 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Patient Registration Form Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📝 New Patient Entry
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {selectedReturning ? `Using: ${selectedReturning.pid}` : `Next: PID-${pidCounter}`}
            </span>
          </div>

          {/* ریٹرننگ پیشنٹ کو فوری تلاش کرنے کا فریم */}
          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">🔍 Quick Search Returning Patient</label>
            <input
              type="text"
              placeholder="Search by PID (e.g. PID-1001) or Phone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-sm">
                {searchResults.map((p) => (
                  <button
                    key={p.pid}
                    type="button"
                    onClick={() => selectReturningPatient(p)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50/50 flex justify-between items-center transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-700">{p.name}</span>{" "}
                      <span className="text-slate-400">({p.gender}, {p.age} Yrs)</span>
                    </div>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">{p.pid}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedReturning && (
              <div className="mt-2 flex items-center justify-between bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-100 font-semibold">
                <span>🔄 Returning: {selectedReturning.name} ({selectedReturning.pid})</span>
                <button type="button" onClick={handleClearForm} className="text-red-500 hover:text-red-700 font-bold ml-2">Clear ❌</button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* 2. Live Active Token Queue Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              ⏳ Active OPD Queue ({tokenList.length})
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">Today's Fee: {clinicConfig.doctor.consultationFee} PKR</span>
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
                        <span className="bg-slate-200/70 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">{token.pid}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
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

      {/* 3. Dynamic Doctor Prescription Checkup Desk */}
      {selectedPatient && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-md transition-all">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
            <div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Active Examination Desk
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Checking: {selectedPatient.name} ({selectedPatient.pid} / Token #{selectedPatient.tokenNumber})
              </h3>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl">
              ❌ Close Desk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
              <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">📋 Patient Demographics</h4>
              <p><strong className="text-slate-500">Patient PID:</strong> <span className="font-mono font-bold text-blue-600">{selectedPatient.pid}</span></p>
              <p><strong className="text-slate-500">Gender/Age:</strong> {selectedPatient.gender}, {selectedPatient.age} Years</p>
              <p><strong className="text-slate-500">Phone:</strong> {selectedPatient.phone || "N/A"}</p>
              <p><strong className="text-slate-500">Check-in Time:</strong> {selectedPatient.time}</p>
              <div className="mt-4 pt-2 border-t border-slate-200 space-y-1">
                <p className="font-semibold text-slate-700">Initial Vitals:</p>
                <p>❤️ BP: {selectedPatient.vitals.bp || "Not Checked"}</p>
                <p>🌡️ Temp: {selectedPatient.vitals.temp || "Not Checked"}</p>
                <p>⚖️ Weight: {selectedPatient.vitals.weight ? `${selectedPatient.vitals.weight} kg` : "Not Checked"}</p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Complaints / Symptoms</label>
                  <textarea rows={2} value={prescription.complaints} onChange={(e) => setPrescription({...prescription, complaints: e.target.value})} placeholder="e.g. Fever since 2 days, Cough, Body aches" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Diagnosis</label>
                  <textarea rows={2} value={prescription.Diagnosis} onChange={(e) => setPrescription({...prescription, Diagnosis: e.target.value})} placeholder="e.g. Acute Viral Infection" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rx - Treatment &amp; Medicines</label>
                <textarea rows={3} value={prescription.medicines} onChange={(e) => setPrescription({...prescription, medicines: e.target.value})} placeholder="e.g. 1. Tab Paracetamol 500mg -- 1+1+1 (5 days)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors shadow-md shadow-emerald-100">
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