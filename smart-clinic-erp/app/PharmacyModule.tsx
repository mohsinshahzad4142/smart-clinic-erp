"use client";

import { useState } from "react";
import { clinicConfig } from "./clinicConfig";

interface Medicine {
  id: number;
  name: string;
  stock: number;
  price: number;
  expiry: string;
}

export default function PharmacyModule() {
  // ڈیمو ڈیٹا تاکہ شروع میں ہی خالی نظر نہ آئے
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: "Tab Panadol 500mg", stock: 150, price: 5, expiry: "2028-12" },
    { id: 2, name: "Syr Amoxil 250mg", stock: 4, price: 90, expiry: "2027-08" },
    { id: 3, name: "Tab Flagyl 400mg", stock: 45, price: 8, expiry: "2025-03" }, // Expired
  ]);

  // فارم اسٹیٹس
  const [medName, setMedName] = useState("");
  const [medStock, setMedStock] = useState("");
  const [medPrice, setMedPrice] = useState("");
  const [medExpiry, setMedExpiry] = useState("");

  // سیل (Sale) اسٹیٹس
  const [selectedMedId, setSelectedMedId] = useState("");
  const [saleQty, setSaleQty] = useState("");
  const [salesLog, setSalesLog] = useState<any[]>([]);

  // 📅 ایکسپائری چیک کرنے کا فنکشن
  const isExpired = (expiryStr: string) => {
    if (!expiryStr) return false;
    const today = new Date();
    const expiryDate = new Date(expiryStr + "-01"); // مہینے کا پہلا دن
    return expiryDate < today;
  };

  // 📥 نیا سٹاک خریدنا / ایڈ کرنا (Purchase)
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medStock || !medPrice || !medExpiry) {
      return alert("Please fill all medicine fields");
    }

    // چیک کریں کہ کہیں یہ دوائی پہلے سے تو موجود نہیں
    const existingIndex = medicines.findIndex(m => m.name.toLowerCase() === medName.toLowerCase());

    if (existingIndex > -1) {
      // اگر پہلے سے ہے تو سٹاک پلس کر دیں
      const updated = [...medicines];
      updated[existingIndex].stock += parseInt(medStock);
      updated[existingIndex].price = parseFloat(medPrice); // نئی قیمت اپڈیٹ
      updated[existingIndex].expiry = medExpiry;
      setMedicines(updated);
      alert("Stock updated for existing medicine!");
    } else {
      // نئی دوائی ایڈ کریں
      const newMed: Medicine = {
        id: Date.now(),
        name: medName,
        stock: parseInt(medStock),
        price: parseFloat(medPrice),
        expiry: medExpiry,
      };
      setMedicines([...medicines, newMed]);
      alert("New medicine added to inventory!");
    }

    // فارم صاف کریں
    setMedName("");
    setMedStock("");
    setMedPrice("");
    setMedExpiry("");
  };

  // 💸 دوائی سیل کرنا (Sale)
  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedId || !saleQty) return alert("Select medicine and quantity");

    const medId = parseInt(selectedMedId);
    const qty = parseInt(saleQty);
    const medicine = medicines.find(m => m.id === medId);

    if (!medicine) return;
    if (medicine.stock < qty) return alert(`Not enough stock! Available: ${medicine.stock}`);
    if (isExpired(medicine.expiry)) {
      const confirmSale = window.confirm("⚠️ This medicine is EXPIRED! Are you sure you want to sell it?");
      if (!confirmSale) return;
    }

    // سٹاک مائنس کریں
    setMedicines(medicines.map(m => m.id === medId ? { ...m, stock: m.stock - qty } : m));

    // سیلز لاگ بنائیں
    const totalBill = medicine.price * qty;
    const newSaleLog = {
      id: Date.now(),
      name: medicine.name,
      qty: qty,
      total: totalBill,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSalesLog([newSaleLog, ...salesLog]);
    setSaleQty("");
    alert(`Sold successfully! Total: ${clinicConfig.currency} ${totalBill}`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📦 Pharmacy Inventory &amp; POS Counter
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage medicine stock, expiry dates, and point-of-sales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Purchase & Sale Forms */}
        <div className="space-y-6">
          {/* 1. Purchase Form (Add Stock) */}
          <form onSubmit={handleAddStock} className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">📥 Purchase / Add New Stock</h4>
            <div>
              <input type="text" value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Medicine Name (e.g. Panadol)" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={medStock} onChange={(e) => setMedStock(e.target.value)} placeholder="Qty (e.g. 100)" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
              <input type="number" value={medPrice} onChange={(e) => setMedPrice(e.target.value)} placeholder="Retail Price" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Expiry Date</label>
              <input type="month" value={medExpiry} onChange={(e) => setMedExpiry(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm">
              ➕ Add To Inventory
            </button>
          </form>

          {/* 2. Sale Form (POS counter) */}
          <form onSubmit={handleSale} className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">💸 Pharmacy POS / Quick Sale</h4>
            <div>
              <select value={selectedMedId} onChange={(e) => setSelectedMedId(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500">
                <option value="">-- Select Medicine --</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id} disabled={m.stock === 0}>
                    {m.name} (Stock: {m.stock} | Price: {m.price})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input type="number" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} placeholder="Sale Quantity" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm">
              🚀 Complete Sale &amp; Deduct
            </button>
          </form>
        </div>

        {/* Right Column: Live Inventory Table & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">📊 Real-Time Available Stock &amp; Expiry Ledger</h4>
            </div>
            <div className="overflow-x-auto max-h-[250px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-2.5">Medicine Name</th>
                    <th className="p-2.5 text-center">Available Stock</th>
                    <th className="p-2.5">Price</th>
                    <th className="p-2.5">Expiry</th>
                    <th className="p-2.5 text-right">Status Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m) => {
                    const lowStock = m.stock <= 10;
                    const expired = isExpired(m.expiry);

                    return (
                      <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold text-slate-800">{m.name}</td>
                        <td className={`p-2.5 text-center font-bold ${lowStock ? 'text-red-600' : 'text-slate-700'}`}>{m.stock}</td>
                        <td className="p-2.5 font-medium">{clinicConfig.currency} {m.price}</td>
                        <td className={`p-2.5 font-medium ${expired ? 'text-red-500' : 'text-slate-500'}`}>{m.expiry}</td>
                        <td className="p-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            {expired && <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded">❌ Expired</span>}
                            {m.stock === 0 ? (
                              <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded">Out of Stock</span>
                            ) : lowStock ? (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse">⚠️ Low Stock</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Good Stock</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Logs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">📈 Today's Pharmacy Sales Dispatch</h4>
            {salesLog.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No sales transactions logged yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {salesLog.map((log) => (
                  <div key={log.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-slate-200">
                    <span><strong>{log.name}</strong> (x{log.qty}) <span className="text-[10px] text-slate-400">at {log.time}</span></span>
                    <span className="font-bold text-emerald-600">+{clinicConfig.currency} {log.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}