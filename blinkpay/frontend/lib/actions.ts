const ACTIONS_BASE = (process.env.NEXT_PUBLIC_ACTIONS_BASE_URL || '').replace(/\/$/, '')

export function buildActionUrl(invoiceId: string) {
  const path = `/api/actions/pay/${invoiceId}`
  return ACTIONS_BASE ? `${ACTIONS_BASE}${path}` : path
}

export async function validateAction(invoiceId: string) {
  const url = buildActionUrl(invoiceId)
  const res = await fetch(url, { method: 'GET', cache: 'no-store' })
  return { ok: res.ok, url }
}
