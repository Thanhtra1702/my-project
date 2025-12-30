-- Khởi tạo bảng Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    email VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50), -- SUPER_ADMIN hoặc TENANT
    openai_api_key TEXT,
    dify_app_id VARCHAR(100),
    token_limit BIGINT DEFAULT 100000,
    is_active BOOLEAN DEFAULT TRUE,
    is_bot_enabled BOOLEAN DEFAULT TRUE,
    limit_start_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Khởi tạo bảng Leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    conversation_id VARCHAR(255) UNIQUE,
    customer_name VARCHAR(255),
    phone_number VARCHAR(50),
    note TEXT,
    user_id VARCHAR(255),
    total_chat_tokens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Khởi tạo bảng Token Logs
CREATE TABLE IF NOT EXISTS token_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    conversation_id VARCHAR(255),
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Mật khẩu mặc định là 'admin123' (Lưu ý: System của bạn đang dùng plain text cho password_hash)
INSERT INTO tenants (company_name, email, username, password_hash, role, is_active, is_bot_enabled)
VALUES ('Hệ Thống Quản Trị', 'admin@example.com', 'admin', 'admin123', 'SUPER_ADMIN', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;
