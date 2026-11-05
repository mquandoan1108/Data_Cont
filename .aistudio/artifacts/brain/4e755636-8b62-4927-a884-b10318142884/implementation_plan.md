# Ứng Dụng Nhật Ký Vận Hành Chuyến Xe Container & Tự Động Đồng Bộ Google Sheet

Ứng dụng web di động tối ưu dành riêng cho lái xe container nhập liệu nhật trình chuyến xe nhanh chóng, tự động tính toán tổng số Km và giờ chạy lạnh, phát hiện lỗi nhập liệu tức thì, và tự động đẩy dữ liệu sang Google Sheet của người quản lý theo chuẩn mẫu cột đã định nghĩa.

> [!IMPORTANT]
> **Các quyết định thiết kế & cơ chế tích hợp Google Sheets:**
> - **Cơ chế đồng bộ Google Sheet**: Hỗ trợ 2 phương thức:
>   1. **Google Apps Script Web App (Khuyên dùng)**: Người lái xe không cần đăng nhập Google, mở link web app trên điện thoại và gửi dữ liệu trực tiếp vào Google Sheet của quản lý trong 1 giây. App cung cấp sẵn mẫu mã script và hướng dẫn 1-click để quản lý thiết lập trong 1 phút.
>   2. **Google Workspace Sheets API (OAuth)**: Dành cho quản lý kết nối trực tiếp tài khoản Google Workspace vào hệ thống để quản lý tệp bảng tính.
> - **Cấu trúc cột Google Sheet**: Tuân thủ chuẩn 100% hình ảnh 2 mà người quản lý đã cung cấp: `NGÀY XP`, `NGÀY KT`, `HÀNH TRÌNH`, `MÃ CHUYẾN`, `MẶT HÀNG`, `GIỜ LẠNH XP`, `GIỜ LẠNH KT`, `KM ĐẦU`, `KM CUỐI`, `TỔNG KM`, `BKS`, `TÊN LÁI XE`.
> - **Lưu trữ ngoại tuyến (Offline-First)**: Đảm bảo khi lái xe qua cung đường mất sóng 4G/5G, dữ liệu vẫn được lưu an toàn trên máy và tự động đồng bộ khi có mạng trở lại.

---

## 1. Tổng quan & Trải nghiệm cốt lõi

### Đối tượng sử dụng
1. **Lái xe Container (Người dùng chính)**: Thao tác chủ yếu trên điện thoại smartphone (màn hình cảm ứng), thường xuyên làm việc trong cabin xe, ngoài bãi container hoặc trên đường trường; cần giao diện nút bấm to, chữ rõ ràng, bàn phím số tự bật khi nhập Km/giờ, có kiểm tra hợp lệ tức thì để tránh bấm nhầm số km âm.
2. **Quản lý Đội xe**: Theo dõi tổng hợp km vận hành, giám sát chạy nóng/lạnh, mở file Google Sheet liên tục cập nhật real-time, kiểm tra lịch sử chuyến xe và thống kê theo từng đầu kéo trong 27 xe.

### Danh mục 27 Xe Đầu Kéo (Cấu hình sẵn từ Hình 1)
- `29KT00423`, `29KT00437`, `26H03708`, `15H30918`, `29K04802`, `89H07643`, `89H07665`
- `29K04410`, `29K04483`, `29K04302`, `29K04522`, `29K04835`, `89H07661`, `29K04689`
- `29E51730`, `29KT01992`, `29KT01987`, `29KT02008`, `29KT02000`, `29KT01984`, `29KT01990`
- `29KT01995`, `29KT01996`, `29KT01998`, `29KT02016`, `29KT02006`, `29KT02022`

---

## 2. Giao diện & Trải nghiệm người dùng (Mobile-First UX)

