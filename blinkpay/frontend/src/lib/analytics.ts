/**
 * Basic analytics system for BlikPay
 */

// Initialize analytics
export const initAnalytics = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics initialized')
  }
}

// Track events (basic implementation)
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Event: ${eventName}`, properties)
  }
}

// Track errors (basic implementation)
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error tracked:', error, context)
  }
}

// Track page views
export const trackPageView = (page: string, properties?: Record<string, any>) => {
  trackEvent('page_view', { page, ...properties })
}