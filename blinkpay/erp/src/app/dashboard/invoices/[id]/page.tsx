'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Calendar,
  User,
  Wallet,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Invoice, InvoiceStatus, Customer } from '@/types/database';

interface InvoiceWithCustomer extends Invoice {
  customer: Customer | null;
}

async function fetchInvoice(
  id: string,
  walletAddress: string
): Promise<InvoiceWithCustomer | null> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) return null;

  const { data } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', id)
    .eq('merchant_id', merchant.id)
    .single();

  return data;
}

function getStatusIcon(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-gray-600" />;
    case 'overdue':
      return <Clock className="w-5 h-5 text-red-600" />;
    default:
      return <Clock className="w-5 h-5 text-blue-600" />;
  }
}

function getStatusBadgeVariant(status: InvoiceStatus): 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft' {
  return status as 'paid' | 'pending' | 'overdue' | 'cancelled' | 'draft';
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { publicKey } = useWallet();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-detail', id, publicKey?.toString()],
    queryFn: () => fetchInvoice(id, publicKey?.toString() || ''),
    enabled: !!publicKey,
  });

  const copyPaymentLink = async () => {
    const link = `${window.location.origin}/pay/${id}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copied!', description: 'Payment link copied to clipboard' });
  };

  const copyBlinkUrl = async () => {
    const blinkUrl = `solana-action:${window.location.origin}/api/actions/pay/${id}`;
    await navigator.clipboard.writeText(blinkUrl);
    toast({ title: 'Blink URL copied!', description: 'Share this on Twitter' });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Invoice not found</p>
            <Link href="/dashboard/invoices">
              <Button>Back to Invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            <p className="text-gray-600">
              Created {formatRelativeTime(invoice.created_at)}
            </p>
          </div>
        </div>

        {invoice.status === 'pending' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPaymentLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={copyBlinkUrl}>
              Share Blink
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(invoice.status)}
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {formatCurrency(Number(invoice.amount), invoice.token)}
              </div>
              
              {invoice.description && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Description</div>
                  <div className="text-gray-900">{invoice.description}</div>
                </div>
              )}

              {invoice.status === 'paid' && invoice.transaction_signature && (
                <div className="bg-green-50 rounded-lg p-4 mt-4">
                  <div className="text-sm text-green-800 font-medium mb-2">
                    Payment Received
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Paid Amount</span>
                      <span className="font-medium text-green-900">
                        {formatCurrency(Number(invoice.paid_amount), invoice.paid_token || invoice.token)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Paid At</span>
                      <span className="font-medium text-green-900">
                        {invoice.paid_at && formatDate(invoice.paid_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Transaction</span>
                      <a
                        href={`https://solscan.io/tx/${invoice.transaction_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-green-800 hover:underline flex items-center gap-1"
                      >
                        {truncateAddress(invoice.transaction_signature, 8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {invoice.payer_wallet && (
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Payer Wallet</span>
                        <span className="font-mono text-green-900">
                          {truncateAddress(invoice.payer_wallet)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment links */}
          {invoice.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Links</CardTitle>
                <CardDescription>
                  Share these links to receive payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Web Payment Link</div>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-100 rounded p-2 text-sm font-mono overflow-x-auto">
                      {`${window.location.origin}/pay/${invoice.id}`}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyPaymentLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">
                    Blink URL (for Twitter/Dialect)
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-100 rounded p-2 text-sm font-mono overflow-x-auto">
                      {`solana-action:${window.location.origin}/api/actions/pay/${invoice.id}`}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyBlinkUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste this URL on Twitter to display an interactive payment card
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.customer ? (
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">
                      {invoice.customer.name || 'Unnamed Customer'}
                    </div>
                    {invoice.customer.email && (
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.email}
                      </div>
                    )}
                  </div>
                  {invoice.customer.wallet_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono">
                        {truncateAddress(invoice.customer.wallet_address)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-medium">
                        {formatCurrency(Number(invoice.customer.total_paid))}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Invoices</span>
                      <span>{invoice.customer.total_invoices}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No customer linked to this invoice
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <Badge variant="secondary">{invoice.token}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(invoice.created_at)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memo</span>
                <span className="font-mono">{invoice.memo}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
