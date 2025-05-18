import { createConfig, http } from 'wagmi';
import { mainnet, optimism } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, optimism],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
  },
});