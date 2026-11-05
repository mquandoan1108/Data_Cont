/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  User,
  Calendar,
  MapPin,
  FileText,
  Package,
  Gauge,
  ThermometerSnowflake,
  SunMedium,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CONTAINER_TRUCKS, TripRecord } from '../types';
import {
  parseReeferTimeToMinutes,
  formatDateToVN,
  formatVNToDateInput,
} from '../utils/googleSheets';

interface DriverFormProps {
  onSubmitTrip: (trip: Omit<TripRecord, 'id' | 'createdAt' | 'syncStatus' | 'syncError' | 'syncedAt'>) => Promise<boolean>;
  isSubmitting: boolean;
  lastTrip?: TripRecord;
}

export const DriverForm: React.FC<DriverFormProps> = ({
  onSubmitTrip,
  isSubmitting,
  lastTrip,
}) => {
  // Biển kiểm soát
  const [bks, setBks] = useState<string>(CONTAINER_TRUCKS[0]);
  const [bksSearch, setBksSearch] = useState<string>('');
  const [isBksOpen, setIsBksOpen] = useState<boolean>(false);

  // Lái xe
  const [laiXe1, setLaiXe1] = useState<string>('');
  const [hasSecondDriver, setHasSecondDriver] = useState<boolean>(false);
  const [laiXe2, setLaiXe2] = useState<string>('');

  // Ngày xuất phát & kết thúc (mặc định hôm nay dd/MM/yyyy)
  const todayVN = useMemo(() => formatDateToVN(new Date()), []);
  const [ngayXP, setNgayXP] = useState<string>(todayVN);
  const [ngayKT, setNgayKT] = useState<string>(todayVN);

  // Thông tin chuyến
  const [hanhTrinh, setHanhTrinh] = useState<string>('');
  const [maChuyen, setMaChuyen] = useState<string>('');
  const [matHang, setMatHang] = useState<string>('');

  // Loại hình: Chạy nóng / Chạy lạnh
  const [loaiHinh, setLoaiHinh] = useState<'CHẠY LẠNH' | 'CHẠY NÓNG'>('CHẠY NÓNG');
  const [gioLanhXP, setGioLanhXP] = useState<string>('');
  const [gioLanhKT, setGioLanhKT] = useState<string>('');

  // Km
  const [kmDau, setKmDau] = useState<string>('');
  const [kmCuoi, setKmCuoi] = useState<string>('');
  const [ghiChu, setGhiChu] = useState<string>('');

  // Tự động điền Km đầu nếu xe vừa có chuyến trước đó
  useEffect(() => {
    if (lastTrip && lastTrip.bks === bks && !kmDau) {
      setKmDau(String(lastTrip.kmCuoi));
    }
  }, [bks, lastTrip, kmDau]);

  // Danh sách xe lọc theo tìm kiếm
  const filteredTrucks = useMemo(() => {
    if (!bksSearch.trim()) return CONTAINER_TRUCKS;
    const query = bksSearch.trim().toUpperCase();
    return CONTAINER_TRUCKS.filter((t) => t.includes(query));
  }, [bksSearch]);

  // Tính toán Tổng Km (giống Odo)
  const kmDauNum = kmDau.trim() === '' ? NaN : Number(kmDau);
  const kmCuoiNum = kmCuoi.trim() === '' ? NaN : Number(kmCuoi);
  const hasBothKm = !isNaN(kmDauNum) && !isNaN(kmCuoiNum);
  const tongKm = hasBothKm ? kmCuoiNum - kmDauNum : 0;
  const isKmNegative = hasBothKm && tongKm < 0;

  // Tính toán Tổng Giờ Lạnh dạng giờ:phút lũy kế xe container (ví dụ: 4123:12 và 4124:00)
  const gioLanhXPMinutes = useMemo(() => parseReeferTimeToMinutes(gioLanhXP), [gioLanhXP]);
  const gioLanhKTMinutes = useMemo(() => parseReeferTimeToMinutes(gioLanhKT), [gioLanhKT]);
  const hasBothGioLanh = gioLanhXPMinutes !== null && gioLanhKTMinutes !== null;

  const diffGioLanhMinutes = useMemo(() => {
    if (!hasBothGioLanh || gioLanhXPMinutes === null || gioLanhKTMinutes === null) return 0;
    return gioLanhKTMinutes - gioLanhXPMinutes;
  }, [hasBothGioLanh, gioLanhXPMinutes, gioLanhKTMinutes]);

  const isGioLanhNegative = loaiHinh === 'CHẠY LẠNH' && hasBothGioLanh && diffGioLanhMinutes < 0;

  // Tổng số giờ dạng số thập phân (làm tròn 2 chữ số, ví dụ 0.8 giờ hoặc 7.5 giờ)
  const tongGioLanh = useMemo(() => {
    if (loaiHinh !== 'CHẠY LẠNH') return 0;
    if (!hasBothGioLanh || isGioLanhNegative) return 0;
    return Math.round((diffGioLanhMinutes / 60) * 100) / 100;
  }, [loaiHinh, hasBothGioLanh, isGioLanhNegative, diffGioLanhMinutes]);

  // Chuỗi hiển thị giờ:phút trực quan (ví dụ: "48 phút" hoặc "1 giờ 15 phút")
  const diffGioLanhText = useMemo(() => {
    if (!hasBothGioLanh || isGioLanhNegative || diffGioLanhMinutes <= 0) return '';
    const h = Math.floor(diffGioLanhMinutes / 60);
    const m = diffGioLanhMinutes % 60;
    if (h === 0) return `${m} phút`;
    if (m === 0) return `${h} giờ`;
    return `${h} giờ ${m < 10 ? '0' + m : m}p`;
  }, [hasBothGioLanh, isGioLanhNegative, diffGioLanhMinutes]);

  // Tổng hợp tên lái xe
  const tenLaiXeTongHop = useMemo(() => {
    const l1 = laiXe1.trim();
    const l2 = laiXe2.trim();
    if (hasSecondDriver && l2) {
      return `${l1} / ${l2}`;
    }
    return l1;
  }, [laiXe1, laiXe2, hasSecondDriver]);

  // Kiểm tra tính hợp lệ
  const formValidation = useMemo(() => {
    const errors: string[] = [];
    if (!bks) errors.push('Vui lòng chọn Biển kiểm soát');
    if (!laiXe1.trim()) errors.push('Vui lòng nhập Họ tên lái xe 1');
    if (hasSecondDriver && !laiXe2.trim()) errors.push('Vui lòng nhập Họ tên lái xe 2');
    if (!ngayXP.trim()) errors.push('Vui lòng chọn Ngày xuất phát');
    if (!ngayKT.trim()) errors.push('Vui lòng chọn Ngày kết thúc');
    if (!hanhTrinh.trim()) errors.push('Vui lòng nhập Hành trình chuyến đi');
    if (!maChuyen.trim()) errors.push('Vui lòng nhập Mã chuyến xe trên VTMan');
    if (!matHang.trim()) errors.push('Vui lòng nhập Mặt hàng vận chuyển');
    if (isNaN(kmDauNum)) errors.push('Vui lòng nhập Km đầu');
    if (isNaN(kmCuoiNum)) errors.push('Vui lòng nhập Km cuối');
    if (isKmNegative) errors.push('Km cuối phải lớn hơn hoặc bằng Km đầu (Tổng Km không được âm)');
    if (loaiHinh === 'CHẠY LẠNH') {
      if (!gioLanhXP.trim() || gioLanhXPMinutes === null) {
        errors.push('Vui lòng nhập Giờ lạnh bắt đầu theo định dạng giờ:phút (ví dụ: 4123:12)');
      }
      if (!gioLanhKT.trim() || gioLanhKTMinutes === null) {
        errors.push('Vui lòng nhập Giờ lạnh kết thúc theo định dạng giờ:phút (ví dụ: 4124:00)');
      }
      if (isGioLanhNegative) {
        errors.push(`Giờ lạnh kết thúc (${gioLanhKT}) phải lớn hơn hoặc bằng Giờ lạnh bắt đầu (${gioLanhXP})`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [
    bks,
    laiXe1,
    laiXe2,
    hasSecondDriver,
    ngayXP,
    ngayKT,
    hanhTrinh,
    maChuyen,
    matHang,
    kmDauNum,
    kmCuoiNum,
    isKmNegative,
    loaiHinh,
    gioLanhXP,
    gioLanhKT,
    gioLanhXPMinutes,
    gioLanhKTMinutes,
    isGioLanhNegative,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValidation.isValid) return;

    const success = await onSubmitTrip({
      bks,
      tenLaiXe: tenLaiXeTongHop,
      laiXe1: laiXe1.trim(),
      laiXe2: hasSecondDriver ? laiXe2.trim() : undefined,
      ngayXP,
      ngayKT,
      hanhTrinh: hanhTrinh.trim(),
      maChuyen: maChuyen.trim().toUpperCase(),
      matHang: matHang.trim(),
      loaiHinh,
      gioLanhXP: loaiHinh === 'CHẠY LẠNH' ? gioLanhXP.trim() : '',
      gioLanhKT: loaiHinh === 'CHẠY LẠNH' ? gioLanhKT.trim() : '',
      tongGioLanh,
      kmDau: kmDauNum,
      kmCuoi: kmCuoiNum,
      tongKm,
      ghiChu: ghiChu.trim() || undefined,
    });

    if (success) {
      // Reset các trường cần nhập lại cho chuyến mới
      setMaChuyen('');
      setHanhTrinh('');
      setKmDau(String(kmCuoiNum)); // Km cuối chuyến trước tự làm Km đầu chuyến sau
      setKmCuoi('');
      setGioLanhXP(loaiHinh === 'CHẠY LẠNH' && gioLanhKT.trim() ? gioLanhKT.trim() : '');
      setGioLanhKT('');
      setGhiChu('');
    }
  };

  // Nhanh: Điền ngày hôm nay
  const setTodayDates = () => {
    const today = formatDateToVN(new Date());
    setNgayXP(today);
    setNgayKT(today);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Banner hướng dẫn lái xe */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
            Dành cho Lái Xe Container
          </span>
          <h2 className="text-lg font-bold">Nhập Nhật Ký Chuyến Xe Mới</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Dữ liệu sẽ tự động đẩy sang Google Sheet của điều độ ngay sau khi gửi.
          </p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <Truck className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* KHỐI 1: BIỂN KIỂM SOÁT ĐẦU KÉO */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Biển Kiểm Soát Đầu Kéo <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">27 xe container</span>
        </div>

        {/* Custom BKS Dropdown / Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBksOpen(!isBksOpen)}
            className="w-full min-h-[50px] px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-300 focus:border-blue-600 rounded-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-bold font-mono text-base tracking-wide border border-blue-200">
                {bks}
              </span>
              <span className="text-xs text-slate-500">Nhấn để đổi xe khác</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isBksOpen ? 'rotate-180' : ''}`} />
          </button>

          {isBksOpen && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-3 max-h-72 overflow-y-auto">
              <div className="sticky top-0 bg-white pb-2">
                <input
                  type="text"
                  value={bksSearch}
                  onChange={(e) => setBksSearch(e.target.value)}
                  placeholder="Gõ tìm nhanh biển số..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {filteredTrucks.map((plate) => (
                  <button
                    key={plate}
                    type="button"
                    onClick={() => {
                      setBks(plate);
                      setIsBksOpen(false);
                      setBksSearch('');
                    }}
                    className={`py-2 px-3 text-center rounded-lg font-mono font-bold text-sm transition-all ${
                      bks === plate
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {plate}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KHỐI 2: TÊN LÁI XE (HỖ TRỢ 1 HOẶC 2 LÁI) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Họ Tên Lái Xe <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setHasSecondDriver(!hasSecondDriver)}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              hasSecondDriver
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {hasSecondDriver ? 'Chạy 2 Lái (Đã bật)' : '+ Thêm Lái Phụ'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">
              Lái chính (Lái 1) - Yêu cầu nhập đầy đủ họ và tên:
            </span>
            <input
              type="text"
              required
              value={laiXe1}
              onChange={(e) => setLaiXe1(e.target.value)}
              placeholder="ví dụ: Nguyễn Văn Hùng"
              className="w-full min-h-[48px] px-3.5 py-2.5 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
          </div>

          {hasSecondDriver && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 animate-fadeIn">
              <span className="text-xs text-blue-900 font-semibold block">
                Lái phụ (Lái 2) - Yêu cầu nhập đầy đủ họ và tên:
              </span>
              <input
                type="text"
                required={hasSecondDriver}
                value={laiXe2}
                onChange={(e) => setLaiXe2(e.target.value)}
                placeholder="ví dụ: Trần Quốc Toản"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-sm sm:text-base bg-white border border-blue-300 rounded-xl focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          {/* Preview tên lái xe hiển thị trên Google Sheet */}
          {tenLaiXeTongHop && (
            <div className="text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="font-semibold text-slate-700">Tên xuất Google Sheet:</span>
              <span className="font-bold text-blue-800">{tenLaiXeTongHop}</span>
            </div>
          )}
        </div>
      </div>

      {/* KHỐI 3: THỜI GIAN & HÀNH TRÌNH CHUYẾN XE */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Thời Gian & Tuyến Đường <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={setTodayDates}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Hôm nay ({todayVN})
          </button>
        </div>

        {/* Ngày xuất phát & Ngày kết thúc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              NGÀY XUẤT PHÁT (dd/MM/yyyy):
            </span>
            <input
              type="text"
              required
              value={ngayXP}
              onChange={(e) => setNgayXP(e.target.value)}
              placeholder="dd/MM/yyyy (vd: 30/10/2026)"
              className="w-full min-h-[48px] px-3.5 py-2 text-sm sm:text-base font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={formatVNToDateInput(ngayXP)}
                onChange={(e) => {
                  if (e.target.value) setNgayXP(formatDateToVN(e.target.value));
                }}
                className="text-xs text-slate-500 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Chọn lịch nhanh</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">
              NGÀY KẾT THÚC (dd/MM/yyyy):
            </span>
            <input
              type="text"
              required
              value={ngayKT}
              onChange={(e) => setNgayKT(e.target.value)}
              placeholder="dd/MM/yyyy (vd: 30/10/2026)"
              className="w-full min-h-[48px] px-3.5 py-2 text-sm sm:text-base font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={formatVNToDateInput(ngayKT)}
                onChange={(e) => {
                  if (e.target.value) setNgayKT(formatDateToVN(e.target.value));
                }}
                className="text-xs text-slate-500 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Chọn lịch nhanh</span>
            </div>
          </div>
        </div>

        {/* Hành trình & Mã chuyến xe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              HÀNH TRÌNH CHUYẾN XE:
            </span>
            <input
              type="text"
              required
              value={hanhTrinh}
              onChange={(e) => setHanhTrinh(e.target.value)}
              placeholder="ví dụ: Hải Phòng - Lào Cai"
              className="w-full min-h-[48px] px-3.5 py-2 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              MÃ CHUYẾN XE (VTMAN):
            </span>
            <input
              type="text"
              required
              value={maChuyen}
              onChange={(e) => setMaChuyen(e.target.value)}
              placeholder="Mã chuyến xe trên VTMan"
              className="w-full min-h-[48px] px-3.5 py-2 text-sm sm:text-base font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KHỐI 4: CHẠY NÓNG / CHẠY LẠNH & MẶT HÀNG */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Loại Hình Chạy &amp; Mặt Hàng <span className="text-red-500">*</span>
          </label>
        </div>

        {/* Segmented Buttons: Chạy Nóng / Chạy Lạnh */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setLoaiHinh('CHẠY NÓNG')}
            className={`min-h-[46px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              loaiHinh === 'CHẠY NÓNG'
                ? 'bg-white text-amber-700 shadow-sm border border-amber-200/80 ring-1 ring-amber-400/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SunMedium className="w-4 h-4 text-amber-500" />
            <span>Chạy Nóng</span>
          </button>

          <button
            type="button"
            onClick={() => setLoaiHinh('CHẠY LẠNH')}
            className={`min-h-[46px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              loaiHinh === 'CHẠY LẠNH'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ThermometerSnowflake className="w-4 h-4" />
            <span>Chạy Lạnh</span>
          </button>
        </div>

        {/* Mặt hàng */}
        <div>
          <span className="text-xs font-semibold text-slate-700 block mb-1">
            MẶT HÀNG VẬN CHUYỂN:
          </span>
          <input
            type="text"
            required
            value={matHang}
            onChange={(e) => setMatHang(e.target.value)}
            placeholder="ví dụ: Sầu riêng đông lạnh, Thịt bò, Nông sản..."
            className="w-full min-h-[48px] px-3.5 py-2 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* KHỐI: ĐỒNG HỒ GIỜ LẠNH - ĐỊNH DẠNG GIỜ:PHÚT LŨY KẾ XE CONTAINER (Chỉ hiện khi chọn Chạy Lạnh) */}
      {loaiHinh === 'CHẠY LẠNH' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-sky-300 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 uppercase">
              <Gauge className="w-4 h-4 text-sky-700" />
              Chỉ số đồng hồ giờ lạnh (lũy kế giờ:phút)
            </span>
            {hasBothGioLanh && !isGioLanhNegative && (
              <span className="text-xs font-mono font-bold text-sky-900 bg-sky-200/90 px-2.5 py-1 rounded-lg">
                Tổng giờ lạnh: {tongGioLanh} giờ {diffGioLanhText ? `(${diffGioLanhText})` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-sky-900 font-bold block mb-1">
                Giờ lạnh bắt đầu
              </span>
              <input
                type="text"
                required={loaiHinh === 'CHẠY LẠNH'}
                value={gioLanhXP}
                onChange={(e) => setGioLanhXP(e.target.value)}
                placeholder="ví dụ: 4123:12"
                className="w-full min-h-[50px] px-3.5 py-2 font-mono text-lg font-bold bg-slate-50 border-2 border-sky-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none tabular-nums"
              />
              <p className="text-[11px] text-sky-700 mt-1">
                Đồng hồ khi bắt đầu chuyến (định dạng giờ:phút, vd: 4123:12)
              </p>
            </div>

            <div>
              <span className="text-xs text-sky-900 font-bold block mb-1">
                Giờ lạnh kết thúc
              </span>
              <input
                type="text"
                required={loaiHinh === 'CHẠY LẠNH'}
                value={gioLanhKT}
                onChange={(e) => setGioLanhKT(e.target.value)}
                placeholder="ví dụ: 4124:00"
                className={`w-full min-h-[50px] px-3.5 py-2 font-mono text-lg font-bold bg-slate-50 border-2 rounded-xl focus:bg-white focus:outline-none tabular-nums transition-colors ${
                  isGioLanhNegative
                    ? 'border-red-500 bg-red-50 text-red-950 focus:border-red-600'
                    : 'border-sky-300 focus:border-blue-600'
                }`}
              />
              <p className="text-[11px] text-sky-700 mt-1">
                Đồng hồ khi kết thúc chuyến (định dạng giờ:phút, vd: 4124:00)
              </p>
            </div>
          </div>

          {/* Hiển thị tính toán Tổng giờ lạnh giống như ODO Km */}
          {isGioLanhNegative ? (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 font-medium">
              ⚠️ Giờ lạnh kết thúc ({gioLanhKT}) nhỏ hơn Giờ lạnh bắt đầu ({gioLanhXP}). Tổng giờ lạnh không được âm!
            </div>
          ) : hasBothGioLanh ? (
            <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tổng giờ máy lạnh chạy: <strong className="font-mono text-sm text-blue-900">{tongGioLanh} giờ</strong>
                  {diffGioLanhText && <span className="ml-1.5 text-slate-600 font-semibold">({diffGioLanhText})</span>}
                </span>
              </div>
              <span className="font-mono text-sky-700 text-[11px]">
                = {gioLanhKT} - {gioLanhXP} ({diffGioLanhMinutes} phút)
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-sky-800 bg-sky-50/50 p-2 rounded-lg border border-sky-200/60">
              💡 Nhập chỉ số đồng hồ giờ lạnh lũy kế xe container (ví dụ: bắt đầu <strong>4123:12</strong>, kết thúc <strong>4124:00</strong>). Hệ thống sẽ tự động trừ và tính ra tổng thời gian máy chạy.
            </div>
          )}
        </div>
      )}

      {/* KHỐI 5: ĐỒNG HỒ CÔNG TƠ MÉT (KM ĐẦU - KM CUỐI - TỔNG KM) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            Chỉ Số Đồng Hồ Km Vận Hành <span className="text-red-500">*</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              KM ĐẦU (Công tơ mét khi xuất phát):
            </span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={kmDau}
              onChange={(e) => setKmDau(e.target.value)}
              placeholder="ví dụ: 125000"
              className="w-full min-h-[50px] px-3.5 py-2 text-lg font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none tabular-nums"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              KM CUỐI (Công tơ mét khi kết thúc):
            </span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={kmCuoi}
              onChange={(e) => setKmCuoi(e.target.value)}
              placeholder="ví dụ: 125450"
              className={`w-full min-h-[50px] px-3.5 py-2 text-lg font-mono font-bold bg-slate-50 border-2 rounded-xl focus:bg-white focus:outline-none tabular-nums transition-colors ${
                isKmNegative
                  ? 'border-red-500 bg-red-50/50 text-red-950 focus:border-red-600'
                  : 'border-slate-300 focus:border-blue-600'
              }`}
            />
          </div>
        </div>

        {/* HIỂN THỊ TỔNG KM VÀ CẢNH BÁO ÂM NỔI BẬT */}
        <div className="pt-2">
          {isKmNegative ? (
            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl space-y-2 animate-bounceOnce">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>CẢNH BÁO: LÁI XE NHẬP SAI SỐ KM!</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Km cuối (<span className="font-mono font-bold">{kmCuoiNum.toLocaleString()}</span>) đang 
                <span className="font-bold underline"> nhỏ hơn</span> Km đầu (<span className="font-mono font-bold">{kmDauNum.toLocaleString()}</span>).
                Tổng km ra số âm (<span className="font-mono font-bold text-red-600">{tongKm.toLocaleString()} km</span>).
                Vui lòng kiểm tra lại đồng hồ công tơ mét trước khi gửi!
              </p>
            </div>
          ) : hasBothKm ? (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Tổng Km Vận Hành (Hợp lệ)
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-950 tracking-tight">
                    {tongKm.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-emerald-700">km</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-700 font-mono hidden sm:block">
                = {kmCuoiNum.toLocaleString()} - {kmDauNum.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
              Nhập Km đầu và Km cuối để hệ thống tự động tính Tổng Km chuyến xe
            </div>
          )}
        </div>

        {/* Ghi chú thêm nếu có */}
        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Ghi chú phát sinh (nếu có):
          </span>
          <input
            type="text"
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="ví dụ: Chờ bốc dỡ 3 tiếng, kẹt phà..."
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* CẢNH BÁO VALIDATION TỔNG QUÁT NẾU CÓ LỖI */}
      {!formValidation.isValid && formValidation.errors.length > 0 && kmCuoi && kmDau && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Vui lòng hoàn thành các thông tin sau:
          </span>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-amber-800">
            {formValidation.errors.slice(0, 3).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* NÚT GỬI LỚN DI ĐỘNG (MIN HEIGHT 54PX) */}
      <div className="sticky bottom-3 z-20 pt-2 space-y-1.5">
        <div className="text-center">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            API Google Sheet kết nối chuẩn · Cập nhật ngay vào tab &ldquo;NHẬT KÝ CHUYẾN XE&rdquo;
          </span>
        </div>
        <button
          type="submit"
          disabled={!formValidation.isValid || isSubmitting}
          className={`w-full min-h-[54px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
            formValidation.isValid && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/30'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang link trực tiếp vào Google Sheet...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>GỬI DỮ LIỆU CHUYẾN XE VỀ GOOGLE SHEET</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
