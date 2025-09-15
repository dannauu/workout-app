import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CustomThemeProvider from './ThemeProvider';
import SessionProvider from './SessionProvider';
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
  title: "Daily Workout App",
  description: "Mobile workout app with daily specialized routines",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <SessionProvider>
          <CustomThemeProvider>
            {children}
          </CustomThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
