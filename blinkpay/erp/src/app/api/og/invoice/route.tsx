/**
 * Dynamic OG Image Generator for Invoice Blinks
 * 
 * Generates a branded image for each invoice that appears
 * when the Blink is unfurled on Twitter/X.
 * 
 * Usage: /api/og/invoice?num=INV-2024-00001&amount=100&token=USDC
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const invoiceNumber = searchParams.get('num') || 'Invoice';
  const amount = searchParams.get('amount') || '';
  const token = searchParams.get('token') || 'USDC';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Card Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '48px 64px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1F2937',
              }}
            >
              BlinkPay
            </span>
          </div>

          {/* Invoice Number */}
          <div
            style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#6B7280',
              marginBottom: '8px',
            }}
          >
            {invoiceNumber}
          </div>

          {/* Amount */}
          {amount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: '700',
                  color: '#1F2937',
                }}
              >
                {amount}
              </span>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  color: '#9945FF',
                }}
              >
                {token}
              </span>
            </div>
          )}

          {/* CTA Text */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            Click to Pay
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          <span>Powered by Solana</span>
          <span>•</span>
          <span>Instant Payments</span>
          <span>•</span>
          <span>Non-Custodial</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
