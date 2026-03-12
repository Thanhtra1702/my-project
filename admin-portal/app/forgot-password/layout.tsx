import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thông tin tài khoản - BlueBot",
    description: "Thông tin về việc quản lý tài khoản SSO của BlueBot.",
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
