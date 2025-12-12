import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-inter',
});

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
        <html lang="ja" className={inter.variable}>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
