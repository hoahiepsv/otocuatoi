import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { MaintenanceTable } from './components/MaintenanceTable';
import { MaintenanceForm } from './components/MaintenanceForm';
import { MaintenanceReport } from './components/MaintenanceReport';
import { OverdueAlert } from './components/OverdueAlert';
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
      setShowAlert(true);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
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

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
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
    </Layout>
  );
}
