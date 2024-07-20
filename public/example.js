document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mazeCanvas');
  const ctx = canvas.getContext('2d');
  const regenerateBtn = document.getElementById('regenerateBtn');

  const width = canvas.width;
  const height = canvas.height;
  const gridSize = 20;
  const cols = width / gridSize;
  const rows = height / gridSize;

  const imagePromptDiv = document.getElementById('imagePrompt');
  const blurbPromptDiv = document.getElementById('blurbPrompt');

  let animationId;

  async function generatePath() {
    ctx.clearRect(0, 0, width, height);

    let x = 0;
    let y = rows - 1;
    let path = [[x, y]];

    // Parameters for sine wave
    const amplitude = Math.random() * (rows - rows / 4) + rows / 4; // Varying amplitude with larger variations
    const frequency = Math.PI / (cols - 1); // One complete sine wave cycle over the width of the canvas
    const verticalShift = (Math.random() * rows / 2) - rows / 4; // Varying vertical shift to move the wave up or down

    while (x < cols - 1) {
      x++;
      y = Math.floor(amplitude * Math.sin(frequency * x) + verticalShift + rows / 2);

      path.push([x, y]);
    }

    // Ensure the path reaches the end
    if (path[path.length - 1][0] !== cols - 1 || path[path.length - 1][1] !== 0) {
      path.push([cols - 1, 0]);
    }

    // Cancel any ongoing animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    // Start the animation
    let step = 0;
    const color = getRandomColor();

    function animate() {
      if (step < path.length - 1) {
        ctx.beginPath();
        ctx.moveTo(path[step][0] * gridSize, path[step][1] * gridSize);

        ctx.lineTo(path[step + 1][0] * gridSize, path[step + 1][1] * gridSize);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        step++;
        animationId = requestAnimationFrame(animate);
      } else {
        // Draw start and end points after animation is complete
        drawPoint(0, rows - 1, 'Start');
        drawPoint(cols - 1, 0, 'End');
        // Ensure image and blurb generation after path drawing
        generateAndDisplayImage();
      }
    }

    animate();
  }

  function drawPoint(x, y, label) {
    ctx.beginPath();
    ctx.arc(x * gridSize, y * gridSize, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';

    // Adjust text placement
    let textX, textY;
    if (label === 'Start') {
      textX = x * gridSize + 10;
      textY = y * gridSize - 10;
    } else { // 'End'
      textX = x * gridSize - 40;
      textY = y * gridSize + 20;
    }

    ctx.fillText(label, textX, textY);
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  async function generateAndDisplayImage() {
    const imagePrompt = "Please create an anime image of a student who embodies diversity in terms of background and ability. The student may have a visible or invisible disability and is depicted in an inclusive classroom environment where their competence is presumed first. The scene should illustrate various UDL (Universal Design for Learning) principles, showing different teaching modalities such as technology use, group activities, hands-on learning, and individualized supports. The student is engaged, highlighting the positive impact of inclusive education practices.";
    try {
      const response = await fetch('/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: imagePrompt
        })
      });

      const data = await response.json();
      const imageUrl = data.image_url;
      console.log('Generated Image URL:', imageUrl);

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        ctx.drawImage(img, 10, 10, 300, 300); // Increased image size
        generateAndDisplayBlurb();
      };
      img.onerror = (e) => {
        console.error('Image load error', e);
      };

      // Display the image prompt
      imagePromptDiv.textContent = `Image Prompt: ${imagePrompt}`;
    } catch (error) {
      console.error('Error generating image:', error);
    }
  }

  async function generateAndDisplayBlurb() {
    const blurbPrompt = "Please write a three-sentence blurb from the perspective of a student who is studying under a teacher who uses Universal Design for Learning (UDL). The student studies in an inclusive classroom, where students can learn without being segregated or singled out due to perceived disability. The student’s performance flourished when their teachers presumed their competence. Their teacher followed the three core principles of UDL (Universal Design for Learning): Engagement (motivating all learners to do their best work by getting them interested, challenging them, and keeping them motivated. This is achieved by implementing classroom strategies that empower and engage students, providing choices, reducing anxiety, and rewarding effort.), Representation (focuses on teaching content in an accessible way by presenting it through various modalities such as videos, websites, pictures, and realia), and Expression (offering students multiple options to demonstrate their learning, moving beyond traditional tests and papers to include methods exploiting student strengths). The student expresses how their teacher allowed for achieving success, emphasizing how inclusive education practices helped them find their own path to learning. The student does not need to use technical language in their blurb, however the strategic pedagogical intentions of the teacher should be inferable or implied in the blurb. Please be specific, as this inference will be run multiple times and we desire a unique story each inference.";
    try {
      const response = await fetch('/generate-blurb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const blurb = data.blurb;

      // Display the blurb on the canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white background
      ctx.fillRect(width - 520, height - 280, 500, 270); // Increased size
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial'; // Increased font size
      wrapText(ctx, blurb, width - 510, height - 260, 480, 24); // Adjusted size and line height

      // Display the blurb prompt
      blurbPromptDiv.textContent = `Blurb Prompt: ${blurbPrompt}`;
    } catch (error) {
      console.error('Error generating blurb:', error);
    }
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

  regenerateBtn.addEventListener('click', generatePath);

  // Initial generation
  generatePath();
});
