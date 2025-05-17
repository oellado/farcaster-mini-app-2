import React, { useState, useEffect } from 'react';

const NEYNAR_API_KEY = '30558204-7AF3-44A6-9756-D14BBB60F5D2';

export default function GiftTest() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setSearchError('');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    const searchTerm = input.trim();
    let ignore = false;
    // Helper to set suggestions and stop searching
    const finish = (users) => {
      setSuggestions(users);
      setIsSearching(false);
      if (users.length === 0) setSearchError('No users found.');
    };
    Promise.all([
      fetch(`https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': NEYNAR_API_KEY,
          'x-neynar-experimental': 'false'
        }
      }).then(res => res.json()).then(data => (data.result && data.result.users) ? data.result.users : []),
      fetch(`https://api.neynar.com/v2/farcaster/user/by_username?username=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': NEYNAR_API_KEY,
          'x-neynar-experimental': 'false'
        }
      }).then(res => res.json()).then(data => (data.user && data.user.username) ? [data.user] : [])
    ]).then(([searchUsers, byUsernameUser]) => {
      if (!ignore) {
        let users = searchUsers || [];
        if (byUsernameUser.length > 0 && !users.some(u => u.username === byUsernameUser[0].username)) {
          users = [byUsernameUser[0], ...users];
        }
        finish(users);
      }
    }).catch((err) => { if (!ignore) { setSearchError('Search failed'); setIsSearching(false); } });
    return () => { ignore = true; };
  }, [input]);

  return (
    <div style={{ maxWidth: 340, margin: '40px auto', padding: 24, background: '#f6f8fa', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
      <h2>GiftTest: Farcaster Username Search</h2>
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setSelectedUser(null); }}
        placeholder="Type a Farcaster username"
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #bbb', marginBottom: 8, fontSize: '1.1rem' }}
      />
      {isSearching && <div style={{ color: '#888', fontSize: 14 }}>Searching...</div>}
      {searchError && <div style={{ color: 'red', fontSize: 14 }}>{searchError}</div>}
      {suggestions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, marginBottom: 8, maxHeight: 180, overflowY: 'auto' }}>
          {suggestions.map(u => (
            <div
              key={u.fid}
              onClick={() => { setSelectedUser(u); setInput(u.username); setSuggestions([]); }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f0f0f0' }}
            >
              {u.pfp_url && <img src={u.pfp_url} alt={u.username} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
              <span>@{u.username}</span>
              {u.display_name && <span style={{ color: '#888', fontSize: 13, marginLeft: 6 }}>{u.display_name}</span>}
            </div>
          ))}
        </div>
      )}
      {selectedUser && (
        <div style={{ margin: '12px 0', padding: 10, background: '#e6f7ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={selectedUser.pfp_url} alt={selectedUser.username} style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span>@{selectedUser.username}</span>
          {selectedUser.display_name && <span style={{ color: '#888', fontSize: 13, marginLeft: 6 }}>{selectedUser.display_name}</span>}
        </div>
      )}
      <button
        onClick={() => selectedUser && setShowModal(true)}
        disabled={!selectedUser}
        style={{ width: '100%', padding: 12, borderRadius: 8, background: selectedUser ? '#6C9BCF' : '#ccc', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: selectedUser ? 'pointer' : 'not-allowed' }}
      >
        Send
      </button>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,110,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 260, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6C9BCF', marginBottom: 12 }}>Mock Transaction Sent!</div>
            <div style={{ marginBottom: 18 }}>You sent a mock NFT to <b>@{selectedUser.username}</b></div>
            <button onClick={() => setShowModal(false)} style={{ padding: '8px 22px', borderRadius: 8, background: '#6C9BCF', color: '#fff', fontWeight: 'bold', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
} 