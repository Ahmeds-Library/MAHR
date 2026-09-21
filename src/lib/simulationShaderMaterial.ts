import * as THREE from "three";

/**
 * High-performance glowing holographic cyber shader material for Three.js
 * Supports dynamic vertex pulsing, Fresnel glow edges, cyber-scanlines, and additive blending.
 */
export function createCyberHologramShaderMaterial(options?: {
  color?: string | number;
  glowColor?: string | number;
  wireframe?: boolean;
  opacity?: number;
  scanlineSpeed?: number;
}): THREE.ShaderMaterial {
  const baseColor = new THREE.Color(options?.color ?? 0x06b6d4); // Neon Cyan
  const glowColor = new THREE.Color(options?.glowColor ?? 0xec4899); // Neon Pink / Magenta

  const vertexShader = `
    uniform float uTime;
    uniform float uPulseSpeed;
    uniform float uDisplacement;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vDistance;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      // Subtle dynamic harmonic pulse
      vec3 pos = position;
      float wave = sin(pos.y * 3.0 + uTime * uPulseSpeed) * cos(pos.x * 3.0 + uTime * uPulseSpeed);
      pos += normal * (wave * uDisplacement);

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;
      vDistance = length(worldPos.xyz - cameraPosition);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uGlowIntensity;
    uniform float uScanlineDensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying float vDistance;

    void main() {
      // 1. Fresnel Edge Glow (View vector vs Normal)
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
      fresnel = pow(fresnel, 2.2) * uGlowIntensity;

      // 2. Holographic Cyber Scanlines
      float scanline = sin(vWorldPosition.y * uScanlineDensity - uTime * 4.0) * 0.5 + 0.5;
      scanline = pow(scanline, 1.8);

      // 3. Grid / Matrix interference pulse
      float gridPulse = sin(vWorldPosition.x * 2.0 + uTime * 2.0) * sin(vWorldPosition.z * 2.0 + uTime * 2.0);
      gridPulse = max(gridPulse, 0.0) * 0.3;

      // 4. Color mixing: Base tone + Fresnel Rim + Glow
      vec3 finalColor = mix(uBaseColor, uGlowColor, fresnel * 0.8 + gridPulse);
      finalColor += uGlowColor * fresnel * 0.6;
      finalColor += vec3(0.1, 0.8, 1.0) * scanline * 0.25;

      // 5. Alpha calculation for volumetric cyber feel
      float alpha = (fresnel * 0.75 + scanline * 0.3 + 0.35) * uOpacity;
      alpha = clamp(alpha, 0.15, 0.95);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPulseSpeed: { value: 2.0 },
      uDisplacement: { value: 0.03 },
      uBaseColor: { value: baseColor },
      uGlowColor: { value: glowColor },
      uOpacity: { value: options?.opacity ?? 0.85 },
      uGlowIntensity: { value: 1.6 },
      uScanlineDensity: { value: 12.0 }
    },
    transparent: true,
    wireframe: options?.wireframe ?? false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}
