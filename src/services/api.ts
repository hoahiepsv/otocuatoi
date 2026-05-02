import { MaintenanceRecord } from '../types';
import { formatDateDisplay } from '../lib/utils';

const SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyg_rEHRmGOMmOPCfngBpjJBD-Z89_7F416gvjwX_2_oEpDHKqu6lbuQcG7HpWLPNDm/exec')
  .replace(/^["']|["']$/g, '') // Xử lý nếu người dùng dán cả dấu ngoặc kép
  .replace(/\/+$/, '') // Xóa gạch chéo cuối nếu có
  .trim();

export const maintenanceApi = {
  async getAll(): Promise<MaintenanceRecord[]> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('MY_APPS_SCRIPT_URL')) {
      console.error("❌ Apps Script URL chưa được cấu hình.");
      return [];
    }
    try {
      console.log("🔗 Đang kết nối tới:", SCRIPT_URL);
      const url = `${SCRIPT_URL}?action=read`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit', // Quan trọng đối với Apps Script CORS
        redirect: 'follow'
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.status === 'error') {
        console.error("❌ Lỗi từ Apps Script:", data.message);
        return [];
      }

      console.log("✅ Đã tải dữ liệu thành công.");
      return data.map((item: any, index: number) => ({
        id: index + 2, 
        licensePlate: String(item['SỐ XE'] || ''),
        date: formatDateDisplay(String(item['NGÀY THÁNG NĂM'] || '')),
        category: String(item['HẠNG MỤC'] || ''),
        params: String(item['THÔNG SỐ'] || ''),
        odo: parseInt(item['SỐ KM (ODO)'] || '0'),
        nextOdo: parseInt(item['ODO TIẾP THEO'] || '0'),
        unitPrice: parseInt(item['ĐƠN GIÁ'] || '0'),
        isDone: String(item['ĐÃ THỰC HIỆN']).toLowerCase() === 'x'
      }));
    } catch (error) {
      console.error("❌ Lỗi kết nối (Failed to fetch). Hãy đảm bảo:\n1. URL chính xác.\n2. Đã Deploy Apps Script ở chế độ 'Web App'.\n3. 'Who has access' đã chọn 'Anyone'.\nChi tiết lỗi:", error);
      throw error;
    }
  },

  async upsert(record: Omit<MaintenanceRecord, 'id'> & { id?: number }): Promise<boolean> {
    if (!SCRIPT_URL) {
      console.error("Apps Script URL is not set.");
      return false;
    }
    try {
      const payload = {
        action: record.id ? 'update' : 'create',
        row: record.id,
        data: {
          'SỐ XE': record.licensePlate,
          'NGÀY THÁNG NĂM': record.date,
          'HẠNG MỤC': record.category,
          'THÔNG SỐ': record.params,
          'SỐ KM (ODO)': record.odo,
          'ODO TIẾP THEO': record.nextOdo,
          'ĐƠN GIÁ': record.unitPrice,
          'ĐÃ THỰC HIỆN': record.isDone ? 'x' : ''
        }
      };

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Sử dụng no-cors cho POST Apps Script để tránh OPTIONS preflight phức tạp
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        redirect: 'follow',
        body: JSON.stringify(payload),
      });
      
      return true;
    } catch (error) {
      console.error("Error upserting data:", error);
      return false;
    }
  }
};
