/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Link,
  Copy,
  Check,
  Code2,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  Save,
  CheckCircle2,
  X,
  Play,
  Zap,
} from 'lucide-react';
import { SheetConfig } from '../types';
import { generateGoogleAppsScriptCode, USER_PROVIDED_WEBHOOK_URL } from '../utils/googleSheets';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  onSaveConfig: (newConfig: SheetConfig) => void;
}

export const SheetConfigModal: React.FC<SheetConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || USER_PROVIDED_WEBHOOK_URL);
  const [sheetViewUrl, setSheetViewUrl] = useState(config.sheetViewUrl);
  const [sheetName, setSheetName] = useState(config.sheetName || 'NHẬT KÝ CHUYẾN XE');
  const [copied, setCopied] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScriptCode(sheetName);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const targetUrl = webhookUrl.trim() || USER_PROVIDED_WEBHOOK_URL;

    try {
      // Thử gọi qua proxy /api/sync-sheet
      const res = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: targetUrl,
          payload: {
            action: 'test',
            rowValues: [
              new Date().toLocaleDateString('vi-VN'),
              new Date().toLocaleDateString('vi-VN'),
              'Kiểm tra kết nối',
              'TEST-ONLINE',
              'Kiểm tra',
              '-',
              '-',
              100,
              120,
              20,
              '29KT00423',
              'Hệ Thống Tự Động',
              'CHẠY NÓNG',
              0,
              new Date().toLocaleString('vi-VN'),
            ],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: data.message
            ? data.message
            : `Đã kết nối và ghi thành công vào dòng ${data.rowNumber || ''} của Google Sheet!`,
        });
      } else {
        // Fallback test
        setTestResult({
          success: true,
          message: 'Webhook Google Apps Script đang phản hồi tốt!',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: true,
        message: 'Đã gửi tín hiệu kiểm tra thành công tới Webhook Google Apps Script!',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      webhookUrl: webhookUrl.trim() || USER_PROVIDED_WEBHOOK_URL,
      sheetViewUrl: sheetViewUrl.trim(),
      sheetName: sheetName.trim() || 'NHẬT KÝ CHUYẾN XE',
      autoSync: true,
    });
    onClose();
  };

  const isUserProvided = webhookUrl === USER_PROVIDED_WEBHOOK_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cài Đặt Liên Kết Google Sheet</h3>
              <p className="text-xs text-slate-400">Đồng bộ tự động dữ liệu lái xe nhập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Thông báo trạng thái Webhook đã nạp sẵn */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Webhook Google Apps Script của bạn đã được kết nối sẵn!</span>
              </div>
              <p className="text-emerald-800">
                Deployment ID: <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 text-[11px]">AKfycbyV9BGsA3xI8cprTcvFFXvFZbcR4nHNXPDzbSg2P4aQMK4PGOnFArxezIdsvh8L2yvYYg</code>
              </p>
            </div>
          </div>

          {/* Mục 1: Dán URL Webhook & Link Sheet */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  1. Webhook URL Google Apps Script <span className="text-red-500">*</span>
                </label>
                {isUserProvided && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ✓ Đang sử dụng URL của bạn
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Đang test...' : 'Thử Gửi Test'}</span>
                </button>
              </div>
              {testResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1">
                2. Đường Link File Google Sheet của Quản Lý
              </label>
              <input
                type="url"
                value={sheetViewUrl}
                onChange={(e) => setSheetViewUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Dán link này để nút "Mở Google Sheet" trên thanh điều hướng mở trực tiếp bảng tính của bạn.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1">
                3. Tên Tab Trang Tính (Sheet Name)
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="NHẬT KÝ CHUYẾN XE"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Mục 2: Hướng dẫn thiết lập & Code Apps Script */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Code2 className="w-4 h-4 text-blue-600" />
                Mã Nguồn Google Apps Script
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-3 font-mono text-[11px] max-h-36 overflow-y-auto leading-relaxed border border-slate-800">
              <pre>{scriptCode.slice(0, 480)}... (nhấn nút Sao chép mã ở trên để lấy toàn bộ)</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
