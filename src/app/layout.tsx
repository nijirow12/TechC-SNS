import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ポーカーコイン管理 - Poker Chip Manager",
    description: "リアルタイムでポーカーのコイン処理ができるWebアプリケーション",
    keywords: ["poker", "chip manager", "real-time", "game"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white antialiased min-h-screen">
                {children}
            </body>
        </html>
    );
}
