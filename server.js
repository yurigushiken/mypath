const express = require('express');
const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Serve static files from the 'media' directory with correct MIME types
app.use('/media', express.static(path.join(__dirname, 'media'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === '.wav') {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (ext === '.mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  }
}));

// Serve index.html at root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to generate the poem
app.post('/generate-poem', async (req, res) => {
  const poemPrompt = `Please write a poetic blurb (2 verses max) about success in the classroom from the perspective of a student with a learning disability who is studying under a teacher who uses Universal Design for Learning (UDL). The student studies in an inclusive classroom, where students can learn without being segregated or singled out due to perceived disability. The student’s performance flourished when their teacher presumed their competence (Five Moore Minutes, 2021). Their teacher followed the three core principles of UDL (Universal Design for Learning): Engagement, Representation, and Expression. The student states explicitly their disability, how their teacher allowed for achieving success, emphasizing how inclusive education practices helped them find their own path to learning.`;

  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // Use environment variable for API key
    },
    data: {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: poemPrompt }
      ]
    },
  };

  try {
    const response = await axios.request(options);
    const poem = response.data.choices[0].message.content;
    res.json({ poem: poem });
  } catch (error) {
    console.error('Error generating poem:', error.response ? error.response.data : error.message); // Log the full error response
    res.status(500).send('Error generating poem');
  }
});

// Endpoint to generate the image based on the poem using Eden AI
app.post('/generate-image', async (req, res) => {
  const poem = req.body.poem;

  const options = {
    method: "POST",
    url: "https://api.edenai.run/v2/image/generation",
    headers: {
      'Authorization': `Bearer ${process.env.EDENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: {
      providers: "stabilityai",  // Select the image generation provider
      text: poem,
      resolution: "512x512",  // Set image size to 512x512
      settings: {
        "stabilityai": "stable-diffusion-v1-6"  // Use the appropriate model or engine
      }
    },
  };

  try {
    const response = await axios.request(options);
    console.log('API Response:', response.data);

    if (response.data.stabilityai && response.data.stabilityai.items && response.data.stabilityai.items[0].image_resource_url) {
      const imageUrl = response.data.stabilityai.items[0].image_resource_url;
      res.json({ image_url: imageUrl });
    } else {
      console.error('Image URL not found in response:', response.data);
      res.status(500).json({ error: 'Image URL not found in API response' });
    }
  } catch (error) {
    console.error('Error generating image:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error generating image', details: error.response ? error.response.data : error.message });
  }
});

// Endpoint to generate the audio file for the poem
app.post('/generate-audio', async (req, res) => {
  const poem = req.body.poem;
  const audioFilePath = path.join(__dirname, 'public', 'poem.mp3');

  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/audio/speech",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    data: {
      model: "tts-1",
      voice: "nova",  // Use the NOVA voice
      input: poem
    },
    responseType: 'stream'
  };

  try {
    const response = await axios.request(options);
    const writer = fs.createWriteStream(audioFilePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      res.json({ audio_url: '/poem.mp3' });
    });

    writer.on('error', (error) => {
      console.error('Error saving audio file:', error);
      res.status(500).json({ error: 'Error saving audio file' });
    });
  } catch (error) {
    console.error('Error generating audio:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error generating audio', details: error.response ? error.response.data : error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
