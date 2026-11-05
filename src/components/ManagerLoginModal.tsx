/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Shield, KeyRound, AlertCircle, X, Check, Eye, EyeOff } from 'lucide-react';

interface ManagerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const ManagerLoginModal: React.FC<ManagerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Kiểm tra thông tin đăng nhập đúng theo yêu cầu quản lý
    if (username.trim() === 'pvhkd' && password === 'vhkd@123') {
      localStorage.setItem('container_manager_authenticated', 'true');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('Tên đăng nhập (ID) hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Đăng Nhập Quản Lý</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Người dùng vãng lai (lái xe) chỉ được quyền nhập dữ liệu chuyến xe. Vui lòng đăng nhập để truy cập Bảng quản lý và Cấu hình Sheet.
        </p>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tài Khoản / ID Quản Lý:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Nhập ID tài khoản"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mật Khẩu Quản Lý:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Nhập mật khẩu quản lý"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Xác Thực Quản Lý</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
