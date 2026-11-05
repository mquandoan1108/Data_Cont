/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Truck,
  MapPin,
  Calendar,
  Gauge,
  ThermometerSnowflake,
  SunMedium,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { TripRecord, CONTAINER_TRUCKS } from '../types';

interface TripHistoryProps {
  trips: TripRecord[];
  onRetrySync: (tripId: string) => Promise<void>;
  onSyncAllPending: () => Promise<void>;
  isSyncing: boolean;
}

export const TripHistory: React.FC<TripHistoryProps> = ({
  trips,
  onRetrySync,
  onSyncAllPending,
  isSyncing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<string>('ALL');
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);

  // Thống kê pending
  const pendingTrips = useMemo(() => trips.filter((t) => t.syncStatus !== 'synced'), [trips]);

  // Bộ lọc
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchTruck = selectedTruck === 'ALL' || t.bks === selectedTruck;
      const matchSearch =
        !searchTerm.trim() ||
        t.tenLaiXe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.hanhTrinh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.maChuyen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.bks.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTruck && matchSearch;
    });
  }, [trips, selectedTruck, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Tiêu đề & nút đồng bộ hàng loạt */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Lịch Sử Chuyến Xe Đã Nhập
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-slate-800">{trips.length} chuyến</span> · Chờ đồng bộ:{' '}
            <span className={`font-bold ${pendingTrips.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pendingTrips.length} chuyến
            </span>
          </p>
        </div>

        {pendingTrips.length > 0 && (
          <button
            onClick={onSyncAllPending}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ {pendingTrips.length} chuyến chờ lên Sheet</span>
          </button>
        )}
      </div>

      {/* Thanh tìm kiếm & lọc nhanh theo biển số xe */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên lái xe, hành trình, mã chuyến..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-700"
            >
              <option value="ALL">Tất cả 27 xe đầu kéo</option>
              {CONTAINER_TRUCKS.map((plate) => (
                <option key={plate} value={plate}>
                  Xe {plate}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách các chuyến xe */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Truck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Chưa có chuyến xe nào</p>
          <p className="text-xs text-slate-400">
            Chuyển sang tab "Nhập Chuyến" để bắt đầu ghi nhật ký chuyến xe đầu tiên.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const isSynced = trip.syncStatus === 'synced';
            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-blue-300 transition-all space-y-3"
              >
                {/* Dòng 1: Biển số xe, mã chuyến và trạng thái đồng bộ */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-bold font-mono text-sm border border-blue-200">
                      {trip.bks}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                      {trip.maChuyen}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        trip.loaiHinh === 'CHẠY LẠNH'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {trip.loaiHinh === 'CHẠY LẠNH' ? (
                        <>
                          <ThermometerSnowflake className="w-3 h-3 text-sky-600" />
                          Lạnh ({trip.tongGioLanh}h)
                        </>
                      ) : (
                        <>
                          <SunMedium className="w-3 h-3 text-amber-600" />
                          Nóng
                        </>
                      )}
                    </span>
                  </div>

                  {/* Sync status */}
                  <div>
                    {isSynced ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Đã lên Sheet</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onRetrySync(trip.id)}
                        disabled={isSyncing}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                        title="Nhấn để gửi lại"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Chờ gửi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dòng 2: Hành trình và Lái xe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{trip.hanhTrinh}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 truncate">{trip.tenLaiXe}</span>
                  </div>
                </div>

                {/* Dòng 3: Số Km & Thời gian */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-slate-500">
                      Km: <span className="font-mono text-slate-700">{trip.kmDau.toLocaleString()}</span> →{' '}
                      <span className="font-mono text-slate-700">{trip.kmCuoi.toLocaleString()}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{trip.tongKm.toLocaleString()} km
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {trip.ngayXP}
                    {trip.ngayKT !== trip.ngayXP && ` - ${trip.ngayKT}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
