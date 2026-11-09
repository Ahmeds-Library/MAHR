/**
 * ManimGX Hardware-Accelerated 3D Math Engine (WebGL/WebGPU Renderer)
 * Renders live mathematical parametric surfaces, vector fields, and 3D geometries.
 */

import * as THREE from "three";
import { Camera3DState } from "./manimgxTypes";

export type MathSurfacePreset = "riemann" | "lorenz" | "saddle" | "fourier" | "mobius";

export class ManimGXWebGPURenderer {
  private container: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;

  // Visual Groups
  private mathGroup: THREE.Group;
  private axesGroup: THREE.Group;
  private gridHelper: THREE.GridHelper;
  private activeSurfaceMesh: THREE.Mesh | null = null;
  private particlesMesh: THREE.Points | null = null;
  private curveLine: THREE.Line | null = null;

  // Simulation parameters
  private currentPreset: MathSurfacePreset = "riemann";
  private time: number = 0;
  private isPlaying: boolean = true;
  private speed: number = 1.0;
  private wireframe: boolean = false;

  // Interaction & camera
  private cameraState: Camera3DState = {
    phi: 1.1,
    theta: 0.8,
    distance: 12,
    fov: 45,
    autoRotate: true,
    autoRotateSpeed: 0.4
  };

  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.container = canvas;

    // 1. Initialize Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d); // Deep quantum slate background

    // 2. Camera Setup
    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(this.cameraState.fov, aspect, 0.1, 1000);
    this.updateCameraTransform();

    // 3. Renderer with high-DPI and antialiasing
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 4. Studio Lighting
    this.setupLighting();

    // 5. Visual Hierarchy Groups
    this.mathGroup = new THREE.Group();
    this.axesGroup = new THREE.Group();
    this.scene.add(this.mathGroup);
    this.scene.add(this.axesGroup);

    // 6. Coordinate Helpers
    this.setupAxesAndGrid();

    // 7. Initial Mathematical Surface
    this.buildMathematicalScene("riemann");

    // 8. Event Listeners for Orbit Interaction
    this.bindPointerEvents();

