import React from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface OverdueAlertProps {
  data: MaintenanceRecord[];
  onClose: () => void;
  isOpen: boolean;
}

export const OverdueAlert: React.FC<OverdueAlertProps> = ({ data, onClose, isOpen }) => {
  // Logic: for each car, find current max ODO. 
  // Then find any record with isDone === false AND nextOdo < currentMaxODO
  
  const plateMaxOdos = data.reduce((acc, curr) => {
    if (!acc[curr.licensePlate] || curr.odo > acc[curr.licensePlate]) {
      acc[curr.licensePlate] = curr.odo;
    }
    return acc;
  }, {} as Record<string, number>);

  const overdueItems = data.filter(item => {
    if (item.isDone) return false;
    const currentMax = plateMaxOdos[item.licensePlate] || 0;
    // Overdue if current ODO of that car is already higher than the next required maintenance ODO
    return item.nextOdo > 0 && item.nextOdo < currentMax;
  });

  if (overdueItems.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
          className="fixed top-16 right-4 z-[100] w-full max-w-[340px]"
        >
          <div className="bg-white rounded-lg shadow-2xl border-l-[6px] border-red-600 overflow-hidden ring-1 ring-black/5">
            <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest">
                <AlertTriangle size={16} className="animate-pulse" />
                <span>CẢNH BÁO ({overdueItems.length})</span>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-bold uppercase"
              >
                Đóng [x]
              </button>
            </div>
            
            <div className="p-0 max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {overdueItems.map(item => (
                <div key={item.id} className="p-3 hover:bg-red-50/50 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-slate-900 text-[13px]">{item.licensePlate}</span>
                    <span className="text-[10px] text-red-600 font-black bg-red-100 px-1.5 py-0.5 rounded leading-none">
                      Quá {formatNumber(plateMaxOdos[item.licensePlate] - item.nextOdo)} Km
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-bold text-slate-700 leading-tight group-hover:text-red-700 transition-colors">
                      {item.category}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium italic">
                      <span>Hạn: {formatNumber(item.nextOdo)} Km</span>
                      <span>•</span>
                      <span>Hiện: {formatNumber(plateMaxOdos[item.licensePlate])} Km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">
                Cần thực hiện bảo trì và cập nhật trạng thái ngay!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
