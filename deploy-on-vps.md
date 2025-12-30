# Hướng dẫn triển khai (Deployment Guide)

Quy trình chuẩn để đưa dự án lên VPS sử dụng Docker.

## 1. Chuẩn bị trên máy cá nhân
1. Đảm bảo bạn đã đẩy code lên GitHub (trừ các file trong `.gitignore` như `.env` và `pg_data`).
2. Kiểm tra lại file `admin-portal/next.config.ts` xem đã có `output: 'standalone'` chưa (đã được cấu hình).

## 2. Triển khai trên VPS
### Bước 1: Clone dự án
```bash
git clone <your-repo-url>
cd <project-folder>
```

### Bước 2: Cấu hình ENV
```bash
cp .env.example .env
nano .env
```
*Thay đổi các giá trị như `POSTGRES_PASSWORD` để bảo mật.*

### Bước 3: Chạy Docker Compose
```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái
```bash
docker compose ps
docker compose logs -f admin-portal
```

## 3. Các lưu ý quan trọng
- **Nginx**: File `nginx/nginx.conf` hiện đang cấu hình `localhost`. Nếu bạn có domain, hãy đổi `server_name localhost;` thành domain của bạn.
- **SSL**: File compose hiện chỉ mở port 80. Bạn nên sử dụng Certbot để cài SSL (HTTPS) sau khi đã trỏ domain.
- **Dữ liệu**: Folder `pg_data` sẽ lưu dữ liệu DB. Đừng xóa folder này nếu không muốn mất dữ liệu.
- **Import dữ liệu cũ**: Nếu bạn có file backup SQL, bạn có thể copy vào folder `my-admin-db/` và Uncomment dòng volume trong `docker-compose.yml` để Docker tự động import khi khởi tạo DB lần đầu.
