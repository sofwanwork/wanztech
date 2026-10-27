'use client';

import { useState, useMemo } from 'react';
import { AdminClientItem, deleteClientAction } from '@/actions/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Filter,
  Copy,
  Check,
  Edit,
  ShieldCheck,
  Sparkles,
  Users,
  FileText,
  Send,
  Trash2,
  Loader2,
} from 'lucide-react';
import { EditSubscriptionDialog } from './edit-subscription-dialog';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/auth/admin-shared';
import { SubscriptionTier, SubscriptionStatus } from '@/lib/types/subscription';
import { toast } from 'sonner';

interface ClientTableProps {
  initialClients: AdminClientItem[];
}

export function ClientTable({ initialClients }: ClientTableProps) {
  const [clients, setClients] = useState<AdminClientItem[]>(initialClients);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dialog state
  const [selectedClient, setSelectedClient] = useState<AdminClientItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete Dialog state
  const [clientToDelete, setClientToDelete] = useState<AdminClientItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteClientAction(clientToDelete.id);
      if (!res.success) {
        toast.error(res.error || 'Gagal memadam klien');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      toast.success(`Klien ${clientToDelete.fullName} berjaya dipadam secara kekal.`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat semasa memadam klien';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Search
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.email.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q);

      // Tier filter
      const matchesTier = tierFilter === 'all' || c.tier === tierFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [clients, search, tierFilter, statusFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Emel disalin ke papan keratan');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (client: AdminClientItem) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleSubscriptionUpdated = (updated: {
    userId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  }) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === updated.userId) {
          return {
            ...c,
            tier: updated.tier,
            status: updated.status,
            currentPeriodEnd: updated.currentPeriodEnd || undefined,
          };
        }
        return c;
      })
    );
  };

  const renderTierBadge = (tier: SubscriptionTier) => {
    if (tier === 'pro') {
      return (
        <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-semibold hover:bg-sky-200">
          <Sparkles className="h-3 w-3 mr-1 text-sky-600" />
          PRO
        </Badge>
      );
    }
    if (tier === 'enterprise') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold hover:bg-purple-200">
          <ShieldCheck className="h-3 w-3 mr-1 text-purple-600" />
          ENTERPRISE
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
        FREE
      </Badge>
    );
  };

  const renderStatusBadge = (status: SubscriptionStatus) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktif
        </span>
      );
    }
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Tamat
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Batal
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    // If year 2099 or later -> Lifetime
    if (d.getFullYear() >= 2099) return 'Seumur Hidup';
    return d.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari mengikut nama, emel, atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-slate-200 bg-slate-50/50 focus:bg-white text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[130px] h-10 border-slate-200 text-xs font-medium">
                <SelectValue placeholder="Pelan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pelan</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-10 border-slate-200 text-xs font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="expired">Tamat</SelectItem>
              <SelectItem value="cancelled">Batal</SelectItem>
            </SelectContent>
          </Select>

          {(search || tierFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setTierFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 h-10"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Summary count */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
        <span>
          Memaparkan <strong className="text-slate-800 font-semibold">{filteredClients.length}</strong> daripada{' '}
          <strong className="text-slate-800 font-semibold">{clients.length}</strong> klien
        </span>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Klien
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Pelan
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tarikh Luput
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Penggunaan
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Daftar
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tindakan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Tiada klien dijumpai</p>
                      <p className="text-xs text-slate-400">
                        Cuba ubah kata kunci carian atau tetapan penapis anda.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const initials = client.fullName
                    ? client.fullName.substring(0, 2).toUpperCase()
                    : 'KF';

                  return (
                    <TableRow key={client.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Klien details */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200">
                            {client.avatarUrl && <AvatarImage src={client.avatarUrl} />}
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {client.fullName}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="truncate max-w-[180px] sm:max-w-[220px]">
                                {client.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(client.email, client.id)}
                                title="Salin emel"
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                {copiedId === client.id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Pelan */}
                      <TableCell>{renderTierBadge(client.tier)}</TableCell>

                      {/* Status */}
                      <TableCell>{renderStatusBadge(client.status)}</TableCell>

                      {/* Tarikh Luput */}
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {formatDate(client.currentPeriodEnd)}
                      </TableCell>

                      {/* Penggunaan */}
                      <TableCell>
                        <div className="flex flex-col text-xs space-y-0.5">
                          <span className="text-slate-700 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3 text-slate-400" />
                            {client.formsCount} borang
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Send className="h-3 w-3 text-slate-400" />
                            {client.totalSubmissions} respons
                          </span>
                        </div>
                      </TableCell>

                      {/* Tarikh Daftar */}
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(client.createdAt)}
                      </TableCell>

                      {/* Tindakan */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(client)}
                            className="h-8 text-xs font-medium text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1.5" />
                            Urus Pelan
                          </Button>

                          {client.email.toLowerCase().trim() !== PRIMARY_ADMIN_EMAIL.toLowerCase().trim() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setClientToDelete(client);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Padam Klien"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      <EditSubscriptionDialog
        client={selectedClient}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSubscriptionUpdated}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </span>
              Padam Klien Secara Kekal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 pt-2 leading-relaxed">
              Adakah anda pasti mahu memadam akaun{' '}
              <strong className="text-slate-900 font-semibold">{clientToDelete?.fullName}</strong> (
              <span className="font-mono text-xs text-slate-800">{clientToDelete?.email}</span>)?
              <br />
              <br />
              <span className="text-rose-600 font-medium block bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs">
                Amaran: Tindakan ini tidak boleh diundur. Semua borang ({clientToDelete?.formsCount || 0}),
                respons ({clientToDelete?.totalSubmissions || 0}), dan langganan akan dipadam serta-merta.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Memadam...
                </>
              ) : (
                'Ya, Padam Klien'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
