import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Table as TableIcon,
  Clock,
  User,
  X,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit2,
  ShieldAlert,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import {
  Schedule,
  ShiftConfig,
  Staff,
  UserAccount,
  ScheduleConflict,
} from '../types';
import { labStore } from '../services/store';
import { exportScheduleToPDF, exportScheduleToExcel } from '../services/exportService';

interface ScheduleViewProps {
  currentUser: UserAccount;
  onOpenConflictModal: () => void;
  conflicts: ScheduleConflict[];
}

type ViewMode = 'weekly' | 'daily' | 'monthly' | 'table';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  currentUser,
  onOpenConflictModal,
  conflicts,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterShiftId, setFilterShiftId] = useState<string>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    staffId: '',
    shiftId: 'pagi',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const staffList = labStore.getStaff();
  const shifts = labStore.getShifts();
  const schedules = labStore.getSchedules();

  const isCoordinatorOrAdmin =
    currentUser.role === 'coordinator' || currentUser.role === 'admin';

  // Calculate Dates for Current Week
  const weekDates = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay.toISOString().split('T')[0]);
    }
    return days;
  }, [selectedDate]);

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'weekly') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filterStaffId !== 'all' && s.staffId !== filterStaffId) return false;
      if (filterShiftId !== 'all' && s.shiftId !== filterShiftId) return false;
      return true;
    });
  }, [schedules, filterStaffId, filterShiftId]);

  // Handle Add/Edit Schedule
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const shift = shifts.find(sh => sh.shiftId === formData.shiftId);
    const startTime = shift?.startTime || '07:00';
    const endTime = shift?.endTime || '14:00';

    const startAt = `${formData.date}T${startTime}:00+07:00`;
    let endDateStr = formData.date;
    if (shift?.isOvernight) {
      const nextD = new Date(formData.date);
      nextD.setDate(nextD.getDate() + 1);
      endDateStr = nextD.toISOString().split('T')[0];
    }
    const endAt = `${endDateStr}T${endTime}:00+07:00`;

    if (editingSchedule) {
      labStore.updateSchedule(editingSchedule.scheduleId, {
        staffId: formData.staffId,
        shiftId: formData.shiftId,
        date: formData.date,
        startAt,
        endAt,
        notes: formData.notes,
        status: 'draft',
      });
    } else {
      labStore.addSchedule({
        staffId: formData.staffId,
        shiftId: formData.shiftId,
        date: formData.date,
        startAt,
        endAt,
        status: 'draft',
        notes: formData.notes,
        createdBy: currentUser.staffId,
      });
    }

    setShowAddModal(false);
    setEditingSchedule(null);
  };

  const handleOpenEdit = (sched: Schedule) => {
    setEditingSchedule(sched);
    setFormData({
      staffId: sched.staffId,
      shiftId: sched.shiftId,
      date: sched.date,
      notes: sched.notes || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = (schedId: string) => {
    if (confirm('Hapus penugasan jadwal ini?')) {
      labStore.deleteSchedule(schedId);
    }
  };

  // Handle Publish Schedules
  const handlePublish = () => {
    const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
    if (criticalCount > 0) {
      alert(
        `PERINGATAN: Terdapat ${criticalCount} bentrok kritis pada jadwal yang wajib diselesaikan terlebih dahulu sebelum diterbitkan.`
      );
      onOpenConflictModal();
      return;
    }

    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const count = labStore.publishSchedules(startDate, endDate);
    if (count > 0) {
      alert(`Berhasil menerbitkan ${count} jadwal shift periode ${startDate} s/d ${endDate}. Notifikasi telah dikirimkan ke petugas terkait.`);
    } else {
      alert('Semua jadwal pada periode ini sudah berstatus diterbitkan.');
    }
  };

  // Copy schedule to next week
  const handleCopyNextWeek = () => {
    if (!confirm('Salin seluruh penugasan minggu ini ke minggu berikutnya sebagai DRAFT?')) return;
    const currentWeekScheds = schedules.filter(s => weekDates.includes(s.date) && s.status !== 'cancelled');
    let copiedCount = 0;

    for (const sched of currentWeekScheds) {
      const origDate = new Date(sched.date);
      origDate.setDate(origDate.getDate() + 7);
      const newDateStr = origDate.toISOString().split('T')[0];

      const shift = shifts.find(sh => sh.shiftId === sched.shiftId);
      const startTime = shift?.startTime || '07:00';
      const endTime = shift?.endTime || '14:00';
      const startAt = `${newDateStr}T${startTime}:00+07:00`;

      let nextEndDay = newDateStr;
      if (shift?.isOvernight) {
        const nextD = new Date(newDateStr);
        nextD.setDate(nextD.getDate() + 1);
        nextEndDay = nextD.toISOString().split('T')[0];
      }
      const endAt = `${nextEndDay}T${endTime}:00+07:00`;

      labStore.addSchedule({
        staffId: sched.staffId,
        shiftId: sched.shiftId,
        date: newDateStr,
        startAt,
        endAt,
        status: 'draft',
        notes: sched.notes ? `Salinan: ${sched.notes}` : 'Salinan rotasi berkala',
        createdBy: currentUser.staffId,
      });
      copiedCount++;
    }

    alert(`Berhasil menyalin ${copiedCount} jadwal ke minggu berikutnya.`);
  };

  const getShiftBadge = (shiftId: string) => {
    const shift = shifts.find(s => s.shiftId === shiftId);
    if (!shift) return null;
    let bg = 'bg-[#E8F4F2] text-[#176B62] border-[#E7EAE4]';
    if (shiftId === 'sore') bg = 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]';
    if (shiftId === 'malam') bg = 'bg-[#EEF4FA] text-[#3C79B5] border-[#E7EAE4]';
    if (shiftId === 'libur') bg = 'bg-[#F1F4F1] text-[#687572] border-[#E7EAE4]';

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bg}`}>
        {shift.name} ({shift.startTime}-{shift.endTime})
      </span>
    );
  };

  const criticalConflictsCount = conflicts.filter(c => c.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* 1. Live Conflict Engine Banner */}
      {conflicts.length > 0 && (
        <div
          onClick={onOpenConflictModal}
          className={`p-4 rounded-[18px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-xs ${
            criticalConflictsCount > 0
              ? 'bg-[#FDF2F2] border-[#D9534F]/30 text-[#D9534F] hover:bg-[#FCE8E8]'
              : 'bg-[#FEF8EC] border-[#D99A22]/30 text-[#D99A22] hover:bg-[#FDF3DE]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl shrink-0 ${criticalConflictsCount > 0 ? 'bg-[#D9534F] text-white' : 'bg-[#D99A22] text-white'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold flex items-center space-x-2">
                <span>Deteksi Bentrok Jadwal:</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-current">
                  {conflicts.length} Masalah Terdeteksi
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {criticalConflictsCount > 0
                  ? `${criticalConflictsCount} bentrok kritis (tumpang tindih / izin cuti). Jadwal tidak dapat diterbitkan sebelum diperbaiki.`
                  : 'Peringatan jeda istirahat minimum pasca jaga malam. Klik untuk evaluasi tindakan.'}
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 bg-white text-xs font-bold rounded-xl border border-current shadow-xs shrink-0 hover:opacity-90">
            Periksa & Selesaikan →
          </button>
        </div>
      )}

      {/* 2. Control Bar */}
      <div className="clinical-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation & Period Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-[#F8F9F7] p-1 rounded-xl border border-[#E7EAE4]">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-lg text-[#202B2A] transition-colors cursor-pointer"
              title="Periode Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-[#176B62] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-lg text-[#202B2A] transition-colors cursor-pointer"
              title="Periode Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs sm:text-sm font-extrabold text-[#202B2A] flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-[#176B62]" />
            <span>
              {viewMode === 'weekly'
                ? `Minggu: ${weekDates[0]} s/d ${weekDates[6]}`
                : `Tanggal: ${selectedDate}`}
            </span>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center space-x-1 bg-[#F8F9F7] p-1 rounded-xl border border-[#E7EAE4] self-start">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white text-[#176B62] shadow-2xs'
                : 'text-[#687572] hover:text-[#202B2A]'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-[#176B62] shadow-2xs'
                : 'text-[#687572] hover:text-[#202B2A]'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#176B62] shadow-2xs'
                : 'text-[#687572] hover:text-[#202B2A]'
            }`}
          >
            Tabel Lengkap
          </button>
        </div>

        {/* Coordinator/Admin Actions */}
        {isCoordinatorOrAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingSchedule(null);
                setFormData({
                  staffId: '',
                  shiftId: 'pagi',
                  date: selectedDate,
                  notes: '',
                });
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>

            <button
              onClick={handlePublish}
              className="px-3.5 py-2 bg-[#21865B] hover:bg-[#1a6b48] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title="Terbitkan jadwal minggu ini"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terbitkan Jadwal</span>
            </button>

            <button
              onClick={handleCopyNextWeek}
              className="p-2 bg-[#F8F9F7] hover:bg-white border border-[#E7EAE4] text-[#202B2A] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Salin penugasan ke minggu berikutnya"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Filter Ribbon */}
      <div className="clinical-card p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-1.5 text-[#687572] font-semibold">
          <Filter className="w-3.5 h-3.5 text-[#176B62]" />
          <span>Filter:</span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[#687572] font-medium">Petugas ATLM:</label>
          <select
            value={filterStaffId}
            onChange={e => setFilterStaffId(e.target.value)}
            className="bg-[#F8F9F7] border border-[#E7EAE4] rounded-lg px-2.5 py-1 text-[#202B2A] font-semibold focus:outline-[#176B62]"
          >
            <option value="all">Semua Personil ATLM</option>
            {staffList.map(st => (
              <option key={st.staffId} value={st.staffId}>
                {st.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[#687572] font-medium">Jenis Shift:</label>
          <select
            value={filterShiftId}
            onChange={e => setFilterShiftId(e.target.value)}
            className="bg-[#F8F9F7] border border-[#E7EAE4] rounded-lg px-2.5 py-1 text-[#202B2A] font-semibold focus:outline-[#176B62]"
          >
            <option value="all">Semua Shift</option>
            {shifts.map(sh => (
              <option key={sh.shiftId} value={sh.shiftId}>
                {sh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export buttons */}
        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={() =>
              exportScheduleToExcel(schedules, shifts, staffList, {
                startDate: weekDates[0],
                endDate: weekDates[6],
                staffId: filterStaffId !== 'all' ? filterStaffId : undefined,
                shiftId: filterShiftId !== 'all' ? filterShiftId : undefined,
              })
            }
            className="px-2.5 py-1.5 bg-[#F8F9F7] hover:bg-white border border-[#E7EAE4] rounded-lg flex items-center space-x-1 text-[#202B2A] font-bold text-[11px] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#21865B]" />
            <span>Excel</span>
          </button>
          <button
            onClick={() =>
              exportScheduleToPDF(schedules, shifts, staffList, {
                startDate: weekDates[0],
                endDate: weekDates[6],
                staffId: filterStaffId !== 'all' ? filterStaffId : undefined,
                shiftId: filterShiftId !== 'all' ? filterShiftId : undefined,
              })
            }
            className="px-2.5 py-1.5 bg-[#F8F9F7] hover:bg-white border border-[#E7EAE4] rounded-lg flex items-center space-x-1 text-[#202B2A] font-bold text-[11px] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#D9534F]" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 4. Weekly Calendar View */}
      {viewMode === 'weekly' && (
        <div className="clinical-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[#E7EAE4] bg-[#F8F9F7] text-center text-xs">
            {weekDates.map(dateStr => {
              const d = new Date(dateStr);
              const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={dateStr}
                  className={`p-3 border-r border-[#E7EAE4] last:border-r-0 ${
                    isToday ? 'bg-[#FFFAD3]/70 font-bold' : ''
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#687572]">
                    {dayName}
                  </div>
                  <div className={`text-sm mt-0.5 ${isToday ? 'font-extrabold text-[#176B62]' : 'font-bold text-[#202B2A]'}`}>
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Days Schedule Grid */}
          <div className="grid grid-cols-7 min-h-[480px] divide-x divide-[#E7EAE4]">
            {weekDates.map(dateStr => {
              const daySchedules = filteredSchedules.filter(s => s.date === dateStr);
              return (
                <div key={dateStr} className="p-2 space-y-2 bg-[#F8F9F7]/30">
                  {daySchedules.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-[#8E9B98] py-8">
                      Kosong
                    </div>
                  ) : (
                    daySchedules.map(sched => {
                      const staff = staffList.find(st => st.staffId === sched.staffId);
                      const shift = shifts.find(sh => sh.shiftId === sched.shiftId);

                      let cardBg = 'bg-[#E8F4F2] border-[#E7EAE4] text-[#176B62]';
                      if (sched.shiftId === 'sore') cardBg = 'bg-[#FEF8EC] border-[#F5EEB0] text-amber-950';
                      if (sched.shiftId === 'malam') cardBg = 'bg-[#EEF4FA] border-[#E7EAE4] text-[#3C79B5]';
                      if (sched.shiftId === 'libur') cardBg = 'bg-[#F1F4F1] border-[#E7EAE4] text-[#687572]';

                      return (
                        <div
                          key={sched.scheduleId}
                          className={`p-2.5 rounded-[14px] border text-xs shadow-2xs relative group ${cardBg}`}
                        >
                          <div className="flex items-center justify-between font-bold text-[10px]">
                            <span className="truncate">{shift?.name || sched.shiftId}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-bold ${
                                sched.status === 'published'
                                  ? 'bg-[#21865B]/15 text-[#21865B]'
                                  : 'bg-[#D99A22]/20 text-[#D99A22]'
                              }`}
                            >
                              {sched.status === 'published' ? 'Terbit' : 'Draft'}
                            </span>
                          </div>

                          <div className="font-extrabold text-[#202B2A] mt-1 truncate">
                            {staff?.fullName || 'Belum Ditugaskan'}
                          </div>

                          <div className="text-[10px] opacity-75 mt-0.5 font-mono">
                            {shift?.startTime} - {shift?.endTime} WIB
                          </div>

                          {sched.notes && (
                            <div className="text-[10px] text-[#687572] mt-1 italic line-clamp-1">
                              "{sched.notes}"
                            </div>
                          )}

                          {/* Hover action bar for coordinators */}
                          {isCoordinatorOrAdmin && (
                            <div className="mt-2 pt-1 border-t border-current/15 flex items-center justify-end space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(sched)}
                                className="p-1 hover:bg-black/10 rounded cursor-pointer"
                                title="Ubah Jadwal"
                              >
                                <Edit2 className="w-3 h-3 text-[#202B2A]" />
                              </button>
                              <button
                                onClick={() => handleDelete(sched.scheduleId)}
                                className="p-1 hover:bg-rose-100 text-[#D9534F] rounded cursor-pointer"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Table List View */}
      {viewMode === 'table' && (
        <div className="clinical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9F7] border-b border-[#E7EAE4] text-[#202B2A] font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Shift Jaga</th>
                  <th className="py-3 px-4">Petugas ATLM</th>
                  <th className="py-3 px-4">Jam Tugas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                  {isCoordinatorOrAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE4]">
                {filteredSchedules.map(sched => {
                  const staff = staffList.find(st => st.staffId === sched.staffId);
                  const shift = shifts.find(sh => sh.shiftId === sched.shiftId);
                  return (
                    <tr key={sched.scheduleId} className="hover:bg-[#F8F9F7]/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#202B2A]">{sched.date}</td>
                      <td className="py-3 px-4">{getShiftBadge(sched.shiftId)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#202B2A]">{staff?.fullName || 'Belum Ada'}</div>
                        <div className="text-[10px] text-[#687572]">{staff?.position || '-'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#687572]">
                        {shift?.startTime} - {shift?.endTime} WIB
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sched.status === 'published'
                              ? 'bg-[#EBF7F1] text-[#21865B]'
                              : 'bg-[#FEF8EC] text-[#D99A22]'
                          }`}
                        >
                          {sched.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#687572] max-w-xs truncate">{sched.notes || '-'}</td>
                      {isCoordinatorOrAdmin && (
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(sched)}
                            className="p-1.5 hover:bg-[#F8F9F7] text-[#176B62] rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sched.scheduleId)}
                            className="p-1.5 hover:bg-[#FDF2F2] text-[#D9534F] rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Daily View */}
      {viewMode === 'daily' && (
        <div className="clinical-card p-6">
          <h3 className="font-extrabold text-[#202B2A] text-base mb-4 flex items-center space-x-2">
            <Clock className="w-4.5 h-4.5 text-[#176B62]" />
            <span>Rincian Shift Jaga Tanggal {selectedDate}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map(shift => {
              const slotSchedules = filteredSchedules.filter(
                s => s.date === selectedDate && s.shiftId === shift.shiftId
              );
              return (
                <div key={shift.shiftId} className="p-4 rounded-[16px] border border-[#E7EAE4] bg-[#F8F9F7] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#202B2A]">{shift.name}</span>
                      <span className="text-[11px] font-mono font-bold text-[#176B62]">
                        {shift.startTime} - {shift.endTime} WIB
                      </span>
                    </div>
                    <div className="text-[11px] text-[#687572] mb-3">
                      Kuota Minimum: <strong>{shift.minimumStaff} Petugas</strong>
                    </div>

                    <div className="space-y-2">
                      {slotSchedules.length === 0 ? (
                        <div className="text-xs text-[#D9534F] bg-white p-2.5 rounded-xl border border-[#D9534F]/20 font-medium">
                          Belum ada petugas ditugaskan
                        </div>
                      ) : (
                        slotSchedules.map(sc => {
                          const st = staffList.find(s => s.staffId === sc.staffId);
                          return (
                            <div key={sc.scheduleId} className="p-2.5 bg-white border border-[#E7EAE4] rounded-xl text-xs">
                              <div className="font-bold text-[#202B2A]">{st?.fullName}</div>
                              <div className="text-[10px] text-[#687572]">{st?.position}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {isCoordinatorOrAdmin && (
                    <button
                      onClick={() => {
                        setEditingSchedule(null);
                        setFormData({
                          staffId: '',
                          shiftId: shift.shiftId,
                          date: selectedDate,
                          notes: '',
                        });
                        setShowAddModal(true);
                      }}
                      className="mt-4 w-full py-2 bg-white hover:bg-[#FFFAD3] border border-[#E7EAE4] text-[#176B62] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Tambah Petugas ke Shift Ini
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Add / Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-lg w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
              <h3 className="font-bold text-base text-[#202B2A]">
                {editingSchedule ? 'Ubah Penugasan Shift' : 'Tambah Penugasan Shift Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#8E9B98] hover:text-[#202B2A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Tanggal Tugas:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Pilih Shift Jaga:</label>
                <select
                  value={formData.shiftId}
                  onChange={e => setFormData({ ...formData, shiftId: e.target.value })}
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
                >
                  {shifts.map(sh => (
                    <option key={sh.shiftId} value={sh.shiftId}>
                      {sh.name} ({sh.startTime} - {sh.endTime} WIB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Petugas ATLM:</label>
                <select
                  value={formData.staffId}
                  onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
                >
                  <option value="">-- Pilih Petugas ATLM --</option>
                  {staffList
                    .filter(st => st.active)
                    .map(st => (
                      <option key={st.staffId} value={st.staffId}>
                        {st.fullName} ({st.position})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Catatan Khusus (Opsional):</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Misal: Penanggung jawab alat Cobas C111 / Bank Darah"
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7EAE4]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
