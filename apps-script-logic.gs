/**
 * GOOGLE APPS SCRIPT CODE
 * 1. Mở file Google Sheets của bạn.
 * 2. Chọn Tiện ích mở rộng > Apps Script.
 * 3. Dán mã này vào và nhấn Lưu.
 * 4. Nhấn "Triển khai" > "Trình triển khai mới".
 * 5. Loại: Ứng dụng web.
 * 6. "Người có quyền truy cập": Chọn "Bất kỳ ai" (Anyone).
 * 7. Sao chép URL ứng dụng web và dán vào ứng dụng.
 */

const SPREADSHEET_ID = '1yBK76pypuc9U1GKZ_c26pz-QyGslM-97-jayvgy5Fq0';

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    const action = e.parameter.action;

    if (action === 'read') {
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createResponse([]);
      
      const headers = data[0];
      const rows = data.slice(1);
      
      const result = rows.map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      return createResponse(result);
    }
  } catch (error) {
    return createResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    const jsonData = JSON.parse(e.postData.contents);
    const action = jsonData.action;
    const data = jsonData.data;
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = headers.map(header => data[header] !== undefined ? data[header] : "");

    if (action === 'create') {
      sheet.appendRow(rowValues);
      return createResponse({ status: "success" });
    } else if (action === 'update') {
      const rowIndex = jsonData.row;
      if (rowIndex) {
        sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
        return createResponse({ status: "success" });
      }
    }
    return createResponse({ status: "error", message: "Invalid action" });
  } catch (error) {
    return createResponse({ status: "error", message: error.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
