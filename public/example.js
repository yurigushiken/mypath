document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('imageContainer');
  const poemContainer = document.getElementById('poemText');
  const audioIcon = document.getElementById('audioIcon');
  const musicIcon = document.getElementById('musicIcon');
  const promptIcon = document.getElementById('promptIcon');
  const poemAudio = document.getElementById('poemAudio');
  const audioSource = document.getElementById('audioSource');
  const backgroundAudio = document.getElementById('backgroundAudio');
  const promptContainer = document.getElementById('promptContainer');
  const promptText = document.getElementById('promptText');

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
      const poemTextValue = poemData.poem;

      // Apply typing effect to the poem text only after the poem is fully generated
      typeText(poemTextValue, poemContainer, 25);

      // Set the full prompt text with citations
      const prompt = `Please write a poetic blurb (2 verses max) about success in the classroom from the perspective of a student with a learning disability who is studying under a teacher who uses Universal Design for Learning (UDL). The student’s educators follow an inclusive rather than mainstreaming philosophical approach to education, where the onus is not on the student to prove that they can learn (Winterman & Rosas, 2014) but rather the student’s competence has been presumed first, and the student learns in ways that play to their strengths (Five Moore Minutes, 2021). The student studies in their least restrictive environment (LRE), an inclusive classroom with their non-disabled classmates as much as possible (Winterman, 2014), where they can learn without being segregated or singled out due to perceived disability. The student’s educators have rejected using “normality” as a tool for limitation and oppression, recognizing it instead as a malleable social construct (Sapon-Shevin, 2013). Teachers understand student behavior to carry meaningful messages to be interpreted, and that behavior is related to quality of life (Smith, 2013). Their teacher followed the three core principles of UDL (Universal Design for Learning): Engagement (motivating all learners to do their best work by getting them interested, challenging them, and keeping them motivated, achieved by implementing classroom strategies that empower and engage students, providing choices, reducing anxiety, and rewarding effort), Representation (focuses on teaching content in an accessible way by presenting it through various modalities such as videos, websites, pictures, and realia), and Expression (offering students multiple options to demonstrate their learning, moving beyond traditional tests and papers to include methods exploiting student strengths) (Spencer, 2011). The student states explicitly their disability, how their teacher allowed for achieving success, emphasizing how inclusive education practices helped them find their own path to learning.\n\nCitations:\n- Danforth, S. (2014). *Becoming a great inclusive educator*. Peter Lang Publishing.\n- Five Moore Minutes. (2021, February 1). The Importance of Presuming Competence [Video]. YouTube. https://www.youtube.com/watch?v=6Mq8sQTEhG8\n- Sapon-Shevin, M. (2013). How we respond to differences—and the difference it makes. In J. Lawrence-Brown et al., (Eds.), Inclusive education: Responding to the complexity of differences (pp. 29-45). Thousand Oaks, CA: Corwin Press.\n- Smith, R. M. (2013). Considering behavior as meaningful communication. In D. Lawrence-Brown & M. Sapon-Shevin (Eds.), Condition Critical: Key Principles for Equitable and Inclusive Education (pp. 154-169). Teachers College Press.\n- Spencer, S. A. (2011). Universal design for learning: Assistance for teachers in today’s inclusive classrooms. Interdisciplinary Journal of Teaching and Learning, 1(1), 10-22.\n- Winterman, K. G., & Rosas, C. E. (2014). The IEP checklist: Your guide to creating meaningful and compliant IEPs. Brookes Publishing.`;

      promptText.textContent = prompt;

      // Generate and display the image based on the poem
      const imageResponse = await fetch('/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poem: poemTextValue
        })
      });

      if (!imageResponse.ok) {
        console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
        return;
      }

      const imageData = await imageResponse.json();
      console.log('Image URL:', imageData.image_url);

      if (!imageData.image_url) {
        console.error('No image URL returned from API');
        return;
      }

      const img = new Image();
      img.src = imageData.image_url;
      img.alt = "Generated Reflection Image";

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
          poem: poemTextValue
        })
      });

      if (!audioResponse.ok) {
        console.error('Failed to fetch audio:', audioResponse.status, audioResponse.statusText);
        return;
      }

      const audioData = await audioResponse.json();
      audioSource.src = audioData.audio_url;
      poemAudio.load();

      adjustLayout();
    } catch (error) {
      console.error('Error generating content:', error);
    }
  }

  function typeText(text, container, delay = 25) {
    let i = 0;
    container.innerHTML = '';
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
    // Added to reset scroll position after toggling prompt
    imageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  audioIcon.addEventListener('click', () => {
    poemAudio.play();
  });

  musicIcon.addEventListener('click', () => {
    if (backgroundAudio.paused) {
      backgroundAudio.play();
      musicIcon.textContent = '🔊';
    } else {
      backgroundAudio.pause();
      musicIcon.textContent = '🔇';
    }
  });

  promptIcon.addEventListener('click', () => {
    if (promptContainer.style.display === 'none' || !promptContainer.style.display) {
      promptContainer.style.display = 'block';
    } else {
      promptContainer.style.display = 'none';
    }
    adjustLayout();
  });

  generateAndDisplayContent();
});
