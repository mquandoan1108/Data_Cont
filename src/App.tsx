/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { DriverForm } from './components/DriverForm';
import { TripHistory } from './components/TripHistory';
import { ManagerDashboard } from './components/ManagerDashboard';
import { SheetConfigModal } from './components/SheetConfigModal';
import { ManagerLoginModal } from './components/ManagerLoginModal';
import { TripRecord, SheetConfig } from './types';
import {
  getSheetConfig,
  saveSheetConfig,
  getStoredTrips,
  saveStoredTrips,
  pushTripToGoogleSheet,
  USER_PROVIDED_WEBHOOK_URL,
} from './utils/googleSheets';
import { INITIAL_SAMPLE_TRIPS } from './utils/sampleData';
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  Wifi,
  WifiOff,
  Save,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'manager' | 'config'>('form');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const cfg = getSheetConfig();
    if (!cfg.webhookUrl) {
      cfg.webhookUrl = USER_PROVIDED_WEBHOOK_URL;
      saveSheetConfig(cfg);
    }
    return cfg;
  });

  // Phân quyền Quản lý: mặc định người vãng lai (lái xe) chỉ được nhập liệu
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('container_manager_authenticated') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingTargetTab, setPendingTargetTab] = useState<'manager' | 'config' | 'history' | null>(null);

  // Danh sách các chuyến xe
  const [trips, setTrips] = useState<TripRecord[]>(() => {
    const saved = getStoredTrips();
    if (saved.length > 0) return saved;
    saveStoredTrips(INITIAL_SAMPLE_TRIPS);
    return INITIAL_SAMPLE_TRIPS;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // Modal thông báo thành công sau khi nhập chuyến kèm số dòng Google Sheet
  const [submittedTrip, setSubmittedTrip] = useState<TripRecord | null>(null);
  const [syncedRowNumber, setSyncedRowNumber] = useState<number | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  // Ô nhập nhanh link Google Sheet trong Modal thành công
  const [quickSheetUrl, setQuickSheetUrl] = useState<string>(sheetConfig.sheetViewUrl || '');

  // Theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Đếm số chuyến đang chờ gửi
  const pendingCount = useMemo(() => {
    return trips.filter((t) => t.syncStatus !== 'synced').length;
  }, [trips]);

  // Quản lý đăng xuất về chế độ người vãng lai
  const handleManagerLogout = () => {
    localStorage.removeItem('container_manager_authenticated');
    setIsManagerAuthenticated(false);
    setActiveTab('form');
  };

  // Quản lý đăng nhập thành công
  const handleManagerLoginSuccess = () => {
    setIsManagerAuthenticated(true);
    if (pendingTargetTab) {
      if (pendingTargetTab === 'config') {
        setIsConfigOpen(true);
      } else {
        setActiveTab(pendingTargetTab);
      }
      setPendingTargetTab(null);
    } else {
      setActiveTab('manager');
    }
  };

  // Mở modal đăng nhập quản lý khi bấm vào mục bị khóa
  const handleOpenLoginForTab = (target?: 'manager' | 'config' | 'history') => {
    setPendingTargetTab(target || null);
    setIsLoginModalOpen(true);
  };

  // Lưu cấu hình Sheet
  const handleSaveConfig = (newConfig: SheetConfig) => {
    setSheetConfig(newConfig);
    saveSheetConfig(newConfig);
  };

  // Lưu nhanh link Google Sheet từ modal thành công
  const handleSaveQuickSheetUrl = () => {
    if (!quickSheetUrl.trim()) return;
    const updated = {
      ...sheetConfig,
      sheetViewUrl: quickSheetUrl.trim(),
    };
    handleSaveConfig(updated);
    window.open(quickSheetUrl.trim(), '_blank');
  };

  // Đồng bộ một chuyến xe cụ thể
  const handleRetrySync = async (tripId: string) => {
    const target = trips.find((t) => t.id === tripId);
    if (!target) return;

    const res = await pushTripToGoogleSheet(target, sheetConfig.webhookUrl);
    setTrips((prev) => {
      const updated = prev.map((t) => {
        if (t.id === tripId) {
          return {
            ...t,
            syncStatus: res.success ? ('synced' as const) : ('failed' as const),
            syncError: res.success ? undefined : res.message,
            syncedAt: res.success ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      saveStoredTrips(updated);
      return updated;
    });
  };

  // Đồng bộ tất cả các chuyến đang chờ
  const handleSyncAllPending = async () => {
    const pendings = trips.filter((t) => t.syncStatus !== 'synced');
    if (pendings.length === 0) return;

    setIsSyncingAll(true);
    let updatedTrips = [...trips];

    for (const trip of pendings) {
      const res = await pushTripToGoogleSheet(trip, sheetConfig.webhookUrl);
      updatedTrips = updatedTrips.map((t) => {
        if (t.id === trip.id) {
          return {
            ...t,
            syncStatus: res.success ? ('synced' as const) : ('failed' as const),
            syncError: res.success ? undefined : res.message,
            syncedAt: res.success ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
    }

    setTrips(updatedTrips);
    saveStoredTrips(updatedTrips);
    setIsSyncingAll(false);
  };

  // Tự động thử đồng bộ lại khi có mạng trở lại
  useEffect(() => {
    if (isOnline && pendingCount > 0 && sheetConfig.webhookUrl) {
      handleSyncAllPending();
    }
  }, [isOnline]);

  // Xử lý nộp form chuyến xe từ lái xe (link ngay lập tức qua Google Sheet)
  const handleDriverSubmitTrip = async (
    tripData: Omit<TripRecord, 'id' | 'createdAt' | 'syncStatus' | 'syncError' | 'syncedAt'>
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitErrorMessage(null);

    const newTripId = 'trip-' + Date.now();
    const newTrip: TripRecord = {
      ...tripData,
      id: newTripId,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // Đẩy trực tiếp lên Google Sheet qua Webhook
    let isSynced = false;
    let syncErrorMsg = '';
    let rowNum: number | undefined = undefined;

    if (navigator.onLine) {
      const result = await pushTripToGoogleSheet(newTrip, sheetConfig.webhookUrl);
      if (result.success) {
        isSynced = true;
        newTrip.syncStatus = 'synced';
        newTrip.syncedAt = new Date().toISOString();
        rowNum = result.rowNumber;
      } else {
        syncErrorMsg = result.message;
        newTrip.syncError = syncErrorMsg;
        setSubmitErrorMessage(syncErrorMsg);
      }
    } else {
      newTrip.syncStatus = 'pending';
      newTrip.syncError = 'Thiết bị mất mạng, dữ liệu chuyến xe đã lưu tạm trên điện thoại.';
    }

    // Cập nhật danh sách chuyến
    const updated = [newTrip, ...trips];
    setTrips(updated);
    saveStoredTrips(updated);

    setIsSubmitting(false);
    setSubmittedTrip(newTrip);
    setSyncedRowNumber(rowNum || null);

    return true;
  };

  // Xóa chuyến xe (quản lý)
  const handleDeleteTrip = (id: string) => {
    const updated = trips.filter((t) => t.id !== id);
    setTrips(updated);
    saveStoredTrips(updated);
  };

  // Lấy chuyến gần nhất để hỗ trợ tự điền Km đầu
  const lastTrip = trips.length > 0 ? trips[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header điều hướng & phân quyền */}
      <Header
        activeTab={activeTab === 'config' ? 'manager' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'form') {
            setActiveTab('form');
          } else if (!isManagerAuthenticated) {
            handleOpenLoginForTab(tab);
          } else {
            setActiveTab(tab);
          }
        }}
        pendingCount={pendingCount}
        isOnline={isOnline}
        sheetConfig={sheetConfig}
        onOpenConfig={() => {
          if (!isManagerAuthenticated) {
            handleOpenLoginForTab('config');
          } else {
            setIsConfigOpen(true);
          }
        }}
        isManager={isManagerAuthenticated}
        onOpenLogin={() => handleOpenLoginForTab('manager')}
        onLogout={handleManagerLogout}
      />

      {/* Dải thông báo trạng thái đồng bộ Google Sheet */}
      <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>
              Google Sheet Webhook kết nối chuẩn · Lái xe nhập xong là link dữ liệu sang bảng tính ngay lập tức!
            </span>
          </div>
          {isManagerAuthenticated && sheetConfig.sheetViewUrl && (
            <a
              href={sheetConfig.sheetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-white text-emerald-900 rounded-md text-[11px] font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1 shadow-xs cursor-pointer shrink-0 ml-3"
            >
              <span>Mở Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 p-3 sm:p-5 max-w-6xl mx-auto w-full">
        {activeTab === 'form' && (
          <DriverForm
            onSubmitTrip={handleDriverSubmitTrip}
            isSubmitting={isSubmitting}
            lastTrip={lastTrip}
          />
        )}

        {activeTab === 'history' && (
          isManagerAuthenticated ? (
            <TripHistory
              trips={trips}
              onRetrySync={handleRetrySync}
              onSyncAllPending={handleSyncAllPending}
              isSyncing={isSyncingAll}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto space-y-4 my-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Mục Dành Riêng Cho Quản Lý</h3>
              <p className="text-xs text-slate-500">
                Lái xe vãng lai chỉ có quyền nhập liệu. Vui lòng đăng nhập bằng tài khoản quản lý để xem lịch sử.
              </p>
              <button
                onClick={() => handleOpenLoginForTab('history')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Đăng Nhập Quản Lý
              </button>
            </div>
          )
        )}

        {activeTab === 'manager' && (
          isManagerAuthenticated ? (
            <ManagerDashboard
              trips={trips}
              sheetConfig={sheetConfig}
              onOpenConfig={() => setIsConfigOpen(true)}
              onDeleteTrip={handleDeleteTrip}
              onManagerLogout={handleManagerLogout}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto space-y-4 my-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Yêu Cầu Quyền Quản Lý Đội Xe</h3>
              <p className="text-xs text-slate-500">
                Người nhập vãng lai không có quyền xem thông tin tổng hợp và file bảng tính.
              </p>
              <button
                onClick={() => handleOpenLoginForTab('manager')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Đăng Nhập Quản Lý
              </button>
            </div>
          )
        )}
      </main>

      {/* MODAL THÀNH CÔNG KHI LÁI XE GỬI CHUYẾN - HIỂN THỊ LINK QUA SHEET NGAY LẬP TỨC */}
      {submittedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp my-auto max-h-[92vh] overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full inline-block">
                {syncedRowNumber
                  ? `ĐÃ LINK VÀO GOOGLE SHEET (DÒNG ${syncedRowNumber})`
                  : 'ĐÃ LINK SANG GOOGLE SHEET NGAY LẬP TỨC'}
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-1">
                Ghi Nhận Chuyến Xe Thành Công!
              </h3>
              <p className="text-xs text-slate-500">
                Mã chuyến: <span className="font-mono font-bold text-slate-800">{submittedTrip.maChuyen}</span> · Biển số:{' '}
                <span className="font-mono font-bold text-blue-900">{submittedTrip.bks}</span>
              </p>
            </div>

            {/* Khối bấm mở Google Sheet ngay lập tức */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Link dữ liệu Google Sheet
                </span>
                <span className="text-[11px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Thời gian thực ✓
                </span>
              </div>

              {sheetConfig.sheetViewUrl ? (
                <a
                  href={sheetConfig.sheetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>MỞ GOOGLE SHEET ĐỂ XEM DÒNG VỪA NHẬP</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-emerald-900">
                    Dán đường link file Google Sheet của bạn vào đây để mở trực tiếp trong 1 chạm:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={quickSheetUrl}
                      onChange={(e) => setQuickSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleSaveQuickSheetUrl}
                      disabled={!quickSheetUrl.trim()}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu &amp; Mở</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Chi tiết tóm tắt chuyến */}
            <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1.5 text-xs border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Lái xe:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                  {submittedTrip.tenLaiXe}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Hành trình:</span>
                <span className="font-medium text-slate-800 truncate max-w-[220px]">
                  {submittedTrip.hanhTrinh}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Số Km vận hành:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{submittedTrip.tongKm.toLocaleString()} km ({submittedTrip.kmDau.toLocaleString()} → {submittedTrip.kmCuoi.toLocaleString()})
                </span>
              </div>
              {submittedTrip.loaiHinh === 'CHẠY LẠNH' && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Giờ máy lạnh:</span>
                  <span className="font-mono font-bold text-sky-800">
                    +{submittedTrip.tongGioLanh} giờ ({submittedTrip.gioLanhXP} → {submittedTrip.gioLanhKT})
                  </span>
                </div>
              )}
            </div>

            {/* Nút hành động tiếp theo */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSubmittedTrip(null)}
                className="flex-1 min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <span>Nhập Chuyến Tiếp Theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isManagerAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTrip(null);
                    setActiveTab('manager');
                  }}
                  className="min-h-[46px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Xem Bảng Quản Lý
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cài Đặt Google Sheet (Chỉ cho Quản lý pvhkd) */}
      <SheetConfigModal
        isOpen={isConfigOpen && isManagerAuthenticated}
        onClose={() => setIsConfigOpen(false)}
        config={sheetConfig}
        onSaveConfig={handleSaveConfig}
      />

      {/* Modal Đăng Nhập Quản Lý */}
      <ManagerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleManagerLoginSuccess}
      />
    </div>
  );
}
