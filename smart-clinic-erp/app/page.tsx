"use client";

import { useState, useEffect } from "react";

// Inlined Professional Clinic Configuration
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

// ... (Baaki saare Interfaces yahan pehle ki tarah hi rahenge)
interface Patient { pid: string; name: string; age: string; gender: string; phone: string; }
interface Visit { id: string; pid: string; date: string; time: string; complaints: string; diagnosis: string; medicines: string; vitals: { bp: string; temp: string; weight: string }; tokenNumber: number; }
interface Token { tokenNumber: number; pid: string; name: string; age: string; gender: string; phone: string; vitals: { bp: string; temp: string; weight: string }; time: string; }
interface LabTest { id: string; name: string; category: string; price: number; referenceRange: string; }
interface LabReport { id: string; patientName: string; pid: string; testName: string; resultValue: string; date: string; status: string; }
interface Medicine { id: string; name: string; wholesalePrice: number; retailPrice: number; stock: number; minStockAlert: number; }
interface Invoice { id: string; patientName: string; pid: string; opdFee: number; pharmacyTotal: number; labTotal: number; discount: number; grandTotal: number; date: string; }
interface Expense { id: string; title: string; amount: number; category: string; date: string; }

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // --- CORE DATA STATES ---
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [visitsHistory, setVisitsHistory] = useState<Visit[]>([]);
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [tokenCounter, setTokenCounter] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labTestsCatalog, setLabTestsCatalog] = useState<LabTest[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [billingRecords, setBillingRecords] = useState<Invoice[]>([]);

  // --- FORM INPUTS ---
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientVitals, setPatientVitals] = useState({ bp: "", temp: "", weight: "" });
  const [selectedExistingPid, setSelectedExistingPid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [prescription, setPrescription] = useState({ complaints: "", Diagnosis: "", medicines: "" });
  
  // Expense Inputs
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Tea & Refreshments");
  const [expenseDate, setExpenseDate] = useState("");

  useEffect(() => {
    setMounted(true);
    setExpenseDate(new Date().toISOString().split("T"));
    // (Localstorage loading logic remains same)
  }, []);

  const triggerAlert = (msg: string) => { setAlertMessage(msg); setTimeout(() => setAlertMessage(null), 3500); };

  // --- EXPENSE LOGIC ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return triggerAlert("⚠️ Enter Title and Amount!");
    const newExpense: Expense = { id: `EXP-${Date.now()}`, title: expenseTitle, amount: parseFloat(expenseAmount), category: expenseCategory, date: expenseDate };
    setExpenses(prev => [newExpense, ...prev]);
    setExpenseTitle(""); setExpenseAmount("");
    triggerAlert("💸 Expense Logged!");
  };

  const handleDeleteExpense = (id: string) => { setExpenses(prev => prev.filter(exp => exp.id !== id)); };

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRevenue = (visitsHistory.length * clinicConfig.doctor.consultationFee) + billingRecords.reduce((sum, rec) => sum + rec.labTotal + rec.pharmacyTotal, 0);
  const netProfit = totalRevenue - totalExpenses;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      {/* Navigation */}
      <nav className="flex gap-2 mb-8">
        <button onClick={() => setActiveTab("dashboard")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Dashboard</button>
        <button onClick={() => setActiveTab("expense")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Expenses</button>
      </nav>

      {/* DASHBOARD VIEW */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-green-200">
            <h3 className="text-sm font-bold text-green-600">NET PROFIT</h3>
            <p className="text-3xl font-black">{netProfit} PKR</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-red-200">
            <h3 className="text-sm font-bold text-red-600">TOTAL EXPENSES</h3>
            <p className="text-3xl font-black">{totalExpenses} PKR</p>
          </div>
        </div>
      )}

      {/* EXPENSE VIEW */}
      {activeTab === "expense" && (
        <div className="space-y-6">
          <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} className="p-3 border rounded-xl" />
            <input type="number" placeholder="Amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="p-3 border rounded-xl" />
            <button type="submit" className="col-span-2 bg-blue-600 text-white p-3 rounded-xl font-bold">Log Expense</button>
          </form>

          <table className="w-full bg-white rounded-2xl shadow-sm">
            {expenses.map(exp => (
              <tr key={exp.id} className="border-b">
                <td className="p-4">{exp.title}</td>
                <td className="p-4 font-bold text-red-600">{exp.amount} PKR</td>
                <td className="p-4"><button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500">Delete</button></td>
              </tr>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}