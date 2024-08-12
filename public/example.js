document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('imageContainer');
  const poemContainer = document.getElementById('poemText');
  const audioIcon = document.getElementById('audioIcon');
  const musicIcon = document.getElementById('musicIcon');
  const poemAudio = document.getElementById('poemAudio');
  const audioSource = document.getElementById('audioSource');
  const backgroundAudio = document.getElementById('backgroundAudio');

  async function generateAndDisplayContent() {
    try {
      // Generate the poem first
      const poemResponse = await fetch('/generate-poem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const poemData = await poemResponse.json();
      const poemText = poemData.poem;

      // Apply typing effect to the poem text only after the poem is fully generated
      typeText(poemText, poemContainer, 25); // Faster typing with a delay of 25ms

      // Generate and display the image based on the poem
      const imageResponse = await fetch('/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poem: poemText  // Pass the generated poem as input for the image
        })
      });

      if (!imageResponse.ok) {
        console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
        return;
      }

      const imageData = await imageResponse.json();
      console.log('Image URL:', imageData.image_url);  // Log the image URL

      if (!imageData.image_url) {
        console.error('No image URL returned from API');
        return;
      }

      const img = new Image();
      img.src = imageData.image_url;
      img.alt = "Generated Reflection Image";

      // Ensure image loading before appending
      img.onload = () => {
        console.log('Image loaded successfully');
        imageContainer.appendChild(img);
        adjustLayout();
      };

      img.onerror = () => {
        console.error('Failed to load image.');
      };

      // Generate and set up audio
      const audioResponse = await fetch('/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poem: poemText  // Pass the generated poem as input for the audio
        })
      });

      if (!audioResponse.ok) {
        console.error('Failed to fetch audio:', audioResponse.status, audioResponse.statusText);
        return;
      }

      const audioData = await audioResponse.json();
      audioSource.src = audioData.audio_url;
      poemAudio.load();  // Load the new audio source

      adjustLayout();
    } catch (error) {
      console.error('Error generating content:', error);
    }
  }

  function typeText(text, container, delay = 25) {
    let i = 0;
    container.innerHTML = ''; // Clear any previous content
    function type() {
      if (i < text.length) {
        container.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, delay);
      }
    }
    type();
  }

  function adjustLayout() {
    window.scrollTo(0, 0);
    document.body.style.minHeight = `${document.body.scrollHeight}px`;
  }

  // Play audio when the icon is clicked
  audioIcon.addEventListener('click', () => {
    poemAudio.play();
  });

  // Toggle background music on or off
  musicIcon.addEventListener('click', () => {
    if (backgroundAudio.paused) {
      backgroundAudio.play();
      musicIcon.textContent = '🔊';  // Change icon to indicate audio is playing
    } else {
      backgroundAudio.pause();
      musicIcon.textContent = '🔇';  // Change icon to indicate audio is muted
    }
  });

  // Initial content generation
  generateAndDisplayContent();
});
