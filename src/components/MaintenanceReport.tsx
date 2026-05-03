import React, { useRef, useState } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, toSortableDate } from '../lib/utils';
import { toJpeg } from 'html-to-image';
import { motion } from 'motion/react';

interface MaintenanceReportProps {
  data: MaintenanceRecord[];
  selectedPlate: string;
  onPlateChange: (plate: string) => void;
}

export const MaintenanceReport: React.FC<MaintenanceReportProps> = ({ 
  data, 
  selectedPlate,
  onPlateChange
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [periodType, setPeriodType] = useState<'all' | 'month' | 'year' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const plates = Array.from(new Set(data.map(item => item.licensePlate))).sort();
  
  const years = Array.from(new Set(data.map(item => {
    const sortable = toSortableDate(item.date);
    return sortable ? parseInt(sortable.substring(0, 4)) : null;
  }).filter((y): y is number => y !== null))).sort((a: number, b: number) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  const filteredData = data.filter(item => {
    // Plate filter
    if (selectedPlate !== 'ALL' && item.licensePlate !== selectedPlate) return false;

    // Period filter
    if (periodType === 'all') return true;
    
    const sortable = toSortableDate(item.date);
    if (!sortable || sortable.length < 8) return false;
    
    const y = parseInt(sortable.substring(0, 4));
    const m = parseInt(sortable.substring(4, 6));

    if (periodType === 'month') return m === selectedMonth && y === selectedYear;
    if (periodType === 'year') return y === selectedYear;
    
    if (periodType === 'range') {
      const start = startDate.replace(/-/g, '');
      const end = endDate.replace(/-/g, '');
      return sortable >= start && sortable <= end;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by plate first
    if (a.licensePlate !== b.licensePlate) {
      return a.licensePlate.localeCompare(b.licensePlate);
    }
    
    // Then by date
    return toSortableDate(a.date).localeCompare(toSortableDate(b.date));
  });

  const totalCost = filteredData.reduce((sum, item) => sum + item.unitPrice, 0);
  
  // Calculate KM traveled in period (Max ODO - Min ODO for each car)
  const plateOdos: Record<string, number[]> = {};
  filteredData.forEach(item => {
    if (!plateOdos[item.licensePlate]) plateOdos[item.licensePlate] = [];
    plateOdos[item.licensePlate].push(item.odo);
  });
  
  const totalKm = Object.values(plateOdos).reduce((sum, odos) => {
    if (odos.length > 0) {
      return sum + (Math.max(...odos) - Math.min(...odos));
    }
    return sum;
  }, 0);

  const exportReport = async () => {
    if (reportRef.current === null) return;
    setIsExporting(true);
    try {
      // Use pixelRatio for HD quality and ensure full capture
      const dataUrl = await toJpeg(reportRef.current, { 
        quality: 1, 
        backgroundColor: 'white',
        pixelRatio: 2, // Double density for HD
        skipFonts: false,
      });
      const link = document.createElement('a');
      
      let periodLabel = '';
      if (periodType === 'all') periodLabel = 'ToanBo';
      else if (periodType === 'month') periodLabel = `Thang${selectedMonth}-${selectedYear}`;
      else if (periodType === 'year') periodLabel = `Nam${selectedYear}`;
      else periodLabel = `${startDate}-Den-${endDate}`;

      link.download = `Bao-Tri-${selectedPlate}-${periodLabel}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getPlateColor = (plate: string) => {
    const colors = [
      'text-blue-700', 'text-indigo-700', 'text-violet-700', 
      'text-emerald-700', 'text-teal-700', 'text-cyan-700',
      'text-rose-700', 'text-orange-700', 'text-amber-700'
    ];
    let hash = 0;
    for (let i = 0; i < plate.length; i++) {
      hash = plate.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getPlateBg = (plate: string) => {
    const bgs = [
      'bg-blue-50/30', 'bg-indigo-50/30', 'bg-violet-50/30', 
      'bg-emerald-50/30', 'bg-teal-50/30', 'bg-cyan-50/30',
      'bg-rose-50/30', 'bg-orange-50/30', 'bg-amber-50/30'
    ];
    let hash = 0;
    for (let i = 0; i < plate.length; i++) {
      hash = plate.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgs[Math.abs(hash) % bgs.length];
  };

  return (
    <div className="space-y-4">
      {/* Search & Period Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-app-border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-4 uppercase">
          <div className="flex flex-col gap-1 w-full lg:w-auto">
            <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Chọn xe:</span>
            <select 
              value={selectedPlate}
              onChange={(e) => onPlateChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary text-[12px] font-bold text-primary w-full lg:min-w-[150px]"
            >
              <option value="ALL">TẤT CẢ XE</option>
              {plates.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full lg:w-auto">
            <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Phạm vi:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded w-full">
              {(['all', 'month', 'year', 'range'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPeriodType(type)}
                  className={`flex-1 lg:flex-none px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all ${periodType === type ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  {type === 'all' ? 'Tất' : type === 'month' ? 'Tháng' : type === 'year' ? 'Năm' : 'Khoảng'}
                </button>
              ))}
            </div>
          </div>

          {periodType === 'range' && (
            <>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Từ ngày:</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none text-[12px] font-bold w-full"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Đến ngày:</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none text-[12px] font-bold w-full"
                />
              </div>
            </>
          )}

          {periodType === 'month' && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Tháng:</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none text-[12px] font-bold w-full"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
            </div>
          )}

          {(periodType === 'month' || periodType === 'year') && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-black text-slate-400 tracking-widest pl-1 leading-none">Năm:</span>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none text-[12px] font-bold w-full"
              >
                {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
              </select>
            </div>
          )}

          <div className="lg:ml-auto w-full lg:w-auto pt-2 lg:pt-0">
            <button 
              onClick={exportReport}
              disabled={isExporting}
              className="w-full bg-primary hover:bg-primary-hover text-white font-black py-2 px-6 rounded text-[11px] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 uppercase tracking-widest"
            >
              {isExporting ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Download size={14} /><span>XUẤT JPEG HD</span></>}
            </button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-slate-50 p-2 sm:p-3 rounded border border-slate-100">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Tổng chi phí</p>
            <p className="text-sm sm:text-lg font-black text-slate-900 leading-none">{formatNumber(totalCost)} <span className="text-[8px] sm:text-[10px] font-bold opacity-30">VNĐ</span></p>
          </div>
          <div className="bg-slate-50 p-2 sm:p-3 rounded border border-slate-100">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Quãng đường</p>
            <p className="text-sm sm:text-lg font-black text-orange-600 leading-none">{formatNumber(totalKm)} <span className="text-[8px] sm:text-[10px] font-bold opacity-30">KM</span></p>
          </div>
          <div className="bg-slate-50 p-2 sm:p-3 rounded border border-slate-100">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Số lần</p>
            <p className="text-sm sm:text-lg font-black text-primary leading-none">{filteredData.length} <span className="text-[8px] sm:text-[10px] font-bold opacity-30">LƯỢT</span></p>
          </div>
          <div className="bg-slate-50 p-2 sm:p-3 rounded border border-slate-100">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Trung bình</p>
            <p className="text-sm sm:text-lg font-black text-slate-600 leading-none">{filteredData.length > 0 ? formatNumber(Math.round(totalCost / filteredData.length)) : '0'} <span className="text-[8px] sm:text-[10px] font-bold opacity-30">VNĐ</span></p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/5 p-4 rounded-lg overflow-x-auto border border-app-border">
        {/* Mobile-only List View */}
        <div className="md:hidden space-y-3 mb-4">
          <div className="bg-blue-600 p-3 rounded-t-lg text-white font-black text-xs uppercase tracking-widest text-center shadow-lg">
            DANH SÁCH LỊCH SỬ CHI TIẾT
          </div>
          {filteredData.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 italic text-[11px] rounded-b-lg border border-slate-200">
              Không tìm thấy dữ liệu.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((item, idx) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <span className={`font-black text-xs uppercase ${getPlateColor(item.licensePlate)}`}>{item.licensePlate}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-bold text-slate-800">{item.category}</p>
                    {item.params && <p className="text-[10px] text-slate-400 uppercase font-medium">{item.params}</p>}
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Odo / Kế tiếp</span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {formatNumber(item.odo)} <span className="text-orange-400">→ {item.nextOdo > 0 ? formatNumber(item.nextOdo) : '-'}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Thành tiền</span>
                      <p className="text-sm font-black text-slate-900 leading-none">{formatNumber(item.unitPrice)} đ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-blue-900 p-3 rounded-b-lg text-white flex justify-between items-center shadow-md">
            <span className="text-[10px] font-black uppercase tracking-widest">Tổng cộng:</span>
            <span className="text-sm font-black">{formatNumber(totalCost)} đ</span>
          </div>
          
        </div>

        {/* Printable Area - Pre-optimized for JPG Export */}
        {/* This container ensures the report is always available in DOM for export, but hidden from mobile view */}
        <div className="flex justify-center w-full md:static absolute left-[-9999px] top-0 pointer-events-none md:pointer-events-auto overflow-hidden md:overflow-visible h-0 md:h-auto">
          <div className="scale-[0.35] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 origin-top">
            <div 
              ref={reportRef}
              className="bg-white w-[1100px] min-h-[1400px] p-12 shadow-2xl relative flex flex-col items-center border-[12px] border-slate-100 overflow-hidden"
              style={{ fontFamily: "'Times New Roman', serif" }}
            >
          {/* Top Header Decor */}
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-900"></div>

          <div className="w-full flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
             <div className="text-left space-y-1">
                <p className="font-black text-2xl leading-none text-blue-900 uppercase tracking-tighter">XE HÒA HIỆP</p>
                <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
                <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase">Hệ thống quản lý bảo trì phương tiện</p>
                <p className="text-[10px] text-slate-400 font-medium">Địa chỉ: Thành phố Hồ Chí Minh • Hotline: 0983.676.470</p>
             </div>
             <div className="text-right flex flex-col items-end">
             </div>
          </div>

          <div className="w-full mb-8">
            <h1 className="text-3xl font-black text-slate-900 uppercase text-center mb-1 tracking-[0.15em]">
              LỊCH SỬ BẢO DƯỠNG
            </h1>
            <div className="text-center font-bold text-blue-600 text-sm uppercase tracking-widest">
               {selectedPlate === 'ALL' ? 'TẤT CẢ PHƯƠNG TIỆN' : <span className="text-xl font-black">{selectedPlate}</span>}
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex flex-col items-center px-6 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giai đoạn</span>
                <span className="text-xs font-black text-slate-700">
                  {periodType === 'all' ? 'Toàn bộ thời gian' : 
                   periodType === 'month' ? `Tháng ${selectedMonth}/${selectedYear}` : 
                   periodType === 'year' ? `Năm ${selectedYear}` :
                   `Từ ${startDate.split('-').reverse().join('/')} đến ${endDate.split('-').reverse().join('/')}`}
                </span>
              </div>
              <div className="flex flex-col items-center px-6 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày lập</span>
                <span className="text-xs font-black text-slate-700">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex flex-col items-center px-6 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số lượt</span>
                <span className="text-xs font-black text-primary">{filteredData.length}</span>
              </div>
              <div className="flex flex-col items-center px-6 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng chi phí</span>
                <span className="text-xs font-black text-emerald-600">{formatNumber(totalCost)} đ</span>
              </div>
              <div className="flex flex-col items-center px-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quãng đường</span>
                <span className="text-xs font-black text-orange-600">{formatNumber(totalKm)} KM</span>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-200 text-[13px] shadow-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border border-blue-900 p-4 text-center w-12 font-bold uppercase text-[11px] tracking-widest">STT</th>
                <th className="border border-blue-900 p-4 text-left font-bold uppercase text-[11px] tracking-widest">Số Xe</th>
                <th className="border border-blue-900 p-4 text-center font-bold uppercase text-[11px] tracking-widest">Ngày</th>
                <th className="border border-blue-900 p-4 text-left font-bold uppercase text-[11px] tracking-widest">Nội dung / Thông số</th>
                <th className="border border-blue-900 p-4 text-right font-bold uppercase text-[11px] tracking-widest">Odo (KM)</th>
                <th className="border border-blue-900 p-4 text-right font-bold uppercase text-[11px] tracking-widest">Kế tiếp</th>
                <th className="border border-blue-900 p-4 text-right font-bold uppercase text-[11px] tracking-widest">Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-200 p-12 text-center text-slate-400 italic font-medium">Không tìm thấy dữ liệu phát sinh trong kỳ báo cáo.</td>
                </tr>
              ) : filteredData.map((item, idx) => {
                const isNewGroup = idx === 0 || item.licensePlate !== filteredData[idx - 1].licensePlate;
                const plateColor = getPlateColor(item.licensePlate);
                const plateBg = getPlateBg(item.licensePlate);
                
                return (
                  <tr 
                    key={item.id} 
                    className={`
                      group 
                      ${isNewGroup && idx !== 0 ? 'border-t-2 border-slate-400' : 'border-t border-slate-200'}
                      ${isNewGroup ? plateBg : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/10')}
                    `}
                  >
                    <td className="border-x border-slate-200 p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className={`border-x border-slate-200 p-3 font-black uppercase text-center ${plateColor}`}>{item.licensePlate}</td>
                    <td className="border-x border-slate-200 p-3 text-slate-600 font-medium text-center">{item.date}</td>
                    <td className="border-x border-slate-200 p-3">
                      <div className="font-bold text-slate-800">{item.category}</div>
                      {item.params && <div className="text-[10px] text-slate-400 uppercase font-medium">{item.params}</div>}
                    </td>
                    <td className="border-x border-slate-200 p-3 text-right font-mono font-bold text-slate-500">{formatNumber(item.odo)}</td>
                    <td className="border-x border-slate-200 p-3 text-right font-mono font-bold text-orange-400">
                      {item.nextOdo > 0 ? formatNumber(item.nextOdo) : '-'}
                    </td>
                    <td className="border-x border-slate-200 p-3 text-right font-black text-slate-900">{formatNumber(item.unitPrice)}</td>
                  </tr>
                );
              })}
              <tr className="bg-blue-900 text-white">
                <td colSpan={6} className="p-4 text-right uppercase font-black tracking-widest text-[11px] border-none">Tổng chi phí vận hành (VNĐ)</td>
                <td className="p-4 text-right text-[18px] font-black border-none">{formatNumber(totalCost)}</td>
              </tr>
            </tbody>
          </table>

          <div className="w-full flex justify-between mt-16 px-10">
             <div className="text-center flex flex-col items-center">
                <p className="font-bold text-[13px] text-slate-400 uppercase tracking-widest mb-24">Người lập biểu</p>
                <div className="h-0.5 w-32 bg-slate-100 mb-2"></div>
             </div>
             <div className="text-center flex flex-col items-center">
                <p className="text-[12px] font-bold text-slate-400 mb-2">TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                <div className="mb-24"></div>
                <div className="h-0.5 w-40 bg-blue-900 mb-2"></div>
             </div>
          </div>
          
          <div className="mt-auto w-full pt-12 text-center">
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-blue-300 uppercase tracking-[0.5em] mb-2">
                <span>Trí Tuệ Nhân Tạo</span>
                <div className="w-1.5 h-1.5 bg-blue-200 rounded-full"></div>
                <span>Hoà Hiệp AI</span>
              </div>
              <p className="text-[8px] text-slate-300 font-medium italic">Báo cáo được trích xuất trực tiếp từ Cloud Database vào lúc {new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
);
};
