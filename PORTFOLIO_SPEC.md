```markdown
# PORTFOLIO_SPEC.md
## Đặc tả kỹ thuật chi tiết – Portfolio Manager SPA

---

## 1. Overview & Goals

**Mục tiêu dự án:** Xây dựng ứng dụng web SPA (React + Vite + TypeScript + Supabase) quản lý danh mục đầu tư tài chính cá nhân đa tài sản (DCDS, ETF, Stock, Crypto, Bank, Cash). Ứng dụng giúp theo dõi tài sản thực tế, hạch toán giao dịch, phân tích chiến lược Trade T+ để hạ giá vốn vị thế, và mô phỏng các kịch bản đầu tư tương lai (Simulator). Hệ thống đảm bảo tính nhất quán dữ liệu tuyệt đối bằng Replay Engine và tối ưu trải nghiệm trên cả Desktop và Mobile (360px - 430px).

**Kiến trúc hệ thống & Chi phí:** 
* Client: React + Vite + TypeScript + Tailwind CSS.
* Backend: Supabase (PostgreSQL, Auth, Edge Functions).
* Deployment: Vercel / Cloudflare Pages (Tối ưu chi phí vận hành 0đ).

---

## 2. Scope & Core Business Rules

### 2.1. Thứ tự Hiển thị Danh mục cố định
Toàn bộ giao diện Dashboard, danh sách Tab và Navigation bắt buộc tuân theo thứ tự phân bổ:
$$\text{DCDS} \longrightarrow \text{ETF} \longrightarrow \text{Stock} \longrightarrow \text{Crypto} \longrightarrow \text{Bank} \longrightarrow \text{Cash}$$

### 2.2. Quy tắc Vốn gốc (Original Capital) & Giá vốn
1. **Original Capital (Dashboard):** 
   * Đổi tên chính thức thành **Original Capital** để tránh nhầm lẫn.
   * Công thức: $\text{Original Capital} = \text{Tổng Deposit} - \text{Tổng Withdrawal}$.
   * Đại diện cho "tiền tươi thóc thật" nạp vào hệ thống. **Không** cộng dồn P&L, lãi bank, cổ tức hay lợi nhuận T+. Chuyển khoản nội bộ (Internal transfer) không làm thay đổi Original Capital.
2. **Giá vốn điều chỉnh T+ (T+ Adjusted Cost Basis):**
   * Là chỉ số quản trị vị thế riêng của từng mã cổ phiếu/token.
   * Công thức:
     $$\text{Giá vốn mới} = \frac{\text{Tổng chi phí mua cổ phiếu gốc} - \text{Tổng lợi nhuận T+ ròng tích lũy}}{\text{Số lượng cổ phiếu gốc còn lại}}$$
   * Trong đó: $\text{Tổng chi phí mua gốc} = \text{Số lượng gốc} \times \text{Giá vốn gốc ban đầu}$.
   * Giao dịch T+ không làm thay đổi Original Capital tiền mặt trên Dashboard.

### 2.3. Phân tách độc lập VPS & SSI
* **Stock VPS** và **Stock SSI** là hai tài khoản hoàn toàn độc lập về Holdings, Cash, Average Cost, P&L và T+ matching.
* Tuyệt đối **không match T+ chéo** giữa VPS và SSI.
* Hiển thị Dashboard: $\text{Total Stock} = \text{VPS} + \text{SSI}$. Cung cấp bộ lọc: `All` / `VPS` / `SSI`.

---

## 3. Module Specification

### 3.1. Quản lý Giao dịch Ngân hàng (Bank Module - VietinBank CTG)

* **Nguồn tiền (Funding Source):** Khoản gửi Bank được trích chuyển từ **Cash hiện có** (Internal Transfer), không tạo ra giao dịch Deposit mới.
* **Các trường thông tin thu thập Form:**
  * `bank_name` (string): Mặc định `"VietinBank"`.
  * `deposit_amount` (numeric): Số tiền gửi (VNĐ).
  * `start_date` (date/timestamp): Ngày bắt đầu gửi.
  * `term_months` (integer): Kỳ hạn gửi (tháng: 1, 3, 6, 12...).
  * `interest_rate_pct` (numeric): Lãi suất (%/năm, VD: 5.5).
  * `auto_rollover` (boolean): Có tự động tái tục hay không (Mặc định: `true`).

* **Công thức tính Lãi tiết kiệm VietinBank:**
  $$\text{Tiền lãi 1 kỳ} = \frac{\text{Số tiền gửi} \times \text{Lãi suất (\%)} \times \text{Số ngày thực tế của kỳ}}{365}$$

* **Cơ chế Tái tục In-Place (In-Place Rollover Engine):**
  * Không tạo record giao dịch mới mỗi lần đáo hạn để tránh rác DB.
  * Khi đến/qua ngày đáo hạn, Replay Engine quét và cập nhật trực tiếp trên bản ghi cũ:
    * $\text{accumulated\_interest}_{\text{mới}} = \text{accumulated\_interest}_{\text{cũ}} + \text{Lãi kỳ vừa xong}$
    * $\text{renewal\_count} = \text{renewal\_count} + 1$
    * $\text{start\_date}_{\text{mới}} = \text{end\_date}_{\text{cũ}}$
    * $\text{end\_date}_{\text{mới}} = \text{start\_date}_{\text{mới}} + \text{term\_months}$

* **Cơ chế Nhắc nhở & Lãi suất Tái tục (5-Day Reminder & Fallback Rate):**
  * Khi $\text{days\_remaining} \le 5$, UI hiển thị Banner: *"Tiền gửi Bank còn X ngày - Lãi suất kỳ tái tục:"* [Input Rate].
  * **Nếu chưa nhập lãi mới:** Tạm thời sử dụng lại `interest_rate_pct` của kỳ trước (Fallback rate) và gắn nhãn trạng thái `Chưa nhập lãi suất kỳ này`.
  * **Khi nhập bổ sung:** Cập nhật rate mới cho kỳ hiện tại và tính toán lại, **không làm thay đổi** số tiền lãi của các kỳ lịch sử đã hoàn thành.

---

### 3.2. Trade T+ Module & Partial Matching

* **Hiển thị Card T+:**
  * Cột Giá vốn hiển thị dạng: `Giá T+ / Giá vốn gốc` (VD: `28.2 / 30.0`).
  * Số lượng hiển thị dạng: `Số lượng T+ Open / Số lượng gốc` (VD: `200 / 1000`).
* **Partial T+ & Manual Matching:**
  * Mỗi lần thực hiện BÁN (SELL) T+ sẽ tạo ra một **Cycle T+ MỚI độc lập** (có Sell Date, Sell Price, P&L ròng chốt lời/lỗ riêng).
  * Lệnh BÁN T+ cho phép người dùng **tích chọn thủ công (Manual Matching)** từ danh sách các lệnh BUY T+ đang `OPEN` tương ứng. Không dùng thuật toán tự động FIFO/LIFO.
* **Mua thêm T+:** Khi bấm nút **BUY** trên Card T+ đang mở, hệ thống **luôn tạo một Cycle/Lệnh Mua T+ mới độc lập** để giữ chính xác mốc T+0.

---

### 3.3. DCDS Module

* Form nhập liệu: Thu thập **Số tiền** ($\text{VND}$) và **Giá CCQ**.
* Trường **Số CCQ** là Read-only, tự động tính theo công thức:
  $$\text{Số CCQ} = \frac{\text{Số tiền}}{\text{Giá mua}}$$
* Kết quả Số CCQ được làm tròn đúng **4 chữ số thập phân** (`roundTo4`).

---

### 3.4. Simulator Module

* Độc lập hoàn toàn 100% với Portfolio thật.
* Cho phép mô phỏng DCA, Future Value, Lãi kép, Stress Test.
* Tuyệt đối **không mutate** hay làm thay đổi Holdings, Cash, Dashboard hay T+ của Portfolio thật.

---

## 4. Cấu hình Phí & Thuế (Fee & Tax Settings)

* **Cài đặt tập trung (Settings Page):** Hệ thống cung cấp giao diện riêng để cấu hình tỷ lệ Phí & Thuế mặc định độc lập cho từng tài khoản và phân hệ:
  * **VPS Stock:** Phí mua/bán (%) và Thuế bán (%) riêng.
  * **SSI Stock:** Phí mua/bán (%) và Thuế bán (%) riêng.
  * **Crypto:** Phí giao dịch (%) và Thuế (0%).
  * **DCDS / ETF:** Khung phí/thuế tương ứng.
* **Áp dụng linh hoạt:** Form giao dịch tự động lấy tỷ lệ mặc định từ Cài đặt nhưng vẫn cho phép **chỉnh sửa thủ công trực tiếp** trên Form.

---

## 5. Đơn vị Giá trị & Tỷ giá USD Lịch sử (Locked Rates)

### 5.1. Đơn vị Lưu trữ (Base Unit)
* Database (Supabase) luôn lưu trữ giá trị nguyên bản theo đơn vị chuẩn:
  * VNĐ: Lưu số nguyên đầy đủ (VD: nhập `13.5` $\rightarrow$ DB lưu `13500`).
  * Crypto / USD: Lưu số thực chuẩn (VD: `65000.50`).
* UI hỗ trợ nhập rút gọn (gõ `13.5` tự convert thành `13,500`).

### 5.2. Tỷ giá USD/VND & API Tra cứu
* **Nút "Cập nhật giá" (Header):** Gọi API tỷ giá USD/VND miễn phí (`ExchangeRate-API` hoặc tương đương) đồng thời với việc làm mới Giá thị trường tài sản.
* **Khóa Tỷ giá Lịch sử (Locked USD Rate):**
  * Với các lệnh **ĐÃ BÁN (Chốt lời/lỗ / Closed)**: Tỷ giá USD/VND được **khóa cố định** tại thời điểm bán.
  * Khi chuyển đổi giao diện **VND ↔ USD**, các lệnh cũ này dùng đúng tỷ giá lịch sử đã lưu để quy đổi, đảm bảo số liệu P&L quá khứ không bị thay đổi khi tỷ giá thị trường biến động.
* **UI Indicator:** Tại danh mục Lịch sử giao dịch, rê chuột (hover) vào biểu tượng lệnh đã bán sẽ hiển thị Tooltip: *`Tỷ giá USD/VND lúc bán: 1 USD = 25,450 VND`*.

---

## 6. Architecture & Replay Engine


```

[User Action: Create/Edit/Delete Transaction]
│
▼
[Save to Supabase Ledger]
│
▼
[Trigger Replay Engine]
│
┌────────────────────┴────────────────────┐
│ 1. Filter Out Deleted Records           │
│ 2. Sort Transactions Chronologically    │
│ 3. Rebuild Cash & Holdings State        │
│ 4. Recalculate T+ Cost & Bank Interest  │
└────────────────────┬────────────────────┘
│
▼
[Update Derived State & Dashboard]

```

* **Deterministic Replay:** Mọi thay đổi dữ liệu không được sửa số dư trực tiếp (patch update) mà phải Rebuild lại State tài chính từ đầu chuỗi lịch sử chưa xóa để tránh sai lệch dữ liệu lũy kế.

---

## 7. Mobile Responsive Constraints

* Target màn hình Mobile: **360px – 430px**.
* Touch target tối thiểu: **40x40px**.
* Bảng dữ liệu không được tràn toàn bộ màn hình mobile (sử dụng horizontal scroll nội bộ hoặc chuyển sang định dạng **Card Layout** trên giao diện nhỏ).

```