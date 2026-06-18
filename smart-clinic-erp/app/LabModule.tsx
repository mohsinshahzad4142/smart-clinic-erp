"use client";

import { useState } from "react";
import { clinicConfig } from "./clinicConfig";

export default function LabModule() {
  const [patientName, setPatientName] = useState("");
  const [testType, setTestType] = useState("Blood Sugar");
  const [resultValue, setResultValue] = useState("");
  const [labRecords, setLabRecords] = useState<any[]>([]);

  // ٹیسٹ کی نارمل رینجز (Reference Values)
  const testReferences: { [key: string]: { unit: string; range: string } } = {
    "Blood Sugar": { unit: "mg/dL", range: "70 - 140 (Fasting/Random)" },
    "CBC (Hemoglobin)": { unit: "g/dL", range: "12.0 - 16.0 (W) / 13.5 - 17.5 (M)" },
    "Typhoid (Widal)": { unit: "Status", range: "Negative" },
  };

  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !resultValue) return alert("Please fill Patient Name and Test Result");

    const newReport = {
      id: Date.now(),
      name: patientName,
      test: testType,
      result: resultValue,
      unit: testReferences[testType].unit,
      reference: testReferences[testType].range,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLabRecords([newReport, ...labRecords]);
    setPatientName("");
    setResultValue("");
  };

  const handlePrintLab = (report: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups to print reports");

    const labHTML = `
      <html>
        <head>
          <title>Lab Report - ${report.name}</title>
          <style>
            body { font-family: sans-serif; color: #334155; padding: 40px; }
            .header { text-align: center; border-bottom: 3px solid #d97706; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 26px; font-weight: bold; color: #d97706; }
            .patient-bar { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; margin-bottom: 35px; font-size: 14px; rounded: 6px; }
            table { w-full; width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f1f5f9; color: #1e293b; font-size: 14px; text-transform: uppercase; }
            .result-row { font-size: 15px; font-weight: bold; color: #0f172a; }
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🔬 ${clinicConfig.clinicName} (Lab Division)</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Reliable Diagnostics, Accurate Results</div>
          </div>

          <div class="patient-bar">
            <div><strong>Patient Name:</strong> ${report.name}</div>
            <div><strong>Date:</strong> ${report.date}</div>
            <div><strong>Time:</strong> ${report.time}</div>
          </div>

          <h3 style="color: #1e3a8a; border-b: 1px solid #e2e8f0; pb: 4px;">LABORATORY TEST REPORT</h3>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result Obtains</th>
                <th>Unit</th>
                <th>Normal Reference Range</th>
              </tr>
            </thead>
            <tbody>
              <tr class="result-row">
                <td>${report.test}</td>
                <td style="color: #2563eb;">${report.result}</td>
                <td>${report.unit}</td>
                <td style="color: #64748b; font-weight: normal; font-size: 13px;">${report.reference}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Reported By: <strong>${clinicConfig.doctor.name}</strong><br>
            📞 Phone: ${clinicConfig.contact.phone} • 📍 Address: ${clinicConfig.contact.address}
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(labHTML);
    printWindow.document.close();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        🔬 Diagnostics &amp; Lab Report Generator
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Form */}
        <form onSubmit={handleSaveLab} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200/60 h-fit">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Patient Name *</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Adeeb Haider" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-white" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Test Type</label>
            <select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-500">
              <option>Blood Sugar</option>
              <option>CBC (Hemoglobin)</option>
              <option>Typhoid (Widal)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Test Result / Value *</label>
            <input type="text" value={resultValue} onChange={(e) => setResultValue(e.target.value)} placeholder={`e.g. 110 or 14.2`} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-white" />
            <span className="text-[11px] text-slate-400 mt-1 block">Normal: {testReferences[testType].range} ({testReferences[testType].unit})</span>
          </div>

          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-md shadow-amber-100">
            ➕ Save &amp; Generate Report
          </button>
        </form>

        {/* Lab Records List */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-sm font-bold text-slate-700">Recent Lab Tests Reports</h4>
          
          {labRecords.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm text-slate-400 font-medium">No lab reports generated today.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {labRecords.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{report.name}</h5>
                    <p className="text-xs text-slate-500">{report.test} — <span className="font-bold text-amber-600">{report.result} {report.unit}</span></p>
                  </div>
                  <button onClick={() => handlePrintLab(report)} className="bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                    🖨️ Print Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}