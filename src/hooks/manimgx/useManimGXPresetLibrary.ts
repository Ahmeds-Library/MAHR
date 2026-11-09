/**
 * ManimGX Mathematical Preset Library
 * Curated 3D mathematical scenes demonstrating GPU acceleration, Typst formulas, and 3D scenes.
 */

import { ManimGXMathPreset } from "../../services/manimgx/manimgxTypes";

export const MANIMGX_PRESETS: Record<string, ManimGXMathPreset> = {
  riemann: {
    id: "riemann",
    title: "Riemann Zeta Function & Analytic Continuation",
    category: "Complex Analysis",
    description: "Complex landscape mapping \\zeta(s) with pole at s=1, trivial zeros, and critical strip.",
    difficulty: "Advanced",
    formulaLatex: "\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} = \\frac{1}{1 - 2^{1-s}} \\sum_{n=1}^{\\infty} \\frac{(-1)^{n-1}}{n^s}",
    defaultDuration: 6,
    code: `from manimgx import *

class RiemannZetaLandscape(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=65 * DEGREES, theta=45 * DEGREES)
        title = TypstMath("zeta(s) == sum_(n=1)^oo 1/n^s")
        self.add_fixed_in_frame_mobjects(title)
        
        axes = ThreeDAxes(x_range=[-4, 4], y_range=[-4, 4], z_range=[-3, 3])
        surface = ParametricSurface(
            lambda u, v: np.array([u, v, np.sin(np.sqrt(u**2 + v**2)) * 1.5]),
            u_range=[-4, 4],
            v_range=[-4, 4],
            resolution=(64, 64)
        )
        self.play(Create(axes), Create(surface), run_time=2.5)
        self.begin_ambient_camera_rotation(rate=0.2)
        self.wait(3.5)`
  },
  lorenz: {
    id: "lorenz",
    title: "Lorenz Strange Attractor & Chaos Dynamics",
    category: "Chaos & Dynamics",
    description: "Atmospheric convection differential equations demonstrating the butterfly effect in 3D phase space.",
    difficulty: "Intermediate",
    formulaLatex: "\\frac{dx}{dt} = \\sigma(y - x), \\quad \\frac{dy}{dt} = x(\\rho - z) - y, \\quad \\frac{dz}{dt} = xy - \\beta z",
    defaultDuration: 7,
    code: `from manimgx import *

class LorenzAttractorFlow(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=70 * DEGREES, theta=60 * DEGREES)
        formula = TypstMath("dot(x) == sigma(y - x), quad dot(y) == x(rho - z) - y, quad dot(z) == x y - beta z")
        self.add_fixed_in_frame_mobjects(formula)
        
        attractor = LorenzAttractor(
            sigma=10.0, rho=28.0, beta=8.0/3.0,
            num_points=3500,
            color_gradient=[BLUE_E, CYAN, YELLOW, RED]
        )
        self.play(Create(attractor), run_time=4.0)
        self.begin_ambient_camera_rotation(rate=0.35)
        self.wait(3.0)`
  },
  saddle: {
    id: "saddle",
    title: "Neural Loss Landscape & Saddle Optimization",
    category: "Machine Learning",
    description: "Hyperbolic paraboloid showcasing gradient descent trajectory through non-convex saddle points.",
    difficulty: "Intermediate",
    formulaLatex: "\\mathcal{L}(\\theta) = \\frac{1}{2}(\\theta_1^2 - \\theta_2^2) + \\lambda \\sum \\sin(2\\theta_i)",
    defaultDuration: 6,
    code: `from manimgx import *

class NeuralLossLandscape(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=60 * DEGREES, theta=30 * DEGREES)
        title = TypstMath("cal(L)(theta) = 1/2(theta_1^2 - theta_2^2) + lambda sum sin(2 theta_i)")
        self.add_fixed_in_frame_mobjects(title)
        
        axes = ThreeDAxes(x_range=[-3, 3], y_range=[-3, 3], z_range=[-2, 2])
        loss_surf = Surface(
            lambda u, v: np.array([u, v, (u**2 - v**2)*0.18 + np.sin(u*2)*0.2]),
            u_range=[-3, 3], v_range=[-3, 3]
        )
        self.play(Create(axes), Create(loss_surf), run_time=2.0)
        self.wait(4.0)`
  },
  fourier: {
    id: "fourier",
    title: "Fourier Transform 3D Rotating Epicycles",
    category: "Calculus",
    description: "Superposition of complex rotating vectors drawing arbitrary closed parametric plane curves.",
    difficulty: "Beginner",
    formulaLatex: "f(t) = \\sum_{n=-\\infty}^{\\infty} c_n e^{i 2\\pi n t}",
    defaultDuration: 6,
    code: `from manimgx import *

class FourierEpicycles3D(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=50 * DEGREES, theta=35 * DEGREES)
        eq = TypstMath("f(t) = sum_(n=-oo)^oo c_n e^(i 2 pi n t)")
        self.add_fixed_in_frame_mobjects(eq)
        
        epicycles = FourierEpicycles(order=12, stroke_color=CYAN)
        self.play(Create(epicycles), run_time=3.5)
        self.wait(2.5)`
  },
  mobius: {
    id: "mobius",
    title: "Möbius Strip Non-Orientable Manifold",
    category: "Geometry",
    description: "One-sided surface with only one boundary component parameterized in 3D Euclidean space.",
    difficulty: "Beginner",
    formulaLatex: "x(u,v) = \\left(1 + \\frac{v}{2}\\cos\\frac{u}{2}\\right)\\cos u, \\quad z(u,v) = \\frac{v}{2}\\sin\\frac{u}{2}",
    defaultDuration: 5,
    code: `from manimgx import *

class MobiusStrip3D(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=65 * DEGREES, theta=45 * DEGREES)
        formula = TypstMath("x(u,v) = (1 + v/2 cos(u/2)) cos(u)")
        self.add_fixed_in_frame_mobjects(formula)
        
        strip = ParametricSurface(
            lambda u, v: np.array([
                (3 + v*np.cos(u/2))*np.cos(u),
                (3 + v*np.cos(u/2))*np.sin(u),
                v*np.sin(u/2)
            ]),
            u_range=[0, TAU],
            v_range=[-1, 1]
        )
        self.play(Create(strip), run_time=2.5)
        self.begin_ambient_camera_rotation(rate=0.4)
        self.wait(2.5)`
  }
};

export function useManimGXPresetLibrary() {
  const presets = Object.values(MANIMGX_PRESETS);
  const getPresetById = (id: string) => MANIMGX_PRESETS[id] || MANIMGX_PRESETS.riemann;

  return {
    presets,
    getPresetById
  };
}
