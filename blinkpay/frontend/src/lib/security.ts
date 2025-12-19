/**
 * Security utilities for input validation and sanitization
 */

import DOMPurify from 'isomorphic-dompurify'

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''

  // Remove null bytes and other dangerous characters
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

  // Use DOMPurify to remove XSS vectors
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  })

  // Additional length check
  if (sanitized.length > 10000) {
    throw new Error('Input too long')
  }

  return sanitized.trim()
}

// Memo-specific sanitization (allows some formatting)
export const sanitizeMemo = (memo: string): string => {
  if (typeof memo !== 'string') return ''

  // Limit length
  if (memo.length > 200) {
    throw new Error('Memo too long (max 200 characters)')
  }

  return sanitizeInput(memo)
}

// Address validation
export const validateSolanaAddress = (address: string): boolean => {
  try {
    // Basic format validation
    if (!address || typeof address !== 'string') return false
    if (address.length !== 44 && address.length !== 43) return false // Allow for some variance

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    return base58Regex.test(address)
  } catch {
    return false
  }
}

// Amount validation
export const validateAmount = (amount: string | number): boolean => {
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER
  } catch {
    return false
  }
}

// Rate limiting class
export class RateLimiter {
  private attempts = new Map<string, number[]>()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts = 5, windowMs = 60000) { // 5 attempts per minute
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  canProceed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs)

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }

  getRemainingAttempts(key: string): number {
    const attempts = this.attempts.get(key) || []
    const validAttempts = attempts.filter(time => Date.now() - time < this.windowMs)
    return Math.max(0, this.maxAttempts - validAttempts.length)
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter()

// CSRF protection (basic implementation)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Content Security Policy helper
export const getCSPHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.devnet.solana.com https://api.mainnet-beta.solana.com wss://api.devnet.solana.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
})

// Security event logging
export interface SecurityEvent {
  type: 'INPUT_VALIDATION_FAILED' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY'
  details: Record<string, any>
  timestamp: string
  userAgent?: string
  ip?: string
}

export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  }

  // In production, send to security monitoring service
  console.warn('Security Event:', securityEvent)

  // Store in local storage for debugging (remove in production)
  if (typeof window !== 'undefined') {
    try {
      const events = JSON.parse(localStorage.getItem('security_events') || '[]')
      events.push(securityEvent)
      // Keep only last 50 events
      if (events.length > 50) events.shift()
      localStorage.setItem('security_events', JSON.stringify(events))
    } catch {
      // Ignore localStorage errors
    }
  }
}

// Suspicious activity detection
export const detectSuspiciousActivity = (action: string, context: Record<string, any>) => {
  // Check for rapid successive actions
  const now = Date.now()
  const recentActions = JSON.parse(sessionStorage.getItem('recent_actions') || '[]')
  const recentSimilarActions = recentActions.filter(
    (a: any) => a.action === action && now - a.timestamp < 1000 // Within 1 second
  )

  if (recentSimilarActions.length > 3) {
    logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      details: {
        action,
        context,
        frequency: recentSimilarActions.length,
        message: 'High frequency of similar actions detected'
      }
    })
  }

  // Update recent actions
  recentActions.push({ action, timestamp: now, context })
  if (recentActions.length > 20) recentActions.shift()
  sessionStorage.setItem('recent_actions', JSON.stringify(recentActions))
}