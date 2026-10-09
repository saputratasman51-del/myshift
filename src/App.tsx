/**
 * SISTEM INFORMASI SHIFT JAGA INSTALASI LABORATORIUM PATOLOGI KLINIK
 * RSUD SULTAN MUHAMMAD JAMALUDIN I KAYONG UTARA
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { ShiftSwapView } from './components/ShiftSwapView';
import { LeaveManagementView } from './components/LeaveManagementView';
import { HandoverView } from './components/HandoverView';
import { HandoverHistoryView } from './components/HandoverHistoryView';
import { ReportsView } from './components/ReportsView';
import { StaffManagementView } from './components/StaffManagementView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { ConflictModal } from './components/ConflictModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ShiftAlarmReminderModal } from './components/ShiftAlarmReminderModal';
import { labStore } from './services/store';
import { detectScheduleConflicts } from './services/conflictDetector';
import { UserAccount, Staff } from './types';
import { AlertCircle, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(labStore.getCurrentUser());
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(labStore.getCurrentStaff());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShiftAlarmModal, setShowShiftAlarmModal] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rsud_smj_auto_shift_alarm');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Automatically trigger alarm modal when user is detected/switched on app open
  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem('rsud_smj_auto_shift_alarm');
        if (saved === null || JSON.parse(saved) === true) {
          setShowShiftAlarmModal(true);
        }
      } catch {
        setShowShiftAlarmModal(true);
      }
    }
  }, [currentUser?.uid]);

  // Subscribe to labStore changes
  useEffect(() => {
    const sync = () => {
      setCurrentUser(labStore.getCurrentUser());
      setCurrentStaff(labStore.getCurrentStaff());
    };
    return labStore.subscribe(sync);
  }, []);

  // Compute live conflicts using the Conflict Detection Engine
  const conflicts = useMemo(() => {
    const schedules = labStore.getSchedules();
    const shifts = labStore.getShifts();
    const staff = labStore.getStaff();
    const leaves = labStore.getLeaves();
    return detectScheduleConflicts(schedules, shifts, staff, leaves);
  }, [currentUser, currentTab]);

  // Handle Logout Confirmation
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    labStore.logout();
  };

  // If user is not logged in, show individual login screen
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setCurrentUser(labStore.getCurrentUser());
          setCurrentStaff(labStore.getCurrentStaff());
          setShowShiftAlarmModal(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9F7] flex flex-col font-sans text-[#202B2A]">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenShiftAlarmModal={() => setShowShiftAlarmModal(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapseSidebar={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
              onOpenConflictModal={() => setShowConflictModal(true)}
              onOpenShiftAlarmModal={() => setShowShiftAlarmModal(true)}
              conflicts={conflicts}
            />
          )}

          {currentTab === 'schedule' && (
            <ScheduleView
              currentUser={currentUser}
              onOpenConflictModal={() => setShowConflictModal(true)}
              conflicts={conflicts}
            />
          )}

          {currentTab === 'swap' && <ShiftSwapView currentUser={currentUser} />}

          {currentTab === 'leave' && <LeaveManagementView currentUser={currentUser} />}

          {currentTab === 'handover' && <HandoverView currentUser={currentUser} />}

          {currentTab === 'handover-history' && (
            <HandoverHistoryView
              currentUser={currentUser}
              onCreateNew={() => setCurrentTab('handover')}
            />
          )}

          {currentTab === 'reports' && <ReportsView currentUser={currentUser} />}

          {currentTab === 'staff' && <StaffManagementView currentUser={currentUser} />}

          {currentTab === 'audit' && <AuditLogView currentUser={currentUser} />}

          {currentTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-sm w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#D9534F] flex items-center justify-center mx-auto mb-4 border border-rose-100 ring-2 ring-[#FFFAD3]/70">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-base text-[#202B2A] mb-1">
              Konfirmasi Keluar Sesi
            </h3>
            <p className="text-center text-xs text-[#687572] mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-[#202B2A]">{currentUser.displayName}</strong>? Sesi aktif Anda akan diakhiri demi keamanan data rumah sakit.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-[#F8F9F7] hover:bg-[#E7EAE4] text-[#687572] hover:text-[#202B2A] text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-[#E7EAE4]"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-[#D9534F] hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && (
        <ConflictModal
          conflicts={conflicts}
          onClose={() => setShowConflictModal(false)}
        />
      )}

      {/* Supabase Integration Modal */}
      {showSupabaseModal && (
        <SupabaseSettingsModal onClose={() => setShowSupabaseModal(false)} />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          currentUser={currentUser}
          currentStaff={currentStaff}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Auto Shift Alarm & Schedule Reminder Modal */}
      {showShiftAlarmModal && currentUser && (
        <ShiftAlarmReminderModal
          isOpen={showShiftAlarmModal}
          onClose={() => setShowShiftAlarmModal(false)}
          currentUser={currentUser}
          currentStaff={currentStaff}
          onNavigateTab={setCurrentTab}
        />
      )}
    </div>
  );
}
