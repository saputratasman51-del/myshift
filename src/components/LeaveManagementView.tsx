import React, { useState } from 'react';
import {
  CalendarCheck2,
  Plus,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { UserAccount, LeaveRequest, LeaveType } from '../types';
import { labStore } from '../services/store';

interface LeaveManagementViewProps {
  currentUser: UserAccount;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({ currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('cuti_tahunan');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const leaves = labStore.getLeaves();
  const staffList = labStore.getStaff();
  const isCoordinator = currentUser.role === 'coordinator' || currentUser.role === 'admin';

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Silakan isi alasan permohonan cuti/izin.');
      return;
    }

    labStore.createLeaveRequest({
      staffId: currentUser.staffId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    });

    alert('Permohonan cuti/izin berhasil diajukan dan sedang menunggu verifikasi.');
    setShowForm(false);
    setReason('');
  };

  const handleApprove = (reqId: string) => {
    labStore.approveLeaveRequest(reqId, reviewNotes || 'Disetujui oleh Koordinator');
    alert('Permohonan disetujui. Mesin deteksi bentrok akan menandai jika ada jadwal di rentang tanggal tersebut.');
    setReviewingLeave(null);
    setReviewNotes('');
  };

  const handleReject = (reqId: string) => {
    labStore.rejectLeaveRequest(reqId, reviewNotes || 'Ditolak karena kuota pelayanan shift');
    alert('Permohonan ditolak.');
    setReviewingLeave(null);
    setReviewNotes('');
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'cuti_tahunan':
        return <span className="bg-[#E8F4F2] text-[#176B62] font-bold px-2.5 py-0.5 rounded-full text-[10px]">Cuti Tahunan</span>;
      case 'izin_sakit':
        return <span className="bg-[#FDF2F2] text-[#D9534F] font-bold px-2.5 py-0.5 rounded-full text-[10px]">Izin Sakit</span>;
      case 'izin_penting':
        return <span className="bg-[#FEF8EC] text-[#D99A22] font-bold px-2.5 py-0.5 rounded-full text-[10px]">Izin Penting</span>;
      case 'tugas_luar':
        return <span className="bg-[#EEF4FA] text-[#3C79B5] font-bold px-2.5 py-0.5 rounded-full text-[10px]">Tugas Luar / Diklat</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#202B2A] flex items-center space-x-2">
            <CalendarCheck2 className="w-5 h-5 text-[#176B62]" />
            <span>Administrasi Cuti & Izin Petugas ATLM</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Pengajuan cuti tahunan, izin sakit, dan verifikasi ketidakhadiran resmi instalasi
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Tutup Formulir' : 'Ajukan Cuti / Izin'}</span>
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="clinical-card p-6 sm:p-8 max-w-xl mx-auto">
          <h3 className="font-extrabold text-base text-[#202B2A] mb-4">
            Formulir Permohonan Cuti & Izin
          </h3>

          <form onSubmit={handleCreateLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Jenis Permohonan:</label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value as LeaveType)}
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
              >
                <option value="cuti_tahunan">Cuti Tahunan</option>
                <option value="izin_sakit">Izin Sakit (Disertai Keterangan Medis)</option>
                <option value="izin_penting">Izin Kepentingan Keluarga Mendesak</option>
                <option value="tugas_luar">Tugas Luar / Pelatihan ATLM</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Mulai Tanggal:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Alasan Pengajuan:</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                placeholder="Tuliskan keterangan detail..."
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-[#E7EAE4] text-[#687572] rounded-xl font-bold hover:bg-[#F8F9F7] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Kirim Pengajuan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Permohonan */}
      <div className="clinical-card overflow-hidden">
        <div className="p-5 border-b border-[#E7EAE4] flex items-center justify-between">
          <h3 className="font-extrabold text-[#202B2A] text-sm">Riwayat Permohonan Cuti dan Izin</h3>
          <span className="text-xs text-[#687572] font-mono">Total: {leaves.length}</span>
        </div>

        <div className="divide-y divide-[#E7EAE4]">
          {leaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8E9B98]">
              Belum ada data permohonan cuti atau izin.
            </div>
          ) : (
            leaves.map(item => {
              const staff = staffList.find(s => s.staffId === item.staffId);
              return (
                <div key={item.requestId} className="p-5 hover:bg-[#F8F9F7]/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        {getLeaveTypeBadge(item.leaveType)}
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            item.status === 'approved'
                              ? 'bg-[#EBF7F1] text-[#21865B]'
                              : item.status === 'rejected'
                              ? 'bg-[#FDF2F2] text-[#D9534F]'
                              : 'bg-[#FFFAD3] text-amber-950 border border-[#F5EEB0]'
                          }`}
                        >
                          {item.status === 'pending' ? 'Menunggu Review' : item.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[#8E9B98] font-mono">
                          ID: {item.requestId}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-[#202B2A]">
                        {staff?.fullName} <span className="text-xs text-[#687572] font-normal">({staff?.position})</span>
                      </div>

                      <div className="text-xs text-[#687572] font-semibold">
                        Periode: {item.startDate} s/d {item.endDate}
                      </div>

                      <p className="text-xs text-[#202B2A] italic">
                        Alasan: "{item.reason}"
                      </p>

                      {item.reviewNotes && (
                        <div className="text-[11px] text-[#176B62] bg-[#E8F4F2] p-2 rounded-lg border border-[#E7EAE4]">
                          Catatan Koordinator: {item.reviewNotes}
                        </div>
                      )}
                    </div>

                    {isCoordinator && item.status === 'pending' && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleApprove(item.requestId)}
                          className="px-3.5 py-1.5 bg-[#21865B] hover:bg-[#1a6b48] text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.requestId)}
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
    </div>
  );
};
