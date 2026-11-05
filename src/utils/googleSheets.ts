/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripRecord, SheetConfig, SHEET_COLUMNS } from '../types';

export const USER_PROVIDED_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyV9BGsA3xI8cprTcvFFXvFZbcR4nHNXPDzbSg2P4aQMK4PGOnFArxezIdsvh8L2yvYYg/exec';

export const DEFAULT_SHEET_CONFIG: SheetConfig = {
  webhookUrl: USER_PROVIDED_WEBHOOK_URL,
  sheetViewUrl: '',
  sheetName: 'NHẬT KÝ CHUYẾN XE',
  autoSync: true,
};

const SHEET_CONFIG_KEY = 'container_fleet_sheet_config';
const TRIPS_STORAGE_KEY = 'container_fleet_trips_v1';

export function getSheetConfig(): SheetConfig {
  try {
    const raw = localStorage.getItem(SHEET_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SHEET_CONFIG,
        ...parsed,
        webhookUrl: parsed.webhookUrl || USER_PROVIDED_WEBHOOK_URL,
      };
    }
  } catch (e) {
    console.error('Error reading sheet config', e);
  }
  return DEFAULT_SHEET_CONFIG;
}

export function saveSheetConfig(config: SheetConfig): void {
  try {
    localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheet config', e);
  }
}

export function getStoredTrips(): TripRecord[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading stored trips', e);
  }
  return [];
}

export function saveStoredTrips(trips: TripRecord[]): void {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Error saving trips', e);
  }
}

/**
 * Chuyển đổi chỉ số đồng hồ giờ lạnh lũy kế xe container (ví dụ: "4123:12", "4124:00" hoặc "4123.5")
 * sang tổng số phút.
 */
export function parseReeferTimeToMinutes(val: string): number | null {
  if (!val) return null;
  const str = val.trim();
  if (!str) return null;

  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const hStr = parts[0].trim();
      const mStr = parts[1].trim();
      if (/^\d+$/.test(hStr) && /^\d{1,2}$/.test(mStr)) {
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (h >= 0 && m >= 0 && m < 60) {
          return h * 60 + m;
        }
      }
    }
    return null;
  }

  const normalized = str.replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const num = parseFloat(normalized);
    if (!isNaN(num) && num >= 0) {
      return Math.round(num * 60);
    }
  }

  return null;
}

/**
 * Tính toán hiệu số giờ giữa 2 mốc thời gian dạng HH:mm
 * Có xử lý trường hợp chạy lạnh xuyên đêm (qua ngày hôm sau)
 */
export function calculateHoursDifference(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Nếu giờ kết thúc nhỏ hơn giờ bắt đầu -> Chạy qua ngày hôm sau (+ 24h)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

/**
 * Định dạng ngày dd/MM/yyyy từ Date hoặc YYYY-MM-DD
 */
export function formatDateToVN(dateInput: string | Date): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Chuyển đổi định dạng dd/MM/yyyy sang YYYY-MM-DD cho input type="date"
 */
export function formatVNToDateInput(vnDate: string): string {
  if (!vnDate) return '';
  const parts = vnDate.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Đẩy chuyến xe lên Google Sheet qua Apps Script Webhook
 * Hỗ trợ đồng thời Proxy Backend và Direct Browser Fetch
 */
export async function pushTripToGoogleSheet(
  trip: TripRecord,
  webhookUrl: string = USER_PROVIDED_WEBHOOK_URL
): Promise<{ success: boolean; message: string; rowNumber?: number }> {
  const targetUrl = webhookUrl && webhookUrl.trim().startsWith('http')
    ? webhookUrl.trim()
    : USER_PROVIDED_WEBHOOK_URL;

  // Chuẩn bị hàng dữ liệu theo đúng 12 cột Hình 2 + cột bổ trợ
  const payload = {
    action: 'addTrip',
    record: {
      ngayXP: trip.ngayXP,
      ngayKT: trip.ngayKT,
      hanhTrinh: trip.hanhTrinh,
      maChuyen: trip.maChuyen,
      matHang: trip.matHang,
      gioLanhXP: trip.gioLanhXP || '-',
      gioLanhKT: trip.gioLanhKT || '-',
      kmDau: trip.kmDau,
      kmCuoi: trip.kmCuoi,
      tongKm: trip.tongKm,
      bks: trip.bks,
      tenLaiXe: trip.tenLaiXe,
      loaiHinh: trip.loaiHinh,
      tongGioLanh: trip.tongGioLanh || 0,
      createdAt: trip.createdAt,
    },
    // Hàng mảng tuần tự theo đúng thứ tự cột Hình 2
    rowValues: [
      trip.ngayXP,
      trip.ngayKT,
      trip.hanhTrinh,
      trip.maChuyen,
      trip.matHang,
      trip.gioLanhXP || '-',
      trip.gioLanhKT || '-',
      trip.kmDau,
      trip.kmCuoi,
      trip.tongKm,
      trip.bks,
      trip.tenLaiXe,
      trip.loaiHinh,
      trip.tongGioLanh || 0,
      new Date(trip.createdAt).toLocaleString('vi-VN'),
    ],
  };

  // 1. Thử gửi trực tiếp từ trình duyệt tới Google Apps Script Webhook
  // Google Apps Script hỗ trợ CORS Access-Control-Allow-Origin: * khi gửi text/plain
  // và tự động theo dõi 302 redirect để lấy JSON kết quả dòng vừa thêm
  try {
    const directRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (directRes.ok) {
      const data = await directRes.json();
      if (data.status === 'success' || data.rowNumber) {
        return {
          success: true,
          message: data.message || `Đã thêm thành công vào dòng ${data.rowNumber || ''} trên Google Sheet!`,
          rowNumber: data.rowNumber,
        };
      }
    }
  } catch (directErr) {
    console.warn('Direct fetch to Apps Script failed, trying proxy /api/sync-sheet...', directErr);
  }

  // 2. Fallback: Gửi qua backend proxy /api/sync-sheet
  try {
    const proxyRes = await fetch('/api/sync-sheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        webhookUrl: targetUrl,
        payload,
      }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.status === 'success' || data.rowNumber) {
        return {
          success: true,
          message: data.message || `Đã thêm thành công vào dòng ${data.rowNumber || ''} trên Google Sheet!`,
          rowNumber: data.rowNumber,
        };
      }
    } else {
      const errText = await proxyRes.text();
      console.error('Proxy returned error status:', proxyRes.status, errText);
    }
  } catch (proxyErr) {
    console.error('Proxy /api/sync-sheet error:', proxyErr);
  }

  return {
    success: false,
    message: 'Không thể kết nối tới Google Sheet. Vui lòng kiểm tra lại đường mạng hoặc Webhook.',
  };
}

