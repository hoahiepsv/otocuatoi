import React, { useRef, useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { formatNumber, formatDateDisplay } from '../lib/utils';
import { toPng, toBlob } from 'html-to-image';

interface RepairProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MaintenanceRecord[];
  currentPlateOdos?: Record<string, number>;
}

export const RepairProposalModal: React.FC<RepairProposalModalProps> = ({
  isOpen,
  onClose,
  records,
  currentPlateOdos = {}
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proposerName, setProposerName] = useState('');
  const [garageName, setGarageName] = useState('');
  const [showPrice, setShowPrice] = useState(true);

  if (!isOpen || records.length === 0) return null;

  // Group or identify plates
  const uniquePlates: string[] = Array.from(new Set(records.map(r => r.licensePlate)));
  const primaryPlate = uniquePlates.length === 1 ? uniquePlates[0] : uniquePlates.join(', ');
  const currentOdo = uniquePlates.length === 1 && currentPlateOdos[primaryPlate] ? currentPlateOdos[primaryPlate] : null;

  const totalCost = records.reduce((sum, r) => sum + (r.unitPrice || 0), 0);

  interface ProposalRowItem {
    key: string;
    stt: number;
    licensePlate: string;
    categoryLine: string;
    params: string;
    unitPrice: number;
    unitPriceText: string;
    note: string;
  }

  // Local state for editable table rows (keyed by row.key)
  const [editedRows, setEditedRows] = useState<Record<string, { categoryLine: string; params: string; unitPriceText: string; note: string }>>({});

  // Initialize or generate initial rows
  const initialRows: ProposalRowItem[] = [];
  let rowStt = 1;

  records.forEach((record, recIdx) => {
    const rawLines = record.category ? record.category.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
    const lines = rawLines.length > 0 ? rawLines : [record.category || 'Chưa đặt tên hạng mục'];
    const paramLines = record.params ? record.params.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];

    lines.forEach((line, lineIdx) => {
      const isFirstLine = lineIdx === 0;
      let priceDisplay = '';
      if (record.unitPrice > 0) {
        if (lines.length === 1) {
          priceDisplay = `${formatNumber(record.unitPrice)} đ`;
        } else {
          priceDisplay = isFirstLine ? `${formatNumber(record.unitPrice)} đ` : '';
        }
      }

      const paramText = paramLines.length > lineIdx 
        ? paramLines[lineIdx] 
        : (isFirstLine ? (record.params || '') : '');

      const rowKey = `${record.id || recIdx}_line_${lineIdx}`;
      initialRows.push({
        key: rowKey,
        stt: rowStt++,
        licensePlate: record.licensePlate,
        categoryLine: line,
        params: paramText,
        unitPrice: record.unitPrice || 0,
        unitPriceText: priceDisplay,
        note: ''
      });
    });
  });

  // Calculate dynamic display rows merged with edited rows
  const proposalRows: ProposalRowItem[] = initialRows.map(row => {
    const edit = editedRows[row.key];
    return {
      ...row,
      categoryLine: edit?.categoryLine !== undefined ? edit.categoryLine : row.categoryLine,
      params: edit?.params !== undefined ? edit.params : row.params,
      unitPriceText: edit?.unitPriceText !== undefined ? edit.unitPriceText : row.unitPriceText,
      note: edit?.note !== undefined ? edit.note : row.note
    };
  });

  // Calculate total cost parsing numeric values from unitPriceText if available
  const calculatedTotalCost = proposalRows.reduce((sum, row) => {
    if (!row.unitPriceText) return sum;
    // Clean string to number
    const numeric = parseInt(row.unitPriceText.replace(/\D/g, ''), 10);
    return sum + (isNaN(numeric) ? 0 : numeric);
  }, 0);

  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = today.getFullYear();
  const formDateText = `Ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`;

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      const safePlate = uniquePlates[0] || 'XE';
      link.download = `Phieu_De_Nghi_Sua_Chua_${safePlate}_${dayStr}${monthStr}${yearStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
      alert('Không thể tạo ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback: download if copy not supported in browser
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Error copying image:', err);
      // Fallback to download
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">Xuất Phiếu Đề Nghị Sửa Chữa Dạng Hình Ảnh</h2>
              <p className="text-[11px] text-slate-400">Đã chọn {proposalRows.length} hạng mục cần làm cho xe: <strong className="text-blue-400">{primaryPlate}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Controls / Customization Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex flex-wrap gap-3 items-center justify-between print:hidden shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600">Người đề xuất:</label>
              <input 
                type="text" 
                placeholder="Lê Hòa Hiệp - 0983.676.470" 
                value={proposerName}
                onChange={(e) => setProposerName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-52"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600">Gara / Đơn vị SC:</label>
              <input 
                type="text" 
                placeholder="Tên gara đề xuất (tuỳ chọn)..." 
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-44"
              />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 select-none">
              <input 
                type="checkbox" 
                checked={showPrice} 
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Hiện đơn giá
            </label>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Sao chép ảnh để dán (Ctrl+V) vào Zalo, Messenger..."
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Đã sao chép ảnh!' : 'Sao chép ảnh (Zalo)'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải ảnh về máy (PNG)'}</span>
            </button>


          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center items-start print:p-0 print:bg-white flex-1">
          {/* Printable / Capturable Slip DOM */}
          <div 
            ref={printRef}
            className="bg-white text-slate-900 w-full max-w-[760px] p-8 sm:p-10 shadow-lg border border-slate-300 rounded-sm font-sans print:shadow-none print:border-none print:p-0 print:max-w-none"
            style={{ minHeight: '600px', backgroundColor: '#ffffff' }}
          >
            {/* Document Title */}
            <div className="text-center mb-6 pt-2">
              <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wide">
                PHIẾU ĐỀ NGHỊ SỬA CHỮA
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                V/v: Bảo dưỡng, sửa chữa & thay thế phụ tùng ô tô
              </p>
              <p className="text-xs italic text-slate-500 mt-1">
                {formDateText}
              </p>
            </div>

            {/* Vehicle & Proposal Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-xs grid grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <span className="font-bold text-slate-600">SỐ XE: </span>
                <span className="font-black text-blue-700 text-sm tracking-wide bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {primaryPlate}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600">SỐ KM HIỆN TẠI (ODO): </span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {currentOdo ? `${formatNumber(currentOdo)} KM` : 'Đang cập nhật'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600">NGƯỜI ĐỀ NGHỊ: </span>
                <span className="font-bold text-slate-800">
                  {proposerName.trim() || 'Lê Hòa Hiệp - 0983.676.470'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600">ĐƠN VỊ THỰC HIỆN: </span>
                <span className="font-bold text-slate-800">
                  {garageName.trim() || ''}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                    <th className="border border-slate-300 px-2 py-2 text-center w-10">STT</th>
                    {uniquePlates.length > 1 && (
                      <th className="border border-slate-300 px-2 py-2 text-left w-24">Số xe</th>
                    )}
                    <th className="border border-slate-300 px-3 py-2 text-left">Hạng mục sửa chữa</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Thông số / Quy cách</th>
                    {showPrice && (
                      <th className="border border-slate-300 px-2 py-2 text-right w-28">Đơn giá dự kiến</th>
                    )}
                    <th className="border border-slate-300 px-3 py-2 text-left w-36">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {proposalRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-500 align-top">
                        {row.stt}
                      </td>
                      {uniquePlates.length > 1 && (
                        <td className="border border-slate-300 px-2 py-2 font-bold text-blue-700 align-top">
                          {row.licensePlate}
                        </td>
                      )}
                      {/* Hạng mục sửa chữa - Cho phép gõ thêm/sửa nội dung */}
                      <td className="border border-slate-300 p-1 align-top">
                        <textarea
                          rows={1}
                          value={row.categoryLine}
                          onChange={(e) => {
                            setEditedRows(prev => ({
                              ...prev,
                              [row.key]: {
                                ...prev[row.key],
                                categoryLine: e.target.value,
                                params: prev[row.key]?.params !== undefined ? prev[row.key].params : row.params,
                                unitPriceText: prev[row.key]?.unitPriceText !== undefined ? prev[row.key].unitPriceText : row.unitPriceText,
                                note: prev[row.key]?.note !== undefined ? prev[row.key].note : row.note
                              }
                            }));
                          }}
                          placeholder=""
                          className="w-full bg-transparent px-2 py-1 font-bold text-slate-900 border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded resize-none text-xs leading-snug"
                          style={{ height: 'auto', minHeight: '26px' }}
                        />
                      </td>
                      {/* Thông số / Quy cách - Cho phép gõ nội dung */}
                      <td className="border border-slate-300 p-1 align-top">
                        <textarea
                          rows={1}
                          value={row.params}
                          onChange={(e) => {
                            setEditedRows(prev => ({
                              ...prev,
                              [row.key]: {
                                ...prev[row.key],
                                categoryLine: prev[row.key]?.categoryLine !== undefined ? prev[row.key].categoryLine : row.categoryLine,
                                params: e.target.value,
                                unitPriceText: prev[row.key]?.unitPriceText !== undefined ? prev[row.key].unitPriceText : row.unitPriceText,
                                note: prev[row.key]?.note !== undefined ? prev[row.key].note : row.note
                              }
                            }));
                          }}
                          placeholder=""
                          className="w-full bg-transparent px-2 py-1 text-slate-700 border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded resize-none text-xs leading-snug"
                          style={{ height: 'auto', minHeight: '26px' }}
                        />
                      </td>
                      {/* Đơn giá dự kiến - Cho phép gõ giá */}
                      {showPrice && (
                        <td className="border border-slate-300 p-1 align-top">
                          <input
                            type="text"
                            value={row.unitPriceText}
                            onChange={(e) => {
                              setEditedRows(prev => ({
                                ...prev,
                                [row.key]: {
                                ...prev[row.key],
                                categoryLine: prev[row.key]?.categoryLine !== undefined ? prev[row.key].categoryLine : row.categoryLine,
                                params: prev[row.key]?.params !== undefined ? prev[row.key].params : row.params,
                                unitPriceText: e.target.value,
                                note: prev[row.key]?.note !== undefined ? prev[row.key].note : row.note
                              }
                            }));
                          }}
                          placeholder=""
                          className="w-full bg-transparent px-2 py-1 font-mono font-bold text-slate-900 text-right border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded text-xs"
                        />
                      </td>
                    )}
                    {/* GHI CHÚ - Cột mới cho phép gõ nội dung */}
                    <td className="border border-slate-300 p-1 align-top">
                      <textarea
                        rows={1}
                        value={row.note}
                        onChange={(e) => {
                          setEditedRows(prev => ({
                            ...prev,
                            [row.key]: {
                              ...prev[row.key],
                              categoryLine: prev[row.key]?.categoryLine !== undefined ? prev[row.key].categoryLine : row.categoryLine,
                              params: prev[row.key]?.params !== undefined ? prev[row.key].params : row.params,
                              unitPriceText: prev[row.key]?.unitPriceText !== undefined ? prev[row.key].unitPriceText : row.unitPriceText,
                              note: e.target.value
                            }
                          }));
                        }}
                        placeholder=""
                        className="w-full bg-transparent px-2 py-1 text-slate-700 italic border-none outline-none focus:bg-blue-50/60 focus:ring-1 focus:ring-blue-400 rounded resize-none text-xs leading-snug"
                        style={{ height: 'auto', minHeight: '26px' }}
                      />
                    </td>
                  </tr>
                ))}
                {showPrice && calculatedTotalCost > 0 && (
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={uniquePlates.length > 1 ? 3 : 2} className="border border-slate-300 px-3 py-2 text-right uppercase text-[11px] text-slate-700">
                      Tổng cộng dự toán:
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-right font-mono font-black text-sm text-blue-700">
                      {formatNumber(calculatedTotalCost)} đ
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-[10px] text-slate-400 italic">
                      (Tạm tính)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

            {/* Signature: Chỉ NGƯỜI ĐỀ NGHỊ */}
            <div className="flex justify-end mt-12 pr-6 text-xs">
              <div className="space-y-16 text-center min-w-[240px]">
                <div>
                  <p className="font-bold uppercase text-slate-800 tracking-wider">NGƯỜI ĐỀ NGHỊ</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-900 text-xs">
                  {proposerName.trim() || 'Lê Hòa Hiệp - 0983.676.470'}
                </p>
              </div>
            </div>

            {/* Slip Footer watermark / timestamp */}
            <div className="border-t border-slate-200 mt-12 pt-3 flex justify-between text-[9px] text-slate-400 font-medium">
              <span>Hệ thống Quản lý bảo trì xe Ô tô • Lê Hòa Hiệp</span>
              <span>Xuất ngày: {today.toLocaleDateString('vi-VN')} {today.toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
