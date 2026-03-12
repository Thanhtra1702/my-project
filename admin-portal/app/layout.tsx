import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlueBot - Quản lý dịch vụ Chatbot AI doanh nghiệp",
  description: "BlueBot là giải pháp quản lý chăm sóc khách hàng tự động bằng AI do BlueData phát triển.",
  keywords: "BlueBot, Blue.AI, BlueData, e-warranty, qr code, app bhdt, chatbot ai",
  icons: {
    icon: '/favicon.png',
  },
  verification: {
    other: {
      "msvalidate.01": "924C26660F3D1D364EDEF2C99DD4BEE9",
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FZR2R4HVFL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-FZR2R4HVFL');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
