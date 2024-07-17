document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mazeCanvas');
  const ctx = canvas.getContext('2d');
  const regenerateBtn = document.getElementById('regenerateBtn');

  const width = canvas.width;
  const height = canvas.height;
  const gridSize = 20;
  const cols = width / gridSize;
  const rows = height / gridSize;

  let animationId;

  async function generatePath() {
    ctx.clearRect(0, 0, width, height);

    let x = 0;
    let y = rows - 1;
    let path = [[x, y]];

    const pathStyle = Math.floor(Math.random() * 8); // 0-7: different styles

    while (x < cols - 1 || y > 0) {
      let newX, newY;
      if (x === cols - 1) {
        newX = x;
        newY = y - 1;
      } else if (y === 0) {
        newX = x + 1;
        newY = y;
      } else {
        newX = Math.random() < 0.6 ? x + 1 : x;
        newY = newX === x ? y - 1 : y;
      }

      switch(pathStyle) {
        case 0: // Straight with occasional jogs
          if (Math.random() < 0.2) {
            let jogX = x + (Math.random() < 0.5 ? -1 : 1);
            let jogY = y + (Math.random() < 0.5 ? -1 : 1);
            path.push([jogX, jogY]);
          }
          path.push([newX, newY]);
          break;
        case 1: // Curved with varying control points
          let ctrlX1 = x + (newX - x) * (Math.random() * 0.8 - 0.4);
          let ctrlY1 = y + (newY - y) * (Math.random() * 0.8 - 0.4);
          let ctrlX2 = newX + (x - newX) * (Math.random() * 0.8 - 0.4);
          let ctrlY2 = newY + (y - newY) * (Math.random() * 0.8 - 0.4);
          path.push([x, y, ctrlX1, ctrlY1, ctrlX2, ctrlY2, newX, newY]);
          break;
        case 2: // Zigzag with random zag size
          let zagX = x + (newX - x) * (0.3 + Math.random() * 0.4);
          let zagY = y + (newY - y) * (0.3 + Math.random() * 0.4);
          path.push([zagX, y], [zagX, newY], [newX, newY]);
          break;
        case 3: // Loopy with varying loop sizes
          let loopSize = 0.5 + Math.random() * 1.5;
          let loopX = x + (newX - x) * 0.5 + (Math.random() - 0.5) * loopSize;
          let loopY = y + (newY - y) * 0.5 + (Math.random() - 0.5) * loopSize;
          path.push([loopX, loopY], [newX, newY]);
          break;
        case 4: // Spiral
          let spiralX = x, spiralY = y;
          for (let i = 0; i < 5; i++) {
            spiralX += Math.cos(i * 0.5) * 0.5;
            spiralY += Math.sin(i * 0.5) * 0.5;
            path.push([spiralX, spiralY]);
          }
          path.push([newX, newY]);
          break;
        case 5: // Staircase
          path.push([x, newY], [newX, newY]);
          break;
        case 6: // Bouncy
          let bounceY = y + (newY - y) * (Math.random() * 2 - 1);
          path.push([x, bounceY], [newX, bounceY], [newX, newY]);
          break;
        case 7: // Wild card (combination of others)
          let subStyle = Math.floor(Math.random() * 7);
          switch(subStyle) {
            case 0:
              path.push([newX, newY]);
              break;
            case 1:
              let ctrlX = x + (newX - x) * (Math.random() * 1.5 - 0.75);
              let ctrlY = y + (newY - y) * (Math.random() * 1.5 - 0.75);
              path.push([x, y, ctrlX, ctrlY, newX, newY]);
              break;
            case 2:
              let midX = (x + newX) / 2, midY = (y + newY) / 2;
              path.push([midX, y], [midX, newY], [newX, newY]);
              break;
            case 3:
              let loopX = x + (newX - x) * (Math.random() * 2 - 0.5);
              let loopY = y + (newY - y) * (Math.random() * 2 - 0.5);
              path.push([loopX, loopY], [newX, newY]);
              break;
            case 4:
              for (let i = 0; i < 3; i++) {
                let spiralX = x + (newX - x) * (i / 3) + Math.cos(i * 2) * 0.3;
                let spiralY = y + (newY - y) * (i / 3) + Math.sin(i * 2) * 0.3;
                path.push([spiralX, spiralY]);
              }
              path.push([newX, newY]);
              break;
            case 5:
              path.push([x, newY], [newX, newY]);
              break;
            case 6:
              let bounceY = y + (newY - y) * (Math.random() * 3 - 1.5);
              path.push([x, bounceY], [newX, bounceY], [newX, newY]);
              break;
          }
          break;
      }

      x = newX;
      y = newY;
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
        
        if (path[step + 1].length === 8) {
          // Curved path
          ctx.bezierCurveTo(
            path[step + 1][2] * gridSize, path[step + 1][3] * gridSize,
            path[step + 1][4] * gridSize, path[step + 1][5] * gridSize,
            path[step + 1][6] * gridSize, path[step + 1][7] * gridSize
          );
        } else if (path[step + 1].length === 6) {
          // Simpler curved path
          ctx.quadraticCurveTo(
            path[step + 1][2] * gridSize, path[step + 1][3] * gridSize,
            path[step + 1][4] * gridSize, path[step + 1][5] * gridSize
          );
        } else {
          // Straight line
          ctx.lineTo(path[step + 1][0] * gridSize, path[step + 1][1] * gridSize);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        step++;
        animationId = requestAnimationFrame(animate);
      } else {
        // Draw start and end points after animation is complete
        drawPoint(0, rows - 1, 'Start');
        drawPoint(cols - 1, 0, 'End');
      }
    }

    animate();

    // Generate and display the image
    await generateAndDisplayImage();
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
    const response = await fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: "anime image of a single happy diverse student. student should be celebrated for their diversity in ability. student should have disability illustrated"
      })
    });

    const data = await response.json();
    const imageUrl = data.image_url;
    console.log('Generated Image URL:', imageUrl); // Log the image URL

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      ctx.drawImage(img, 10, 10, 150, 150); // Draw the image in the upper left of the canvas
    };
  }

  regenerateBtn.addEventListener('click', generatePath);

  // Initial generation
  generatePath();
});