/**
 * Sinh mã nguồn Google Apps Script tự động để quản lý dán vào Google Sheet
 */
export function generateGoogleAppsScriptCode(sheetName: string = 'NHẬT KÝ CHUYẾN XE'): string {
  return `/**
 * CODE TỰ ĐỘNG ĐỒNG BỘ NHẬT KÝ CHUYẾN XE CONTAINER VÀO GOOGLE SHEET
 * Cách cài đặt (chỉ mất 1 phút):
 * 1. Mở file Google Sheet của bạn trên máy tính
 * 2. Nhấn vào menu: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa hết code cũ trong file Code.gs và dán toàn bộ đoạn mã này vào
 * 4. Nhấn biểu tượng Lưu (hình đĩa mềm)
 * 5. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment)
 * 6. Mục "Chọn loại" chọn: "Ứng dụng web" (Web app)
 * 7. Mục "Người có quyền truy cập" (Who has access) -> CHỌN: "Bất kỳ ai" (Anyone)
 * 8. Nhấn "Triển khai" -> Sao chép "URL ứng dụng web" (Web App URL) và dán vào App Nhật ký chuyến xe
 */

var SHEET_NAME = "${sheetName}";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Nếu sheet chưa tồn tại, kiểm tra xem nếu chỉ có 1 tab mặc định (Trang tính1/Sheet1) thì đổi tên luôn
    if (!sheet) {
      var allSheets = ss.getSheets();
      if (allSheets.length === 1 && (allSheets[0].getName() === "Trang tính1" || allSheets[0].getName() === "Sheet1")) {
        sheet = allSheets[0];
        sheet.setName(SHEET_NAME);
      } else {
        sheet = ss.insertSheet(SHEET_NAME);
      }
      initSheetHeader(sheet);
    } else {
      // Kiểm tra dòng tiêu đề nếu chưa có
      if (sheet.getLastRow() === 0) {
        initSheetHeader(sheet);
      }
    }

    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    var row = [];
    if (data.rowValues && Array.isArray(data.rowValues)) {
      row = data.rowValues;
    } else if (data.record) {
      var r = data.record;
      row = [
        r.ngayXP,
        r.ngayKT,
        r.hanhTrinh,
        r.maChuyen,
        r.matHang,
        r.gioLanhXP || '-',
        r.gioLanhKT || '-',
        r.kmDau,
        r.kmCuoi,
        r.tongKm,
        r.bks,
        r.tenLaiXe,
        r.loaiHinh || 'CHẠY NÓNG',
        r.tongGioLanh || 0,
        new Date().toLocaleString('vi-VN')
      ];
    }

    // Ghi dòng mới vào bảng tính
    sheet.appendRow(row);
    
    // Định dạng dòng mới vừa ghi
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, row.length)
      .setVerticalAlignment("middle")
      .setFontFamily("Arial")
      .setFontSize(10);
      
    // Căn giữa ngày tháng, BKS, mã chuyến
    sheet.getRange(lastRow, 1).setHorizontalAlignment("center"); // Ngày XP
    sheet.getRange(lastRow, 2).setHorizontalAlignment("center"); // Ngày KT
    sheet.getRange(lastRow, 4).setHorizontalAlignment("center"); // Mã chuyến
    sheet.getRange(lastRow, 6).setHorizontalAlignment("center"); // Giờ lạnh XP
    sheet.getRange(lastRow, 7).setHorizontalAlignment("center"); // Giờ lạnh KT
    sheet.getRange(lastRow, 8).setNumberFormat("#,##0");        // Km đầu
    sheet.getRange(lastRow, 9).setNumberFormat("#,##0");        // Km cuối
    sheet.getRange(lastRow, 10).setNumberFormat("#,##0").setFontWeight("bold"); // Tổng Km
    sheet.getRange(lastRow, 11).setHorizontalAlignment("center").setFontWeight("bold"); // BKS

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã thêm dữ liệu thành công vào dòng " + lastRow,
      rowNumber: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    sheetName: SHEET_NAME,
    message: "Hệ thống Webhook Nhật Ký Chuyến Xe Container đang hoạt động tốt!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// Khởi tạo dòng tiêu đề theo đúng thứ tự Hình 2 của Quản lý
function initSheetHeader(sheet) {
  var headers = [
    "NGÀY XP",
    "NGÀY KT",
    "HÀNH TRÌNH",
    "MÃ CHUYẾN",
    "MẶT HÀNG",
    "GIỜ LẠNH XP",
    "GIỜ LẠNH KT",
    "KM ĐẦU",
    "KM CUỐI",
    "TỔNG KM",
    "BKS",
    "TÊN LÁI XE",
    "LOẠI HÌNH",
    "TỔNG GIỜ LẠNH",
    "THỜI GIAN NHẬP"
  ];
  
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  
  // Màu nền xanh cốm đặc trưng như trong Hình 2 người dùng cung cấp
  headerRange.setBackground("#97b355")
    .setFontColor("#1500a8") // Màu chữ xanh dương đậm như ảnh Hình 2
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
    
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // Đặt độ rộng cột phù hợp
  sheet.setColumnWidth(1, 105); // NGÀY XP
  sheet.setColumnWidth(2, 105); // NGÀY KT
  sheet.setColumnWidth(3, 220); // HÀNH TRÌNH
  sheet.setColumnWidth(4, 120); // MÃ CHUYẾN
  sheet.setColumnWidth(5, 140); // MẶT HÀNG
  sheet.setColumnWidth(6, 110); // GIỜ LẠNH XP
  sheet.setColumnWidth(7, 110); // GIỜ LẠNH KT
  sheet.setColumnWidth(8, 100); // KM ĐẦU
  sheet.setColumnWidth(9, 100); // KM CUỐI
  sheet.setColumnWidth(10, 110); // TỔNG KM
  sheet.setColumnWidth(11, 120); // BKS
  sheet.setColumnWidth(12, 180); // TÊN LÁI XE
}
`;
}

