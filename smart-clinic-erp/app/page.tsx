'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Premium Inline Clinic Branding Config
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Gracefully instantiate Supabase. If credentials are missing, system falls back to localStorage automatically.
let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client", err);
  }
}

interface Patient {
  id?: string;
  pid: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  created_at?: string;
}

interface Token {
  id?: string;
  tokenNumber: number;
  token_number?: number; // DB mapping
  pid: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  vitals: { bp: string; temp: string; weight: string };
  time: string;
  created_at?: string;
}

interface Visit {
  id?: string;
  pid: string;
  date: string;
  time: string;
  complaints: string;
  diagnosis: string;
  medicines: string;
  vitals: { bp: string; temp: string; weight: string };
  tokenNumber?: number;
  token_number?: number;
  created_at?: string;
}

interface Medicine {
  id: string;
  name: string;
  wholesalePrice?: number;
  wholesale_price?: number; // DB mapping
  retailPrice?: number;
  retail_price?: number; // DB mapping
  stock: number;
  minStockAlert?: number;
  min_stock_alert?: number; // DB mapping
  created_at?: string;
}

interface LabReport {
  id?: string;
  patient_name?: string;
  patientName?: string;
  pid: string;
  test_name?: string;
  testName?: string;
  result_value?: string;
  resultValue?: string;
  date: string;
  status: string;
  created_at?: string;
}

interface BillingRecord {
  id?: string;
  patient_name?: string;
  patientName?: string;
  pid: string;
  opd_fee?: number;
  opdFee?: number;
  pharmacy_total?: number;
  pharmacyTotal?: number;
  lab_total?: number;
  labTotal?: number;
  discount: number;
  grand_total?: number;
  grandTotal?: number;
  date: string;
  created_at?: string;
}

interface Expense {
  id?: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  created_at?: string;
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'Doctor' | 'Receptionist' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // DB Sync Status Indicator
  const [syncStatus, setSyncStatus] = useState<'live' | 'local'>('local');

  // Navigation controller
  const [activeTab, setActiveTab] = useState<'dashboard' | 'opd' | 'pharmacy' | 'lab' | 'billing' | 'expenses'>('dashboard');

