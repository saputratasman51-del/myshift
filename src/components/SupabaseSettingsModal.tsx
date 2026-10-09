import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';

interface SupabaseSettingsModalProps {
  onClose: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({ onClose }) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = async () => {
    saveSupabaseConfig(url, anonKey);
    alert('Konfigurasi Supabase berhasil disimpan. Memulai pengujian koneksi...');
    await handleTest();
  };

  const handleResetToEnv = () => {
    saveSupabaseConfig('', '');
    const def = getStoredSupabaseConfig();
    setUrl(def.url);
    setAnonKey(def.anonKey);
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Koneksi gagal: ${e.message || String(e)}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sqlSample = `-- Skrip Skema Supabase Instalasi Lab RSUD SMJ I
-- Silakan jalankan di Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS staff (
  staff_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  employee_number TEXT,
  position TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  schedule_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  staff_id TEXT NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  shift_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Skrip lengkap tersedia di file /supabase_schema.sql`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[22px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E7EAE4] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#202B2A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#176B62]/40 text-[#FFFAD3] border border-[#176B62]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFFAD3] bg-white/10 px-2 py-0.5 rounded">
                  Pusat Database Cloud
                </span>
              </div>
              <h2 className="text-lg font-extrabold tracking-tight mt-0.5">
                Konfigurasi Supabase PostgreSQL
              </h2>
              <p className="text-xs text-[#8E9B98]">
                Sinkronisasi data multi-perangkat real-time untuk RSUD Sultan Muhammad Jamaludin I
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8E9B98] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Alert Banner */}
          <div className="p-3.5 bg-[#FFFAD3] rounded-xl border border-[#F5EEB0] text-[#202B2A] flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#176B62] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Penyimpanan Hibrida Pintar:</span>
              <span>
                Aplikasi beroperasi secara instan menggunakan penyimpanan lokal terenkripsi, dan secara otomatis tersinkronisasi dua arah begitu kredensial Supabase dihubungkan.
              </span>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3.5">
            <div>
              <label className="block font-bold text-[#202B2A] mb-1">
                Supabase Project URL (VITE_SUPABASE_URL):
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] font-mono text-xs focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">
                Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY):
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] font-mono text-xs focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetToEnv}
                className="text-[11px] text-[#687572] hover:text-[#202B2A] underline cursor-pointer"
              >
                Muat Ulang dari Nilai .env
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTest}
                  className="px-3.5 py-2 bg-[#F8F9F7] hover:bg-[#E7EAE4] border border-[#E7EAE4] text-[#202B2A] font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#176B62] hover:bg-[#12554E] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-[#EBF7F1] border-[#21865B]/30 text-[#21865B]'
                    : 'bg-[#FDF2F2] border-[#D9534F]/30 text-[#D9534F]'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-bold">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* SQL Schema Preview */}
          <div className="pt-2 border-t border-[#E7EAE4]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 font-bold text-[#202B2A]">
                <Layers className="w-4 h-4 text-[#176B62]" />
                <span>Skema Database SQL Supabase:</span>
              </div>
              <button
                type="button"
                onClick={copySql}
                className="text-[11px] font-bold text-[#176B62] hover:text-[#12554E] flex items-center space-x-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? '✓ Tersalin!' : 'Salin SQL Skema'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#202B2A] text-[#FFFAD3] rounded-xl text-[10px] font-mono overflow-x-auto max-h-36">
              {sqlSample}
            </pre>
            <p className="text-[10px] text-[#8E9B98] mt-1">
              File skema lengkap tersedia di root direktori proyek: <code className="text-[#176B62] font-bold">/supabase_schema.sql</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9F7] border-t border-[#E7EAE4] flex items-center justify-between">
          <span className="text-[11px] text-[#687572]">
            Koneksi aman melalui HTTPS & Supabase JavaScript SDK
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#202B2A] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
