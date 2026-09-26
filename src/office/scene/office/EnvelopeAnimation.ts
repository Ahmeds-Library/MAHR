import * as PIXI from 'pixi.js';

export class EnvelopeAnimation {
  private app: PIXI.Application;
  private sprite: PIXI.Graphics;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.sprite = this.createEnvelope();
  }

  private createEnvelope(): PIXI.Graphics {
    const g = new PIXI.Graphics();
    // Envelope base shape
    g.rect(0, 0, 20, 14);
    g.fill(0xfff9c4);
    g.stroke({ color: 0xf59e0b, width: 1.5 });
    
    // Envelope flap chevron
    g.moveTo(0, 0);
    g.lineTo(10, 8);
    g.lineTo(20, 0);
    g.stroke({ color: 0xf59e0b, width: 1 });
    
    g.pivot.set(10, 7);
    g.visible = false;
    g.zIndex = 1_000_000;
    this.app.stage.addChild(g);
    return g;
  }

  async flyFrom(
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    onComplete?: () => void
  ): Promise<void> {
    this.sprite.position.set(fromPos.x, fromPos.y);
    this.sprite.visible = true;
    this.sprite.alpha = 1;

    // Arc trajectory — quadratic parabola path
    const duration = 1200; // ms
    const startTime = Date.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Bezier curve (parabola arc)
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = Math.min(fromPos.y, toPos.y) - 80; // arc lift upward

        const x = (1 - t) * (1 - t) * fromPos.x + 2 * (1 - t) * t * midX + t * t * toPos.x;
        const y = (1 - t) * (1 - t) * fromPos.y + 2 * (1 - t) * t * midY + t * t * toPos.y;

        this.sprite.position.set(x, y);
        this.sprite.rotation = Math.sin(t * Math.PI) * 0.3; // subtle flying wobble

        // Fade out smoothly near arrival
        if (t > 0.8) {
          this.sprite.alpha = 1 - ((t - 0.8) / 0.2);
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.sprite.visible = false;
          onComplete?.();
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  destroy(): void {
    if (this.sprite && !this.sprite.destroyed) {
      this.sprite.destroy();
    }
  }
}
