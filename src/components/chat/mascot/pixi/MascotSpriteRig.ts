import { Container, Sprite, Graphics } from "pixi.js";
import { EyeExpression, MascotActivity } from "../useMascotPlayEngine";
import {
  getChassisTexture,
  getVisorTexture,
  getFaceExpressionTexture,
  getAntennaTexture,
  getAuraGlowTexture,
} from "./mascotTextureFactory";

/**
 * Layer 2: Mascot Sprite Rig
 * Coordinates multi-layer hierarchical PixiJS sprites:
 * - Aura Glow Container (back layer)
 * - Robot Chassis Sprite (floating titanium body)
 * - Quantum Antenna Sprite (interactive beacon)
 * - Visor Screen Container (with digital scanlines)
 * - Face Expression Sprite (dynamic eyes & mouth states)
 * - Audio Waveform Spectrum Graphics (real-time voice equalizers)
 */

export class MascotSpriteRig {
  public root: Container;
  
  // Containers
  private auraContainer: Container;
  private bodyContainer: Container;
  private headContainer: Container;
  private visorContainer: Container;
  private faceContainer: Container;
  private fxContainer: Container;

  // Sprites
  private auraSprite: Sprite;
  private chassisSprite: Sprite;
  private antennaSprite: Sprite;
  private visorSprite: Sprite;
  private faceSprite: Sprite;

  // Real-time procedural audio visualizer
  private audioWaveGraphics: Graphics;
  private neuralRingGraphics: Graphics;

  // Internal state
  private currentExpression: EyeExpression = "normal";
  private currentThemeHex: string = "#38bdf8";
  private timeAccumulator: number = 0;
  private targetGazeX: number = 0;
  private targetGazeY: number = 0;
  private currentGazeX: number = 0;
  private currentGazeY: number = 0;

  constructor(themeHex: string = "#38bdf8") {
    this.currentThemeHex = themeHex;
    this.root = new Container();

    // 1. Aura glow layer
    this.auraContainer = new Container();
    this.auraSprite = new Sprite(getAuraGlowTexture(themeHex));
    this.auraSprite.anchor.set(0.5);
    this.auraSprite.scale.set(0.75);
    this.auraSprite.alpha = 0.55;
    this.auraContainer.addChild(this.auraSprite);
    this.root.addChild(this.auraContainer);

    // 2. Body & Head Container
    this.bodyContainer = new Container();
    this.headContainer = new Container();

    // 3. Chassis Sprite
    this.chassisSprite = new Sprite(getChassisTexture(themeHex));
    this.chassisSprite.anchor.set(0.5);
    this.chassisSprite.scale.set(0.48);
    this.headContainer.addChild(this.chassisSprite);

    // 4. Antenna Sprite (attached at top of head)
    this.antennaSprite = new Sprite(getAntennaTexture(themeHex));
    this.antennaSprite.anchor.set(0.5, 1.0);
    this.antennaSprite.position.set(0, -42);
    this.antennaSprite.scale.set(0.65);
    this.headContainer.addChild(this.antennaSprite);

    // 5. Visor Screen Container
    this.visorContainer = new Container();
    this.visorSprite = new Sprite(getVisorTexture());
    this.visorSprite.anchor.set(0.5);
    this.visorSprite.position.set(0, 2);
    this.visorSprite.scale.set(0.44);
    this.visorContainer.addChild(this.visorSprite);

    // 6. Face Expression Sprite
    this.faceContainer = new Container();
    this.faceSprite = new Sprite(getFaceExpressionTexture(this.currentExpression, themeHex));
    this.faceSprite.anchor.set(0.5);
    this.faceSprite.position.set(0, 2);
    this.faceSprite.scale.set(0.46);
    this.faceContainer.addChild(this.faceSprite);
    this.visorContainer.addChild(this.faceContainer);

    // 7. Audio Waveform Spectrum Graphics
    this.audioWaveGraphics = new Graphics();
    this.visorContainer.addChild(this.audioWaveGraphics);

    // 8. Neural ring for thinking state
    this.neuralRingGraphics = new Graphics();
    this.headContainer.addChild(this.neuralRingGraphics);

    this.headContainer.addChild(this.visorContainer);
    this.bodyContainer.addChild(this.headContainer);
    this.root.addChild(this.bodyContainer);

    // FX Container for particles/sparks
    this.fxContainer = new Container();
    this.root.addChild(this.fxContainer);
  }

  /**
   * Set target gaze offset based on user cursor coordinates [-1.0, 1.0]
   */
  public setGaze(x: number, y: number) {
    this.targetGazeX = Math.max(-1, Math.min(1, x));
    this.targetGazeY = Math.max(-1, Math.min(1, y));
  }

  /**
   * Update expression texture
   */
  public setExpression(expression: EyeExpression, themeHex?: string) {
    const activeHex = themeHex || this.currentThemeHex;
    if (this.currentExpression === expression && this.currentThemeHex === activeHex) return;

    this.currentExpression = expression;
    this.currentThemeHex = activeHex;
    this.faceSprite.texture = getFaceExpressionTexture(expression, activeHex);
  }

