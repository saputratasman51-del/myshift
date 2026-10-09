import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Shield,
  MapPin,
  Coffee,
  Check,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { UserAccount, Staff, Schedule, ShiftConfig } from '../types';
import { labStore } from '../services/store';
import { NavTab } from './Sidebar';
import {
  playSingleChimeTone,
  startShiftAlarm,
  stopShiftAlarm,
  isAlarmActive,
} from '../utils/audioChime';

interface ShiftAlarmReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  currentStaff: Staff | null;
  onNavigateTab: (tab: NavTab) => void;
}

export const ShiftAlarmReminderModal: React.FC<ShiftAlarmReminderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentStaff,
  onNavigateTab,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [alarmPlaying, setAlarmPlaying] = useState<boolean>(false);
  const [autoOpenPreference, setAutoOpenPreference] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rsud_smj_auto_shift_alarm');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const staff = currentStaff || labStore.getStaff().find(s => s.staffId === currentUser.staffId) || null;
  const staffId = staff?.staffId || currentUser.staffId;

  // Live Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today Date String (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const y = currentTime.getFullYear();
    const m = String(currentTime.getMonth() + 1).padStart(2, '0');
    const d = String(currentTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentTime]);

  const allSchedules = labStore.getSchedules();
  const allShifts = labStore.getShifts();
  const allStaff = labStore.getStaff();

  // Find User's Schedule for Today
  const todaySchedule = useMemo(() => {
    return allSchedules.find(s => s.staffId === staffId && s.date === todayStr);
  }, [allSchedules, staffId, todayStr]);

  // Find matching shift config
  const todayShift = useMemo(() => {
    if (!todaySchedule) return null;
    return allShifts.find(sh => sh.shiftId === todaySchedule.shiftId) || null;
  }, [todaySchedule, allShifts]);

  // Teammates on the same shift today
  const shiftTeammates = useMemo(() => {
    if (!todaySchedule) return [];
    return allSchedules
      .filter(
        s =>
          s.date === todayStr &&
          s.shiftId === todaySchedule.shiftId &&
          s.staffId !== staffId
      )
      .map(s => {
        const found = allStaff.find(st => st.staffId === s.staffId);
        return found ? found.fullName : 'Rekan Petugas ATLM';
      });
  }, [allSchedules, todaySchedule, todayStr, staffId, allStaff]);

  // Upcoming schedules (next 3 days)
  const upcomingSchedules = useMemo(() => {
    return allSchedules
      .filter(s => s.staffId === staffId && s.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .map(s => {
        const shiftCfg = allShifts.find(sh => sh.shiftId === s.shiftId);
        return {
          ...s,
          shiftConfig: shiftCfg,
        };
      });
  }, [allSchedules, staffId, todayStr, allShifts]);

  // Calculate live shift status (Active, Upcoming with countdown, or Passed)
  const shiftTimeStatus = useMemo(() => {
    if (!todayShift) return { status: 'off', label: 'Libur / Lepas Jaga', diffMinutes: 0 };

    const [startH, startM] = todayShift.startTime.split(':').map(Number);
    const [endH, endM] = todayShift.endTime.split(':').map(Number);

    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    const currentTotalMin = nowH * 60 + nowM;
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    // Handle overnight shifts (e.g., 21:00 to 07:00 next day)
    const isOvernight = startTotalMin > endTotalMin;

    if (isOvernight) {
      if (currentTotalMin >= startTotalMin || currentTotalMin < endTotalMin) {
        return { status: 'active', label: 'SEDANG BERLANGSUNG', diffMinutes: 0 };
      } else if (currentTotalMin < startTotalMin) {
        const diff = startTotalMin - currentTotalMin;
        return { status: 'upcoming', label: 'SEGERA BERLANGSUNG', diffMinutes: diff };
      } else {
        return { status: 'passed', label: 'SELESAI DINAS', diffMinutes: 0 };
      }
    } else {
      if (currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin) {
        return { status: 'active', label: 'SEDANG BERLANGSUNG', diffMinutes: 0 };
      } else if (currentTotalMin < startTotalMin) {
        const diff = startTotalMin - currentTotalMin;
        return { status: 'upcoming', label: 'SEGERA BERLANGSUNG', diffMinutes: diff };
      } else {
        return { status: 'passed', label: 'SELESAI DINAS', diffMinutes: 0 };
      }
    }
  }, [todayShift, currentTime]);

  // Helper format countdown minutes to hours & minutes
  const formatCountdown = (totalMinutes: number) => {
    if (totalMinutes <= 0) return 'Sekarang';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours} jam ${mins} menit lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return `${mins} menit lagi`;
  };

  // Play audio chime once when opened
  useEffect(() => {
    if (isOpen) {
      // Try playing a friendly melodic chime on initial opening
      try {
        playSingleChimeTone();
      } catch {
        // browser autoplay policy may require interaction
      }
    } else {
      stopShiftAlarm();
      setAlarmPlaying(false);
    }
    return () => {
      stopShiftAlarm();
    };
  }, [isOpen]);

  const toggleAlarmSound = () => {
    if (alarmPlaying) {
      stopShiftAlarm();
      setAlarmPlaying(false);
    } else {
      setAlarmPlaying(true);
      startShiftAlarm();
    }
  };

  const handleToggleAutoOpen = (checked: boolean) => {
    setAutoOpenPreference(checked);
    try {
      localStorage.setItem('rsud_smj_auto_shift_alarm', JSON.stringify(checked));
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202B2A]/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[26px] max-w-xl w-full shadow-[0_20px_60px_rgba(32,43,42,0.25)] border border-[#E7EAE4] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* TOP HEADER: Hospital identity & Alarm Banner */}
        <div className="relative bg-gradient-to-r from-[#176B62] via-[#12554E] to-[#0E4640] text-white p-5 sm:p-6 overflow-hidden shrink-0">
          {/* Subtle background decorative circle */}
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-24 -bottom-12 w-32 h-32 rounded-full bg-[#FFFAD3]/10 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Pulsing Alarm Icon Badge */}
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md transition-all ${
                    alarmPlaying
                      ? 'bg-[#FFFAD3] text-amber-950 border-[#F5EEB0] ring-4 ring-amber-300/40 animate-bounce'
                      : 'bg-white/15 text-[#FFFAD3] border-white/20'
                  }`}
                >
                  {alarmPlaying ? (
                    <BellRing className="w-6 h-6 animate-spin text-amber-900" />
                  ) : (
                    <Bell className="w-6 h-6" />
                  )}
                </div>
                {shiftTimeStatus.status === 'active' && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                  </span>
                )}
              </div>

              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#FFFAD3] font-black text-[10px] tracking-wider uppercase border border-white/20">
                  <Sparkles className="w-3 h-3 text-[#FFFAD3]" />
                  <span>Pengingat & Alarm Jadwal Dinas</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                  RSUD Sultan Muhammad Jamaludin I
                </h2>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  Instalasi Laboratorium Patologi Klinik &bull; Kab. Kayong Utara
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Tutup Pengingat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Live Time Bar */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2 text-teal-100">
              <Clock className="w-3.5 h-3.5 text-[#FFFAD3]" />
              <span className="font-semibold">
                {new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(currentTime)}
              </span>
            </div>
            <div className="font-mono font-black text-[#FFFAD3] text-sm bg-black/20 px-2.5 py-0.5 rounded-lg border border-white/10 tracking-wider">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}{' '}
              WIB
            </div>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* USER IDENTITY CARD */}
          <div className="p-3.5 rounded-2xl bg-[#F8F9F7] border border-[#E7EAE4] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#176B62] text-white font-black text-sm flex items-center justify-center shadow-xs">
                {currentUser.displayName.charAt(0)}
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#687572] uppercase tracking-wider">
                  Petugas Laboratorium:
                </div>
                <div className="text-sm font-black text-[#202B2A]">
                  {staff?.fullName || currentUser.displayName}
                </div>
                <div className="text-[11px] text-[#687572] font-mono">
                  NIP: {staff?.employeeNumber || '-'} &bull; {staff?.position || 'ATLM'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white border border-[#E7EAE4] text-[#176B62] shadow-2xs">
                Peran: {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* MAIN CARD: JADWAL HARI INI */}
          {todayShift ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                shiftTimeStatus.status === 'active'
                  ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-400 shadow-md'
                  : shiftTimeStatus.status === 'upcoming'
                  ? 'bg-gradient-to-br from-[#E8F4F2] via-white to-[#E8F4F2]/50 border-[#176B62] shadow-sm'
                  : 'bg-[#F8F9F7] border-[#E7EAE4]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#176B62]">
                    Status Shift Dinas Hari Ini
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-[#176B62] text-white">
                    Hari Ini
                  </span>
                </div>

                {/* Status Indicator Badge */}
                {shiftTimeStatus.status === 'active' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>SEDANG BERLANGSUNG</span>
                  </span>
                )}
                {shiftTimeStatus.status === 'upcoming' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#176B62] text-white shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mulai {formatCountdown(shiftTimeStatus.diffMinutes)}</span>
                  </span>
                )}
                {shiftTimeStatus.status === 'passed' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dinas Hari Ini Selesai</span>
                  </span>
                )}
              </div>

              {/* Shift Name and Time Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-[#E7EAE4]/80 shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-[#687572]">Nama Shift Tugas:</div>
                  <div className="text-base sm:text-lg font-black text-[#202B2A] flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: todayShift.color || '#176B62' }}
                    />
                    <span>{todayShift.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#F8F9F7] border border-[#E7EAE4] font-mono font-bold text-[#176B62]">
                      Kode: {todayShift.shiftId.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs font-bold text-[#687572]">Jam Kerja Dinas:</div>
                  <div className="text-base sm:text-lg font-black text-[#176B62] font-mono">
                    {todayShift.startTime} - {todayShift.endTime} WIB
                  </div>
                </div>
              </div>

              {/* Teammates and Notes */}
              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex items-start space-x-2 text-[#202B2A]">
                  <Users className="w-4 h-4 text-[#176B62] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Rekan Dinas Jaga: </span>
                    {shiftTeammates.length > 0 ? (
                      <span className="font-semibold text-[#176B62]">
                        {shiftTeammates.join(', ')}
                      </span>
                    ) : (
                      <span className="text-[#687572] italic">
                        Petugas tunggal shift / piket mandiri
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#202B2A]">
                  <MapPin className="w-4 h-4 text-[#176B62] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lokasi Unit: </span>
                    <span className="text-[#687572]">
                      Instalasi Laboratorium Patologi Klinik RSUD SMJ I (Lantai 1)
                    </span>
                  </div>
                </div>

                {todaySchedule?.notes && (
                  <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200/50 text-[11px] text-teal-900 leading-relaxed">
                    <strong>Catatan Tugas:</strong> {todaySchedule.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* OFF / LEPAS JAGA CARD */
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300 text-[#202B2A]">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Coffee className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-200 text-emerald-950">
                    <Check className="w-3 h-3" />
                    <span>Lepas Jaga / Libur</span>
                  </div>
                  <h3 className="font-black text-base text-emerald-950 mt-0.5">
                    Hari Ini Anda Tidak Memiliki Jadwal Dinas Jaga (OFF)
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Nikmati waktu istirahat Anda untuk menjaga kebugaran stamina sebelum dinas jaga berikutnya.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* UPCOMING ROSTER PREVIEW (Next 3 Days) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black uppercase tracking-wider text-[#687572] flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#176B62]" />
                <span>Roster Dinas Berikutnya:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('schedule');
                }}
                className="text-[11px] font-bold text-[#176B62] hover:underline flex items-center space-x-0.5 cursor-pointer"
              >
                <span>Lihat Kalender</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {upcomingSchedules.length > 0 ? (
                upcomingSchedules.map((sc, idx) => {
                  const dateObj = new Date(sc.date + 'T00:00:00');
                  const dayName = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  }).format(dateObj);

                  return (
                    <div
                      key={sc.scheduleId || idx}
                      className="p-2.5 rounded-xl border border-[#E7EAE4] bg-[#F8F9F7] hover:bg-white transition-all text-xs"
                    >
                      <div className="text-[10px] font-black text-[#687572] uppercase">
                        {dayName}
                      </div>
                      <div className="font-black text-[#202B2A] mt-0.5 truncate flex items-center space-x-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sc.shiftConfig?.color || '#176B62' }}
                        />
                        <span>{sc.shiftConfig?.name || 'Shift ' + sc.shiftId}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#176B62] font-semibold mt-0.5">
                        {sc.shiftConfig ? `${sc.shiftConfig.startTime} - ${sc.shiftConfig.endTime}` : '-'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-3 text-xs text-[#8E9B98] italic bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
                  Belum ada publikasi jadwal lanjutan untuk hari berikutnya.
                </div>
              )}
            </div>
          </div>

          {/* AUDIO ALARM CONTROLS BAR */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-[#FFFAD3]/50 border border-amber-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  alarmPlaying
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {alarmPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-extrabold text-amber-950 text-xs">
                  {alarmPlaying ? 'Alarm Sedang Berbunyi' : 'Uji Nada Lonceng Pengingat'}
                </div>
                <div className="text-[10px] text-amber-900/80">
                  Harmoni chime klinis standar laboratorium rumah sakit
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAlarmSound}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                alarmPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {alarmPlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Matikan Alarm</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Bunyikan Alarm</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS & PREFERENCES */}
        <div className="p-4 sm:p-5 bg-[#F8F9F7] border-t border-[#E7EAE4] space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs">
            {/* Auto-Open Checkbox */}
            <label className="flex items-center space-x-2 text-[#687572] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoOpenPreference}
                onChange={e => handleToggleAutoOpen(e.target.checked)}
                className="rounded border-[#E7EAE4] text-[#176B62] focus:ring-[#176B62] w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-medium text-[#202B2A]">
                Selalu tampilkan alarm pengingat ini otomatis saat membuka aplikasi
              </span>
            </label>

            <span className="text-[10px] text-[#8E9B98] hidden sm:inline">
              Dapat dibuka lewat ikon alarm di Navbar
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {/* Quick action: Serah Terima (if scheduled today) */}
            {todayShift && (
              <button
                type="button"
                onClick={() => {
                  stopShiftAlarm();
                  onClose();
                  onNavigateTab('handover');
                }}
                className="px-4 py-2.5 bg-white hover:bg-[#E8F4F2] text-[#176B62] border border-[#176B62]/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#176B62]" />
                <span>Buka Serah Terima Jaga</span>
              </button>
            )}

            {/* Quick action: Kalender Jadwal */}
            <button
              type="button"
              onClick={() => {
                stopShiftAlarm();
                onClose();
                onNavigateTab('schedule');
              }}
              className="px-4 py-2.5 bg-white hover:bg-[#F8F9F7] text-[#202B2A] border border-[#E7EAE4] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#687572]" />
              <span>Kalender Jadwal Saya</span>
            </button>

            {/* Confirm & Dismiss */}
            <button
              type="button"
              onClick={() => {
                stopShiftAlarm();
                onClose();
              }}
              className="px-5 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Saya Mengerti & Siap Dinas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
