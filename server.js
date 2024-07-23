const express = require('express');
const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Read prompts from the JSON file
const promptsPath = path.join(__dirname, 'prompts.json');
const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));

// Serve index.html at root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to serve prompts
app.get('/get-prompts', (req, res) => {
  res.json(prompts);
});

app.post('/generate-image', async (req, res) => {
  const prompt = prompts.imagePrompt;

  const options = {
    method: "POST",
    url: "https://api.edenai.run/v2/image/generation",
    headers: {
      authorization: `Bearer ${process.env.EDENAI_API_KEY}`, // Use environment variable for API key
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
    const imageUrl = response.data.stabilityai.items[0].image_resource_url;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error generating image:', error.response.data); // Log the full error response
    res.status(500).send('Error generating image');
  }
});

app.post('/generate-blurb', async (req, res) => {
  const prompt = prompts.blurbPrompt;

  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // Use environment variable for API key
    },
    data: {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    },
  };

  try {
    const response = await axios.request(options);
    const blurb = response.data.choices[0].message.content;
    res.json({ blurb: blurb });
  } catch (error) {
    console.error('Error generating blurb:', error.response.data); // Log the full error response
    res.status(500).send('Error generating blurb');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
