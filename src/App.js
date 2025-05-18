import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

// NFT Contract ABI (simplified)
const nftContractAbi = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'safeTransferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
];

const vibes = [
  {
    text: 'Today is for movement, get the energy flowing',
    gif: 'https://fc.miguelgarest.com/fc/0.gif',
  },
  // ... other vibes (unchanged, assuming you have more)
];

function App() {
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, idx: 0 });
  const [giftingIdx, setGiftingIdx] = useState(null);
  const [giftUsername, setGiftUsername] = useState('');
  const [minted, setMinted] = useState([]);
  const [mintCounts, setMintCounts] = useState(Array(vibes.length).fill(0));
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mostInteracted, setMostInteracted] = useState([
    // Your existing mostInteracted array (unchanged)
  ]);
  const [following, setFollowing] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [sendError, setSendError] = useState('');
  const [showTxModal, setShowTxModal] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [pendingShare, setPendingShare] = useState(false);
  const [txSelectedUsers, setTxSelectedUsers] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Wallet state
  const { isConnected, address } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { writeContract, isPending: txPending, error: txError, data: txData } = useWriteContract();

  // Connect wallet automatically
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connect, connectors]);

  // Apply safeAreaInsets for mobile
  useEffect(() => {
    sdk.isInMiniApp().then((isMiniApp) => {
      if (isMiniApp) {
        sdk.actions.ready();
        sdk.context.then((ctx) => {
          if (ctx && ctx.user) {
            setUser(ctx.user);
          }
          if (ctx.client.safeAreaInsets) {
            // Apply insets to root container
            document.documentElement.style.setProperty(
              '--safe-area-inset-top',
              `${ctx.client.safeAreaInsets.top}px`
            );
            document.documentElement.style.setProperty(
              '--safe-area-inset-bottom',
              `${ctx.client.safeAreaInsets.bottom}px`
            );
          }
        });
      }
    });
  }, []);

  // Fetch user's following list on load
  useEffect(() => {
    if (user && user.fid) {
      fetch(`http://localhost:3001/api/user/following?fid=${user.fid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.result && data.result.users) {
            setFollowing(data.result.users);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Improved user search logic
  useEffect(() => {
    if (screen !== 'gifting' || !giftUsername.trim()) {
      setUserSuggestions([]);
      setSearchError('');
      return;
    }
    let ignore = false;
    setIsSearching(true);
    setSearchError('');
    const searchTerm = giftUsername.trim();
    const finish = (users) => {
      if (!ignore) {
        setUserSuggestions(users);
        setIsSearching(false);
        if (users.length === 0) setSearchError('No users found.');
      }
    };
    Promise.all([
      fetch(`http://localhost:3001/api/user/search?q=${encodeURIComponent(searchTerm)}`)
        .then((res) => res.json())
        .then((data) => (data.result && data.result.users ? data.result.users : [])),
      fetchUserByUsername(searchTerm),
    ])
      .then(([searchUsers, byUsernameUser]) => {
        let users = searchUsers || [];
        if (byUsernameUser) {
          if (!users.some((u) => u.username === byUsernameUser.username)) {
            users = [byUsernameUser, ...users];
          }
        }
        finish(users);
      })
      .catch((err) => {
        if (!ignore) {
          setSearchError('Search failed');
          setIsSearching(false);
          console.error('Search error', err);
        }
      });
    return () => {
      ignore = true;
    };
  }, [giftUsername, screen]);

  const fetchUserByUsername = async (username) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/user/by_username?username=${encodeURIComponent(username)}`
      );
      const data = await res.json();
      if (data.user && data.user.username) {
        return {
          username: data.user.username,
          pfp_url: data.user.pfp_url,
          custody_address: data.user.custody_address, // For gifting later
        };
      }
    } catch (e) {}
    return null;
  };

  const handleGiftInputKeyDown = async (e) => {
    if (e.key === 'Enter' && giftUsername.trim()) {
      const user = await fetchUserByUsername(giftUsername.trim());
      if (user) {
        addSelectedUser(user);
      } else {
        setUserSuggestions([]);
      }
    }
  };

  // Updated handleMint with real transaction
  const handleMint = () => {
    if (!result || !isConnected) {
      setSendError(isConnected ? 'No vibe selected' : 'Please connect wallet');
      return;
    }
    const idx = vibes.findIndex((v) => v.gif === result.gif);
    if (idx === -1) return;

    setTxLoading(true);
    writeContract(
      {
        address: '0xYourContractAddress', // Replace with your contract address
        abi: nftContractAbi,
        functionName: 'mint',
        args: [idx, 1], // Mint 1 NFT of tokenId idx
        value: parseEther('0.01'), // Price per NFT
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          setMinted((prev) => prev.includes(idx) ? prev : [...prev, idx]);
          setMintCounts((prev) => {
            const next = [...prev];
            next[idx] = (next[idx] || 0) + 1;
            return next;
          });
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            setScreen('profile');
            setResult(null);
            setTxLoading(false);
          }, 1200);
        },
        onError: (error) => {
          setSendError(`Mint failed: ${error.message}`);
          setTxLoading(false);
        },
      }
    );
  };

  // Updated handleGiftSend with real transfers
  const handleGiftSend = async () => {
    if (selectedUsers.length === 0) {
      setSendError('Please select at least one user to gift.');
      return;
    }
    if (!isConnected) {
      setSendError('Please connect wallet');
      return;
    }
    if (giftingIdx === null || giftingIdx === undefined) {
      setSendError('No NFT selected for gifting');
      return;
    }

    setTxLoading(true);
    setSendError('');

    // Check edition count
    if (selectedUsers.length > mintCounts[giftingIdx]) {
      setSendError(
        `You only have ${mintCounts[giftingIdx]} edition${
          mintCounts[giftingIdx] > 1 ? 's' : ''
        } of this NFT.`
      );
      setTxLoading(false);
      return;
    }

    // Transfer NFTs to each user
    for (const user of selectedUsers) {
      if (!user.custody_address) {
        setSendError(`No wallet address for @${user.username}`);
        setTxLoading(false);
        return;
      }

      writeContract(
        {
          address: '0xYourContractAddress',
          abi: nftContractAbi,
          functionName: 'safeTransferFrom',
          args: [
            address, // From: user’s wallet
            user.custody_address, // To: recipient’s wallet
            giftingIdx, // Token ID
            1, // Amount
            '0x', // Data (empty)
          ],
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setMintCounts((prev) => {
              const next = [...prev];
              next[giftingIdx] = Math.max(0, (next[giftingIdx] || 0) - 1);
              if (next[giftingIdx] === 0) {
                setMinted((prev) => prev.filter((idx) => idx !== giftingIdx));
              }
              return next;
            });
            setTxSelectedUsers(selectedUsers);
            setScreen('tx');
            setTxLoading(false);
          },
          onError: (error) => {
            setSendError(`Transfer failed: ${error.message}`);
            setTxLoading(false);
          },
        }
      );
    }
  };

  // Unchanged handleGiftShare
  const handleGiftShare = async () => {
    if (!txHash) return;
    setPendingShare(true);
    try {
      const usernames = txSelectedUsers
        .map((u) => '@' + u.username)
        .join(' ');
      await sdk.actions.composeCast({
        text: `${usernames} I just sent you a gif via Daily Vibe mini-app, check it here`,
        embeds: [
          'https://warpcast.com/miniapps/F3EoBj27HyTd/daily-vibes',
        ],
      });
    } catch (e) {}
    setPendingShare(false);
    setScreen('profile');
    setTxHash('');
    setTxSelectedUsers([]);
    setSelectedUsers([]);
    setGiftUsername('');
    setGiftingIdx(null);
    setLightbox({ open: false, idx: 0 });
  };

  const handleTxScreenClose = () => {
    setScreen('home');
    setTxHash('');
    setTxSelectedUsers([]);
    setSelectedUsers([]);
    setGiftUsername('');
    setGiftingIdx(null);
    setLightbox({ open: false, idx: 0 });
  };

  // Updated mostInteracted fetch to use backend
  useEffect(() => {
    if (user && user.fid) {
      fetch(`http://localhost:3001/api/user/following?fid=${user.fid}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.result && data.result.users && data.result.users.length > 0) {
            setMostInteracted(
              data.result.users.map((u) => ({
                username: u.username,
                pfp_url: u.pfp_url,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [user]);

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
          'https://warpcast.com/miniapps/F3EoBj27HyTd/daily-vibes',
        ],
      });
    } catch (error) {
      console.error('Error sharing to Warpcast:', error);
      setSendError('Failed to share cast');
    }
  };

  const mintedSorted = minted.slice().sort((a, b) => a - b);
  const currentMintedIdx = mintedSorted.indexOf(lightbox.idx);
  const prevMinted =
    mintedSorted.length > 0
      ? mintedSorted[
          (currentMintedIdx - 1 + mintedSorted.length) % mintedSorted.length
        ]
      : undefined;
  const nextMinted =
    mintedSorted.length > 0
      ? mintedSorted[(currentMintedIdx + 1) % mintedSorted.length]
      : undefined;

  const handleLightboxShare = async (idx) => {
    const vibe = vibes[idx];
    try {
      await sdk.actions.composeCast({
        text: vibe.text,
        embeds: [
          vibe.gif,
          'https://warpcast.com/miniapps/F3EoBj27HyTd/daily-vibes',
        ],
      });
    } catch (error) {
      console.error('Error sharing to Warpcast:', error);
      setSendError('Failed to share cast');
    }
  };

  const addSelectedUser = (user) => {
    if (!selectedUsers.some((u) => u.username === user.username)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setIsSearching(false);
  };

  const removeSelectedUser = (username) => {
    setSelectedUsers(selectedUsers.filter((u) => u.username !== username));
  };

  const TopBar = (
    <div
      style={{
        backgroundColor: '#BFC8E0',
        padding: '12px',
        paddingTop: 'calc(12px + var(--safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: 'white',
        position: 'relative',
      }}
    >
      <button
        onClick={() => {
          setScreen('home');
          setResult(null);
          setLightbox({ open: false, idx: 0 });
          setGiftingIdx(null);
        }}
        style={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          padding: '2px 8px',
          borderRadius: '8px',
          letterSpacing: '0.05em',
        }}
        aria-label="Home"
      >
        HOME
      </button>
      <span style={{ flex: 1, textAlign: 'center' }}>Daily Vibes</span>
      {user && (
        <img
          src={user.pfpUrl}
          alt={user.username}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #fff',
            background: '#eee',
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
          }}
          onClick={() => setScreen('profile')}
        />
      )}
    </div>
  );

  // Updated profile screen with wallet status
  if (screen === 'profile') {
    return (
      <div
        style={{
          backgroundColor: '#DCE5FF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          paddingBottom: 'var(--safe-area-inset-bottom)',
        }}
      >
        {TopBar}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'center',
            padding: '32px 20px 0 20px',
            position: 'relative',
          }}
        >
          <h2 style={{ marginBottom: '24px', fontWeight: 'bold' }}>
            Your Mints
          </h2>
          {!isConnected && (
            <div style={{ color: '#ff4444', marginBottom: '16px' }}>
              Please connect your wallet to view or mint NFTs.
              <button
                onClick={() => connect({ connector: connectors[0] })}
                style={{
                  fontSize: '1rem',
                  backgroundColor: '#6C9BCF',
                  color: '#fff',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Connect Wallet
              </button>
              {connectError && (
                <div style={{ color: '#ff4444', fontSize: '0.9rem' }}>
                  {connectError.message}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 80px)',
              gridGap: '18px',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            {vibes.map((vibe, idx) => (
              <div
                key={idx}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '18px',
                  background: '#EAEAE8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: minted.includes(idx)
                    ? '2px solid #6C9BCF'
                    : '2px solid #ccc',
                  position: 'relative',
                  cursor: minted.includes(idx) ? 'pointer' : 'default',
                }}
                onClick={() => minted.includes(idx) && setLightbox({ open: true, idx })}
              >
                {minted.includes(idx) ? (
                  <>
                    <img
                      src={vibe.gif}
                      alt={`Minted vibe ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {mintCounts[idx] > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 8,
                          background: '#6C9BCF',
                          color: '#fff',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          padding: '2px 7px',
                          opacity: 0.92,
                          pointerEvents: 'none',
                        }}
                      >
                        x{mintCounts[idx]}
                      </span>
                    )}
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: '2.5rem',
                      color: '#A8B0CD',
                      fontWeight: 'bold',
                    }}
                  >
                    ?
                  </span>
                )}
              </div>
            ))}
          </div>
          <div
            style={{ color: '#888', fontSize: '1rem', marginBottom: 24 }}
          >
            {minted.length === 0
              ? 'You have not minted any vibes yet.'
              : `You have minted ${minted.length} vibe${
                  minted.length > 1 ? 's' : ''
                }!`}
          </div>
          <button
            onClick={() => setScreen('home')}
            style={{
              fontSize: '1.1rem',
              backgroundColor: '#6C9BCF',
              color: '#fff',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '8px',
              marginTop: 0,
              minWidth: '120px',
            }}
          >
            Mint More
          </button>
          <div
            style={{
              color: '#6C9BCF',
              fontSize: '1rem',
              marginBottom: 32,
              marginTop: 12,
              fontWeight: 'bold',
            }}
          >
            Pssst, try gifting an NFT by selecting one above.
          </div>
          {lightbox.open && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setLightbox({ open: false, idx: 0 });
                  setGiftingIdx(null);
                }
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.08)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  background: 'transparent',
                  borderRadius: 24,
                  padding: 0,
                  minWidth: 240,
                  minHeight: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {minted.length > 1 && prevMinted !== undefined && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ open: true, idx: prevMinted });
                    }}
                    style={{
                      position: 'absolute',
                      left: -40,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6C9BCF',
                      fontSize: 36,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      boxShadow: 'none',
                    }}
                    aria-label="Previous"
                  >
                    ❮
                  </button>
                )}
                <img
                  src={vibes[lightbox.idx].gif}
                  alt={`Minted vibe ${lightbox.idx}`}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'contain',
                    borderRadius: 16,
                    boxShadow: '0 4px 32px #0002',
                  }}
                />
                {minted.length > 1 && nextMinted !== undefined && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ open: true, idx: nextMinted });
                    }}
                    style={{
                      position: 'absolute',
                      right: -40,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6C9BCF',
                      fontSize: 36,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      boxShadow: 'none',
                    }}
                    aria-label="Next"
                  >
                    ❯
                  </button>
                )}
              </div>
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  gap: 16,
                  padding: '18px 0',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxShare(lightbox.idx);
                  }}
                  style={{
                    fontSize: '1.1rem',
                    backgroundColor: '#fff',
                    color: '#000',
                    padding: '8px 22px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox({ open: false, idx: 0 });
                    setGiftingIdx(lightbox.idx);
                    setScreen('gifting');
                  }}
                  style={{
                    fontSize: '1.1rem',
                    backgroundColor: '#6C9BCF',
                    color: '#fff',
                    padding: '8px 22px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Gift
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Gifting screen (unchanged except for error display)
  if (screen === 'gifting') {
    return (
      <div
        style={{
          backgroundColor: '#DCE5FF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          paddingBottom: 'var(--safe-area-inset-bottom)',
        }}
      >
        {TopBar}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'center',
            padding: '32px 20px 0 20px',
            position: 'relative',
          }}
        >
          <div
            style={{
              marginBottom: 16,
              fontWeight: 'bold',
              color: '#6C9BCF',
              fontSize: '1.2rem',
            }}
          >
            Gift this NFT
          </div>
          <img
            src={vibes[giftingIdx]?.gif}
            alt={`Gifted vibe ${giftingIdx}`}
            style={{
              width: 120,
              height: 120,
              objectFit: 'contain',
              borderRadius: 16,
              marginBottom: 18,
              background: '#EAEAE8',
            }}
          />
          <input
            type="text"
            placeholder="Farcaster username"
            value={giftUsername}
            onChange={(e) => setGiftUsername(e.target.value)}
            onKeyDown={handleGiftInputKeyDown}
            style={{
              fontSize: '1.1rem',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #6C9BCF',
              marginBottom: 12,
              outline: 'none',
              width: 220,
              background: '#fff',
              color: '#333',
            }}
          />
          {giftUsername && (
            <button
              onClick={() => setGiftUsername('')}
              style={{
                position: 'absolute',
                right: 30,
                top: 56,
                background: 'none',
                border: 'none',
                color: '#6C9BCF',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          )}
          {isSearching && (
            <div
              style={{ color: '#A8B0CD', fontSize: '0.95rem', marginBottom: 6 }}
            >
              Searching...
            </div>
          )}
          {userSuggestions.length > 0 && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #A8B0CD',
                borderRadius: '8px',
                marginBottom: 8,
                width: 220,
                maxHeight: 140,
                overflowY: 'auto',
                boxShadow: '0 2px 8px #0001',
                zIndex: 2200,
                position: 'relative',
              }}
            >
              {userSuggestions.map((u) => (
                <div
                  key={u.fid || u.username}
                  onClick={() =>
                    addSelectedUser({
                      username: u.username,
                      pfp_url: u.pfp_url,
                      custody_address: u.custody_address,
                    })
                  }
                  style={{
                    padding: '7px 12px',
                    cursor: 'pointer',
                    color: '#333',
                    fontSize: '1rem',
                    borderBottom: '1px solid #F0F0F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                  }}
                >
                  {u.pfp_url && (
                    <img
                      src={u.pfp_url}
                      alt={u.username}
                      style={{ width: 22, height: 22, borderRadius: '50%' }}
                    />
                  )}
                  <span>@{u.username}</span>
                </div>
              ))}
            </div>
          )}
          {!isSearching &&
            giftUsername.trim() &&
            userSuggestions.length === 0 &&
            giftUsername !== '' && (
              <div
                style={{
                  color: '#A8B0CD',
                  fontSize: '0.95rem',
                  marginBottom: 8,
                }}
              >
                No users found.
              </div>
            )}
          <div style={{ marginTop: 10, marginBottom: 16, width: 220 }}>
            <div
              style={{
                color: '#6C9BCF',
                fontSize: '0.95rem',
                marginBottom: 4,
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: '0.01em',
              }}
            >
              Most Interacted
            </div>
            <div
              style={{
                display: 'flex',
                gap: 18,
                flexWrap: 'nowrap',
                justifyContent: 'center',
                maxWidth: 220,
              }}
            >
              {mostInteracted.slice(0, 3).map((u) => (
                <div
                  key={u.username}
                  onClick={() =>
                    addSelectedUser({
                      username: u.username,
                      pfp_url: u.pfp_url,
                    })
                  }
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    maxWidth: 40,
                    marginBottom: 4,
                  }}
                >
                  <img
                    src={u.pfp_url}
                    alt={u.username}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      marginBottom: 2,
                      border: '2px solid #A8B0CD',
                      objectFit: 'cover',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#6C9BCF',
                      wordBreak: 'break-all',
                      textAlign: 'center',
                    }}
                  >
                    @{u.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {selectedUsers.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                margin: '10px 0 18px 0',
                justifyContent: 'center',
                width: 220,
              }}
            >
              {selectedUsers.map((u) => (
                <div
                  key={u.username}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={u.pfp_url}
                    alt={u.username}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '2px solid #6C9BCF',
                      objectFit: 'cover',
                      background: '#fff',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#6C9BCF',
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    @{u.username}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#fff',
                      borderRadius: '50%',
                      border: '2px solid #6C9BCF',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6C9BCF',
                      fontWeight: 'bold',
                      fontSize: 13,
                    }}
                  >
                    ✓
                  </span>
                  <button
                    onClick={() => removeSelectedUser(u.username)}
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      background: '#fff',
                      border: '1px solid #A8B0CD',
                      borderRadius: '50%',
                      width: 16,
                      height: 16,
                      color: '#A8B0CD',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {selectedUsers.length > 0 && (
            <div
              style={{
                color: '#6C9BCF',
                fontSize: '1.05rem',
                textAlign: 'center',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              You are sending {selectedUsers.length} NFT
              {selectedUsers.length > 1 ? 's' : ''}.
              {selectedUsers.length > 0 &&
                giftingIdx !== null &&
                giftingIdx !== undefined &&
                mintCounts[giftingIdx] > 0 &&
                selectedUsers.length > mintCounts[giftingIdx] && (
                  <div
                    style={{
                      color: '#ff4444',
                      fontSize: '0.98rem',
                      marginTop: 2,
                      fontWeight: 'bold',
                    }}
                  >
                    You only have {mintCounts[giftingIdx]} edition
                    {mintCounts[giftingIdx] > 1 ? 's' : ''} of this NFT. Sending to{' '}
                    {selectedUsers.length} user
                    {selectedUsers.length > 1 ? 's' : ''} may fail.
                  </div>
                )}
            </div>
          )}
          {sendError && (
            <div
              style={{
                color: '#ff4444',
                fontSize: '0.95rem',
                marginBottom: 8,
              }}
            >
              {sendError}
            </div>
          )}
          <button
            onClick={handleGiftSend}
            style={{
              fontSize: '1.1rem',
              backgroundColor: '#6C9BCF',
              color: '#fff',
              padding: '8px 22px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: txLoading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px #0001',
              marginTop: 8,
            }}
            disabled={selectedUsers.length === 0 || txLoading}
          >
            {txLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    );
  }

  // Updated transaction screen
  if (screen === 'tx') {
    return (
      <div
        style={{
          backgroundColor: '#DCE5FF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontFamily: 'sans-serif',
          position: 'relative',
          zIndex: 4000,
          paddingBottom: 'var(--safe-area-inset-bottom)',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: '40px 32px',
            minWidth: 280,
            textAlign: 'center',
            boxShadow: '0 4px 32px #0002',
            marginTop: 60,
          }}
        >
          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#6C9BCF',
              marginBottom: 12,
            }}
          >
            {txPending
              ? 'Transaction Pending'
              : txHash
              ? 'Transaction Successful!'
              : 'Transaction Failed'}
          </div>
          {txHash && (
            <>
              <div
                style={{
                  fontSize: '1.05rem',
                  color: '#333',
                  marginBottom: 10,
                }}
              >
                Transaction Hash:
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  color: '#888',
                  fontSize: '0.8rem',
                  marginBottom: 18,
                  wordBreak: 'break-all',
                }}
              >
                {txHash}
              </div>
            </>
          )}
          {txError && (
            <div
              style={{
                color: '#ff4444',
                fontSize: '0.95rem',
                marginBottom: 12,
              }}
            >
              Error: {txError.message}
            </div>
          )}
          {txHash && (
            <button
              onClick={handleGiftShare}
              style={{
                fontSize: '1.1rem',
                backgroundColor: '#6C9BCF',
                color: '#fff',
                padding: '10px 24px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: pendingShare ? 'wait' : 'pointer',
                marginBottom: 8,
                minWidth: 120,
              }}
              disabled={pendingShare}
            >
              {pendingShare ? 'Sharing...' : 'Share'}
            </button>
          )}
          {txHash && (
            <div
              style={{
                color: '#6C9BCF',
                fontSize: '0.98rem',
                marginTop: 2,
              }}
            >
              cast to let them know
            </div>
          )}
          <button
            onClick={handleTxScreenClose}
            style={{
              fontSize: '1rem',
              backgroundColor: '#fff',
              color: '#6C9BCF',
              padding: '6px 18px',
              border: '1px solid #6C9BCF',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: 18,
            }}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // Home screen with wallet status
  return (
    <div
      style={{
        backgroundColor: '#DCE5FF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        position: 'relative',
        paddingBottom: 'var(--safe-area-inset-bottom)',
      }}
    >
      {showConfetti && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[...Array(7)].map((_, i) => {
            const size = 24 + Math.random() * 24;
            const left = 10 + Math.random() * 80;
            const top = 10 + Math.random() * 80;
            const delay = Math.random() * 0.7;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  width: size,
                  height: size,
                  opacity: 0.85,
                  animation: 'starpop 1.1s ease',
                  animationDelay: `${delay}s`,
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 139 181"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M65.5537 3.84493C66.2922 -0.617589 72.7078 -0.617573 73.4463 3.84494L83.9037 67.0319C84.1453 68.4913 85.1725 69.6983 86.5745 70.17L135.732 86.7088C139.364 87.931 139.364 93.069 135.732 94.2912L86.5745 110.83C85.1725 111.302 84.1453 112.509 83.9037 113.968L73.4463 177.155C72.7078 181.618 66.2922 181.618 65.5537 177.155L55.0963 113.968C54.8548 112.509 53.8275 111.302 52.4255 110.83L3.26826 94.2912C-0.364367 93.069 -0.364364 87.931 3.26826 86.7088L52.4255 70.17C53.8275 69.6983 54.8548 68.4913 55.0963 67.0319L65.5537 3.84493Z"
                    fill="white"
                  />
                </svg>
              </div>
            );
          })}
          <style>{`
            @keyframes starpop {
              0% { opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}
      {TopBar}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        {!result ? (
          <>
            <h1
              style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                marginBottom: '20px',
              }}
            >
              Show me today's energy
            </h1>
            {!isConnected && (
              <div style={{ color: '#ff4444', marginBottom: '16px' }}>
                Please connect your wallet to mint NFTs.
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  style={{
                    fontSize: '1rem',
                    backgroundColor: '#6C9BCF',
                    color: '#fff',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  Connect Wallet
                </button>
                {connectError && (
                  <div style={{ color: '#ff4444', fontSize: '0.9rem' }}>
                    {connectError.message}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleClick}
              style={{
                fontSize: '1.2rem',
                backgroundColor: '#fff',
                color: '#000',
                padding: '10px 24px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Try me!
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '20px' }}>{result.text}</h2>
            <img
              src={result.gif}
              alt="vibe gif"
              style={{
                width: '200px',
                height: '200px',
                objectFit: 'contain',
                backgroundColor: '#EAEAE8',
                borderRadius: '24px',
                padding: '10px',
                marginBottom: '20px',
              }}
            />
            {sendError && (
              <div
                style={{
                  color: '#ff4444',
                  fontSize: '0.95rem',
                  marginBottom: 12,
                }}
              >
                {sendError}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={handleShare}
                style={{
                  fontSize: '1.2rem',
                  backgroundColor: '#fff',
                  color: '#000',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '100px',
                }}
              >
                Share
              </button>
              <button
                onClick={handleMint}
                style={{
                  fontSize: '1.2rem',
                  backgroundColor: '#6C9BCF',
                  color: '#fff',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: txLoading ? 'wait' : 'pointer',
                  minWidth: '100px',
                }}
                disabled={txLoading || !isConnected}
              >
                {txLoading ? 'Minting...' : 'Mint'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setResult(null)}
                style={{
                  fontSize: '1.2rem',
                  backgroundColor: '#A8B0CD',
                  color: '#fff',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '0px',
                  minWidth: '100px',
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
      <div
        style={{
          padding: '10px',
          textAlign: 'center',
          color: 'white',
          fontSize: '0.9rem',
        }}
      >
        <a
          href="https://warpcast.com/miguelgarest.eth"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block' }}
          aria-label="Warpcast Miguelgarest profile"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[32px] h-[32px] mb-[4px]"
          >
            <path
              d="M8.2489 4.97778H23.7511V27.0222H21.4756V16.9244H21.4533C21.2017 14.1337 18.8563 11.9466 16 11.9466C13.1437 11.9466 10.7983 14.1337 10.5468 16.9244H10.5245V27.0222H8.2489V4.97778Z"
              fill="white"
            />
            <path
              d="M4.12445 8.10669L5.0489 11.2356H5.83111V23.8934C5.43837 23.8934 5.12 24.2117 5.12 24.6045V25.4578H4.97779C4.58506 25.4578 4.26666 25.7762 4.26666 26.1689V27.0223H12.2311V26.1689C12.2311 25.7762 11.9127 25.4578 11.52 25.4578H11.3778V24.6045C11.3778 24.2117 11.0594 23.8934 10.6667 23.8934H9.81335V8.10669H4.12445Z"
              fill="white"
            />
            <path
              d="M21.6178 23.8934C21.2251 23.8934 20.9067 24.2117 20.9067 24.6045V25.4578H20.7644C20.3717 25.4578 20.0533 25.7762 20.0533 26.1689V27.0223H28.0178V26.1689C28.0178 25.7762 27.6994 25.4578 27.3067 25.4578H27.1644V24.6045C27.1644 24.2117 26.8461 23.8934 26.4533 23.8934V11.2356H27.2356L28.16 8.10669H22.4711V23.8934H21.6178Z"
              fill="white"
            />
          </svg>
        </a>
        <div>© Miguelgarest, 2025.</div>
      </div>
    </div>
  );
}

export default App;