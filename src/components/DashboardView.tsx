import React, { useMemo } from 'react';
import {
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  CalendarCheck2,
  CheckCircle2,
  Database,
  Shield,
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  Building,
  Sparkles,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  FileSpreadsheet,
  BellRing,
} from 'lucide-react';
import { UserAccount, ScheduleConflict } from '../types';
import { labStore } from '../services/store';
import { getStoredSupabaseConfig } from '../services/supabase';

interface DashboardViewProps {
  currentUser: UserAccount;
  onNavigateTab: (tab: any) => void;
  onOpenConflictModal: () => void;
  onOpenShiftAlarmModal?: () => void;
  conflicts: ScheduleConflict[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigateTab,
  onOpenConflictModal,
  onOpenShiftAlarmModal,
  conflicts,
}) => {
  const staffList = labStore.getStaff();
  const shifts = labStore.getShifts();
  const schedules = labStore.getSchedules();
  const swaps = labStore.getSwaps();
  const leaves = labStore.getLeaves();
  const auditLogs = labStore.getAuditLogs();
  const supabaseConfig = getStoredSupabaseConfig();

  const todayStr = new Date().toISOString().split('T')[0];
  const role = currentUser.role;

  // Time-based greeting in Indonesian
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const todayDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Pontianak',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Filter for ATLM personal schedules
  const mySchedules = schedules.filter(s => s.staffId === currentUser.staffId && s.status !== 'cancelled');
  const todayMySchedule = mySchedules.find(s => s.date === todayStr);

  const upcoming7DaysSchedules = mySchedules
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  // Today all schedules
  const todaySchedules = schedules.filter(s => s.date === todayStr && s.status !== 'cancelled');
  const todayMorning = todaySchedules.filter(s => s.shiftId === 'pagi');
  const todayAfternoon = todaySchedules.filter(s => s.shiftId === 'sore');
  const todayNight = todaySchedules.filter(s => s.shiftId === 'malam');

  const pendingSwaps = swaps.filter(s => s.status === 'pending');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const draftSchedulesCount = schedules.filter(s => s.status === 'draft').length;
  const activeStaffCount = staffList.filter(s => s.active).length;

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* 1. Modern Clinical Welcome Card with #FFFAD3 Accent */}
      <div className="relative rounded-[20px] p-6 sm:p-8 bg-gradient-to-br from-[#FFFAD3] via-[#FFFEE8] to-white border border-[#F5EEB0] shadow-[0_4px_25px_rgba(217,154,34,0.06)] overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-72 h-72 text-[#176B62]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0M9 15h6M12 12v6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#176B62] text-white">
                {role === 'admin' ? 'Administrator' : role === 'coordinator' ? 'Koordinator Shift' : 'Petugas ATLM'}
              </span>
              <span className="text-xs font-semibold text-[#687572]">
                {todayDateFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202B2A] tracking-tight leading-tight">
              {greeting}, {currentUser.displayName}
            </h1>

            <p className="text-xs sm:text-sm text-[#687572] max-w-2xl leading-relaxed">
              Instalasi Laboratorium Patologi Klinik RSUD Sultan Muhammad Jamaludin I Kayong Utara. Sistem siap melayani penjadwalan rotasi kerja, presensi, dan pemantauan mutu shift.
            </p>
          </div>

          {/* Quick status pill on welcome card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-[#E7EAE4] text-xs">
              <div className="text-[10px] font-bold text-[#8E9B98] uppercase">Koneksi Pangkalan Data</div>
              <div className="font-extrabold text-[#202B2A] flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${supabaseConfig.url ? 'bg-[#21865B] animate-pulse' : 'bg-[#176B62]'}`} />
                <span>{supabaseConfig.url ? 'Supabase PostgreSQL' : 'Penyimpanan Lokal Aktif'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Critical Conflicts Alert Ribbon (if any detected) */}
      {conflicts.length > 0 && (
        <div
          onClick={onOpenConflictModal}
          className={`p-4 rounded-[18px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-xs ${
            criticalConflicts.length > 0
              ? 'bg-[#FDF2F2] border-[#D9534F]/30 text-[#D9534F] hover:bg-[#FCE8E8]'
              : 'bg-[#FEF8EC] border-[#D99A22]/30 text-[#D99A22] hover:bg-[#FDF3DE]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl shrink-0 ${criticalConflicts.length > 0 ? 'bg-[#D9534F] text-white' : 'bg-[#D99A22] text-white'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">
                Terdeteksi {conflicts.length} Masalah Bentrok pada Roster Jadwal!
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {criticalConflicts.length > 0
                  ? `${criticalConflicts.length} bentrok kritis (tumpang tindih / slot kosong). Jadwal dicegah terbit sebelum diselesaikan.`
                  : 'Peringatan waktu istirahat antar shift jaga belum ideal. Klik untuk memeriksa tindakan.'}
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 bg-white font-bold text-xs rounded-xl border border-current shadow-xs shrink-0 hover:opacity-90">
            Periksa Detail Bentrok →
          </button>
        </div>
      )}

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="clinical-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#687572]">Personil ATLM</span>
            <div className="p-2 rounded-xl bg-[#E8F4F2] text-[#176B62]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202B2A] mt-2">
            {activeStaffCount}
          </div>
          <div className="text-[11px] text-[#21865B] font-semibold mt-1 flex items-center space-x-1">
            <span>● {activeStaffCount} Aktif Bertugas</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="clinical-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#687572]">Jadwal Hari Ini</span>
            <div className="p-2 rounded-xl bg-[#FFFAD3] text-amber-950">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#202B2A] mt-2">
            {todaySchedules.length}
          </div>
          <div className="text-[11px] text-[#687572] mt-1">
            Pagi ({todayMorning.length}) • Sore ({todayAfternoon.length}) • Malam ({todayNight.length})
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('swap')}
          className="clinical-card p-5 cursor-pointer hover:border-[#176B62] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#687572]">Tukar Shift Pending</span>
            <div className="p-2 rounded-xl bg-[#FEF8EC] text-[#D99A22]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D99A22] mt-2">
            {pendingSwaps.length}
          </div>
          <div className="text-[11px] text-[#687572] mt-1">
            {pendingSwaps.length > 0 ? 'Menunggu verifikasi koordinator' : 'Tidak ada antrean permohonan'}
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('schedule')}
          className="clinical-card p-5 cursor-pointer hover:border-[#176B62] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#687572]">Status Roster</span>
            <div className="p-2 rounded-xl bg-[#E8F4F2] text-[#176B62]">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#176B62] mt-2">
            {draftSchedulesCount} Draft
          </div>
          <div className="text-[11px] text-[#687572] mt-1">
            {draftSchedulesCount > 0 ? 'Belum diterbitkan resmi' : 'Seluruh jadwal telah terbit'}
          </div>
        </div>
      </div>

      {/* 4. Jadwal Shift Hari Ini (Pagi, Sore, Malam) */}
      <div className="clinical-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="font-extrabold text-[#202B2A] text-base flex items-center space-x-2">
              <Clock className="w-4.5 h-4.5 text-[#176B62]" />
              <span>Jadwal Petugas Jaga Hari Ini ({todayStr})</span>
            </h3>
            <p className="text-xs text-[#687572] mt-0.5">
              Rotasi 24 jam pelayanan laboratorium rawat jalan, rawat inap, dan IGD CITO
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-bold text-[#176B62] hover:underline flex items-center space-x-1"
          >
            <span>Buka Roster Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shift Pagi */}
          <div className="p-4 rounded-[16px] bg-[#E8F4F2]/50 border border-[#E7EAE4] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-[#176B62]" />
                <span className="font-bold text-xs text-[#176B62] uppercase tracking-wider">
                  Shift Pagi
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#176B62] border border-[#E7EAE4]">
                07.00 - 14.00 WIB
              </span>
            </div>

            <div className="space-y-2">
              {todayMorning.length === 0 ? (
                <div className="text-xs text-[#D9534F] bg-white p-2.5 rounded-xl border border-[#D9534F]/20 font-medium">
                  Belum ada petugas ditugaskan
                </div>
              ) : (
                todayMorning.map(s => {
                  const st = staffList.find(stf => stf.staffId === s.staffId);
                  return (
                    <div key={s.scheduleId} className="bg-white p-3 rounded-xl border border-[#E7EAE4] shadow-2xs">
                      <div className="font-bold text-xs text-[#202B2A]">{st?.fullName || s.staffId}</div>
                      <div className="text-[10px] text-[#687572] mt-0.5">{st?.position}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Shift Sore */}
          <div className="p-4 rounded-[16px] bg-[#FEF8EC]/50 border border-[#E7EAE4] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sunset className="w-4 h-4 text-[#D99A22]" />
                <span className="font-bold text-xs text-[#D99A22] uppercase tracking-wider">
                  Shift Sore
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-amber-950 border border-[#E7EAE4]">
                14.00 - 21.00 WIB
              </span>
            </div>

            <div className="space-y-2">
              {todayAfternoon.length === 0 ? (
                <div className="text-xs text-[#D9534F] bg-white p-2.5 rounded-xl border border-[#D9534F]/20 font-medium">
                  Belum ada petugas ditugaskan
                </div>
              ) : (
                todayAfternoon.map(s => {
                  const st = staffList.find(stf => stf.staffId === s.staffId);
                  return (
                    <div key={s.scheduleId} className="bg-white p-3 rounded-xl border border-[#E7EAE4] shadow-2xs">
                      <div className="font-bold text-xs text-[#202B2A]">{st?.fullName || s.staffId}</div>
                      <div className="text-[10px] text-[#687572] mt-0.5">{st?.position}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Shift Malam */}
          <div className="p-4 rounded-[16px] bg-[#EEF4FA]/50 border border-[#E7EAE4] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-[#3C79B5]" />
                <span className="font-bold text-xs text-[#3C79B5] uppercase tracking-wider">
                  Shift Malam
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#3C79B5] border border-[#E7EAE4]">
                21.00 - 07.00 WIB (+1)
              </span>
            </div>

            <div className="space-y-2">
              {todayNight.length === 0 ? (
                <div className="text-xs text-[#D9534F] bg-white p-2.5 rounded-xl border border-[#D9534F]/20 font-medium">
                  Belum ada petugas ditugaskan
                </div>
              ) : (
                todayNight.map(s => {
                  const st = staffList.find(stf => stf.staffId === s.staffId);
                  return (
                    <div key={s.scheduleId} className="bg-white p-3 rounded-xl border border-[#E7EAE4] shadow-2xs">
                      <div className="font-bold text-xs text-[#202B2A]">{st?.fullName || s.staffId}</div>
                      <div className="text-[10px] text-[#687572] mt-0.5">{st?.position}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Two Columns: Upcoming 7 Days + Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Upcoming Schedule */}
        <div className="lg:col-span-7 clinical-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-[#202B2A] text-sm flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#176B62]" />
              <span>Jadwal Tugas Anda 7 Hari Mendatang</span>
            </h3>
            <span className="text-[10px] font-bold text-[#176B62] bg-[#E8F4F2] px-2 py-0.5 rounded-full">
              {upcoming7DaysSchedules.length} Shift Terjadwal
            </span>
          </div>

          {upcoming7DaysSchedules.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#8E9B98] bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
              Belum ada jadwal tugas terdaftar untuk 7 hari ke depan.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming7DaysSchedules.map(sched => {
                const shift = shifts.find(s => s.shiftId === sched.shiftId);
                const isOvernight = shift?.isOvernight;
                return (
                  <div
                    key={sched.scheduleId}
                    className="p-3.5 bg-[#F8F9F7] hover:bg-[#FFFAD3]/30 border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#202B2A]">{sched.date}</div>
                      <div className="text-[11px] text-[#687572] mt-0.5">
                        {shift?.name} • {shift?.startTime} - {shift?.endTime} WIB {isOvernight ? '(Lintas Hari)' : ''}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        sched.shiftId === 'pagi'
                          ? 'bg-[#E8F4F2] text-[#176B62]'
                          : sched.shiftId === 'sore'
                          ? 'bg-[#FEF8EC] text-[#D99A22]'
                          : 'bg-[#EEF4FA] text-[#3C79B5]'
                      }`}
                    >
                      {shift?.name || sched.shiftId}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Quick Actions & Recent Activity Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Card */}
          <div className="clinical-card p-6">
            <h3 className="font-extrabold text-[#202B2A] text-sm mb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#D99A22]" />
              <span>Aksi Cepat Operasional</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenShiftAlarmModal && (
                <button
                  type="button"
                  onClick={onOpenShiftAlarmModal}
                  className="col-span-2 p-3 bg-gradient-to-r from-[#E8F4F2] to-amber-50/50 hover:bg-[#d8ece8] border border-[#176B62]/30 rounded-xl text-left font-black text-[#176B62] transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#176B62] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <BellRing className="w-4 h-4 text-[#FFFAD3]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#176B62]">Alarm & Pengingat Shift Saya</div>
                      <div className="text-[10px] text-[#687572] font-medium">Buka detail tugas hari ini & uji nada alarm</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#176B62] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              <button
                onClick={() => onNavigateTab('swap')}
                className="p-3 bg-[#F8F9F7] hover:bg-[#FFFAD3] border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-xl text-left font-bold text-[#202B2A] transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#176B62] mb-1.5" />
                <span>Tukar Shift</span>
              </button>

              <button
                onClick={() => onNavigateTab('leave')}
                className="p-3 bg-[#F8F9F7] hover:bg-[#FFFAD3] border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-xl text-left font-bold text-[#202B2A] transition-colors cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4 text-[#176B62] mb-1.5" />
                <span>Cuti & Izin</span>
              </button>

              <button
                onClick={() => onNavigateTab('handover')}
                className="p-3 bg-[#F8F9F7] hover:bg-[#FFFAD3] border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-xl text-left font-bold text-[#202B2A] transition-colors cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-[#176B62] mb-1.5" />
                <span>Serah Terima</span>
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="p-3 bg-[#F8F9F7] hover:bg-[#FFFAD3] border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-xl text-left font-bold text-[#202B2A] transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#176B62] mb-1.5" />
                <span>Ekspor Laporan</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="clinical-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-[#202B2A] text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#176B62]" />
                <span>Aktivitas Sistem Terbaru</span>
              </h3>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-[11px] font-bold text-[#176B62] hover:underline"
              >
                Audit Log →
              </button>
            </div>

            <div className="divide-y divide-[#E7EAE4]">
              {auditLogs.slice(0, 4).map(log => (
                <div key={log.logId} className="py-2.5 text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#202B2A]">{log.actorName}</span>
                    <span className="text-[10px] text-[#8E9B98] font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#687572] text-[11px] mt-0.5 truncate">{log.reason || log.actionType}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
