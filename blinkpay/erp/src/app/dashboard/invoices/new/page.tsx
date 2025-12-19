'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Link2, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { TokenType, Customer } from '@/types/database';

interface InvoiceFormData {
  customerName: string;
  customerEmail: string;
  customerId?: string;
  amount: string;
  token: TokenType;
  description: string;
  dueDate: string;
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

async function createInvoice(walletAddress: string, formData: InvoiceFormData) {
  // Get or create merchant
  let { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!merchant) {
    // Create merchant if doesn't exist
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

  // Create or find customer if provided
  let customerId: string | null = null;
  
  if (formData.customerId) {
    customerId = formData.customerId;
  } else if (formData.customerName || formData.customerEmail) {
    // Check if customer exists
    let customerQuery = supabase
      .from('customers')
      .select('id')
      .eq('merchant_id', merchant.id);

    if (formData.customerEmail) {
      customerQuery = customerQuery.eq('email', formData.customerEmail);
    }

    const { data: existingCustomer } = await customerQuery.single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          merchant_id: merchant.id,
          name: formData.customerName || null,
          email: formData.customerEmail || null,
        })
        .select()
        .single();

      if (newCustomer) {
        customerId = newCustomer.id;
      }
    }
  }

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      merchant_id: merchant.id,
      customer_id: customerId,
      amount: parseFloat(formData.amount),
      token: formData.token,
      description: formData.description || null,
      due_date: formData.dueDate || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create invoice');

  return invoice;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; invoice_number: string } | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: '',
    customerEmail: '',
    customerId: undefined,
    amount: '',
    token: 'USDC',
    description: '',
    dueDate: '',
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', publicKey?.toString()],
    queryFn: () => fetchCustomers(publicKey?.toString() || ''),
    enabled: !!publicKey,
  });

  const createMutation = useMutation({
    mutationFn: () => createInvoice(publicKey?.toString() || '', formData),
    onSuccess: (invoice) => {
      setCreatedInvoice({ id: invoice.id, invoice_number: invoice.invoice_number || '' });
      toast({
        title: 'Invoice created!',
        description: `Invoice ${invoice.invoice_number} has been created successfully.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate();
  };

  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'new') {
      setFormData({ ...formData, customerId: undefined, customerName: '', customerEmail: '' });
      return;
    }

    const customer = customers?.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name || '',
        customerEmail: customer.email || '',
      });
    }
  };

  const copyPaymentLink = async () => {
    if (!createdInvoice) return;
    const link = `${window.location.origin}/pay/${createdInvoice.id}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copied!', description: 'Payment link copied to clipboard' });
  };

  const copyBlinkUrl = async () => {
    if (!createdInvoice) return;
    const blinkUrl = `solana-action:${window.location.origin}/api/actions/pay/${createdInvoice.id}`;
    await navigator.clipboard.writeText(blinkUrl);
    toast({ title: 'Blink URL copied!', description: 'Share this on Twitter for an interactive payment card' });
  };

  // Success state
  if (createdInvoice) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Invoice Created!</CardTitle>
            <CardDescription className="text-green-700">
              Your invoice {createdInvoice.invoice_number} is ready to share
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Link */}
            <div>
              <Label className="text-green-800">Payment Link</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={`${window.location.origin}/pay/${createdInvoice.id}`}
                  className="bg-white font-mono text-sm"
                />
                <Button onClick={copyPaymentLink} variant="outline" className="shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Blink URL */}
            <div>
              <Label className="text-green-800">Blink URL (for Twitter/Dialect)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={`solana-action:${window.location.origin}/api/actions/pay/${createdInvoice.id}`}
                  className="bg-white font-mono text-sm"
                />
                <Button onClick={copyBlinkUrl} variant="outline" className="shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Paste this URL on Twitter to display an interactive payment card
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreatedInvoice(null)}
                className="flex-1"
              >
                Create Another
              </Button>
              <Link href="/dashboard/invoices" className="flex-1">
                <Button className="w-full">View All Invoices</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600">Generate a new payment Blink</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Invoice Details
            </CardTitle>
            <CardDescription>
              Fill in the details to generate a payment link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-900">Customer (Optional)</h3>
              
              {customers && customers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="customer">Select Existing Customer</Label>
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ New Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.email || customer.wallet_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!formData.customerId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Amount & Token */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-900">Payment Details</h3>
              
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
                  <Label htmlFor="token">Token *</Label>
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
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this payment for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/invoices" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                loading={createMutation.isPending}
              >
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
