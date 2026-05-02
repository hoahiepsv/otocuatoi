import React from 'react';
import { Edit2, CheckCircle2, XCircle, Search, AlertTriangle, Download } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, cn, toSortableDate } from '../lib/utils';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';

interface MaintenanceTableProps {
  data: MaintenanceRecord[];
  onEdit: (record: MaintenanceRecord) => void;
  selectedPlate: string;
  onPlateChange: (plate: string) => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({ 
  data, 
  onEdit, 
  selectedPlate, 
  onPlateChange 
}) => {
  const plates = Array.from(new Set(data.map(item => item.licensePlate))).sort();
  
  const filteredData = (selectedPlate === 'ALL' 
    ? data 
    : data.filter(item => item.licensePlate === selectedPlate)
  ).sort((a, b) => {
    // Sort by plate first
    if (a.licensePlate !== b.licensePlate) {
      return a.licensePlate.localeCompare(b.licensePlate);
    }
    
    // Then by date using sortable format
    return toSortableDate(a.date).localeCompare(toSortableDate(b.date));
  });

  const plateMaxOdos = data.reduce((acc, curr) => {
    if (!acc[curr.licensePlate] || curr.odo > acc[curr.licensePlate]) {
      acc[curr.licensePlate] = curr.odo;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      'SỐ XE': item.licensePlate,
      'NGÀY THÁNG NĂM': item.date,
      'HẠNG MỤC': item.category,
      'THÔNG SỐ': item.params,
      'SỐ KM (ODO)': item.odo,
      'ODO TIẾP THEO': item.nextOdo,
      'ĐƠN GIÁ': item.unitPrice,
      'ĐÃ THỰC HIỆN': item.isDone ? 'x' : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance_Data");
    
    // Get current date for filename
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    XLSX.writeFile(workbook, `Backup_BaoTri_${dateStr}.xlsx`);
  };

  const getPlateColor = (plate: string) => {
    const colors = [
      'text-blue-600', 'text-indigo-600', 'text-violet-600', 
      'text-emerald-600', 'text-teal-600', 'text-cyan-600',
      'text-rose-600', 'text-orange-600', 'text-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < plate.length; i++) {
      hash = plate.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getPlateBg = (plate: string) => {
    const bgs = [
      'bg-blue-50/20', 'bg-indigo-50/20', 'bg-violet-50/20', 
      'bg-emerald-50/20', 'bg-teal-50/20', 'bg-cyan-50/20',
      'bg-rose-50/20', 'bg-orange-50/20', 'bg-amber-50/20'
    ];
    let hash = 0;
    for (let i = 0; i < plate.length; i++) {
      hash = plate.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgs[Math.abs(hash) % bgs.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-app-border shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase ml-2 tracking-wider">CHỌN BIỂN SỐ XE:</span>
          <select 
            value={selectedPlate}
            onChange={(e) => onPlateChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary text-sm font-bold text-primary min-w-[200px] flex-1 sm:flex-none"
          >
            <option value="ALL">TẤT CẢ XE</option>
            {plates.map(plate => (
              <option key={plate} value={plate}>{plate}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-[11px] font-bold uppercase transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
        >
          <Download size={14} />
          Sao lưu Database (Excel)
        </button>
      </div>

      <div className="bg-white rounded-lg border border-app-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-app-border">
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Số xe</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Ngày</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Hạng mục</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px]">Thông số</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right">Odo</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right">Kỳ tới</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right">Đơn giá</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-center">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic text-[11px]">
                    Không có dữ liệu hiển thị.
                  </td>
                </tr>
              ) : (
                filteredData.map((record, index) => {
                  const isOverdue = !record.isDone && record.nextOdo > 0 && record.nextOdo < (plateMaxOdos[record.licensePlate] || 0);
                  const isNewGroup = index === 0 || record.licensePlate !== filteredData[index - 1].licensePlate;
                  const plateColor = getPlateColor(record.licensePlate);
                  const plateBg = getPlateBg(record.licensePlate);

                  return (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "hover:bg-blue-50/30 transition-colors group",
                        isOverdue && "bg-red-50/30",
                        isNewGroup && index !== 0 && "border-t-2 border-slate-300",
                        isNewGroup && plateBg
                      )}
                    >
                      <td className={cn("px-3 py-1.5 font-black text-[12px]", plateColor)}>{record.licensePlate}</td>

                      <td className="px-3 py-1.5 text-slate-500 text-[11px] font-medium">{record.date}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-700 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                          {record.category}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-slate-400 text-[11px] truncate max-w-[150px]">{record.params}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium text-slate-600 text-[12px]">{formatNumber(record.odo)}</td>
                      <td className={cn(
                        "px-3 py-1.5 text-right font-mono font-bold text-[12px]",
                        record.nextOdo > 0 
                          ? (isOverdue ? "text-red-600" : "text-orange-600") 
                          : "text-slate-300 font-normal"
                      )}>
                        {record.nextOdo > 0 ? formatNumber(record.nextOdo) : "-"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-800 text-[12px]">{formatNumber(record.unitPrice)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex justify-center">
                          {record.isDone ? (
                            <span className="bg-green-100/50 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border border-green-200">Xong</span>
                          ) : (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border",
                              isOverdue ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-400 border-slate-200"
                            )}>
                              {isOverdue ? 'Quá hạn' : 'Chờ'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button 
                          onClick={() => onEdit(record)}
                          className="px-2 py-0.5 text-primary border border-primary/30 hover:bg-primary hover:text-white rounded-[2px] text-[10px] font-bold transition-all opacity-40 group-hover:opacity-100"
                        >
                          SỬA
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
