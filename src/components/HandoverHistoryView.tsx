import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Search,
  Filter,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Wrench,
  Droplet,
  Package,
  Clock,
  ChevronRight,
  Download,
  Building,
  Info,
  FileText,
  CalendarRange,
} from 'lucide-react';
import { UserAccount, HandoverRecord } from '../types';
import { labStore } from '../services/store';
import { exportHandoverPdf, exportHandoverRecapToExcel } from '../services/exportService';
import { PATIENT_CATEGORIES_CONFIG, INITIAL_CATEGORIES } from './HandoverForm';

interface HandoverHistoryViewProps {
  currentUser: UserAccount;
  onEditHandover?: (handover: HandoverRecord) => void;
  onCreateNew?: () => void;
}

export const HandoverHistoryView: React.FC<HandoverHistoryViewProps> = ({
  currentUser,
  onEditHandover,
  onCreateNew,
}) => {
  // State Filter
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickPreset, setQuickPreset] = useState<string>('all');

  // State Modal Detail Pratinjau
  const [selectedHandover, setSelectedHandover] = useState<HandoverRecord | null>(null);

  const handovers = labStore.getHandovers();

  // Helper Shift Matcher
  const matchShift = (h: HandoverRecord, shift: string) => {
    if (shift === 'all') return true;
    const sId = (h.shiftId || '').toLowerCase();
    const tId = (h.targetShiftId || '').toLowerCase();
    if (shift === 'pagi') {
      return sId === 'pagi' || sId === 'morning' || tId === 'pagi';
    }
    if (shift === 'siang') {
      return (
        sId === 'siang' ||
        sId === 'sore' ||
        sId === 'afternoon' ||
        tId === 'siang' ||
        tId === 'sore'
      );
    }
    if (shift === 'malam') {
      return sId === 'malam' || sId === 'night' || tId === 'malam';
    }
    return true;
  };

  // Preset Tanggal Cepat
  const handleApplyPreset = (preset: string) => {
    setQuickPreset(preset);
    const now = new Date();
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'today') {
      const t = fmt(now);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = fmt(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last7') {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      setStartDate(fmt(s));
      setEndDate(fmt(now));
    } else if (preset === 'thisMonth') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(fmt(s));
      setEndDate(fmt(now));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedShift('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchQuery('');
    setQuickPreset('all');
  };

  // Data Terfilter
  const filteredData = useMemo(() => {
    return handovers.filter(h => {
      if (!matchShift(h, selectedShift)) return false;
      if (startDate && h.handoverDate < startDate) return false;
      if (endDate && h.handoverDate > endDate) return false;
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = [
          h.handoverId,
          h.handoverDate,
          h.outgoingStaffName,
          h.incomingStaffName,
          h.qcInstrumentsReport,
          h.depositNotes,
          h.bloodStockNotes,
          h.infoNotes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [handovers, selectedShift, startDate, endDate, statusFilter, searchQuery]);

  // Statistik Ringkasan Tabel
  const stats = useMemo(() => {
    let totalPatients = 0;
    let confirmed = 0;
    let pending = 0;
    let totalQC = 0;

    filteredData.forEach(h => {
      totalPatients += h.totalPatients || 0;
      if (h.status === 'confirmed') confirmed++;
      else pending++;
      totalQC += h.qcItems?.length || 0;
    });

    return {
      totalRecords: filteredData.length,
      totalPatients,
      confirmed,
      pending,
      totalQC,
    };
  }, [filteredData]);

  const isFilterActive =
    selectedShift !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '';

  const getShiftBadge = (shiftId?: string, targetShiftId?: string) => {
    const s = (shiftId || 'pagi').toLowerCase();
    if (s === 'malam') {
      return {
        label: 'Malam ➔ Pagi',
        cls: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
      };
    }
    if (s === 'siang' || s === 'sore') {
      return {
        label: 'Siang ➔ Malam',
        cls: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
      };
    }
    return {
      label: 'Pagi ➔ Siang',
      cls: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    };
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner Komponen HandoverHistoryView */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E7EAE4]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Tabel Rekap Histori
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2.5 py-0.5 rounded-md border border-[#F5EEB0]">
              Format Baku Serah Terima Jaga
            </span>
          </div>
          <h2 className="text-xl font-black text-[#202B2A] mt-1.5 flex items-center space-x-2">
            <span>Daftar & Histori Serah Terima Jaga (Tabel Baku)</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5 max-w-2xl">
            Tabel komprehensif seluruh arsip serah terima tugas dinas ATLM. Klik baris tabel mana saja untuk memunculkan modal pratinjau rincian 17 Kategori Pasien, QC Alat & Reagen, Titipan, dan Stok Darah.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => exportHandoverRecapToExcel(filteredData, 'Tabel_Histori')}
            className="px-3.5 py-2.5 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#176B62] border border-[#E7EAE4] rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all shadow-2xs"
            title="Unduh seluruh baris yang sedang difilter ke format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#176B62]" />
            <span className="hidden sm:inline">Ekspor Excel ({filteredData.length})</span>
          </button>

          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>+ Buat Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Panel Filter Interaktif: Tanggal, Shift, Status, Pencarian */}
      <div className="clinical-card p-4 sm:p-5 border border-[#E7EAE4] bg-white space-y-4">
        {/* Baris Preset & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7EAE4]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#E8F4F2] text-[#176B62] rounded-lg">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-extrabold text-[#202B2A]">
              Filter Tanggal & Shift Dinas
            </span>
          </div>

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
                  quickPreset === p.id
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
                title="Bersihkan seluruh kriteria filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Form Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Shift */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
              <Layers className="w-3 h-3 text-[#176B62]" />
              <span>Shift Dinas:</span>
            </label>
            <select
              value={selectedShift}
              onChange={e => {
                setSelectedShift(e.target.value);
                setQuickPreset('custom');
              }}
              className="w-full px-3 py-2 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-bold text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
            >
              <option value="all">Semua Shift</option>
              <option value="pagi">Shift Pagi (07.00 - 14.00 WIB)</option>
              <option value="siang">Shift Siang (14.00 - 21.00 WIB)</option>
              <option value="malam">Shift Malam (21.00 - 07.00 WIB)</option>
            </select>
          </div>

          {/* Dari Tanggal */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[#176B62]" />
              <span>Dari Tanggal:</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setQuickPreset('custom');
              }}
              className="w-full px-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-medium text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
            />
          </div>

          {/* Sampai Tanggal */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[#176B62]" />
              <span>Sampai Tanggal:</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setQuickPreset('custom');
              }}
              className="w-full px-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs font-medium text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
            />
          </div>

          {/* Cari Bebas */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-[#202B2A] flex items-center space-x-1">
              <Search className="w-3 h-3 text-[#176B62]" />
              <span>Cari Nama / ID / Catatan:</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B98]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ketik kata kunci..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
              />
            </div>
          </div>
        </div>

        {/* Ringkasan Jumlah Baris */}
        <div className="pt-2 border-t border-[#E7EAE4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#687572]">
          <div className="flex items-center space-x-2">
            <span>Filter Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'confirmed', label: 'Telah Dikonfirmasi' },
              { id: 'submitted', label: 'Menunggu' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#176B62] text-white border-[#176B62]'
                    : 'bg-[#F8F9F7] text-[#687572] border-[#E7EAE4]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 font-medium">
            <span>Total: <strong className="text-[#176B62]">{stats.totalRecords} Baris</strong></span>
            <span>•</span>
            <span>Akumulasi Pasien: <strong className="text-[#202B2A]">{stats.totalPatients}</strong></span>
            <span>•</span>
            <span>Alat QC: <strong className="text-[#202B2A]">{stats.totalQC}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. TABEL UTAMA SERAH TERIMA JAGA */}
      <div className="clinical-card overflow-hidden border border-[#E7EAE4] bg-white shadow-2xs">
        <div className="p-3.5 bg-[#F8F9F7] border-b border-[#E7EAE4] flex items-center justify-between text-xs font-bold text-[#687572]">
          <div className="flex items-center space-x-2">
            <span className="text-[#202B2A]">Tabel Berita Acara Serah Terima</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F4F2] text-[#176B62] font-extrabold text-[10px]">
              {filteredData.length} Data
            </span>
          </div>
          <span className="text-[11px] text-[#8E9B98] italic">
            * Klik pada baris tabel untuk memunculkan modal pratinjau detail serah terima
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F4F2]/60 text-[#176B62] border-b border-[#E7EAE4] text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Shift Dinas</th>
                <th className="py-3 px-3.5">Petugas Menyerahkan</th>
                <th className="py-3 px-3.5">Petugas Menerima</th>
                <th className="py-3 px-3.5 text-center">Total Pasien</th>
                <th className="py-3 px-3.5 text-center">Alat QC</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE4]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[#8E9B98]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CalendarRange className="w-8 h-8 text-[#E7EAE4]" />
                      <p className="font-bold text-[#687572]">Tidak ada data serah terima yang sesuai filter.</p>
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1 bg-[#176B62] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((handover, idx) => {
                  const shiftBadge = getShiftBadge(handover.shiftId, handover.targetShiftId);
                  const isConfirmed = handover.status === 'confirmed';

                  return (
                    <tr
                      key={handover.handoverId}
                      onClick={() => setSelectedHandover(handover)}
                      className="hover:bg-[#FFFAD3]/40 cursor-pointer transition-colors group"
                      title="Klik untuk membuka pratinjau detail lengkap"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center text-[#8E9B98] font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#202B2A] flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#176B62] shrink-0" />
                          <span>{handover.handoverDate}</span>
                        </div>
                        <span className="text-[10px] text-[#8E9B98] font-mono block pl-5">
                          {handover.handoverId}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${shiftBadge.cls}`}
                        >
                          {shiftBadge.label}
                        </span>
                      </td>

                      {/* Petugas Menyerahkan */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <p className="font-semibold text-[#202B2A] truncate">
                          {handover.outgoingStaffName || 'Petugas Jaga'}
                        </p>
                      </td>

                      {/* Petugas Menerima */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <p className="font-semibold text-[#202B2A] truncate">
                          {handover.incomingStaffName || 'Petugas Pengganti'}
                        </p>
                      </td>

                      {/* Total Pasien */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#FFFAD3] text-[#202B2A] font-black text-[11px] border border-[#F5EEB0]">
                          {handover.totalPatients || 0}
                        </span>
                      </td>

                      {/* QC Alat */}
                      <td className="py-3 px-3.5 text-center">
                        {handover.qcItems && handover.qcItems.length > 0 ? (
                          <span className="text-[10px] font-extrabold text-[#176B62] bg-[#E8F4F2] px-2 py-0.5 rounded border border-[#E7EAE4]">
                            {handover.qcItems.length} Alat
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8E9B98]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isConfirmed
                              ? 'bg-[#EBF7F1] text-[#21865B] border-[#21865B]/30'
                              : 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]'
                          }`}
                        >
                          {isConfirmed ? '✓ Dikonfirmasi' : 'Menunggu'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedHandover(handover)}
                            className="p-1.5 text-[#176B62] hover:bg-[#E8F4F2] rounded-lg transition-colors cursor-pointer"
                            title="Buka Pratinjau Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportHandoverPdf(handover)}
                            className="p-1.5 text-[#687572] hover:bg-[#FFFAD3] hover:text-[#202B2A] rounded-lg transition-colors cursor-pointer"
                            title="Cetak Berita Acara PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL PRATINJAU DETAIL SERAH TERIMA JAGA */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#202B2A]/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E7EAE4] overflow-hidden my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header Kop Surat Lab */}
            <div className="p-4 sm:p-5 bg-[#176B62] text-white flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                    Format Baku RSUD SMJ I
                  </span>
                  <span className="text-[10px] font-mono text-[#FFFAD3]">
                    {selectedHandover.handoverId}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-1">
                  Pratinjau Berita Acara Serah Terima Jaga
                </h3>
                <p className="text-xs text-white/80">
                  Instalasi Laboratorium Patologi Klinik — Tanggal Dinas: {selectedHandover.handoverDate}
                </p>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => exportHandoverPdf(selectedHandover)}
                  className="px-2.5 py-1.5 bg-white/20 hover:bg-white text-white hover:text-[#176B62] rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Cetak Berita Acara PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak PDF</span>
                </button>
                <button
                  onClick={() => setSelectedHandover(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#202B2A]">
              {/* Petugas Shift Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#E8F4F2]/50 border border-[#176B62]/30 border-l-4 border-l-[#176B62]">
                  <span className="text-[10px] font-black text-[#0E5149] uppercase tracking-wider block">
                    Petugas Shift Menyerahkan ({selectedHandover.shiftId === 'malam' ? 'Shift Malam' : selectedHandover.shiftId === 'siang' || selectedHandover.shiftId === 'sore' ? 'Shift Siang' : 'Shift Pagi'}):
                  </span>
                  <p className="font-black text-sm text-[#202B2A] mt-0.5">
                    {selectedHandover.outgoingStaffName || 'Petugas Jaga'}
                  </p>
                  <span className="text-[10px] text-[#21865B] font-semibold flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-[#21865B]" />
                    <span>Diverifikasi jadwal dinas</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 border-l-4 border-l-[#0284C7]">
                  <span className="text-[10px] font-black text-[#0369A1] uppercase tracking-wider block">
                    Petugas Shift Menerima ({selectedHandover.targetShiftId === 'malam' ? 'Shift Malam' : selectedHandover.targetShiftId === 'pagi' ? 'Shift Pagi' : 'Shift Siang'}):
                  </span>
                  <p className="font-black text-sm text-[#0369A1] mt-0.5">
                    {selectedHandover.incomingStaffName || 'Petugas Pengganti'}
                  </p>
                  <span className="text-[10px] font-bold text-[#8E9B98] block mt-0.5">
                    Status: {selectedHandover.status === 'confirmed' ? '✓ Telah Dikonfirmasi Penerima' : 'Menunggu Konfirmasi'}
                  </span>
                </div>
              </div>

              {/* A. 17 Kategori Pasien */}
              <div>
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#E8F4F2] via-[#E8F4F2]/50 to-white border border-[#176B62]/30 flex items-center justify-between mb-2.5">
                  <h4 className="font-black text-xs uppercase tracking-wide text-[#0E5149] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-[#176B62] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      A
                    </span>
                    <span>A. Kategori Pemeriksaan Pasien (17 Kategori Baku) :</span>
                  </h4>
                  <span className="text-xs font-black text-[#176B62] bg-white px-2.5 py-0.5 rounded-md border border-[#176B62]/20">
                    Total: {selectedHandover.totalPatients || 0} Pasien / Spesimen
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {PATIENT_CATEGORIES_CONFIG.map(c => {
                    const count = (selectedHandover.patientCategories as any)?.[c.key] || 0;
                    return (
                      <div
                        key={c.key}
                        className={`p-2 rounded-lg border text-center ${
                          count > 0
                            ? 'bg-white border-[#176B62]/40 shadow-2xs'
                            : 'bg-[#F8F9F7]/60 border-[#E7EAE4] text-[#8E9B98]'
                        }`}
                      >
                        <span className="text-[10px] text-[#687572] font-semibold block truncate">
                          {c.number}. {c.label}
                        </span>
                        <span className={`text-sm font-black block mt-0.5 ${count > 0 ? 'text-[#176B62]' : 'text-[#8E9B98]'}`}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B. Instrumen dan Alat (QC Alat & Reagen) */}
              <div>
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/50 to-white border border-sky-200 flex items-center justify-between mb-2.5">
                  <h4 className="font-black text-xs uppercase tracking-wide text-[#0369A1] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      B
                    </span>
                    <Wrench className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>B. Kategori Instrumen dan Alat (1. Laporan QC Alat dan Reagen) :</span>
                  </h4>
                  <span className="text-[10px] font-extrabold text-[#0369A1] bg-white px-2 py-0.5 rounded border border-sky-200">
                    {selectedHandover.qcItems?.length || 0} Instrumen
                  </span>
                </div>

                {selectedHandover.qcItems && selectedHandover.qcItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {selectedHandover.qcItems.map((q, qIdx) => {
                      let badge = 'bg-[#EBF7F1] text-[#21865B] border-[#21865B]/30';
                      if (q.status === 'Warning') badge = 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]';
                      if (q.status === 'Fail') badge = 'bg-[#FDF2F2] text-[#D9383A] border-[#D9383A]/30';
                      if (q.status === 'Maintenance') badge = 'bg-[#EBF2F7] text-[#2B6CB0] border-[#BEE3F8]';

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-3 bg-white rounded-xl border border-[#E7EAE4] space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-[#202B2A] text-xs truncate">
                              {q.instrumentName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border shrink-0 ${badge}`}>
                              {q.status}
                            </span>
                          </div>
                          {q.reagentName && (
                            <div className="text-[10px] text-[#0369A1] flex items-center space-x-1">
                              <Droplet className="w-3 h-3 shrink-0" />
                              <span>{q.reagentName}</span>
                            </div>
                          )}
                          <p className="text-[11px] text-[#687572] leading-tight">
                            {q.notes}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {selectedHandover.qcInstrumentsReport && (
                  <div className="p-3 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4] text-xs leading-relaxed">
                    <span className="text-[10px] font-black text-[#0369A1] uppercase block mb-0.5">
                      Ringkasan Laporan QC:
                    </span>
                    <p className="text-[#202B2A]">{selectedHandover.qcInstrumentsReport}</p>
                  </div>
                )}
              </div>

              {/* C. Titipan */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/40 to-white border border-amber-200 space-y-1">
                <h4 className="font-black text-xs uppercase tracking-wide text-[#B45309] flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-[#D97706] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    C
                  </span>
                  <Package className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>C. Kategori Titipan :</span>
                </h4>
                <p className="text-xs text-[#202B2A] pl-7 leading-relaxed">
                  {selectedHandover.depositNotes || selectedHandover.pendingSamples || 'Tidak ada spesimen atau berkas titipan.'}
                </p>
              </div>

              {/* D. Stok Darah */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-rose-50/40 to-white border border-rose-200 space-y-1">
                <h4 className="font-black text-xs uppercase tracking-wide text-[#BE123C] flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-[#E11D48] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    D
                  </span>
                  <Droplet className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>D. Kategori Stok Darah (BDRS) :</span>
                </h4>
                <p className="text-xs text-[#202B2A] pl-7 leading-relaxed">
                  {selectedHandover.bloodStockNotes || 'Stok darah Bank Darah (BDRS) dalam kondisi aman.'}
                </p>
              </div>

              {/* E. Info / Keterangan */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-indigo-50/40 to-white border border-indigo-200 space-y-1">
                <h4 className="font-black text-xs uppercase tracking-wide text-[#4338CA] flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    E
                  </span>
                  <Info className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>E. Kategori Info / Keterangan Operasional :</span>
                </h4>
                <p className="text-xs text-[#202B2A] pl-7 leading-relaxed">
                  {selectedHandover.infoNotes || selectedHandover.followUpNotes || 'Operasional pelayanan shift berjalan normal dan lancar.'}
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#F8F9F7] border-t border-[#E7EAE4] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2 text-[11px] text-[#687572]">
                <Clock className="w-3.5 h-3.5 text-[#176B62]" />
                <span>
                  Waktu input: {selectedHandover.createdAt ? new Date(selectedHandover.createdAt).toLocaleString('id-ID') : '-'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {onEditHandover && (
                  <button
                    onClick={() => {
                      const h = selectedHandover;
                      setSelectedHandover(null);
                      onEditHandover(h);
                    }}
                    className="px-3 py-1.5 bg-[#FFFAD3] hover:bg-[#F5EEB0] text-[#202B2A] font-bold text-xs rounded-xl border border-[#F5EEB0] cursor-pointer transition-colors"
                  >
                    Ubah Data / QC
                  </button>
                )}

                <button
                  onClick={() => exportHandoverPdf(selectedHandover)}
                  className="px-3.5 py-1.5 bg-[#176B62] hover:bg-[#12554E] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen PDF</span>
                </button>

                <button
                  onClick={() => setSelectedHandover(null)}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#E7EAE4] text-[#687572] font-bold text-xs rounded-xl border border-[#E7EAE4] cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
