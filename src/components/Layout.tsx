import React from 'react';
import { LogOut, LayoutDashboard, PlusCircle, FileText, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { TabType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  onShowReminder: () => void;
  title: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  editing: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  onShowReminder,
  title, 
  activeTab, 
  onTabChange,
  editing
}) => {
  const navItems = [
    { id: 'info' as TabType, label: 'Thông tin', icon: <LayoutDashboard size={18} /> },
    { id: 'update' as TabType, label: editing ? 'Sửa' : 'Cập nhật', icon: <PlusCircle size={18} /> },
    { id: 'report' as TabType, label: 'Lịch sử', icon: <FileText size={18} /> },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Top Header */}
      <header className="bg-primary text-white h-11 min-h-[44px] px-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-primary font-black text-sm shrink-0">
            B
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-widest leading-none truncate max-w-[150px] sm:max-w-none">{title}</h1>
            <p className="text-[8px] opacity-60 font-medium">Hoà Hiệp AI – 0983.676.470</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onShowReminder}
            className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-[10px] font-bold border border-white/20 uppercase tracking-tight text-white"
          >
            <BarChart3 size={12} className="rotate-90" />
            <span>Nhắc nhở</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-[10px] font-bold border border-white/20 uppercase tracking-tight"
          >
            <LogOut size={12} />
            <span className="hidden xs:inline">Thoát</span>
          </button>
        </div>
      </header>

      {/* Horizontal Tabs Navigation */}
      <nav className="bg-white border-b border-slate-200 flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar">
        <div className="flex items-stretch h-12 min-h-[48px] px-2 w-full max-w-7xl mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex-1 min-w-fit px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 transition-all relative whitespace-nowrap",
                activeTab === item.id 
                  ? "text-primary" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "p-1 rounded-md transition-colors",
                activeTab === item.id ? "bg-primary/10" : ""
              )}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
              </div>
              <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-tighter sm:tracking-tight">
                {item.label}
              </span>
              {activeTab === item.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 relative bg-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="h-8 min-h-[32px] bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-center sm:justify-end">
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 italic">
          Create by Hoà Hiệp – 0983.676.470
        </p>
      </footer>
    </div>
  );
};
