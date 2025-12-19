'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Invoice, InvoiceStatus } from '@/types/database';

interface RecentInvoicesProps {
  walletAddress: string;
}

async function fetchRecentInvoices(walletAddress: string): Promise<Invoice[]> {
  // Get merchant ID
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) {
    return [];
  }

  // Fetch recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return invoices || [];
}

function getStatusBadgeVariant(status: InvoiceStatus): 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft' {
  return status as 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft';
}

export function RecentInvoices({ walletAddress }: RecentInvoicesProps) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['recent-invoices', walletAddress],
    queryFn: () => fetchRecentInvoices(walletAddress),
    enabled: !!walletAddress,
  });

  const copyPaymentLink = async (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied!',
      description: 'Payment link copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
          <CardDescription>Your latest payment requests</CardDescription>
        </div>
        <Link href="/dashboard/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No invoices yet</p>
            <Link href="/dashboard/invoices/new">
              <Button>Create Your First Invoice</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="table-row-hover">
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      {invoice.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {invoice.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(Number(invoice.amount), invoice.token)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(invoice.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyPaymentLink(invoice.id)}
                        title="Copy payment link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
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
  );
}
