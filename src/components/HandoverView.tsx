import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Calendar,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Check,
  FileCheck2,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Cpu,
  Droplet,
  Filter,
  RotateCcw,
  Download,
  CalendarRange,
  Layers,
  FileSpreadsheet,
  Package,
  Info,
} from 'lucide-react';
import { UserAccount, HandoverRecord } from '../types';
import { labStore } from '../services/store';
import { exportHandoverPdf, exportHandoverRecapToExcel } from '../services/exportService';
import {
  HandoverForm,
  PATIENT_CATEGORIES_CONFIG,
  INITIAL_CATEGORIES,
  getOngoingShiftInfo,
  getLocalDateStr,
} from './HandoverForm';
import { HandoverHistoryView } from './HandoverHistoryView';

interface HandoverViewProps {
  currentUser: UserAccount;
}

export const HandoverView: React.FC<HandoverViewProps> = ({ currentUser }) => {
  const [activeTabMode, setActiveTabMode] = useState<'cards' | 'table'>('cards');
  const [showForm, setShowForm] = useState(false);
  const [editingHandover, setEditingHandover] = useState<HandoverRecord | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Penelusuran Histori Tanggal & Shift
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickDatePreset, setQuickDatePreset] = useState<string>('all');

  const handovers = labStore.getHandovers();
  const staffList = labStore.getStaff();
  const schedules = labStore.getSchedules();

  const todayStr = useMemo(() => getLocalDateStr(), []);
  const ongoingShift = useMemo(() => getOngoingShiftInfo(), []);
  const staffMap = useMemo(() => new Map(staffList.map(s => [s.staffId, s])), [staffList]);

  // Petugas yang sedang bertugas hari ini pada shift yang sedang berlangsung
  const activeDutyInfo = useMemo(() => {
    const activeSchedules = schedules.filter(
      s => s.date === todayStr && (s.shiftId === ongoingShift.currentShiftId || (ongoingShift.currentShiftId === 'pagi' && s.shiftId === 'morning'))
    );
    const nextSchedules = schedules.filter(
      s => s.date === todayStr && (s.shiftId === ongoingShift.nextShiftId || (ongoingShift.nextShiftId === 'siang' && s.shiftId === 'sore'))
    );

    const activeStaffNames = activeSchedules
      .map(s => staffMap.get(s.staffId)?.fullName)
      .filter(Boolean) as string[];

    const nextStaffNames = nextSchedules
      .map(s => staffMap.get(s.staffId)?.fullName)
      .filter(Boolean) as string[];

    return {
      activeStaffString: activeStaffNames.length > 0 ? activeStaffNames.join(' & ') : 'Belum terdaftar',
      nextStaffString: nextStaffNames.length > 0 ? nextStaffNames.join(' & ') : 'Belum terdaftar',
      hasActiveStaff: activeStaffNames.length > 0,
      activeStaffCount: activeStaffNames.length,
    };
  }, [schedules, todayStr, ongoingShift, staffMap]);

  // Handle Preset Cepat Tanggal
  const handleApplyPreset = (preset: string) => {
    setQuickDatePreset(preset);
    const now = new Date();

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const today = formatDate(now);
      setStartDateFilter(today);
      setEndDateFilter(today);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = formatDate(yesterday);
      setStartDateFilter(yStr);
      setEndDateFilter(yStr);
    } else if (preset === 'last7') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setStartDateFilter(formatDate(start));
      setEndDateFilter(formatDate(now));
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDateFilter(formatDate(start));
      setEndDateFilter(formatDate(now));
    } else {
      // all
      setStartDateFilter('');
      setEndDateFilter('');
    }
  };

  const handleResetFilters = () => {
    setSelectedShiftFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setStatusFilter('all');
    setQuickDatePreset('all');
    setSearchQuery('');
  };

  const handleConfirm = (handoverId: string) => {
    labStore.confirmHandover(handoverId);
    alert('Serah terima jaga telah berhasil dikonfirmasi dan ditandatangani oleh Petugas Penerima.');
  };

  const handleDeleteHandover = (handoverId: string) => {
    if (window.confirm(`Hapus arsip serah terima jaga ${handoverId}? Data tidak dapat dikembalikan.`)) {
      labStore.deleteHandover(handoverId);
    }
  };

  // Helper normalisasi nama/id shift
  const matchShift = (handover: HandoverRecord, filterVal: string) => {
    if (filterVal === 'all') return true;
    const sId = (handover.shiftId || '').toLowerCase();
    const tId = (handover.targetShiftId || '').toLowerCase();

    if (filterVal === 'pagi') {
      return sId === 'pagi' || sId === 'morning' || tId === 'pagi';
    }
    if (filterVal === 'siang') {
      return sId === 'siang' || sId === 'sore' || sId === 'afternoon' || tId === 'siang' || tId === 'sore';
    }
    if (filterVal === 'malam') {
      return sId === 'malam' || sId === 'night' || tId === 'malam';
    }
    return true;
  };

  // Filter Penelusuran Histori Tanggal, Shift, Status, dan Pencarian Teks
  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      // 1. Filter Shift
      if (!matchShift(h, selectedShiftFilter)) {
        return false;
      }

      // 2. Filter Rentang Tanggal
      if (startDateFilter && h.handoverDate < startDateFilter) {
        return false;
      }
      if (endDateFilter && h.handoverDate > endDateFilter) {
        return false;
      }

      // 3. Filter Status Verifikasi
      if (statusFilter !== 'all' && h.status !== statusFilter) {
        return false;
      }

      // 4. Pencarian Teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          h.handoverDate.includes(q) ||
          h.outgoingStaffName?.toLowerCase().includes(q) ||
          h.incomingStaffName?.toLowerCase().includes(q) ||
          h.handoverId.toLowerCase().includes(q) ||
          h.qcInstrumentsReport?.toLowerCase().includes(q) ||
          h.depositNotes?.toLowerCase().includes(q) ||
          h.bloodStockNotes?.toLowerCase().includes(q) ||
          h.infoNotes?.toLowerCase().includes(q);
        if (!matchText) return false;
      }

      return true;
    });
  }, [handovers, selectedShiftFilter, startDateFilter, endDateFilter, statusFilter, searchQuery]);

  // Statistik Ringkasan Hasil Penelusuran Rekap
  const summaryStats = useMemo(() => {
    let totalPatientsAcc = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let totalQcItems = 0;
    const dateSet = new Set<string>();

    filteredHandovers.forEach(h => {
      totalPatientsAcc += h.totalPatients || 0;
      if (h.status === 'confirmed') confirmedCount++;
      else pendingCount++;
      totalQcItems += h.qcItems?.length || 0;
      if (h.handoverDate) dateSet.add(h.handoverDate);
    });

    return {
      totalRecords: filteredHandovers.length,
      totalPatients: totalPatientsAcc,
      confirmedCount,
      pendingCount,
      totalQcItems,
      uniqueDays: dateSet.size,
    };
  }, [filteredHandovers]);

  const isFilterActive =
    selectedShiftFilter !== 'all' ||
    startDateFilter !== '' ||
    endDateFilter !== '' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E7EAE4]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Instalasi Laboratorium Patologi Klinik
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2.5 py-0.5 rounded-md border border-[#F5EEB0]">
              Format Baku Timbang Terima
            </span>
            <span className="text-[10px] font-bold text-[#21865B] bg-[#EBF7F1] px-2.5 py-0.5 rounded-md border border-[#21865B]/30 flex items-center space-x-1">
              <CalendarRange className="w-3 h-3" />
              <span>Penelusuran Histori Tanggal & Shift</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-[#202B2A] mt-1.5">
            Rekap & Berita Acara Serah Terima Jaga (Shift Handover)
          </h2>
          <p className="text-xs text-[#687572] mt-0.5 max-w-2xl">
            Timbang terima dinas antar shift ATLM mencakup 17 Kategori Pasien (hitung otomatis), Instrumen QC Alat & Reagen, Titipan, Stok Darah BDRS, dan Informasi operasional. Dilengkapi fitur penelusuran histori tanggal dan shift.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Switch Tab Mode: Kartu Berita Acara vs Tabel Histori */}
          <div className="flex bg-[#F8F9F7] p-1 rounded-xl border border-[#E7EAE4]">
            <button
              onClick={() => setActiveTabMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabMode === 'cards'
                  ? 'bg-white text-[#176B62] shadow-2xs'
                  : 'text-[#687572] hover:text-[#202B2A]'
              }`}
            >
              Kartu Berita Acara
            </button>
            <button
              onClick={() => setActiveTabMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTabMode === 'table'
                  ? 'bg-[#176B62] text-white shadow-2xs'
                  : 'text-[#687572] hover:text-[#202B2A]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabel Histori</span>
            </button>
          </div>

          <button
            onClick={() => exportHandoverRecapToExcel(filteredHandovers, selectedShiftFilter !== 'all' ? selectedShiftFilter : 'Rekap')}
            className="px-3 py-2 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#176B62] border border-[#E7EAE4] rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-2xs"
            title="Unduh data hasil penelusuran ke Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#176B62]" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingHandover(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Tutup Formulir' : 'Buat Serah Terima Baru'}</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Jadwal Berlangsung Real-Time */}
      {!showForm && !editingHandover && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFAD3]/80 border-2 border-[#F5EEB0] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B62] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 text-[#FFFAD3]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-[#176B62] uppercase tracking-wide">
                  Shift Dinas Berlangsung Saat Ini:
                </span>
                <span className="text-[10px] bg-[#21865B] text-white px-2 py-0.5 rounded-full font-bold">
                  Aktif (Zona WIB)
                </span>
              </div>

              <div className="text-sm font-black text-[#202B2A] mt-0.5 flex items-center space-x-2">
                <span>{ongoingShift.currentShiftName} ({ongoingShift.currentHours})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E9B98]" />
                <span className="text-[#687572] font-semibold">{ongoingShift.nextShiftName} ({ongoingShift.nextHours})</span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#687572] font-medium">Petugas Shift Sekarang ({ongoingShift.currentShiftName}):</span>
                  <span className="font-extrabold text-[#202B2A] bg-white/70 px-2 py-0.5 rounded border border-[#E7EAE4]">
                    {activeDutyInfo.activeStaffString}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[#687572] font-medium">Petugas Shift Penerima ({ongoingShift.nextShiftName}):</span>
                  <span className="font-extrabold text-[#176B62] bg-[#E8F4F2] px-2 py-0.5 rounded border border-[#E7EAE4]">
                    {activeDutyInfo.nextStaffString}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
            <button
              onClick={() => {
                setEditingHandover(null);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-2 bg-white hover:bg-[#176B62] hover:text-white text-[#176B62] border border-[#176B62]/40 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Isi Formulir Serah Terima Shift Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Formulir Pengisian / Pengubahan Berita Acara */}
      {(showForm || editingHandover) && (
        <div className="space-y-2">
          {editingHandover && (
            <div className="p-3 bg-[#E8F4F2] border border-[#176B62]/30 rounded-xl flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#176B62] flex items-center space-x-2">
                <Edit3 className="w-4 h-4" />
                <span>Mode Edit Berita Acara & QC Alat ID: {editingHandover.handoverId} ({editingHandover.handoverDate})</span>
              </span>
              <button
                onClick={() => setEditingHandover(null)}
                className="px-2.5 py-1 bg-white hover:bg-[#F8F9F7] text-[#687572] font-bold rounded-lg border border-[#E7EAE4] cursor-pointer"
              >
                Batal Edit
              </button>
            </div>
          )}
          <HandoverForm
            currentUser={currentUser}
            initialData={editingHandover || undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingHandover(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingHandover(null);
            }}
          />
        </div>
      )}

      {/* 4. MODE TAMPILAN: TABEL HISTORI vs KARTU BERITA ACARA */}
      {!showForm && !editingHandover && activeTabMode === 'table' ? (
        <HandoverHistoryView
          currentUser={currentUser}
          onEditHandover={handover => {
            setEditingHandover(handover);
            setShowForm(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCreateNew={() => {
            setEditingHandover(null);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : !showForm && !editingHandover ? (
        <>
          {/* 4. PANEL PENELUSURAN HISTORI TANGGAL & SHIFT */}
          <div className="clinical-card p-5 border border-[#E7EAE4] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E7EAE4]">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#E8F4F2] rounded-lg text-[#176B62]">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#202B2A]">
                  Penelusuran Histori Rekap Serah Terima
                </h3>
                <p className="text-[11px] text-[#687572]">
                  Telusuri arsip serah terima berdasarkan filter shift dinas, tanggal mulai & selesai, status, serta kata kunci.
                </p>
              </div>
            </div>

            {/* Tombol Preset Cepat */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-[#8E9B98] mr-1">Preset:</span>
              {[
                { id: 'all', label: 'Semua Waktu' },
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'last7', label: '7 Hari Terakhir' },
                { id: 'thisMonth', label: 'Bulan Ini' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    quickDatePreset === p.id
                      ? 'bg-[#176B62] text-white border-[#176B62]'
                      : 'bg-[#F8F9F7] text-[#687572] border-[#E7EAE4] hover:bg-[#E8F4F2]'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors ml-1"
                  title="Reset seluruh filter pencarian"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Baris Kontrol Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Shift */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
                <Layers className="w-3 h-3 text-[#176B62]" />
                <span>Pilih Shift Dinas:</span>
              </label>
              <select
                value={selectedShiftFilter}
                onChange={e => {
                  setSelectedShiftFilter(e.target.value);
                  setQuickDatePreset('custom');
                }}
                className="w-full px-3 py-2 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-bold text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
              >
                <option value="all">Semua Shift (Pagi, Siang, Malam)</option>
                <option value="pagi">Shift Pagi (07.00 - 14.00 WIB)</option>
                <option value="siang">Shift Siang / Sore (14.00 - 21.00 WIB)</option>
                <option value="malam">Shift Malam (21.00 - 07.00 WIB)</option>
              </select>
            </div>

            {/* Filter 2: Dari Tanggal */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#176B62]" />
                <span>Dari Tanggal:</span>
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={e => {
                  setStartDateFilter(e.target.value);
                  setQuickDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-medium text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            {/* Filter 3: Sampai Tanggal */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-[#176B62]" />
                <span>Sampai Tanggal:</span>
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={e => {
                  setEndDateFilter(e.target.value);
                  setQuickDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-medium text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            {/* Filter 4: Cari Kata Kunci */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
                <Search className="w-3 h-3 text-[#176B62]" />
                <span>Cari Petugas / ID / Catatan:</span>
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B98]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama petugas, ID, dsb..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
                />
              </div>
            </div>
          </div>

          {/* Filter Status Tambahan & Ringkasan Pencarian */}
          <div className="pt-3 border-t border-[#E7EAE4] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-[#687572]">Status Verifikasi:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'confirmed', label: 'Telah Dikonfirmasi' },
                { id: 'submitted', label: 'Menunggu Konfirmasi' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
                    statusFilter === st.id
                      ? 'bg-[#176B62] text-white border-[#176B62]'
                      : 'bg-[#F8F9F7] text-[#687572] border-[#E7EAE4] hover:bg-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#687572]">
              <span>Ditemukan: <strong className="text-[#176B62]">{summaryStats.totalRecords} Berita Acara</strong></span>
              <span>•</span>
              <span>Total Pasien: <strong className="text-[#202B2A]">{summaryStats.totalPatients}</strong></span>
              <span>•</span>
              <span>Instrumen QC: <strong className="text-[#202B2A]">{summaryStats.totalQcItems}</strong></span>
            </div>
          </div>
        </div>

      {/* 5. DAFTAR RIWAYAT BERITA ACARA SERAH TERIMA JAGA */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-sm text-[#202B2A]">
              Histori Berita Acara Serah Terima Jaga
            </h3>
            <span className="text-xs font-bold text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              {filteredHandovers.length} Arsip Ditemukan
            </span>
            {isFilterActive && (
              <span className="text-[10px] font-bold text-[#D99A22] bg-[#FFFAD3] px-2 py-0.5 rounded border border-[#F5EEB0]">
                Filter Aktif
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportHandoverRecapToExcel(filteredHandovers, 'Filtered_Handovers')}
              className="px-3 py-1.5 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#176B62] rounded-xl text-xs font-bold border border-[#E7EAE4] flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#176B62]" />
              <span>Unduh Rekap ({filteredHandovers.length})</span>
            </button>
          </div>
        </div>

        {filteredHandovers.length === 0 ? (
          <div className="clinical-card p-12 text-center text-xs text-[#8E9B98]">
            <ClipboardList className="w-12 h-12 text-[#E7EAE4] mx-auto mb-3" />
            <p className="font-bold text-[#687572]">Tidak ada berita acara yang sesuai kriteria penelusuran.</p>
            <p className="text-[11px] mt-1">
              Coba sesuaikan tanggal penelusuran, pilihan shift dinas, atau kata kunci pencarian di atas.
            </p>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 bg-[#176B62] text-white font-bold rounded-lg text-xs cursor-pointer inline-flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>
        ) : (
          filteredHandovers.map(handover => {
            const isExpanded = expandedCardId === handover.handoverId;
            const canConfirm =
              handover.status === 'submitted' &&
              (currentUser.staffId === handover.incomingStaffId ||
                currentUser.role === 'coordinator' ||
                currentUser.role === 'admin');

            const canManage =
              currentUser.role === 'coordinator' ||
              currentUser.role === 'admin' ||
              currentUser.staffId === handover.outgoingStaffId ||
              currentUser.staffId === handover.incomingStaffId;

            const cats = handover.patientCategories || INITIAL_CATEGORIES;
            const qcList = handover.qcItems || [];

            // Label shift dinas
            const shiftBadgeText =
              handover.shiftId === 'malam'
                ? 'Shift Malam ➔ Shift Pagi'
                : handover.shiftId === 'siang' || handover.shiftId === 'sore'
                ? 'Shift Siang ➔ Shift Malam'
                : 'Shift Pagi ➔ Shift Siang';

            return (
              <div
                key={handover.handoverId}
                className="clinical-card p-5 sm:p-6 hover:border-[#176B62]/40 transition-all border border-[#E7EAE4]"
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7EAE4]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-[#202B2A] text-sm flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#176B62]" />
                      <span>{handover.handoverDate}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-[#176B62] bg-[#E8F4F2] px-2 py-0.5 rounded-md border border-[#E7EAE4]">
                      {shiftBadgeText}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        handover.status === 'confirmed'
                          ? 'bg-[#EBF7F1] text-[#21865B] border-[#21865B]/30'
                          : 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]'
                      }`}
                    >
                      {handover.status === 'confirmed'
                        ? '✓ Telah Dikonfirmasi'
                        : 'Menunggu Konfirmasi Penerima'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-[#8E9B98] font-mono bg-[#F8F9F7] px-2 py-0.5 rounded border border-[#E7EAE4]">
                      {handover.handoverId}
                    </span>

                    {/* Tombol Ubah / Edit Berita Acara & QC */}
                    {canManage && (
                      <button
                        onClick={() => {
                          setEditingHandover(handover);
                          setShowForm(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#202B2A] rounded-lg text-xs font-bold border border-[#E7EAE4] flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Ubah data formulir atau kelola QC alat"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#176B62]" />
                        <span>Ubah / QC</span>
                      </button>
                    )}

                    <button
                      onClick={() => exportHandoverPdf(handover)}
                      className="px-3 py-1 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#176B62] rounded-lg text-xs font-bold border border-[#E7EAE4] flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Cetak Berita Acara PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak PDF</span>
                    </button>

                    {/* Tombol Hapus Arsip (Admin/Koordinator) */}
                    {(currentUser.role === 'admin' || currentUser.role === 'coordinator') && (
                      <button
                        onClick={() => handleDeleteHandover(handover.handoverId)}
                        className="p-1 text-[#8E9B98] hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                        title="Hapus berita acara ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Petugas Shift */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#E8F4F2]/50 border border-[#176B62]/30 border-l-4 border-l-[#176B62] space-y-1">
                    <span className="text-[10px] font-black text-[#0E5149] uppercase tracking-wide flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#176B62]" />
                      <span>Petugas Menyerahkan ({handover.shiftId === 'malam' ? 'Shift Malam' : handover.shiftId === 'siang' || handover.shiftId === 'sore' ? 'Shift Siang' : 'Shift Pagi'}):</span>
                    </span>
                    <p className="font-extrabold text-[#202B2A] text-xs">
                      {handover.outgoingStaffName || 'Petugas Shift Jaga'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 border-l-4 border-l-[#0284C7] space-y-1">
                    <span className="text-[10px] font-black text-[#0369A1] uppercase tracking-wide flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Petugas Menerima ({handover.targetShiftId === 'malam' ? 'Shift Malam' : handover.targetShiftId === 'pagi' ? 'Shift Pagi' : 'Shift Siang'}):</span>
                    </span>
                    <p className="font-extrabold text-[#202B2A] text-xs">
                      {handover.incomingStaffName || 'Petugas Shift Berikutnya'}
                    </p>
                  </div>
                </div>

                {/* Ringkasan Singkat & Total Pasien */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#FFFAD3]/70 border border-[#F5EEB0]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#875A00] uppercase tracking-wide">
                      Total Pasien / Spesimen Dilayani:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#176B62] text-white font-black text-xs">
                      {handover.totalPatients || 0} Pasien
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {qcList.length > 0 && (
                      <span className="text-[11px] font-bold text-[#0369A1] bg-sky-100/70 px-2 py-0.5 rounded border border-sky-200">
                        {qcList.length} Alat QC Terdata
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : handover.handoverId)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F8F9F7] text-[#176B62] rounded-lg text-xs font-bold border border-[#E7EAE4] flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? 'Tutup Detail Lengkap' : 'Lihat 17 Kategori & QC Lengkap'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Detail Expanded Form: 17 Kategori, QC Alat/Reagen, Titipan, Stok Darah, Info */}
                <div className={`mt-4 space-y-4 pt-3 border-t border-[#E7EAE4] text-xs transition-all ${isExpanded ? 'block' : 'hidden'}`}>
                  {/* A. 17 Kategori Pasien */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#E8F4F2] via-[#E8F4F2]/50 to-white border border-[#176B62]/30 flex items-center justify-between">
                      <strong className="text-xs font-black uppercase tracking-wider text-[#0E5149] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#176B62] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          A
                        </span>
                        <span>A. Kategori Pemeriksaan Pasien (17 Kategori Baku) :</span>
                      </strong>
                      <span className="text-[11px] font-extrabold text-[#176B62] bg-white px-2 py-0.5 rounded border border-[#176B62]/20">
                        Total: {handover.totalPatients || 0} Pasien
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {PATIENT_CATEGORIES_CONFIG.map(cat => {
                        const count = cats[cat.key] || 0;
                        return (
                          <div
                            key={cat.key}
                            className={`p-2 rounded-lg border text-center transition-colors ${
                              count > 0
                                ? 'bg-white border-[#176B62]/40 text-[#202B2A] shadow-2xs'
                                : 'bg-[#F8F9F7]/70 border-[#E7EAE4] text-[#8E9B98]'
                            }`}
                          >
                            <span className="text-[10px] text-[#687572] font-semibold block truncate" title={cat.label}>
                              {cat.number}. {cat.label}
                            </span>
                            <span className={`text-xs font-black block mt-0.5 ${count > 0 ? 'text-[#176B62]' : 'text-[#8E9B98]'}`}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* B. Kategori Instrumen dan Alat (QC Alat & Reagen) */}
                  <div className="pt-2 border-t border-[#E7EAE4] space-y-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/50 to-white border border-sky-200 flex items-center justify-between">
                      <strong className="text-xs font-black uppercase tracking-wider text-[#0369A1] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          B
                        </span>
                        <Wrench className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>B. Kategori Instrumen dan Alat (1. Laporan QC Alat dan Reagen) :</span>
                      </strong>

                      {canManage && (
                        <button
                          onClick={() => {
                            setEditingHandover(handover);
                            setShowForm(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[10px] text-[#0284C7] bg-white hover:bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-extrabold flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Kelola QC Alat</span>
                        </button>
                      )}
                    </div>

                    {/* Kartu Daftar Alat QC */}
                    {qcList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        {qcList.map((item, qIdx) => {
                          let badgeBg = 'bg-[#EBF7F1] text-[#21865B] border-[#21865B]/30';
                          let statusLabel = 'OK';
                          if (item.status === 'Warning') {
                            badgeBg = 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]';
                            statusLabel = 'Warning';
                          } else if (item.status === 'Fail') {
                            badgeBg = 'bg-[#FDF2F2] text-[#D9383A] border-[#D9383A]/30';
                            statusLabel = 'Fail';
                          } else if (item.status === 'Maintenance') {
                            badgeBg = 'bg-[#EBF2F7] text-[#2B6CB0] border-[#BEE3F8]';
                            statusLabel = 'Maintenance';
                          }

                          return (
                            <div
                              key={item.id || qIdx}
                              className="p-2.5 bg-white rounded-lg border border-[#E7EAE4] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-[#202B2A] truncate text-[11px]">
                                  {item.instrumentName}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${badgeBg}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              {item.reagentName && (
                                <div className="text-[10px] text-[#0369A1] truncate flex items-center space-x-1">
                                  <Droplet className="w-2.5 h-2.5 shrink-0" />
                                  <span>{item.reagentName}</span>
                                </div>
                              )}
                              <p className="text-[11px] text-[#687572] leading-tight">
                                {item.notes}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* Catatan teks ringkasan */}
                    {handover.qcInstrumentsReport && (
                      <p className="text-[#202B2A] mt-1 leading-relaxed bg-[#F8F9F7] p-2.5 rounded-lg border border-[#E7EAE4]">
                        {handover.qcInstrumentsReport}
                      </p>
                    )}
                  </div>

                  {/* C. Titipan */}
                  <div className="pt-2 border-t border-[#E7EAE4]">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/40 to-white border border-amber-200 space-y-1">
                      <strong className="text-xs font-black uppercase tracking-wider text-[#B45309] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#D97706] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          C
                        </span>
                        <Package className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>C. Kategori Titipan :</span>
                      </strong>
                      <p className="text-[#202B2A] pl-7 text-xs leading-relaxed">
                        {handover.depositNotes || handover.pendingSamples || 'Tidak ada titipan.'}
                      </p>
                    </div>
                  </div>

                  {/* D. Stok Darah */}
                  <div className="pt-2 border-t border-[#E7EAE4]">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 via-rose-50/40 to-white border border-rose-200 space-y-1">
                      <strong className="text-xs font-black uppercase tracking-wider text-[#BE123C] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#E11D48] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          D
                        </span>
                        <Droplet className="w-3.5 h-3.5 text-[#E11D48]" />
                        <span>D. Kategori Stok Darah (BDRS) :</span>
                      </strong>
                      <p className="text-[#202B2A] pl-7 text-xs leading-relaxed">
                        {handover.bloodStockNotes || 'Stok darah Bank Darah dalam batas aman.'}
                      </p>
                    </div>
                  </div>

                  {/* E. Info/ Keterangan */}
                  <div className="pt-2 border-t border-[#E7EAE4]">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-indigo-50/40 to-white border border-indigo-200 space-y-1">
                      <strong className="text-xs font-black uppercase tracking-wider text-[#4338CA] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          E
                        </span>
                        <Info className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>E. Kategori Info / Keterangan Operasional :</span>
                      </strong>
                      <p className="text-[#202B2A] pl-7 text-xs leading-relaxed">
                        {handover.infoNotes || handover.followUpNotes || 'Operasional lancar.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer & Confirmation Action */}
                {canConfirm && (
                  <div className="mt-4 pt-3 border-t border-[#E7EAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-[#687572]">
                      Anda terdata sebagai Petugas Penerima atau Pengelola Jaga. Silakan verifikasi penerimaan timbang terima.
                    </span>
                    <button
                      onClick={() => handleConfirm(handover.handoverId)}
                      className="px-4 py-2 bg-[#21865B] hover:bg-[#1a6b48] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors self-end sm:self-auto shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi & Tanda Tangani Penerimaan</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      ) : null}
    </div>
  );
};
