'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, truncateAddress } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Copy, ExternalLink, Filter } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/database';

async function fetchInvoices(
  walletAddress: string, 
  status?: string,
  search?: string
): Promise<Invoice[]> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) return [];

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data } = await query.limit(50);
  return data || [];
}

function getStatusBadgeVariant(status: InvoiceStatus): 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft' {
  return status as 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft';
}

export default function InvoicesPage() {
  const { publicKey } = useWallet();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices', publicKey?.toString(), statusFilter, searchQuery],
    queryFn: () => fetchInvoices(publicKey?.toString() || '', statusFilter, searchQuery),
    enabled: !!publicKey,
  });

  const copyPaymentLink = async (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied!',
      description: 'Payment link copied to clipboard',
    });
  };

  const copyBlinkUrl = async (invoiceId: string) => {
    const blinkUrl = `solana-action:${window.location.origin}/api/actions/pay/${invoiceId}`;
    await navigator.clipboard.writeText(blinkUrl);
    toast({
      title: 'Blink URL copied!',
      description: 'Share this URL on Twitter for an interactive payment card',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Manage your payment requests and Blinks
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No invoices found</p>
              <Link href="/dashboard/invoices/new">
                <Button>Create Your First Invoice</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="table-row-hover">
                    <TableCell>
                      <Link 
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground truncate max-w-[200px] block">
                        {invoice.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(Number(invoice.amount), invoice.token)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPaymentLink(invoice.id)}
                          title="Copy payment link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyBlinkUrl(invoice.id)}
                          title="Copy Blink URL for Twitter"
                        >
                          <span className="text-xs">Blink</span>
                        </Button>
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm" title="View details">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
