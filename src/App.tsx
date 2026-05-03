import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { MaintenanceTable } from './components/MaintenanceTable';
import { MaintenanceForm } from './components/MaintenanceForm';
import { MaintenanceReport } from './components/MaintenanceReport';
import { OverdueAlert } from './components/OverdueAlert';
import { MaintenanceReminder } from './components/MaintenanceReminder';
import { maintenanceApi } from './services/api';
import { MaintenanceRecord, TabType } from './types';
import { Info, PlusCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ReportStats } from './components/ReportStats';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [selectedPlate, setSelectedPlate] = useState('ALL');
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [quickViewPlate, setQuickViewPlate] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await maintenanceApi.getAll();
      setData(result);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("FAILED_TO_FETCH");
    } finally {
      setIsLoading(false);
      if (isLoggedIn) {
        setShowAlert(true);
        setShowReminder(true);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn || quickViewPlate) {
      fetchData();
    }
  }, [isLoggedIn, quickViewPlate]);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setQuickViewPlate(null);
  };

  const handleQuickView = (plate: string) => {
    setQuickViewPlate(plate);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setQuickViewPlate(null);
    setData([]);
    setActiveTab('info');
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setActiveTab('update');
  };

  const handleUpsert = async (record: Omit<MaintenanceRecord, 'id'> & { id?: number }) => {
    const success = await maintenanceApi.upsert(record);
    if (success) {
      await fetchData();
      if (editingRecord) {
        setEditingRecord(null);
        setActiveTab('info');
      }
    }
  };

  if (!isLoggedIn && !quickViewPlate) {
    return <Login onLogin={handleLogin} onQuickView={handleQuickView} />;
  }

  if (!isLoggedIn && quickViewPlate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-slate-100">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đang kiểm tra {quickViewPlate}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <MaintenanceReminder 
                data={data}
                isOpen={true}
                onClose={() => setQuickViewPlate(null)}
                filterPlate={quickViewPlate}
                isStatic={true}
              />
              {/* If no reminders found for matching plates, show a message */}
              {(() => {
                const normalize = (p: string) => p.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                const search = normalize(quickViewPlate || '');
                
                const matchingPlates = Array.from(new Set(data.map(d => d.licensePlate)) as Set<string>).filter(p => {
                  const target = normalize(p);
                  return search.length >= 4 
                    ? (target.endsWith(search) || target.includes(search))
                    : target.includes(search);
                });

                const hasReminders = data.some(item => {
                  if (item.isDone) return false;
                  if (!matchingPlates.includes(item.licensePlate)) return false;
                  
                  const plateMaxOdo = data.filter(d => d.licensePlate === item.licensePlate).reduce((max, curr) => curr.odo > max ? curr.odo : max, 0);
                  const diff = item.nextOdo - plateMaxOdo;
                  return item.nextOdo > 0 && diff <= 5000;
                });

                if (data.length > 0 && !hasReminders) {
                  return (
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-b-4 border-blue-500 ring-1 ring-black/5">
                      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="text-blue-500" size={32} />
                      </div>
                      <h3 className="font-black text-slate-800 text-lg uppercase mb-2">{quickViewPlate}</h3>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed">
                        Hiện tại không có hạng mục nào sắp đến hạn bảo trì cho xe này.
                      </p>
                      <button 
                        onClick={() => setQuickViewPlate(null)}
                        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                      >
                        Quay lại
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              {data.length === 0 && !isLoading && (
                 <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-b-4 border-red-500 ring-1 ring-black/5">
                  <h3 className="font-black text-red-600 text-lg uppercase mb-2">LỖI DỮ LIỆU</h3>
                  <p className="text-slate-500 text-xs font-bold">Không tìm thấy dữ liệu cho xe hoặc đã xảy ra lỗi kết nối.</p>
                  <button onClick={() => setQuickViewPlate(null)} className="mt-6 text-blue-600 font-black text-[10px] uppercase tracking-widest border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">Quay lại trang chính</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabIcons = {
    info: <Info size={18} />,
    update: <PlusCircle size={18} />,
    report: <FileText size={18} />
  };

  const tabLabels = {
    info: 'Thông tin bảo trì',
    update: editingRecord ? 'Sửa thông tin' : 'Cập nhật bảo trì',
    report: 'Lịch sử bảo dưỡng'
  };

  return (
    <Layout 
      title="BẢO TRÌ Ô TÔ" 
      onLogout={handleLogout}
      onShowReminder={() => setShowReminder(true)}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'update') setEditingRecord(null);
      }}
      editing={!!editingRecord}
    >
      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Đang tải dữ liệu...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 bg-red-50 rounded-lg border border-red-200 mx-4 px-10 text-center">
              <div className="bg-red-500 p-3 rounded-full text-white shadow-lg overflow-hidden">
                <PlusCircle size={24} className="rotate-45" />
              </div>
              <div className="space-y-2">
                <h3 className="text-red-600 font-black text-sm uppercase tracking-wider">Lỗi kết nối Cloud Database</h3>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  Hệ thống không thể truy cập dữ liệu. Hãy đảm bảo Apps Script được triển khai đúng cách.
                </p>
              </div>
              
              <div className="w-full bg-white p-3 rounded border border-red-100 font-mono text-[9px] text-slate-400 break-all select-all">
                URL ĐANG DÙNG:<br/>
                <span className="font-bold text-red-400">{(import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyg_rEHRmGOMmOPCfngBpjJBD-Z89_7F416gvjwX_2_oEpDHKqu6lbuQcG7HpWLPNDm/exec').trim()}</span>
              </div>

              <button 
                onClick={fetchData}
                className="px-10 py-2.5 bg-red-600 text-white rounded text-[11px] font-bold uppercase hover:bg-red-700 transition-all shadow-md active:scale-95"
              >
                Thử lại kết nối
              </button>
            </div>
          )}

          {!isLoading && !error && activeTab === 'info' && (
            <MaintenanceTable 
              data={data} 
              onEdit={handleEdit} 
              selectedPlate={selectedPlate}
              onPlateChange={setSelectedPlate}
            />
          )}

          {!isLoading && activeTab === 'update' && (
            <MaintenanceForm 
              initialData={editingRecord}
              onSubmit={handleUpsert}
              onCancel={editingRecord ? () => { setEditingRecord(null); setActiveTab('info'); } : undefined}
              availablePlates={Array.from(new Set(data.map(d => d.licensePlate)))}
              defaultPlate={selectedPlate}
              allData={data}
            />
          )}

          {!isLoading && activeTab === 'report' && (
            <MaintenanceReport 
              data={data}
              selectedPlate={selectedPlate}
              onPlateChange={setSelectedPlate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <OverdueAlert 
        data={data} 
        isOpen={showAlert} 
        onClose={() => setShowAlert(false)} 
      />

      <MaintenanceReminder 
        data={data}
        isOpen={showReminder}
        onClose={() => setShowReminder(false)}
      />
    </Layout>
  );
}
