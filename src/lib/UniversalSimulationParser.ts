import * as THREE from "three";
import { createCyberHologramShaderMaterial } from "./simulationShaderMaterial";
import { SimulationData } from "./simulationTypes";

/**
 * Universal Parser Layer (Three.js)
 * Dynamically binds and maps raw streaming array payloads (vertices, indices,
 * colors, scales, matrix transformations, particles, rods, trails) directly
 * to GPU BufferGeometries with ultra-clean, high-performance rendering.
 */
export class UniversalSimulationParser {
  public rootGroup: THREE.Group;
  public dynamicMesh: THREE.Mesh;
  public dynamicPointCloud: THREE.Points;
  public dynamicLines: THREE.LineSegments;
  public dynamicTrail: THREE.Line;
  public dynamicParticleSystem: THREE.Points;

  public shaderMaterial: THREE.ShaderMaterial;
  public standardMaterial: THREE.MeshStandardMaterial;
  public pointsMaterial: THREE.PointsMaterial;
  public linesMaterial: THREE.LineBasicMaterial;
  public trailMaterial: THREE.LineBasicMaterial;
  public particleMat: THREE.PointsMaterial;

  private meshGeometry: THREE.BufferGeometry;
  private pointsGeometry: THREE.BufferGeometry;
  private linesGeometry: THREE.BufferGeometry;
  private trailGeometry: THREE.BufferGeometry;
  private particleGeometry: THREE.BufferGeometry;

  public renderMode: "hologram" | "solid" | "wireframe" = "hologram";

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = "UniversalSimulationGroup";

    // 1. Holographic Cyber Shader Material
    this.shaderMaterial = createCyberHologramShaderMaterial({
      color: 0x06b6d4, // Cyan
      glowColor: 0xec4899, // Magenta glow
      wireframe: false,
      opacity: 0.85
    });

    // Solid PBR fallback material
    this.standardMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    // 2. Dynamic Mesh
    this.meshGeometry = new THREE.BufferGeometry();
    this.dynamicMesh = new THREE.Mesh(this.meshGeometry, this.shaderMaterial);
    this.dynamicMesh.frustumCulled = false;
    this.rootGroup.add(this.dynamicMesh);

    // 3. Dynamic Nodes Point Cloud
    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsMaterial = new THREE.PointsMaterial({
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    this.dynamicPointCloud = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.dynamicPointCloud.frustumCulled = false;
    this.rootGroup.add(this.dynamicPointCloud);

    // 4. Dynamic Lines / Rods
    this.linesGeometry = new THREE.BufferGeometry();
    this.linesMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      linewidth: 2
    });
    this.dynamicLines = new THREE.LineSegments(this.linesGeometry, this.linesMaterial);
    this.dynamicLines.frustumCulled = false;
    this.rootGroup.add(this.dynamicLines);

    // 5. Dynamic Trajectory Trail
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.dynamicTrail = new THREE.Line(this.trailGeometry, this.trailMaterial);
    this.dynamicTrail.frustumCulled = false;
    this.rootGroup.add(this.dynamicTrail);

