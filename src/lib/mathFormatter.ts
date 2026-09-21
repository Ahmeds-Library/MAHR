/**
 * Utility helper to parse and format mathematical LaTeX text into clean,
 * readable Unicode representation for premium browser layout presentation.
 */
export const formatMathText = (text: string): string => {
  if (!text) return text;
  let result = text;
  
  // Fractions: \frac{num}{den} -> (num)/(den)
  result = result.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, "($1)/($2)");
  result = result.replace(/\\frac\s*([^{])\s*([^{])/g, "($1)/($2)");
  
  // Square roots: \sqrt{arg} -> √(arg)
  result = result.replace(/\\sqrt\s*\{([^}]+)\}/g, "√($1)");
  result = result.replace(/\\sqrt\s*([^{])/g, "√$1");

  // Superscripts
  result = result.replace(/\^2/g, "²");
  result = result.replace(/\^3/g, "³");
  result = result.replace(/\^n/g, "ⁿ");
  result = result.replace(/\^x/g, "ˣ");
  result = result.replace(/\^y/g, "ʸ");
  result = result.replace(/\^t/g, "ᵗ");
  result = result.replace(/\^-1/g, "⁻¹");

  // Subscripts
  result = result.replace(/_0/g, "₀");
  result = result.replace(/_1/g, "₁");
  result = result.replace(/_2/g, "₂");
  result = result.replace(/_3/g, "₃");
  result = result.replace(/_x/g, "ₓ");
  result = result.replace(/_y/g, "ᵧ");
  result = result.replace(/_i/g, "ᵢ");
  result = result.replace(/_j/g, "ⱼ");
  result = result.replace(/_k/g, "ₖ");
  result = result.replace(/_n/g, "ₙ");

  // Common LaTeX math symbol mappings
  const replacements: Record<string, string> = {
    "\\\\pm": "±",
    "\\\\cdot": "·",
    "\\\\times": "×",
    "\\\\div": "÷",
    "\\\\neq": "≠",
    "\\\\approx": "≈",
    "\\\\leq": "≤",
    "\\\\geq": "≥",
    "\\\\alpha": "α",
    "\\\\beta": "β",
    "\\\\gamma": "γ",
    "\\\\delta": "δ",
    "\\\\Delta": "Δ",
    "\\\\epsilon": "ε",
    "\\\\theta": "θ",
    "\\\\lambda": "λ",
    "\\\\mu": "μ",
    "\\\\pi": "π",
    "\\\\sigma": "σ",
    "\\\\omega": "ω",
    "\\\\Omega": "Ω",
    "\\\\phi": "φ",
    "\\\\psi": "ψ",
    "\\\\int": "∫",
    "\\\\sum": "∑",
    "\\\\partial": "∂",
    "\\\\infty": "∞",
    "\\\\hbar": "ħ",
    "\\\\to": "→",
    "\\\\rightarrow": "→",
    "\\\\gets": "←",
    "\\\\leftarrow": "←",
    "\\\\deg": "°",
    "\\\\circ": "°"
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, "g");
    result = result.replace(regex, value);
  }

  // Double backslash cleanups
  result = result.replace(/\\+/g, "");

  return result;
};
