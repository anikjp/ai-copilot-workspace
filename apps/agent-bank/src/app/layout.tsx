import { ThemeProvider } from '@/contexts/theme-context';
import { CopilotProvider } from "@/design-system/organisms/copilot-provider";
import { ClerkProvider } from '@clerk/nextjs';
import "@copilotkit/react-ui/styles.css";
import type { Metadata } from "next";
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
  title: "AI Stock Portfolio",
  description: "AI Stock Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
        >
          <ThemeProvider>
            <CopilotProvider>
              {children}
            </CopilotProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
