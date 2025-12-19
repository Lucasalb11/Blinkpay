import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/yourdomain\.com/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      // Filter out development errors
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        app: 'blikpay-frontend',
        version: '1.0.0'
      }

      return event
    },
    ignoreErrors: [
      // Ignore common wallet adapter errors
      'User rejected the request',
      'Transaction cancelled',
      'Wallet not connected',
      // Ignore network errors
      'NetworkError',
      'Failed to fetch',
    ],
  })
}