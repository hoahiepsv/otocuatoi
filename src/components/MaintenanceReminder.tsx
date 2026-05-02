import React from 'react';
import { Bell, X, Info } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceReminderProps {
  data: MaintenanceRecord[];
  onClose: () => void;
  isOpen: boolean;
}

export const MaintenanceReminder: React.FC<MaintenanceReminderProps> = ({ data, onClose, isOpen }) => {
  const plateMaxOdos = data.reduce((acc, curr) => {
    if (!acc[curr.licensePlate] || curr.odo > acc[curr.licensePlate]) {
      acc[curr.licensePlate] = curr.odo;
    }
    return acc;
  }, {} as Record<string, number>);

  const reminderItems = data.filter(item => {
    if (item.isDone) return false; // Only active tasks
    const currentMax = plateMaxOdos[item.licensePlate] || 0;
    const diff = item.nextOdo - currentMax;
    // Reminder if due within 5000km and not yet overdue (overdue is handled by another component)
    return item.nextOdo > 0 && diff > 0 && diff <= 5000;
  });

  if (reminderItems.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 100, y: 100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: 100 }}
          className="fixed bottom-12 right-4 z-[90] w-full max-w-[320px]"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden ring-1 ring-black/5">
            <div className="px-4 py-3 bg-blue-600 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                <Bell size={16} />
                <span>NHẮC NHỞ ({reminderItems.length})</span>
              </div>
              <button 
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-0 max-h-[300px] overflow-y-auto divide-y divide-slate-50">
              {reminderItems.map(item => {
                const currentMax = plateMaxOdos[item.licensePlate] || 0;
                const balanceKm = item.nextOdo - currentMax;
                
                return (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 text-xs">{item.licensePlate}</span>
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                        Còn {formatNumber(balanceKm)} KM
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 leading-snug">
                      {item.category}: {item.params}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      <span>Kỳ tới:</span>
                      <span className="text-sm font-black text-orange-600">{formatNumber(item.nextOdo)} KM</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <Info size={12} className="text-blue-500 shrink-0" />
              <p className="text-[9px] text-blue-700 font-bold leading-tight">
                Các hạng mục sắp tới hạn bảo trì (dưới 5.000 KM).
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
