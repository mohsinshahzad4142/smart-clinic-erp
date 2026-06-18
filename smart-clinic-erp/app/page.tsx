import { clinicConfig } from "./clinicConfig";
import PatientForm from "./PatientForm";
import LabModule from "./LabModule";
import PharmacyModule from "./PharmacyModule"; // <-- نیا فارمیسی موڈیول امپورٹ کر لیا
import BillingModule from "./BillingModule";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Professional Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-600 flex items-center gap-2">
              🏥 {clinicConfig.clinicName}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{clinicConfig.tagline}</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">System Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome & Doctor Quick View Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-blue-700/50">
          <div className="max-w-3xl">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Welcome Back
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3">
              {clinicConfig.doctor.name}
            </h2>
            <p className="text-blue-100 font-medium text-sm sm:text-base mt-1">
              {clinicConfig.doctor.specialty} — <span className="text-xs opacity-90">{clinicConfig.doctor.degree}</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-sm">
              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-xs text-blue-200">Location</p>
                  <p className="font-semibold truncate">{clinicConfig.contact.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl">
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-xs text-blue-200">Contact Phone</p>
                  <p className="font-semibold">{clinicConfig.contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl">
                <span className="text-lg">💵</span>
                <div>
                  <p className="text-xs text-blue-200">Consultation Fee</p>
                  <p className="font-semibold">{clinicConfig.doctor.consultationFee} {clinicConfig.currency}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic ERP Modules Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            ⚡ Smart ERP Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">👥</div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Patient Management</h4>
              <p className="text-xs text-slate-500 mt-1">Register new patients, search medical history, and manage active check-up queues.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all">🔬</div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Lab Module</h4>
              <p className="text-xs text-slate-500 mt-1">Generate lab test reports (CBC, Sugar, etc.), manage templates, and print receipts.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">💳</div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Billing &amp; Invoicing</h4>
              <p className="text-xs text-slate-500 mt-1">Track doctor fees, handle pharmacy sales, and generate complete daily closing summaries.</p>
            </div>
          </div>
        </div>

        {/* 1. Live OPD Counter Section */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            🎫 Live OPD Management
          </h3>
          <PatientForm />
        </div>

        {/* 2. Live Lab Module Section */}
        <div className="pt-4 border-t border-slate-200">
          <LabModule />
        </div>

        {/* 3. 📦 New Live Pharmacy Inventory Section */}
        <div className="pt-4 border-t border-slate-200">
          <PharmacyModule />
        </div>

        {/* 4. Live Billing & Invoice Section */}
        <div className="pt-4 border-t border-slate-200">
          <BillingModule />
        </div>

      </main>
    </div>
  );
}