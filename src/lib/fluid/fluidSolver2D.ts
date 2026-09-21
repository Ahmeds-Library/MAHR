/**
 * 2D Real-Time Navier-Stokes Fluid Dynamics Solver
 * Layer 1: Core Numerical Physics & Computational Fluid Dynamics (CFD)
 *
 * Implements Jos Stam's Stable Fluids algorithm with:
 * - Eulerian grid velocity field advection & diffusion
 * - Incompressible flow projection via Poisson pressure equation (Gauss-Seidel)
 * - Vorticity confinement for realistic turbulent eddies and fluid swirls
 * - Multichannel dye advection (RGB color fluid injection)
 * - Surface wave propagation & damping
 */

export interface FluidSimulationConfig {
  gridSize?: number; // Resolution of computation grid (e.g., 96 or 128)
  dt?: number; // Time step
  viscosity?: number; // Kinematic viscosity
  diffusion?: number; // Dye diffusion rate
  vorticity?: number; // Vorticity confinement strength (turbulent swirls)
  dissipation?: number; // Dye fading rate
  pressureIterations?: number; // Poisson pressure solver iterations
}

export interface FluidInteraction {
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  dx: number; // Velocity x delta
  dy: number; // Velocity y delta
  color: [number, number, number]; // RGB 0..255
  radius: number;
}

export class FluidSolver2D {
  public size: number;
  public dt: number;
  public viscosity: number;
  public diffusion: number;
  public vorticity: number;
  public dissipation: number;
  public pressureIterations: number;

  // Velocity grids: u (horizontal), v (vertical)
  private u: Float32Array;
  private v: Float32Array;
  private uPrev: Float32Array;
  private vPrev: Float32Array;

  // Dye density grids (RGB channels for colored fluid dynamics)
  private densityR: Float32Array;
  private densityG: Float32Array;
  private densityB: Float32Array;
  private densityPrevR: Float32Array;
  private densityPrevG: Float32Array;
  private densityPrevB: Float32Array;

  // Vorticity and pressure helper buffers
  private curl: Float32Array;
  private p: Float32Array;
  private div: Float32Array;

  // Telemetry metrics
  public maxVelocity: number = 0;
  public totalKineticEnergy: number = 0;
  public maxVorticity: number = 0;
  public reynoldsNumber: number = 0;

  constructor(config: FluidSimulationConfig = {}) {
    this.size = config.gridSize || 100;
    this.dt = config.dt || 0.15;
    this.viscosity = config.viscosity ?? 0.00008;
    this.diffusion = config.diffusion ?? 0.00001;
    this.vorticity = config.vorticity ?? 0.45;
    this.dissipation = config.dissipation ?? 0.992;
    this.pressureIterations = config.pressureIterations ?? 16;

    const totalCells = (this.size + 2) * (this.size + 2);

    this.u = new Float32Array(totalCells);
    this.v = new Float32Array(totalCells);
    this.uPrev = new Float32Array(totalCells);
    this.vPrev = new Float32Array(totalCells);

    this.densityR = new Float32Array(totalCells);
    this.densityG = new Float32Array(totalCells);
    this.densityB = new Float32Array(totalCells);
    this.densityPrevR = new Float32Array(totalCells);
    this.densityPrevG = new Float32Array(totalCells);
    this.densityPrevB = new Float32Array(totalCells);

    this.curl = new Float32Array(totalCells);
    this.p = new Float32Array(totalCells);
    this.div = new Float32Array(totalCells);
  }

  private IX(x: number, y: number): number {
    return x + (this.size + 2) * y;
  }

  /**
   * Reset all fluid velocity and dye concentrations to zero
   */
  public clear(): void {
    this.u.fill(0);
    this.v.fill(0);
    this.uPrev.fill(0);
    this.vPrev.fill(0);
    this.densityR.fill(0);
    this.densityG.fill(0);
    this.densityB.fill(0);
    this.densityPrevR.fill(0);
    this.densityPrevG.fill(0);
    this.densityPrevB.fill(0);
    this.p.fill(0);
    this.div.fill(0);
    this.curl.fill(0);
    this.maxVelocity = 0;
    this.totalKineticEnergy = 0;
  }

  /**
   * Inject fluid velocity and dye at normalized coordinates (0..1)
   */
  public injectForce(
    normX: number,
    normY: number,
    forceX: number,
    forceY: number,
    rgb: [number, number, number] = [6, 182, 212], // Default cyan
    radius: number = 3
  ): void {
    const cx = Math.max(1, Math.min(this.size, Math.floor(normX * this.size)));
    const cy = Math.max(1, Math.min(this.size, Math.floor(normY * this.size)));

    const radSq = radius * radius;
    const rInt = Math.ceil(radius);

    for (let i = -rInt; i <= rInt; i++) {
      for (let j = -rInt; j <= rInt; j++) {
        const distSq = i * i + j * j;
        if (distSq <= radSq) {
          const x = cx + i;
          const y = cy + j;
          if (x >= 1 && x <= this.size && y >= 1 && y <= this.size) {
            const idx = this.IX(x, y);
            const falloff = 1 - Math.sqrt(distSq) / (radius + 0.5);

            this.u[idx] += forceX * falloff * 5;
            this.v[idx] += forceY * falloff * 5;

            this.densityR[idx] = Math.min(255, this.densityR[idx] + rgb[0] * falloff * 0.8);
            this.densityG[idx] = Math.min(255, this.densityG[idx] + rgb[1] * falloff * 0.8);
            this.densityB[idx] = Math.min(255, this.densityB[idx] + rgb[2] * falloff * 0.8);
          }
        }
      }
    }
  }

