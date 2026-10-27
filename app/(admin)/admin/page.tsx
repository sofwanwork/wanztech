import { getAdminStatsAction, getAdminClientsAction } from '@/actions/admin';
import { ClientTable } from '@/components/admin/client-table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Sparkles,
  ShieldCheck,
  FileText,
  Send,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [statsRes, clientsRes] = await Promise.all([
    getAdminStatsAction(),
    getAdminClientsAction(),
  ]);

  const stats = statsRes.data || {
    totalClients: 0,
    totalPro: 0,
    totalEnterprise: 0,
    totalFree: 0,
    totalForms: 0,
    totalSubmissions: 0,
    totalRevenue: 0,
  };

  const clients = clientsRes.data || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pengurusan Klien & Langganan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau semua akaun berdaftar, semak aktiviti penggunaan, dan urus pelan langganan klien secara langsung.
        </p>
      </div>

      {/* Error Notices if any */}
      {(!statsRes.success || !clientsRes.success) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Perhatian:</p>
            <p>{statsRes.error || clientsRes.error}</p>
          </div>
        </div>
      )}

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Clients */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Klien
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalClients}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pro Clients */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                Klien Pro
              </p>
              <p className="text-2xl font-extrabold text-sky-700 mt-1">
                {stats.totalPro}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Clients */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                Enterprise
              </p>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">
                {stats.totalEnterprise}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Free Tier */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Klien Percuma
              </p>
              <p className="text-2xl font-extrabold text-slate-700 mt-1">
                {stats.totalFree}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Forms */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Borang
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalForms}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Submissions */}
        <Card className="p-0 gap-0 overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Total Respons
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {stats.totalSubmissions}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Send className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Client Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Senarai Klien Berdaftar</h2>
          <p className="text-xs text-slate-500">
            Klik butang &quot;Urus Pelan&quot; pada mana-mana klien untuk menaik taraf atau mengubah tarikh langganan mereka.
          </p>
        </div>

        <ClientTable initialClients={clients} />
      </div>
    </div>
  );
}
