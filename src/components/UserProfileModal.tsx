import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  X,
  Save,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserAccount, Staff } from '../types';
import { labStore } from '../services/store';

interface UserProfileModalProps {
  currentUser: UserAccount;
  currentStaff: Staff | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  currentStaff,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Info profile state
  const [phone, setPhone] = useState(currentStaff?.phone || '');
  const [email, setEmail] = useState(currentStaff?.email || currentUser.email);
  const [infoMessage, setInfoMessage] = useState('');

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage('');
    if (currentStaff) {
      labStore.updateStaff(currentStaff.staffId, { phone, email });
      setInfoMessage('Informasi kontak profil Anda berhasil diperbarui.');
      setTimeout(() => setInfoMessage(''), 3000);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword) {
      setPasswordError('Silakan masukkan kata sandi Anda saat ini.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal harus terdiri dari 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = labStore.changePassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[22px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E7EAE4] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#176B62]" />
            <h3 className="font-extrabold text-base text-[#202B2A]">Profil & Akun Petugas</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E9B98] hover:text-[#202B2A] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-1 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4] my-3">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-[#176B62] shadow-xs'
                : 'text-[#687572] hover:text-[#202B2A]'
            }`}
          >
            Identitas & Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'password'
                ? 'bg-white text-[#176B62] shadow-xs'
                : 'text-[#687572] hover:text-[#202B2A]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ubah Kata Sandi</span>
          </button>
        </div>

        {/* Avatar & Identitas Header */}
        <div className="flex items-center space-x-3.5 p-3.5 bg-gradient-to-br from-[#FFFAD3] via-[#FFFEE8] to-white rounded-2xl border border-[#F5EEB0] mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#176B62] text-white font-black text-lg flex items-center justify-center shadow-xs border border-white ring-2 ring-[#FFFAD3]">
            {currentUser.displayName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-black text-[#202B2A] text-sm truncate">
              {currentUser.displayName}
            </div>
            <div className="text-[11px] text-[#176B62] font-extrabold truncate">
              {currentStaff?.position || 'Pengelola Sistem Laboratorium'}
            </div>
            <div className="text-[10px] text-[#687572] font-mono mt-0.5">
              NIP: {currentStaff?.employeeNumber || '-'}
            </div>
          </div>
        </div>

        {activeTab === 'info' ? (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            {infoMessage && (
              <div className="p-3 rounded-xl bg-[#EBF7F1] border border-[#21865B]/30 text-[#21865B] flex items-center space-x-2 animate-in fade-in font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">NIP / Nomor STR:</label>
              <input
                type="text"
                disabled
                value={currentStaff?.employeeNumber || '-'}
                className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#687572] font-mono text-xs cursor-not-allowed"
              />
              <span className="text-[10px] text-[#8E9B98] mt-0.5 block">
                * NIP dapat digunakan untuk login ke dalam aplikasi
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Hak Akses Sistem:</label>
              <div className="w-full p-2.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl flex items-center justify-between">
                <span className="font-extrabold text-[#176B62]">
                  {currentUser.role === 'admin'
                    ? 'ADMINISTRATOR (Tata Usaha & Sistem)'
                    : currentUser.role === 'coordinator'
                    ? 'KOORDINATOR ATLM (Penanggung Jawab Shift)'
                    : 'ATLM PELAKSANA (Petugas Jaga Laboratorium)'}
                </span>
                <Shield className="w-4 h-4 text-[#176B62]" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Email Terdaftar:</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-semibold focus:outline-[#176B62]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Nomor Telepon / WhatsApp:</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full p-2.5 bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs font-mono focus:outline-[#176B62]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7EAE4]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Kontak</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            {passwordError && (
              <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#D9534F]/30 text-[#D9534F] flex items-start space-x-2 animate-in fade-in font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-[#EBF7F1] border border-[#21865B]/30 text-[#21865B] flex items-center space-x-2 animate-in fade-in font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Kata Sandi Saat Ini:</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama..."
                  required
                  className="w-full p-2.5 pr-10 bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:outline-[#176B62]"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E9B98] hover:text-[#202B2A]"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Kata Sandi Baru:</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  required
                  minLength={6}
                  className="w-full p-2.5 pr-10 bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:outline-[#176B62]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E9B98] hover:text-[#202B2A]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#202B2A] mb-1">Ulangi Kata Sandi Baru:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                required
                minLength={6}
                className="w-full p-2.5 bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] text-xs focus:outline-[#176B62]"
              />
            </div>

            <div className="p-2.5 bg-[#FFFAD3]/60 rounded-xl border border-[#F5EEB0] text-[11px] text-[#687572]">
              Kata sandi baru akan langsung berlaku untuk login Anda selanjutnya menggunakan NIP atau Email.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7EAE4]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl font-bold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Simpan Sandi Baru</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
