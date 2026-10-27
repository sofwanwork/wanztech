import Link from 'next/link';
import { verifyAdminSession, PRIMARY_ADMIN_EMAIL } from '@/lib/auth/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard | KlikForm',
  description: 'Pengurusan Klien dan Langganan KlikForm',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce strict security guard: ONLY sofwanjailani.work@gmail.com
  const user = await verifyAdminSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand & Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 group-hover:bg-indigo-500 transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white tracking-tight">
                    KlikForm <span className="text-indigo-400">Admin</span>
                  </span>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
                    Super Admin
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400">
                  Pengurusan Klien & Langganan
                </span>
              </div>
            </Link>
          </div>

          {/* Right Admin Controls */}
          <div className="flex items-center gap-3">
            {/* Authenticated Admin Email indicator */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">
                {user.email || PRIMARY_ADMIN_EMAIL}
              </span>
            </div>

            {/* Back to User Dashboard */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:text-white text-xs h-9 transition-colors"
            >
              <Link href="/forms" className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard Klien</span>
                <span className="sm:hidden">Keluar</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} KlikForm Admin Console. Akses terhad kepada pentadbir sistem yang sah.</p>
      </footer>
    </div>
  );
}
