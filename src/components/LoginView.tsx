import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Clock,
  Building,
  KeyRound,
  CheckCircle2,
  X,
  Search,
  User,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { labStore } from '../services/store';
import { LAB_HERO_IMAGE, LOGO_KAYONG_UTARA } from '../assets/images';
import { Role } from '../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Login input state: default to empty / clean state for production login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Self-service Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState<{ user: any; staff: any } | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan NIP atau Email petugas yang terdaftar.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const success = labStore.login(identifier, password);
        if (success) {
          setIsLoading(false);
          onLoginSuccess();
        } else {
          setIsLoading(false);
          setErrorMessage('Akun tidak ditemukan atau kata sandi tidak cocok. Silakan periksa kembali.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Terjadi kesalahan saat memproses login.');
      }
    }, 400);
  };

  // Search/Verify identity in Reset Modal
  const handleVerifyAccount = () => {
    setResetError('');
    setResetSuccess('');
    if (!resetIdentifier.trim()) {
      setResetError('Silakan masukkan NIP atau Email yang terdaftar.');
      return;
    }

    const found = labStore.findAccountByIdentifier(resetIdentifier);
    if (!found) {
      setResetError(`Akun dengan NIP atau Email "${resetIdentifier}" tidak ditemukan di sistem.`);
      setVerifiedAccount(null);
    } else {
      setVerifiedAccount(found);
    }
  };

  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!verifiedAccount) {
      setResetError('Silakan verifikasi NIP atau Email Anda terlebih dahulu.');
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Konfirmasi kata sandi baru tidak sama. Periksa kembali.');
      return;
    }

    setIsResetting(true);
    try {
      const res = labStore.resetPassword(resetIdentifier, resetNewPassword);
      if (res.success) {
        setIsResetting(false);
        setResetSuccess(res.message);
        // Automatically set the new credentials in the login form!
        setIdentifier(resetIdentifier);
        setPassword(resetNewPassword);
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccess('');
          setVerifiedAccount(null);
          setResetNewPassword('');
          setResetConfirmPassword('');
        }, 1800);
      }
    } catch (err: any) {
      setIsResetting(false);
      setResetError(err.message || 'Gagal mereset kata sandi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F7] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-[24px] overflow-hidden shadow-[0_12px_45px_rgba(32,43,42,0.1)] border border-[#E7EAE4] bg-white">
        {/* Left Side: Hospital Branding & ATLM Lab Showcase */}
        <div className="lg:col-span-5 relative p-7 sm:p-9 flex flex-col justify-between overflow-hidden bg-[#176B62] text-white">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={LAB_HERO_IMAGE}
              alt="Laboratorium Klinis RSUD SMJ I"
              className="w-full h-full object-cover object-center filter brightness-35 contrast-110 blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12554E] via-[#176B62]/85 to-[#176B62]/95 mix-blend-multiply" />
          </div>

          {/* Top Branding */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3.5 mb-6">
              <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-[#FFFAD3] ring-2 ring-[#FFFAD3]/70">
                <img
                  src={LOGO_KAYONG_UTARA}
                  alt="Logo Kabupaten Kayong Utara"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFFAD3] block leading-tight">
                  Pemerintah Kab. Kayong Utara
                </span>
                <span className="text-sm font-black tracking-tight text-white block mt-0.5 leading-tight">
                  RSUD Sultan Muhammad Jamaludin I
                </span>
                <span className="text-[11px] text-teal-100/90 font-semibold block mt-0.5">
                  Instalasi Laboratorium Patologi Klinik
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFFAD3] text-amber-950 font-black text-[11px] border border-[#F5EEB0] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B62]" />
                <span>Portal Resmi Login Mandiri ATLM</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Sistem Informasi Shift Jaga & Pelayanan Lab
              </h2>

              <p className="text-xs text-teal-100/90 leading-relaxed font-normal">
                Setiap ATLM, Koordinator, dan Administrator memiliki hak akses dan akun mandiri terpisah. Masuk menggunakan <strong>NIP resmi</strong> atau <strong>Email terdaftar</strong> beserta kata sandi pribadi Anda.
              </p>
            </div>
          </div>

          {/* Role Access Hierarchy Explanation */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/20 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-[#FFFAD3] uppercase tracking-wider mb-2">
              Pemisahan Hak Akses Login:
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <strong className="text-white">1. Administrator Lab:</strong>
                <span className="bg-[#FFFAD3] text-amber-950 px-1.5 py-0.5 rounded text-[9px] font-black">Full Access</span>
              </div>
              <p className="text-[10px] text-teal-100/80">Manajemen staf, pengaturan shift, reset sandi staf, dan audit log.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <strong className="text-white">2. Koordinator Shift:</strong>
                <span className="bg-sky-200 text-sky-950 px-1.5 py-0.5 rounded text-[9px] font-black">Koordinator</span>
              </div>
              <p className="text-[10px] text-teal-100/80">Penyusunan jadwal dinas, persetujuan tukar shift, cuti, dan berita acara.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <strong className="text-white">3. Petugas ATLM Pelaksana:</strong>
                <span className="bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded text-[9px] font-black">ATLM Roster</span>
              </div>
              <p className="text-[10px] text-teal-100/80">Pengisian serah terima jaga, cek jadwal jaga, permohonan tukar & cuti.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Minimalist Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-5">
            <div className="flex items-center space-x-2 text-xs font-black text-[#176B62] uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Autentikasi Akun Petugas Laboratorium</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#202B2A] tracking-tight">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs text-[#687572] mt-0.5">
              Gunakan <strong>NIP / Nomor STR</strong> atau <strong>Email</strong> resmi yang terdata di kepegawaian RSUD SMJ I.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDF2F2] border border-[#D9534F]/30 text-[#D9534F] text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-bold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#202B2A] mb-1">
                NIP / Nomor STR atau Email Terdaftar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9B98]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Contoh: 19890520 201502 1 003 atau email@rsud-smj.go.id"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B62] focus:border-[#176B62] transition-all"
                />
              </div>
              <span className="text-[10px] text-[#8E9B98] mt-0.5 block">
                Bisa menggunakan format NIP dengan atau tanpa spasi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#202B2A] mb-1">
                Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9B98]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun..."
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B62] focus:border-[#176B62] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E9B98] hover:text-[#202B2A] cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center space-x-2 text-[#687572] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#E7EAE4] text-[#176B62] focus:ring-[#176B62] w-3.5 h-3.5"
                />
                <span className="font-medium text-[11px]">Ingat identitas di perangkat ini</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(identifier);
                  setVerifiedAccount(null);
                  setResetError('');
                  setResetSuccess('');
                  setShowResetModal(true);
                }}
                className="text-[#176B62] hover:underline font-extrabold text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset / Lupa Kata Sandi?</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#176B62] hover:bg-[#12554E] text-white font-black text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Identitas Petugas...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem Shift Laboratorium</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Help Footer */}
          <div className="mt-8 pt-4 border-t border-[#E7EAE4] flex items-center justify-between text-[11px] text-[#8E9B98]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B62]" />
              <span>Koneksi Aman Terenkripsi RSUD SMJ I</span>
            </div>
            <span>Bantuan IT Lab: ext. 104</span>
          </div>
        </div>
      </div>

      {/* SELF-SERVICE RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E7EAE4] max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
              <div className="flex items-center space-x-2 text-[#176B62]">
                <KeyRound className="w-5 h-5 text-[#176B62]" />
                <h3 className="font-black text-base text-[#202B2A]">
                  Reset Kata Sandi Mandiri
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-[#8E9B98] hover:text-[#202B2A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#687572] mt-2 mb-4 leading-relaxed">
              Setiap petugas ATLM, Koordinator, dan Admin dapat mereset kata sandi masing-masing secara mandiri menggunakan NIP atau Email yang terdaftar di RSUD SMJ I.
            </p>

            {/* Error Message */}
            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDF2F2] border border-[#D9534F]/30 text-[#D9534F] text-xs flex items-start space-x-2 animate-in fade-in font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Success Message */}
            {resetSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-[#EBF7F1] border border-[#21865B]/30 text-[#21865B] text-xs flex items-center space-x-2 animate-in fade-in font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* Step 1: Cari & Verifikasi Identitas Akun */}
            <div className="space-y-3 mb-4">
              <label className="block text-xs font-bold text-[#202B2A]">
                1. Masukkan NIP / Nomor STR atau Email Terdaftar:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={e => {
                    setResetIdentifier(e.target.value);
                    setVerifiedAccount(null);
                  }}
                  placeholder="Contoh: 19890520... atau supriatna.atlm@rsud-smj.go.id"
                  className="flex-1 p-2.5 text-xs bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-[#202B2A] font-semibold focus:bg-white focus:outline-[#176B62]"
                />
                <button
                  type="button"
                  onClick={handleVerifyAccount}
                  className="px-3.5 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verifikasi</span>
                </button>
              </div>
            </div>

            {/* Identity Card Result */}
            {verifiedAccount && (
              <div className="p-3.5 bg-[#E8F4F2] rounded-xl border border-[#176B62]/30 mb-4 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#176B62] tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                    <span>Identitas Terverifikasi:</span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-[#176B62] border border-[#176B62]/20">
                    Peran: {verifiedAccount.user.role}
                  </span>
                </div>
                <div className="font-black text-sm text-[#202B2A]">
                  {verifiedAccount.staff.fullName}
                </div>
                <div className="text-[11px] text-[#687572]">
                  <strong>NIP:</strong> {verifiedAccount.staff.employeeNumber} &bull; <strong>Posisi:</strong> {verifiedAccount.staff.position}
                </div>
                <div className="text-[10px] text-[#176B62] font-mono">
                  Email: {verifiedAccount.user.email}
                </div>
              </div>
            )}

            {/* Step 2: Form Input Kata Sandi Baru */}
            {verifiedAccount && (
              <form onSubmit={handleExecuteResetPassword} className="space-y-3.5 pt-2 border-t border-[#E7EAE4]">
                <div>
                  <label className="block text-xs font-bold text-[#202B2A] mb-1">
                    2. Masukkan Kata Sandi Baru (Minimal 6 Karakter):
                  </label>
                  <div className="relative">
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      value={resetNewPassword}
                      onChange={e => setResetNewPassword(e.target.value)}
                      placeholder="Ketik kata sandi baru..."
                      required
                      minLength={6}
                      className="w-full p-2.5 pr-10 text-xs bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] focus:outline-[#176B62]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E9B98] hover:text-[#202B2A] cursor-pointer"
                    >
                      {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#202B2A] mb-1">
                    3. Ulangi Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru..."
                    required
                    minLength={6}
                    className="w-full p-2.5 text-xs bg-white border border-[#E7EAE4] rounded-xl text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7EAE4]">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <span>Menyimpan Sandi...</span>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Simpan Kata Sandi Baru</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