/**
 * Xuất dữ liệu chuyến đi ra file CSV có BOM UTF-8 (mở trong Excel không bị lỗi font Tiếng Việt)
 */
export function exportTripsToCSV(trips: TripRecord[]): void {
  const headers = [
    'STT',
    'NGÀY XP',
    'NGÀY KT',
    'HÀNH TRÌNH',
    'MÃ CHUYẾN',
    'MẶT HÀNG',
    'GIỜ LẠNH XP',
    'GIỜ LẠNH KT',
    'KM ĐẦU',
    'KM CUỐI',
    'TỔNG KM',
    'BKS',
    'TÊN LÁI XE',
    'LOẠI HÌNH',
    'TỔNG GIỜ LẠNH',
    'TRẠNG THÁI SYNC',
    'THỜI GIAN NHẬP',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = trips.map((t, idx) => [
    idx + 1,
    escapeCSV(t.ngayXP),
    escapeCSV(t.ngayKT),
    escapeCSV(t.hanhTrinh),
    escapeCSV(t.maChuyen),
    escapeCSV(t.matHang),
    escapeCSV(t.gioLanhXP || '-'),
    escapeCSV(t.gioLanhKT || '-'),
    t.kmDau,
    t.kmCuoi,
    t.tongKm,
    escapeCSV(t.bks),
    escapeCSV(t.tenLaiXe),
    escapeCSV(t.loaiHinh),
    t.tongGioLanh || 0,
    escapeCSV(t.syncStatus === 'synced' ? 'Đã lên Google Sheet' : 'Chờ đồng bộ'),
    escapeCSV(new Date(t.createdAt).toLocaleString('vi-VN')),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Nhat_Ky_Container_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
