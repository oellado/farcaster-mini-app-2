import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { WagmiConfig, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { http, createPublicClient } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Create viem client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// 2. Create wagmi config
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  publicClient,
  ssr: false, // optional
  autoConnect: true,
});

// 3. Create React Query client
const queryClient = new QueryClient();

// 4. Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
