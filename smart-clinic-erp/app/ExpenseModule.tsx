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

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpenseModule() {
  const [mounted, setMounted] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Form Inputs
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Tea & Refreshments");
  const [date, setDate] = useState("");

  // Income Sources (Auto calculated from other modules + Manual override)
  const [manualRevenue, setManualRevenue] = useState<number>(0);
  const [opdRevenue, setOpdRevenue] = useState<number>(0);
  const [pharmacyRevenue, setPharmacyRevenue] = useState<number>(0);
  const [labRevenue, setLabRevenue] = useState<number>(0);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setDate(new Date().toISOString().split("T")[0]);
    const storedExpenses = localStorage.getItem("sc_expenses");
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

    // Auto-calculate Revenue from existing LocalStorage of other modules
    calculateAutoRevenues();
  }, []);

  // Save Data
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sc_expenses", JSON.stringify(expenses));
  }, [expenses, mounted]);

  const calculateAutoRevenues = () => {
    // A. OPD Revenue from Visits History
    const storedVisits = localStorage.getItem("sc_visits");
    if (storedVisits) {
      const visits = JSON.parse(storedVisits);
      const consultationFee = clinicConfig.doctor.consultationFee || 500;
      setOpdRevenue(visits.length * consultationFee);
    }

    // B. Pharmacy Revenue from pharmacy billing / sales (if saved under billing)
    const storedBills = localStorage.getItem("sc_billing_records"); 
    if (storedBills) {
      const bills = JSON.parse(storedBills);
      let pharmSum = 0;
      let labSum = 0;
      bills.forEach((bill: any) => {
        if (bill.type === "Pharmacy" || bill.pharmacyTotal) {
          pharmSum += Number(bill.pharmacyTotal || bill.total || 0);
        }
        if (bill.type === "Lab" || bill.labTotal) {
          labSum += Number(bill.labTotal || bill.total || 0);
        }
      });
      setPharmacyRevenue(pharmSum);
      setLabRevenue(labSum);
    }
  };

  if (!mounted) return null;

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return triggerAlert("⚠️ Please enter Title and Amount!");

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      title,
      amount: parseFloat(amount),
      category,
      date,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setTitle("");
    setAmount("");
    triggerAlert("💸 Expense Logged Successfully!");
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    triggerAlert("🗑️ Expense Deleted!");
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRevenue = opdRevenue + pharmacyRevenue + labRevenue + manualRevenue;
  const netProfit = totalRevenue - totalExpenses;

  // Categories list with Urdu Translation for ease of use
  const categories = [
    { name: "Tea & Refreshments", urdu: "چائے پانی / کھانا" },
    { name: "Staff Salaries", urdu: "سٹاف کی تنخواہ" },
    { name: "Clinic Rent", urdu: "کلینک کا کرایہ" },
    { name: "Utility Bills", urdu: "بجلی، گیس، انٹرنیٹ بل" },
    { name: "Stationery & Printing", urdu: "پرنٹنگ پیپرز و فائلیں" },
    { name: "Medicines Purchase", urdu: "ادویات کی ہول سیل خریداری" },
    { name: "Others", urdu: "متفرق اخراجات" },
  ];

  return (
    <div className="space-y-8 mt-8" id="expense-module">
      {/* Alert Banner */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700">
          <span>🔔</span>
          <p className="text-xs font-bold">{alertMessage}</p>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total OPD Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">OPD Income (کل فیس)</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{opdRevenue} <span className="text-xs font-medium text-slate-400">PKR</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Auto calculated from medical history</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Total Expenses (کل اخراجات)</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalExpenses} <span className="text-xs font-medium text-slate-400">PKR</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Sum of all registered logs below</p>
        </div>

        {/* Other / Manual Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Other/Manual Income (دیگر آمدن)</span>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="number" 
              value={manualRevenue || ""} 
              onChange={(e) => setManualRevenue(Number(e.target.value))}
              placeholder="0" 
              className="w-full text-lg font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">PKR</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Enter manual income if any</p>
        </div>

        {/* Net Profit Card */}
        <div className={`p-5 rounded-2xl border text-white shadow-md ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">Net Profit (خالص منافع)</span>
          <h3 className="text-3xl font-black mt-1">
            {netProfit} <span className="text-xs font-bold">PKR</span>
          </h3>
          <p className="text-[10px] opacity-80 mt-1">
            {netProfit >= 0 ? "🎉 Outstanding! You are in profit." : "⚠️ Warning: Expenses are higher than income."}
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Add New Expense */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            💸 Log New Expense (اخراجات کا اندراج)
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expense Title / تفصیل *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Printing paper pack, Tea for staff" 
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount (PKR) *</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="e.g. 1500" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category / زمرہ</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} — {cat.urdu}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-red-100 mt-2">
              📝 Save Expense (خرچہ درج کریں)
            </button>
          </form>
        </div>

        {/* Right Table: Expenses History Ledger */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              📋 Expense Ledger History (لیجر کھاتہ)
            </h3>
            <span className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full">
              {expenses.length} Records
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex-1 flex flex-col items-center justify-center">
              <p className="text-2xl mb-1">🌿</p>
              <p className="text-sm font-semibold text-slate-400">No expenses recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Enter details on the left to start calculating net profits.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px]">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Title</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 font-medium text-slate-500">
                        {new Date(exp.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-800">{exp.title}</td>
                      <td className="py-3 px-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-black text-slate-900">{exp.amount} PKR</td>
                      <td className="py-3 px-2 text-center">
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}