### Flow 1: Nhập Chuyến Mới (Cho Lái Xe)
```
┌────────────────────────────────────────────────────────┐
│ [Xe Cont 24/7]   Nhật Ký Chuyến Xe   [Trạng thái mạng] │
├────────────────────────────────────────────────────────┤
│ 1. BIỂN KIỂM SOÁT (BKS ĐẦU KÉO)                       │
│    [ Chọn từ 27 xe: 29KT00423, 29KT00437... ▾ ]        │
│                                                        │
│ 2. TÊN LÁI XE                                          │
│    [ Họ và tên lái chính (Lái 1)            ]          │
│    [ + Thêm lái phụ (nếu đi 2 lái)          ]          │
│                                                        │
│ 3. THÔNG TIN CHUYẾN XE                                 │
│    Ngày XP: [ dd/MM/yyyy ]   Ngày KT: [ dd/MM/yyyy ]   │
│    Hành trình: [ vd: Hải Phòng - Lào Cai    ]          │
│    Mã chuyến xe: [ vd: CX-2026-089          ]          │
│                                                        │
│ 4. LOẠI HÌNH & MẶT HÀNG                                │
│    [  ❄️ Chạy Lạnh  ]    [  ☀️ Chạy Nóng  ]            │
│    Mặt hàng: [ vd: Hoa quả xuất khẩu        ]          │
│    (Nếu chạy lạnh):                                    │
│    Giờ XP lạnh: [ 08:30 ]    Giờ KT lạnh: [ 17:00 ]    │
│    -> Tổng giờ lạnh: 8.5 giờ                           │
│                                                        │
│ 5. CHỈ SỐ KM VẬN HÀNH                                  │
│    Km đầu:  [  125000  ]                               │
│    Km cuối: [  125450  ]                               │
│    -------------------------------------------------   │
│    TỔNG KM: 450 km (Hợp lệ ✓)                          │
│    [ CẢNH BÁO nếu Km cuối < Km đầu: Số Km không thể âm]│
├────────────────────────────────────────────────────────┤
│ [ GỬI VỀ GOOGLE SHEET (Nút to 52px dễ bấm) ]           │
└────────────────────────────────────────────────────────┘
```

### Flow 2: Quản lý & Theo Dõi (Cho Quản Lý)
- Tab **Danh sách chuyến xe đã gửi**: Hiển thị bảng dữ liệu thời gian thực, lọc theo BKS, trạng thái đồng bộ (`Đã đồng bộ lên Sheet`, `Đang chờ gửi khi có mạng`).
- Tab **Cấu hình Google Sheet**: Cho phép dán link Google Sheet hoặc Webhook URL của Google Apps Script, nút "Kiểm tra kết nối", nút "Tạo cấu trúc bảng tính tự động".
- Nút **Mở trực tiếp Google Sheet**: Nhấn để mở ngay file Google Sheet trên trình duyệt hoặc app Google Sheets trên điện thoại.

### Nguyên tắc thiết kế (Frontend Design Standards)
- **Chuẩn Ergonomics di động**: Các ô nhập liệu có chiều cao $\ge 48\text{px}$, phông chữ to rõ ràng, các nút bấm CTA lớn dễ thao tác bằng ngón tay cái khi đang ngồi trên xe.
- **Bàn phím ảo tối ưu**: Thuộc tính `inputMode="numeric"` cho các trường Km, datepicker trực quan dạng lịch tiếng Việt kèm định dạng chuẩn `dd/MM/yyyy`.
- **Cảnh báo lỗi trực quan**: Khi `Km cuối < Km đầu`, trường Tổng Km chuyển màu đỏ cảnh báo kèm rung nhẹ (haptic feedback) và vô hiệu hóa nút gửi cho đến khi lái xe chỉnh lại.

---

## 3. Kiến trúc kỹ thuật & Dữ liệu

### Sơ đồ kiến trúc luồng dữ liệu
```
┌──────────────────────────────────────────────────────────────┐
│                  Giao Diện Ứng Dụng (React)                  │
│                                                              │
│  ┌──────────────────────┐        ┌────────────────────────┐  │
│  │ Form Nhập Cho Lái Xe │        │ Bảng Quản Lý & Nhật Ký │  │
│  └──────────┬───────────┘        └───────────▲────────────┘  │
│             │                                │               │
│             ▼                                │               │
│  ┌───────────────────────────────────────────┴────────────┐  │
│  │        Trình Quản Lý Dữ Liệu & Bộ Đệm Ngoại Tuyến      │  │
│  │   (Offline Sync Engine / LocalStorage / IndexedDB)     │  │
│  └──────────────────────┬─────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │
            Kiểm tra trạng thái mạng Online/Offline
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  Google Apps Script Webhook  │ │ Google Workspace Sheets API │
│  (Đẩy thẳng vào Sheet,       │ │ (Đồng bộ trực tiếp qua      │
│   không cần lái xe đăng nhập)│ │  tài khoản Google OAuth)    │
└──────────────┬───────────────┘ └──────────────┬──────────────┘
               │                                │
               ▼                                ▼
       ┌────────────────────────────────────────────────┐
       │     Google Sheet Quản Lý Đội Xe Container      │
       │ [NGÀY XP|NGÀY KT|HÀNH TRÌNH|MÃ CHUYẾN|MẶT HÀNG │
       │  GIỜ LẠNH XP|GIỜ LẠNH KT|KM ĐẦU|KM CUỐI|...   ] │
       └────────────────────────────────────────────────┘
```

