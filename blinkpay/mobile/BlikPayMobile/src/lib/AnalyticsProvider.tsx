import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import PostHog from 'posthog-react-native'
import * as Sentry from '@sentry/react-native'

interface AnalyticsProviderProps {
  children: ReactNode
}

const AnalyticsContext = createContext({})

const POSTHOG_API_KEY = 'your-posthog-api-key'
const SENTRY_DSN = 'your-sentry-dsn'

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize PostHog
    PostHog.setup(POSTHOG_API_KEY, {
      host: 'https://app.posthog.com',
    })

    // Initialize Sentry
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    })

    // Set app properties
    PostHog.register({
      platform: 'mobile',
      app_version: '1.0.0',
      environment: __DEV__ ? 'development' : 'production'
    })
  }, [])

  return (
    <AnalyticsContext.Provider value={{}}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Analytics utilities
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  PostHog.capture(eventName, properties)
}

export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    tags: context,
  })
}

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  PostHog.identify(userId, properties)
  Sentry.setUser({
    id: userId,
    ...properties,
  })
}