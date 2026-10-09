import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Database,
  LogOut,
  User,
  Shield,
  Menu,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserAccount, AppNotification } from '../types';
import { labStore } from '../services/store';
import { getStoredSupabaseConfig } from '../services/supabase';
import { LOGO_KAYONG_UTARA } from '../assets/images';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentUser: UserAccount;
  currentTab: NavTab;
  onLogoutClick: () => void;
  onOpenSupabaseModal: () => void;
  onOpenProfileModal: () => void;
  onOpenShiftAlarmModal?: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapseSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onLogoutClick,
  onOpenSupabaseModal,
  onOpenProfileModal,
  onOpenShiftAlarmModal,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Asia/Pontianak (WIB UTC+7)
      const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Pontianak',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(now);

      const timeFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Pontianak',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      setDateStr(dateFormatted);
      setTimeStr(`${timeFormatted} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sync = () => {
      setNotifications(labStore.getNotifications());
      setSupabaseConfig(getStoredSupabaseConfig());
    };
    sync();
    return labStore.subscribe(sync);
  }, []);

  // Sync Supabase connection status periodically
  const [isSyncing, setIsSyncing] = useState(false);
  useEffect(() => {
      const interval = setInterval(() => {
          setIsSyncing(labStore.getIsSyncing());
          setSupabaseConfig(getStoredSupabaseConfig());
      }, 500);
      return () => clearInterval(interval);
  }, []);

  // Filter notif for current user or broadcast
  const myNotifications = notifications.filter(
    n => n.recipientId === 'all' || n.recipientId === currentUser.staffId || n.recipientId === currentUser.uid
  );
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  // User's schedule today for Navbar Quick Alarm Trigger
  const todayDateStr = new Intl.DateTimeFormat('en-CA').format(new Date()); // YYYY-MM-DD
  const userTodaySchedule = labStore.getSchedules().find(
    s => s.staffId === currentUser.staffId && s.date === todayDateStr
  );
  const userTodayShift = userTodaySchedule
    ? labStore.getShifts().find(sh => sh.shiftId === userTodaySchedule.shiftId)
    : null;

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard Operasional', subtitle: 'Pusat pantauan jadwal shift & layanan laboratorium' };
      case 'schedule':
        return { title: 'Jadwal Shift & Kalender', subtitle: 'Penyusunan, rotasi waktu jaga, dan penerbitan roster' };
      case 'swap':
        return { title: 'Permohonan Tukar Shift', subtitle: 'Pengajuan dan persetujuan pertukaran jadwal jaga ATLM' };
      case 'leave':
        return { title: 'Cuti & Izin Petugas', subtitle: 'Administrasi ketidakhadiran, tugas luar, dan cuti tahunan' };
      case 'handover':
        return { title: 'Serah Terima Jaga (Timbang Terima)', subtitle: 'Pencatatan sampel CITO, alat analisa, dan reagen antar shift' };
      case 'handover-history':
        return { title: 'Histori Serah Terima Jaga', subtitle: 'Tabel penelusuran histori tanggal dan shift timbang terima dinas' };
      case 'reports':
        return { title: 'Rekap & Laporan Jam Kerja', subtitle: 'Rekapitulasi beban tugas dan ekspor dokumen PDF & Excel' };
      case 'staff':
        return { title: 'Data Personil ATLM', subtitle: 'Manajemen tenaga laboratorium patologi klinik dan hak akses peran' };
      case 'audit':
        return { title: 'Riwayat Aktivitas & Audit', subtitle: 'Catatan imutabel perubahan sistem dan penugasan shift' };
      case 'settings':
        return { title: 'Pengaturan & Konfigurasi', subtitle: 'Master konfigurasi shift, Supabase, dan identitas rumah sakit' };
      default:
        return { title: 'Laboratorium Patologi Klinik', subtitle: 'Sistem Informasi Manajemen Jadwal & Serah Terima Jaga' };
    }
  };

  const pageInfo = getPageTitle(currentTab);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-[#FFFAD3] text-amber-950 border border-[#F5EEB0] text-[10px] px-2 py-0.5 rounded-md font-bold">ADMIN</span>;
      case 'coordinator':
        return <span className="bg-[#E8F4F2] text-[#176B62] border border-[#176B62]/30 text-[10px] px-2 py-0.5 rounded-md font-bold">KOORDINATOR</span>;
      default:
        return <span className="bg-[#F8F9F7] text-[#687572] border border-[#E7EAE4] text-[10px] px-2 py-0.5 rounded-md font-semibold">ATLM</span>;
    }
  };

  return (
    <header className="bg-white border-b border-[#E7EAE4] sticky top-0 z-30 shadow-[0_2px_12px_rgba(32,43,42,0.03)]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Left: Mobile Toggle, Desktop Collapse, and Breadcrumbs */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile menu trigger */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 text-[#687572] hover:text-[#202B2A] hover:bg-[#F8F9F7] rounded-xl transition-colors"
              title="Buka Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapseSidebar}
              className="hidden lg:flex p-2 text-[#687572] hover:text-[#176B62] hover:bg-[#F8F9F7] rounded-xl transition-colors"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Title */}
            <div>
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#687572]">
                <span>RSUD SMJ I</span>
                <ChevronRight className="w-3 h-3 text-[#8E9B98]" />
                <span className="text-[#176B62] font-semibold">Instalasi Laboratorium Patologi Klinik</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#202B2A] tracking-tight leading-tight">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right: Live Clock, DB Status, Notifications & Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            {/* Live Pontianak (WIB UTC+7) Clock */}
            <div className="hidden md:flex flex-col items-end text-right px-3 py-1 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl">
              <span className="text-[10px] text-[#687572] font-medium">{dateStr}</span>
              <span className="text-xs font-mono font-bold text-[#202B2A] flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#176B62]" />
                <span>{timeStr}</span>
              </span>
            </div>

            {/* Quick Alarm / Pengingat Shift Saya Button */}
            {onOpenShiftAlarmModal && (
              <button
                type="button"
                onClick={onOpenShiftAlarmModal}
                title="Buka Pengingat & Alarm Jadwal Dinas Saya"
                className={`relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-2xs group ${
                  userTodayShift
                    ? 'bg-[#E8F4F2] hover:bg-[#d5ebe7] text-[#176B62] border-[#176B62]/40'
                    : 'bg-[#F8F9F7] hover:bg-[#E7EAE4] text-[#687572] border-[#E7EAE4]'
                }`}
              >
                <div className="relative">
                  <BellRing className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${userTodayShift ? 'text-[#176B62]' : 'text-[#687572]'}`} />
                  {userTodayShift && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-[11px]">
                  {userTodayShift ? `Alarm: ${userTodayShift.name}` : 'Alarm Shift Saya'}
                </span>
                {userTodayShift && (
                  <span className="text-[9px] bg-[#176B62] text-white px-1.5 py-0.2 rounded font-mono font-bold">
                    {userTodayShift.startTime}
                  </span>
                )}
              </button>
            )}

            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Pengaturan Database Supabase"
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all ${
                supabaseConfig.url
                  ? isSyncing ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#FFFAD3] text-amber-950 border-[#F5EEB0] hover:bg-[#FFF5B0]'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${supabaseConfig.url ? (isSyncing ? 'text-amber-700' : 'text-emerald-700') : 'text-amber-800'}`} />
              <span className="hidden xl:inline text-[11px]">
                {supabaseConfig.url ? (isSyncing ? 'Sedang Menyinkronisasi...' : 'Supabase Terhubung') : 'Pusat DB Supabase'}
              </span>
              <span className={`w-2 h-2 rounded-full ${supabaseConfig.url ? (isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse') : 'bg-amber-600'}`} />
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 text-[#687572] hover:text-[#176B62] hover:bg-[#F8F9F7] rounded-xl border border-[#E7EAE4] transition-colors"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-[#D9534F] rounded-full ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_35px_rgba(32,43,42,0.12)] border border-[#E7EAE4] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E7EAE4]">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#202B2A] text-xs uppercase tracking-wider">Pemberitahuan</span>
                      {unreadCount > 0 && (
                        <span className="bg-[#FFFAD3] text-amber-950 font-bold text-[10px] px-2 py-0.2 rounded-full">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => labStore.markAllNotificationsAsRead()}
                        className="text-[11px] text-[#176B62] hover:underline font-semibold"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E7EAE4]/60">
                    {myNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#8E9B98]">
                        Tidak ada pemberitahuan baru
                      </div>
                    ) : (
                      myNotifications.map(notif => (
                        <div
                          key={notif.notificationId}
                          onClick={() => labStore.markNotificationAsRead(notif.notificationId)}
                          className={`p-3.5 text-xs cursor-pointer hover:bg-[#F8F9F7] transition-colors ${
                            !notif.isRead ? 'bg-[#FFFAD3]/25' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-[#202B2A] text-xs">{notif.title}</h4>
                            <span className="text-[10px] text-[#8E9B98] font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#687572] text-[11px] mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center space-x-2.5 p-1.5 sm:px-2.5 rounded-xl border border-[#E7EAE4] hover:bg-[#F8F9F7] transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFFAD3] border border-[#F5EEB0] flex items-center justify-center text-amber-950 font-extrabold text-xs shadow-2xs">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-bold text-[#202B2A] truncate max-w-[130px] group-hover:text-[#176B62] leading-tight">
                    {currentUser.displayName}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8E9B98] hidden sm:block" />
              </button>

              {/* Profile Popover Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_10px_35px_rgba(32,43,42,0.12)] border border-[#E7EAE4] p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                  <div className="p-3 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4] mb-2">
                    <div className="font-bold text-[#202B2A] truncate">{currentUser.displayName}</div>
                    <div className="text-[11px] text-[#687572] truncate">{currentUser.email}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#8E9B98]">Peran:</span>
                      {getRoleBadge(currentUser.role)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenProfileModal();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#202B2A] hover:bg-[#F8F9F7] font-semibold transition-colors"
                  >
                    <User className="w-4 h-4 text-[#176B62]" />
                    <span>Profil Petugas Saya</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSupabaseModal();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#202B2A] hover:bg-[#F8F9F7] font-semibold transition-colors"
                  >
                    <Database className="w-4 h-4 text-[#176B62]" />
                    <span>Integrasi Supabase</span>
                  </button>

                  <div className="border-t border-[#E7EAE4] my-1" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogoutClick();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#D9534F] hover:bg-[#FDF2F2] font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[#D9534F]" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