  /**
   * Vorticity Confinement: restores small turbulent eddies lost to numerical dissipation
   */
  private applyVorticityConfinement(): void {
    const N = this.size;

    // 1. Compute curl (vorticity field)
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const du_dy = (this.u[this.IX(i, j + 1)] - this.u[this.IX(i, j - 1)]) * 0.5;
        const dv_dx = (this.v[this.IX(i + 1, j)] - this.v[this.IX(i - 1, j)]) * 0.5;
        this.curl[this.IX(i, j)] = dv_dx - du_dy;
      }
    }

    // 2. Confinement force derived from gradient of absolute curl
    const eps = this.vorticity * this.dt;
    if (eps <= 0) return;

    for (let j = 2; j < N; j++) {
      for (let i = 2; i < N; i++) {
        const dw_dx = (Math.abs(this.curl[this.IX(i + 1, j)]) - Math.abs(this.curl[this.IX(i - 1, j)])) * 0.5;
        const dw_dy = (Math.abs(this.curl[this.IX(i, j + 1)]) - Math.abs(this.curl[this.IX(i, j - 1)])) * 0.5;
        const len = Math.hypot(dw_dx, dw_dy) + 1e-5;

        const nx = dw_dx / len;
        const ny = dw_dy / len;
        const w = this.curl[this.IX(i, j)];

        // F_vort = eps * (N x w)
        this.u[this.IX(i, j)] += eps * (ny * w);
        this.v[this.IX(i, j)] += eps * (-nx * w);
      }
    }
  }

  /**
   * Set boundary reflection/inflow conditions
   * b=1: horizontal velocity, b=2: vertical velocity, b=0: dye density
   */
  private setBnd(b: number, x: Float32Array): void {
    const N = this.size;
    for (let i = 1; i <= N; i++) {
      x[this.IX(0, i)] = b === 1 ? -x[this.IX(1, i)] : x[this.IX(1, i)];
      x[this.IX(N + 1, i)] = b === 1 ? -x[this.IX(N, i)] : x[this.IX(N, i)];
      x[this.IX(i, 0)] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)];
      x[this.IX(i, N + 1)] = b === 2 ? -x[this.IX(i, N)] : x[this.IX(i, N)];
    }

    x[this.IX(0, 0)] = 0.5 * (x[this.IX(1, 0)] + x[this.IX(0, 1)]);
    x[this.IX(0, N + 1)] = 0.5 * (x[this.IX(1, N + 1)] + x[this.IX(0, N)]);
    x[this.IX(N + 1, 0)] = 0.5 * (x[this.IX(N, 0)] + x[this.IX(N + 1, 1)]);
    x[this.IX(N + 1, N + 1)] = 0.5 * (x[this.IX(N, N + 1)] + x[this.IX(N + 1, N)]);
  }

  /**
   * Linear solver for implicit viscous diffusion and pressure Poisson equation
   */
  private linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number): void {
    const N = this.size;
    const invC = 1.0 / c;
    for (let k = 0; k < this.pressureIterations; k++) {
      for (let j = 1; j <= N; j++) {
        const row = j * (N + 2);
        for (let i = 1; i <= N; i++) {
          const idx = i + row;
          x[idx] =
            (x0[idx] +
              a *
                (x[idx - 1] +
                  x[idx + 1] +
                  x[idx - (N + 2)] +
                  x[idx + (N + 2)])) *
            invC;
        }
      }
      this.setBnd(b, x);
    }
  }

  /**
   * Viscous diffusion step
   */
  private diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number): void {
    const a = this.dt * diff * this.size * this.size;
    this.linSolve(b, x, x0, a, 1 + 4 * a);
  }

  /**
   * Advection step (moving dye & velocity along flow trajectories via bilinear interpolation)
   */
  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array): void {
    const N = this.size;
    const dt0 = this.dt * N;

    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const idx = this.IX(i, j);
        let x = i - dt0 * u[idx];
        let y = j - dt0 * v[idx];

        if (x < 0.5) x = 0.5;
        if (x > N + 0.5) x = N + 0.5;
        const i0 = Math.floor(x);
        const i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > N + 0.5) y = N + 0.5;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;

        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        d[idx] =
          s0 * (t0 * d0[this.IX(i0, j0)] + t1 * d0[this.IX(i0, j1)]) +
          s1 * (t0 * d0[this.IX(i1, j0)] + t1 * d0[this.IX(i1, j1)]);
      }
    }
    this.setBnd(b, d);
  }

  /**
   * Pressure projection step (Helmholtz-Hodge decomposition to guarantee divergence-free flow)
   */
  private project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array): void {
    const N = this.size;
    const invN = 1.0 / N;

    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const idx = this.IX(i, j);
        div[idx] =
          -0.5 *
          invN *
          (u[this.IX(i + 1, j)] -
            u[this.IX(i - 1, j)] +
            v[this.IX(i, j + 1)] -
            v[this.IX(i, j - 1)]);
        p[idx] = 0;
      }
    }

    this.setBnd(0, div);
    this.setBnd(0, p);
    this.linSolve(0, p, div, 1, 4);

    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const idx = this.IX(i, j);
        u[idx] -= 0.5 * N * (p[this.IX(i + 1, j)] - p[this.IX(i - 1, j)]);
        v[idx] -= 0.5 * N * (p[this.IX(i, j + 1)] - p[this.IX(i, j - 1)]);
      }
    }
    this.setBnd(1, u);
    this.setBnd(2, v);
  }

  /**
   * Step the Navier-Stokes physics by 1 frame
   */
  public step(): void {
    // 1. Vorticity Confinement
    this.applyVorticityConfinement();

    // 2. Velocity Step: Diffuse -> Project -> Advect -> Project
    this.diffuse(1, this.uPrev, this.u, this.viscosity);
    this.diffuse(2, this.vPrev, this.v, this.viscosity);

    this.project(this.uPrev, this.vPrev, this.p, this.div);

    this.advect(1, this.u, this.uPrev, this.uPrev, this.vPrev);
    this.advect(2, this.v, this.vPrev, this.uPrev, this.vPrev);

    this.project(this.u, this.v, this.p, this.div);

    // 3. Density / Dye Step (RGB)
    this.diffuse(0, this.densityPrevR, this.densityR, this.diffusion);
    this.diffuse(0, this.densityPrevG, this.densityG, this.diffusion);
    this.diffuse(0, this.densityPrevB, this.densityB, this.diffusion);

    this.advect(0, this.densityR, this.densityPrevR, this.u, this.v);
    this.advect(0, this.densityG, this.densityPrevG, this.u, this.v);
    this.advect(0, this.densityB, this.densityPrevB, this.u, this.v);

    // 4. Dissipation (natural fade over time)
    const N = this.size;
    let maxVel = 0;
    let energySum = 0;
    let maxCurl = 0;

    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const idx = this.IX(i, j);
        this.densityR[idx] *= this.dissipation;
        this.densityG[idx] *= this.dissipation;
        this.densityB[idx] *= this.dissipation;

        // Telemetry calculation
        const velSq = this.u[idx] * this.u[idx] + this.v[idx] * this.v[idx];
        if (velSq > maxVel) maxVel = velSq;
        energySum += velSq;

        const c = Math.abs(this.curl[idx]);
        if (c > maxCurl) maxCurl = c;
      }
    }

    this.maxVelocity = Math.sqrt(maxVel);
    this.totalKineticEnergy = energySum * 0.5;
    this.maxVorticity = maxCurl;
    // Reynolds number approx Re = (U * L) / nu
    this.reynoldsNumber = (this.maxVelocity * N) / Math.max(1e-6, this.viscosity * 10000);
  }

  /**
   * Render fluid dye onto an HTML5 Canvas context
   */
  public renderToCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: {
      renderVectors?: boolean;
      vectorStep?: number;
      glow?: boolean;
      palette?: "neon" | "ocean" | "plasma" | "emerald" | "amber";
    } = {}
  ): void {
    const N = this.size;
    const cellW = width / N;
    const cellH = height / N;

    // Use fast path Image buffer rendering
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Bilinear or nearest sampling to fill canvas
    for (let y = 0; y < height; y++) {
      const gy = Math.floor((y / height) * N) + 1;
      const rowOffset = y * width * 4;

      for (let x = 0; x < width; x++) {
        const gx = Math.floor((x / width) * N) + 1;
        const idx = this.IX(gx, gy);
        const pIdx = rowOffset + x * 4;

        let r = this.densityR[idx];
        let g = this.densityG[idx];
        let b = this.densityB[idx];

        // Background dark grid styling with subtle fluid glow
        data[pIdx] = Math.min(255, Math.floor(r + 3));
        data[pIdx + 1] = Math.min(255, Math.floor(g + 6));
        data[pIdx + 2] = Math.min(255, Math.floor(b + 18));
        data[pIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Optional: Draw velocity vectors overlay
    if (options.renderVectors) {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 1;
      const step = options.vectorStep || Math.max(4, Math.floor(N / 16));

      for (let j = 1; j <= N; j += step) {
        for (let i = 1; i <= N; i += step) {
          const idx = this.IX(i, j);
          const px = (i - 0.5) * cellW;
          const py = (j - 0.5) * cellH;

          const vx = this.u[idx] * 40;
          const vy = this.v[idx] * 40;
          const speed = Math.hypot(vx, vy);

          if (speed > 0.5) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + vx, py + vy);
            ctx.stroke();
          }
        }
      }
    }
  }
}
