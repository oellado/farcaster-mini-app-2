const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const NEYNAR_API_KEY = '30558204-7AF3-44A6-9756-D14BBB60F5D2';

app.get('/api/cast', async (req, res) => {
  try {
    const { hash } = req.query; // e.g., ?hash=0x1234
    const response = await axios.get('https://api.neynar.com/v2/farcaster/cast', {
      headers: {
        accept: 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
      params: {
        identifier: hash || '0x7d3ad4be401c0050cf20a060ebbd108383b6357c', // Sample cast hash
        type: 'hash',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Cast error:', error.message, error.response?.data);
    res.json({ error: 'Cast fetch failed' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});