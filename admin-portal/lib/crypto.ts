// FILE: lib/crypto.ts
import crypto from 'crypto';

// Lấy key từ biến môi trường
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Phải là 32 ký tự
const IV_LENGTH = 16; // AES block size

export function encrypt(text: string): string {
  if (!text || !ENCRYPTION_KEY) return text;

  // Tạo vector khởi tạo ngẫu nhiên (IV) để mỗi lần mã hóa ra một chuỗi khác nhau dù cùng text
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Trả về dạng: IV:EncryptedData (để khi giải mã biết dùng IV nào)
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text || !ENCRYPTION_KEY) return text;

  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Không phải định dạng mã hóa

    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    console.error("Decrypt Error:", error);
    return text; // Nếu lỗi (do sai key hoặc data cũ chưa mã hóa) thì trả về gốc
  }
}