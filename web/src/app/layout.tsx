import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { PreferencesProvider } from "@/context/PreferencesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OmniRead",
  description: "The ultimate digital comics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col`}>
        <PreferencesProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </PreferencesProvider>
      </body>
    </html>
  );
}
