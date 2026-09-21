import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SimulationData, SimulationNode, SimulationRod, SimulationMesh, SimulationParticle } from "./simulationTypes";

export interface SimulationEngineConfig {
  container: HTMLDivElement;
  onFpsUpdate?: (fps: number) => void;
}

export class SimulationEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Visual Components
  private gridHelper: THREE.GridHelper;
  private ambientLight: THREE.AmbientLight;
  private dirLight1: THREE.DirectionalLight;
  private dirLight2: THREE.DirectionalLight;
  private backgroundParticles: THREE.Points;
  private simGroup: THREE.Group;

  // Object pools & caches for zero-allocation 60Hz rendering
  private nodeMeshMap: Map<string, THREE.Mesh> = new Map();
  private rodMeshPool: THREE.Mesh[] = [];
  private trailLine: THREE.Line | null = null;
  private dynamicMesh: THREE.Mesh | null = null;
  private dynamicPointCloud: THREE.Points | null = null;

  // Custom Holographic / Cyber Shader Material
  private hologramMaterial: THREE.ShaderMaterial;
  private glassMaterial: THREE.MeshPhysicalMaterial;

  // Telemetry & State
  private lastFpsTime: number = performance.now();
  private frameCount: number = 0;
  private onFpsUpdate?: (fps: number) => void;
  public playbackSpeed: number = 1.0;
  public isPaused: boolean = false;
  public showWireframe: boolean = false;
  public showGrid: boolean = true;
  public glowIntensity: number = 1.2;

  constructor(config: SimulationEngineConfig) {
    this.container = config.container;
    this.onFpsUpdate = config.onFpsUpdate;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.035);

    // 2. Camera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(0, 3.2, 7.5);

    // 3. WebGL Renderer with High-Precision ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxDistance = 50;
    this.controls.minDistance = 0.8;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.dirLight1 = new THREE.DirectionalLight(0x06b6d4, 1.8);
    this.dirLight1.position.set(6, 12, 8);
    this.scene.add(this.dirLight1);

    this.dirLight2 = new THREE.DirectionalLight(0xec4899, 1.4);
    this.dirLight2.position.set(-6, -6, -6);
    this.scene.add(this.dirLight2);

    // 6. Cyber Grid Floor
    this.gridHelper = new THREE.GridHelper(32, 32, 0x06b6d4, 0x1e293b);
    this.gridHelper.position.y = -3.2;
    this.scene.add(this.gridHelper);

    // 7. Ambient Particle Field
    const bgCount = 800;
    const bgPos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount * 3; i += 3) {
      bgPos[i] = (Math.random() - 0.5) * 45;
      bgPos[i + 1] = (Math.random() - 0.5) * 45;
      bgPos[i + 2] = (Math.random() - 0.5) * 45;
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.055,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.backgroundParticles = new THREE.Points(bgGeo, bgMat);
    this.scene.add(this.backgroundParticles);

    // 8. Dynamic Simulation Objects Group
    this.simGroup = new THREE.Group();
    this.scene.add(this.simGroup);

    // 9. Custom GLSL Hologram Shader Material
    this.hologramMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0x06b6d4) },
        glowIntensity: { value: 1.2 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float glowIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
          float scanline = sin(vPosition.y * 22.0 + time * 3.5) * 0.18 + 0.82;
          vec3 finalColor = (color * scanline + fresnel * 0.85) * glowIntensity;
          gl_FragColor = vec4(finalColor, fresnel * 0.75 + 0.25);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Glass Material
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85
    });

    // 10. Bind Resize Observer
    this.setupResizeObserver();

    // 11. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animate(performance.now());
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Applies incoming SimulationData vectors and updates Three.js meshes
   */
  public updateData(data: SimulationData) {
    if (!data) return;

    // A. Update Nodes (spheres)
    if (data.nodes) {
      const activeIds = new Set<string>();

      data.nodes.forEach((node) => {
        activeIds.add(node.id);
        let mesh = this.nodeMeshMap.get(node.id);

        if (!mesh) {
          const radius = node.radius || 0.25;
          const geo = new THREE.SphereGeometry(radius, 24, 24);
          const colorHex = node.color || "#06b6d4";
          const mat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.65,
            roughness: 0.2,
            metalness: 0.8
          });
          mesh = new THREE.Mesh(geo, mat);
          this.simGroup.add(mesh);
          this.nodeMeshMap.set(node.id, mesh);
        }

        mesh.position.set(node.x, node.y, node.z);
      });

      // Cleanup removed nodes
      for (const [id, mesh] of this.nodeMeshMap.entries()) {
        if (!activeIds.has(id)) {
          this.simGroup.remove(mesh);
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
          this.nodeMeshMap.delete(id);
        }
      }
    }

    // B. Update Rods / Linkages (cylinders)
    if (data.rods) {
      while (this.rodMeshPool.length < data.rods.length) {
        const geo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.4
        });
        const cylinder = new THREE.Mesh(geo, mat);
        this.simGroup.add(cylinder);
        this.rodMeshPool.push(cylinder);
      }

      data.rods.forEach((rod, i) => {
        const p1 = new THREE.Vector3(...rod.from);
        const p2 = new THREE.Vector3(...rod.to);
        const rodMesh = this.rodMeshPool[i];
        rodMesh.visible = true;

        const dist = p1.distanceTo(p2);
        const radius = rod.radius || 0.04;
        rodMesh.scale.set(radius / 0.04, dist, radius / 0.04);

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        rodMesh.position.copy(mid);

        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        rodMesh.quaternion.setFromUnitVectors(axis, dir);
      });

      for (let i = data.rods.length; i < this.rodMeshPool.length; i++) {
        this.rodMeshPool[i].visible = false;
      }
    }

    // C. Update Trajectory Trails
    if (data.trail && data.trail.length > 1) {
      const points = data.trail.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      if (!this.trailLine) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: 0xf43f5e,
          linewidth: 2.5,
          transparent: true,
          opacity: 0.85
        });
        this.trailLine = new THREE.Line(geo, mat);
        this.simGroup.add(this.trailLine);
      } else {
        this.trailLine.geometry.setFromPoints(points);
      }
    }

    // D. Update Dynamic BufferGeometry Mesh (e.g. Lungs, Waves, Soft Body)
    if (data.mesh && data.mesh.vertices && data.mesh.vertices.length > 0) {
      const vertices = new Float32Array(data.mesh.vertices);

      if (data.mesh.color) {
        this.hologramMaterial.uniforms.color.value.set(data.mesh.color);
      }

      if (!this.dynamicMesh) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        if (data.mesh.faces && data.mesh.faces.length > 0) {
          geo.setIndex(data.mesh.faces);
        }
        geo.computeVertexNormals();

        const mat = data.mesh.shadingMode === "glass" ? this.glassMaterial : this.hologramMaterial;
        mat.wireframe = this.showWireframe;

        this.dynamicMesh = new THREE.Mesh(geo, mat);
        this.simGroup.add(this.dynamicMesh);
      } else {
        const currentPos = this.dynamicMesh.geometry.attributes.position;
        if (!currentPos || currentPos.count !== vertices.length / 3) {
          this.dynamicMesh.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
          if (data.mesh.faces && data.mesh.faces.length > 0) {
            this.dynamicMesh.geometry.setIndex(data.mesh.faces);
          }
        } else {
          (currentPos.array as Float32Array).set(vertices);
          currentPos.needsUpdate = true;
        }
        this.dynamicMesh.geometry.computeVertexNormals();
      }
    }

    // E. Update Particles
    if (data.particles && data.particles.length > 0) {
      const pCount = data.particles.length;
      const positions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        positions[i * 3] = data.particles[i].x;
        positions[i * 3 + 1] = data.particles[i].y;
        positions[i * 3 + 2] = data.particles[i].z;
      }

      if (!this.dynamicPointCloud) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
          color: 0x38bdf8,
          size: 0.08,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        this.dynamicPointCloud = new THREE.Points(geo, mat);
        this.simGroup.add(this.dynamicPointCloud);
      } else {
        this.dynamicPointCloud.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.dynamicPointCloud.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  /**
   * Resets and clears the dynamic simulation scene
   */
  public clearScene() {
    for (const [, mesh] of this.nodeMeshMap) {
      this.simGroup.remove(mesh);
      mesh.geometry.dispose();
    }
    this.nodeMeshMap.clear();

    for (const rod of this.rodMeshPool) {
      this.simGroup.remove(rod);
      rod.geometry.dispose();
    }
    this.rodMeshPool = [];

    if (this.trailLine) {
      this.simGroup.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine = null;
    }

    if (this.dynamicMesh) {
      this.simGroup.remove(this.dynamicMesh);
      this.dynamicMesh.geometry.dispose();
      this.dynamicMesh = null;
    }

    if (this.dynamicPointCloud) {
      this.simGroup.remove(this.dynamicPointCloud);
      this.dynamicPointCloud.geometry.dispose();
      this.dynamicPointCloud = null;
    }
  }

  /**
   * Adjusts camera presets (front, top, side, perspective)
   */
  public setCameraView(view: "front" | "top" | "side" | "iso" | "reset") {
    switch (view) {
      case "front":
        this.camera.position.set(0, 0, 8);
        this.controls.target.set(0, 0, 0);
        break;
      case "top":
        this.camera.position.set(0, 9, 0.01);
        this.controls.target.set(0, 0, 0);
        break;
      case "side":
        this.camera.position.set(8, 0, 0);
        this.controls.target.set(0, 0, 0);
        break;
      case "iso":
        this.camera.position.set(5.5, 4.5, 5.5);
        this.controls.target.set(0, 0, 0);
        break;
      case "reset":
      default:
        this.camera.position.set(0, 3.2, 7.5);
        this.controls.target.set(0, 0, 0);
        break;
    }
    this.controls.update();
  }

  public setWireframe(wireframe: boolean) {
    this.showWireframe = wireframe;
    this.hologramMaterial.wireframe = wireframe;
    this.glassMaterial.wireframe = wireframe;
  }

  public setGridVisible(visible: boolean) {
    this.showGrid = visible;
    this.gridHelper.visible = visible;
  }

  public setGlowIntensity(intensity: number) {
    this.glowIntensity = intensity;
    this.hologramMaterial.uniforms.glowIntensity.value = intensity;
  }

  /**
   * Captures a high-resolution PNG snapshot of the simulation
   */
  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }

  /**
   * High-Performance 60FPS Render Loop
   */
  private animate(currentTime: number) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Calculate Real-Time FPS
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      const fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
      this.onFpsUpdate?.(fps);
    }

    // Update Hologram Shader Uniforms
    this.hologramMaterial.uniforms.time.value = currentTime * 0.001;

    // Slow ambient rotation for background particle field
    this.backgroundParticles.rotation.y = currentTime * 0.00004;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Destructor for clean unmounting
   */
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.clearScene();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
