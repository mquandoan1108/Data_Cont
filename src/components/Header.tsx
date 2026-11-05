/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Truck,
  FileSpreadsheet,
  History,
  Settings,
  ExternalLink,
  Wifi,
  WifiOff,
  LayoutDashboard,
  Lock,
  Unlock,
  ShieldCheck,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { SheetConfig } from '../types';

interface HeaderProps {
  activeTab: 'form' | 'history' | 'manager' | 'config';
  setActiveTab: (tab: 'form' | 'history' | 'manager' | 'config') => void;
  pendingCount: number;
  isOnline: boolean;
  sheetConfig: SheetConfig;
  onOpenConfig: () => void;
  isManager: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  isOnline,
  sheetConfig,
  onOpenConfig,
  isManager,
  onOpenLogin,
  onLogout,
}) => {
  const handleTabClick = (tab: 'form' | 'history' | 'manager' | 'config') => {
    if (tab === 'form') {
      setActiveTab('form');
      return;
    }

    // Nếu là mục quản lý hoặc cấu hình hoặc lịch sử mà chưa đăng nhập: Yêu cầu đăng nhập quản lý
    if (!isManager) {
      onOpenLogin();
      return;
    }

    if (tab === 'config') {
      onOpenConfig();
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
      {/* Top Bar Zone: 1-row layout */}
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">
              Nhật Ký Xe Container
            </h1>
            <p className="text-[11px] text-slate-300">
              Đội xe 27 đầu kéo · {isManager ? 'Chế độ Quản lý' : 'Dành cho Lái xe'}
            </p>
          </div>
        </div>

        {/* Network & Quick Actions Zone */}
        <div className="flex items-center gap-2">
          {/* Network status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
            }`}
            title={isOnline ? 'Đang kết nối Internet' : 'Ngoại tuyến (mất mạng)'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px]">Mất mạng</span>
              </>
            )}
          </div>

          {/* Manager Auth Button / Status */}
          {isManager ? (
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 hidden md:inline">pvhkd</span>
              <button
                onClick={onLogout}
                className="ml-1 p-0.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Khóa lại chế độ lái xe vãng lai"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Đăng nhập để vào mục Quản lý và Cấu hình Sheet"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Quản Lý</span>
            </button>
          )}

          {/* Quick open Google Sheet if manager has link */}
          {isManager && sheetConfig.sheetViewUrl && (
            <a
              href={sheetConfig.sheetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              title="Mở Google Sheet trên tab mới"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Mobile & Desktop) */}
      <div className="bg-slate-800 border-t border-slate-700/80 px-2 sm:px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-around sm:justify-start sm:gap-2">
          {/* TAB 1: NHẬP CHUYẾN (Công khai cho mọi người vãng lai & lái xe) */}
          <button
            onClick={() => handleTabClick('form')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Nhập Chuyến</span>
          </button>

          {/* TAB 2: LỊCH SỬ (Khóa nếu là người vãng lai) */}
          <button
            onClick={() => handleTabClick('history')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch Sử</span>
            {!isManager && <Lock className="w-3 h-3 text-slate-500" />}
            {pendingCount > 0 && isManager && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                {pendingCount}
              </span>
            )}
          </button>

          {/* TAB 3: QUẢN LÝ ĐỘI XE (Khóa nếu là người vãng lai) */}
          <button
            onClick={() => handleTabClick('manager')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manager'
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Quản Lý Đội Xe</span>
            {!isManager && <Lock className="w-3 h-3 text-slate-500" />}
          </button>

          {/* TAB 4: CẤU HÌNH SHEET (Khóa nếu là người vãng lai) */}
          <button
            onClick={() => handleTabClick('config')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden xs:inline">Cấu Hình</span> Sheet
            {!isManager && <Lock className="w-3 h-3 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
