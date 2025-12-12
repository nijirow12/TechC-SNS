import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
    title: "TechC SNS - Connect, Share, Innovate",
    description: "A modern social networking platform for tech enthusiasts",
    keywords: ["social network", "tech", "community", "innovation"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="ja">
                <body className="bg-background text-foreground antialiased min-h-screen flex flex-col items-center">
                    <main className="w-full max-w-md flex-1 border-x border-border min-h-screen bg-card shadow-sm">
                        {children}
                    </main>
                </body>
            </html>
        </ClerkProvider>
    );
}
