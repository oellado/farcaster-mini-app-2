import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

import { WagmiConfig, createClient, useAccount, useConnect, useDisconnect, useSigner } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

const vibes = [
  {
    text: 'Today is for movement, get the energy flowing',
    gif: 'https://fc.miguelgarest.com/fc/0.gif'
  },
  {
    text: 'Let loose. Today is made for fun.',
    gif: 'https://fc.miguelgarest.com/fc/1.gif'
  },
  {
    text: 'Find your rhythm and let it carry you.',
    gif: 'https://fc.miguelgarest.com/fc/2.gif'
  },
  {
    text: 'Adventure awaits. Try something new today.',
    gif: 'https://fc.miguelgarest.com/fc/3.gif'
  },
  {
    text: 'Reach out, someone needs your love today.',
    gif: 'https://fc.miguelgarest.com/fc/4.gif'
  }
];

// Replace these with your actual NFT contract details
const NFT_CONTRACT_ADDRESS = '0xYourNFTContractAddressHere';
const NFT_ABI = [
  "function mint(address to, uint256 tokenId) external",
  "function totalSupply() view returns (uint256)"
];

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector()
  ],
});

function AppInner() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { data: signer } = useSigner();

  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const [minted, setMinted] = useState([]);
  const [mintCounts, setMintCounts] = useState(Array(vibes.length).fill(0));
  const [txHash, setTxHash] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState("");

  useEffect(() => {
    sdk.actions.ready();
    sdk.context.then(ctx => {
      if (ctx && ctx.user) {
        setUser(ctx.user);
      }
    });
  }, []);

  const mintNFT = async (idx) => {
    if (!signer) {
      setMintError("Wallet not connected");
      return;
    }
    setMintError("");
    setMinting(true);

    try {
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const tokenId = idx + 1; // example tokenId logic

      const tx = await contract.mint(address, tokenId);
      setTxHash(tx.hash);
      await tx.wait();

      if (!minted.includes(idx)) {
        setMinted([...minted, idx]);
      }
      setMintCounts(prev => {
        const next = [...prev];
        next[idx] = (next[idx] || 0) + 1;
        return next;
      });

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);

      setScreen('profile');
      setResult(null);
    } catch (e) {
      setMintError(e.message || "Minting failed");
    }
    setMinting(false);
  };

  const handleClick = () => {
    const random = vibes[Math.floor(Math.random() * vibes.length)];
    setResult(random);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await sdk.actions.composeCast({
        text: result.text,
        embeds: [
          result.gif,
          'https://warpcast.com/miniapps/F3EoBj27HyTd/daily-vibes'
        ]
      });
    } catch (error) {
      console.error('Error sharing to Warpcast:', error);
    }
  };

  const handleMint = () => {
    if (!result) return;
    const idx = vibes.findIndex(v => v.gif === result.gif);
    if (idx !== -1) {
      if (!isConnected) {
        alert("Please connect your wallet to mint.");
        return;
      }
      mintNFT(idx);
    }
  };

  const WalletButton = () => {
    if (isConnected) {
      return (
        <div style={{ marginBottom: 16 }}>
          <div>Connected: {address}</div>
          <button
            onClick={() => disconnect()}
            style={{
              backgroundColor: '#e03e3e',
              border: 'none',
              padding: '8px 16px',
              color: 'white',
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 6,
            }}
          >
            Disconnect Wallet
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => connect()}
        style={{
          backgroundColor: '#3b82f6',
          border: 'none',
          padding: '12px 24px',
          color: 'white',
          borderRadius: 12,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          marginBottom: 16,
        }}
      >
        Connect Wallet to Mint NFTs
      </button>
    );
  };

  if (screen === 'home') {
    return (
      <div style={{
        fontFamily: 'sans-serif',
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
      }}>
        <h1 style={{ marginBottom: 12 }}>Daily Vibes</h1>
        <WalletButton />
        <button
          onClick={handleClick}
          style={{
            fontSize: '1.2rem',
            backgroundColor: '#6366f1',
            border: 'none',
            padding: '16px 32px',
            borderRadius: 12,
            cursor: 'pointer',
            color: 'white',
            marginBottom: 24,
          }}
        >
          Get Your Vibe
        </button>

        {result && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{result.text}</p>
            <img src={result.gif} alt="vibe gif" style={{ maxWidth: 320, borderRadius: 12 }} />
            <div style={{ marginTop: 20 }}>
              <button
                onClick={handleShare}
                style={{
                  marginRight: 12,
                  padding: '8px 20px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                Share on Warpcast
              </button>
              <button
                onClick={handleMint}
                disabled={minting}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  cursor: minting ? 'not-allowed' : 'pointer',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {minting ? 'Minting...' : 'Mint NFT'}
              </button>
            </div>
            {mintError && <p style={{ color: 'red', marginTop: 12 }}>{mintError}</p>}
            {txHash && (
              <p style={{ marginTop: 12 }}>
                Tx Hash: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // You can extend other screens ('profile', 'gifting', etc.) as needed here...

  return null;
}

export default function App() {
  return (
    <WagmiConfig client={wagmiClient}>
      <AppInner />
    </WagmiConfig>
  );
}
