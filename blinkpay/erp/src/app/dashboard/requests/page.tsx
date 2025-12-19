'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Send,
  Copy,
  ExternalLink,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Wallet,
} from 'lucide-react';
import type { PaymentRequest, PaymentRequestStatus, TokenType, Customer } from '@/types/database';

// ============================================
// DATA FETCHING
// ============================================

async function fetchPaymentRequests(walletAddress: string): Promise<PaymentRequest[]> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) return [];

  const { data } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });

  return data || [];
}

async function fetchCustomers(walletAddress: string): Promise<Customer[]> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) return [];

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('name');

  return data || [];
}

async function createPaymentRequest(
  walletAddress: string,
  requestData: {
    recipientName: string;
    recipientEmail: string;
    recipientWallet: string;
    amount: string;
    token: TokenType;
    description: string;
    customerId?: string;
  }
) {
  // Get or create merchant
  let { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) {
    const { data: newMerchant, error } = await supabase
      .from('merchants')
      .insert({
        wallet_address: walletAddress,
        business_name: 'My Business',
        default_token: 'USDC',
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create merchant');
    merchant = newMerchant;
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      merchant_id: merchant.id,
      customer_id: requestData.customerId || null,
      amount: parseFloat(requestData.amount),
      token: requestData.token,
      description: requestData.description || null,
      recipient_name: requestData.recipientName || null,
      recipient_email: requestData.recipientEmail || null,
      recipient_wallet: requestData.recipientWallet || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function cancelRequest(requestId: string) {
  const { error } = await supabase
    .from('payment_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
}

// ============================================
// HELPERS
// ============================================

function getStatusBadge(status: PaymentRequestStatus) {
  const config = {
    pending: { variant: 'pending' as const, icon: Clock, label: 'Pending' },
    viewed: { variant: 'warning' as const, icon: Eye, label: 'Viewed' },
    paid: { variant: 'paid' as const, icon: CheckCircle, label: 'Paid' },
    expired: { variant: 'secondary' as const, icon: Clock, label: 'Expired' },
    cancelled: { variant: 'cancelled' as const, icon: XCircle, label: 'Cancelled' },
  };

  const { variant, icon: Icon, label } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function PaymentRequestsPage() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientWallet: '',
    amount: '',
    token: 'USDC' as TokenType,
    description: '',
    customerId: '',
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['payment-requests', publicKey?.toString()],
    queryFn: () => fetchPaymentRequests(publicKey?.toString() || ''),
    enabled: !!publicKey,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list', publicKey?.toString()],
    queryFn: () => fetchCustomers(publicKey?.toString() || ''),
    enabled: !!publicKey,
  });

  const createMutation = useMutation({
    mutationFn: () => createPaymentRequest(publicKey?.toString() || '', formData),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      setIsDialogOpen(false);
      setFormData({
        recipientName: '',
        recipientEmail: '',
        recipientWallet: '',
        amount: '',
        token: 'USDC',
        description: '',
        customerId: '',
      });
      toast({
        title: 'Payment request created!',
        description: `Request ${request.request_number} is ready to share.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create request',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({ title: 'Request cancelled' });
    },
  });

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/pay/request/${id}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  };

  const copyBlinkUrl = async (id: string) => {
    const url = `solana-action:${window.location.origin}/api/actions/request/${id}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Blink URL copied!', description: 'Share this on Twitter' });
  };

  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'new') {
      setFormData({ ...formData, customerId: '', recipientName: '', recipientEmail: '', recipientWallet: '' });
      return;
    }

    const customer = customers?.find((c) => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        recipientName: customer.name || '',
        recipientEmail: customer.email || '',
        recipientWallet: customer.wallet_address || '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: 'Valid amount is required', variant: 'destructive' });
      return;
    }
    createMutation.mutate();
  };

  // Stats
  const pendingRequests = requests?.filter((r) => ['pending', 'viewed'].includes(r.status)) || [];
  const paidRequests = requests?.filter((r) => r.status === 'paid') || [];
  const totalPending = pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
          <p className="text-gray-600 mt-1">
            Request payments from clients and contacts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Payment Request</DialogTitle>
                <DialogDescription>
                  Request a payment from a specific person or wallet
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Customer Selection */}
                {customers && customers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Existing Customer</Label>
                    <Select onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or enter new" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">+ New Recipient</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name || customer.email || customer.wallet_address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="John Doe"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email (Optional)</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientWallet">Wallet Address (Optional)</Label>
                  <Input
                    id="recipientWallet"
                    placeholder="Solana wallet address"
                    value={formData.recipientWallet}
                    onChange={(e) => setFormData({ ...formData, recipientWallet: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    If specified, the request will be targeted to this wallet
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select
                      value={formData.token}
                      onValueChange={(value) => setFormData({ ...formData, token: value as TokenType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="SOL">SOL</SelectItem>
                        <SelectItem value="PYUSD">PYUSD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this payment for?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  Create Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPending)} awaiting payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidRequests.length}</div>
            <p className="text-xs text-muted-foreground">Successfully collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests && requests.length > 0
                ? `${Math.round((paidRequests.length / requests.length) * 100)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Requests that got paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No payment requests yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.request_number}</div>
                        {request.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {request.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {request.recipient_name && (
                          <div className="font-medium">{request.recipient_name}</div>
                        )}
                        {request.recipient_email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {request.recipient_email}
                          </div>
                        )}
                        {request.recipient_wallet && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                            <Wallet className="w-3 h-3" />
                            {truncateAddress(request.recipient_wallet)}
                          </div>
                        )}
                        {!request.recipient_name && !request.recipient_email && !request.recipient_wallet && (
                          <span className="text-muted-foreground">Anyone</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(Number(request.amount), request.token)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(request.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(request.id)}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyBlinkUrl(request.id)}
                          title="Copy Blink URL"
                        >
                          <span className="text-xs">Blink</span>
                        </Button>
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(request.id)}
                            title="Cancel"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
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
