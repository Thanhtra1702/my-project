import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quên mật khẩu - BlueBot",
    description: "Khôi phục mật khẩu tài khoản BlueBot của bạn.",
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
