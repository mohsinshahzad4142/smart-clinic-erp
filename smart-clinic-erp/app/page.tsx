"use client";

import { useState, useEffect } from "react";

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

interface LabTest {
  id: string;
  name: string;
  category: string;
  price: number;
  referenceRange: string;
}

interface LabReport {
  id: string;
  patientName: string;
  pid: string;
  testName: string;
  resultValue: string;
  date: string;
  status: string;
}

interface Medicine {
  id: string;
  name: string;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStockAlert: number;
}

interface Invoice {
  id: string;
  patientName: string;
  pid: string;
  opdFee: number;
  pharmacyTotal: number;
  labTotal: number;
  discount: number;
  grandTotal: number;
  date: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // --- ROLE MANAGEMENT STATES ---
  const [userRole, setUserRole] = useState<"doctor" | "receptionist" | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- CORE DATA STATES ---
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsHistory, setVisitsHistory] = useState<Visit[]>([]);
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Pharmacy Stock State
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: "MED-1", name: "Tab Paracetamol 500mg", wholesalePrice: 1.5, retailPrice: 3, stock: 120, minStockAlert: 50 },
    { id: "MED-2", name: "Syp Hydryll 120ml", wholesalePrice: 45, retailPrice: 65, stock: 15, minStockAlert: 20 },
    { id: "MED-3", name: "Cap Amoxicillin 250mg", wholesalePrice: 8, retailPrice: 12, stock: 250, minStockAlert: 100 },
  ]);

  // Lab Tests Catalog State
  const [labTestsCatalog, setLabTestsCatalog] = useState<LabTest[]>([
    { id: "LAB-1", name: "Complete Blood Count (CBC)", category: "Hematology", price: 800, referenceRange: "Hb: 12-16 g/dL" },
    { id: "LAB-2", name: "Blood Sugar Fasting (BSF)", category: "Biochemistry", price: 200, referenceRange: "70-110 mg/dL" },
    { id: "LAB-3", name: "Lipid Profile", category: "Biochemistry", price: 1500, referenceRange: "Cholesterol < 200 mg/dL" },
  ]);

  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [billingRecords, setBillingRecords] = useState<Invoice[]>([]);

  // --- FORM INPUT STATES ---
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientVitals, setPatientVitals] = useState({ bp: "", temp: "", weight: "" });
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Exam Desk Form
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [prescription, setPrescription] = useState({ complaints: "", Diagnosis: "", medicines: "" });

  // --- SMART SUGGESTIONS STATE ---
  const [suggestedSymptoms, setSuggestedSymptoms] = useState<string[]>([
    "Fever", "Dry Cough", "Runny Nose", "Sore Throat", "Body Aches", "Headache", "Diarrhea", "Shortness of Breath", "Stomach Pain"
  ]);
  const [suggestedDiagnoses, setSuggestedDiagnoses] = useState<string[]>([
    "Acute Viral Infection", "Upper Respiratory Tract Infection (URTI)", "Typhoid Fever", "Gastroenteritis", "Essential Hypertension", "Type 2 Diabetes Mellitus"
  ]);
  const [suggestedMedicines, setSuggestedMedicines] = useState<string[]>([
    "Tab Paracetamol 500mg (1+1+1)", "Syp Hydryll 120ml (2 tsp x 3)", "Cap Amoxicillin 500mg (1+0+1)", "Tab Flagyl 400mg (1+1+1)", "Tab Ponstan 500mg (1+0+1)"
  ]);

  const [newSymptomInput, setNewSymptomInput] = useState("");
  const [newDiagnosisInput, setNewDiagnosisInput] = useState("");
  const [newMedicineInput, setNewMedicineInput] = useState("");

  // Expense Form
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Tea & Refreshments");
  const [expenseDate, setExpenseDate] = useState("");
  const [manualRevenue, setManualRevenue] = useState<number>(0);

  // Pharmacy Stock Form
  const [newMedName, setNewMedName] = useState("");
  const [newMedWS, setNewMedWS] = useState("");
  const [newMedRT, setNewMedRT] = useState("");
  const [newMedQty, setNewMedQty] = useState("");
  const [newMedAlert, setNewMedAlert] = useState("20");

  // Lab Report Form
  const [reportPatientName, setReportPatientName] = useState("");
  const [reportPid, setReportPid] = useState("");
  const [selectedLabTest, setSelectedLabTest] = useState("");
  const [testResult, setTestResult] = useState("");

  // Billing Module Form
  const [billingPid, setBillingPid] = useState("");
  const [billingPatientName, setBillingPatientName] = useState("");
  const [billingOPDFee, setBillingOPDFee] = useState(clinicConfig.doctor.consultationFee);
  const [billingPharmTotal, setBillingPharmTotal] = useState("");
  const [billingLabTotal, setBillingLabTotal] = useState("");
  const [billingDiscount, setBillingDiscount] = useState("0");

  useEffect(() => {
    setMounted(true);
    setExpenseDate(new Date().toISOString().split("T")[0]);

    const loadData = (key: string, setter: Function) => {
      const stored = localStorage.getItem(key);
      if (stored) setter(JSON.parse(stored));
    };

    loadData("sc_patients", setPatientsList);
    loadData("sc_visits", setVisitsHistory);
    loadData("sc_tokens", setTokenList);
    loadData("sc_expenses", setExpenses);
    loadData("sc_medicines", setMedicines);
    loadData("sc_lab_tests", setLabTestsCatalog);
    loadData("sc_lab_reports", setLabReports);
    loadData("sc_billing_records", setBillingRecords);

    // Load templates
    loadData("sc_suggested_symptoms", setSuggestedSymptoms);
    loadData("sc_suggested_diagnoses", setSuggestedDiagnoses);
    loadData("sc_suggested_medicines", setSuggestedMedicines);

    const storedCounter = localStorage.getItem("sc_token_counter");
    if (storedCounter) setTokenCounter(parseInt(storedCounter, 10));
    
    const storedManualRev = localStorage.getItem("sc_manual_rev");
    if (storedManualRev) setManualRevenue(Number(storedManualRev));

    const activeSessionRole = localStorage.getItem("sc_active_role");
    if (activeSessionRole === "doctor" || activeSessionRole === "receptionist") {
      setUserRole(activeSessionRole);
    }
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

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_expenses", JSON.stringify(expenses));
  }, [expenses, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_medicines", JSON.stringify(medicines));
  }, [medicines, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_lab_reports", JSON.stringify(labReports));
  }, [labReports, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_billing_records", JSON.stringify(billingRecords));
  }, [billingRecords, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_manual_rev", manualRevenue.toString());
  }, [manualRevenue, mounted]);

  // Persist template items
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_suggested_symptoms", JSON.stringify(suggestedSymptoms));
  }, [suggestedSymptoms, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_suggested_diagnoses", JSON.stringify(suggestedDiagnoses));
  }, [suggestedDiagnoses, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_suggested_medicines", JSON.stringify(suggestedMedicines));
  }, [suggestedMedicines, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-500">🏥 Loading Smart Clinic ERP Systems...</p>
        </div>
      </div>
    );
  }

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (pinInput === "4142") {
      setUserRole("doctor");
      localStorage.setItem("sc_active_role", "doctor");
      triggerAlert("🔓 Welcome Doctor Mohsin Shahzad!");
    } else if (pinInput === "1122") {
      setUserRole("receptionist");
      localStorage.setItem("sc_active_role", "receptionist");
      setActiveTab("opd"); 
      triggerAlert("🔓 Receptionist Desk Authenticated!");
    } else {
      setLoginError("❌ Incorrect PIN code! Please try again.");
    }
    setPinInput("");
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("sc_active_role");
    setSelectedToken(null);
    triggerAlert("🔒 Logged out successfully!");
  };

  const filteredPatients = searchQuery.trim() === "" 
    ? [] 
    : patientsList.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
      );

  const handleSelectReturning = (patient: Patient) => {
    setPatientName(patient.name);
    setPatientAge(patient.age);
    setPatientGender(patient.gender);
    setPatientPhone(patient.phone);
    setSelectedExistingPid(patient.pid);
    setSearchQuery("");
    setShowSearchResults(false);
    triggerAlert(`Existing Patient Selected: ${patient.name} (${patient.pid})`);
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientAge) return triggerAlert("⚠️ Please enter Patient Name and Age!");

    let finalPid = selectedExistingPid;

    if (!finalPid) {
      const generatedNumber = 1001 + patientsList.length;
      finalPid = `PID-${generatedNumber}`;
      const newPatientRecord: Patient = {
        pid: finalPid,
        name: patientName,
        age: patientAge,
        gender: patientGender,
        phone: patientPhone
      };
      setPatientsList(prev => [newPatientRecord, ...prev]);
    }

    const newToken: Token = {
      tokenNumber: tokenCounter,
      pid: finalPid,
      name: patientName,
      age: patientAge,
      gender: patientGender,
      phone: patientPhone,
      vitals: patientVitals,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTokenList(prev => [newToken, ...prev]);
    setTokenCounter(prev => prev + 1);

    setPatientName("");
    setPatientAge("");
    setPatientPhone("");
    setPatientVitals({ bp: "", temp: "", weight: "" });
    setSelectedExistingPid(null);
    triggerAlert(`🎟️ Token #${tokenCounter} Issued Successfully for PID: ${finalPid}`);
  };

  const handleCheckPatient = (token: Token) => {
    if (userRole !== "doctor") {
      return triggerAlert("🔒 Access Denied: Only Doctor can examine patients!");
    }
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

  const appendSymptom = (sym: string) => {
    setPrescription(prev => {
      const current = prev.complaints.trim();
      const updated = current ? `${current}, ${sym}` : sym;
      return { ...prev, complaints: updated };
    });
  };

  const appendDiagnosis = (diag: string) => {
    setPrescription(prev => {
      const current = prev.Diagnosis.trim();
      const updated = current ? `${current}, ${diag}` : diag;
      return { ...prev, Diagnosis: updated };
    });
  };

  const appendMedicine = (med: string) => {
    setPrescription(prev => {
      const current = prev.medicines.trim();
      const lines = current ? current.split('\n').filter(l => l.trim() !== '') : [];
      const nextIndex = lines.length + 1;
      const cleanMed = med.replace(/^\d+\.\s*/, ''); // Remove numbering if already exists
      const formattedMed = `${nextIndex}. ${cleanMed}`;
      const updated = current ? `${current}\n${formattedMed}` : formattedMed;
      return { ...prev, medicines: updated };
    });
  };

  const addNewSymptomTemplate = () => {
    if (!newSymptomInput.trim()) return;
    if (suggestedSymptoms.includes(newSymptomInput.trim())) return;
    setSuggestedSymptoms(prev => [...prev, newSymptomInput.trim()]);
    setNewSymptomInput("");
    triggerAlert("✨ New Symptom template added!");
  };

  const addNewDiagnosisTemplate = () => {
    if (!newDiagnosisInput.trim()) return;
    if (suggestedDiagnoses.includes(newDiagnosisInput.trim())) return;
    setSuggestedDiagnoses(prev => [...prev, newDiagnosisInput.trim()]);
    setNewDiagnosisInput("");
    triggerAlert("✨ New Diagnosis template added!");
  };

  const addNewMedicineTemplate = () => {
    if (!newMedicineInput.trim()) return;
    if (suggestedMedicines.includes(newMedicineInput.trim())) return;
    setSuggestedMedicines(prev => [...prev, newMedicineInput.trim()]);
    setNewMedicineInput("");
    triggerAlert("✨ New Medicine template added!");
  };

  const deleteSymptomTemplate = (sym: string) => {
    setSuggestedSymptoms(prev => prev.filter(s => s !== sym));
  };

  const deleteDiagnosisTemplate = (diag: string) => {
    setSuggestedDiagnoses(prev => prev.filter(d => d !== diag));
  };

  const deleteMedicineTemplate = (med: string) => {
    setSuggestedMedicines(prev => prev.filter(m => m !== med));
  };

  const handlePrintPrescription = () => {
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
    if (!printWindow) return triggerAlert("⚠️ Please allow popups to print prescriptions");

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
                <div class="section-title">Vitals</div>
                <div style="font-size: 13px; display: flex; gap: 20px;">
                  ${selectedToken.vitals.bp ? `<span><strong>BP:</strong> ${selectedToken.vitals.bp}</span>` : ""}
                  ${selectedToken.vitals.temp ? `<span><strong>Temp:</strong> ${selectedToken.vitals.temp}</span>` : ""}
                  ${selectedToken.vitals.weight ? `<span><strong>Weight:</strong> ${selectedToken.vitals.weight}kg</span>` : ""}
                </div>
              </div>
            ` : ""}

            <div>
              <div class="section-title">Complaints &amp; Symptoms</div>
              <div style="font-size: 14px; padding-left: 5px;">${prescription.complaints || "Routine Checkup"}</div>
            </div>

            <div>
              <div class="section-title">Diagnosis</div>
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

  const handleAddLabReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPatientName || !selectedLabTest || !testResult) {
      return triggerAlert("⚠️ Please fill all Laboratory fields!");
    }

    const testObject = labTestsCatalog.find(t => t.id === selectedLabTest);
    if (!testObject) return;

    const newReport: LabReport = {
      id: `LAB-REP-${Date.now()}`,
      patientName: reportPatientName,
      pid: reportPid || "Walk-In",
      testName: testObject.name,
      resultValue: testResult,
      date: new Date().toLocaleDateString('en-GB'),
      status: "Verified",
    };

    setLabReports(prev => [newReport, ...prev]);
    setReportPatientName("");
    setReportPid("");
    setTestResult("");
    triggerAlert("🔬 Lab Report generated and verified successfully!");
  };

  const handlePrintLabReport = (rep: LabReport) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return triggerAlert("⚠️ Please allow popups to print laboratory reports!");

    const testObject = labTestsCatalog.find(t => t.name === rep.testName);

    const reportHTML = `
      <html>
        <head>
          <title>Lab Report - ${rep.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .report-title { font-size: 22px; font-weight: bold; color: #2563eb; text-transform: uppercase; }
            .info-table { width: 100%; margin-bottom: 30px; font-size: 14px; border-collapse: collapse; }
            .info-table td { padding: 6px; }
            .result-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            .result-table th, .result-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            .result-table th { bg-color: #f8fafc; color: #1e3a8a; }
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🧪 ${clinicConfig.clinicName} (Diagnostics)</h2>
            <p>${clinicConfig.contact.address} • Phone: ${clinicConfig.contact.phone}</p>
            <div class="report-title">Laboratory Investigation Report</div>
          </div>
          
          <table class="info-table">
            <tr>
              <td><strong>Patient Name:</strong> ${rep.patientName}</td>
              <td><strong>Patient ID (PID):</strong> ${rep.pid}</td>
            </tr>
            <tr>
              <td><strong>Report Date:</strong> ${rep.date}</td>
              <td><strong>Status:</strong> ${rep.status}</td>
            </tr>
          </table>

          <table class="result-table">
            <thead>
              <tr>
                <th>Test Investigation</th>
                <th>Observed Result Value</th>
                <th>Normal Reference Range</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${rep.testName}</strong></td>
                <td style="font-size: 16px; font-weight: bold; color: #1e3a8a;">${rep.resultValue}</td>
                <td>${testObject?.referenceRange || "Standard"}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Report clinically correlated & verified by ${clinicConfig.doctor.name} (${clinicConfig.doctor.degree})
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

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedWS || !newMedRT || !newMedQty) {
      return triggerAlert("⚠️ Please fill all medicine details!");
    }

    const newMed: Medicine = {
      id: `MED-${Date.now()}`,
      name: newMedName,
      wholesalePrice: parseFloat(newMedWS),
      retailPrice: parseFloat(newMedRT),
      stock: parseInt(newMedQty, 10),
      minStockAlert: parseInt(newMedAlert, 10)
    };

    setMedicines(prev => [newMed, ...prev]);
    setNewMedName("");
    setNewMedWS("");
    setNewMedRT("");
    setNewMedQty("");
    triggerAlert("📦 Medicine stock recorded successfully!");
  };

  const handleUpdateStock = (id: string, amount: number) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, stock: Math.max(0, m.stock + amount) };
      }
      return m;
    }));
    triggerAlert("🔄 Inventory stock level adjusted!");
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPatientName) return triggerAlert("⚠️ Please enter Patient Name!");

    const opd = parseFloat(billingOPDFee.toString()) || 0;
    const pharm = parseFloat(billingPharmTotal) || 0;
    const lab = parseFloat(billingLabTotal) || 0;
    const disc = parseFloat(billingDiscount) || 0;

    const total = (opd + pharm + lab) - disc;

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      patientName: billingPatientName,
      pid: billingPid || "Walk-In",
      opdFee: opd,
      pharmacyTotal: pharm,
      labTotal: lab,
      discount: disc,
      grandTotal: total,
      date: new Date().toLocaleDateString('en-GB'),
    };

    setBillingRecords(prev => [newInvoice, ...prev]);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return triggerAlert("⚠️ Please allow popups to print invoices");

    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - ${billingPatientName}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 280px; font-size: 12px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-10 { margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3>🏥 ${clinicConfig.clinicName}</h3>
            <p>${clinicConfig.contact.address}<br>Phone: ${clinicConfig.contact.phone}</p>
            <p class="bold border-b">THERMAL TRANSACTION INVOICE</p>
          </div>

          <div class="border-b">
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
            <div><strong>Invoice ID:</strong> ${newInvoice.id}</div>
            <div><strong>Patient ID:</strong> ${newInvoice.pid}</div>
            <div><strong>Patient:</strong> ${newInvoice.patientName}</div>
          </div>

          <div class="border-b">
            <div class="flex"><span>OPD Doctor Fee:</span><span>${opd} PKR</span></div>
            <div class="flex"><span>Pharmacy Charges:</span><span>${pharm} PKR</span></div>
            <div class="flex"><span>Laboratory Tests:</span><span>${lab} PKR</span></div>
          </div>

          <div class="border-b">
            <div class="flex"><span>Sub-Total:</span><span>${opd + pharm + lab} PKR</span></div>
            <div class="flex"><span>Discount Given:</span><span>-${disc} PKR</span></div>
            <div class="flex bold"><span>GRAND TOTAL:</span><span>${total} PKR</span></div>
          </div>

          <div class="center mt-10">
            <p class="bold">Thank You for choosing us!</p>
            <p style="font-size: 9px; color: #555;">Software built by Smart Clinic ERP</p>
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

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    setBillingPid("");
    setBillingPatientName("");
    setBillingPharmTotal("");
    setBillingLabTotal("");
    setBillingDiscount("0");
    triggerAlert("💳 Invoice logged & printed successfully!");
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return triggerAlert("⚠️ Please enter Title and Amount!");

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: expenseDate,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setExpenseTitle("");
    setExpenseAmount("");
    triggerAlert("💸 Expense Logged Successfully!");
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    triggerAlert("🗑️ Expense Record Deleted!");
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const autoOPDRevenue = visitsHistory.length * (clinicConfig.doctor.consultationFee || 500);
  
  const autoLabRevenue = billingRecords.reduce((sum, rec) => sum + (rec.labTotal || 0), 0);
  const autoPharmRevenue = billingRecords.reduce((sum, rec) => sum + (rec.pharmacyTotal || 0), 0);
  
  const totalRevenue = autoOPDRevenue + autoLabRevenue + autoPharmRevenue + manualRevenue;
  const netProfit = totalRevenue - totalExpenses;

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 text-center">
          <span className="text-5xl block animate-pulse">🏥</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4">
            {clinicConfig.clinicName}
          </h2>
          <p className="text-xs text-blue-600 font-extrabold tracking-widest uppercase mt-1">Smart Security Gateway</p>
          <p className="text-xs text-slate-500 mt-2">
            Please enter your security PIN code to access the ERP terminal dashboard.
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-8 space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                🔒 Security PIN Code
              </label>
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••" 
                className="w-full bg-slate-100 text-slate-900 text-center text-2xl tracking-widest font-black py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            {loginError && (
              <p className="text-red-500 font-bold text-xs text-center bg-red-50 py-2 rounded-xl">
                {loginError}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-2xl text-sm transition-colors shadow-lg shadow-blue-500/20"
            >
              Verify PIN &amp; Unlock Software
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
            <p>💡 Hint: Doctor PIN: <strong className="text-slate-600">4142</strong> | Receptionist PIN: <strong className="text-slate-600">1122</strong></p>
            <p>© {new Date().getFullYear()} • Securely Managed ERP System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-blue-600 flex items-center gap-2">
                🏥 {clinicConfig.clinicName}
              </h1>
              {userRole === "doctor" ? (
                <span className="bg-blue-100 text-blue-700 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">Doctor Desk</span>
              ) : (
                <span className="bg-amber-100 text-amber-800 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">Receptionist Desk</span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{clinicConfig.tagline}</p>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {userRole === "doctor" && (
              <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "dashboard" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>📊 Dash</button>
            )}
            
            <button onClick={() => setActiveTab("opd")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "opd" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>🎫 OPD &amp; Queue</button>
            
            {userRole === "doctor" && (
              <button onClick={() => setActiveTab("lab")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "lab" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>🔬 Lab Tests</button>
            )}

            {userRole === "doctor" && (
              <button onClick={() => setActiveTab("pharmacy")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "pharmacy" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>📦 Pharmacy</button>
            )}

            <button onClick={() => setActiveTab("billing")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "billing" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>💳 Billing Engine</button>
            
            {userRole === "doctor" && (
              <button onClick={() => setActiveTab("expense")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "expense" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>💸 Expenses Ledger</button>
            )}

            <button 
              onClick={handleLogout} 
              className="text-xs text-red-600 hover:bg-red-50 font-black px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-200"
              title="Click to lock the ERP console"
            >
              🔒 Lock Screen
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {alertMessage && (
          <div className="fixed top-4 right-4 z-50 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
            <span>🔔</span>
            <p className="text-xs font-bold">{alertMessage}</p>
          </div>
        )}

        {/* --- DASHBOARD VIEW --- */}
        {}
        {activeTab === "dashboard" && userRole === "doctor" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-blue-700/50">
              <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Welcome Back
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-3">{clinicConfig.doctor.name}</h2>
              <p className="text-blue-100 font-medium text-sm mt-1">{clinicConfig.doctor.specialty} — <span className="text-xs opacity-90">{clinicConfig.doctor.degree}</span></p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                  <span>📍</span>
                  <div>
                    <p className="text-blue-200">Location</p>
                    <p className="font-semibold truncate">{clinicConfig.contact.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                  <span>📞</span>
                  <div>
                    <p className="text-blue-200">Contact</p>
                    <p className="font-semibold">{clinicConfig.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                  <span>💵</span>
                  <div>
                    <p className="text-blue-200">OPD Fee</p>
                    <p className="font-semibold">{clinicConfig.doctor.consultationFee} {clinicConfig.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">OPD Patients Checked</span>
                <h3 className="text-2xl font-black text-slate-950 mt-1">{visitsHistory.length} <span className="text-xs font-normal text-slate-400">Visits</span></h3>
                <p className="text-[10px] text-slate-400 mt-1">Total visits recorded dynamically</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Total Clinic Revenue</span>
                <h3 className="text-2xl font-black text-slate-950 mt-1">{totalRevenue} <span className="text-xs font-normal text-slate-400">PKR</span></h3>
                <p className="text-[10px] text-slate-400 mt-1">OPD + Pharmacy + Lab + Manual</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Total Daily Expenses</span>
                <h3 className="text-2xl font-black text-slate-950 mt-1">{totalExpenses} <span className="text-xs font-normal text-slate-400">PKR</span></h3>
                <p className="text-[10px] text-slate-400 mt-1">Logs recorded inside ledger</p>
              </div>

              <div className={`p-5 rounded-2xl border text-white shadow-md ${netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500" : "bg-gradient-to-br from-rose-500 to-red-600 border-rose-500"}`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-95">Daily Net Profit Margin</span>
                <h3 className="text-2xl font-black mt-1">{netProfit} <span className="text-xs font-medium">PKR</span></h3>
                <p className="text-[10px] opacity-80 mt-1">{netProfit >= 0 ? "🎉 Positive margins." : "⚠️ Deficit margin caution."}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
              <div onClick={() => setActiveTab("opd")} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">👥</span>
                <h4 className="text-sm font-bold text-slate-900">OPD &amp; Patient Entry</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage daily tokens & patient EHR medical history timelines.</p>
              </div>

              <div onClick={() => setActiveTab("lab")} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold mb-3 group-hover:bg-amber-505 group-hover:text-white transition-all">🔬</span>
                <h4 className="text-sm font-bold text-slate-900">Diagnostics Lab</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Input laboratory observed test values & generate printouts.</p>
              </div>

              <div onClick={() => setActiveTab("pharmacy")} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">📦</span>
                <h4 className="text-sm font-bold text-slate-900">Pharmacy POS</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Log wholesale/retail stock, control limits & medicine items.</p>
              </div>

              <div onClick={() => setActiveTab("expense")} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group">
                <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg font-bold mb-3 group-hover:bg-rose-600 group-hover:text-white transition-all">💸</span>
                <h4 className="text-sm font-bold text-slate-900">Expense Ledger</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Monitor office expenses, tea bills, staff salaries & closing balances.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- OPD VIEW --- */}
        {}
        {activeTab === "opd" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-md text-white relative">
              <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">🔍 Search Returning Patient</h4>
              <p className="text-xs text-blue-100 mb-3">Type Name, Phone or Patient ID (PID) to auto-fill details.</p>
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
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-bold text-[10px]">{p.pid}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900">📝 New Patient Entry</h3>
                  {selectedExistingPid && (
                    <button onClick={() => { setSelectedExistingPid(null); setPatientName(""); setPatientAge(""); setPatientPhone(""); }} className="text-[10px] text-red-500 font-extrabold border border-red-200 px-2 py-0.5 rounded hover:bg-red-50">Clear Auto-Fill</button>
                  )}
                </div>

                <form onSubmit={handlePatientSubmit} className="space-y-4">
                  {selectedExistingPid && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>🔄 Registering PID:</span>
                      <span className="bg-amber-100 px-1.5 py-0.5 rounded">{selectedExistingPid}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient Name *</label>
                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Muhammad Ali" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age *</label>
                      <input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="e.g. 28" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                      <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="03001234567" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-blue-600 block mb-2">🩺 Initial Vitals Check</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={patientVitals.bp} onChange={(e) => setPatientVitals({...patientVitals, bp: e.target.value})} placeholder="BP (120/80)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                      <input type="text" value={patientVitals.temp} onChange={(e) => setPatientVitals({...patientVitals, temp: e.target.value})} placeholder="Temp (98F)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                      <input type="text" value={patientVitals.weight} onChange={(e) => setPatientVitals({...patientVitals, weight: e.target.value})} placeholder="Weight (kg)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md mt-2">🎟️ Issue Token &amp; Save</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900">⏳ Active OPD Queue ({tokenList.length})</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">OPD Fee: {clinicConfig.doctor.consultationFee} PKR</span>
                </div>

                {tokenList.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-2xl mb-1">📭</p>
                    <p className="text-sm font-semibold text-slate-400">No active queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">Issue new patient tokens to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto">
                    {tokenList.map((token) => (
                      <div key={token.tokenNumber} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center font-black">
                            <span className="text-[9px] uppercase opacity-75 font-bold">Token</span>
                            <span className="text-lg leading-none">#{token.tokenNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{token.name}</h4>
                              <span className="bg-slate-200 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">{token.pid}</span>
                            </div>
                            <p className="text-xs text-slate-500">{token.gender}, {token.age} Yrs • <span className="text-slate-400">{token.time}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {token.vitals.bp && <span className="text-[11px] bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded border">❤️ {token.vitals.bp}</span>}
                          {token.vitals.temp && <span className="text-[11px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded border">🌡️ {token.vitals.temp}</span>}
                          {token.vitals.weight && <span className="text-[11px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded border">⚖️ {token.vitals.weight}kg</span>}
                          
                          {userRole === "doctor" ? (
                            <button onClick={() => handleCheckPatient(token)} className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-3 py-1.5 rounded-lg transition-colors ml-2">Check ➡️</button>
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2 py-1 rounded-md ml-2 flex items-center gap-1">
                              🔒 Wait for Doctor
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {}
            {selectedToken && userRole === "doctor" && (
              <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden transition-all">
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">Examination Desk</span>
                    <h3 className="text-lg font-black mt-1">Checking: {selectedToken.name} (Token #{selectedToken.tokenNumber})</h3>
                  </div>
                  <button onClick={() => setSelectedToken(null)} className="text-xs font-bold text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl">❌ Close Desk</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-x divide-slate-200">
                  
                  {/* Left Column: Demographics & History (3 Cols) */}
                  <div className="lg:col-span-3 bg-slate-50/60 p-5 flex flex-col h-[540px]">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
                      <h4 className="font-extrabold text-slate-800 border-b pb-1.5 mb-2 flex justify-between">
                        <span>📋 Demographics</span>
                        <span className="text-blue-600">{selectedToken.pid}</span>
                      </h4>
                      <p><strong className="text-slate-500">Gender/Age:</strong> {selectedToken.gender}, {selectedToken.age} Yrs</p>
                      <p><strong className="text-slate-500">Phone:</strong> {selectedToken.phone || "N/A"}</p>
                      <div className="pt-2 border-t text-slate-600">
                        <p className="font-semibold text-slate-700">Initial Vitals:</p>
                        <p>❤️ BP: {selectedToken.vitals.bp || "Not Checked"}</p>
                        <p>🌡️ Temp: {selectedToken.vitals.temp || "Not Checked"}</p>
                        <p>⚖️ Weight: {selectedToken.vitals.weight ? `${selectedToken.vitals.weight}kg` : "Not Checked"}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex justify-between">
                        <span>📜 EHR History</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{currentPatientHistory.length} Visits</span>
                      </h4>

                      {currentPatientHistory.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl bg-white p-4 text-center">
                          <p className="text-lg">🆕</p>
                          <p className="text-xs font-bold text-slate-400 mt-1">First Time Visit</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                          {currentPatientHistory.map((visit) => (
                            <div key={visit.id} className="bg-white p-2.5 rounded-xl border border-slate-200 relative">
                              <div className="flex justify-between items-center mb-1">
                                <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px]">📅 {visit.date}</span>
                                <button onClick={() => handleCloneVisit(visit)} className="text-[9px] font-extrabold text-blue-600 hover:underline">📋 Copy Rx</button>
                              </div>
                              <p className="text-[11px] text-slate-600"><strong>Symptoms:</strong> {visit.complaints}</p>
                              <p className="text-[11px] text-slate-600"><strong>Diag:</strong> {visit.diagnosis}</p>
                              <p className="bg-slate-50 p-1 rounded font-mono text-[9px] mt-1 text-slate-700 whitespace-pre-wrap border-l-2 border-blue-400">{visit.medicines}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Column: Form (6 Cols) */}
                  <div className="lg:col-span-6 p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Symptoms / Complaints</label>
                        <textarea rows={3} value={prescription.complaints} onChange={(e) => setPrescription({...prescription, complaints: e.target.value})} placeholder="e.g. Cough, Fever, Body aches" className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Diagnosis</label>
                        <textarea rows={3} value={prescription.Diagnosis} onChange={(e) => setPrescription({...prescription, Diagnosis: e.target.value})} placeholder="e.g. Upper Respiratory Tract Infection" className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rx - Prescription &amp; Medicines</label>
                      <textarea rows={7} value={prescription.medicines} onChange={(e) => setPrescription({...prescription, medicines: e.target.value})} placeholder="1. Tab Paracetamol 500mg -- 1+1+1 (5 days)&#10;2. Syp Hydryll -- 2 tsp daily" className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="flex justify-end pt-3 border-t">
                      <button onClick={handlePrintPrescription} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md flex items-center gap-2">🖨️ Save &amp; Print Prescription</button>
                    </div>
                  </div>

                  {/* Right Column: Smart Suggestions Sidebar (3 Cols) */}
                  <div className="lg:col-span-3 bg-slate-50/60 p-4 flex flex-col h-[540px] overflow-hidden">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">⚡ Smart Suggestions</h4>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                      
                      {/* Symptoms Suggestions */}
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-blue-600 block text-[10px] uppercase">Complaints / Symptoms</span>
                        <div className="flex flex-wrap gap-1">
                          {suggestedSymptoms.map(sym => (
                            <span key={sym} className="group relative bg-white hover:bg-blue-100 border text-slate-700 hover:text-blue-800 px-2 py-0.5 rounded-full cursor-pointer transition-all flex items-center gap-1">
                              <span onClick={() => appendSymptom(sym)}>{sym}</span>
                              <span onClick={() => deleteSymptomTemplate(sym)} className="hidden group-hover:inline text-red-500 font-bold ml-1 hover:text-red-700">×</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <input type="text" value={newSymptomInput} onChange={(e) => setNewSymptomInput(e.target.value)} placeholder="Add new symptom" className="flex-1 px-2 py-0.5 text-[11px] border rounded bg-white" />
                          <button onClick={addNewSymptomTemplate} className="bg-blue-600 text-white px-2 py-0.5 rounded font-black">+</button>
                        </div>
                      </div>

                      {/* Diagnosis Suggestions */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        <span className="font-extrabold text-blue-600 block text-[10px] uppercase">Diagnosis</span>
                        <div className="flex flex-wrap gap-1">
                          {suggestedDiagnoses.map(diag => (
                            <span key={diag} className="group relative bg-white hover:bg-blue-100 border text-slate-700 hover:text-blue-800 px-2 py-0.5 rounded-full cursor-pointer transition-all flex items-center gap-1">
                              <span onClick={() => appendDiagnosis(diag)}>{diag}</span>
                              <span onClick={() => deleteDiagnosisTemplate(diag)} className="hidden group-hover:inline text-red-500 font-bold ml-1 hover:text-red-700">×</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <input type="text" value={newDiagnosisInput} onChange={(e) => setNewDiagnosisInput(e.target.value)} placeholder="Add diagnosis" className="flex-1 px-2 py-0.5 text-[11px] border rounded bg-white" />
                          <button onClick={addNewDiagnosisTemplate} className="bg-blue-600 text-white px-2 py-0.5 rounded font-black">+</button>
                        </div>
                      </div>

                      {/* Medicines Suggestions */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        <span className="font-extrabold text-blue-600 block text-[10px] uppercase">Medicines / Rx Templates</span>
                        <div className="flex flex-col gap-1">
                          {suggestedMedicines.map(med => (
                            <div key={med} className="group flex justify-between items-center bg-white hover:bg-blue-50 border p-1.5 rounded-lg cursor-pointer transition-all">
                              <span onClick={() => appendMedicine(med)} className="flex-1 text-[11px] font-medium text-slate-700">{med}</span>
                              <span onClick={() => deleteMedicineTemplate(med)} className="hidden group-hover:inline text-red-500 font-bold ml-1 hover:text-red-700">×</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <input type="text" value={newMedicineInput} onChange={(e) => setNewMedicineInput(e.target.value)} placeholder="Add prescription" className="flex-1 px-2 py-0.5 text-[11px] border rounded bg-white" />
                          <button onClick={addNewMedicineTemplate} className="bg-blue-600 text-white px-2 py-0.5 rounded font-black">+</button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* --- LAB DIAGNOSTICS VIEW --- */}
        {}
        {activeTab === "lab" && userRole === "doctor" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4">🔬 Enter Observed Lab Values</h3>
                <form onSubmit={handleAddLabReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Patient Name *</label>
                    <input type="text" value={reportPatientName} onChange={(e) => setReportPatientName(e.target.value)} placeholder="e.g. Tariq Jamil" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Patient PID (If any)</label>
                      <input type="text" value={reportPid} onChange={(e) => setReportPid(e.target.value)} placeholder="e.g. PID-1001" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Test *</label>
                      <select value={selectedLabTest} onChange={(e) => setSelectedLabTest(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none" >
                        <option value="">-- Choose Test --</option>
                        {labTestsCatalog.map(t => <option key={t.id} value={t.id}>{t.name} ({t.price} PKR)</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Observed Test Result *</label>
                    <input type="text" value={testResult} onChange={(e) => setTestResult(e.target.value)} placeholder="e.g. Hb: 13.5 g/dL, Sugar: 125 mg/dL" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm mt-2 transition-colors">🧬 Issue Lab Report</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">📋 Verified Laboratory Reports Ledger</h3>
                {labReports.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-sm font-semibold text-slate-400">No laboratory test reports verified today.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b font-bold text-slate-400">
                          <th className="py-2.5">Date</th>
                          <th>Patient Name</th>
                          <th>PID</th>
                          <th>Test Investigation</th>
                          <th>Result Value</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {labReports.map(rep => (
                          <tr key={rep.id} className="hover:bg-slate-50">
                            <td className="py-3">{rep.date}</td>
                            <td className="font-bold">{rep.patientName}</td>
                            <td><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{rep.pid}</span></td>
                            <td className="font-semibold text-blue-600">{rep.testName}</td>
                            <td className="font-mono">{rep.resultValue}</td>
                            <td className="text-center"><button onClick={() => handlePrintLabReport(rep)} className="text-xs bg-slate-100 hover:bg-blue-100 text-blue-600 font-bold px-2.5 py-1 rounded-md transition-colors">🖨️ Print</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PHARMACY VIEW --- */}
        {}
        {activeTab === "pharmacy" && userRole === "doctor" && (
          <div className="space-y-8 animate-fadeIn">
            {medicines.some(m => m.stock <= m.minStockAlert) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <p className="font-bold">Caution: Low stock alert triggered for some pharmacy medicine items! Please audit wholesale items.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4">📦 Add Medicine to Stock</h3>
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Medicine Title/Strength *</label>
                    <input type="text" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="e.g. Tab Flagyl 400mg" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Wholesale Rate (PKR) *</label>
                      <input type="number" step="0.01" value={newMedWS} onChange={(e) => setNewMedWS(e.target.value)} placeholder="e.g. 1.2" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Retail Selling (PKR) *</label>
                      <input type="number" step="0.01" value={newMedRT} onChange={(e) => setNewMedRT(e.target.value)} placeholder="e.g. 2.5" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity/Stock (Pills) *</label>
                      <input type="number" value={newMedQty} onChange={(e) => setNewMedQty(e.target.value)} placeholder="e.g. 500" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Low-stock Level Alert</label>
                      <input type="number" value={newMedAlert} onChange={(e) => setNewMedAlert(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors mt-2">📦 Save to Inventory</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">📋 Medicine Stock &amp; Inventory Table</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b text-slate-400 font-bold">
                        <th className="py-2.5">Medicine Name</th>
                        <th className="text-right">Wholesale Rate</th>
                        <th className="text-right">Retail Rate</th>
                        <th className="text-center">Stock Count</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Manage Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {medicines.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-3 font-bold">{m.name}</td>
                          <td className="text-right font-mono">{m.wholesalePrice} PKR</td>
                          <td className="text-right font-mono text-emerald-600 font-bold">{m.retailPrice} PKR</td>
                          <td className={`text-center font-black font-mono ${m.stock <= m.minStockAlert ? "text-red-500" : "text-slate-900"}`}>{m.stock}</td>
                          <td className="text-center">
                            {m.stock <= m.minStockAlert ? (
                              <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded text-[9px] border border-red-100">Low Stock</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[9px] border border-emerald-100">In Stock</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleUpdateStock(m.id, 50)} className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 font-black px-1.5 py-0.5 rounded border">+50</button>
                              <button onClick={() => handleUpdateStock(m.id, -50)} className="text-[10px] bg-slate-100 hover:bg-red-50 hover:text-red-600 font-black px-1.5 py-0.5 rounded border">-50</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BILLING VIEW --- */}
        {}
        {activeTab === "billing" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4">💳 Print Invoices &amp; Receipts</h3>
                <form onSubmit={handleAddInvoice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Patient Name *</label>
                    <input type="text" value={billingPatientName} onChange={(e) => setBillingPatientName(e.target.value)} placeholder="e.g. Zahid Khan" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Patient PID (If any)</label>
                      <input type="text" value={billingPid} onChange={(e) => setBillingPid(e.target.value)} placeholder="e.g. PID-1005" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Doctor OPD Fee (PKR)</label>
                      <input type="number" value={billingOPDFee} onChange={(e) => setBillingOPDFee(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Pharmacy Charges (PKR)</label>
                      <input type="number" value={billingPharmTotal} onChange={(e) => setBillingPharmTotal(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Laboratory Investigations (PKR)</label>
                      <input type="number" value={billingLabTotal} onChange={(e) => setBillingLabTotal(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Coupon / Deductions (PKR)</label>
                    <input type="number" value={billingDiscount} onChange={(e) => setBillingDiscount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono" />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm mt-2 transition-colors">💳 Print Thermal Invoice</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">📋 Daily Invoices &amp; Invoicing Transactions</h3>
                {billingRecords.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-sm font-semibold text-slate-400">No invoice records logged today.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b text-slate-400 font-bold">
                          <th className="py-2.5">Date</th>
                          <th>Patient Name</th>
                          <th>PID</th>
                          <th className="text-right">OPD Fee</th>
                          <th className="text-right">Pharmacy</th>
                          <th className="text-right">Lab Fee</th>
                          <th className="text-right text-emerald-600 font-black">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {billingRecords.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="py-3">{inv.date}</td>
                            <td className="font-bold">{inv.patientName}</td>
                            <td><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{inv.pid}</span></td>
                            <td className="text-right font-mono">{inv.opdFee} PKR</td>
                            <td className="text-right font-mono">{inv.pharmacyTotal} PKR</td>
                            <td className="text-right font-mono">{inv.labTotal} PKR</td>
                            <td className="text-right font-black text-emerald-600 font-mono">{inv.grandTotal} PKR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- EXPENSES & LEDGER VIEW --- */}
        {}
        {activeTab === "expense" && userRole === "doctor" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">OPD Income</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{autoOPDRevenue} <span className="text-xs font-medium text-slate-400">PKR</span></h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculated from checked queues</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Total Expenses</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalExpenses} <span className="text-xs font-medium text-slate-400">PKR</span></h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Sum of all records ledger below</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Other/Manual Income</span>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" 
                    value={manualRevenue || ""} 
                    onChange={(e) => setManualRevenue(Number(e.target.value))}
                    placeholder="0" 
                    className="w-full text-lg font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold">PKR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Adjust manual/outside revenue</p>
              </div>

              <div className={`p-5 rounded-2xl border text-white shadow-md ${netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500" : "bg-gradient-to-br from-rose-500 to-red-600 border-rose-500"}`}>
                <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">Net Profit</span>
                <h3 className="text-3xl font-black mt-1">{netProfit} <span className="text-xs font-bold">PKR</span></h3>
                <p className="text-[10px] opacity-80 mt-0.5">{netProfit >= 0 ? "🎉 Positive balance." : "⚠️ Deficit margins."}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">💸 Log New Expense</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expense Title *</label>
                    <input type="text" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="e.g. Tea for staff, Paper bundles" className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount (PKR) *</label>
                      <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="e.g. 1500" className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                      <input type="date" value={expenseDate} className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                    <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none" >
                      <option value="Tea & Refreshments">Tea &amp; Refreshments</option>
                      <option value="Staff Salaries">Staff Salaries</option>
                      <option value="Clinic Rent">Clinic Rent</option>
                      <option value="Utility Bills">Utility Bills</option>
                      <option value="Stationery & Printing">Stationery &amp; Printing</option>
                      <option value="Medicines Purchase">Medicines Purchase</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md mt-2">📝 Save Expense</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900">📋 Expense Ledger</h3>
                  <span className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full">{expenses.length} Records</span>
                </div>

                {expenses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50 flex-1 flex flex-col items-center justify-center">
                    <p className="text-2xl mb-1">🌿</p>
                    <p className="text-sm font-semibold text-slate-400">No expenses recorded today.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b font-bold text-slate-400">
                          <th className="py-2.5">Date</th>
                          <th>Title / Item</th>
                          <th>Category</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="py-3 font-medium text-slate-500">{new Date(exp.date).toLocaleDateString('en-GB')}</td>
                            <td className="font-bold text-slate-800">{exp.title}</td>
                            <td><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">{exp.category}</span></td>
                            <td className="text-right font-black text-slate-900 font-mono">{exp.amount} PKR</td>
                            <td className="text-center"><button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500 hover:text-red-700 font-bold hover:underline">Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}