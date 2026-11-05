/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TripRecord {
  id: string;
  ngayXP: string;      // Định dạng dd/MM/yyyy
  ngayKT: string;      // Định dạng dd/MM/yyyy
  hanhTrinh: string;   // vd: Cảng Hải Phòng - KCN VSIP Bắc Ninh
  maChuyen: string;    // vd: CX-2026-001
  matHang: string;     // vd: Hoa quả đông lạnh, Thịt bò, Linh kiện...
  loaiHinh: 'CHẠY LẠNH' | 'CHẠY NÓNG';
  gioLanhXP: string;   // vd: 07:30 (hoặc rỗng nếu chạy nóng)
  gioLanhKT: string;   // vd: 16:45 (hoặc rỗng nếu chạy nóng)
  tongGioLanh: number; // vd: 9.25
  kmDau: number;       // Km ban đầu
  kmCuoi: number;      // Km kết thúc
  tongKm: number;      // kmCuoi - kmDau
  bks: string;         // Biển kiểm soát đầu kéo
  tenLaiXe: string;    // Họ tên đầy đủ (kèm lái 2 nếu có)
  laiXe1: string;      // Lái chính
  laiXe2?: string;     // Lái phụ (nếu đi 2 lái)
  ghiChu?: string;     // Ghi chú thêm (nếu có)
  createdAt: string;   // ISO timestamp
  syncStatus: 'synced' | 'pending' | 'failed';
  syncError?: string;
  syncedAt?: string;
}

// 27 xe đầu kéo từ hình ảnh BKS cung cấp
export const CONTAINER_TRUCKS: string[] = [
  '29KT00423',
  '29KT00437',
  '26H03708',
  '15H30918',
  '29K04802',
  '89H07643',
  '89H07665',
  '29K04410',
  '29K04483',
  '29K04302',
  '29K04522',
  '29K04835',
  '89H07661',
  '29K04689',
  '29E51730',
  '29KT01992',
  '29KT01987',
  '29KT02008',
  '29KT02000',
  '29KT01984',
  '29KT01990',
  '29KT01995',
  '29KT01996',
  '29KT01998',
  '29KT02016',
  '29KT02006',
  '29KT02022',
];

// Thứ tự cột Google Sheet theo đúng Hình 2 của Quản lý:
// NGÀY XP | NGÀY KT | HÀNH TRÌNH | MÃ CHUYẾN | MẶT HÀNG | GIỜ LẠNH XP | GIỜ LẠNH KT | KM ĐẦU | KM CUỐI | TỔNG KM | BKS | TÊN LÁI XE
export const SHEET_COLUMNS = [
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
  'THỜI GIAN NHẬP'
] as const;

export interface SheetConfig {
  webhookUrl: string;
  sheetViewUrl: string;
  sheetName: string;
  autoSync: boolean;
  spreadsheetId?: string;
}
