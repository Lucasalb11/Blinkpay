/**
 * Analytics and monitoring system for BlikPay
 * Integrates PostHog for product analytics and Sentry for error monitoring
 */

import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'

// Configuration
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || ''

// Initialize analytics
export const initAnalytics = () => {
  // Initialize PostHog
  if (POSTHOG_KEY && typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') console.log('PostHog loaded')
      }
    })

    // Set user properties
    posthog.register({
      platform: 'web',
      app_version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  }

  // Initialize Sentry
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
    })
  }
}

// User identification
export const identifyUser = (walletAddress: string, properties?: Record<string, any>) => {
  const userId = walletAddress

  // PostHog identification
  if (POSTHOG_KEY) {
    posthog.identify(userId, {
      wallet_address: walletAddress,
      ...properties
    })
  }

  // Sentry user context
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      wallet_address: walletAddress,
      ...properties
    })
  }
}

// Event tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // PostHog event
  if (POSTHOG_KEY) {
    posthog.capture(eventName, {
      timestamp: new Date().toISOString(),
      ...properties
    })
  }

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Event: ${eventName}`, properties)
  }
}

// Wallet connection events
export const trackWalletConnection = (walletType: string, success: boolean, error?: string) => {
  trackEvent('wallet_connection', {
    wallet_type: walletType,
    success,
    error,
    connection_method: 'wallet_adapter'
  })

  if (!success && error) {
    Sentry.captureException(new Error(`Wallet connection failed: ${error}`), {
      tags: {
        wallet_type: walletType,
        error_type: 'wallet_connection'
      }
    })
  }
}

// Transaction events
export const trackTransaction = (
  type: 'payment_request' | 'pay_request' | 'scheduled_charge' | 'execute_charge' | 'cancel_charge',
  success: boolean,
  properties?: Record<string, any>
) => {
  trackEvent('transaction', {
    transaction_type: type,
    success,
    ...properties
  })

  if (!success) {
    Sentry.captureException(new Error(`Transaction failed: ${type}`), {
      tags: {
        transaction_type: type,
        error_type: 'transaction_failure'
      },
      extra: properties
    })
  }
}

// Performance monitoring
export const trackPerformance = (metric: string, value: number, properties?: Record<string, any>) => {
  trackEvent('performance_metric', {
    metric,
    value,
    ...properties
  })
}

// Error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  // Sentry error
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        error_source: 'application'
      },
      extra: context
    })
  }

  // PostHog error event
  trackEvent('error_occurred', {
    error_message: error.message,
    error_stack: error.stack,
    ...context
  })

  // Console error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error tracked:', error, context)
  }
}

// Page view tracking
export const trackPageView = (page: string, properties?: Record<string, any>) => {
  trackEvent('page_view', {
    page,
    ...properties
  })
}

// Feature usage tracking
export const trackFeatureUsage = (feature: string, action: string, properties?: Record<string, any>) => {
  trackEvent('feature_usage', {
    feature,
    action,
    ...properties
  })
}

// Conversion funnel tracking
export const trackConversion = (step: string, completed: boolean, properties?: Record<string, any>) => {
  trackEvent('conversion_funnel', {
    step,
    completed,
    ...properties
  })
}

// Session management
export const startSession = (properties?: Record<string, any>) => {
  trackEvent('session_start', {
    session_id: crypto.randomUUID(),
    ...properties
  })
}

export const endSession = (properties?: Record<string, any>) => {
  trackEvent('session_end', properties)
}

// Privacy and GDPR compliance
export const optOutAnalytics = () => {
  if (POSTHOG_KEY) {
    posthog.opt_out_capturing()
  }
}

export const optInAnalytics = () => {
  if (POSTHOG_KEY) {
    posthog.opt_in_capturing()
  }
}

// Reset user data
export const resetAnalytics = () => {
  if (POSTHOG_KEY) {
    posthog.reset()
  }

  if (SENTRY_DSN) {
    Sentry.setUser(null)
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private marks = new Map<string, number>()

  start(markName: string) {
    this.marks.set(markName, performance.now())
  }

  end(markName: string, properties?: Record<string, any>) {
    const startTime = this.marks.get(markName)
    if (startTime) {
      const duration = performance.now() - startTime
      trackPerformance(markName, duration, properties)
      this.marks.delete(markName)
      return duration
    }
    return 0
  }

  measure(name: string, fn: () => void | Promise<void>, properties?: Record<string, any>) {
    this.start(name)
    const result = fn()
    if (result instanceof Promise) {
      return result.finally(() => this.end(name, properties))
    } else {
      this.end(name, properties)
      return result
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Web Vitals tracking
export const trackWebVitals = (metric: any) => {
  trackPerformance(`web_vitals_${metric.name}`, metric.value, {
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id
  })
}

// Export for use in _app.tsx
export { posthog }