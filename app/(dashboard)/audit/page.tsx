import { listAuditLogs } from '@/lib/storage/audit';
import { describeAuditLog, auditActionKind } from '@/lib/audit/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, PlusCircle, Trash2, Pencil, Activity } from 'lucide-react';
import { format } from 'date-fns';

export const metadata = {
  title: 'Audit Log | KlikForm',
};

// Auth-gated, owner-specific data — never statically rendered.
export const dynamic = 'force-dynamic';

function KindIcon({ action }: { action: string }) {
  const kind = auditActionKind(action);
  if (kind === 'create') return <PlusCircle className="h-4 w-4 text-emerald-600" />;
  if (kind === 'delete') return <Trash2 className="h-4 w-4 text-red-600" />;
  if (kind === 'update') return <Pencil className="h-4 w-4 text-sky-600" />;
  return <Activity className="h-4 w-4 text-gray-500" />;
}

export default async function AuditPage() {
  const logs = await listAuditLogs(100);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            A record of important actions on your account (create/delete forms,
            etc.).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5">
                    <KindIcon action={log.action} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">{describeAuditLog(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'd MMM yyyy, h:mm a')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
