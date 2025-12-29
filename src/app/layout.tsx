import type { Metadata } from "next";
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
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
        <ClerkProvider localization={jaJP}>
            <html lang="ja">
                <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white antialiased min-h-screen">
                    {/* 認証ヘッダー */}
                    <header className="fixed top-0 right-0 z-50 flex items-center gap-3 p-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    サインイン
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-lg">
                                    新規登録
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-10 h-10"
                                    }
                                }}
                            />
                        </SignedIn>
                    </header>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}

