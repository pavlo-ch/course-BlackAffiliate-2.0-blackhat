const fs = require('fs');
const path = require('path');

function generateSVG() {
  const width = 1920;
  const height = 1080;
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="100%" height="100%" fill="#000000"/>`;
  
  // Subtle grid
  const gridSize = 60;
  for (let x = 0; x <= width; x += gridSize) {
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#1f2937" stroke-width="1" stroke-opacity="0.3"/>`;
  }
  for (let y = 0; y <= height; y += gridSize) {
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#1f2937" stroke-width="1" stroke-opacity="0.3"/>`;
  }

  // Geometric elements (triangles, lines, circles)
  const colors = ['#b91c1c', '#991b1b', '#7f1d1d', '#450a0a']; // Different shades of red
  
  for (let i = 0; i < 250; i++) { // Increased count for density
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = x1 + (Math.random() - 0.5) * 300;
    const y2 = y1 + (Math.random() - 0.5) * 300;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const opacity = Math.random() * 0.5 + 0.1;
    
    const type = Math.random();
    if (type < 0.4) {
      // Lines
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${Math.random() * 1.5}" stroke-opacity="${opacity}"/>`;
    } else if (type < 0.7) {
      // Triangles/Polygons
      const x3 = x1 + (Math.random() - 0.5) * 150;
      const y3 = y1 + (Math.random() - 0.5) * 150;
      svg += `<path d="M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="${opacity}"/>`;
    } else {
      // Circles/Dots
      svg += `<circle cx="${x1}" cy="${y1}" r="${Math.random() * 3}" fill="${color}" fill-opacity="${opacity}"/>`;
    }
  }

  // Clustered "high density" areas (corners or random nodes)
  for (let j = 0; j < 20; j++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    for (let k = 0; k < 15; k++) {
      const tx = cx + (Math.random() - 0.5) * 120;
      const ty = cy + (Math.random() - 0.5) * 120;
      svg += `<line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="#991b1b" stroke-width="0.4" stroke-opacity="0.3"/>`;
      svg += `<circle cx="${tx}" cy="${ty}" r="1" fill="#ef4444" fill-opacity="0.5"/>`;
    }
  }

  svg += `</svg>`;
  return svg;
}

const outputPath = path.join('/Users/pavlo/Desktop/github/course-BlackAffiliate-2.0-blackhat', 'public/img/lesson-bg.svg');
fs.writeFileSync(outputPath, generateSVG());
console.log('SVG generated at ' + outputPath);
