// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
// Make sure this imports the Toaster component provided by sonner (or its Shadcn/ui wrapper)
import { Toaster } from "@/components/ui/sonner"; // <--- Updated import for sonner

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SanjeevanAI",
  description: "Medical Records Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {/* Use the Toaster component from sonner. Common props like position are useful. */}
        <Toaster richColors position="top-right" /> {/* <--- Use sonner's Toaster and add desired props */}
      </body>
    </html>
  );
}