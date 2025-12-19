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
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Link2,
  Copy,
  ExternalLink,
  Eye,
  DollarSign,
  Zap,
  Heart,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { PaymentLink, TokenType, PaymentLinkType } from '@/types/database';

// ============================================
// DATA FETCHING
// ============================================

async function fetchPaymentLinks(walletAddress: string): Promise<PaymentLink[]> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) return [];

  const { data } = await supabase
    .from('payment_links')
    .select('*')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });

  return data || [];
}

async function createPaymentLink(
  walletAddress: string,
  linkData: {
    name: string;
    title: string;
    description: string;
    linkType: PaymentLinkType;
    fixedAmount: string;
    token: TokenType;
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
    .from('payment_links')
    .insert({
      merchant_id: merchant.id,
      name: linkData.name,
      title: linkData.title || null,
      description: linkData.description || null,
      link_type: linkData.linkType,
      fixed_amount: linkData.fixedAmount ? parseFloat(linkData.fixedAmount) : null,
      token: linkData.token,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function toggleLinkStatus(linkId: string, isActive: boolean) {
  const { error } = await supabase
    .from('payment_links')
    .update({ is_active: !isActive })
    .eq('id', linkId);

  if (error) throw new Error(error.message);
}

// ============================================
// COMPONENT
// ============================================

export default function PaymentLinksPage() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    linkType: 'instant' as PaymentLinkType,
    fixedAmount: '',
    token: 'USDC' as TokenType,
  });

  const { data: links, isLoading } = useQuery({
    queryKey: ['payment-links', publicKey?.toString()],
    queryFn: () => fetchPaymentLinks(publicKey?.toString() || ''),
    enabled: !!publicKey,
  });

  const createMutation = useMutation({
    mutationFn: () => createPaymentLink(publicKey?.toString() || '', formData),
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        title: '',
        description: '',
        linkType: 'instant',
        fixedAmount: '',
        token: 'USDC',
      });
      toast({
        title: 'Payment link created!',
        description: `Your link "${link.name}" is ready to share.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create link',
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleLinkStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
    },
  });

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/pay/link/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  };

  const copyBlinkUrl = async (slug: string) => {
    const url = `solana-action:${window.location.origin}/api/actions/link/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Blink URL copied!', description: 'Share this on Twitter' });
  };

  const getLinkTypeIcon = (type: PaymentLinkType) => {
    switch (type) {
      case 'instant':
        return <Zap className="w-4 h-4" />;
      case 'donation':
        return <Heart className="w-4 h-4" />;
      case 'recurring':
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
          <p className="text-gray-600 mt-1">
            Create reusable payment links for instant payments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Payment Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Payment Link</DialogTitle>
                <DialogDescription>
                  Create a reusable payment link to share anywhere
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Link Name (Internal)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Coffee Tip Jar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Display Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Buy me a coffee!"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkType">Link Type</Label>
                    <Select
                      value={formData.linkType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, linkType: value as PaymentLinkType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">
                          <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Fixed Amount
                          </span>
                        </SelectItem>
                        <SelectItem value="donation">
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Variable (Donation)
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select
                      value={formData.token}
                      onValueChange={(value) =>
                        setFormData({ ...formData, token: value as TokenType })
                      }
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

                {formData.linkType === 'instant' && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.fixedAmount}
                      onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  Create Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !links || links.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No payment links yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Your First Link
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <div className="font-medium">{link.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          /{link.slug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {getLinkTypeIcon(link.link_type)}
                        {link.link_type === 'instant' ? 'Fixed' : 'Variable'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {link.fixed_amount
                        ? formatCurrency(link.fixed_amount, link.token)
                        : 'Variable'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          {link.view_count}
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <DollarSign className="w-4 h-4" />
                          {link.payment_count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleMutation.mutate({ id: link.id, isActive: link.is_active })
                        }
                      >
                        {link.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(link.slug || '')}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyBlinkUrl(link.slug || '')}
                          title="Copy Blink URL"
                        >
                          <span className="text-xs">Blink</span>
                        </Button>
                        <Link href={`/pay/link/${link.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" title="Preview">
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
