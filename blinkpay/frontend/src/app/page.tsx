import { ClientOnly } from '@/components/ClientOnly'

export default function Home() {
  return <ClientOnly />
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'