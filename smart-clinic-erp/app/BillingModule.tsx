"use client";

import { useState } from "react";
import { clinicConfig } from "./clinicConfig";

export default function BillingModule() {
  const [patientName, setPatientName] = useState("");
  const [docFee, setDocFee] = useState(clinicConfig.doctor.consultationFee.toString());
  const [pharmacyFee, setPharmacyFee] = useState("0");
  const [labFee, setLabFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [bills, setBills] = useState<any[]>([]);

  const handleCalculateTotal = (dFee: number, pFee: number, lFee: number, disc: number) => {
    return (dFee + pFee + lFee) - disc;
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) return alert("Please enter Patient Name");

    const dFee = parseFloat(docFee) || 0;
    const pFee = parseFloat(pharmacyFee) || 0;
    const lFee = parseFloat(labFee) || 0;
    const disc = parseFloat(discount) || 0;
    const grandTotal = handleCalculateTotal(dFee, pFee, lFee, disc);

    const newInvoice = {
      id: Date.now(),
      name: patientName,
      doctorFee: dFee,
      pharmacyFee: pFee,
      labFee: lFee,
      discount: disc,
      total: grandTotal,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setBills([newInvoice, ...bills]);
    setPatientName("");
    setPharmacyFee("0");
    setLabFee("0");
    setDiscount("0");
  };

  const handlePrintInvoice = (bill: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups to print invoices");

    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - ${bill.name}</title>
          <style>
            body { font-family: monospace; color: #1e293b; padding: 20px; width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .title { font-size: 18px; font-weight: bold; }
            .info { font-size: 12px; margin-bottom: 15px; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
            th, td { padding: 6px 0; text-align: left; }
            th { border-bottom: 1px solid #000; }
            .text-right { text-align: right; }
            .total-section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 6px; font-size: 13px; line-height: 1.5; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin-top: 4px; }
            .footer { text-align: center; font-size: 11px; margin-top: 25px; color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🧾 ${clinicConfig.clinicName}</div>
            <div style="font-size: 11px;">${clinicConfig.tagline}</div>
          </div>

          <div class="info">
            <strong>Bill ID:</strong> ${bill.id}<br>
            <strong>Patient:</strong> ${bill.name}<br>
            <strong>Date:</strong> ${bill.date} | ${bill.time}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Doctor Consultation Fee</td>
                <td class="text-right">${bill.doctorFee.toFixed(2)}</td>
              </tr>
              ${bill.pharmacyFee > 0 ? `<tr><td>Pharmacy / Medicines</td><td class="text-right">${bill.pharmacyFee.toFixed(2)}</td></tr>` : ''}
              ${bill.labFee > 0 ? `<tr><td>Laboratory Charges</td><td class="text-right">${bill.labFee.toFixed(2)}</td></tr>` : ''}
            </tbody>
          </table>

          <div class="total-section">
            ${bill.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Discount:</span><span>-${bill.discount.toFixed(2)}</span></div>` : ''}
            <div class="grand-total style="display:flex; justify-content:space-between;">
              <span>GRAND TOTAL:</span>
              <span class="text-right">${clinicConfig.currency} ${bill.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for visiting!<br>
            Software Powered by Mohsin AI
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        💳 Billing Counter &amp; Invoicing
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Generator Form */}
        <form onSubmit={handleSaveBill} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200/60 h-fit">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Name *</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Adeeb Haider" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Doctor Fee ({clinicConfig.currency})</label>
              <input type="number" value={docFee} onChange={(e) => setDocFee(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pharmacy Bill</label>
              <input type="number" value={pharmacyFee} onChange={(e) => setPharmacyFee(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Lab Charges</label>
              <input type="number" value={labFee} onChange={(e) => setLabFee(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Discount (if any)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-700">Calculated Total:</span>
            <span className="text-lg font-black text-emerald-600">
              {clinicConfig.currency} {handleCalculateTotal(parseFloat(docFee)||0, parseFloat(pharmacyFee)||0, parseFloat(labFee)||0, parseFloat(discount)||0)}
            </span>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-100">
            🧾 Generate &amp; Print Receipt
          </button>
        </form>

        {/* Live Closing Summary / Recent Bills */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700">Today's Invoices &amp; Closing</h4>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
              Total Collection: {clinicConfig.currency} {bills.reduce((sum, b) => sum + b.total, 0)}
            </span>
          </div>
          
          {bills.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm text-slate-400 font-medium">No billing entries created yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{bill.name}</h5>
                    <p className="text-xs text-slate-500">
                      Doc: {bill.doctorFee} | Phar: {bill.pharmacyFee} | Lab: {bill.labFee} 
                      {bill.discount > 0 && ` | Disc: ${bill.discount}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-800">{clinicConfig.currency} {bill.total}</span>
                    <button onClick={() => handlePrintInvoice(bill)} className="bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                      🖨️ Print Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}