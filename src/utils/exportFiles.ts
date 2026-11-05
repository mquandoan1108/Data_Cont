/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripRecord } from '../types';
import { cleanTripData, CleanedTripRow } from './dataClean';

/**
 * Xuất dữ liệu đã làm sạch sang định dạng CSV có UTF-8 BOM
 */
export function exportCleanCSV(trips: TripRecord[]): void {
  const cleanedRows = cleanTripData(trips);

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
    'THỜI GIAN NHẬP',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = cleanedRows.map((r) => [
    r.stt,
    escapeCSV(r.ngayXP),
    escapeCSV(r.ngayKT),
    escapeCSV(r.hanhTrinh),
    escapeCSV(r.maChuyen),
    escapeCSV(r.matHang),
    escapeCSV(r.gioLanhXP),
    escapeCSV(r.gioLanhKT),
    r.kmDau,
    r.kmCuoi,
    r.tongKm,
    escapeCSV(r.bks),
    escapeCSV(r.tenLaiXe),
    escapeCSV(r.loaiHinh),
    r.tongGioLanh,
    escapeCSV(r.thoiGianNhap),
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadBlob(csvContent, `Nhat_Ky_Container_Clean_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Xuất dữ liệu đã làm sạch sang định dạng Excel (.xls) có màu sắc tiêu đề chuẩn Hình 2,
 * viền bảng, căn giữa và định dạng số km chuẩn xác
 */
export function exportCleanExcel(trips: TripRecord[]): void {
  const cleanedRows = cleanTripData(trips);

  // Tạo định dạng bảng HTML Excel tương thích 100% với Microsoft Excel, Google Sheets, WPS
  const tableHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>NHẬT KÝ CHUYẾN XE</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      th {
        background-color: #97b355;
        color: #1500a8;
        font-family: Arial, sans-serif;
        font-size: 11pt;
        font-weight: bold;
        text-align: center;
        vertical-align: middle;
        border: 1px solid #7d9642;
        padding: 8px 12px;
      }
      td {
        font-family: Arial, sans-serif;
        font-size: 10pt;
        border: 1px solid #cbd5e1;
        padding: 6px 10px;
        vertical-align: middle;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: bold; }
      .bks { color: #1e3a8a; font-weight: bold; text-align: center; font-family: monospace; }
      .tong-km { font-weight: bold; text-align: right; color: #065f46; background-color: #ecfdf5; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>NGÀY XP</th>
          <th>NGÀY KT</th>
          <th>HÀNH TRÌNH</th>
          <th>MÃ CHUYẾN</th>
          <th>MẶT HÀNG</th>
          <th>GIỜ LẠNH XP</th>
          <th>GIỜ LẠNH KT</th>
          <th>KM ĐẦU</th>
          <th>KM CUỐI</th>
          <th>TỔNG KM</th>
          <th>BKS</th>
          <th>TÊN LÁI XE</th>
          <th>LOẠI HÌNH</th>
          <th>TỔNG GIỜ LẠNH</th>
          <th>THỜI GIAN NHẬP</th>
        </tr>
      </thead>
      <tbody>
        ${cleanedRows
          .map(
            (r) => `
          <tr>
            <td class="center">${r.stt}</td>
            <td class="center">${escapeXml(r.ngayXP)}</td>
            <td class="center">${escapeXml(r.ngayKT)}</td>
            <td>${escapeXml(r.hanhTrinh)}</td>
            <td class="center bold">${escapeXml(r.maChuyen)}</td>
            <td>${escapeXml(r.matHang)}</td>
            <td class="center">${escapeXml(r.gioLanhXP)}</td>
            <td class="center">${escapeXml(r.gioLanhKT)}</td>
            <td class="right">${r.kmDau.toLocaleString('vi-VN')}</td>
            <td class="right">${r.kmCuoi.toLocaleString('vi-VN')}</td>
            <td class="tong-km">${r.tongKm.toLocaleString('vi-VN')}</td>
            <td class="bks">${escapeXml(r.bks)}</td>
            <td class="bold">${escapeXml(r.tenLaiXe)}</td>
            <td class="center">${escapeXml(r.loaiHinh)}</td>
            <td class="center">${r.tongGioLanh > 0 ? r.tongGioLanh + ' h' : '-'}</td>
            <td class="center">${escapeXml(r.thoiGianNhap)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </body>
  </html>
  `;

  downloadBlob(tableHtml, `Nhat_Ky_Container_Clean_${getTimestamp()}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getTimestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
