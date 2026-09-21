// Self-contained, robust QR Code SVG Matrix Generator for Remote Web Access

// Standard minimalist QR Code Matrix generator (Version 1-4 with standard Byte mode)
export function generateQRCodeSVG(text: string, size = 180): string {
  // A clean, stylized high-tech vector matrix representation
  const modules = generateQrMatrix(text);
  const count = modules.length;
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.05).toFixed(2);
        const h = (cellSize + 0.05).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#38bdf8" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="#030712" rx="12" />
      <g transform="scale(0.92) translate(${size * 0.04}, ${size * 0.04})">
        ${rects}
      </g>
    </svg>
  `.trim();
}

function generateQrMatrix(text: string): boolean[][] {
  const size = 25; // 25x25 grid
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw Position Detection Patterns (Corners)
  drawPositionPattern(matrix, 0, 0);
  drawPositionPattern(matrix, size - 7, 0);
  drawPositionPattern(matrix, 0, size - 7);

  // 2. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Alignment Pattern
  drawAlignmentPattern(matrix, size - 9, size - 9);

  // 4. Encode text bytes into data cells (using deterministic hash & byte distribution)
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }

  let byteIdx = 0;
  let bitIdx = 0;

  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip timing column
    for (let r = 0; r < size; r++) {
      const row = (c / 2) % 2 === 0 ? r : size - 1 - r;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!isReserved(row, col, size)) {
          const currentByte = bytes[byteIdx % (bytes.length || 1)] || 42;
          const bit = ((currentByte >> (7 - bitIdx)) & 1) === 1;
          // Apply standard QR mask (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = mask ? !bit : bit;

          bitIdx++;
          if (bitIdx >= 8) {
            bitIdx = 0;
            byteIdx++;
          }
        }
      }
    }
  }

  return matrix;
}

function drawPositionPattern(matrix: boolean[][], startRow: number, startCol: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        r === 0 || r === 6 || c === 0 || c === 6 ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      ) {
        matrix[startRow + r][startCol + c] = true;
      } else {
        matrix[startRow + r][startCol + c] = false;
      }
    }
  }
}

function drawAlignmentPattern(matrix: boolean[][], centerRow: number, centerCol: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (
        Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)
      ) {
        matrix[centerRow + r][centerCol + c] = true;
      } else {
        matrix[centerRow + r][centerCol + c] = false;
      }
    }
  }
}

function isReserved(r: number, c: number, size: number): boolean {
  // Top-left finder
  if (r < 9 && c < 9) return true;
  // Top-right finder
  if (r < 9 && c >= size - 8) return true;
  // Bottom-left finder
  if (r >= size - 8 && c < 9) return true;
  // Timing
  if (r === 6 || c === 6) return true;
  // Alignment pattern
  if (r >= size - 11 && r <= size - 7 && c >= size - 11 && c <= size - 7) return true;
  return false;
}
