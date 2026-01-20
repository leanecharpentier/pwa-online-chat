import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PWA Online Chat",
  description: "Application de chat en ligne progressive (PWA)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} antialiased h-screen overflow-hidden`}
      >
        <AuthProvider>
          <SocketProvider>
            <header className="fixed top-0 left-0 w-full p-4 border-b z-10 flex justify-center">
              <Navigation />
            </header>
            <main className="pt-16 h-screen overflow-y-auto">{children}</main>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
