import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Calendar,
  Users,
  Clock,
  Printer,
  TrendingUp,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import { UserAccount } from '../types';
import { labStore } from '../services/store';
import {
  exportScheduleToPDF,
  exportScheduleToExcel,
  exportRecapToExcel,
} from '../services/exportService';

interface ReportsViewProps {
  currentUser: UserAccount;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');

  const staffList = labStore.getStaff();
  const shifts = labStore.getShifts();
  const schedules = labStore.getSchedules();
  const attendance = labStore.getAttendance();

  // Filtered schedules for recap
  const filteredSchedules = schedules.filter(s => {
    if (s.date < startDate || s.date > endDate) return false;
    if (s.status === 'cancelled') return false;
    if (selectedStaffId !== 'all' && s.staffId !== selectedStaffId) return false;
    if (selectedShiftId !== 'all' && s.shiftId !== selectedShiftId) return false;
    return true;
  });

  // Calculate summary metrics
  const countMorning = filteredSchedules.filter(s => s.shiftId === 'pagi').length;
  const countAfternoon = filteredSchedules.filter(s => s.shiftId === 'sore').length;
  const countNight = filteredSchedules.filter(s => s.shiftId === 'malam').length;
  const totalScheduledHours = countMorning * 7 + countAfternoon * 7 + countNight * 10;

  const handleExportPDF = () => {
    exportScheduleToPDF(schedules, shifts, staffList, {
      startDate,
      endDate,
      staffId: selectedStaffId !== 'all' ? selectedStaffId : undefined,
      shiftId: selectedShiftId !== 'all' ? selectedShiftId : undefined,
    });
  };

  const handleExportExcelSchedules = () => {
    exportScheduleToExcel(schedules, shifts, staffList, {
      startDate,
      endDate,
      staffId: selectedStaffId !== 'all' ? selectedStaffId : undefined,
      shiftId: selectedShiftId !== 'all' ? selectedShiftId : undefined,
    });
  };

