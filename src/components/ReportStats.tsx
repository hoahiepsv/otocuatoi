import React, { useState, useMemo } from 'react';
import { MaintenanceRecord } from '../types';
import { formatNumber } from '../lib/utils';
import { BarChart3, TrendingUp, DollarSign, Calendar, Filter, PieChart } from 'lucide-react';

interface ReportStatsProps {
  data: MaintenanceRecord[];
}

type PeriodType = 'month' | 'year' | 'all';

export const ReportStats: React.FC<ReportStatsProps> = ({ data }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    data.forEach(item => {
      // Assuming date format is DD/MM/YYYY
      const parts = item.date.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[2]);
        if (!isNaN(year)) uniqueYears.add(year);
      }
    });
    const currentYear = new Date().getFullYear();
    uniqueYears.add(currentYear);
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [data]);

  const stats = useMemo(() => {
    const filtered = data.filter(item => {
      const parts = item.date.split('/');
      if (parts.length !== 3) return false;
      
      const m = parseInt(parts[1]);
      const y = parseInt(parts[2]);

      if (periodType === 'month') {
        return m === selectedMonth && y === selectedYear;
      } else if (periodType === 'year') {
        return y === selectedYear;
      }
      return true;
    });

    const totalCost = filtered.reduce((sum, item) => sum + item.unitPrice, 0);
    const count = filtered.length;
    
    // Calculate total KM: Max ODO - Min ODO for each plate in the period
    const plateGroups: Record<string, number[]> = {};
    filtered.forEach(item => {
      if (!plateGroups[item.licensePlate]) plateGroups[item.licensePlate] = [];
      plateGroups[item.licensePlate].push(item.odo);
    });

    let totalKm = 0;
    Object.values(plateGroups).forEach(odos => {
      if (odos.length > 0) {
        const max = Math.max(...odos);
        const min = Math.min(...odos);
        totalKm += (max - min);
      }
    });

    // Breakdown by plate
    const plateBreakdown = Object.entries(plateGroups).map(([plate, odos]) => {
      const plateRecords = filtered.filter(r => r.licensePlate === plate);
      const cost = plateRecords.reduce((sum, r) => sum + r.unitPrice, 0);
      const max = Math.max(...odos);
      const min = Math.min(...odos);
      return {
        plate,
        cost,
        km: max - min,
        jobs: plateRecords.length
      };
    }).sort((a, b) => b.cost - a.cost);

    return {
      totalCost,
      totalKm,
      count,
      plateBreakdown,
      filtered
    };
  }, [data, periodType, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md">
          <button 
            onClick={() => setPeriodType('month')}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${periodType === 'month' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Tháng
          </button>
          <button 
            onClick={() => setPeriodType('year')}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${periodType === 'year' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Năm
          </button>
          <button 
            onClick={() => setPeriodType('all')}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${periodType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Toàn bộ
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {periodType === 'month' && (
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] font-bold outline-none focus:ring-1 focus:ring-primary"
            >
              {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
          )}
          
          {(periodType === 'month' || periodType === 'year') && (
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] font-bold outline-none focus:ring-1 focus:ring-primary"
            >
              {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-primary border border-blue-100 rounded">
            <Filter size={14} />
            <span className="text-[11px] font-black uppercase">Bộ lọc báo cáo</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform text-primary">
            <DollarSign size={100} />
          </div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-blue-100 text-primary rounded-lg">
                <DollarSign size={20} />
             </div>
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tổng chi phí</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">
            {formatNumber(stats.totalCost)} <span className="text-xs font-normal text-slate-400">VNĐ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform text-orange-500">
            <TrendingUp size={100} />
          </div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <TrendingUp size={20} />
             </div>
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Số KM vận hành</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">
            {formatNumber(stats.totalKm)} <span className="text-xs font-normal text-slate-400">KM</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:border-green-500/30 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform text-green-500">
            <BarChart3 size={100} />
          </div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <BarChart3 size={20} />
             </div>
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Số lần bảo trì</span>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-none">
            {stats.count} <span className="text-xs font-normal text-slate-400">Lượt</span>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[12px] font-black uppercase text-slate-800 flex items-center gap-2 tracking-widest">
            <PieChart size={16} className="text-primary" />
            Chi tiết theo biển số xe
          </h3>
          <div className="text-[10px] text-slate-400 font-bold uppercase italic">Dựa trên dữ liệu đã lọc</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-tighter">Biển số</th>
                <th className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-tighter text-right">Chi phí (VNĐ)</th>
                <th className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-tighter text-right">Vận hành (KM)</th>
                <th className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-tighter text-center">Tần suất</th>
                <th className="px-5 py-3 text-[10px] uppercase font-black text-slate-400 tracking-tighter w-1/3">Tỷ lệ chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.plateBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 italic text-sm">Không có dữ liệu trong thời gian này.</td>
                </tr>
              ) : stats.plateBreakdown.map((item) => (
                <tr key={item.plate} className="hover:bg-slate-50 shadow-inner group transition-colors">
                  <td className="px-5 py-4 font-black text-primary text-[13px]">{item.plate}</td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-slate-700 text-[13px]">{formatNumber(item.cost)}</td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-orange-600 text-[13px]">{formatNumber(item.km)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="bg-slate-100 px-2 py-1 rounded font-bold text-[11px] text-slate-500">{item.jobs} bảo trì</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-primary h-full transition-all duration-500" 
                        style={{ width: `${(item.cost / stats.totalCost) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-bold">
                        {Math.round((item.cost / stats.totalCost) * 100)}% tổng ngân sách
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
