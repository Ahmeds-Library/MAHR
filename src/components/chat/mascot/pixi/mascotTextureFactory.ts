import { Texture } from "pixi.js";
import { EyeExpression } from "../useMascotPlayEngine";

/**
 * Layer 1: Mascot Texture Factory
 * Generates ultra-crisp, high-resolution procedural sprite textures
 * for the high-tech holographic cyber robot companion.
 * 
 * Includes:
 * - Cybernetic Robot Chassis (spherical titanium hull with neon accents)
 * - Holographic Curved Glass Visor (dark glass with cyber grid scanlines)
 * - Expressive Eyes & Mouth Sprite Textures
 * - Quantum Antenna Crystal
 * - Energy Aura & Neural Ring Textures
 */

// Texture cache to prevent redundant canvas texture regeneration
const textureCache = new Map<string, Texture>();

function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Generates the High-Tech Robotic Chassis Texture
 */
export function getChassisTexture(colorHex: string = "#6366f1"): Texture {
  const key = `chassis_${colorHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = createOffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const center = size / 2;
  const radius = size * 0.44;

  // 1. Drop shadow / soft depth
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;

  // 2. Base Spherical Titanium Chassis with metallic radial gradient
  const grad = ctx.createRadialGradient(
    center - radius * 0.35,
    center - radius * 0.45,
    radius * 0.08,
    center,
    center,
    radius
  );
  grad.addColorStop(0, "#f8fafc");       // Specular highlight
  grad.addColorStop(0.25, "#cbd5e1");    // Titanium sheen
  grad.addColorStop(0.65, "#334155");    // Dark slate armor
  grad.addColorStop(0.92, "#0f172a");    // Deep cyber metallic base
  grad.addColorStop(1, "#020617");

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // 3. Cybernetic panel seams and rim grooves
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
  ctx.stroke();

  // Futuristic lateral ear nodes / cyber muff plates
  const earWidth = 14;
  const earHeight = 36;
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 2;
  
  // Left ear module
  ctx.beginPath();
  ctx.roundRect(center - radius - 6, center - earHeight / 2, earWidth, earHeight, 6);
  ctx.fill();
  ctx.stroke();

  // Right ear module
  ctx.beginPath();
  ctx.roundRect(center + radius - 8, center - earHeight / 2, earWidth, earHeight, 6);
  ctx.fill();
  ctx.stroke();

  // Glowing micro-LEDs on ear modules
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(center - radius + 1, center, 3, 0, Math.PI * 2);
  ctx.arc(center + radius - 1, center, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates the Holographic Visor Screen Texture
 */
export function getVisorTexture(): Texture {
  const key = "visor_base";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 200;
  const height = 120;
  const canvas = createOffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  // Curved digital screen visor with dark glass gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#090d16");
  grad.addColorStop(0.5, "#030712");
  grad.addColorStop(1, "#020617");

  ctx.beginPath();
  ctx.roundRect(8, 6, width - 16, height - 12, 38);
  ctx.fillStyle = grad;
  ctx.fill();

  // Visor rim metallic neon border
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Cyber scanlines
  ctx.fillStyle = "rgba(56, 189, 248, 0.05)";
  for (let y = 14; y < height - 14; y += 4) {
    ctx.fillRect(16, y, width - 32, 1.5);
  }

  // Top curved glass reflection glare
  const reflectionGrad = ctx.createLinearGradient(0, 6, 0, 45);
  reflectionGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
  reflectionGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

  ctx.beginPath();
  ctx.ellipse(width / 2, 22, width * 0.38, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = reflectionGrad;
  ctx.fill();

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates Facial Expression Texture (Eyes & Visor Face)
 */
export function getFaceExpressionTexture(expression: EyeExpression, themeHex: string = "#38bdf8"): Texture {
  const key = `face_${expression}_${themeHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 180;
  const height = 100;
  const canvas = createOffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const eyeColor = themeHex;
  const eyeGlow = themeHex;

  ctx.save();
  ctx.shadowColor = eyeGlow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = eyeColor;
  ctx.strokeStyle = eyeColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  const leftEyeX = width * 0.34;
  const rightEyeX = width * 0.66;
  const eyeY = height * 0.46;

  switch (expression) {
    case "happy":
    case "excited":
    case "loving": {
      // Cheerful curved upward arches ^ ^
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY + 4, 14, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY + 4, 14, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      // Cute smile
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, eyeY + 16, 10, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
      break;
    }

    case "sleepy":
    case "drowsy":
    case "yawn": {
      // Peaceful closed straight dash lines — —
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 12, eyeY);
      ctx.lineTo(leftEyeX + 12, eyeY);
      ctx.moveTo(rightEyeX - 12, eyeY);
      ctx.lineTo(rightEyeX + 12, eyeY);
      ctx.stroke();
      break;
    }

    case "thinking":
    case "analytical": {
      // Digital focused dots with animated look
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY - 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Curious mouth dot
      ctx.beginPath();
      ctx.arc(width / 2, eyeY + 18, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "talking": {
      // Bright wide eyes and open talking digital mouth
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY - 2, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY - 2, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Speaking mouth oval
      ctx.beginPath();
      ctx.ellipse(width / 2, eyeY + 20, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "bonked":
    case "dizzy": {
      // Small astonished spirals / X X eyes
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY, 13, 0, Math.PI * 2);
      ctx.fill();

      // Small O mouth
      ctx.beginPath();
      ctx.arc(width / 2, eyeY + 22, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "angry": {
      // Playful cute angry slanted brows > <
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 12, eyeY - 6);
      ctx.lineTo(leftEyeX + 12, eyeY + 4);
      ctx.moveTo(rightEyeX - 12, eyeY + 4);
      ctx.lineTo(rightEyeX + 12, eyeY - 6);
      ctx.stroke();
      break;
    }

    case "wink": {
      // Left eye open, right eye closed wink
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - 12, eyeY);
      ctx.lineTo(rightEyeX + 12, eyeY);
      ctx.stroke();
      break;
    }

    case "curious":
    case "normal":
    default: {
      // Sleek bright digital cyber-eyes with inner specular shine
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular bright core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(leftEyeX + 3, eyeY - 4, 3, 0, Math.PI * 2);
      ctx.arc(rightEyeX + 3, eyeY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates Quantum Antenna Crystal Texture
 */
export function getAntennaTexture(themeHex: string = "#38bdf8"): Texture {
  const key = `antenna_${themeHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const width = 60;
  const height = 70;
  const canvas = createOffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const center = width / 2;

  // Stalk rod
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(center, height);
  ctx.lineTo(center, 24);
  ctx.stroke();

  // Quantum floating energy crystal
  ctx.save();
  ctx.shadowColor = themeHex;
  ctx.shadowBlur = 12;

  const grad = ctx.createRadialGradient(center - 2, 14, 2, center, 16, 12);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, themeHex);
  grad.addColorStop(1, "rgba(99, 102, 241, 0.4)");

  ctx.beginPath();
  ctx.arc(center, 16, 9, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates Holographic Aura Soft Glow Texture
 */
export function getAuraGlowTexture(colorHex: string = "#38bdf8"): Texture {
  const key = `aura_${colorHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const size = 256;
  const canvas = createOffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Texture.WHITE;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 10, center, center, size / 2);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.35, "rgba(99, 102, 241, 0.5)");
  grad.addColorStop(0.7, "rgba(56, 189, 248, 0.2)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = Texture.from(canvas);
  textureCache.set(key, texture);
  return texture;
}
