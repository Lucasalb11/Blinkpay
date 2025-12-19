import { CreateChargeForm } from "@/components/create-charge-form"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewInvoicePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/invoices">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
      </Link>

      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900 text-balance">Create New Charge</h1>
        <p className="text-sm text-slate-500 mt-2">Generate a Blink payment link for your customer</p>
      </div>

      {/* Form Card */}
      <Card className="border-slate-200">
        <CreateChargeForm />
      </Card>
    </div>
  )
}
