import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Edit3,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { UserAccount, AttendanceRecord, AttendanceStatus } from '../types';
import { labStore } from '../services/store';

interface AttendanceViewProps {
  currentUser: UserAccount;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const [checkInNotes, setCheckInNotes] = useState('');
  const [isCorrecting, setIsCorrecting] = useState<AttendanceRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('present');
  const [correctionReason, setCorrectionReason] = useState('');

  const attendance = labStore.getAttendance();
  const staffList = labStore.getStaff();
  const schedules = labStore.getSchedules();
  const shifts = labStore.getShifts();

  const isCoordinator = currentUser.role === 'coordinator' || currentUser.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  // Current user's today attendance
  const myTodayRecord = attendance.find(
    a => a.staffId === currentUser.staffId && a.date === todayStr
  );

  // Current user's today scheduled shift
  const myTodaySchedule = schedules.find(
    s => s.staffId === currentUser.staffId && s.date === todayStr && s.status !== 'cancelled'
  );
  const myTodayShift = shifts.find(sh => sh.shiftId === myTodaySchedule?.shiftId);

  const handleCheckIn = () => {
    labStore.recordCheckIn(
      currentUser.staffId,
      myTodaySchedule?.scheduleId,
      checkInNotes || undefined
    );
    alert('Check-In berhasil dicatat pada zona waktu Asia/Pontianak.');
    setCheckInNotes('');
  };

  const handleCheckOut = () => {
    if (myTodayRecord) {
      labStore.recordCheckOut(myTodayRecord.attendanceId);
      alert('Check-Out berhasil dicatat.');
    }
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCorrecting || !correctionReason.trim()) {
      alert('Wajib mengisi alasan koreksi presensi untuk jejak audit.');
      return;
    }

    labStore.correctAttendance(
      isCorrecting.attendanceId,
      { status: correctionStatus },
      correctionReason.trim()
    );

    alert('Koreksi presensi berhasil disimpan dalam audit log.');
    setIsCorrecting(null);
    setCorrectionReason('');
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <span className="bg-[#EBF7F1] text-[#21865B] px-2.5 py-0.5 rounded-full font-bold text-[10px]">HADIR TEPAT WAKTU</span>;
      case 'late':
        return <span className="bg-[#FEF8EC] text-[#D99A22] px-2.5 py-0.5 rounded-full font-bold text-[10px]">TERLAMBAT</span>;
      case 'excused':
        return <span className="bg-[#EEF4FA] text-[#3C79B5] px-2.5 py-0.5 rounded-full font-bold text-[10px]">IZIN / CUTI</span>;
      case 'absent':
        return <span className="bg-[#FDF2F2] text-[#D9534F] px-2.5 py-0.5 rounded-full font-bold text-[10px]">TIDAK HADIR</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#202B2A] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#176B62]" />
            <span>Presensi Kehadiran Shift Jaga Laboratorium</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Pencatatan waktu kerja aktual berbasis waktu resmi Asia/Pontianak (WIB UTC+7)
          </p>
        </div>
      </div>

      {/* Check-In / Check-Out Hero Action Panel */}
      <div className="clinical-card p-6 sm:p-8">
        <h3 className="font-extrabold text-[#202B2A] text-base mb-2">Presensi Mandiri Hari Ini ({todayStr})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2.5 text-xs">
            <div className="text-[#687572]">
              <strong className="text-[#202B2A]">Petugas:</strong> {currentUser.displayName}
            </div>
            <div className="text-[#687572]">
              <strong className="text-[#202B2A]">Jadwal Terjadwal:</strong>{' '}
              {myTodayShift ? (
                <span className="font-bold text-[#176B62]">
                  {myTodayShift.name} ({myTodayShift.startTime} - {myTodayShift.endTime} WIB)
                </span>
              ) : (
                <span className="text-[#8E9B98]">Tidak ada jadwal tugas aktif hari ini (Lepas Piket/Libur)</span>
              )}
            </div>

