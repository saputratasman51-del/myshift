import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount, ShiftSwapRequest } from '../types';
import { labStore } from '../services/store';

interface ShiftSwapViewProps {
  currentUser: UserAccount;
}

export const ShiftSwapView: React.FC<ShiftSwapViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedMySchedId, setSelectedMySchedId] = useState('');
  const [selectedTargetStaffId, setSelectedTargetStaffId] = useState('');
  const [selectedTargetSchedId, setSelectedTargetSchedId] = useState('');
  const [reason, setReason] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Review modal
  const [reviewingSwap, setReviewingSwap] = useState<ShiftSwapRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const staffList = labStore.getStaff();
  const shifts = labStore.getShifts();
  const schedules = labStore.getSchedules();
  const swaps = labStore.getSwaps();

  const isCoordinator = currentUser.role === 'coordinator' || currentUser.role === 'admin';

  // Current user's available upcoming schedules
  const mySchedules = schedules.filter(
    s => s.staffId === currentUser.staffId && s.status !== 'cancelled' && s.date >= new Date().toISOString().split('T')[0]
  );

  // Target staff's available upcoming schedules
  const targetStaffSchedules = schedules.filter(
    s => s.staffId === selectedTargetStaffId && s.status !== 'cancelled' && s.date >= new Date().toISOString().split('T')[0]
  );

  const handleTargetChange = (targetStaffId: string) => {
    setSelectedTargetStaffId(targetStaffId);
    setSelectedTargetSchedId('');
    setConflictWarning(null);
  };

  const handleTargetSchedChange = (targetSchedId: string) => {
    setSelectedTargetSchedId(targetSchedId);

    const mySched = schedules.find(s => s.scheduleId === selectedMySchedId);
    const targetSched = schedules.find(s => s.scheduleId === targetSchedId);

    if (mySched && targetSched) {
      if (mySched.date === targetSched.date && mySched.shiftId === targetSched.shiftId) {
        setConflictWarning('Catatan: Kedua jadwal berada pada tanggal dan shift yang sama.');
      } else {
        setConflictWarning(null);
      }
    }
  };

  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMySchedId || !selectedTargetStaffId || !selectedTargetSchedId || !reason.trim()) {
      alert('Silakan lengkapi seluruh kolom formulir permohonan.');
      return;
    }

    labStore.createSwapRequest({
      requesterStaffId: currentUser.staffId,
      targetStaffId: selectedTargetStaffId,
      sourceScheduleId: selectedMySchedId,
      targetScheduleId: selectedTargetSchedId,
      reason: reason.trim(),
    });

    alert('Permohonan tukar shift berhasil dikirim. Menunggu persetujuan Koordinator.');
    setActiveTab('list');
    setSelectedMySchedId('');
    setSelectedTargetStaffId('');
    setSelectedTargetSchedId('');
    setReason('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSwap) return;

    if (reviewAction === 'approve') {
      labStore.approveSwapRequest(reviewingSwap.requestId, reviewNotes || 'Disetujui oleh Koordinator');
      alert('Permohonan tukar shift disetujui. Jadwal kedua petugas telah diperbarui otomatis.');
    } else {
      labStore.rejectSwapRequest(reviewingSwap.requestId, reviewNotes || 'Ditolak oleh Koordinator');
      alert('Permohonan tukar shift ditolak.');
    }

    setReviewingSwap(null);
    setReviewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#202B2A] flex items-center space-x-2">
            <ArrowLeftRight className="w-5 h-5 text-[#176B62]" />
            <span>Alur Pertukaran Shift Jaga Laboratorium</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Mekanisme resmi pengajuan dan verifikasi tukar jaga berlandaskan deteksi bentrok
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#176B62] text-white shadow-xs'
                : 'bg-[#F8F9F7] text-[#687572] hover:bg-[#E7EAE4]'
            }`}
          >
            Daftar Permohonan ({swaps.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#176B62] text-white shadow-xs'
                : 'bg-[#FFFAD3] text-amber-950 border border-[#F5EEB0] hover:bg-[#FFF5B0]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Tukar Shift</span>
          </button>
        </div>
      </div>

      {/* Form Tab */}
      {activeTab === 'create' && (
        <div className="clinical-card p-6 sm:p-8 max-w-2xl mx-auto">
          <h3 className="font-extrabold text-base text-[#202B2A] mb-1">
            Formulir Pengajuan Tukar Shift
          </h3>
          <p className="text-xs text-[#687572] mb-6">
            Pilihlah jadwal tugas Anda dan jadwal rekan sejawat yang bersedia bertukar shift jaga.
          </p>

          <form onSubmit={handleCreateSwap} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#202B2A] mb-1">
                1. Pilih Jadwal Anda yang Hendak Ditukar:
              </label>
              {mySchedules.length === 0 ? (
                <div className="p-3 bg-[#FEF8EC] border border-[#F5EEB0] rounded-xl text-amber-950 text-xs">
                  Anda belum memiliki jadwal tugas ke depan yang dapat diajukan tukar shift.
                </div>
              ) : (
                <select
                  value={selectedMySchedId}
                  onChange={e => setSelectedMySchedId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                >
                  <option value="">-- Pilih Jadwal Anda --</option>
                  {mySchedules.map(sc => {
                    const sh = shifts.find(s => s.shiftId === sc.shiftId);
                    return (
                      <option key={sc.scheduleId} value={sc.scheduleId}>
                        {sc.date} • {sh?.name} ({sh?.startTime} - {sh?.endTime} WIB)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">
                2. Pilih Rekan Petugas ATLM:
              </label>
              <select
                value={selectedTargetStaffId}
                onChange={e => handleTargetChange(e.target.value)}
                required
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
              >
                <option value="">-- Pilih Rekan ATLM --</option>
                {staffList
                  .filter(st => st.staffId !== currentUser.staffId && st.active)
                  .map(st => (
                    <option key={st.staffId} value={st.staffId}>
                      {st.fullName} ({st.position})
                    </option>
                  ))}
              </select>
            </div>

            {selectedTargetStaffId && (
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">
                  3. Pilih Jadwal Rekan yang Akan Diambil:
                </label>
                {targetStaffSchedules.length === 0 ? (
                  <div className="p-3 bg-[#FEF8EC] border border-[#F5EEB0] rounded-xl text-amber-950 text-xs">
                    Rekan ini belum memiliki jadwal jaga terbit untuk ditukar.
                  </div>
                ) : (
                  <select
                    value={selectedTargetSchedId}
                    onChange={e => handleTargetSchedChange(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                  >
                    <option value="">-- Pilih Jadwal Rekan --</option>
                    {targetStaffSchedules.map(sc => {
                      const sh = shifts.find(s => s.shiftId === sc.shiftId);
                      return (
                        <option key={sc.scheduleId} value={sc.scheduleId}>
                          {sc.date} • {sh?.name} ({sh?.startTime} - {sh?.endTime} WIB)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}

            {conflictWarning && (
              <div className="p-3 rounded-xl bg-[#FEF8EC] border border-[#F5EEB0] text-amber-950 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D99A22]" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">
                4. Alasan Pertukaran Shift:
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                placeholder="Tuliskan alasan resmi (keperluan penting, sakit, urusan dinas)..."
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            <div className="pt-3 border-t border-[#E7EAE4] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 border border-[#E7EAE4] text-[#687572] rounded-xl font-bold cursor-pointer hover:bg-[#F8F9F7]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Kirim Permohonan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="clinical-card overflow-hidden">
          <div className="p-5 border-b border-[#E7EAE4] flex items-center justify-between">
            <h3 className="font-extrabold text-[#202B2A] text-sm">Daftar Pengajuan Tukar Shift</h3>
            <span className="text-xs text-[#687572] font-mono">
              Total: {swaps.length} Permohonan
            </span>
          </div>

          <div className="divide-y divide-[#E7EAE4]">
            {swaps.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E9B98]">
                Belum ada pengajuan tukar shift saat ini.
              </div>
            ) : (
              swaps.map(swap => {
                const requester = staffList.find(s => s.staffId === swap.requesterStaffId);
                const target = staffList.find(s => s.staffId === swap.targetStaffId);
                const schedA = schedules.find(s => s.scheduleId === swap.sourceScheduleId);
                const schedB = schedules.find(s => s.scheduleId === swap.targetScheduleId);
                const shiftA = shifts.find(s => s.shiftId === schedA?.shiftId);
                const shiftB = shifts.find(s => s.shiftId === schedB?.shiftId);

                return (
                  <div key={swap.requestId} className="p-5 hover:bg-[#F8F9F7]/70 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              swap.status === 'approved'
                                ? 'bg-[#EBF7F1] text-[#21865B]'
                                : swap.status === 'rejected'
                                ? 'bg-[#FDF2F2] text-[#D9534F]'
                                : 'bg-[#FFFAD3] text-amber-950 border border-[#F5EEB0]'
                            }`}
                          >
                            {swap.status === 'pending' ? 'Menunggu Persetujuan' : swap.status.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-[#8E9B98] font-mono">
                            ID: {swap.requestId}
                          </span>
                        </div>

                        {/* Swap visual comparison */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="p-2.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
                            <div className="font-extrabold text-[#176B62]">{requester?.fullName}</div>
                            <div className="text-[11px] text-[#687572]">
                              {schedA?.date} • {shiftA?.name} ({shiftA?.startTime}-{shiftA?.endTime})
                            </div>
                          </div>

                          <div className="p-1.5 text-[#176B62] bg-[#E8F4F2] rounded-full">
                            <ArrowLeftRight className="w-4 h-4" />
                          </div>

                          <div className="p-2.5 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
                            <div className="font-extrabold text-[#176B62]">{target?.fullName}</div>
                            <div className="text-[11px] text-[#687572]">
                              {schedB?.date} • {shiftB?.name} ({shiftB?.startTime}-{shiftB?.endTime})
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#202B2A] italic">
                          Alasan: "{swap.reason}"
                        </p>

                        {swap.reviewNotes && (
                          <div className="text-[11px] text-[#176B62] bg-[#E8F4F2] p-2 rounded-lg border border-[#E7EAE4]">
                            Catatan Verifikator: {swap.reviewNotes}
                          </div>
                        )}
                      </div>

                      {/* Coordinator action buttons */}
                      {isCoordinator && swap.status === 'pending' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => {
                              setReviewingSwap(swap);
                              setReviewAction('approve');
                              setReviewNotes('Disetujui untuk mendukung operasional layanan lab');
                            }}
                            className="px-3.5 py-1.5 bg-[#21865B] hover:bg-[#1a6b48] text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => {
                              setReviewingSwap(swap);
                              setReviewAction('reject');
                              setReviewNotes('Ditolak karena rotasi kompetensi shift');
                            }}
                            className="px-3.5 py-1.5 bg-[#D9534F] hover:bg-[#c9302c] text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Review Confirmation Modal */}
      {reviewingSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <h3 className="font-extrabold text-base text-[#202B2A] mb-2">
              {reviewAction === 'approve' ? 'Konfirmasi Persetujuan Tukar Shift' : 'Konfirmasi Penolakan Tukar Shift'}
            </h3>
            <p className="text-xs text-[#687572] mb-4 leading-relaxed">
              {reviewAction === 'approve'
                ? 'Jadwal kedua personil ATLM pada roster shift akan otomatis ditukar dan notifikasi pembaruan dikirimkan.'
                : 'Berikan catatan penolakan resmi agar petugas dapat mengevaluasi kembali.'}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Catatan Koordinator:</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingSwap(null)}
                  className="px-4 py-2 border border-[#E7EAE4] text-[#687572] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold cursor-pointer ${
                    reviewAction === 'approve' ? 'bg-[#21865B] hover:bg-[#1a6b48]' : 'bg-[#D9534F] hover:bg-[#c9302c]'
                  }`}
                >
                  {reviewAction === 'approve' ? 'Setujui Permohonan' : 'Tolak Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
