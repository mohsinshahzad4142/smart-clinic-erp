'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

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

  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '' });
  const [vitalsForm, setVitalsForm] = useState({ bp: '', temp: '', weight: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);

  const [medForm, setMedForm] = useState({ name: '', wholesalePrice: '', retailPrice: '', stock: '', minStockAlert: '20' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Tea & Refreshments', date: '' });

  useEffect(() => {
    setMounted(true);
    setExpenseForm(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));

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
        navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW failed:', err));
      };
      if (document.readyState === 'complete') registerSW();
      else window.addEventListener('load', registerSW);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
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

    if (rawPatients) setPatientsList(JSON.parse(rawPatients));
    if (rawVisits) setVisitsHistory(JSON.parse(rawVisits));
    if (rawTokens) setTokenQueue(JSON.parse(rawTokens));
    if (rawCounter) setTokenCounter(parseInt(rawCounter, 10));
    if (rawMeds) setMedicinesStock(JSON.parse(rawMeds));
    if (rawLab) setLabRecords(JSON.parse(rawLab));
    if (rawBills) setBillingRecords(JSON.parse(rawBills));
    if (rawExpenses) setExpensesLedger(JSON.parse(rawExpenses));
  };

  const testCloudSyncEngine = async () => {
    if (!supabase) { setSyncStatus('local'); return; }
    try {
      const { error } = await supabase.from('patients').select('id').limit(1);
      if (error) throw error;
      setSyncStatus('live');
      syncCloudDataToLocal();
    } catch (err) {
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
          setTokenCounter(Math.max(...formattedTokens.map(f => f.tokenNumber)) + 1);
        }
      }
      if (vt) { setVisitsHistory(vt); localStorage.setItem("sc_visits", JSON.stringify(vt)); }
      if (md) { setMedicinesStock(md); localStorage.setItem("sc_medicines", JSON.stringify(md)); }
      if (bl) { setBillingRecords(bl); localStorage.setItem("sc_bills", JSON.stringify(bl)); }
      if (ex) { setExpensesLedger(ex); localStorage.setItem("sc_expenses", JSON.stringify(ex)); }
    } catch (err) {
      console.error(err);
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

  const handleInstallAppClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') triggerNotification("🎉 App installed!");
    setDeferredPrompt(null);
    setShowInstallBtn(false);
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
    triggerNotification(`Auto-Filled: ${p.name}`);
  };

  const handleRegisterTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.age) return triggerNotification("⚠️ Name and Age required!");

    let finalPid = selectedExistingPid;
    if (!finalPid) {
      finalPid = `PID-${1001 + patientsList.length}`;
      const newPatient: Patient = { pid: finalPid, ...patientForm };
      if (syncStatus === 'live' && supabase) {
        await supabase.from('patients').insert([newPatient]).catch((err: any) => console.error(err));
      }
      setPatientsList(prev => [newPatient, ...prev]);
      localStorage.setItem("sc_patients", JSON.stringify([newPatient, ...patientsList]));
    }

    const newToken: Token = {
      tokenNumber: tokenCounter,
      pid: finalPid,
      ...patientForm,
      vitals: vitalsForm,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (syncStatus === 'live' && supabase) {
      await supabase.from('tokens').insert([{
        token_number: newToken.tokenNumber,
        pid: newToken.pid,
        name: newToken.name,
        age: newToken.age,
        gender: newToken.gender,
        phone: newToken.phone,
        vitals: JSON.stringify(newToken.vitals),
        time: newToken.time
      }]).catch((err: any) => console.error(err));
    }

    setTokenQueue(prev => [...prev, newToken]);
    localStorage.setItem("sc_tokens", JSON.stringify([...tokenQueue, newToken]));
    setTokenCounter(prev => prev + 1);
    localStorage.setItem("sc_token_counter", (tokenCounter + 1).toString());

    setPatientForm({ name: '', age: '', gender: 'Male', phone: '' });
    setVitalsForm({ bp: '', temp: '', weight: '' });
    setSelectedExistingPid(null);
    triggerNotification(`🎟️ Issued Token #${tokenCounter}`);
  };

  const handleRemoveToken = async (id?: string, tokenNum?: number) => {
    if (id && syncStatus === 'live' && supabase) {
      await supabase.from('tokens').delete().eq('id', id).catch((err: any) => console.error(err));
    }
    const updated = tokenQueue.filter(t => t.id !== id && t.tokenNumber !== tokenNum);
    setTokenQueue(updated);
    localStorage.setItem("sc_tokens", JSON.stringify(updated));
    triggerNotification("✅ Token processed & removed from active queue.");
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-blue-900">{clinicConfig.clinicName}</h1>
            <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Authentication Desk</p>
          </div>
          <form onSubmit={handleSecurityPinLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enter PIN (4142 or 1122)</label>
              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-center text-xl font-bold tracking-widest focus:ring-2 focus:ring-blue-600 outline-none text-slate-900"
              />
            </div>
            {pinError && <p className="text-red-600 text-xs text-center font-medium">{pinError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg text-sm">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate Dashboard Metrics
  const totalRevenue = billingRecords.reduce((acc, curr) => acc + (curr.grand_total || 0), 0);
  const totalExpenses = expensesLedger.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800">
      <header className="bg-slate-950 text-white px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏥</div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">{clinicConfig.clinicName}</h1>
            <p className="text-xs text-blue-400 font-medium">{clinicConfig.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showInstallBtn && (
            <button onClick={handleInstallAppClick} className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-extrabold animate-bounce">
              💻 Install App
            </button>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${syncStatus === 'live' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {syncStatus === 'live' ? 'LIVE SYNC' : 'OFFLINE'}
          </div>
          <button onClick={handleLogout} className="bg-rose-950 text-rose-300 px-3 py-1 rounded-md text-xs font-bold border border-rose-800">
            Exit 🔒
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        <nav className="flex items-center border-b border-slate-200 overflow-x-auto bg-white rounded-xl shadow-sm px-2 gap-1">
          {[
            { id: 'dashboard', label: 'Overview Analytics', icon: '📊' },
            { id: 'opd', label: 'OPD Queue Registry', icon: '📋' },
            { id: 'pharmacy', label: 'Pharmacy Stock', icon: '💊' },
            { id: 'lab', label: 'Diagnostics Lab', icon: '🔬' },
            { id: 'billing', label: 'POS Checkout & Billing', icon: '💵' },
            { id: 'expenses', label: 'Expenses Ledger', icon: '📉' }
          ].map((tab) => (
            <button
              key={tab.id}
              disabled={userRole === 'Receptionist' && ['dashboard', 'expenses'].includes(tab.id)}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-800'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        {alertMessage && (
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold shadow-2xl flex items-center gap-2 fixed bottom-5 right-5 z-50 text-xs">
            ⚡ <span>{alertMessage}</span>
          </div>
        )}

        {/* Dashboard Analytics View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Revenue</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">PKR {totalRevenue}</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Active Token Queue</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{tokenQueue.length} Patients</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Registered Patients</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{patientsList.length} Profiles</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Expenses</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">PKR {totalExpenses}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm text-center py-16">
              <h3 className="text-lg font-black text-slate-900">Welcome to Smart Clinic Dashboard</h3>
              <p className="text-xs text-slate-500 mt-1">Select any tab above to manage OPD queues, inventory, or billing.</p>
            </div>
          </div>
        )}

        {/* OPD Queue Registry View */}
        {activeTab === 'opd' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 bg-white rounded-2xl border p-6 shadow-sm h-fit space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Issue OPD Token</h3>
              
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Existing Patient</label>
                <input
                  type="text"
                  placeholder="Search by Name or PID..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                  className="w-full border px-3 py-2 rounded-xl text-xs bg-slate-50 outline-none"
                />
                {showSearchResults && filteredPatients.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y">
                    {filteredPatients.map((p) => (
                      <div key={p.pid} onClick={() => handleSelectReturningPatient(p)} className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer">
                        <p className="font-bold">{p.name} ({p.pid})</p>
                        <p className="text-slate-400 text-[10px]">{p.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleRegisterTokenSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    className="w-full border px-3 py-2 rounded-xl text-xs bg-slate-50 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Age *</label>
                    <input
                      type="text"
                      required
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                      className="w-full border px-3 py-2 rounded-xl text-xs bg-slate-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      className="w-full border px-3 py-2 rounded-xl text-xs bg-slate-50 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="w-full border px-3 py-2 rounded-xl text-xs bg-slate-50 outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition mt-2">
                  Issue Token #{tokenCounter}
                </button>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white rounded-2xl border p-6 shadow-sm min-h-[400px]">
              <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Active Token Queue ({tokenQueue.length})</h3>
              <div className="space-y-3">
                {tokenQueue.length === 0 ? (
                  <p className="py-12 text-center text-slate-400 font-medium italic">No active tokens in queue.</p>
                ) : (
                  tokenQueue.map((t) => (
                    <div key={t.id || t.tokenNumber} className="border p-4 rounded-xl flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md font-black text-xs">Token #{t.tokenNumber}</span>
                        <h4 className="font-bold text-slate-900 mt-2 text-sm">{t.name} ({t.gender}, {t.age})</h4>
                        <p className="text-xs text-slate-500">PID: {t.pid} | Time: {t.time}</p>
                      </div>
                      <button onClick={() => handleRemoveToken(t.id, t.tokenNumber)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                        Complete / Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Other Tabs Placeholder */}
        {activeTab !== 'dashboard' && activeTab !== 'opd' && (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm max-w-xl mx-auto border-dashed border-slate-300">
            <div className="text-4xl mb-2">⚙️</div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{activeTab} Interface Loaded</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">All database sync features are active.</p>
          </div>
        )}
      </main>
    </div>
  );
}