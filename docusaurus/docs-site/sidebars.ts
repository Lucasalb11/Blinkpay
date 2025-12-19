import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  blinkpaySidebar: [
    // Introduction
    'intro',

    // Getting Started
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/overview',
      ],
    },

    // User Guide
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'user-guide/overview',
        'user-guide/wallet-connection',
        'user-guide/payment-requests',
        'user-guide/scheduled-charges',
      ],
    },

    // Developer Guide
    {
      type: 'category',
      label: 'Developer Guide',
      items: [
        'developer-guide/overview',
      ],
    },

    // API Reference
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/overview',
      ],
    },

    // Contributing & Security
    {
      type: 'category',
      label: 'Contributing & Security',
      items: [
        'contributing/overview',
        'security/overview',
      ],
    },
  ],
};

export default sidebars;
