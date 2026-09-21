// Generates valid PNG icons from canvas or binary PNG chunks
const fs = require('fs');
const path = require('path');

// A minimalist valid 192x192 and 512x512 PNG creator or copy
// We will generate an ultra-clean PNG file structure
function createMinimalPng(width, height, r, g, b) {
  // Simple uncompressed PNG header + IDAT
  const zlib = require('zlib');
  
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bit depth
  ihdrData.writeUInt8(2, 9); // RGB Truecolor
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter standard
  ihdrData.writeUInt8(0, 12); // No interlace
  
  const crc32 = (buf) => {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  };
  
  // CRC table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const combined = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  
  // Raw image scanlines
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        const factor = 1 - (dist / radius);
        rawData[pxOffset] = Math.min(255, Math.round(14 + factor * 40));     // R (dark slate to cyan-glow)
        rawData[pxOffset + 1] = Math.min(255, Math.round(165 + factor * 80)); // G
        rawData[pxOffset + 2] = Math.min(255, Math.round(233 + factor * 22)); // B
      } else {
        rawData[pxOffset] = 4;     // R (bg)
        rawData[pxOffset + 1] = 7; // G
        rawData[pxOffset + 2] = 17;// B
      }
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createMinimalPng(192, 192, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createMinimalPng(512, 512, 14, 165, 233));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), createMinimalPng(512, 512, 14, 165, 233));
console.log('PNG Icons successfully generated in /public');
