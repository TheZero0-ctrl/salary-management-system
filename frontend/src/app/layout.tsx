import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Salary Management",
  description: "Salary operations and insights for HR teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-2xl border border-black/10 bg-white/90 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/55">
                  HR Workspace
                </p>
                <p className="text-lg font-semibold tracking-tight">Salary Management</p>
              </div>

              <nav aria-label="Primary" className="flex items-center gap-1">
                <Link className="rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5" href="/">
                  Home
                </Link>
                <Link className="rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5" href="/login">
                  Login
                </Link>
                <Link className="rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5" href="/employees">
                  Employees
                </Link>
                <Link className="rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5" href="/insights">
                  Insights
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
