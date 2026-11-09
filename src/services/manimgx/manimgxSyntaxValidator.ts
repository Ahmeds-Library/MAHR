/**
 * ManimGX Python Syntax Validator & AST Inspector
 * Validates Python 3.13+ syntax for ManimGX engine, detecting imports, classes, and animations.
 */

export interface ValidationIssue {
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  sceneName: string;
  is3DScene: boolean;
  detectedMobjects: string[];
  animationCount: number;
  estimatedDuration: number;
  issues: ValidationIssue[];
}

export function validateManimGXCode(code: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = code.split("\n");

  let hasImport = false;
  let hasClass = false;
  let hasConstruct = false;
  let sceneName = "UnnamedScene";
  let is3DScene = false;
  const detectedMobjects: string[] = [];
  let animationCount = 0;
  let waitSeconds = 0;

  // 1. Check imports
  const importRegex = /^\s*from\s+(manimgx|manim)\s+import\s+/;
  const foundImportLine = lines.findIndex((l) => importRegex.test(l));
  if (foundImportLine !== -1) {
    hasImport = true;
    if (lines[foundImportLine].includes("from manim import")) {
      issues.push({
        line: foundImportLine + 1,
        severity: "info",
        message: "Tip: Switch 'from manim import *' to 'from manimgx import *' for native GPU WebGPU acceleration."
      });
    }
  } else {
    issues.push({
      line: 1,
      severity: "error",
      message: "Missing ManimGX import header. Expected 'from manimgx import *'."
    });
  }

  // 2. Check scene declaration
  const classRegex = /class\s+([A-Za-z0-9_]+)\s*\((Scene|ThreeDScene|VectorScene|MovingCameraScene)\)\s*:/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(classRegex);
    if (match) {
      hasClass = true;
      sceneName = match[1];
      if (match[2] === "ThreeDScene" || code.includes("ThreeDScene") || code.includes("set_camera_orientation")) {
        is3DScene = true;
      }
      break;
    }
  }

  if (!hasClass) {
    issues.push({
      line: Math.min(lines.length, 3),
      severity: "error",
      message: "No valid Scene class defined. Declare 'class MyScene(ThreeDScene):' or 'class MyScene(Scene):'."
    });
  }

  // 3. Check construct or compose method
  const constructRegex = /def\s+(construct|compose)\s*\(\s*self\s*\)\s*:/;
  hasConstruct = lines.some((l) => constructRegex.test(l));

  if (!hasConstruct) {
    issues.push({
      line: Math.min(lines.length, 5),
      severity: "error",
      message: "Missing scene entry point: must declare 'def construct(self):'."
    });
  }

  // 4. Scan for known Mobjects and Animations
  const mobjectKeywords = [
    "Axes", "ThreeDAxes", "Surface", "ParametricSurface", "Sphere", "Cube",
    "Cylinder", "Cone", "Arrow3D", "Line3D", "Tex", "MathTex", "TypstMath",
    "VectorField", "LorenzAttractor", "FourierEpicycles", "RiemannZeta", "Circle"
  ];

  mobjectKeywords.forEach((keyword) => {
    if (code.includes(keyword) && !detectedMobjects.includes(keyword)) {
      detectedMobjects.push(keyword);
    }
  });

  // Count self.play(...) and self.wait(...)
  lines.forEach((line, idx) => {
    if (line.includes("self.play(")) {
      animationCount++;
    }
    const waitMatch = line.match(/self\.wait\((\d+(\.\d+)?)\)/);
    if (waitMatch) {
      waitSeconds += parseFloat(waitMatch[1]);
    }
  });

  const estimatedDuration = Math.max(3, animationCount * 2 + waitSeconds);

  const errors = issues.filter((i) => i.severity === "error");

  return {
    isValid: errors.length === 0,
    sceneName,
    is3DScene: is3DScene || detectedMobjects.some((m) => ["ThreeDAxes", "Surface", "ParametricSurface", "Sphere"].includes(m)),
    detectedMobjects,
    animationCount,
    estimatedDuration,
    issues
  };
}
