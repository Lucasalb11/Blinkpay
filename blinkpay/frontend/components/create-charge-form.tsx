"use client"

import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Check, Twitter, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { validateAction } from "@/lib/actions"

const customers = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "Digital Solutions" },
  { id: "4", name: "Global Traders" },
  { id: "5", name: "Innovation Labs" },
]

export function CreateChargeForm() {
  const [date, setDate] = useState<Date>()
  const [isGenerated, setIsGenerated] = useState(false)
  const [blinkUrl, setBlinkUrl] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    if (!invoiceId) {
      toast.error("Invoice ID é obrigatório para gerar o Blink.")
      return
    }

    setIsLoading(true)
    try {
      const { ok, url } = await validateAction(invoiceId)
      if (!ok) {
        toast.error("Invoice não encontrada ou inválida.")
        return
      }
      setBlinkUrl(url)
      setIsGenerated(true)
      toast.success("Blink gerado a partir do backend.")
    } catch (error) {
      console.error("Erro ao validar invoice", error)
      toast.error("Falha ao gerar o Blink, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(blinkUrl)
    toast.success("Link copiado para a área de transferência.")
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Pay me with Blinkpay: ${blinkUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  if (isGenerated) {
    return (
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          {/* Success Message */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Blink Generated Successfully!</h2>
            <p className="text-sm text-slate-500 mt-2">Share this payment link with your customer</p>
          </div>

          {/* Blink URL */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-mono text-slate-700 break-all">{blinkUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCopy} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={handleShareTwitter} variant="outline" className="flex-1 border-slate-200 bg-transparent">
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </Button>
          </div>

          {/* Create Another */}
          <Button onClick={() => setIsGenerated(false)} variant="ghost" className="text-slate-600">
            Create Another Charge
          </Button>
        </div>

        {/* Invoice ID */}
        <div className="space-y-2">
          <Label htmlFor="invoiceId" className="text-slate-700">
            Invoice ID (UUID)
          </Label>
          <Input
            id="invoiceId"
            placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
            className="border-slate-200"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value.trim())}
            required
          />
          <p className="text-xs text-slate-500">
            Usamos este ID para montar o Blink real em `/api/actions/pay/{id}`.
          </p>
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleGenerate()
        }}
        className="space-y-6"
      >
        {/* Customer Select */}
        <div className="space-y-2">
          <Label htmlFor="customer" className="text-slate-700">
            Customer
          </Label>
          <Select required>
            <SelectTrigger id="customer" className="border-slate-200">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-slate-700">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">USDC</span>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              className="pl-16 border-slate-200"
              required
              step="0.01"
            />
          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-slate-700">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="What is this charge for?"
            className="border-slate-200 min-h-[100px]"
            required
          />
        </div>

        {/* Due Date Picker */}
        <div className="space-y-2">
          <Label className="text-slate-700">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal border-slate-200", !date && "text-slate-500")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Generate Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? "Validando invoice..." : "Generate Blink"}
        </Button>
      </form>
    </CardContent>
  )
}
