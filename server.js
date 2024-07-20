const express = require('express');
const axios = require('axios').default;
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file
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
    console.log('Full Response from Eden AI:', JSON.stringify(response.data, null, 2)); 
    const imageUrl = response.data.stabilityai.items[0].image_resource_url; 
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error generating image:', error.response.data); // Log the full error response
    res.status(500).send('Error generating image');
  }
});


app.post('/generate-blurb', async (req, res) => {
  const prompt = "Please write a three-sentence blurb from the perspective of a student who is studying under a teacher who uses Universal Design for Learning (UDL). The student studies in an inclusive classroom, where students can learn without being segregated or singled out due to perceived disability. The student’s performance flourished when their teachers presumed their competence. Their teacher followed the three core principles of UDL (Universal Design for Learning): Engagement (motivating all learners to do their best work by getting them interested, challenging them, and keeping them motivated. This is achieved by implementing classroom strategies that empower and engage students, providing choices, reducing anxiety, and rewarding effort.), Representation (focuses on teaching content in an accessible way by presenting it through various modalities such as videos, websites, pictures, and realia), and Expression (offering students multiple options to demonstrate their learning, moving beyond traditional tests and papers to include methods exploiting student strengths). The student expresses how their teacher allowed for achieving success, emphasizing how inclusive education practices helped them find their own path to learning. The student does not need to use technical language in their blurb, however the strategic pedagogical intentions of the teacher should be inferable or implied in the blurb. Please be specific, as this inference will be run multiple times and we desire a unique story each inference.";

  const options = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // Use environment variable for API key
    },
    data: {
      model: "gpt-4o",  
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
