import React, { useState, useEffect } from 'react';
import { Save, PlusCircle, RotateCcw } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, parseFormattedNumber, formatDateForInput, formatDateDisplay } from '../lib/utils';
import { motion } from 'motion/react';

interface MaintenanceFormProps {
  initialData?: MaintenanceRecord | null;
  onSubmit: (data: Omit<MaintenanceRecord, 'id'> & { id?: number }) => Promise<void>;
  onCancel?: () => void;
  availablePlates: string[];
  defaultPlate: string;
  allData: MaintenanceRecord[];
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  availablePlates,
  defaultPlate,
  allData
}) => {
  const [formData, setFormData] = useState({
    licensePlate: defaultPlate === 'ALL' ? '' : defaultPlate,
    date: new Date().toISOString().split('T')[0],
    category: '',
    params: '',
    odo: '0',
    nextOdo: '0',
    unitPrice: '0',
    isDone: false
  });

  const uniqueCategories = Array.from(new Set(allData.map(d => d.category))).filter(Boolean).sort();
  const uniqueParams = Array.from(new Set(allData.map(d => d.params))).filter(Boolean).sort();

  const [interval, setIntervalValue] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        licensePlate: initialData.licensePlate,
        date: formatDateForInput(initialData.date),
        category: initialData.category,
        params: initialData.params,
        odo: formatNumber(initialData.odo),
        nextOdo: formatNumber(initialData.nextOdo),
        unitPrice: formatNumber(initialData.unitPrice),
        isDone: initialData.isDone
      });
      // Calculate interval for display if editing
      if (initialData.nextOdo > initialData.odo) {
        setIntervalValue(formatNumber(initialData.nextOdo - initialData.odo));
      }
    }
  }, [initialData]);

  // Remove the automatic nextOdo calculation to avoid loops and allow bidirectional updates
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (/^\d*$/.test(rawValue)) {
      const numValue = parseInt(rawValue || '0');
      const formatted = formatNumber(rawValue);
      
      setFormData(prev => {
        const newData = { ...prev, [field]: formatted };
        
        // Logic updates based on which field changed
        if (field === 'odo') {
          const intervalNum = parseFormattedNumber(interval);
          if (intervalNum > 0) {
            newData.nextOdo = formatNumber(numValue + intervalNum);
          }
        }
        
        if (field === 'nextOdo') {
          const odoNum = parseFormattedNumber(prev.odo);
          if (numValue > odoNum) {
            setIntervalValue(formatNumber(numValue - odoNum));
          } else {
            setIntervalValue('0');
          }
        }
        
        return newData;
      });
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (/^\d*$/.test(rawValue)) {
      const intervalNum = parseInt(rawValue || '0');
      const formatted = formatNumber(rawValue);
      setIntervalValue(formatted);
      
      const odoNum = parseFormattedNumber(formData.odo);
      setFormData(prev => ({
        ...prev,
        nextOdo: formatNumber(odoNum + intervalNum)
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const record = {
      id: initialData?.id,
      licensePlate: formData.licensePlate,
      date: formatDateDisplay(formData.date),
      category: formData.category,
      params: formData.params,
      odo: parseFormattedNumber(formData.odo),
      nextOdo: parseFormattedNumber(formData.nextOdo),
      unitPrice: parseFormattedNumber(formData.unitPrice),
      isDone: formData.isDone
    };

    await onSubmit(record);
    setIsSubmitting(false);
    
    if (!initialData) {
      setFormData({
        ...formData,
        category: '',
        params: '',
        odo: '0',
        nextOdo: '0',
        unitPrice: '0',
        isDone: false
      });
      setIntervalValue('0');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-md border border-app-border overflow-hidden max-w-4xl mx-auto"
    >
      <div className="bg-slate-50 px-6 py-3 border-b border-app-border flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          {initialData ? 'CẬP NHẬT THÔNG TIN BẢO TRÌ' : 'THÊM MỚI HẠNG MỤC BẢO TRÌ'}
        </h2>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">BIỂN SỐ XE</label>
            <input 
              list="plates-list"
              value={formData.licensePlate}
              onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none font-bold text-primary text-sm shadow-sm"
              placeholder="Nhập hoặc chọn..."
              required
            />
            <datalist id="plates-list">
              {availablePlates.map(p => p !== 'ALL' && <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">NGÀY THỰC HIỆN</label>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm shadow-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">TRẠNG THÁI</label>
            <label className="flex items-center gap-2 h-[38px] px-3 bg-slate-50 border border-slate-300 rounded cursor-pointer hover:bg-white transition-colors shadow-sm">
              <input 
                type="checkbox"
                checked={formData.isDone}
                onChange={(e) => setFormData({...formData, isDone: e.target.checked})}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600 uppercase">ĐÃ XONG (X)</span>
            </label>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">HẠNG MỤC BẢO TRÌ</label>
            <input 
              type="text"
              list="category-list"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm shadow-sm font-medium"
              placeholder="VD: Thay dầu máy, Bảo trì phanh..."
              required
            />
            <datalist id="category-list">
              {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">ĐƠN GIÁ (VNĐ)</label>
            <input 
              type="text"
              value={formData.unitPrice}
              onChange={(e) => handleNumericChange(e, 'unitPrice')}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none font-mono text-sm font-bold shadow-sm"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">THÔNG SỐ / CHI TIẾT</label>
            <input 
              type="text"
              list="params-list"
              value={formData.params}
              onChange={(e) => setFormData({...formData, params: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm shadow-sm"
              placeholder="Nhập chi tiết kỹ thuật nếu có..."
            />
            <datalist id="params-list">
              {uniqueParams.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">SỐ KM HIỆN TẠI (ODO)</label>
            <input 
              type="text"
              value={formData.odo}
              onChange={(e) => handleNumericChange(e, 'odo')}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none font-mono text-sm font-bold shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-blue-500 uppercase tracking-tighter">SỐ KM ĐỊNH KỲ (+)</label>
            <input 
              type="text"
              list="interval-list"
              value={interval}
              onChange={handleIntervalChange}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm font-bold text-blue-600 shadow-sm"
              placeholder="VD: 5.000"
            />
            <datalist id="interval-list">
              <option value="5.000" />
              <option value="10.000" />
              <option value="50.000" />
              <option value="70.000" />
              <option value="100.000" />
            </datalist>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter text-orange-600">ODO TIẾP THEO (DỰ KIẾN)</label>
              <span className="text-[9px] text-slate-400 italic">0 = Không báo</span>
            </div>
            <input 
              type="text"
              value={formData.nextOdo}
              onChange={(e) => handleNumericChange(e, 'nextOdo')}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono text-sm font-bold text-orange-600 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 text-slate-500 text-xs font-bold rounded hover:bg-slate-50 transition-all uppercase"
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2 border border-primary shadow-sm rounded text-xs transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={14} />
                <span>{initialData ? 'Lưu thay đổi' : 'Lưu bảo trì'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