  const handleExportExcelRecap = () => {
    exportRecapToExcel(schedules, shifts, staffList, attendance, {
      startDate,
      endDate,
      staffId: selectedStaffId !== 'all' ? selectedStaffId : undefined,
      shiftId: selectedShiftId !== 'all' ? selectedShiftId : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Control & Action Bar */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Analitika & Pelaporan Resmi
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2 py-0.5 rounded-md border border-[#F5EEB0]">
              Akuntabilitas Jam Kerja
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#202B2A] tracking-tight flex items-center space-x-2 mt-1">
            <FileSpreadsheet className="w-5 h-5 text-[#176B62]" />
            <span>Rekapitulasi Jam Kerja & Laporan Shift Jaga</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Laporan resmi Instalasi Laboratorium Patologi Klinik RSUD Sultan Muhammad Jamaludin I Kayong Utara
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 bg-[#D9534F] hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            title="Unduh laporan jadwal resmi dalam format PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF Resmi</span>
          </button>
          <button
            onClick={handleExportExcelSchedules}
            className="px-3.5 py-2.5 bg-[#21865B] hover:bg-[#1a6b48] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            title="Unduh lembar kerja Excel jadwal shift"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Jadwal Excel</span>
          </button>
          <button
            onClick={handleExportExcelRecap}
            className="px-3.5 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            title="Unduh rekap jam kerja dan kehadiran per petugas"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ekspor Rekap Kerja</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Parameters Ribbon */}
      <div className="clinical-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block font-bold text-[#202B2A] mb-1">Mulai Tanggal:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#202B2A] mb-1">Sampai Tanggal:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#202B2A] mb-1">Filter Petugas ATLM:</label>
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
          >
            <option value="all">Semua Petugas Laboratorium</option>
            {staffList.map(st => (
              <option key={st.staffId} value={st.staffId}>
                {st.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-[#202B2A] mb-1">Filter Shift:</label>
          <select
            value={selectedShiftId}
            onChange={e => setSelectedShiftId(e.target.value)}
            className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
          >
            <option value="all">Semua Jenis Shift</option>
            {shifts.map(sh => (
              <option key={sh.shiftId} value={sh.shiftId}>
                {sh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Metric Overview Cards with #FFFAD3 Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clinical-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#687572] font-bold">Total Shift Terjadwal</span>
            <span className="text-[10px] bg-[#FFFAD3] text-[#202B2A] px-2 py-0.5 rounded font-bold border border-[#F5EEB0]">
              Periode Aktif
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#202B2A] mt-2">
            {filteredSchedules.length} <span className="text-sm font-semibold text-[#687572]">Shift</span>
          </div>
          <div className="text-[11px] text-[#8E9B98] mt-1 font-mono">
            {startDate} s/d {endDate}
          </div>
        </div>

        <div className="clinical-card p-5 border-l-4 border-l-[#176B62]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#687572] font-bold">Total Jam Terjadwal</span>
            <Clock className="w-4 h-4 text-[#176B62]" />
          </div>
          <div className="text-2xl font-extrabold text-[#176B62] mt-2">
            {totalScheduledHours} <span className="text-sm font-semibold text-[#687572]">Jam</span>
          </div>
          <div className="text-[11px] text-[#8E9B98] mt-1">
            Pagi/Sore: 7 jam, Malam: 10 jam
          </div>
        </div>

        <div className="clinical-card p-5">
          <span className="text-xs text-[#687572] font-bold block">Sebaran Rotasi Shift</span>
          <div className="text-xs text-[#202B2A] font-bold space-y-1 mt-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[#687572]">Pagi:</span>
              <span className="text-[#176B62] bg-[#E8F4F2] px-2 py-0.2 rounded font-mono font-bold">{countMorning}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#687572]">Sore:</span>
              <span className="text-[#D99A22] bg-[#FEF8EC] px-2 py-0.2 rounded font-mono font-bold">{countAfternoon}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#687572]">Malam:</span>
              <span className="text-[#3C79B5] bg-[#EEF4FA] px-2 py-0.2 rounded font-mono font-bold">{countNight}x</span>
            </div>
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#687572] font-bold">Petugas Terlibat</span>
            <Users className="w-4 h-4 text-[#176B62]" />
          </div>
          <div className="text-2xl font-extrabold text-[#202B2A] mt-2">
            {new Set(filteredSchedules.map(s => s.staffId)).size}{' '}
            <span className="text-sm font-semibold text-[#687572]">Orang</span>
          </div>
          <div className="text-[11px] text-[#8E9B98] mt-1">
            Dari total {staffList.length} personil ATLM aktif
          </div>
        </div>
      </div>

      {/* 4. Staff Workload Breakdown Table */}
      <div className="clinical-card overflow-hidden">
        <div className="p-5 border-b border-[#E7EAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8F9F7]/50">
          <div>
            <h3 className="font-extrabold text-[#202B2A] text-sm flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#176B62]" />
              <span>Rincian Beban Kerja Tiap Petugas ATLM ({startDate} s/d {endDate})</span>
            </h3>
            <p className="text-[11px] text-[#8E9B98] mt-0.5">
              Evaluasi kesetaraan distribusi beban kerja dan pemantauan jam istirahat
            </p>
          </div>
          <span className="text-[11px] bg-[#FFFAD3] text-[#202B2A] px-2.5 py-1 rounded-lg border border-[#F5EEB0] font-bold">
            Standar RSUD: Maks. 40 jam/minggu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F7] border-b border-[#E7EAE4] text-[#202B2A] font-extrabold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Petugas ATLM</th>
                <th className="py-3 px-4">NIP / STR</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4 text-center">Shift Pagi</th>
                <th className="py-3 px-4 text-center">Shift Sore</th>
                <th className="py-3 px-4 text-center">Shift Malam</th>
                <th className="py-3 px-4 text-center">Total Shift</th>
                <th className="py-3 px-4 text-right">Jam Terjadwal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE4]">
              {staffList
                .filter(st => (selectedStaffId === 'all' ? true : st.staffId === selectedStaffId))
                .map(st => {
                  const staffScheds = filteredSchedules.filter(s => s.staffId === st.staffId);
                  const pagi = staffScheds.filter(s => s.shiftId === 'pagi').length;
                  const sore = staffScheds.filter(s => s.shiftId === 'sore').length;
                  const malam = staffScheds.filter(s => s.shiftId === 'malam').length;
                  const total = staffScheds.length;
                  const jam = pagi * 7 + sore * 7 + malam * 10;

                  return (
                    <tr key={st.staffId} className="hover:bg-[#F8F9F7]/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#202B2A] flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#E8F4F2] text-[#176B62] font-bold flex items-center justify-center shrink-0 border border-[#E7EAE4]">
                          {st.fullName.charAt(0)}
                        </div>
                        <span>{st.fullName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#687572]">{st.employeeNumber || '-'}</td>
                      <td className="py-3.5 px-4 text-[#687572]">{st.position}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#176B62]">{pagi}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#D99A22]">{sore}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#3C79B5]">{malam}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-[#202B2A] bg-[#FFFAD3]/40">
                        {total}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#176B62]">
                        {jam} Jam
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
