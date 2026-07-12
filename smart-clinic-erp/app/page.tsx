'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Premium Clinic Configuration
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

// Supabase cloud connection configurations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
  created_at?: string;
}

interface Medicine {
  id: string;
  name: string;
  wholesalePrice?: number;
  wholesale_price?: number;
  retailPrice?: number;
  retail_price?: number;
  stock: number;
  minStockAlert?: number;
  min_stock_alert?: number;
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
  opd_total?: number;
  pharmacy_total?: number;
  lab_total?: number;
  discount: number;
  grand_total?: number;
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
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'Doctor' | 'Receptionist' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // PWA triggers & handlers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Cloud & Sync Engine states
  const [syncStatus, setSyncStatus] = useState<'live' | 'local'>('local');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'opd' | 'pharmacy' | 'lab' | 'billing' | 'expenses'>('dashboard');

  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsHistory, setVisitsHistory] = useState<Visit[]>([]);
  const [tokenQueue, setTokenQueue] = useState<Token[]>([]);
  const [medicinesStock, setMedicinesStock] = useState<Medicine[]>([]);
  const [labRecords, setLabRecords] = useState<LabReport[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [expensesLedger, setExpensesLedger] = useState<Expense[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Form Binding States
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '' });
  const [vitalsForm, setVitalsForm] = useState({ bp: '', temp: '', weight: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({ complaints: '', diagnosis: '', medicines: '' });

  const [complaintsSuggestions] = useState<string[]>(["Fever", "Flu & Running Nose", "Dry Cough", "Body Ache", "High Blood Pressure", "Chest Tightness", "Diarrhea", "Stomach Pain"]);
  const [diagnosisSuggestions] = useState<string[]>(["Acute Viral Infection", "Upper Respiratory Tract Infection (URTI)", "Gastroenteritis", "Essential Hypertension", "Bronchitis", "Enteric Fever"]);
  const [medicineTemplates, setMedicineTemplates] = useState<string[]>([
    "Tab Paracetamol 500mg -- 1+1+1 (5 Days)",
    "Syp Hydryll -- 2 tsp thrice daily (5 Days)",
    "Cap Amoxicillin 500mg -- 1+0+1 (5 Days)",
    "Tab Flagyl 400mg -- 1+1+1 (5 Days)",
    "Tab Loprin 75mg -- 0+1+0 (Daily)"
  ]);
  const [customTemplateInput, setCustomTemplateInput] = useState('');

  const [medForm, setMedForm] = useState({ name: '', wholesalePrice: '', retailPrice: '', stock: '', minStockAlert: '20' });
  const [labForm, setLabForm] = useState({ patientName: '', pid: '', testName: 'CBC (Complete Blood Count)', resultValue: '', date: '' });
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [showLabSearchResults, setShowLabSearchResults] = useState(false);

  const [billingSearchQuery, setBillingSearchQuery] = useState('');
  const [showBillingSearchResults, setShowBillingSearchResults] = useState(false);
  const [billingPatient, setBillingPatient] = useState<Patient | null>(null);
  const [billItems, setBillItems] = useState<{ id: string; name: string; price: number; type: 'OPD' | 'Pharmacy' | 'Lab'; qty: number; maxQty?: number }[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [selectedPharmacyProduct, setSelectedPharmacyProduct] = useState<string>('');
  const [selectedLabTest, setSelectedLabTest] = useState<string>('Routine Urine Analysis');
  const [customOpdFee, setCustomOpdFee] = useState<number>(0);

  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Tea & Refreshments', date: '' });

  useEffect(() => {
    setMounted(true);
    setExpenseForm(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));
    setLabForm(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));

    const savedRole = localStorage.getItem("sc_user_role");
    if (savedRole === "Doctor" || savedRole === "Receptionist") {
      setIsAuthenticated(true);
      setUserRole(savedRole as any);
      if (savedRole === "Receptionist") setActiveTab('opd');
    }

    loadLocalStoreFallbacks();
    testCloudSyncEngine();

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('🟢 PWA Service Worker bound successfully! Scope:', reg.scope))
          .catch((err) => console.warn('🔴 PWA Service Worker binding failed:', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
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
      const { error } = await supabase.from('patients').select('id').limit(1);
      if (error) throw error;
      setSyncStatus('live');
      syncCloudDataToLocal();
    } catch (err) {
      console.warn("Cloud synchronization failed. Running offline core.", err);
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
      console.error("Cloud pull operation failed", err);
    }
  };

  const handleSecurityPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinInput === "4142") {
      setIsAuthenticated(true);
      setUserRole('Doctor');
      localStorage.setItem("sc_user_role", "Doctor");
      setActiveTab('dashboard');
      triggerNotification(`👨‍⚕️ Welcome ${clinicConfig.doctor.name}!`);
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

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      return triggerNotification("⚠️ Expense title and amount are required!");
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      title: expenseForm.title,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date || new Date().toISOString().split("T")[0]
    };

    if (syncStatus === 'live' && supabase) {
      try {
        await supabase.from('expenses').insert([newExpense]);
      } catch (err) {
        console.error("Cloud saving expense failed", err);
      }
    }

    setExpensesLedger(prev => [newExpense, ...prev]);
    const currentLocalExp = JSON.parse(localStorage.getItem("sc_expenses") || "[]");
    localStorage.setItem("sc_expenses", JSON.stringify([newExpense, ...currentLocalExp]));

    setExpenseForm({ title: '', amount: '', category: 'Tea & Refreshments', date: new Date().toISOString().split("T")[0] });
    triggerNotification("💸 Expense recorded successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-blue-600">{clinicConfig.clinicName}</h1>
            <p className="text-xs text-slate-500">{clinicConfig.tagline} • Mode: <span className="font-semibold uppercase text-blue-500">{syncStatus}</span></p>
          </div>
          {isAuthenticated && (
            <div className="flex gap-4 items-center">
              <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{userRole}</span>
              <button onClick={handleLogout} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg">Logout</button>
            </div>
          )}
        </header>

        {alertMessage && (
          <div className="mb-4 bg-blue-600 text-white p-3 rounded-lg text-sm font-medium shadow-md transition-all">
            {alertMessage}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Enter Access PIN</h2>
            <form onSubmit={handleSecurityPinLogin}>
              <input 
                type="password" 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                placeholder="4142 (Doctor) or 1122 (Receptionist)" 
                className="w-full p-3 border rounded-lg mb-4 text-center text-lg tracking-widest"
              />
              {pinError && <p className="text-red-500 text-xs mb-4 text-center">{pinError}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">Login</button>
            </form>
          </div>
        ) : (
          <div>
            <nav className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border overflow-x-auto">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>📊 Dashboard</button>
              <button onClick={() => setActiveTab('opd')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'opd' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>🎟️ OPD Queue</button>
              <button onClick={() => setActiveTab('pharmacy')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'pharmacy' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>💊 Pharmacy</button>
              <button onClick={() => setActiveTab('lab')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'lab' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>🔬 Lab</button>
              <button onClick={() => setActiveTab('billing')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'billing' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>💳 Billing</button>
              <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'expenses' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}>💸 Expenses</button>
            </nav>

            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-sm font-bold text-slate-500 mb-1">Total Patients</h3>
                  <p className="text-3xl font-black text-blue-600">{patientsList.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-sm font-bold text-slate-500 mb-1">Tokens in Queue</h3>
                  <p className="text-3xl font-black text-amber-500">{tokenQueue.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-sm font-bold text-slate-500 mb-1">Total Expenses</h3>
                  <p className="text-3xl font-black text-rose-500">{clinicConfig.currency} {expensesLedger.reduce((acc, curr) => acc + curr.amount, 0)}</p>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-md font-bold mb-4">Add New Expense</h3>
                  <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Expense Title" 
                      value={expenseForm.title} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2.5 border rounded-lg text-sm"
                    />
                    <input 
                      type="number" 
                      placeholder="Amount (PKR)" 
                      value={expenseForm.amount} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full p-2.5 border rounded-lg text-sm"
                    />
                    <select 
                      value={expenseForm.category} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2.5 border rounded-lg text-sm bg-white"
                    >
                      <option value="Tea & Refreshments">Tea & Refreshments</option>
                      <option value="Utility Bills">Utility Bills</option>
                      <option value="Clinic Maintenance">Clinic Maintenance</option>
                      <option value="Staff Salaries">Staff Salaries</option>
                      <option value="Supplies">Supplies</option>
                    </select>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg text-sm font-bold hover:bg-blue-700">Save Expense</button>
                  </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border max-h-[400px] overflow-y-auto">
                  <h3 className="text-md font-bold mb-4">Recent Expenses Ledger</h3>
                  {expensesLedger.length === 0 ? (
                    <p className="text-slate-400 text-sm">No expenses recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {expensesLedger.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg text-sm">
                          <div>
                            <span className="font-semibold block">{exp.title}</span>
                            <span className="text-xs text-slate-400">{exp.category} • {exp.date}</span>
                          </div>
                          <span className="font-bold text-rose-600">{clinicConfig.currency} {exp.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}