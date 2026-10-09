import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  CalendarCheck2,
  ClipboardList,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule' as NavTab, label: 'Jadwal', icon: CalendarDays },
    { id: 'handover' as NavTab, label: 'Serah Terima', icon: ClipboardList },
    { id: 'swap' as NavTab, label: 'Tukar', icon: ArrowLeftRight },
    { id: 'leave' as NavTab, label: 'Cuti', icon: CalendarCheck2 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7EAE4] z-40 pb-safe pt-1">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
                isActive ? 'text-[#176B62]' : 'text-[#8E9B98]'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-[#176B62]/10' : ''}`} />
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
