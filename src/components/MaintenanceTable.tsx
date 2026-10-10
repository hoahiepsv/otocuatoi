import React, { useState } from 'react';
import { Edit2, CheckCircle2, XCircle, Search, AlertTriangle, Download, FileImage, CheckSquare, Square, Check, Loader2, X } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, cn, toSortableDate, removeVietnameseTones } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { RepairProposalModal } from './RepairProposalModal';

interface MaintenanceTableProps {
  data: MaintenanceRecord[];
  onEdit: (record: MaintenanceRecord) => void;
  onUpdateStatus?: (record: MaintenanceRecord, isDone: boolean) => Promise<void>;
  selectedPlate: string;
  onPlateChange: (plate: string) => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({ 
  data, 
  onEdit, 
  onUpdateStatus,
  selectedPlate, 
  onPlateChange 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof MaintenanceRecord | 'status'; direction: 'asc' | 'desc' } | null>({
    key: 'date',
    direction: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [statusConfirmRecord, setStatusConfirmRecord] = useState<{ record: MaintenanceRecord; newStatus: boolean } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirmStatusChange = async () => {
    if (!statusConfirmRecord || !onUpdateStatus) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(statusConfirmRecord.record, statusConfirmRecord.newStatus);
      setStatusConfirmRecord(null);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const plates = Array.from(new Set(data.map(item => item.licensePlate))).sort();
  
  const handleSort = (key: keyof MaintenanceRecord | 'status') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else if (key === 'licensePlate' || key === 'category') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = data
    .filter(item => {
      // Filter by selectedPlate
      if (selectedPlate !== 'ALL' && item.licensePlate !== selectedPlate) {
        return false;
      }

      // Filter by search query (không phân biệt hoa thường, dấu tiếng Việt)
      if (searchQuery.trim()) {
        const queryNorm = removeVietnameseTones(searchQuery.trim());
        const queryWords = queryNorm.split(/\s+/).filter(Boolean);
        const searchableText = removeVietnameseTones([
          item.licensePlate || '',
          item.category || '',
          item.params || '',
          item.date || '',
          item.odo ? item.odo.toString() : '',
          item.nextOdo ? item.nextOdo.toString() : '',
          item.unitPrice ? item.unitPrice.toString() : '',
          item.isDone ? 'xong da thuc hien' : 'cho qua han'
        ].join(' '));

        return queryWords.every(word => searchableText.includes(word));
      }

      return true;
    })
    .sort((a, b) => {
    if (sortConfig) {
      const { key, direction } = sortConfig;
      let valA: any = a[key as keyof MaintenanceRecord];
      let valB: any = b[key as keyof MaintenanceRecord];

      if (key === 'status') {
        valA = a.isDone ? 1 : 0;
        valB = b.isDone ? 1 : 0;
      }

      if (key === 'date') {
        valA = toSortableDate(a.date);
        valB = toSortableDate(b.date);
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      
      // Tie-breaker: date descending (gần nhất - cũ), then id descending
      const dateCmp = toSortableDate(b.date).localeCompare(toSortableDate(a.date));
      if (dateCmp !== 0) return dateCmp;
      return b.id - a.id;
    }

    // Default Sort: Gần nhất - cũ (date descending)
    const dateCmp = toSortableDate(b.date).localeCompare(toSortableDate(a.date));
    if (dateCmp !== 0) return dateCmp;
    return b.id - a.id;
  });

  const plateMaxOdos = data.reduce((acc, curr) => {
    if (!acc[curr.licensePlate] || curr.odo > acc[curr.licensePlate]) {
      acc[curr.licensePlate] = curr.odo;
    }
    return acc;
  }, {} as Record<string, number>);

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllFilteredSelected = filteredData.length > 0 && filteredData.every(r => selectedIds.has(r.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredData.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredData.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const selectedRecords = data.filter(r => selectedIds.has(r.id));

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
      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-app-border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider whitespace-nowrap">CHỌN XE:</span>
            <select 
              value={selectedPlate}
              onChange={(e) => onPlateChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary text-sm font-bold text-primary min-w-[150px]"
            >
              <option value="ALL">TẤT CẢ XE</option>
              {plates.map(plate => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Khung tìm kiếm (không có ghi chú trong khung, không phân biệt hoa thường/dấu) */}
          <div className="relative flex items-center flex-1 min-w-[180px] max-w-sm">
            <Search size={15} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-800 font-medium outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Proposal Export Button */}
          <button
            onClick={() => setShowProposalModal(true)}
            disabled={selectedIds.size === 0}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-md text-[11px] font-bold uppercase transition-all shadow-sm active:scale-95",
              selectedIds.size > 0 
                ? "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/30" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            )}
            title={selectedIds.size === 0 ? "Hãy tích chọn ít nhất 1 hạng mục bên dưới" : "Xuất phiếu đề nghị sửa chữa dạng hình ảnh"}
          >
            <FileImage size={15} />
            <span>Xuất phiếu đề nghị ({selectedIds.size})</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-md text-[11px] font-bold uppercase transition-all shadow-sm active:scale-95"
          >
            <Download size={14} />
            <span>Sao lưu Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-app-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-app-border">
                {/* Checkbox column */}
                <th className="px-3 py-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    title="Chọn / Bỏ chọn tất cả"
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                </th>
                <th 
                  onClick={() => handleSort('licensePlate')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Số xe {sortConfig?.key === 'licensePlate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('date')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Ngày {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Hạng mục {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('params')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Thông số {sortConfig?.key === 'params' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('odo')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Odo {sortConfig?.key === 'odo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('nextOdo')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Kỳ tới {sortConfig?.key === 'nextOdo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('unitPrice')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Đơn giá {sortConfig?.key === 'unitPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('id')}
                  className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter text-[10px] text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Xử lý {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 italic text-[11px]">
                    Không có dữ liệu hiển thị.
                  </td>
                </tr>
              ) : (
                filteredData.map((record, index) => {
                  const isOverdue = !record.isDone && record.nextOdo > 0 && record.nextOdo < (plateMaxOdos[record.licensePlate] || 0);
                  const isNewGroup = index === 0 || record.licensePlate !== filteredData[index - 1].licensePlate;
                  const plateColor = getPlateColor(record.licensePlate);
                  const plateBg = getPlateBg(record.licensePlate);
                  const isChecked = selectedIds.has(record.id);

                  return (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "hover:bg-blue-50/30 transition-colors group",
                        isChecked && "bg-blue-50/25",
                        isOverdue && !isChecked && "bg-red-50/30",
                        isNewGroup && index !== 0 && "border-t-2 border-slate-300",
                        isNewGroup && plateBg
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(record.id)}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className={cn("px-3 py-1.5 font-black text-[12px]", plateColor)}>{record.licensePlate}</td>

                      <td className="px-3 py-1.5 text-slate-500 text-[11px] font-medium">{record.date}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-700 text-[12px]">
                        <div className="flex items-start gap-1.5 py-0.5">
                          {isOverdue && <AlertTriangle size={12} className="text-red-500 animate-pulse mt-0.5 shrink-0" />}
                          <span className="whitespace-pre-line leading-relaxed">{record.category}</span>
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
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateStatus) {
                                  setStatusConfirmRecord({ record, newStatus: false });
                                }
                              }}
                              title="Bấm để chuyển lại trạng thái Chưa xong"
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border border-green-300 transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                              ✓ Xong
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateStatus) {
                                  setStatusConfirmRecord({ record, newStatus: true });
                                }
                              }}
                              title="Bấm để đánh dấu đã hoàn thành (Xong)"
                              className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border transition-all active:scale-95 cursor-pointer shadow-xs hover:ring-2 hover:ring-blue-400/50",
                                isOverdue 
                                  ? "bg-red-100 hover:bg-red-200 text-red-700 border-red-300 hover:text-red-900" 
                                  : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 hover:text-amber-900"
                              )}
                            >
                              {isOverdue ? 'Quá hạn' : 'Chờ'}
                            </button>
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

      {/* Status Confirmation Modal */}
      <AnimatePresence>
        {statusConfirmRecord && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-2 rounded-xl text-white font-bold",
                    statusConfirmRecord.newStatus ? "bg-emerald-600" : "bg-amber-600"
                  )}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide">
                      Xác nhận đổi trạng thái
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Xe: <strong className="text-white">{statusConfirmRecord.record.licensePlate}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Hạng mục bảo trì:</span>
                    <span className="font-bold text-slate-800 text-right max-w-[220px] truncate">{statusConfirmRecord.record.category}</span>
                  </div>
                  {statusConfirmRecord.record.params && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Thông số:</span>
                      <span className="font-medium text-slate-700">{statusConfirmRecord.record.params}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-500">
                    <span>ODO bảo trì:</span>
                    <span className="font-mono font-bold text-slate-700">{formatNumber(statusConfirmRecord.record.odo)} KM</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-600">Trạng thái mới:</span>
                    {statusConfirmRecord.newStatus ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black text-[11px] uppercase border border-emerald-300">
                        ✓ Xong (Đã thực hiện)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black text-[11px] uppercase border border-amber-300">
                        Chờ thực hiện
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  Bạn có chắc chắn muốn cập nhật trạng thái này và lưu trực tiếp vào cơ sở dữ liệu không?
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStatusConfirmRecord(null)}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "px-5 py-2 rounded-xl text-white font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50",
                      statusConfirmRecord.newStatus 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Xác nhận & Lưu data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repair Proposal Modal */}
      {showProposalModal && (
        <RepairProposalModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          records={selectedRecords}
          currentPlateOdos={plateMaxOdos}
        />
      )}
    </div>
  );
};
