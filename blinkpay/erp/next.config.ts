import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile Solana packages for proper client-side bundling
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],

  // Webpack configuration for Solana packages
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers for Solana Actions CORS
  async headers() {
    return [
      {
        source: '/api/actions/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept-Encoding' },
          { key: 'Access-Control-Expose-Headers', value: 'X-Action-Version, X-Blockchain-Ids' },
          { key: 'X-Action-Version', value: '2.1.3' },
          { key: 'X-Blockchain-Ids', value: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' },
        ],
      },
    ];
  },
};

export default nextConfig;
