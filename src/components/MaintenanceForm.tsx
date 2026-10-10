import React, { useState, useEffect, useMemo } from 'react';
import { Save, PlusCircle, RotateCcw } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, parseFormattedNumber, formatDateForInput, formatDateDisplay, getTodayDateInput, removeVietnameseTones } from '../lib/utils';
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
    date: getTodayDateInput(),
    category: '',
    params: '',
    odo: '0',
    nextOdo: '0',
    unitPrice: '0',
    isDone: false
  });

  // Extract all unique individual categories from history
  const allCategoryItems = useMemo(() => {
    const set = new Set<string>();
    allData.forEach(d => {
      if (d.category) {
        d.category.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allData]);

  const uniqueParams = useMemo(() => {
    const list: string[] = [];
    allData.forEach(d => {
      const p = d.params?.trim();
      if (p && !list.includes(p)) list.push(p);
    });
    return list.sort((a, b) => a.localeCompare(b, 'vi'));
  }, [allData]);

  // Current query in category (takes the last active line being typed)
  const currentCategoryQuery = useMemo(() => {
    if (!formData.category) return '';
    const lines = formData.category.split('\n');
    return lines[lines.length - 1].trim();
  }, [formData.category]);

  // Search categories: tone and case-insensitive.
  // "Không ghi chú sẵn nếu chưa gõ nội dung hạng mục" -> empty if no query
  const matchingCategories = useMemo(() => {
    if (!currentCategoryQuery) return [];
    const normalizedQuery = removeVietnameseTones(currentCategoryQuery);
    return allCategoryItems.filter(cat => {
      const normalizedCat = removeVietnameseTones(cat);
      return normalizedCat.includes(normalizedQuery);
    }).slice(0, 8);
  }, [currentCategoryQuery, allCategoryItems]);

  // Suggest params for the entered category:
  // "Không ghi chú sẵn nếu chưa gõ nội dung hạng mục" -> empty if no category entered
  const suggestedParams = useMemo(() => {
    if (!formData.category.trim()) return [];

    const categoryLines = formData.category
      .split('\n')
      .map(line => removeVietnameseTones(line.trim()))
      .filter(Boolean);

    if (categoryLines.length === 0) return [];

    // Find historical records matching any category line
    const matchedRecords = allData.filter(d => {
      if (!d.params || !d.params.trim()) return false;
      const dCatNorm = removeVietnameseTones(d.category || '');
      return categoryLines.some(q => dCatNorm.includes(q) || q.includes(dCatNorm));
    });

    const paramsSet = new Set<string>();
    matchedRecords.forEach(d => {
      const trimmed = d.params.trim();
      if (trimmed) paramsSet.add(trimmed);
    });

    let results = Array.from(paramsSet);

    // If user is also typing in params, filter without accents/case
    if (formData.params.trim()) {
      const normP = removeVietnameseTones(formData.params.trim());
      const filtered = results.filter(p => removeVietnameseTones(p).includes(normP));
      if (filtered.length > 0) {
        results = filtered;
      } else {
        results = uniqueParams.filter(p => removeVietnameseTones(p).includes(normP));
      }
    }

    return results.slice(0, 8);
  }, [formData.category, formData.params, allData, uniqueParams]);

  const handleSelectCategorySuggestion = (cat: string) => {
    setFormData(prev => {
      const lines = prev.category.split('\n');
      if (lines.length > 0) {
        lines[lines.length - 1] = cat;
      } else {
        lines.push(cat);
      }
      const newCategory = lines.join('\n');

      let newParams = prev.params;
      let newUnitPrice = prev.unitPrice;

      const normCat = removeVietnameseTones(cat);
      const matched = allData.find(d => 
        removeVietnameseTones(d.category || '').includes(normCat) && d.params?.trim()
      );

      if (matched) {
        if (!newParams) {
          newParams = matched.params;
        }
        if ((!newUnitPrice || newUnitPrice === '0') && matched.unitPrice) {
          newUnitPrice = formatNumber(matched.unitPrice);
        }
      }

      return {
        ...prev,
        category: newCategory,
        params: newParams,
        unitPrice: newUnitPrice
      };
    });
  };

  const handleSelectParamSuggestion = (param: string) => {
    setFormData(prev => ({
      ...prev,
      params: param
    }));
  };

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
            <textarea 
              rows={3}
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm shadow-sm font-medium resize-y"
              required
            />
            {matchingCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Gợi ý nhanh:</span>
                {matchingCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategorySuggestion(cat)}
                    className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            )}
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
            />
            <datalist id="params-list">
              {suggestedParams.map(p => <option key={p} value={p} />)}
            </datalist>
            {suggestedParams.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Gợi ý thông số:</span>
                {suggestedParams.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectParamSuggestion(p)}
                    className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            )}
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
