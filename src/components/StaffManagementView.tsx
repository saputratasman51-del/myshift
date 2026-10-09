import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Shield,
  Phone,
  Mail,
  X,
  UserCheck,
  UserX,
  Sparkles,
  KeyRound,
  Lock,
} from 'lucide-react';
import { Staff, Role, UserAccount } from '../types';
import { labStore } from '../services/store';

interface StaffManagementViewProps {
  currentUser: UserAccount;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Admin Reset Password State
  const [resetStaffTarget, setResetStaffTarget] = useState<Staff | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('password123');
  const [resetAlert, setResetAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    employeeNumber: '',
    position: 'ATLM Pelaksana',
    email: '',
    phone: '',
    role: 'staff' as Role,
    active: true,
  });

  const staffList = labStore.getStaff();
  const isAdmin = currentUser.role === 'admin';

  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeNumber.includes(searchQuery) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.active) ||
      (statusFilter === 'inactive' && !s.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      fullName: '',
      employeeNumber: '',
      position: 'ATLM Pelaksana - Hematologi & Urinalisis',
      email: '',
      phone: '',
      role: 'staff',
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName,
      employeeNumber: staff.employeeNumber,
      position: staff.position,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      active: staff.active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Nama lengkap dan email wajib diisi.');
      return;
    }

    if (editingStaff) {
      labStore.updateStaff(editingStaff.staffId, formData);
      alert('Data petugas berhasil diperbarui.');
    } else {
      labStore.addStaff(formData);
      alert('Petugas ATLM baru berhasil ditambahkan.');
    }

    setShowModal(false);
  };

  const handleToggleActive = (staff: Staff) => {
    const newStatus = !staff.active;
    const action = newStatus ? 'mengaktifkan' : 'menonaktifkan';
    if (confirm(`Apakah Anda yakin ingin ${action} status penugasan ${staff.fullName}?`)) {
      labStore.updateStaff(staff.staffId, { active: newStatus });
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-[#FFFAD3] text-amber-950 font-bold px-2 py-0.5 rounded-md text-[10px] border border-[#F5EEB0]">
            Administrator
          </span>
        );
      case 'coordinator':
        return (
          <span className="bg-[#E8F4F2] text-[#176B62] font-bold px-2 py-0.5 rounded-md text-[10px] border border-[#176B62]/30">
            Koordinator Jadwal
          </span>
        );
      case 'staff':
        return (
          <span className="bg-[#F8F9F7] text-[#687572] font-semibold px-2 py-0.5 rounded-md text-[10px] border border-[#E7EAE4]">
            ATLM Pelaksana
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Data Kepegawaian Laboratorium
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2 py-0.5 rounded-md border border-[#F5EEB0]">
              Total {staffList.length} Personil
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#202B2A] tracking-tight flex items-center space-x-2 mt-1">
            <Users2 className="w-5 h-5 text-[#176B62]" />
            <span>Manajemen Data Petugas ATLM & Pengelola</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Daftar personil Ahli Teknologi Laboratorium Medik RSUD Sultan Muhammad Jamaludin I Kayong Utara
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Petugas Baru</span>
          </button>
        )}
      </div>

      {/* 2. Filter and Search Ribbon */}
      <div className="clinical-card p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E9B98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, ID, NIP, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] font-semibold focus:bg-white focus:outline-[#176B62]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[#687572] font-semibold">Peran:</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-[#F8F9F7] border border-[#E7EAE4] rounded-lg px-2.5 py-1.5 text-[#202B2A] font-semibold focus:outline-[#176B62]"
          >
            <option value="all">Semua Peran</option>
            <option value="staff">Petugas ATLM</option>
            <option value="coordinator">Koordinator Jadwal</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[#687572] font-semibold">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#F8F9F7] border border-[#E7EAE4] rounded-lg px-2.5 py-1.5 text-[#202B2A] font-semibold focus:outline-[#176B62]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Jaga</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* 3. Staff Table */}
      <div className="clinical-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F7] border-b border-[#E7EAE4] text-[#202B2A] font-extrabold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">ID & Nama Lengkap</th>
                <th className="py-3 px-4">NIP / No. STR</th>
                <th className="py-3 px-4">Jabatan / Unit</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Peran Sistem</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE4]">
              {filteredStaff.map(staff => (
                <tr key={staff.staffId} className="hover:bg-[#F8F9F7]/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F4F2] text-[#176B62] font-extrabold flex items-center justify-center shrink-0 border border-[#E7EAE4] ring-1 ring-[#FFFAD3]">
                        {staff.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#202B2A]">{staff.fullName}</div>
                        <div className="text-[10px] text-[#8E9B98] font-mono">{staff.staffId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#687572]">{staff.employeeNumber || '-'}</td>
                  <td className="py-3.5 px-4 text-[#202B2A] font-semibold">{staff.position}</td>
                  <td className="py-3.5 px-4 text-[#687572]">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-[#8E9B98]" />
                      <span className="truncate max-w-[150px]">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center space-x-1 mt-0.5 font-mono text-[11px] text-[#176B62]">
                        <Phone className="w-3 h-3 text-[#8E9B98]" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>
                  <td className="py-3.5 px-4">
                    {staff.active ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F1] text-[#21865B] border border-[#21865B]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#21865B]" />
                        <span>Aktif Jaga</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F2] text-[#D9534F] border border-[#D9534F]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D9534F]" />
                        <span>Nonaktif</span>
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setResetStaffTarget(staff);
                            setAdminNewPassword('password123');
                            setResetAlert(null);
                          }}
                          className="p-1.5 text-amber-700 hover:bg-[#FFFAD3] rounded-lg transition-colors cursor-pointer"
                          title="Reset Kata Sandi Petugas"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 text-[#176B62] hover:bg-[#E8F4F2] rounded-lg transition-colors cursor-pointer"
                          title="Ubah Data Petugas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(staff)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            staff.active
                              ? 'text-[#D9534F] hover:bg-rose-50'
                              : 'text-[#21865B] hover:bg-emerald-50'
                          }`}
                          title={staff.active ? 'Nonaktifkan Petugas' : 'Aktifkan Petugas'}
                        >
                          {staff.active ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus permanen data petugas ${staff.fullName}? Tindakan ini tidak dapat dibatalkan.`)) {
                              labStore.deleteStaff(staff.staffId);
                            }
                          }}
                          className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Petugas Permanen"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Tambah / Ubah Data Petugas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E7EAE4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
              <h3 className="font-extrabold text-base text-[#202B2A] flex items-center space-x-2">
                <Users2 className="w-5 h-5 text-[#176B62]" />
                <span>{editingStaff ? 'Perbarui Data Petugas ATLM' : 'Tambah Petugas ATLM Baru'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8E9B98] hover:text-[#202B2A] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Contoh: Rina Indriyani, A.Md.AK"
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#202B2A] mb-1">NIP / Nomor STR:</label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={e => setFormData({ ...formData, employeeNumber: e.target.value })}
                    placeholder="199208152019032008"
                    className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-mono focus:bg-white focus:outline-[#176B62]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#202B2A] mb-1">Peran Akses Sistem:</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
                  >
                    <option value="staff">Petugas ATLM</option>
                    <option value="coordinator">Koordinator Jadwal</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">Jabatan / Penempatan Unit:</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  placeholder="ATLM Pelaksana - Hematologi & Urinalisis"
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:bg-white focus:outline-[#176B62]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#202B2A] mb-1">Email Resmi:</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="petugas@rsud-smj.go.id"
                    className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:bg-white focus:outline-[#176B62]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#202B2A] mb-1">Nomor Kontak / WhatsApp:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-mono focus:bg-white focus:outline-[#176B62]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-[#202B2A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-[#176B62] rounded border-[#E7EAE4] focus:ring-[#176B62]"
                  />
                  <span>Status Aktif untuk Penugasan Jadwal Shift Laboratorium</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E7EAE4]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Reset Kata Sandi Petugas (Administrator) */}
      {resetStaffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
              <div className="flex items-center space-x-2 text-amber-900">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <h3 className="font-extrabold text-base text-[#202B2A]">
                  Reset Kata Sandi Petugas
                </h3>
              </div>
              <button
                onClick={() => setResetStaffTarget(null)}
                className="text-[#8E9B98] hover:text-[#202B2A] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-xs">
              {resetAlert && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    resetAlert.type === 'success'
                      ? 'bg-[#EBF7F1] border-[#21865B]/30 text-[#21865B]'
                      : 'bg-[#FDF2F2] border-[#D9534F]/30 text-[#D9534F]'
                  }`}
                >
                  {resetAlert.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{resetAlert.message}</span>
                </div>
              )}

              <div className="p-3 bg-[#FFFAD3]/70 rounded-xl border border-[#F5EEB0] space-y-1">
                <div className="font-extrabold text-[#202B2A] text-sm">
                  {resetStaffTarget.fullName}
                </div>
                <div className="text-[11px] text-[#687572]">
                  <strong>NIP:</strong> {resetStaffTarget.employeeNumber} &bull; <strong>Peran:</strong> {resetStaffTarget.role.toUpperCase()}
                </div>
                <div className="text-[11px] text-[#176B62] font-mono">
                  Email: {resetStaffTarget.email}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#202B2A] mb-1">
                  Masukkan Kata Sandi Baru untuk Petugas Ini:
                </label>
                <input
                  type="text"
                  value={adminNewPassword}
                  onChange={e => setAdminNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-mono font-bold focus:bg-white focus:outline-[#176B62]"
                />
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] text-[#8E9B98]">Pilihan cepat:</span>
                  <button
                    type="button"
                    onClick={() => setAdminNewPassword('password123')}
                    className="text-[10px] text-[#176B62] hover:underline font-bold"
                  >
                    Set ke "password123"
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminNewPassword('atlm2025')}
                    className="text-[10px] text-[#176B62] hover:underline font-bold"
                  >
                    Set ke "atlm2025"
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7EAE4]">
                <button
                  type="button"
                  onClick={() => setResetStaffTarget(null)}
                  className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const res = labStore.adminResetStaffPassword(resetStaffTarget.staffId, adminNewPassword);
                      setResetAlert({ type: 'success', message: res.message });
                    } catch (err: any) {
                      setResetAlert({ type: 'error', message: err.message || 'Gagal mereset kata sandi.' });
                    }
                  }}
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors flex items-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Terapkan Sandi Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
