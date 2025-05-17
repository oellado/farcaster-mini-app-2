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
    alert('Minting (mock)...');
  };

  return (
    <div style={{
      backgroundColor: '#DCE5FF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
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
              transform: 'translateY(-50%)'
            }}
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
