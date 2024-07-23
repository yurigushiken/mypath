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

  async function fetchPrompts() {
    const response = await fetch('/get-prompts');
    return response.json();
  }

  async function generatePath() {
    ctx.clearRect(0, 0, width, height);

    let x = Math.floor(Math.random() * cols);
    let y = Math.floor(Math.random() * rows);
    const endX = cols - 1;
    const endY = 0;

    let path = [[x, y]];

    while (x !== endX || y !== endY) {
      const dx = endX - x;
      const dy = endY - y;

      // Determine the direction to move
      const moveX = dx !== 0 ? (dx / Math.abs(dx)) : 0;
      const moveY = dy !== 0 ? (dy / Math.abs(dy)) : 0;

      // Randomly choose to move in x or y direction
      if (Math.random() < 0.5 && dx !== 0) {
        x += moveX;
      } else if (dy !== 0) {
        y += moveY;
      } else {
        x += moveX;
      }

      path.push([x, y]);
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
        drawPoint(path[0][0], path[0][1], 'Start');
        drawPoint(endX, endY, 'End');
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
    const prompts = await fetchPrompts();
    const imagePrompt = prompts.imagePrompt;

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
    const prompts = await fetchPrompts();
    const blurbPrompt = prompts.blurbPrompt;

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
