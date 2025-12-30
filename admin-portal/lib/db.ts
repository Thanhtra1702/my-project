import { Pool } from 'pg';

// Hỗ trợ cả DATABASE_URL (Supabase/Neon) hoặc các biến rời rạc
const connectionString = process.env.DATABASE_URL;

export const adminDb = new Pool({
  connectionString,
  user: !connectionString ? process.env.DB_USER : undefined,
  password: !connectionString ? process.env.DB_PASSWORD : undefined,
  host: !connectionString ? process.env.DB_HOST : undefined,
  port: !connectionString ? parseInt(process.env.DB_PORT || '5432') : undefined,
  database: !connectionString ? process.env.DB_NAME : undefined,
  // Tự động tắt SSL nếu là localhost hoặc được cấu hình DB_SSL=false
  ssl: (process.env.DB_SSL === 'true' || (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') && process.env.DB_SSL !== 'false'))
    ? { rejectUnauthorized: false }
    : false
});
