/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripRecord } from '../types';

export interface CleanedTripRow {
  stt: number;
  ngayXP: string;
  ngayKT: string;
  hanhTrinh: string;
  maChuyen: string;
  matHang: string;
  gioLanhXP: string;
  gioLanhKT: string;
  kmDau: number;
  kmCuoi: number;
  tongKm: number;
  bks: string;
  tenLaiXe: string;
  loaiHinh: string;
  tongGioLanh: number;
  thoiGianNhap: string;
}

/**
 * Làm sạch và chuẩn hóa dữ liệu chuyến xe trước khi xuất file hoặc đồng bộ:
 * - Trim khoảng trắng thừa
 * - Viết hoa chuẩn BKS và Mã chuyến
 * - Chuẩn hóa số nguyên cho Km (loại bỏ NaN, null)
 * - Định dạng giờ lạnh chuẩn
 * - Sắp xếp theo thứ tự thời gian mới nhất
 */
export function cleanTripData(trips: TripRecord[]): CleanedTripRow[] {
  if (!Array.isArray(trips)) return [];

  // Tạo bản sao và sắp xếp theo ngày/thời gian
  const sorted = [...trips].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return sorted.map((trip, index) => {
    const kmDau = Math.max(0, Math.round(Number(trip.kmDau) || 0));
    const kmCuoi = Math.max(kmDau, Math.round(Number(trip.kmCuoi) || kmDau));
    const tongKm = Math.max(0, kmCuoi - kmDau);

    // Chuẩn hóa tên lái xe
    const cleanTenLaiXe = (trip.tenLaiXe || trip.laiXe1 || '')
      .split('/')
      .map((name) => name.trim())
      .filter(Boolean)
      .join(' / ');

    // Chuẩn hóa giờ lạnh
    const isCold = trip.loaiHinh === 'CHẠY LẠNH';
    const gioLanhXP = isCold && trip.gioLanhXP ? trip.gioLanhXP.trim() : '-';
    const gioLanhKT = isCold && trip.gioLanhKT ? trip.gioLanhKT.trim() : '-';
    const tongGioLanh = isCold ? Math.max(0, Number(trip.tongGioLanh) || 0) : 0;

    return {
      stt: index + 1,
      ngayXP: (trip.ngayXP || '').trim(),
      ngayKT: (trip.ngayKT || '').trim(),
      hanhTrinh: (trip.hanhTrinh || '').trim(),
      maChuyen: (trip.maChuyen || '').trim().toUpperCase(),
      matHang: (trip.matHang || '').trim(),
      gioLanhXP,
      gioLanhKT,
      kmDau,
      kmCuoi,
      tongKm,
      bks: (trip.bks || '').trim().toUpperCase(),
      tenLaiXe: cleanTenLaiXe || 'Chưa cập nhật',
      loaiHinh: isCold ? 'CHẠY LẠNH' : 'CHẠY NÓNG',
      tongGioLanh,
      thoiGianNhap: trip.createdAt
        ? new Date(trip.createdAt).toLocaleString('vi-VN')
        : new Date().toLocaleString('vi-VN'),
    };
  });
}
