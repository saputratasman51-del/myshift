import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  CalendarCheck2,
  ClipboardList,
  FileSpreadsheet,
  Users2,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  Shield,
} from 'lucide-react';
import { Role, UserAccount } from '../types';
import { labStore } from '../services/store';
import { LOGO_KAYONG_UTARA } from '../assets/images';

export type NavTab =
  | 'dashboard'
  | 'schedule'
  | 'swap'
  | 'leave'
  | 'handover'
  | 'handover-history'
  | 'reports'
  | 'staff'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserAccount;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const role = currentUser.role;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'schedule' as NavTab,
      label: 'Jadwal & Kalender',
      icon: CalendarDays,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'swap' as NavTab,
      label: 'Tukar Shift',
      icon: ArrowLeftRight,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'leave' as NavTab,
      label: 'Cuti & Izin',
      icon: CalendarCheck2,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'handover' as NavTab,
      label: 'Serah Terima Jaga',
      icon: ClipboardList,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'handover-history' as NavTab,
      label: 'Histori Serah Terima',
      icon: History,
      roles: ['admin', 'coordinator', 'staff'],
    },
    {
      id: 'reports' as NavTab,
      label: 'Rekap & Laporan',
      icon: FileSpreadsheet,
      roles: ['admin', 'coordinator'],
    },
    {
      id: 'staff' as NavTab,
      label: 'Data Petugas ATLM',
      icon: Users2,
      roles: ['admin', 'coordinator'],
    },
    {
      id: 'audit' as NavTab,
      label: 'Riwayat Audit Log',
      icon: History,
      roles: ['admin', 'coordinator'],
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan Sistem',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const allowedNavs = navItems.filter(item => item.roles.includes(role));

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-[#E7EAE4] select-none">
      {/* Brand & Organization Header */}
      <div className="p-4 border-b border-[#E7EAE4] flex items-center justify-between bg-[#F8F9F7]/70">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 p-0.5 rounded-xl bg-white border border-[#E7EAE4] shadow-xs flex items-center justify-center shrink-0 ring-1 ring-[#FFFAD3]/90">
            <img
              src={LOGO_KAYONG_UTARA}
              alt="Logo Kabupaten Kayong Utara"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] truncate leading-tight">
                Instalasi Lab Patologi Klinik
              </div>
              <div className="text-xs font-bold text-[#202B2A] truncate leading-tight mt-0.5">
                RSUD SMJ I Kayong Utara
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-[#687572] hover:text-[#202B2A] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-[#8E9B98] uppercase px-3 py-1 tracking-wider">
            Menu Operasional
          </div>
        )}

        {allowedNavs.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2.5'
              } rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-[#FFFAD3] text-[#202B2A] shadow-xs'
                  : 'text-[#687572] hover:bg-[#F8F9F7] hover:text-[#202B2A]'
              }`}
            >
              {/* Active Teal Bar Indicator on the left */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#176B62] rounded-r-md" />
              )}

              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  isActive ? 'text-[#176B62]' : 'text-[#687572] group-hover:text-[#176B62]'
                }`}
              />

              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Personnel Status Bar */}
      <div className="p-3 border-t border-[#E7EAE4] bg-[#F8F9F7]/90">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#176B62] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="text-xs font-bold text-[#202B2A] truncate">
                {currentUser.displayName}
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser.role === 'admin' ? 'bg-amber-500' : currentUser.role === 'coordinator' ? 'bg-teal-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-[#687572] uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'coordinator' ? 'Koordinator' : 'ATLM Pelaksana'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 bg-white border border-[#E7EAE4] rounded-lg text-[#176B62] hover:bg-[#F8F9F7] cursor-pointer transition-colors"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-[#202B2A]/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
