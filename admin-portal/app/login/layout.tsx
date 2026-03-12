import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đăng nhập BlueBot - Quản lý Chatbot AI",
    description: "Đăng nhập hệ thống quản lý dịch vụ Chatbot AI doanh nghiệp - BlueBot",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