            {myTodayRecord && (
              <div className="pt-2 text-[#202B2A] space-y-1.5 border-t border-[#E7EAE4]">
                <div className="flex items-center space-x-2">
                  <strong className="text-[#687572]">Status:</strong> {getStatusBadge(myTodayRecord.status)}
                </div>
                <div>
                  <strong className="text-[#687572]">Waktu Masuk:</strong>{' '}
                  <span className="font-mono text-[#21865B] font-bold">
                    {myTodayRecord.checkIn ? new Date(myTodayRecord.checkIn).toLocaleTimeString('id-ID') : '-'} WIB
                  </span>
                </div>
                <div>
                  <strong className="text-[#687572]">Waktu Pulang:</strong>{' '}
                  <span className="font-mono text-[#176B62] font-bold">
                    {myTodayRecord.checkOut ? new Date(myTodayRecord.checkOut).toLocaleTimeString('id-ID') : 'Belum Check-Out'} {myTodayRecord.checkOut ? 'WIB' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="bg-[#F8F9F7] p-5 rounded-[18px] border border-[#E7EAE4] flex flex-col justify-center space-y-3">
            {!myTodayRecord?.checkIn ? (
              <>
                <input
                  type="text"
                  value={checkInNotes}
                  onChange={e => setCheckInNotes(e.target.value)}
                  placeholder="Catatan masuk (misal: siap kontrol mutu alat Cobas/Sysmex)..."
                  className="w-full p-2.5 bg-white border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:outline-[#176B62]"
                />
                <button
                  onClick={handleCheckIn}
                  className="w-full py-3 bg-[#176B62] hover:bg-[#12554E] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ✓ Lakukan Check-In Shift Sekarang
                </button>
              </>
            ) : !myTodayRecord?.checkOut ? (
              <button
                onClick={handleCheckOut}
                className="w-full py-3 bg-[#D99A22] hover:bg-[#b88017] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ✓ Selesai Jaga: Lakukan Check-Out
              </button>
            ) : (
              <div className="p-3.5 bg-[#EBF7F1] text-[#21865B] text-center rounded-xl font-bold text-xs border border-[#21865B]/20">
                ✓ Presensi Jaga Hari Ini Telah Lengkap (Check-In & Check-Out Tuntas)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="clinical-card overflow-hidden">
        <div className="p-5 border-b border-[#E7EAE4] flex items-center justify-between">
          <h3 className="font-extrabold text-[#202B2A] text-sm">Riwayat Rekap Presensi Jaga</h3>
          <span className="text-xs text-[#687572] font-mono">Total: {attendance.length} Rekod</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F7] border-b border-[#E7EAE4] text-[#202B2A] font-extrabold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Petugas ATLM</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waktu Masuk</th>
                <th className="py-3 px-4">Waktu Pulang</th>
                <th className="py-3 px-4">Keterangan</th>
                {isCoordinator && <th className="py-3 px-4 text-right">Koreksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE4]">
              {attendance.map(rec => {
                const staff = staffList.find(s => s.staffId === rec.staffId);
                return (
                  <tr key={rec.attendanceId} className="hover:bg-[#F8F9F7]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#202B2A]">{rec.date}</td>
                    <td className="py-3 px-4 font-bold text-[#202B2A]">
                      {staff?.fullName}
                      {rec.isCorrected && (
                        <span className="ml-1.5 text-[9px] bg-[#FFFAD3] text-amber-950 border border-[#F5EEB0] px-1.5 py-0.2 rounded font-bold">
                          Terkoreksi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>
                    <td className="py-3 px-4 font-mono text-[#21865B] font-bold">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#687572]">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#687572] max-w-xs truncate">
                      {rec.correctionReason ? `[Koreksi]: ${rec.correctionReason}` : rec.notes || '-'}
                    </td>
                    {isCoordinator && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setIsCorrecting(rec);
                            setCorrectionStatus(rec.status);
                            setCorrectionReason('');
                          }}
                          className="px-2.5 py-1 text-[11px] border border-[#E7EAE4] hover:bg-[#F8F9F7] rounded-lg text-[#176B62] font-bold cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 inline mr-1" />
                          <span>Koreksi</span>
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

      {/* Modal Koreksi Presensi */}
      {isCorrecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <h3 className="font-extrabold text-base text-[#202B2A] mb-1">
              Formulir Koreksi Presensi Resmi
            </h3>
            <p className="text-xs text-[#687572] mb-4">
              Perubahan status kehadiran diaudit secara permanen dalam catatan sistem.
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Status Kehadiran Baru:</label>
                <select
                  value={correctionStatus}
                  onChange={e => setCorrectionStatus(e.target.value as AttendanceStatus)}
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                >
                  <option value="present">Hadir Tepat Waktu</option>
                  <option value="late">Terlambat</option>
                  <option value="excused">Izin / Cuti</option>
                  <option value="absent">Tidak Hadir (Alpha)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">
                  Alasan Koreksi (Wajib untuk Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  required
                  placeholder="Misal: Penugasan darurat rujukan / gangguan perangkat..."
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCorrecting(null)}
                  className="px-4 py-2 border border-[#E7EAE4] text-[#687572] rounded-xl font-bold hover:bg-[#F8F9F7] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
