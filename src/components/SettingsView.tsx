import React, { useState } from 'react';
import {
  Settings,
  Clock,
  RotateCcw,
  Save,
  CheckCircle,
  Database,
  Building,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import { ShiftConfig, UserAccount } from '../types';
import { labStore } from '../services/store';
import { LOGO_KAYONG_UTARA } from '../assets/images';

interface SettingsViewProps {
  currentUser: UserAccount;
  onOpenSupabaseModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onOpenSupabaseModal,
}) => {
  const shifts = labStore.getShifts();
  const [shiftList, setShiftList] = useState<ShiftConfig[]>(shifts);

  const handleShiftChange = (index: number, field: keyof ShiftConfig, value: any) => {
    const updated = [...shiftList];
    updated[index] = { ...updated[index], [field]: value };
    setShiftList(updated);
  };

  const handleSaveShift = (shift: ShiftConfig) => {
    labStore.updateShiftConfig(shift.shiftId, shift);
    alert(`Konfigurasi shift ${shift.name} berhasil diperbarui.`);
  };

  const handleResetData = () => {
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin mengatur ulang data aplikasi kembali ke data awal bawaan instalasi laboratorium?'
      )
    ) {
      labStore.resetToDefaults();
      alert('Data sistem telah direset ke data default RSUD Sultan Muhammad Jamaludin I.');
      setShiftList(labStore.getShifts());
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Tata Kelola Operasional
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2 py-0.5 rounded-md border border-[#F5EEB0]">
              Konfigurasi Master
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#202B2A] tracking-tight flex items-center space-x-2 mt-1">
            <Settings className="w-5 h-5 text-[#176B62]" />
            <span>Konfigurasi Shift Jaga & Parameter Laboratorium</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Pengaturan rotasi jam jaga, kuota petugas minimum, dan integrasi pangkalan data Supabase
          </p>
        </div>

        <button
          onClick={onOpenSupabaseModal}
          className="px-4 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
        >
          <Database className="w-4 h-4 text-[#FFFAD3]" />
          <span>Pengaturan Supabase Cloud</span>
        </button>
      </div>

      {/* 2. Hospital Identity Info Card */}
      <div className="clinical-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E7EAE4]">
          <div>
            <h3 className="font-extrabold text-[#202B2A] text-sm flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#176B62]" />
              <span>Identitas Resmi Rumah Sakit & Satuan Kerja</span>
            </h3>
            <p className="text-xs text-[#687572] mt-0.5">
              Unit Pelaksana Teknis Daerah Rumah Sakit Umum Daerah Kelas C Kayong Utara
            </p>
          </div>
          <div className="flex items-center space-x-3 p-2 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
            <div className="w-12 h-12 p-1 rounded-xl bg-white border border-[#E7EAE4] shadow-xs flex items-center justify-center shrink-0 ring-1 ring-[#FFFAD3]">
              <img
                src={LOGO_KAYONG_UTARA}
                alt="Logo Resmi Kabupaten Kayong Utara"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#176B62] uppercase block">Lambang Resmi</span>
              <span className="text-xs font-extrabold text-[#202B2A] block">Kabupaten Kayong Utara</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
            <span className="text-[#687572] block text-[10px] font-bold uppercase">Nama Rumah Sakit:</span>
            <strong className="text-[#202B2A] text-xs mt-0.5 block">RSUD SULTAN MUHAMMAD JAMALUDIN I</strong>
          </div>
          <div className="p-3.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
            <span className="text-[#687572] block text-[10px] font-bold uppercase">Instalasi:</span>
            <strong className="text-[#176B62] text-xs mt-0.5 block">INSTALASI LABORATORIUM PATOLOGI KLINIK</strong>
          </div>
          <div className="p-3.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
            <span className="text-[#687572] block text-[10px] font-bold uppercase">Wilayah Waktu Operasional:</span>
            <strong className="text-[#202B2A] text-xs mt-0.5 block font-mono">Asia/Pontianak (WIB UTC+7)</strong>
          </div>
          <div className="p-3.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
            <span className="text-[#687572] block text-[10px] font-bold uppercase">Layanan Laboratorium:</span>
            <strong className="text-[#21865B] text-xs mt-0.5 block">24 JAM / 7 HARI TERUS MENERUS</strong>
          </div>
        </div>
      </div>

      {/* 3. Shift Configuration Cards */}
      <div className="clinical-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-[#202B2A] text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#176B62]" />
              <span>Parameter Shift Jaga (Pagi, Sore, Malam, Libur)</span>
            </h3>
            <p className="text-xs text-[#687572] mt-0.5">
              Jam kerja dan kuota personil minimum untuk deteksi bentrok otomatis
            </p>
          </div>
          <span className="text-[10px] bg-[#FFFAD3] text-[#202B2A] px-2 py-0.5 rounded font-bold border border-[#F5EEB0]">
            Aturan Standar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shiftList.map((shift, idx) => (
            <div
              key={shift.shiftId}
              className="p-5 rounded-2xl border border-[#E7EAE4] bg-[#F8F9F7]/60 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E7EAE4]">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#176B62]" />
                  <span className="font-extrabold text-[#202B2A] text-sm">{shift.name}</span>
                </div>
                <button
                  onClick={() => handleSaveShift(shift)}
                  className="px-2.5 py-1 bg-[#176B62] hover:bg-[#12554E] text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>Simpan</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#687572] block font-bold text-[10px]">Waktu Mulai:</label>
                  <input
                    type="time"
                    value={shift.startTime}
                    onChange={e => handleShiftChange(idx, 'startTime', e.target.value)}
                    className="w-full p-2 bg-white border border-[#E7EAE4] rounded-lg font-mono font-bold text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>
                <div>
                  <label className="text-[#687572] block font-bold text-[10px]">Waktu Selesai:</label>
                  <input
                    type="time"
                    value={shift.endTime}
                    onChange={e => handleShiftChange(idx, 'endTime', e.target.value)}
                    className="w-full p-2 bg-white border border-[#E7EAE4] rounded-lg font-mono font-bold text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[#687572] block font-bold text-[10px]">Kuota Minimum ATLM:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={shift.minimumStaff}
                    onChange={e => handleShiftChange(idx, 'minimumStaff', parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-[#E7EAE4] rounded-lg font-mono font-bold text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center space-x-2 text-[#202B2A] font-bold text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shift.isOvernight}
                      onChange={e => handleShiftChange(idx, 'isOvernight', e.target.checked)}
                      className="w-4 h-4 text-[#176B62] rounded border-[#E7EAE4]"
                    />
                    <span>Lintas Hari (Malam)</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Maintenance / Reset Zone */}
      <div className="clinical-card p-6 border-l-4 border-l-[#D9534F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#D9534F] font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Zona Pengaturan Ulang Sistem</span>
          </div>
          <p className="text-xs text-[#687572] mt-1 max-w-xl">
            Kembalikan konfigurasi rotasi shift, jadwal kerja standar, dan daftar petugas ke status awal RSUD Sultan Muhammad Jamaludin I.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-4 py-2.5 bg-[#FDF2F2] hover:bg-rose-100 text-[#D9534F] border border-[#D9534F]/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset ke Data Awal</span>
        </button>
      </div>
    </div>
  );
};
