import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

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

function App() {
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  // Track minted NFTs by index (mocked)
  const [minted, setMinted] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, idx: 0 });

  useEffect(() => {
    sdk.actions.ready();
    // Fetch Farcaster user context
    sdk.context.then(ctx => {
      if (ctx && ctx.user) {
        setUser(ctx.user);
      }
    });
  }, []);

  const handleClick = () => {
    const random = vibes[Math.floor(Math.random() * vibes.length)];
    setResult(random);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await sdk.actions.composeCast({
        text: result.text, // Just include the text result
        embeds: [
          result.gif, // The GIF URL will be rendered as a media embed
          'https://warpcast.com/miniapps/F3EoBj27HyTd/daily-vibes' // Mini app embed
        ]
      });
    } catch (error) {
      console.error('Error sharing to Warpcast:', error);
    }
  };

  // Add a mock mint handler
  const handleMint = () => {
    if (!result) return;
    // Find the index of the current gif in vibes
    const idx = vibes.findIndex(v => v.gif === result.gif);
    if (idx !== -1 && !minted.includes(idx)) {
      setMinted([...minted, idx]);
    }
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setShowProfile(true);
    }, 1200);
  };

  // Lightbox navigation helpers
  const mintedSorted = minted.slice().sort((a, b) => a - b);
  const currentMintedIdx = mintedSorted.indexOf(lightbox.idx);
  const prevMinted = mintedSorted[currentMintedIdx - 1];
  const nextMinted = mintedSorted[currentMintedIdx + 1];

  // Profile/mints page
  if (showProfile) {
    return (
      <div style={{
        backgroundColor: '#DCE5FF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        position: 'relative'
      }}>
        {/* Header with back button and pfp */}
        <div style={{
          backgroundColor: '#BFC8E0',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          color: 'white',
          position: 'relative'
        }}>
          {/* Back button */}
          <button
            onClick={() => setShowProfile(false)}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: 0
            }}
            aria-label="Back"
          >
            ←
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
                cursor: 'pointer'
              }}
              onClick={() => setShowProfile(false)}
            />
          )}
        </div>
        {/* Profile content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'center',
          padding: '32px 20px 0 20px',
          position: 'relative'
        }}>
          <h2 style={{ marginBottom: '24px', fontWeight: 'bold' }}>Your Mints</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gridGap: '18px',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            {vibes.map((vibe, idx) => (
              <div key={idx} style={{
                width: '80px',
                height: '80px',
                borderRadius: '18px',
                background: '#EAEAE8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: minted.includes(idx) ? '2px solid #6C9BCF' : '2px solid #ccc',
                position: 'relative',
                cursor: minted.includes(idx) ? 'pointer' : 'default'
              }}
                onClick={() => minted.includes(idx) && setLightbox({ open: true, idx })}
              >
                {minted.includes(idx) ? (
                  <img
                    src={vibe.gif}
                    alt={`Minted vibe ${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '2.5rem', color: '#A8B0CD', fontWeight: 'bold' }}>?</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ color: '#888', fontSize: '1rem' }}>
            {minted.length === 0 ? 'You have not minted any vibes yet.' : `You have minted ${minted.length} vibe${minted.length > 1 ? 's' : ''}!`}
          </div>

          {/* Lightbox overlay */}
          {lightbox.open && (
            <div
              onClick={e => {
                if (e.target === e.currentTarget) setLightbox({ open: false, idx: 0 });
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.45)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              {/* Main GIF in lightbox */}
              <div style={{ position: 'relative', background: '#fff', borderRadius: 24, padding: 16, boxShadow: '0 4px 32px #0002', minWidth: 240, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Left arrow */}
                {minted.length > 1 && prevMinted !== undefined && (
                  <button
                    onClick={e => { e.stopPropagation(); setLightbox({ open: true, idx: prevMinted }); }}
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: '#EAEAE8', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                )}
                <img
                  src={vibes[lightbox.idx].gif}
                  alt={`Minted vibe ${lightbox.idx}`}
                  style={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 16 }}
                />
                {/* Right arrow */}
                {minted.length > 1 && nextMinted !== undefined && (
                  <button
                    onClick={e => { e.stopPropagation(); setLightbox({ open: true, idx: nextMinted }); }}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#EAEAE8', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Next"
                  >
                    ›
                  </button>
                )}
                {/* Home button (top right) */}
                <button
                  onClick={() => { setShowProfile(false); setLightbox({ open: false, idx: 0 }); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: '#BFC8E0', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px #0001' }}
                  aria-label="Home"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="white"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#DCE5FF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      position: 'relative'
    }}>
      {/* Confetti/Sparkle animation overlay */}
      {showConfetti && (
        <div style={{
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
        }}>
          {/* SVG stars/sparks animation */}
          {[...Array(14)].map((_, i) => {
            const size = 24 + Math.random() * 24;
            const left = 10 + Math.random() * 80;
            const top = 10 + Math.random() * 80;
            const rotate = Math.random() * 360;
            const delay = Math.random() * 0.5;
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
                  transform: `rotate(${rotate}deg)`,
                  animation: 'starpop 1.1s ease',
                  animationDelay: `${delay}s`,
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 139 181" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M65.5537 3.84493C66.2922 -0.617589 72.7078 -0.617573 73.4463 3.84494L83.9037 67.0319C84.1453 68.4913 85.1725 69.6983 86.5745 70.17L135.732 86.7088C139.364 87.931 139.364 93.069 135.732 94.2912L86.5745 110.83C85.1725 111.302 84.1453 112.509 83.9037 113.968L73.4463 177.155C72.7078 181.618 66.2922 181.618 65.5537 177.155L55.0963 113.968C54.8548 112.509 53.8275 111.302 52.4255 110.83L3.26826 94.2912C-0.364367 93.069 -0.364364 87.931 3.26826 86.7088L52.4255 70.17C53.8275 69.6983 54.8548 68.4913 55.0963 67.0319L65.5537 3.84493Z" fill="white"/>
                </svg>
              </div>
            );
          })}
          <style>{`
            @keyframes starpop {
              0% { transform: scale(0.2) rotate(0deg); opacity: 0.7; }
              60% { transform: scale(1.2) rotate(20deg); opacity: 1; }
              100% { transform: scale(0.7) rotate(0deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      {/* Header */}
      <div style={{
        backgroundColor: '#BFC8E0',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: 'white',
        position: 'relative'
      }}>
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
              cursor: 'pointer'
            }}
            onClick={() => setShowProfile(true)}
          />
        )}
      </div>

      {/* Main */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px'
      }}>
        {!result ? (
          <>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              Show me today's energy
            </h1>
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
                cursor: 'pointer'
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
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
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
                  minWidth: '100px'
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
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                Mint
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
                  minWidth: '100px'
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px',
        textAlign: 'center',
        color: 'white',
        fontSize: '0.9rem'
      }}>
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
