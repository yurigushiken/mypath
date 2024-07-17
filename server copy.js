require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Serve index.html at root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate-image', async (req, res) => {
  const prompt = req.body.prompt;

  const response = await fetch('https://api.edenai.run/v2/image/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EDENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      providers: "stabilityai",
      text: prompt,
      resolution: '512x512',
    })
  });

  const data = await response.json();
  const imageUrl = data.stabilityai.items[0].image_resource_url;

  res.json({ image_url: imageUrl });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