  // Unified Central DB States
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsHistory, setVisitsHistory] = useState<Visit[]>([]);
  const [tokenQueue, setTokenQueue] = useState<Token[]>([]);
  const [medicinesStock, setMedicinesStock] = useState<Medicine[]>([]);
  const [labRecords, setLabRecords] = useState<LabReport[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [expensesLedger, setExpensesLedger] = useState<Expense[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);

  // Notifications
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Forms states
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '' });
  const [vitalsForm, setVitalsForm] = useState({ bp: '', temp: '', weight: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);

  // Doctor checkup desk state
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ complaints: '', diagnosis: '', medicines: '' });

  // Custom prescriptive shortcuts
  const [complaintsSuggestions, setComplaintsSuggestions] = useState<string[]>(["Fever", "Flu & Running Nose", "Dry Cough", "Body Ache", "High Blood Pressure", "Chest Tightness", "Diarrhea", "Stomach Pain"]);
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<string[]>(["Acute Viral Infection", "Upper Respiratory Tract Infection (URTI)", "Gastroenteritis", "Essential Hypertension", "Bronchitis", "Enteric Fever"]);
  const [medicineTemplates, setMedicineTemplates] = useState<string[]>([
    "Tab Paracetamol 500mg -- 1+1+1 (5 Days)",
    "Syp Hydryll -- 2 tsp thrice daily (5 Days)",
    "Cap Amoxicillin 500mg -- 1+0+1 (5 Days)",
    "Tab Flagyl 400mg -- 1+1+1 (5 Days)",
    "Tab Loprin 75mg -- 0+1+0 (Daily)"
  ]);
  const [customTemplateInput, setCustomTemplateInput] = useState('');

  // Pharmacy Stock Forms
  const [medForm, setMedForm] = useState({ name: '', wholesalePrice: '', retailPrice: '', stock: '', minStockAlert: '20' });

  // Laboratory Registry Forms
  const [labForm, setLabForm] = useState({ patientName: '', pid: '', testName: 'CBC (Complete Blood Count)', resultValue: '', date: '' });
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [showLabSearchResults, setShowLabSearchResults] = useState(false);

  // Billing Engine Form & Checkout Cart
  const [billingSearchQuery, setBillingSearchQuery] = useState('');
  const [showBillingSearchResults, setShowBillingSearchResults] = useState(false);
  const [billingPatient, setBillingPatient] = useState<Patient | null>(null);
  const [billItems, setBillItems] = useState<{ id: string; name: string; price: number; type: 'OPD' | 'Pharmacy' | 'Lab'; qty: number; maxQty?: number }[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [selectedPharmacyProduct, setSelectedPharmacyProduct] = useState<string>('');
  const [selectedLabTest, setSelectedLabTest] = useState<string>('Routine Urine Analysis');
  const [customOpdFee, setCustomOpdFee] = useState<number>(0);

  // Expenses Forms
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Tea & Refreshments', date: '' });

  useEffect(() => {
    setMounted(true);
    // Initialize date inputs
    setExpenseForm(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));
    setLabForm(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));

    // Check pre-saved session keys to bypass PIN on refresh
    const savedRole = localStorage.getItem("sc_user_role");
    if (savedRole === "Doctor" || savedRole === "Receptionist") {
      setIsAuthenticated(true);
      setUserRole(savedRole as any);
      if (savedRole === "Receptionist") setActiveTab('opd');
    }

    // Load initial fallback datasets
    loadLocalStoreFallbacks();

    // Verify Cloud Engine Status
    testCloudSyncEngine();
  }, []);

  const triggerNotification = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const loadLocalStoreFallbacks = () => {
    const rawPatients = localStorage.getItem("sc_patients");
    const rawVisits = localStorage.getItem("sc_visits");
    const rawTokens = localStorage.getItem("sc_tokens");
    const rawCounter = localStorage.getItem("sc_token_counter");
    const rawMeds = localStorage.getItem("sc_medicines");
    const rawLab = localStorage.getItem("sc_lab_reports");
    const rawBills = localStorage.getItem("sc_bills");
    const rawExpenses = localStorage.getItem("sc_expenses");
    const rawCustomSugg = localStorage.getItem("sc_custom_templates");

    if (rawPatients) setPatientsList(JSON.parse(rawPatients));
    if (rawVisits) setVisitsHistory(JSON.parse(rawVisits));
    if (rawTokens) setTokenQueue(JSON.parse(rawTokens));
    if (rawCounter) setTokenCounter(parseInt(rawCounter, 10));
    if (rawMeds) setMedicinesStock(JSON.parse(rawMeds));
    if (rawLab) setLabRecords(JSON.parse(rawLab));
    if (rawBills) setBillingRecords(JSON.parse(rawBills));
    if (rawExpenses) setExpensesLedger(JSON.parse(rawExpenses));
    if (rawCustomSugg) setMedicineTemplates(JSON.parse(rawCustomSugg));
  };

  const testCloudSyncEngine = async () => {
    if (!supabase) {
      setSyncStatus('local');
      return;
    }
    try {
      // Perform diagnostic checks against Patients ledger
      const { data, error } = await supabase.from('patients').select('id').limit(1);
      if (error) throw error;
      setSyncStatus('live');
      syncCloudDataToLocal();
    } catch (err) {
      console.warn("Cloud connection diagnostics failed. Running locally.", err);
      setSyncStatus('local');
    }
  };

  const syncCloudDataToLocal = async () => {
    if (!supabase) return;
    try {
      const { data: pt } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      const { data: tk } = await supabase.from('tokens').select('*').order('created_at', { ascending: false });
      const { data: vt } = await supabase.from('visits').select('*').order('created_at', { ascending: false });
      const { data: md } = await supabase.from('medicines').select('*').order('created_at', { ascending: false });
      const { data: lb } = await supabase.from('lab_reports').select('*').order('created_at', { ascending: false });
      const { data: bl } = await supabase.from('billing_records').select('*').order('created_at', { ascending: false });
      const { data: ex } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });

      if (pt) { setPatientsList(pt); localStorage.setItem("sc_patients", JSON.stringify(pt)); }
      if (tk) {
        // Map raw DB snake_case formats to model structures safely
        const formattedTokens: Token[] = tk.map((t: any) => ({
          id: t.id,
          tokenNumber: t.token_number ?? t.tokenNumber,
          pid: t.pid,
          name: t.name,
          age: t.age,
          gender: t.gender,
          phone: t.phone || '',
          vitals: typeof t.vitals === 'string' ? JSON.parse(t.vitals) : (t.vitals || { bp: '', temp: '', weight: '' }),
          time: t.time
        }));
        setTokenQueue(formattedTokens);
        localStorage.setItem("sc_tokens", JSON.stringify(formattedTokens));
        
        if (formattedTokens.length > 0) {
          const maxT = Math.max(...formattedTokens.map(f => f.tokenNumber));
          setTokenCounter(maxT + 1);
        }
      }
      if (vt) { setVisitsHistory(vt); localStorage.setItem("sc_visits", JSON.stringify(vt)); }
      if (md) { setMedicinesStock(md); localStorage.setItem("sc_medicines", JSON.stringify(md)); }
      if (lb) { setLabRecords(lb); localStorage.setItem("sc_lab_reports", JSON.stringify(lb)); }
      if (bl) { setBillingRecords(bl); localStorage.setItem("sc_bills", JSON.stringify(bl)); }
      if (ex) { setExpensesLedger(ex); localStorage.setItem("sc_expenses", JSON.stringify(ex)); }
    } catch (err) {
      console.error("Failed to fetch tables from Supabase Cloud", err);
    }
  };

  useEffect(() => {
    if (!supabase || syncStatus !== 'live') return;

    // Realtime Token channel listener setup
    const tokenSubscription = supabase
      .channel('realtime_tokens_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        syncCloudDataToLocal();
      })
      .subscribe();

    const billingSubscription = supabase
      .channel('realtime_billing_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_records' }, () => {
        syncCloudDataToLocal();
      })
      .subscribe();

    const stockSubscription = supabase
      .channel('realtime_stock_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => {
        syncCloudDataToLocal();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tokenSubscription);
      supabase.removeChannel(billingSubscription);
      supabase.removeChannel(stockSubscription);
    };
  }, [syncStatus]);

  // Handle local changes preservation
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_custom_templates", JSON.stringify(medicineTemplates));
  }, [medicineTemplates, mounted]);

  const handleSecurityPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinInput === "4142") {
      setIsAuthenticated(true);
      setUserRole('Doctor');
      localStorage.setItem("sc_user_role", "Doctor");
      setActiveTab('dashboard');
      triggerNotification("👨‍⚕️ Welcome Doctor Mohsin Shahzad!");
    } else if (pinInput === "1122") {
      setIsAuthenticated(true);
      setUserRole('Receptionist');
      localStorage.setItem("sc_user_role", "Receptionist");
      setActiveTab('opd');
      triggerNotification("📝 Welcome Receptionist Desk!");
    } else {
      setPinError("Invalid Verification Pin! Access Denied.");
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("sc_user_role");
    setPinInput('');
  };

  const filteredPatients = searchQuery.trim() === ""
    ? []
    : patientsList.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
      );

  const handleSelectReturningPatient = (p: Patient) => {
    setPatientForm({ name: p.name, age: p.age, gender: p.gender, phone: p.phone });
    setSelectedExistingPid(p.pid);
    setSearchQuery('');
    setShowSearchResults(false);
    triggerNotification(`Auto-Filled Profile for: ${p.name} (${p.pid})`);
  };

  const handleRegisterTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.age) {
      return triggerNotification("⚠️ Patient Name and Age are required fields!");
    }

    let finalPid = selectedExistingPid;

    // A. Generate and preserve patient profile if they are brand new
    if (!finalPid) {
      const generatedNumber = 1001 + patientsList.length;
      finalPid = `PID-${generatedNumber}`;
      const newPatient: Patient = {
        pid: finalPid,
        name: patientForm.name,
        age: patientForm.age,
        gender: patientForm.gender,
        phone: patientForm.phone
      };

      if (syncStatus === 'live' && supabase) {
        try {
          await supabase.from('patients').insert([newPatient]);
        } catch (err) {
          console.error("Cloud insert patient failed", err);
        }
      }
      setPatientsList(prev => [newPatient, ...prev]);
      const currentLocalPatients = JSON.parse(localStorage.getItem("sc_patients") || "[]");
      localStorage.setItem("sc_patients", JSON.stringify([newPatient, ...currentLocalPatients]));
    }

    // B. Queue up the active token
    const newToken: Token = {
      tokenNumber: tokenCounter, // FIXED: Changed from 'tokenNumber' shorthand to 'tokenCounter' to resolve scope compilation issue
      pid: finalPid,
      name: patientForm.name,
      age: patientForm.age,
      gender: patientForm.gender,
      phone: patientForm.phone,
      vitals: vitalsForm,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('tokens').insert([{
          token_number: newToken.tokenNumber,
          pid: newToken.pid,
          name: newToken.name,
          age: newToken.age,
          gender: newToken.gender,
          phone: newToken.phone,
          vitals: JSON.stringify(newToken.vitals),
          time: newToken.time
        }]);
      } catch (err) {
        console.error("Cloud insert token failed", err);
      }
    }

    setTokenQueue(prev => [...prev, newToken]);
    const currentLocalTokens = JSON.parse(localStorage.getItem("sc_tokens") || "[]");
    localStorage.setItem("sc_tokens", JSON.stringify([...currentLocalTokens, newToken]));

    const nextCounter = tokenCounter + 1;
    setTokenCounter(nextCounter);
    localStorage.setItem("sc_token_counter", nextCounter.toString());

    // Flush fields
    setPatientForm({ name: '', age: '', gender: 'Male', phone: '' });
    setVitalsForm({ bp: '', temp: '', weight: '' });
    setSelectedExistingPid(null);
    triggerNotification(`🎟️ Issued Token #${tokenCounter} for PID: ${finalPid}`);
  };

  const handleOpenExaminationDesk = (token: Token) => {
    setSelectedToken(token);
    setPrescriptionForm({ complaints: '', diagnosis: '', medicines: '' });
  };

  const handleAddSymptomShortcut = (symptom: string) => {
    setPrescriptionForm(prev => {
      const existing = prev.complaints.trim();
      const updated = existing ? `${existing}, ${symptom}` : symptom;
      return { ...prev, complaints: updated };
    });
  };

  const handleAddDiagnosisShortcut = (diagnosis: string) => {
    setPrescriptionForm(prev => ({ ...prev, diagnosis }));
  };

  const handleAddMedicineShortcut = (med: string) => {
    setPrescriptionForm(prev => {
      const lines = prev.medicines.trim() ? prev.medicines.split('\n') : [];
      const nextNum = lines.length + 1;
      const cleanMed = med.replace(/^\d+\.\s*/, ''); // strip leading numbers if exist
      const lineToAdd = `${nextNum}. ${cleanMed}`;
      const updated = prev.medicines.trim() ? `${prev.medicines}\n${lineToAdd}` : lineToAdd;
      return { ...prev, medicines: updated };
    });
  };

  const handleSaveCustomMedicineTemplate = () => {
    if (!customTemplateInput.trim()) return;
    setMedicineTemplates(prev => [...prev, customTemplateInput.trim()]);
    setCustomTemplateInput('');
    triggerNotification("💾 Custom Prescription Template Saved!");
  };

  const handleDeleteCustomMedicineTemplate = (index: number) => {
    setMedicineTemplates(prev => prev.filter((_, i) => i !== index));
    triggerNotification("🗑️ Prescription Template Removed.");
  };

  const handleCloneVisitRx = (pastVisit: Visit) => {
    setPrescriptionForm({
      complaints: pastVisit.complaints,
      diagnosis: pastVisit.diagnosis,
      medicines: pastVisit.medicines
    });
    triggerNotification("📋 Copied past checkup details to current desk!");
  };

  const handleCheckoutAndPrintPrescription = async () => {
    if (!selectedToken) return;

    const formattedVisit: Visit = {
      pid: selectedToken.pid,
      date: new Date().toLocaleDateString('en-GB'),
      time: selectedToken.time,
      complaints: prescriptionForm.complaints || "Routine Checkup",
      diagnosis: prescriptionForm.diagnosis || "Under Observation",
      medicines: prescriptionForm.medicines || "No medicines prescribed",
      vitals: selectedToken.vitals,
      tokenNumber: selectedToken.tokenNumber
    };

    // A. Commit visit checkup record to databases
    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('visits').insert([{
          pid: formattedVisit.pid,
          date: formattedVisit.date,
          time: formattedVisit.time,
          complaints: formattedVisit.complaints,
          diagnosis: formattedVisit.diagnosis,
          medicines: formattedVisit.medicines,
          vitals: JSON.stringify(formattedVisit.vitals),
          token_number: formattedVisit.tokenNumber
        }]);

        // Evict token from active cloud pool
        await supabase.from('tokens').delete().eq('pid', selectedToken.pid).eq('token_number', selectedToken.tokenNumber);
      } catch (err) {
        console.error("Cloud saving visit failed", err);
      }
    }

    setVisitsHistory(prev => [formattedVisit, ...prev]);
    const currentLocalVisits = JSON.parse(localStorage.getItem("sc_visits") || "[]");
    localStorage.setItem("sc_visits", JSON.stringify([formattedVisit, ...currentLocalVisits]));

    setTokenQueue(prev => prev.filter(t => t.pid !== selectedToken.pid));
    const currentLocalTokens = JSON.parse(localStorage.getItem("sc_tokens") || "[]");
    localStorage.setItem("sc_tokens", JSON.stringify(currentLocalTokens.filter((t: any) => t.pid !== selectedToken.pid)));

    // B. Build and dispatch print container window
    const win = window.open('', '_blank');
    if (!win) {
      return triggerNotification("⚠️ Please allow popups for prescription printing");
    }

    const prescriptionHTML = `
      <html>
        <head>
          <title>Prescription - ${selectedToken.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; color: #1e293b; padding: 30px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 12px; margin-bottom: 25px; }
            .clinic-name { font-size: 26px; font-weight: 800; color: #2563eb; margin: 0; }
            .tagline { font-size: 13px; color: #64748b; font-style: italic; margin: 3px 0; }
            .doc-info { font-size: 14px; margin-top: 5px; }
            .patient-box { display: grid; grid-template-columns: 1fr 1fr; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; font-size: 13px; gap: 8px; }
            .sec-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 20px 0 8px 0; }
            .vitals-row { display: flex; gap: 15px; font-size: 12px; color: #475569; }
            .rx-symbol { font-size: 24px; font-weight: bold; color: #2563eb; font-family: serif; margin: 15px 0 5px 0; }
            .med-list { font-family: monospace; font-size: 14px; white-space: pre-wrap; padding-left: 10px; color: #1e293b; }
            .footer { position: fixed; bottom: 20px; left: 30px; right: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">🏥 ${clinicConfig.clinicName}</div>
            <div class="tagline">${clinicConfig.tagline}</div>
            <div class="doc-info">
              <strong>${clinicConfig.doctor.name}</strong> • ${clinicConfig.doctor.degree}<br>
              <span style="color: #2563eb; font-weight: 600;">${clinicConfig.doctor.specialty}</span>
            </div>
          </div>
          <div class="patient-box">
            <div><strong>Patient ID:</strong> ${selectedToken.pid}</div>
            <div><strong>Patient Name:</strong> ${selectedToken.name}</div>
            <div><strong>Age/Gender:</strong> ${selectedToken.age} Yrs / ${selectedToken.gender}</div>
            <div><strong>Phone:</strong> ${selectedToken.phone || 'N/A'}</div>
            <div><strong>Token No:</strong> #${selectedToken.tokenNumber}</div>
            <div><strong>Checked Date:</strong> ${formattedVisit.date} ${formattedVisit.time}</div>
          </div>
          ${selectedToken.vitals.bp || selectedToken.vitals.temp || selectedToken.vitals.weight ? `
            <div>
              <div class="sec-title">Patient Vitals</div>
              <div class="vitals-row">
                ${selectedToken.vitals.bp ? `<span><strong>Blood Pressure:</strong> ${selectedToken.vitals.bp}</span>` : ''}
                ${selectedToken.vitals.temp ? `<span><strong>Temperature:</strong> ${selectedToken.vitals.temp}</span>` : ''}
                ${selectedToken.vitals.weight ? `<span><strong>Weight:</strong> ${selectedToken.vitals.weight} kg</span>` : ''}
              </div>
            </div>
          ` : ''}
          <div>
            <div class="sec-title">Complaints / Symptoms</div>
            <div style="font-size: 13px;">${formattedVisit.complaints}</div>
          </div>
          <div>
            <div class="sec-title">Diagnosis</div>
            <div style="font-size: 13px; font-weight: 600;">${formattedVisit.diagnosis}</div>
          </div>
          <div>
            <div class="rx-symbol">Rx</div>
            <div class="med-list">${formattedVisit.medicines}</div>
          </div>
          <div class="footer">
            📞 ${clinicConfig.contact.phone} • 📍 ${clinicConfig.contact.address}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    win.document.write(prescriptionHTML);
    win.document.close();

    setSelectedToken(null);
    setPrescriptionForm({ complaints: '', diagnosis: '', medicines: '' });
    triggerNotification("🚀 Prescription generated & Token checked successfully!");
  };

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name || !medForm.wholesalePrice || !medForm.retailPrice || !medForm.stock) {
      return triggerNotification("⚠️ All stock fields are required!");
    }

    const payload: Medicine = {
      id: `MED-${Date.now()}`,
      name: medForm.name,
      wholesale_price: parseFloat(medForm.wholesalePrice),
      wholesalePrice: parseFloat(medForm.wholesalePrice),
      retail_price: parseFloat(medForm.retailPrice),
      retailPrice: parseFloat(medForm.retailPrice),
      stock: parseInt(medForm.stock, 10),
      min_stock_alert: parseInt(medForm.minStockAlert, 10),
      minStockAlert: parseInt(medForm.minStockAlert, 10)
    };

    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('medicines').insert([payload]);
      } catch (err) {
        console.error("Cloud saving product failed", err);
      }
    }

    setMedicinesStock(prev => [payload, ...prev]);
    const currentLocalMeds = JSON.parse(localStorage.getItem("sc_medicines") || "[]");
    localStorage.setItem("sc_medicines", JSON.stringify([payload, ...currentLocalMeds]));

    setMedForm({ name: '', wholesalePrice: '', retailPrice: '', stock: '', minStockAlert: '20' });
    triggerNotification("💊 Inventory item added successfully!");
  };

  const handleDeleteMedicine = async (id: string) => {
    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('medicines').delete().eq('id', id);
      } catch (err) {
        console.error("Cloud deleting medicine failed", err);
      }
    }
    setMedicinesStock(prev => prev.filter(m => m.id !== id));
    const currentLocalMeds = JSON.parse(localStorage.getItem("sc_medicines") || "[]");
    localStorage.setItem("sc_medicines", JSON.stringify(currentLocalMeds.filter((m: any) => m.id !== id)));
    triggerNotification("🗑️ Item deleted from stock ledger.");
  };

  const handleAddLabReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.patientName || !labForm.resultValue || !labForm.pid) {
      return triggerNotification("⚠️ All diagnostics fields must be completed!");
    }

    const report: LabReport = {
      id: `LAB-${Date.now()}`,
      patientName: labForm.patientName,
      patient_name: labForm.patientName,
      pid: labForm.pid,
      testName: labForm.testName,
      test_name: labForm.testName,
      resultValue: labForm.resultValue,
      result_value: labForm.resultValue,
      date: labForm.date,
      status: "Verified"
    };

    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('lab_reports').insert([report]);
      } catch (err) {
        console.error("Cloud saving report failed", err);
      }
    }

    setLabRecords(prev => [report, ...prev]);
    const currentLocalReports = JSON.parse(localStorage.getItem("sc_lab_reports") || "[]");
    localStorage.setItem("sc_lab_reports", JSON.stringify([report, ...currentLocalReports]));

    setLabForm({ patientName: '', pid: '', testName: 'CBC (Complete Blood Count)', resultValue: '', date: new Date().toISOString().split("T")[0] });
    triggerNotification("🔬 Lab test outcome registered!");
  };

  const filteredLabPatients = labSearchQuery.trim() === ""
    ? []
    : patientsList.filter(p =>
        p.name.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
        p.pid.toLowerCase().includes(labSearchQuery.toLowerCase())
      );

  const handleSelectLabPatient = (p: Patient) => {
    setLabForm(prev => ({ ...prev, patientName: p.name, pid: p.pid }));
    setLabSearchQuery('');
    setShowLabSearchResults(false);
  };

  const filteredBillingPatients = billingSearchQuery.trim() === ""
    ? []
    : patientsList.filter(p =>
        p.name.toLowerCase().includes(billingSearchQuery.toLowerCase()) ||
        p.pid.toLowerCase().includes(billingSearchQuery.toLowerCase())
      );

  const handleSelectBillingPatient = (p: Patient) => {
    setBillingPatient(p);
    setBillingSearchQuery('');
    setShowBillingSearchResults(false);
    
    // Auto populate cart with basic consultation fee if they are a clinic patient
    if (p.pid !== 'PID-WALKIN') {
      setCustomOpdFee(clinicConfig.doctor.consultationFee);
      setBillItems([{ id: 'OPD-FEE', name: 'OPD Consultation Fee', price: clinicConfig.doctor.consultationFee, type: 'OPD', qty: 1 }]);
    } else {
      setCustomOpdFee(0);
      setBillItems([]);
    }
  };

  const handleActivateWalkinCustomer = () => {
    const walkinPatient: Patient = {
      pid: 'PID-WALKIN',
      name: 'Walk-in Customer',
      age: 'N/A',
      gender: 'N/A',
      phone: 'N/A'
    };
    handleSelectBillingPatient(walkinPatient);
    triggerNotification("🛍️ Walk-in General Mode activated!");
  };

  const handleAddPharmacyProductDirectly = (medId: string) => {
    if (!medId) return;
    const med = medicinesStock.find(m => m.id === medId);
    if (!med) return;

    if (med.stock <= 0) {
      return triggerNotification("❌ Product out of stock! Cannot allocate to bill.");
    }

    const existingIndex = billItems.findIndex(item => item.id === med.id);
    if (existingIndex > -1) {
      const currentQty = billItems[existingIndex].qty;
      if (currentQty >= med.stock) {
        return triggerNotification(`⚠️ Cannot exceed available stock limit (${med.stock} items).`);
      }
      setBillItems(prev => prev.map((item, idx) => idx === existingIndex ? { ...item, qty: item.qty + 1 } : item));
    } else {
      const price = med.retailPrice ?? med.retail_price ?? 0;
      setBillItems(prev => [...prev, { id: med.id, name: med.name, price, type: 'Pharmacy', qty: 1, maxQty: med.stock }]);
    }
    triggerNotification(`💊 Added ${med.name} to patient bill`);
    setSelectedPharmacyProduct(''); // Reset select dropdown
  };

  const handleAddLabTestToBill = () => {
    if (!selectedLabTest) return;
    const testPricing: { [key: string]: number } = {
      'CBC (Complete Blood Count)': 600,
      'Routine Urine Analysis': 300,
      'Blood Sugar Profile': 200,
      'Lipid Cholesterol Profile': 1200,
      'Liver Function Tests (LFT)': 1500,
      'Renal Kidney Profile (RFT)': 1000
    };
    const price = testPricing[selectedLabTest] || 500;
    
    const existing = billItems.some(item => item.id === `LAB-${selectedLabTest}`);
    if (existing) return triggerNotification("⚠️ Test already listed on receipt.");

    setBillItems(prev => [...prev, { id: `LAB-${selectedLabTest}`, name: `Lab: ${selectedLabTest}`, price, type: 'Lab', qty: 1 }]);
    triggerNotification(`🔬 Added ${selectedLabTest} panel to patient bill`);
  };

  const handleRemoveBillItem = (id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty <= 0) return handleRemoveBillItem(id);
    const target = billItems.find(item => item.id === id);
    if (target && target.maxQty && newQty > target.maxQty) {
      return triggerNotification(`⚠️ Insufficient stock available (Max: ${target.maxQty})`);
    }
    setBillItems(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handleCheckoutAndPrintReceipt = async () => {
    if (!billingPatient) return;
    
    const opdSum = billItems.filter(item => item.type === 'OPD').reduce((s, i) => s + (i.price * i.qty), 0);
    const pharmSum = billItems.filter(item => item.type === 'Pharmacy').reduce((s, i) => s + (i.price * i.qty), 0);
    const labSum = billItems.filter(item => item.type === 'Lab').reduce((s, i) => s + (i.price * i.qty), 0);
    const subtotal = opdSum + pharmSum + labSum;
    const finalTotal = Math.max(0, subtotal - billDiscount);

    const receipt: BillingRecord = {
      id: `INV-${Date.now()}`,
      patientName: billingPatient.name,
      patient_name: billingPatient.name,
      pid: billingPatient.pid,
      opdFee: opdSum,
      opd_fee: opdSum,
      pharmacyTotal: pharmSum,
      pharmacy_total: pharmSum,
      labTotal: labSum,
      lab_total: labSum,
      discount: billDiscount,
      grandTotal: finalTotal,
      grand_total: finalTotal,
      date: new Date().toLocaleDateString('en-GB')
    };

    // A. Commit billing ledger entry to database
    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('billing_records').insert([receipt]);
      } catch (err) {
        console.error("Cloud processing invoice failed", err);
      }
    }

    setBillingRecords(prev => [receipt, ...prev]);
    const currentLocalBills = JSON.parse(localStorage.getItem("sc_bills") || "[]");
    localStorage.setItem("sc_bills", JSON.stringify([receipt, ...currentLocalBills]));

    // B. AUTO-DEDUCT PHARMACY STOCK LEVEL METRICS
    const updatedMedsStock = [...medicinesStock];
    const pharmacyItemsToDeduct = billItems.filter(item => item.type === 'Pharmacy');

    for (const item of pharmacyItemsToDeduct) {
      const idx = updatedMedsStock.findIndex(m => m.id === item.id);
      if (idx > -1) {
        const initialStock = updatedMedsStock[idx].stock;
        const targetDeduction = item.qty;
        const nextStock = Math.max(0, initialStock - targetDeduction);
        updatedMedsStock[idx].stock = nextStock;

        // Perform Cloud Stock Update
        if (syncStatus === 'live' && supabase) {
          try {
            await supabase.from('medicines').update({ stock: nextStock }).eq('id', item.id);
          } catch (err) {
            console.error(`Failed to update stock in database for ${item.name}`, err);
          }
        }
      }
    }
    setMedicinesStock(updatedMedsStock);
    localStorage.setItem("sc_medicines", JSON.stringify(updatedMedsStock));

    // C. Launch Printer Interface Window
    const win = window.open('', '_blank');
    if (!win) {
      return triggerNotification("⚠️ Please allow popups to output invoices");
    }

    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${billingPatient.name}</title>
          <style>
            body { font-family: monospace; font-size: 13px; color: #000; width: 80mm; padding: 10px; margin: auto; }
            .center { text-align: center; }
            .double-divider { border-bottom: 2px dashed #000; margin: 8px 0; }
            .single-divider { border-bottom: 1px dotted #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; font-size: 12px; }
            .text-right { text-align: right; }
            .footer { font-size: 11px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>🏥 ${clinicConfig.clinicName}</strong><br>
            ${clinicConfig.tagline}<br>
            ${clinicConfig.contact.phone}<br>
            Invoice #: ${receipt.id}
          </div>
          <div class="double-divider"></div>
          <div>
            <strong>Patient ID:</strong> ${billingPatient.pid}<br>
            <strong>Name:</strong> ${billingPatient.name}<br>
            <strong>Phone:</strong> ${billingPatient.phone || 'N/A'}<br>
            <strong>Date:</strong> ${receipt.date}
          </div>
          <div class="double-divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${billItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">${item.qty}</td>
                  <td class="text-right">${item.price * item.qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="single-divider"></div>
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">${subtotal} PKR</td>
            </tr>
            ${billDiscount > 0 ? `
              <tr>
                <td>Discount Given:</td>
                <td class="text-right">-${billDiscount} PKR</td>
              </tr>
            ` : ''}
            <tr style="font-weight: bold; font-size: 14px;">
              <td>Grand Total:</td>
              <td class="text-right">${finalTotal} PKR</td>
            </tr>
          </table>
          <div class="double-divider"></div>
          <div class="center footer">
            Thank you for choosing us!<br>
            Please visit again.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    win.document.write(receiptHTML);
    win.document.close();

    // Reset Form states
    setBillingPatient(null);
    setBillItems([]);
    setBillDiscount(0);
    triggerNotification("🚀 POS Invoice created and inventory levels decremented!");
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      return triggerNotification("⚠️ Expense title and amount values are required!");
    }

    const payload: Expense = {
      id: `EXP-${Date.now()}`,
      title: expenseForm.title,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date
    };

    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('expenses').insert([payload]);
      } catch (err) {
        console.error("Cloud saving expense failed", err);
      }
    }

    setExpensesLedger(prev => [payload, ...prev]);
    const currentLocalExpenses = JSON.parse(localStorage.getItem("sc_expenses") || "[]");
    localStorage.setItem("sc_expenses", JSON.stringify([payload, ...currentLocalExpenses]));

    setExpenseForm({ title: '', amount: '', category: 'Tea & Refreshments', date: new Date().toISOString().split("T")[0] });
    triggerNotification("💸 Operational expense successfully logged!");
  };

  const handleDeleteExpense = async (id: string) => {
    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.error("Cloud deleting expense failed", err);
      }
    }
    setExpensesLedger(prev => prev.filter(e => e.id !== id));
    const currentLocalExpenses = JSON.parse(localStorage.getItem("sc_expenses") || "[]");
    localStorage.setItem("sc_expenses", JSON.stringify(currentLocalExpenses.filter((e: any) => e.id !== id)));
    triggerNotification("🗑️ Expense row deleted.");
  };

  const totalOpdEarnings = billingRecords.reduce((sum, item) => sum + (item.opdFee ?? item.opd_fee ?? 0), 0);
  const totalPharmEarnings = billingRecords.reduce((sum, item) => sum + (item.pharmacyTotal ?? item.pharmacy_total ?? 0), 0);
  const totalLabEarnings = billingRecords.reduce((sum, item) => sum + (item.labTotal ?? item.lab_total ?? 0), 0);
  const totalGrossEarnings = billingRecords.reduce((sum, item) => sum + (item.grandTotal ?? item.grand_total ?? 0), 0);
  const totalExpensesLogged = expensesLedger.reduce((sum, item) => sum + item.amount, 0);
  const totalNetClinicProfit = totalGrossEarnings - totalExpensesLogged;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Booting Premium Clinic ERP Core...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 font-sans p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <span className="text-4xl">🏥</span>
            <h1 className="text-2xl font-black text-white mt-3">{clinicConfig.clinicName}</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Security Authentication Portal</p>
          </div>
          <form onSubmit={handleSecurityPinLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1.5">Enter Verification PIN Code</label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-800 border border-slate-700 text-white text-center py-3.5 rounded-xl font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {pinError && <p className="text-xs text-red-500 font-semibold text-center">{pinError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors">
              Access ERP Dashboard ➡️
            </button>
          </form>
          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-[10px] text-slate-500 space-y-1">
            <p>Doctor PIN: <strong>4142</strong> • Receptionist PIN: <strong>1122</strong></p>
            <p>© {new Date().getFullYear()} Smart ERP Systems. All rights preserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Header Navigation Panel */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h1 className="text-lg font-black leading-tight">{clinicConfig.clinicName}</h1>
              <p className="text-[11px] text-blue-400 font-semibold">{clinicConfig.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Supabase status display */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${syncStatus === 'live' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {syncStatus === 'live' ? 'Live Cloud Sync' : 'Local Storage Fallback'}
            </div>

            <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">
              Role: <span className="text-blue-400 font-bold">{userRole}</span>
            </div>

            <button onClick={handleLogout} className="text-xs bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 px-3 py-1 rounded-lg font-bold transition-colors">
              Exit Desk 🔒
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Switcher Panel */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1">
          {userRole === 'Doctor' && (
            <button onClick={() => setActiveTab('dashboard')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              📊 Overview Analytics
            </button>
          )}
          <button onClick={() => setActiveTab('opd')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'opd' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            🎟️ OPD Queue Registry
          </button>
          {userRole === 'Doctor' && (
            <button onClick={() => setActiveTab('pharmacy')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'pharmacy' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              💊 Pharmacy stock
            </button>
          )}
          {userRole === 'Doctor' && (
            <button onClick={() => setActiveTab('lab')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'lab' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              🔬 Diagnostics Lab
            </button>
          )}
          <button onClick={() => setActiveTab('billing')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'billing' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            💵 POS Checkout & Billing
          </button>
          {userRole === 'Doctor' && (
            <button onClick={() => setActiveTab('expenses')} className={`py-3 px-4 font-bold text-xs whitespace-nowrap transition-all border-b-2 ${activeTab === 'expenses' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              💸 Expenses Ledger
            </button>
          )}
        </div>
      </nav>

      {/* Global alert banner notifications */}
      {alertMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-lg">🔔</span>
          <p className="text-xs font-bold">{alertMessage}</p>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {activeTab === 'dashboard' && userRole === 'Doctor' && (
          <div className="space-y-6">
            {/* Stats Cards Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">👥</div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Patients Registered</span>
                  <h3 className="text-2xl font-black text-slate-800">{patientsList.length}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">🏥</div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">OPD Active Queue</span>
                  <h3 className="text-2xl font-black text-slate-800">{tokenQueue.length}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🔬</div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Diagnostics Tracked</span>
                  <h3 className="text-2xl font-black text-slate-800">{labRecords.length}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-xl">💳</div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Net Revenue Realized</span>
                  <h3 className="text-2xl font-black text-emerald-600">{totalNetClinicProfit} {clinicConfig.currency}</h3>
                </div>
              </div>
            </div>

            {/* Double Column Detailed Analytics Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Summary */}
              <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">💵 Revenue Breakdown</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">OPD Consultation Fees:</span>
                    <span className="text-slate-800">{totalOpdEarnings} {clinicConfig.currency}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Pharmacy Dispensing:</span>
                    <span className="text-slate-800">{totalPharmEarnings} {clinicConfig.currency}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Laboratory Incomes:</span>
                    <span className="text-slate-800">{totalLabEarnings} {clinicConfig.currency}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm">
                    <span className="text-slate-500">Gross Income:</span>
                    <span className="text-slate-800">{totalGrossEarnings} {clinicConfig.currency}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-red-500">
                    <span>Clinic Expenses:</span>
                    <span>-{totalExpensesLogged} {clinicConfig.currency}</span>
                  </div>
                  <div className="border-t-2 border-dashed border-slate-200 pt-2 flex justify-between font-black text-base text-emerald-600">
                    <span>Net Income:</span>
                    <span>{totalNetClinicProfit} {clinicConfig.currency}</span>
                  </div>
                </div>
              </div>

              {/* Patient Visits Overview */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">📜 Recent Patient Visits Log</h3>
                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                  {visitsHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">No examination medical checkups recorded yet.</div>
                  ) : (
                    visitsHistory.slice(0, 5).map((visit, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                        <div>
                          <p className="font-extrabold text-slate-800">PID: {visit.pid}</p>
                          <p className="text-slate-400 font-medium">Complaints: {visit.complaints}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">📅 {visit.date}</span>
                          <p className="text-slate-400 mt-1">{visit.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic OPD & Registration tabs */}
        {activeTab === 'opd' && (
          <div className="space-y-6">
            
            {/* Quick Search */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-md text-white relative">
              <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">
                🔍 Returning Patient Profile Quick Search
              </h4>
              <p className="text-xs text-blue-100 mb-3">Lookup existing profile records via Name, Phone or PID to avoid duplicate entries.</p>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  placeholder="e.g. Ali, 03001234567, PID-1001" 
                  className="w-full px-4 py-2.5 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {showSearchResults && filteredPatients.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-52 overflow-y-auto z-10 text-slate-800">
                    {filteredPatients.map(p => (
                      <div 
                        key={p.pid} 
                        onClick={() => handleSelectReturningPatient(p)}
                        className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-blue-600 block">{p.name} ({p.gender})</span>
                          <span className="text-slate-400 font-medium">Age: {p.age} • Phone: {p.phone || 'N/A'}</span>
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
              {/* Left Patient Form Card */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    📝 Register Patient Token
                  </h3>
                  {selectedExistingPid && (
                    <button 
                      onClick={() => {
                        setSelectedExistingPid(null);
                        setPatientForm({ name: '', age: '', gender: 'Male', phone: '' });
                      }}
                      className="text-[10px] text-red-500 font-extrabold border border-red-200 px-2 py-0.5 rounded-md hover:bg-red-50"
                    >
                      Clear Profile Fill
                    </button>
                  )}
                </div>

                <form onSubmit={handleRegisterTokenSubmit} className="space-y-4">
                  {selectedExistingPid && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>🔄 Existing PID Selection:</span>
                      <span className="bg-amber-100 px-1.5 py-0.5 rounded">{selectedExistingPid}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient Full Name *</label>
                    <input type="text" value={patientForm.name} onChange={(e) => setPatientForm({...patientForm, name: e.target.value})} placeholder="e.g. Muhammad Ali" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age *</label>
                      <input type="number" value={patientForm.age} onChange={(e) => setPatientForm({...patientForm, age: e.target.value})} placeholder="Years" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                      <select value={patientForm.gender} onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mobile Contact Phone Number</label>
                    <input type="text" value={patientForm.phone} onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})} placeholder="e.g. 03001234567" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-blue-600 block mb-2">🩺 Vital Diagnostics (Optional)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={vitalsForm.bp} onChange={(e) => setVitalsForm({...vitalsForm, bp: e.target.value})} placeholder="BP (120/80)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                      <input type="text" value={vitalsForm.temp} onChange={(e) => setVitalsForm({...vitalsForm, temp: e.target.value})} placeholder="Temp (98.6F)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                      <input type="text" value={vitalsForm.weight} onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})} placeholder="Weight (kg)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-blue-200 mt-2">
                    🎟️ Save Record &amp; Issue Token
                  </button>
                </form>
              </div>

              {/* Right Live Active Token Queue Card */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    ⏳ Active Queue Status ({tokenQueue.length})
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                    OPD Consultation Fee: {clinicConfig.doctor.consultationFee} {clinicConfig.currency}
                  </span>
                </div>

                {tokenQueue.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <p className="text-2xl mb-1">📭</p>
                    <p className="text-sm font-semibold text-slate-400">No active queue tokens registered yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Please populate registration card forms on the left to queue.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {tokenQueue.map((token) => (
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
                          
                          {userRole === 'Doctor' && (
                            <button onClick={() => handleOpenExaminationDesk(token)} className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold shadow-sm px-3 py-1.5 rounded-lg ml-2 transition-colors">
                              Check ➡️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* EHR Doctor Consultation desk layout */}
            {selectedToken && userRole === 'Doctor' && (
              <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md overflow-hidden transition-all mt-6">
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Examination Desk
                    </span>
                    <h3 className="text-lg font-black mt-1.5">
                      Checking: {selectedToken.name} (Token #{selectedToken.tokenNumber})
                    </h3>
                  </div>
                  <button onClick={() => setSelectedToken(null)} className="text-xs font-bold text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl transition-colors">
                    ❌ Close Checkup Desk
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-x divide-slate-200">
                  {/* Left demographics and visit timelines */}
                  <div className="lg:col-span-3 bg-slate-50 p-5 flex flex-col h-[520px]">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
                      <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 mb-2 flex justify-between items-center">
                        <span>Profile info</span>
                        <span className="text-blue-600 font-black">{selectedToken.pid}</span>
                      </h4>
                      <p><strong className="text-slate-500">Gender/Age:</strong> {selectedToken.gender}, {selectedToken.age} Years</p>
                      <p><strong className="text-slate-500">Phone:</strong> {selectedToken.phone || 'N/A'}</p>
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                        <p className="font-semibold text-slate-700">Initial Vitals:</p>
                        <p>❤️ BP: {selectedToken.vitals.bp || "N/A"}</p>
                        <p>🌡️ Temp: {selectedToken.vitals.temp || "N/A"}</p>
                        <p>⚖️ Weight: {selectedToken.vitals.weight ? `${selectedToken.vitals.weight} kg` : "N/A"}</p>
                      </div>
                    </div>

                    {/* EHR Medical History Timeline */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>📜 Medical Timeline History</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {visitsHistory.filter(v => v.pid === selectedToken.pid).length} Visits
                        </span>
                      </h4>

                      <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
                        {visitsHistory.filter(v => v.pid === selectedToken.pid).length === 0 ? (
                          <div className="text-center py-10 text-slate-400">First time patient visit. No history profile recorded.</div>
                        ) : (
                          visitsHistory.filter(v => v.pid === selectedToken.pid).map((visit, idx) => (
                            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded text-[10px]">
                                  📅 {visit.date}
                                </span>
                                <button onClick={() => handleCloneVisitRx(visit)} className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                                  📋 Re-copy Rx
                                </button>
                              </div>
                              <div className="space-y-1 text-[11px] text-slate-600">
                                <p><strong className="text-slate-800">Complaints:</strong> {visit.complaints}</p>
                                <p><strong className="text-slate-800">Diagnosis:</strong> {visit.diagnosis}</p>
                                <p className="bg-slate-50 p-1.5 rounded text-slate-700 font-mono text-[10px] mt-1 whitespace-pre-wrap">
                                  {visit.medicines}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Checkup Prescription Builder */}
                  <div className="lg:col-span-5 p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Symptoms &amp; Complaints</label>
                        <textarea rows={2} value={prescriptionForm.complaints} onChange={(e) => setPrescriptionForm({...prescriptionForm, complaints: e.target.value})} placeholder="Enter complaints or click shortcuts on the right" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Clinic Diagnosis</label>
                        <textarea rows={2} value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})} placeholder="Enter diagnosis outcome" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rx - Prescribed Medicines &amp; Dosages</label>
                      <textarea rows={6} value={prescriptionForm.medicines} onChange={(e) => setPrescriptionForm({...prescriptionForm, medicines: e.target.value})} placeholder="e.g.&#10;1. Tab Paracetamol 500mg -- 1+1+1 (5 Days)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                      <button onClick={handleCheckoutAndPrintPrescription} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-md shadow-emerald-100 flex items-center gap-2">
                        🖨️ Save Examination &amp; Print Prescription
                      </button>
                    </div>
                  </div>

                  {/* Right Smart Shortcuts suggests */}
                  <div className="lg:col-span-4 bg-slate-50 p-5 overflow-y-auto h-[520px] space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⚡ Symptom Shortcuts</span>
                      <div className="flex flex-wrap gap-1.5">
                        {complaintsSuggestions.map((item, idx) => (
                          <button key={idx} onClick={() => handleAddSymptomShortcut(item)} className="bg-white hover:bg-blue-100 text-slate-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                            + {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⚡ Common Diagnosis</span>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisSuggestions.map((item, idx) => (
                          <button key={idx} onClick={() => handleAddDiagnosisShortcut(item)} className="bg-white hover:bg-blue-100 text-slate-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⚡ Medicines Templates</span>
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {medicineTemplates.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 hover:border-blue-300 transition-all text-xs">
                            <span onClick={() => handleAddMedicineShortcut(item)} className="font-mono text-slate-700 cursor-pointer hover:text-blue-600 flex-1">{item}</span>
                            <button onClick={() => handleDeleteCustomMedicineTemplate(idx)} className="text-red-500 hover:text-red-700 font-bold pl-2">×</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">💾 Store Custom Template</span>
                      <div className="flex gap-2">
                        <input type="text" value={customTemplateInput} onChange={(e) => setCustomTemplateInput(e.target.value)} placeholder="e.g. Tab Flagyl 400mg -- 1+1+1" className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                        <button onClick={handleSaveCustomMedicineTemplate} className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Pharmacy Stock Panel */}
        {activeTab === 'pharmacy' && userRole === 'Doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Stock Adder */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                💊 Add Inventory stock
              </h3>
              <form onSubmit={handleAddMedicineSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Medicine / Product Name *</label>
                  <input type="text" value={medForm.name} onChange={(e) => setMedForm({...medForm, name: e.target.value})} placeholder="e.g. Tab Paracetamol 500mg" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Wholesale Price *</label>
                    <input type="number" value={medForm.wholesalePrice} onChange={(e) => setMedForm({...medForm, wholesalePrice: e.target.value})} placeholder="PKR" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Retail POS Price *</label>
                    <input type="number" value={medForm.retailPrice} onChange={(e) => setMedForm({...medForm, retailPrice: e.target.value})} placeholder="PKR" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stock Quantity *</label>
                    <input type="number" value={medForm.stock} onChange={(e) => setMedForm({...medForm, stock: e.target.value})} placeholder="Pills/Bottles" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Min Stock Alert</label>
                    <input type="number" value={medForm.minStockAlert} onChange={(e) => setMedForm({...medForm, minStockAlert: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-100">
                  Save Product &amp; Update Stock
                </button>
              </form>
            </div>

            {/* Right Stock Ledger list */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">📦 Medicines Inventory Stock Ledger</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">{medicinesStock.length} Products</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px]">
                      <th className="py-3 px-2">Item Name</th>
                      <th className="py-3 px-2 text-right">Wholesale</th>
                      <th className="py-3 px-2 text-right">Retail Price</th>
                      <th className="py-3 px-2 text-center">Remaining Stock</th>
                      <th className="py-3 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicinesStock.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Inventory warehouse is currently empty. Add products.</td>
                      </tr>
                    ) : (
                      medicinesStock.map((m) => {
                        const minAlert = m.minStockAlert ?? m.min_stock_alert ?? 20;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-3 px-2 font-bold text-slate-800">{m.name}</td>
                            <td className="py-3 px-2 text-right font-mono">{m.wholesalePrice ?? m.wholesale_price ?? 0} PKR</td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-600 font-bold">{m.retailPrice ?? m.retail_price ?? 0} PKR</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono ${m.stock <= minAlert ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-700'}`}>
                                {m.stock} {m.stock <= minAlert ? '⚠️ LOW STOCK' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button onClick={() => handleDeleteMedicine(m.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Diagnostics Lab tabs */}
        {activeTab === 'lab' && userRole === 'Doctor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Test adder */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  🔬 Laboratory test Registry
                </h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Patient Search Database</span>
                  <input type="text" value={labSearchQuery} onChange={(e) => { setLabSearchQuery(e.target.value); setShowLabSearchResults(true); }} placeholder="Type patient name or PID" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none" />
                  {showLabSearchResults && filteredLabPatients.length > 0 && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                      {filteredLabPatients.map(p => (
                        <div key={p.pid} onClick={() => handleSelectLabPatient(p)} className="p-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer font-bold text-blue-600">
                          {p.name} ({p.pid})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddLabReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Selected Patient Name</label>
                    <input type="text" value={labForm.patientName} className="w-full bg-slate-100 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient ID (PID)</label>
                    <input type="text" value={labForm.pid} className="w-full bg-slate-100 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold font-mono" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Test Panel Group</label>
                    <select value={labForm.testName} onChange={(e) => setLabForm({...labForm, testName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none">
                      <option>CBC (Complete Blood Count)</option>
                      <option>Routine Urine Analysis</option>
                      <option>Blood Sugar Profile</option>
                      <option>Lipid Cholesterol Profile</option>
                      <option>Liver Function Tests (LFT)</option>
                      <option>Renal Kidney Profile (RFT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Diagnostic Report Result Outcome Value *</label>
                    <input type="text" value={labForm.resultValue} onChange={(e) => setLabForm({...labForm, resultValue: e.target.value})} placeholder="e.g. Hb 13.5 g/dl, Sugar 140 mg/dl" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>

                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md">
                    Log Laboratory Report Outcomes
                  </button>
                </form>
              </div>

              {/* Right Diagnostic History Registry */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-4">🔬 Patient Diagnostics Laboratory Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px]">
                        <th className="py-3 px-2">Patient Details</th>
                        <th className="py-3 px-2">Diagnostic Test Group</th>
                        <th className="py-3 px-2">Report Results Outcomes</th>
                        <th className="py-3 px-2">Verified Date</th>
                        <th className="py-3 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {labRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">No laboratory checkup outcomes registered yet.</td>
                        </tr>
                      ) : (
                        labRecords.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <span className="font-extrabold text-slate-800 block">{item.patientName ?? item.patient_name}</span>
                              <span className="text-slate-400 text-[10px] font-mono">{item.pid}</span>
                            </td>
                            <td className="py-3 px-2 font-bold text-blue-600">{item.testName ?? item.test_name}</td>
                            <td className="py-3 px-2 font-mono text-slate-700 font-bold">{item.resultValue ?? item.result_value}</td>
                            <td className="py-3 px-2 font-medium text-slate-500">{item.date}</td>
                            <td className="py-3 px-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic POS Checkout & Billing panels */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Patient Selector and Billing items cart */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900">💵 POS Invoice Cart</h3>
                  <button 
                    onClick={handleActivateWalkinCustomer} 
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    🛍️ Walk-In Mode (جنرل گاہک)
                  </button>
                </div>

                {/* Patient Lookup search */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Search Clinic Patient (optional)</span>
                  <input type="text" value={billingSearchQuery} onChange={(e) => { setBillingSearchQuery(e.target.value); setShowBillingSearchResults(true); }} placeholder="Type Patient Name or PID..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white" />
                  {showBillingSearchResults && filteredBillingPatients.length > 0 && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg max-h-32 overflow-y-auto shadow-sm">
                      {filteredBillingPatients.map(p => (
                        <div key={p.pid} onClick={() => handleSelectBillingPatient(p)} className="p-2 border-b border-slate-100 hover:bg-slate-50 cursor-pointer font-bold text-blue-600">
                          {p.name} ({p.pid})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {billingPatient ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/50 text-xs space-y-1 relative">
                      <p className="font-extrabold text-blue-900">Active Bill Mode: {billingPatient.name}</p>
                      <p className="text-blue-700 font-mono font-bold">PID: {billingPatient.pid}</p>
                      <p className="text-blue-600">Phone: {billingPatient.phone || 'N/A'}</p>
                      <button 
                        onClick={() => { setBillingPatient(null); setBillItems([]); }} 
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-black text-sm"
                      >
                        ×
                      </button>
                    </div>

                    {/* Custom OPD Fee adjustment */}
                    {billingPatient.pid !== 'PID-WALKIN' && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">OPD consultation fee (PKR)</label>
                        <input 
                          type="number" 
                          value={customOpdFee} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCustomOpdFee(val);
                            setBillItems(prev => prev.map(item => item.id === 'OPD-FEE' ? { ...item, price: val } : item));
                          }} 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">⚡ Select Medicine to Add (ادویات منتخب کریں)</span>
                        <select 
                          value={selectedPharmacyProduct} 
                          onChange={(e) => handleAddPharmacyProductDirectly(e.target.value)} 
                          className="w-full px-3 py-2.5 border border-blue-200 focus:border-blue-500 rounded-xl text-xs bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">-- Choose and click to add instantly --</option>
                          {medicinesStock.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} — (Stock: {m.stock} left) — Price: {m.retailPrice ?? m.retail_price ?? 0} PKR
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">⚡ Add Lab Investigation test</span>
                        <div className="flex gap-2">
                          <select value={selectedLabTest} onChange={(e) => setSelectedLabTest(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none">
                            <option>CBC (Complete Blood Count)</option>
                            <option>Routine Urine Analysis</option>
                            <option>Blood Sugar Profile</option>
                            <option>Lipid Cholesterol Profile</option>
                            <option>Liver Function Tests (LFT)</option>
                            <option>Renal Kidney Profile (RFT)</option>
                          </select>
                          <button onClick={handleAddLabTestToBill} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4">
                    <p className="text-2xl mb-1">👈</p>
                    <p className="text-xs font-bold text-slate-500">How to add items?</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click the green <strong className="text-emerald-600">🛍️ Walk-In Mode</strong> button above, or search for an active patient profile to load the medicine selector!
                    </p>
                  </div>
                )}
              </div>

              {/* Right cart contents list and checkout operations */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-4">🛒 Receipt checkout cart contents</h3>

                {billItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex-1 flex flex-col items-center justify-center">
                    <p className="text-2xl">🛒</p>
                    <p className="text-xs text-slate-400 mt-2">Invoice checkout cart is currently empty.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {billItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs hover:bg-slate-100/50 transition-colors">
                          <div className="flex-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block mb-1 ${item.type === 'OPD' ? 'bg-blue-100 text-blue-800' : item.type === 'Pharmacy' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>{item.type}</span>
                            <p className="font-extrabold text-slate-800">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.type === 'Pharmacy' ? (
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                                <button onClick={() => handleQuantityChange(item.id, item.qty - 1)} className="font-bold text-slate-500 hover:text-slate-800">-</button>
                                <span className="font-mono font-bold px-2">{item.qty}</span>
                                <button onClick={() => handleQuantityChange(item.id, item.qty + 1)} className="font-bold text-slate-500 hover:text-slate-800">+</button>
                              </div>
                            ) : (
                              <span className="font-medium text-slate-400">Qty: {item.qty}</span>
                            )}
                            <span className="font-mono font-extrabold text-slate-800 text-right w-16">{item.price * item.qty} PKR</span>
                            <button onClick={() => handleRemoveBillItem(item.id)} className="text-red-500 hover:text-red-700 font-extrabold text-sm pl-2">×</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice discount (PKR)</label>
                          <input type="number" value={billDiscount || ''} onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)} placeholder="0" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-slate-400 font-semibold">Subtotal: <span className="font-mono text-slate-800 font-bold">{billItems.reduce((s, i) => s + (i.price * i.qty), 0)} PKR</span></p>
                          <p className="text-xs text-slate-400 font-semibold">Discount: <span className="font-mono text-red-500 font-bold">-{billDiscount} PKR</span></p>
                          <p className="text-sm font-black text-slate-900">Grand total: <span className="font-mono text-emerald-600 text-lg">{Math.max(0, billItems.reduce((s, i) => s + (i.price * i.qty), 0) - billDiscount)} PKR</span></p>
                        </div>
                      </div>

                      <button onClick={handleCheckoutAndPrintReceipt} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2">
                        🖨️ Checkout Invoice &amp; Thermal Receipt print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Expenses tracker tab */}
        {activeTab === 'expenses' && userRole === 'Doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Expense Adder */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                💸 Log operational Expense
              </h3>
              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expense Title / description *</label>
                  <input type="text" value={expenseForm.title} onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})} placeholder="e.g. Tea for staff, Printing paper packs" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount (PKR) *</label>
                    <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="e.g. 1500" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Logged Date</label>
                    <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expense Category</label>
                  <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none">
                    <option>Tea &amp; Refreshments</option>
                    <option>Clinic Utilities Bills</option>
                    <option>Staff Salaries</option>
                    <option>Clinic Rent</option>
                    <option>Printing &amp; Stationery</option>
                    <option>Medicines purchase Stock</option>
                    <option>Miscellaneous operational Cost</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md">
                  Commit Expense transaction
                </button>
              </form>
            </div>

            {/* Right Expenses history lists */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">📋 operational Expenses Ledger کھاتہ</h3>
                <span className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full">{expensesLedger.length} Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px]">
                      <th className="py-3 px-2">Transaction Date</th>
                      <th className="py-3 px-2">Expense Details</th>
                      <th className="py-3 px-2">Expense Category</th>
                      <th className="py-3 px-2 text-right">Cost amount</th>
                      <th className="py-3 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expensesLedger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">No operational clinic expenses logged yet.</td>
                      </tr>
                    ) : (
                      expensesLedger.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium text-slate-500">{exp.date}</td>
                          <td className="py-3 px-2 font-bold text-slate-800">{exp.title}</td>
                          <td className="py-3 px-2">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">{exp.category}</span>
                          </td>
                          <td className="py-3 px-2 text-right font-black text-slate-900">{exp.amount} PKR</td>
                          <td className="py-3 px-2 text-center">
                            <button onClick={() => handleDeleteExpense(exp.id || '')} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {clinicConfig.clinicName} ERP Systems. Built with precision &amp; live cloud synchronization.</p>
      </footer>
    </div>
  );
}