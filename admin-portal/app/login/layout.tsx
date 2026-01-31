import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đăng nhập quản lý Chatbot AI - BlueAI",
    description: "Trang đăng nhập hệ thống quản lý Chatbot AI - BlueAI",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
