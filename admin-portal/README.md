# Admin & Tenant Portal Management System

Hệ thống quản trị tập trung (SaaS-ready) dành cho Admin và Tenant để quản lý Chatbot AI, theo dõi khách hàng (Leads), và kiểm soát hạn mức sử dụng (Token usage). Dự án được thiết kế để tích hợp chặt chẽ với hệ thống **Dify AI**.

---

## 🚀 Tính năng chính

### 1. Giao diện Super Admin
*   **Quản lý Tenancy**: Quản lý khách hàng doanh nghiệp, cài đặt Giới hạn Token, Dify App ID, và trạng thái hoạt động.
*   **Bảo mật API Key**: Toàn bộ OpenAI/Dify API Keys của Tenant được **mã hóa (AES-256)** trước khi lưu vào Database.
*   **Thống kê hệ thống**: Theo dõi tổng lượng Token tiêu thụ và số lượng Tenant đang hoạt động theo thời gian thực.
*   **Quản lý Leads toàn cục**: Xem và lọc toàn bộ khách hàng tiềm năng từ tất cả các Tenant.
*   **Xem lịch sử Chat**: Truy xuất trực tiếp lịch sử trò chuyện giữa Chatbot và khách hàng của bất kỳ Tenant nào qua Dify API.

### 2. Giao diện Tenant (Dashboard riêng)
*   **Quản lý Khách hàng**: Danh sách Leads chi tiết (Tên, SĐT, Nhu cầu, Token đã dùng).
*   **Xem Chat chi tiết**: Xem lịch sử hội thoại thời gian thực để hỗ trợ khách hàng kịp thời.
*   **Kiểm soát Bot**: Tenant có quyền bật/tắt Bot thủ công ngay trên Dashboard.
*   **Thống kê sử dụng**: Biểu đồ trực quan về lượng khách hàng mới và lượng Token tiêu thụ trong 7 ngày gần nhất.

### 3. Hệ thống Tích hợp Dify (External APIs)
*   **Config API**: Cung cấp API Key (đã giải mã) và cấu hình cho Dify Workflow. Kiểm tra tức thời trạng thái Tenant (Quá hạn mức, bị khóa, Bot tắt).
*   **Log Token API**: Ghi nhận chi tiết lượng Token tiêu thụ sau mỗi câu trả lời của Bot.
*   **Webhook Lead**: Tự động nhận thông tin khách hàng từ Dify, lưu vào DB và gửi Email thông báo ngay lập tức cho Tenant.

---

## 🛠 Công nghệ sử dụng

*   **Next.js 15 (App Router)** & **React 19**
*   **PostgreSQL**: Cơ sở dữ liệu chính.
*   **Nodemailer**: Hệ thống gửi email thông báo.
*   **Crypto (AES-256-CBC)**: Mã hóa dữ liệu nhạy cảm.
*   **Recharts**: Biểu đồ thống kê.
*   **Tailwind CSS**: Giao diện responsive và hiện đại.

---

## 📂 Cấu trúc thư mục & File quan trọng

*   `app/admin`: Quản trị hệ thống (Super Admin).
*   `app/api/webhook/lead`: Xử lý dữ liệu khách hàng mới từ Dify.
*   `app/api/tenant/config`: API kiểm tra quyền và cấp Key cho Dify.
*   `app/api/tenant/log-token`: API ghi nhận sử dụng Token.
*   `lib/db.ts`: Cấu hình kết nối DB (Hỗ trợ Pool & SSL).
*   `lib/crypto.ts`: Logic mã hóa/giải mã API Keys.
*   `lib/mail.ts`: Template và logic gửi Email thông báo Lead.
*   `app/actions.ts`: Các Server Actions xử lý logic Login, Lấy Chat History, Toggle Bot...

---

## ⚙️ Cài đặt & Cấu hình

1. **Biến môi trường (.env.local)**
```env
# Database (Dùng 1 trong 2 cách)
DATABASE_URL=postgresql://user:pass@host:port/dbname
# Hoặc tách rời:
# DB_USER=...
# DB_PASSWORD=...
# DB_HOST=...
# DB_PORT=5432
# DB_NAME=...

# Bảo mật (Key phải là 32 ký tự)
ENCRYPTION_KEY=your_secret_32_chars_key_here

# Dify API Configuration (Để xem lịch sử chat trên Web)
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-api-key

# Email (SMTP Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. **Cấu trúc bảng Database (SQL)**
```sql
-- Bảng Tenants (Công ty khách hàng)
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  email VARCHAR(255),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'TENANT', -- SUPER_ADMIN hoặc TENANT
  openai_api_key TEXT, -- Được mã hóa
  dify_app_id VARCHAR(255),
  token_limit BIGINT DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  is_bot_enabled BOOLEAN DEFAULT true,
  limit_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Leads (Khách hàng tiềm năng)
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id),
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  phone_number VARCHAR(50),
  note TEXT,
  user_id VARCHAR(255),
  total_chat_tokens BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Token Logs (Lịch sử sử dụng)
CREATE TABLE token_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id),
  conversation_id VARCHAR(255),
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📝 Quy trình hoạt động của Webhook & API

### Webhook Lead (`/api/webhook/lead`)
*   Nhận dữ liệu từ Dify.
*   Kiểm tra `conversation_id`: 
    *   Nếu cũ: Trả về `is_new_conversation: false`.
    *   Nếu mới: Lưu Lead, gửi Email cho Tenant, trả về `is_new_conversation: true`.

### Config API (`/api/tenant/config`)
*   Dify gọi vào trước mỗi Workflow.
*   Hệ thống kiểm tra: `is_active`, `is_bot_enabled`, và `token_limit`.
*   Nếu thỏa mãn: Giải mã và cấp `openai_api_key` cho Dify sử dụng.

---
© 2024-2025 Admin Portal AI System.
