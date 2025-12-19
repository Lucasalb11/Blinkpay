'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Link2, UserPlus, FileText } from 'lucide-react';

const actions = [
  {
    title: 'Create Invoice',
    description: 'Generate a new payment Blink',
    href: '/dashboard/invoices/new',
    icon: Plus,
    variant: 'default' as const,
  },
  {
    title: 'Payment Link',
    description: 'Create a quick payment link',
    href: '/dashboard/links/new',
    icon: Link2,
    variant: 'outline' as const,
  },
  {
    title: 'Add Customer',
    description: 'Register a new customer',
    href: '/dashboard/customers/new',
    icon: UserPlus,
    variant: 'outline' as const,
  },
  {
    title: 'View Reports',
    description: 'Check your analytics',
    href: '/dashboard/reports',
    icon: FileText,
    variant: 'outline' as const,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks at your fingertips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="block">
            <Button
              variant={action.variant}
              className="w-full justify-start gap-3 h-auto py-3"
            >
              <div className={`p-2 rounded-lg ${
                action.variant === 'default' 
                  ? 'bg-white/20' 
                  : 'bg-primary/10'
              }`}>
                <action.icon className={`w-4 h-4 ${
                  action.variant === 'default' 
                    ? 'text-white' 
                    : 'text-primary'
                }`} />
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className={`text-xs ${
                  action.variant === 'default'
                    ? 'text-white/70'
                    : 'text-muted-foreground'
                }`}>
                  {action.description}
                </div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
