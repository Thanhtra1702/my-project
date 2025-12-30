import nodemailer from 'nodemailer';

// Kiểm tra biến môi trường
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ LỖI: Chưa cấu hình SMTP_USER hoặc SMTP_PASS trong file .env");
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendLeadEmail(toEmail: string, leadData: any) {
    const { customer_name, phone_number, need } = leadData;
    const systemEmail = process.env.SMTP_USER;

    const subject = `[Thông báo Lead] Khách hàng mới: ${customer_name}`;

    try {
        const info = await transporter.sendMail({
            from: `"Hệ thống CSKH" <${systemEmail}>`,
            to: toEmail,
            subject: subject,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            /* Reset CSS */
            body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
            
            /* Khung chính */
            .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              overflow: hidden;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }

            /* Header xanh Navy */
            .email-header {
              background-color: #004085;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              font-size: 18px;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }

            /* Nội dung */
            .email-body {
              padding: 30px;
              color: #333333;
              line-height: 1.6;
            }

            /* Bảng thông tin */
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .info-table td {
              padding: 12px 10px;
              border-bottom: 1px solid #eeeeee;
              vertical-align: top;
            }
            /* Cột nhãn bên trái */
            .label-cell {
              width: 130px;
              color: #666666;
              font-weight: bold;
              font-size: 14px;
            }
            /* Cột giá trị bên phải */
            .value-cell {
              color: #000000;
              font-size: 15px;
            }
            /* Highlight số điện thoại */
            .phone-highlight {
              color: #0056b3;
              font-weight: bold;
              font-size: 16px;
              text-decoration: none;
            }

            /* Footer */
            .email-footer {
              background-color: #f8f9fa;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #999999;
              border-top: 1px solid #eeeeee;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              Thông báo Khách hàng mới
            </div>
            
            <div class="email-body">
              <p>Kính chào Quý đối tác,</p>
              <p>Hệ thống vừa ghi nhận thông tin khách hàng tiềm năng với chi tiết dưới đây:</p>
              
              <table class="info-table">
                <tr>
                  <td class="label-cell">Họ và tên:</td>
                  <td class="value-cell">${customer_name}</td>
                </tr>
                <tr>
                  <td class="label-cell">Số điện thoại:</td>
                  <td class="value-cell">
                    <span class="phone-highlight">${phone_number}</span>
                  </td>
                </tr>
                <tr>
                  <td class="label-cell">Nhu cầu:</td>
                  <td class="value-cell">${need || 'Chưa có thông tin chi tiết.'}</td>
                </tr>
              </table>
              
              <p style="margin-top: 20px;">Vui lòng liên hệ hỗ trợ khách hàng trong thời gian sớm nhất.</p>
            </div>

            <div class="email-footer">
              Email thông báo tự động từ Hệ thống Quản trị Lead.
            </div>
          </div>
        </body>
        </html>
      `,
        });
        console.log("✅ Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi mail chi tiết:', error);
        return false;
    }
}