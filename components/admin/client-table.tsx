'use client';

import { useState, useMemo } from 'react';
import {
  AdminClientItem,
  deleteClientAction,
  deleteClientsBulkAction,
  deleteUnverifiedZeroUsageClientsAction,
} from '@/actions/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [selectedClient, setSelectedClient] = useState<AdminClientItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete Dialog state
  const [clientToDelete, setClientToDelete] = useState<AdminClientItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPrimaryAdmin = (email: string) =>
    email.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase().trim();

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(clientToDelete.id);
        return next;
      });
      toast.success(`Client ${clientToDelete.fullName} permanently deleted.`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting client';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await deleteClientsBulkAction(ids);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete selected clients');
        return;
      }
      const deletedSet = new Set(res.deletedIds || []);
      setClients((prev) => prev.filter((c) => !deletedSet.has(c.id)));
      setSelectedIds(new Set());
      toast.success(`Deleted ${deletedSet.size} selected client(s).`);
      setBulkDeleteDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting selected clients';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCleanupUnverified = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteUnverifiedZeroUsageClientsAction();
      if (!res.success) {
        toast.error(res.error || 'Failed to clean up unverified accounts');
        return;
      }
      const deletedSet = new Set(res.deletedIds || []);
      setClients((prev) => prev.filter((c) => !deletedSet.has(c.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deletedSet.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`Cleaned up ${deletedSet.size} unverified idle account(s).`);
      setCleanupDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cleaning up unverified accounts';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Count unverified idle accounts eligible for 1-click cleanup
  const unverifiedIdleCount = useMemo(() => {
    return clients.filter(
      (c) =>
        !isPrimaryAdmin(c.email) &&
        !c.isVerified &&
        !c.lastSignInAt &&
        c.tier === 'free' &&
        c.formsCount === 0 &&
        c.totalSubmissions === 0
    ).length;
  }, [clients]);

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

      // Verification filter
      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && c.isVerified) ||
        (verificationFilter === 'unverified' && !c.isVerified);

      return matchesSearch && matchesTier && matchesStatus && matchesVerification;
    });
  }, [clients, search, tierFilter, statusFilter, verificationFilter]);

  const selectableFilteredClients = useMemo(
    () => filteredClients.filter((c) => !isPrimaryAdmin(c.email)),
    [filteredClients]
  );

  const allVisibleSelected =
    selectableFilteredClients.length > 0 &&
    selectableFilteredClients.every((c) => selectedIds.has(c.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        selectableFilteredClients.forEach((c) => next.delete(c.id));
      } else {
        selectableFilteredClients.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <Badge className="bg-violet-100 text-violet-900 border-violet-200 font-semibold hover:bg-violet-200">
          <ShieldCheck className="h-3 w-3 mr-1 text-violet-900" />
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
        Cancelled
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
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="expired">Tamat</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-[145px] h-10 border-slate-200 text-xs font-medium">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emails</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>

          {(search || tierFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setTierFilter('all');
                setStatusFilter('all');
                setVerificationFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 h-10"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Summary count & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 font-medium">
        <span>
          Memaparkan <strong className="text-slate-800 font-semibold">{filteredClients.length}</strong> daripada{' '}
          <strong className="text-slate-800 font-semibold">{clients.length}</strong> klien
        </span>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="h-8 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          {unverifiedIdleCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCleanupDialogOpen(true)}
              className="h-8 text-xs font-medium border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clean Up Unverified ({unverifiedIdleCount})
            </Button>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px] pl-4">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAllVisible}
                    aria-label="Select all visible clients"
                  />
                </TableHead>
                <TableHead className="w-[300px] text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Client
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Plan
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Expiration Date
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Usage
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Registered
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No clients found</p>
                      <p className="text-xs text-slate-400">
                        Try adjusting your search query or filter settings.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const initials = client.fullName
                    ? client.fullName.substring(0, 2).toUpperCase()
                    : 'KF';
                  const adminAccount = isPrimaryAdmin(client.email);

                  return (
                    <TableRow key={client.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Selection Checkbox */}
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          disabled={adminAccount}
                          onCheckedChange={() => toggleSelectOne(client.id)}
                          aria-label={`Select ${client.fullName}`}
                        />
                      </TableCell>
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
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {client.fullName}
                              </p>
                              {!client.isVerified && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 shrink-0"
                                >
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="truncate max-w-[180px] sm:max-w-[220px]">
                                {client.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(client.email, client.id)}
                                title="Copy email"
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
                            {client.formsCount} forms
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
                            Manage Plan
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
                              title="Delete Client"
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
              Permanently Delete Client?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 pt-2 leading-relaxed">
              Adakah anda pasti mahu memadam akaun{' '}
              <strong className="text-slate-900 font-semibold">{clientToDelete?.fullName}</strong> (
              <span className="font-mono text-xs text-slate-800">{clientToDelete?.email}</span>)?
              <br />
              <br />
              <span className="text-rose-600 font-medium block bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs">
                Warning: This action cannot be undone. All forms ({clientToDelete?.formsCount || 0}),
                responses ({clientToDelete?.totalSubmissions || 0}), and subscriptions will be deleted immediately.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
                'Yes, Delete Client'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Selected Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </span>
              Delete {selectedIds.size} Selected Client(s)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 pt-2 leading-relaxed">
              This will permanently delete <strong>{selectedIds.size}</strong> selected account(s)
              along with all of their forms, responses, and subscriptions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} Account(s)`
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clean Up Unverified Idle Accounts Dialog */}
      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </span>
              Clean Up {unverifiedIdleCount} Unverified Account(s)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 pt-2 leading-relaxed">
              This will delete only <strong>unverified Free-tier accounts</strong> that have{' '}
              <strong>never signed in</strong>, have <strong>0 forms</strong>, and{' '}
              <strong>0 submissions</strong>. Verified users and paid accounts will never be touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCleanupUnverified}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Cleaning Up...
                </>
              ) : (
                `Clean Up ${unverifiedIdleCount} Account(s)`
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