  /**
   * Update theme color palette across chassis and accessories
   */
  public setTheme(themeHex: string) {
    if (this.currentThemeHex === themeHex) return;
    this.currentThemeHex = themeHex;
    this.chassisSprite.texture = getChassisTexture(themeHex);
    this.antennaSprite.texture = getAntennaTexture(themeHex);
    this.auraSprite.texture = getAuraGlowTexture(themeHex);
    this.faceSprite.texture = getFaceExpressionTexture(this.currentExpression, themeHex);
  }

  /**
   * Render real-time audio waveform spectrum on the visor
   */
  public renderAudioWaveform(frequencies: number[], isSpeaking: boolean, volume: number = 0) {
    this.audioWaveGraphics.clear();
    if (!isSpeaking || !frequencies || frequencies.length === 0) return;

    const barCount = 10;
    const barWidth = 2.5;
    const gap = 1.8;
    const totalWidth = barCount * (barWidth + gap);
    const startX = -totalWidth / 2;
    const baseY = 16; // bottom of visor screen

    const step = Math.max(1, Math.floor(frequencies.length / barCount));

    for (let i = 0; i < barCount; i++) {
      const freqVal = (frequencies[i * step] || 0) / 255;
      const height = Math.min(14, Math.max(2, freqVal * 16 + volume * 8));

      this.audioWaveGraphics.roundRect(
        startX + i * (barWidth + gap),
        baseY - height,
        barWidth,
        height,
        1
      );
      this.audioWaveGraphics.fill({
        color: this.currentThemeHex,
        alpha: 0.85,
      });
    }
  }

  /**
   * Render holographic neural orbital ring during AI thinking
   */
  public renderNeuralRing(isThinking: boolean, dt: number) {
    this.neuralRingGraphics.clear();
    if (!isThinking) return;

    const radius = 38;
    const angle = this.timeAccumulator * 2.2;
    this.neuralRingGraphics.ellipse(0, 2, radius, radius * 0.45);
    this.neuralRingGraphics.stroke({
      color: 0x38bdf8,
      width: 1.5,
      alpha: 0.5 + Math.sin(this.timeAccumulator * 4) * 0.25,
    });

    // Orbiting data nodes
    for (let i = 0; i < 3; i++) {
      const nodeAngle = angle + (i * Math.PI * 2) / 3;
      const nx = Math.cos(nodeAngle) * radius;
      const ny = 2 + Math.sin(nodeAngle) * (radius * 0.45);

      this.neuralRingGraphics.circle(nx, ny, 2.5);
      this.neuralRingGraphics.fill({
        color: 0xffffff,
        alpha: 0.9,
      });
    }
  }

  /**
   * Ticker update: smooth spring gaze, breathing physics, antenna wobble
   */
  public update(
    deltaTime: number,
    activity: MascotActivity,
    isHovered: boolean,
    isSpeaking: boolean,
    isThinking: boolean,
    audioFrequencies: number[] = [],
    audioVolume: number = 0
  ) {
    this.timeAccumulator += deltaTime * 0.05;

    // 1. Smooth gaze interpolation
    this.currentGazeX += (this.targetGazeX - this.currentGazeX) * 0.12;
    this.currentGazeY += (this.targetGazeY - this.currentGazeY) * 0.12;

    // Head tilt and slight lateral shift based on gaze
    this.headContainer.rotation = this.currentGazeX * 0.18;
    this.visorContainer.position.x = this.currentGazeX * 6.5;
    this.visorContainer.position.y = this.currentGazeY * 4.5 + 2;

    // 2. Harmonic organic breathing float
    const breathSpeed = isSpeaking ? 8 : isThinking ? 5 : activity === "sleeping" ? 1.8 : 3.0;
    const floatAmplitude = isHovered ? 4.5 : 3.2;
    const floatY = Math.sin(this.timeAccumulator * breathSpeed) * floatAmplitude;
    this.bodyContainer.position.y = floatY;

    // 3. Antenna wobble physics
    const antennaWobble = Math.sin(this.timeAccumulator * (breathSpeed * 1.5)) * 0.14 - this.currentGazeX * 0.12;
    this.antennaSprite.rotation = antennaWobble;

    // 4. Aura breathing pulse
    const auraPulse = 0.72 + Math.sin(this.timeAccumulator * 2.5) * 0.08 + (isSpeaking ? audioVolume * 0.35 : 0);
    this.auraSprite.scale.set(auraPulse);
    this.auraSprite.alpha = isHovered ? 0.85 : 0.55 + (isSpeaking ? 0.3 : 0);

    // 5. Render real-time visor audio wave
    this.renderAudioWaveform(audioFrequencies, isSpeaking, audioVolume);

    // 6. Render neural ring if thinking
    this.renderNeuralRing(isThinking, deltaTime);

    // 7. Activity-specific physical micro-tweaks
    if (activity === "stare_curious") {
      this.headContainer.rotation += 0.22;
    } else if (activity === "idle_yawn") {
      this.headContainer.rotation -= 0.15;
    } else if (activity === "sleeping" || activity === "sleepy" || activity === "idle_drowsy") {
      this.headContainer.rotation = -0.12;
    }
  }

  /**
   * Release resources
   */
  public destroy() {
    this.root.destroy({ children: true });
  }
}