### Chi tiết các trường dữ liệu theo đúng cột Google Sheet
| STT | Tên cột trên Google Sheet | Kiểu dữ liệu | Nguồn nhập | Quy tắc nghiệp vụ |
|---|---|---|---|---|
| 1 | `NGÀY XP` | Chuỗi (`dd/MM/yyyy`) | Lái xe chọn/nhập | Bắt buộc |
| 2 | `NGÀY KT` | Chuỗi (`dd/MM/yyyy`) | Lái xe chọn/nhập | Bắt buộc, $\ge$ Ngày XP |
| 3 | `HÀNH TRÌNH` | Chuỗi text | Lái xe nhập | Nơi đi - Nơi đến |
| 4 | `MÃ CHUYẾN` | Chuỗi text | Lái xe nhập | Mã chuyến điều độ cấp |
| 5 | `MẶT HÀNG` | Chuỗi text | Lái xe nhập | Loại hàng vận chuyển |
| 6 | `GIỜ LẠNH XP` | Giờ (`HH:mm`) | Lái xe nhập | Nếu chọn chạy lạnh |
| 7 | `GIỜ LẠNH KT` | Giờ (`HH:mm`) | Lái xe nhập | Nếu chọn chạy lạnh |
| 8 | `KM ĐẦU` | Số nguyên | Lái xe nhập | Đồng hồ công tơ mét xuất phát |
| 9 | `KM CUỐI` | Số nguyên | Lái xe nhập | Đồng hồ công tơ mét kết thúc |
| 10 | `TỔNG KM` | Số nguyên | Tự động tính | `= KM CUỐI - KM ĐẦU` (Cảnh báo nếu âm) |
| 11 | `BKS` | Chuỗi text | Dropdown | Chọn từ danh sách 27 xe |
| 12 | `TÊN LÁI XE` | Chuỗi text | Lái xe nhập | Họ tên đầy đủ (1 hoặc 2 lái) |
| 13 | `TỔNG GIỜ LẠNH` | Số thập phân | Tự động tính | `= GIỜ LẠNH KT - GIỜ LẠNH XP` |
| 14 | `LOẠI HÌNH` | Chuỗi | Lựa chọn | Chạy Lạnh / Chạy Nóng |

---

## 4. Kế hoạch triển khai chi tiết

1. **Giao diện Lái xe Mobile-First**:
   - Tích hợp sẵn danh sách chuẩn 27 Biển kiểm soát đầu kéo kèm thanh tìm kiếm nhanh.
   - Nhập liệu họ tên lái xe (chức năng thêm lái phụ tiện lợi).
   - Ô nhập Km đầu, Km cuối và logic tính Tổng Km tự động, hiển thị cảnh báo đỏ khi âm.
   - Bộ chọn Loại hình "Chạy nóng / Chạy lạnh" với các trường giờ lạnh tự động tính tổng số giờ lạnh.
   - Trực quan hóa nút bấm gửi to, trạng thái gửi, thông báo thành công.

2. **Cơ chế kết nối & đồng bộ Google Sheets**:
   - Tích hợp module kết nối Google Sheet qua Webhook Google Apps Script kèm mã nguồn mẫu một-click để người quản lý copy dán vào Sheet.
   - Hỗ trợ lưu trữ cấu hình Google Sheet URL cục bộ trên thiết bị của quản lý.
   - Hỗ trợ xem trực tiếp dữ liệu vừa nhập trên app và nút bấm mở ngay Google Sheet trên tab mới.

3. **Offline Sync & Lịch sử chuyến xe**:
   - Khi mất kết nối Internet, tự động đưa chuyến đi vào hàng đợi (Queue).
   - Tự động nhận diện mạng online trở lại và đẩy hàng loạt lên Google Sheet.
   - Tab "Lịch sử chuyến xe" cho phép lái xe xem lại các chuyến vừa nhập trong ngày/tuần.

4. **Trang Quản lý & Báo cáo nhanh**:
   - Bộ lọc theo xe, theo lái xe, theo khoảng ngày.
   - Thống kê nhanh tổng km chạy trong tuần/tháng, tổng giờ lạnh.
   - Xuất dữ liệu ra file Excel / CSV dự phòng.
