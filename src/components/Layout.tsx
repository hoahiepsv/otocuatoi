import React from 'react';
import { LogOut, Car, LayoutDashboard, PlusCircle, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { TabType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  title: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  editing: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  title, 
  activeTab, 
  onTabChange,
  editing
}) => {
  const navItems = [
    { id: 'info' as TabType, label: 'Thông tin bảo trì', icon: <LayoutDashboard size={18} /> },
    { id: 'update' as TabType, label: editing ? 'Sửa thông tin' : 'Cập nhật bảo trì', icon: <PlusCircle size={18} /> },
    { id: 'report' as TabType, label: 'Báo cáo', icon: <FileText size={18} /> },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Top Header */}
      <header className="bg-primary text-white h-11 min-h-[44px] px-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-primary font-black text-sm">
            B
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-widest leading-none">{title}</h1>
            <p className="text-[8px] opacity-60 font-medium">Hoà Hiệp AI – 0983.676.470</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-[10px] font-mono text-white/60"></div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-[10px] font-bold border border-white/20 uppercase tracking-tight"
          >
            <LogOut size={12} />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-slate-100 border-r border-slate-200 flex flex-col p-2 shadow-[inset_-1px_0_2px_rgba(0,0,0,0.02)]">
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded text-[11px] font-bold uppercase tracking-tight transition-all",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                {React.cloneElement(item.icon as React.ReactElement, { size: 14 })}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 relative bg-[#F1F5F9]">
          <div className="max-w-full mx-auto space-y-4">
            {children}
          </div>
        </main>
      </div>

      {/* Footer Copyright */}
      <footer className="h-8 min-h-[32px] bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-end">
        <p className="text-[11px] font-medium text-slate-400 italic">
          Create by Hoà Hiệp – 0983.676.470
        </p>
      </footer>
    </div>
  );
};
