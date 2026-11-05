/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Truck,
  Gauge,
  ThermometerSnowflake,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  FileSpreadsheet,
  FileText,
  Lock,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { TripRecord, CONTAINER_TRUCKS, SheetConfig } from '../types';
import { exportCleanCSV, exportCleanExcel } from '../utils/exportFiles';

interface ManagerDashboardProps {
  trips: TripRecord[];
  sheetConfig: SheetConfig;
  onOpenConfig: () => void;
  onDeleteTrip?: (id: string) => void;
  onManagerLogout?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  trips,
  sheetConfig,
  onOpenConfig,
  onDeleteTrip,
  onManagerLogout,
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Các chỉ số KPI tổng hợp cho Quản Lý
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalKm = trips.reduce((acc, curr) => acc + (curr.tongKm || 0), 0);
    const totalColdHours = trips.reduce((acc, curr) => acc + (curr.tongGioLanh || 0), 0);
    const uniqueTrucksActive = new Set(trips.map((t) => t.bks)).size;
    const syncedTrips = trips.filter((t) => t.syncStatus === 'synced').length;

    return {
      totalTrips,
      totalKm,
      totalColdHours: Math.round(totalColdHours * 10) / 10,
      uniqueTrucksActive,
      syncedTrips,
    };
  }, [trips]);

  // Bộ lọc chuyến xe
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchPlate = selectedPlate === 'ALL' || trip.bks === selectedPlate;
      const matchSearch =
        !searchQuery.trim() ||
        trip.tenLaiXe.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.hanhTrinh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.maChuyen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.matHang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.bks.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlate && matchSearch;
    });
  }, [trips, selectedPlate, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Thanh tác vụ hàng đầu dành cho Quản Lý */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Bảng Theo Dõi &amp; Quản Lý Chuyến Xe Container
            </h2>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              ID: pvhkd (Quản lý)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu km vận hành, máy lạnh và tự động đồng bộ theo thời gian thực.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút 1: Mở Google Sheet hoặc Cài đặt */}
          {sheetConfig.sheetViewUrl ? (
            <a
              href={sheetConfig.sheetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Mở Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          ) : (
            <button
              onClick={onOpenConfig}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Cài Link Sheet</span>
            </button>
          )}

          {/* Nút 2: Tải Excel (Đã làm sạch) */}
          <button
            onClick={() => exportCleanExcel(trips)}
            disabled={trips.length === 0}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-300 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Tải bảng dữ liệu chuẩn Excel (.xls) đã làm sạch khoảng trắng, chuẩn hóa số Km và BKS"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xls)</span>
          </button>

          {/* Nút 3: Tải CSV (Đã làm sạch) */}
          <button
            onClick={() => exportCleanCSV(trips)}
            disabled={trips.length === 0}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors border border-slate-300 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Tải bảng dữ liệu định dạng CSV UTF-8 có dấu đã làm sạch"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất CSV</span>
          </button>

          {/* Nút 4: Đăng xuất quản lý về chế độ người nhập vãng lai */}
          {onManagerLogout && (
            <button
              onClick={onManagerLogout}
              className="px-2.5 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
              title="Khóa lại chế độ chỉ cho lái xe vãng lai nhập liệu"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Thẻ KPI thống kê đội xe */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tổng Km */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">TỔNG KM VẬN HÀNH</span>
            <Gauge className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            {stats.totalKm.toLocaleString('vi-VN')}
            <span className="text-xs font-semibold text-slate-500 ml-1">km</span>
          </div>
          <p className="text-[11px] text-slate-400">Từ {stats.totalTrips} chuyến xe đã ghi</p>
        </div>

        {/* KPI 2: Giờ lạnh */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">TỔNG GIỜ CHẠY LẠNH</span>
            <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-900 tracking-tight">
            {stats.totalColdHours.toLocaleString('vi-VN')}
            <span className="text-xs font-semibold text-slate-500 ml-1">giờ</span>
          </div>
          <p className="text-[11px] text-slate-400">Vận hành máy phát lạnh</p>
        </div>

        {/* KPI 3: Xe hoạt động */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ĐẦU KÉO HOẠT ĐỘNG</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-950 tracking-tight">
            {stats.uniqueTrucksActive}
            <span className="text-xs font-semibold text-slate-500 ml-1">/ 27 xe</span>
          </div>
          <p className="text-[11px] text-slate-400">Đội xe container 27 chiếc</p>
        </div>

        {/* KPI 4: Trạng thái Sheet */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ĐỒNG BỘ GOOGLE SHEET</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950 tracking-tight">
            {stats.syncedTrips}
            <span className="text-xs font-semibold text-slate-500 ml-1">/ {stats.totalTrips}</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Tự động đồng bộ thời gian thực
          </p>
        </div>
      </div>

      {/* Thanh bộ lọc dữ liệu */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Lái xe, Hành trình, Mã chuyến, Mặt hàng..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPlate}
            onChange={(e) => setSelectedPlate(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-700"
          >
            <option value="ALL">Toàn bộ 27 xe đầu kéo</option>
            {CONTAINER_TRUCKS.map((bks) => (
              <option key={bks} value={bks}>
                Xe {bks}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU ĐỒNG BỘ GOOGLE SHEET THEO ĐÚNG HÌNH 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Bảng Dữ Liệu Đồng Bộ Google Sheet (Chuẩn 12 cột Hình 2)
            </h3>
            <p className="text-[11px] text-slate-500">
              Dữ liệu được cập nhật tức thì mỗi khi lái xe gửi chuyến.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Hiển thị: {filteredTrips.length} dòng
          </span>
        </div>

        {/* Table container with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              {/* Tiêu đề bảng mang màu xanh cốm & chữ xanh dương đậm chuẩn như Hình 2 */}
              <tr style={{ backgroundColor: '#97b355' }} className="text-[#1500a8] font-bold select-none whitespace-nowrap">
                <th className="py-2.5 px-3 border border-slate-300 text-center">NGÀY XP</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">NGÀY KT</th>
                <th className="py-2.5 px-4 border border-slate-300">HÀNH TRÌNH</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">MÃ CHUYẾN</th>
                <th className="py-2.5 px-3 border border-slate-300">MẶT HÀNG</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">GIỜ LẠNH XP</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">GIỜ LẠNH KT</th>
                <th className="py-2.5 px-3 border border-slate-300 text-right">KM ĐẦU</th>
                <th className="py-2.5 px-3 border border-slate-300 text-right">KM CUỐI</th>
                <th className="py-2.5 px-3 border border-slate-300 text-right bg-[#8aa848]">TỔNG KM</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">BKS</th>
                <th className="py-2.5 px-4 border border-slate-300">TÊN LÁI XE</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Chưa có dòng dữ liệu nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip, idx) => (
                  <tr
                    key={trip.id}
                    className={`hover:bg-blue-50/50 transition-colors whitespace-nowrap font-medium ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">
                      {trip.ngayXP}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">
                      {trip.ngayKT}
                    </td>
                    <td className="py-2.5 px-4 border border-slate-200 text-slate-800 max-w-xs truncate" title={trip.hanhTrinh}>
                      {trip.hanhTrinh}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-bold text-slate-900">
                      {trip.maChuyen}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-slate-700">
                      {trip.matHang}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono text-sky-800">
                      {trip.gioLanhXP || '-'}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono text-sky-800">
                      {trip.gioLanhKT || '-'}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-right font-mono tabular-nums text-slate-700">
                      {trip.kmDau.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-right font-mono tabular-nums text-slate-700">
                      {trip.kmCuoi.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-right font-mono font-bold text-emerald-800 bg-emerald-50/50 tabular-nums">
                      {trip.tongKm.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-bold text-blue-900">
                      {trip.bks}
                    </td>
                    <td className="py-2.5 px-4 border border-slate-200 text-slate-900 font-semibold">
                      {trip.tenLaiXe}
                    </td>
                    <td className="py-2.5 px-2 border border-slate-200 text-center">
                      {onDeleteTrip && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận xóa chuyến ${trip.maChuyen} của xe ${trip.bks}?`)) {
                              onDeleteTrip(trip.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Xóa chuyến"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