    // 6. Dynamic Flow Particles
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    this.dynamicParticleSystem = new THREE.Points(this.particleGeometry, this.particleMat);
    this.dynamicParticleSystem.frustumCulled = false;
    this.rootGroup.add(this.dynamicParticleSystem);
  }

  /**
   * Ingests and renders raw streaming simulation frames
   */
  public parseAndApplyFrame(data: SimulationData | any, time: number = 0) {
    if (!data) return;

    // Update Shader Uniforms
    if (this.shaderMaterial.uniforms.uTime) {
      this.shaderMaterial.uniforms.uTime.value = time;
    }

    // 1. Mesh Ingestion
    if (data.mesh && data.mesh.vertices && data.mesh.vertices.length > 0) {
      this.dynamicMesh.visible = true;
      const rawVerts = data.mesh.vertices;
      const flatVerts = Array.isArray(rawVerts[0])
        ? new Float32Array(rawVerts.flat())
        : typeof rawVerts[0] === "number"
        ? new Float32Array(rawVerts)
        : new Float32Array(rawVerts.flatMap((v: any) => [v.x || 0, v.y || 0, v.z || 0]));

      const vertexCount = flatVerts.length / 3;
      const posAttr = this.meshGeometry.getAttribute("position") as THREE.BufferAttribute;
      if (!posAttr || posAttr.count !== vertexCount) {
        this.meshGeometry.setAttribute("position", new THREE.BufferAttribute(flatVerts, 3));
      } else {
        posAttr.set(flatVerts);
        posAttr.needsUpdate = true;
      }

      // Indices
      const rawIndices = data.mesh.indices || data.mesh.faces;
      if (rawIndices && rawIndices.length > 0) {
        const flatIndices = Array.isArray(rawIndices[0])
          ? new Uint32Array(rawIndices.flat())
          : new Uint32Array(rawIndices);

        const indexAttr = this.meshGeometry.getIndex();
        if (!indexAttr || indexAttr.count !== flatIndices.length) {
          this.meshGeometry.setIndex(new THREE.BufferAttribute(flatIndices, 1));
        } else {
          indexAttr.set(flatIndices);
          indexAttr.needsUpdate = true;
        }
      }

      if (data.mesh.color) {
        const col = new THREE.Color(data.mesh.color);
        if (this.shaderMaterial.uniforms.uBaseColor) {
          this.shaderMaterial.uniforms.uBaseColor.value = col;
        }
        this.standardMaterial.color = col;
      }

      if (!data.mesh.normals) {
        this.meshGeometry.computeVertexNormals();
      }
      this.meshGeometry.computeBoundingSphere();
    } else {
      this.dynamicMesh.visible = false;
    }

    // 2. Nodes / Discrete Vertices
    if (data.nodes && data.nodes.length > 0) {
      this.dynamicPointCloud.visible = true;
      const count = data.nodes.length;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const node = data.nodes[i];
        positions[i * 3] = node.position ? node.position[0] : (node.x ?? 0);
        positions[i * 3 + 1] = node.position ? node.position[1] : (node.y ?? 0);
        positions[i * 3 + 2] = node.position ? node.position[2] : (node.z ?? 0);

        const col = new THREE.Color(node.color || 0x38bdf8);
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      const pPosAttr = this.pointsGeometry.getAttribute("position") as THREE.BufferAttribute;
      if (!pPosAttr || pPosAttr.count !== count) {
        this.pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      } else {
        pPosAttr.set(positions);
        pPosAttr.needsUpdate = true;
        const pColAttr = this.pointsGeometry.getAttribute("color") as THREE.BufferAttribute;
        if (pColAttr) {
          pColAttr.set(colors);
          pColAttr.needsUpdate = true;
        }
      }
    } else {
      this.dynamicPointCloud.visible = false;
    }

    // 3. Rods / Connection Lines
    if (data.rods && data.rods.length > 0) {
      this.dynamicLines.visible = true;
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      const nodeLookup = new Map<string, number[]>();
      if (data.nodes) {
        data.nodes.forEach((n: any) => {
          nodeLookup.set(n.id, n.position || [n.x || 0, n.y || 0, n.z || 0]);
        });
      }

      data.rods.forEach((rod: any) => {
        let p1: number[] | undefined;
        let p2: number[] | undefined;

        if (rod.from && rod.to) {
          p1 = rod.from;
          p2 = rod.to;
        } else if (rod.fromNode && rod.toNode) {
          p1 = nodeLookup.get(rod.fromNode);
          p2 = nodeLookup.get(rod.toNode);
        }

        if (p1 && p2) {
          linePositions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
          const col = new THREE.Color(rod.color || 0xa855f7);
          lineColors.push(col.r, col.g, col.b, col.r, col.g, col.b);
        }
      });

      const posArray = new Float32Array(linePositions);
      const colArray = new Float32Array(lineColors);

      this.linesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      this.linesGeometry.setAttribute("color", new THREE.BufferAttribute(colArray, 3));
    } else {
      this.dynamicLines.visible = false;
    }

    // 4. Trajectory Trails
    if (data.trail && data.trail.length > 1) {
      this.dynamicTrail.visible = true;
      const flatTrail = new Float32Array(data.trail.flat());
      this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(flatTrail, 3));
    } else {
      this.dynamicTrail.visible = false;
    }

    // 5. Flow Particles
    if (data.particles && data.particles.length > 0) {
      this.dynamicParticleSystem.visible = true;
      const pCount = data.particles.length;
      const pPositions = new Float32Array(pCount * 3);
      const pColors = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount; i++) {
        const pt = data.particles[i];
        pPositions[i * 3] = pt.x ?? pt.position?.[0] ?? 0;
        pPositions[i * 3 + 1] = pt.y ?? pt.position?.[1] ?? 0;
        pPositions[i * 3 + 2] = pt.z ?? pt.position?.[2] ?? 0;

        const col = new THREE.Color(pt.color || 0x38bdf8);
        pColors[i * 3] = col.r;
        pColors[i * 3 + 1] = col.g;
        pColors[i * 3 + 2] = col.b;
      }

      this.particleGeometry.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
      this.particleGeometry.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    } else {
      this.dynamicParticleSystem.visible = false;
    }
  }

  public setRenderMode(mode: "hologram" | "solid" | "wireframe") {
    this.renderMode = mode;
    if (mode === "solid") {
      this.dynamicMesh.material = this.standardMaterial;
      this.standardMaterial.wireframe = false;
    } else if (mode === "wireframe") {
      this.dynamicMesh.material = this.shaderMaterial;
      this.shaderMaterial.wireframe = true;
    } else {
      this.dynamicMesh.material = this.shaderMaterial;
      this.shaderMaterial.wireframe = false;
    }
  }

  public setWireframe(enabled: boolean) {
    this.shaderMaterial.wireframe = enabled;
    this.standardMaterial.wireframe = enabled;
  }

  public dispose() {
    this.meshGeometry.dispose();
    this.pointsGeometry.dispose();
    this.linesGeometry.dispose();
    this.trailGeometry.dispose();
    this.particleGeometry.dispose();
    this.shaderMaterial.dispose();
    this.standardMaterial.dispose();
    this.pointsMaterial.dispose();
    this.linesMaterial.dispose();
    this.trailMaterial.dispose();
    this.particleMat.dispose();
  }
}

