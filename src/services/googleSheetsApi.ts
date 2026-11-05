/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripRecord } from '../types';

export const SHEET_TAB_NAME = 'NHẬT KÝ CHUYẾN XE';

export interface SheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const SPREADSHEET_ID_KEY = 'container_fleet_google_spreadsheet_id';

export function getSavedSpreadsheetId(): string {
  return localStorage.getItem(SPREADSHEET_ID_KEY) || '';
}

export function saveSpreadsheetId(id: string): void {
  if (id) {
    localStorage.setItem(SPREADSHEET_ID_KEY, id);
  } else {
    localStorage.removeItem(SPREADSHEET_ID_KEY);
  }
}

/**
 * Tạo một Google Sheet mới với tiêu đề và 12 cột chuẩn xác theo Hình 2
 */
export async function createGoogleSpreadsheet(accessToken: string): Promise<SheetMetadata> {
  const title = `NHẬT KÝ VẬN HÀNH CONTAINER - ${new Date().getFullYear()}`;

  // 1. Tạo spreadsheet mới
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: SHEET_TAB_NAME,
            gridProperties: {
              rowCount: 1000,
              columnCount: 15,
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Lỗi tạo Google Sheet: ${errorText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Điền dòng tiêu đề và định dạng màu sắc chuẩn Hình 2 (xanh cốm #97b355 & chữ xanh đậm #1500a8)
  const headers = [
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
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      SHEET_TAB_NAME
    )}'!A1:L1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${SHEET_TAB_NAME}'!A1:L1`,
        majorDimension: 'ROWS',
        values: [headers],
      }),
    }
  );

  // 3. Định dạng màu sắc và kích thước cột
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        // Màu nền xanh cốm #97b355 và chữ xanh dương đậm #1500a8 chuẩn theo Hình 2
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 12,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.592, green: 0.702, blue: 0.333 }, // #97b355
                textFormat: {
                  foregroundColor: { red: 0.082, green: 0.0, blue: 0.659 }, // #1500a8
                  bold: true,
                  fontSize: 11,
                  fontFamily: 'Arial',
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        // Độ cao dòng 1
        {
          updateDimensionProperties: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: 0,
              endIndex: 1,
            },
            properties: {
              pixelSize: 40,
            },
            fields: 'pixelSize',
          },
        },
      ],
    }),
  });

  saveSpreadsheetId(spreadsheetId);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Ghi 1 chuyến xe mới vào Google Sheet bằng API
 */
export async function appendTripToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  trip: TripRecord
): Promise<boolean> {
  const row = [
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
  ];

  const range = `'${SHEET_TAB_NAME}'!A:L`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [row],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error appending row to Google Sheet:', errorText);
    throw new Error(`Không thể ghi vào Google Sheet: ${errorText}`);
  }

  return true;
}

/**
 * Đọc toàn bộ danh sách chuyến xe từ Google Sheet
 */
export async function fetchTripsFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<TripRecord[]> {
  const range = `'${SHEET_TAB_NAME}'!A2:L`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Lỗi đọc Google Sheet: ${err}`);
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, index) => {
    const ngayXP = String(row[0] || '');
    const ngayKT = String(row[1] || '');
    const hanhTrinh = String(row[2] || '');
    const maChuyen = String(row[3] || '');
    const matHang = String(row[4] || '');
    const gioLanhXP = row[5] === '-' ? '' : String(row[5] || '');
    const gioLanhKT = row[6] === '-' ? '' : String(row[6] || '');
    const kmDau = Number(String(row[7] || '0').replace(/,/g, '')) || 0;
    const kmCuoi = Number(String(row[8] || '0').replace(/,/g, '')) || 0;
    const tongKm = Number(String(row[9] || '0').replace(/,/g, '')) || kmCuoi - kmDau;
    const bks = String(row[10] || '');
    const tenLaiXe = String(row[11] || '');

    return {
      id: `sheet-row-${index + 2}`,
      ngayXP,
      ngayKT,
      hanhTrinh,
      maChuyen,
      matHang,
      loaiHinh: gioLanhXP || gioLanhKT ? 'CHẠY LẠNH' : 'CHẠY NÓNG',
      gioLanhXP,
      gioLanhKT,
      tongGioLanh: 0,
      kmDau,
      kmCuoi,
      tongKm,
      bks,
      tenLaiXe,
      laiXe1: tenLaiXe.split('/')[0]?.trim() || tenLaiXe,
      laiXe2: tenLaiXe.split('/')[1]?.trim(),
      createdAt: new Date().toISOString(),
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
    };
  });
}
