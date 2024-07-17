const express = require('express');
const axios = require('axios').default;
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

  const options = {
    method: "POST",
    url: "https://api.edenai.run/v2/image/generation",
    headers: {
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2MzNDMwODktMjIzNC00N2NmLThhZTctNTc0ZmFkNmViMDc1IiwidHlwZSI6ImFwaV90b2tlbiJ9.bbAJilWsmR5uxV2GfzhwmodlJpgcYk0mbXP59GmVVM0",
      'Content-Type': 'application/json'
    },
    data: {
      providers: "stabilityai",
      text: prompt,
      resolution: "512x512",
      settings: {
        "stabilityai": "stable-diffusion-v1-6"
      }
    },
  };

  try {
    const response = await axios.request(options);
    console.log('Full Response from Eden AI:', JSON.stringify(response.data, null, 2)); // Log the full response
    const imageUrl = response.data.stabilityai.items[0].image_resource_url; // Extract the image URL correctly
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
