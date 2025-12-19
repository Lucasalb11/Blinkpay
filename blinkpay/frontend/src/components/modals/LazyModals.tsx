import { lazy, Suspense } from 'react'
import { Loading } from '@/components/ui/Loading'

// Lazy load modal components for better performance
const PaymentModal = lazy(() => import('./PaymentModal').then(module => ({ default: module.PaymentModal })))
const RequestModal = lazy(() => import('./RequestModal').then(module => ({ default: module.RequestModal })))
const ScheduledModal = lazy(() => import('./ScheduledModal').then(module => ({ default: module.ScheduledModal })))

interface LazyPaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LazyPaymentModal: React.FC<LazyPaymentModalProps> = (props) => (
  <Suspense fallback={<Loading text="Loading payment modal..." />}>
    <PaymentModal {...props} />
  </Suspense>
)

interface LazyRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LazyRequestModal: React.FC<LazyRequestModalProps> = (props) => (
  <Suspense fallback={<Loading text="Loading request modal..." />}>
    <RequestModal {...props} />
  </Suspense>
)

interface LazyScheduledModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LazyScheduledModal: React.FC<LazyScheduledModalProps> = (props) => (
  <Suspense fallback={<Loading text="Loading scheduled modal..." />}>
    <ScheduledModal {...props} />
  </Suspense>
)