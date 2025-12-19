"use client"

import { Copy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const invoices = [
  {
    id: "1",
    customer: "Acme Corp",
    status: "paid",
    dueDate: "2025-01-15",
    amount: "5,000",
  },
  {
    id: "2",
    customer: "TechStart Inc",
    status: "pending",
    dueDate: "2025-01-20",
    amount: "3,250",
  },
  {
    id: "3",
    customer: "Digital Solutions",
    status: "overdue",
    dueDate: "2025-01-10",
    amount: "1,800",
  },
  {
    id: "4",
    customer: "Global Traders",
    status: "paid",
    dueDate: "2025-01-12",
    amount: "7,500",
  },
  {
    id: "5",
    customer: "Innovation Labs",
    status: "pending",
    dueDate: "2025-01-25",
    amount: "2,100",
  },
]

const statusConfig = {
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 hover:bg-red-100" },
}

export function InvoicesTable() {
  const handleCopyLink = (id: string) => {
    // Placeholder for copy functionality
    console.log(`Copying Blink link for invoice ${id}`)
  }

  return (
    <div className="rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-slate-600 font-medium">Status</TableHead>
            <TableHead className="text-slate-600 font-medium">Customer</TableHead>
            <TableHead className="text-slate-600 font-medium">Due Date</TableHead>
            <TableHead className="text-slate-600 font-medium">Amount (USDC)</TableHead>
            <TableHead className="text-slate-600 font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-slate-50">
              <TableCell>
                <Badge
                  variant="secondary"
                  className={statusConfig[invoice.status as keyof typeof statusConfig].className}
                >
                  {statusConfig[invoice.status as keyof typeof statusConfig].label}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-slate-900">{invoice.customer}</TableCell>
              <TableCell className="text-slate-600">{invoice.dueDate}</TableCell>
              <TableCell className="font-semibold text-slate-900">{invoice.amount}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 bg-transparent"
                    onClick={() => handleCopyLink(invoice.id)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Link
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