    // 9. Start Render Loop
    this.startLoop();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8); // Cyan rim light
    dirLight1.position.set(10, 20, 15);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.4); // Purple key light
    dirLight2.position.set(-10, -10, -10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x06b6d4, 1.5, 50);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  private setupAxesAndGrid(): void {
    // Holographic Grid
    this.gridHelper = new THREE.GridHelper(16, 16, 0x0284c7, 0x1e293b);
    this.gridHelper.position.y = -2;
    this.axesGroup.add(this.gridHelper);

    // 3D Axes with custom colored arrows
    const axisLength = 5;
    const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLength, 0xef4444);
    const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLength, 0x10b981);
    const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLength, 0x3b82f6);

    this.axesGroup.add(xArrow);
    this.axesGroup.add(yArrow);
    this.axesGroup.add(zArrow);
  }

  public buildMathematicalScene(preset: MathSurfacePreset): void {
    this.currentPreset = preset;
    // Clear math group
    while (this.mathGroup.children.length > 0) {
      const obj = this.mathGroup.children[0];
      this.mathGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }
    }

    if (preset === "riemann") {
      this.buildRiemannSurface();
    } else if (preset === "lorenz") {
      this.buildLorenzAttractor();
    } else if (preset === "saddle") {
      this.buildSaddleLossLandscape();
    } else if (preset === "fourier") {
      this.buildFourierEpicycles();
    } else if (preset === "mobius") {
      this.buildMobiusStrip();
    }
  }

  /**
   * 1. Riemann Surface / Complex Analysis Landscape
   */
  private buildRiemannSurface(): void {
    const size = 60;
    const geometry = new THREE.PlaneGeometry(8, 8, size, size);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const r = Math.sqrt(u * u + v * v) + 0.1;
      const theta = Math.atan2(v, u);
      // Riemann logarithmic branch & wave equation: z = r * sin(3*theta)
      const z = Math.sin(r * 2.2) * 1.2 + Math.cos(theta * 3) * 0.8;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x082f49,
      roughness: 0.2,
      metalness: 0.6,
      clearcoat: 0.8,
      wireframe: this.wireframe,
      side: THREE.DoubleSide
    });

    this.activeSurfaceMesh = new THREE.Mesh(geometry, material);
    this.activeSurfaceMesh.rotation.x = -Math.PI / 2;
    this.mathGroup.add(this.activeSurfaceMesh);
  }

  /**
   * 2. Lorenz Strange Attractor in 3D
   */
  private buildLorenzAttractor(): void {
    const points: THREE.Vector3[] = [];
    let x = 0.1, y = 0, z = 0;
    const dt = 0.008;
    const sigma = 10, rho = 28, beta = 8 / 3;

    for (let i = 0; i < 3500; i++) {
      const dx = sigma * (y - x) * dt;
      const dy = (x * (rho - z) - y) * dt;
      const dz = (x * y - beta * z) * dt;
      x += dx;
      y += dy;
      z += dz;
      // Scale down to fit viewport nicely
      points.push(new THREE.Vector3(x * 0.18, z * 0.18 - 4.5, y * 0.18));
    }

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2
    });
    this.curveLine = new THREE.Line(curveGeometry, lineMaterial);
    this.mathGroup.add(this.curveLine);

    // Glowing Particle Field around attractor
    const particleGeometry = new THREE.BufferGeometry().setFromPoints(points.slice(-500));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      blending: THREE.AdditiveBlending
    });
    this.particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    this.mathGroup.add(this.particlesMesh);
  }

  /**
   * 3. Hyperbolic Paraboloid / Saddle Loss Surface
   */
  private buildSaddleLossLandscape(): void {
    const segments = 48;
    const geometry = new THREE.PlaneGeometry(8, 8, segments, segments);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      // z = (u^2 - v^2)/4 + oscillatory ripples
      const z = (u * u - v * v) * 0.15 + Math.sin(u * 2) * 0.2;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.35,
      metalness: 0.5,
      wireframe: this.wireframe,
      side: THREE.DoubleSide
    });

    this.activeSurfaceMesh = new THREE.Mesh(geometry, material);
    this.activeSurfaceMesh.rotation.x = -Math.PI / 2;
    this.mathGroup.add(this.activeSurfaceMesh);
  }

  /**
   * 4. Fourier Epicycles in 3D
   */
  private buildFourierEpicycles(): void {
    const parent = new THREE.Group();
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.05, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.04, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xec4899 })
    );
    ring2.position.x = 3;

    parent.add(ring1);
    parent.add(ring2);
    this.mathGroup.add(parent);
  }

  /**
   * 5. Möbius Strip Parametric Ribbon
   */
  private buildMobiusStrip(): void {
    const uSegments = 120;
    const vSegments = 20;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= uSegments; i++) {
      const u = (i / uSegments) * Math.PI * 2;
      for (let j = 0; j <= vSegments; j++) {
        const v = ((j / vSegments) - 0.5) * 1.5;
        const x = (3 + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (3 + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);
        vertices.push(x, z, y);
      }
    }

    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + j;
        const b = (i + 1) * (vSegments + 1) + j;
        const c = (i + 1) * (vSegments + 1) + (j + 1);
        const d = i * (vSegments + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: this.wireframe,
      side: THREE.DoubleSide
    });

    this.activeSurfaceMesh = new THREE.Mesh(geometry, material);
    this.mathGroup.add(this.activeSurfaceMesh);
  }

  private updateCameraTransform(): void {
    const x = this.cameraState.distance * Math.sin(this.cameraState.phi) * Math.cos(this.cameraState.theta);
    const y = this.cameraState.distance * Math.cos(this.cameraState.phi);
    const z = this.cameraState.distance * Math.sin(this.cameraState.phi) * Math.sin(this.cameraState.theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private bindPointerEvents(): void {
    const canvas = this.container;

    canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.cameraState.theta -= deltaX * 0.008;
      this.cameraState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraState.phi - deltaY * 0.008));

      this.updateCameraTransform();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.cameraState.distance = Math.max(4, Math.min(30, this.cameraState.distance + e.deltaY * 0.01));
      this.updateCameraTransform();
    }, { passive: false });
  }

  public setCameraView(preset: "top" | "front" | "isometric" | "side"): void {
    if (preset === "top") {
      this.cameraState.phi = 0.15;
      this.cameraState.theta = 0;
    } else if (preset === "front") {
      this.cameraState.phi = Math.PI / 2;
      this.cameraState.theta = 0;
    } else if (preset === "isometric") {
      this.cameraState.phi = 1.0;
      this.cameraState.theta = 0.785;
    } else if (preset === "side") {
      this.cameraState.phi = Math.PI / 2;
      this.cameraState.theta = Math.PI / 2;
    }
    this.updateCameraTransform();
  }

  public setWireframe(enabled: boolean): void {
    this.wireframe = enabled;
    if (this.activeSurfaceMesh && this.activeSurfaceMesh.material) {
      (this.activeSurfaceMesh.material as THREE.MeshStandardMaterial).wireframe = enabled;
    }
  }

  public toggleAxes(visible: boolean): void {
    this.axesGroup.visible = visible;
  }

  public toggleAutoRotate(enabled: boolean): void {
    this.cameraState.autoRotate = enabled;
  }

  public setPlayState(playing: boolean): void {
    this.isPlaying = playing;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public scrubTo(timeInSeconds: number): void {
    this.time = timeInSeconds;
    this.applyTimeSimulation(this.time);
  }

  private applyTimeSimulation(t: number): void {
    if (this.activeSurfaceMesh && this.currentPreset === "riemann") {
      const pos = this.activeSurfaceMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const r = Math.sqrt(u * u + v * v) + 0.1;
        const theta = Math.atan2(v, u);
        const z = Math.sin(r * 2.2 - t * 1.5) * 1.2 + Math.cos(theta * 3 + t) * 0.8;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      this.activeSurfaceMesh.geometry.computeVertexNormals();
    } else if (this.activeSurfaceMesh && this.currentPreset === "saddle") {
      const pos = this.activeSurfaceMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const z = (u * u - v * v) * 0.15 + Math.sin(u * 2 + t * 2) * 0.25;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      this.activeSurfaceMesh.geometry.computeVertexNormals();
    }

    if (this.particlesMesh) {
      this.particlesMesh.rotation.y = t * 0.4;
    }
  }

  private startLoop(): void {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (this.isDisposed) return;

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (this.isPlaying) {
        this.time += delta * this.speed;
        this.applyTimeSimulation(this.time);
      }

      if (this.cameraState.autoRotate && !this.isDragging) {
        this.cameraState.theta += this.cameraState.autoRotateSpeed * delta;
        this.updateCameraTransform();
      }

      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public handleResize(width: number, height: number): void {
    if (width <= 0 || height <= 0 || this.isDisposed) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public captureFrameDataUrl(): string {
    return this.container.toDataURL("image/png");
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
  }
}
