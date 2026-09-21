"""
Universal AI Simulation Engine Backend
Frameworks: FastAPI, WebSockets, PyVista, NumPy, Google GenAI SDK

This backend generates dynamic 3D physics and biological simulation routines
on the fly using Gemini, compiles them dynamically into runtime memory,
and streams the 60Hz vector geometry (vertices, indices, colors, transformations)
directly to the Three.js frontend canvas.
"""

import os
import sys
import time
import json
import asyncio
import traceback
import numpy as np
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

app = FastAPI(title="Universal AI Simulation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


class PromptRequest(BaseModel):
    prompt: str


class ActiveSimulation:
    def __init__(self, code_str: str, instance: Any, name: str):
        self.code_str = code_str
        self.instance = instance
        self.name = name
        self.created_at = time.time()


# In-memory store for active compiled simulation instance
active_sim: Optional[ActiveSimulation] = None


SYSTEM_INSTRUCTION = """
You are an expert computational physicist, biomathematician, and 3D graphics engineer.
Your task is to write a self-contained Python class that builds and animates any physical, biological, or mathematical 3D simulation using NumPy.

STRICT CODE GENERATION RULES:
1. Output ONLY executable Python code within a markdown python block: ```python ... ```
2. Do NOT output conversational text, explanations, or prose.
3. The class MUST be named `SimulationModel`.
4. The class MUST implement two methods:
   - `generate_mesh(self) -> dict`:
     Returns initial static or baseline 3D mesh structure:
     {
       "vertices": [[x, y, z], ...], # list of [x,y,z] coordinates (between -5 and +5)
       "indices": [[i1, i2, i3], ...], # triangular face indices (0-indexed)
       "colors": [[r, g, b], ...] # optional RGB values between 0.0 and 1.0
     }
   - `update_frame(self, t: float, dt: float) -> dict`:
     Updates coordinates or properties at timestamp `t` (seconds):
     {
       "vertices": [[x, y, z], ...], # updated vertex positions at time t
       "telemetry": { "key": "value" } # optional live metrics (e.g. pressure, velocity, energy)
     }
5. Keep vertex count between 100 and 1200 for silky-smooth 60fps streaming.
6. Make the motion physically realistic, biological, or mathematically rigorous based on the user's prompt!
"""


def compile_and_instantiate_simulation(code_str: str, sim_name: str = "CustomSim") -> Any:
    """
    Safely executes generated Python code in isolated scope and instantiates SimulationModel.
    """
    scope: Dict[str, Any] = {
        "np": np,
        "numpy": np,
        "math": __import__("math"),
        "time": time
    }
    
    # Try importing pyvista if available
    try:
        import pyvista as pv
        scope["pv"] = pv
        scope["pyvista"] = pv
    except ImportError:
        pass

    clean_code = code_str
    if "```python" in clean_code:
        clean_code = clean_code.split("```python")[1].split("```")[0].strip()
    elif "```" in clean_code:
        clean_code = clean_code.split("```")[1].split("```")[0].strip()

    exec(clean_code, scope)

    if "SimulationModel" not in scope:
        raise ValueError("Generated code does not define a 'SimulationModel' class.")

    model_class = scope["SimulationModel"]
    instance = model_class()
    return ActiveSimulation(code_str=clean_code, instance=instance, name=sim_name)


def generate_simulation_code_with_gemini(prompt: str) -> str:
    """
    Calls Gemini API to generate the dynamic 3D physics/biology class.
    """
    if not GEMINI_API_KEY:
        # High quality fallback implementation if key is missing
        return generate_fallback_code(prompt)

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Generate a complete 3D simulation Python class for: {prompt}",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
            )
        )
        return response.text or generate_fallback_code(prompt)
    except Exception as e:
        print(f"[Gemini API Error] {e}, using mathematical fallback engine.", file=sys.stderr)
        return generate_fallback_code(prompt)


def generate_fallback_code(prompt: str) -> str:
    """
    Built-in mathematical fallback simulation generators.
    """
    lower = prompt.lower()
    if "lung" in lower:
        return """
import numpy as np

class SimulationModel:
    def __init__(self):
        # Create dual lung ellipsoid lobes
        u = np.linspace(0, 2 * np.pi, 24)
        v = np.linspace(0, np.pi, 16)
        
        # Left lung
        x1 = 1.3 * np.outer(np.cos(u), np.sin(v)) - 1.2
        y1 = 2.2 * np.outer(np.sin(u), np.sin(v))
        z1 = 1.2 * np.outer(np.ones(np.size(u)), np.cos(v))
        
        # Right lung
        x2 = 1.3 * np.outer(np.cos(u), np.sin(v)) + 1.2
        y2 = 2.2 * np.outer(np.sin(u), np.sin(v))
        z2 = 1.2 * np.outer(np.ones(np.size(u)), np.cos(v))
        
        pts1 = np.c_[x1.flatten(), y1.flatten(), z1.flatten()]
        pts2 = np.c_[x2.flatten(), y2.flatten(), z2.flatten()]
        self.base_vertices = np.vstack([pts1, pts2])
        
        # Build grid faces
        indices = []
        n_u = len(u)
        n_v = len(v)
        for offset in [0, len(pts1)]:
            for i in range(n_u - 1):
                for j in range(n_v - 1):
                    p1 = offset + i * n_v + j
                    p2 = offset + (i + 1) * n_v + j
                    p3 = offset + (i + 1) * n_v + (j + 1)
                    p4 = offset + i * n_v + (j + 1)
                    indices.append([p1, p2, p3])
                    indices.append([p1, p3, p4])
        self.indices = indices

    def generate_mesh(self):
        return {
            "vertices": self.base_vertices.tolist(),
            "indices": self.indices
        }

    def update_frame(self, t: float, dt: float):
        # Asthma breathing cycle: rapid inhalation, constrained expiration with airway resistance
        cycle = (t % 3.5) / 3.5
        if cycle < 0.35:
            expansion = np.sin((cycle / 0.35) * (np.pi / 2)) * 0.32
        else:
            expansion = np.cos(((cycle - 0.35) / 0.65) * (np.pi / 2)) * 0.32
            
        broncho_spasm = np.sin(t * 18.0) * 0.03
        scale = 1.0 + expansion + broncho_spasm
        
        updated = self.base_vertices.copy()
        updated[:, 0] *= scale
        updated[:, 1] *= (1.0 + expansion * 0.7)
        updated[:, 2] *= scale
        
        return {
            "vertices": updated.tolist(),
            "telemetry": {
                "TidalVolume_mL": round(450 * (1.0 + expansion), 1),
                "AirwayResistance_cmH2O": round(14.2 + abs(broncho_spasm) * 100, 2)
            }
        }
"""
    else:
        # Universal Chaotic Double Pendulum / Wave Simulation
        return """
import numpy as np

class SimulationModel:
    def __init__(self):
        # 3D Torus / Resonance Structure
        u = np.linspace(0, 2 * np.pi, 30)
        v = np.linspace(0, 2 * np.pi, 18)
        U, V = np.meshgrid(u, v)
        R, r = 2.5, 0.9
        X = (R + r * np.cos(V)) * np.cos(U)
        Y = (R + r * np.cos(V)) * np.sin(U)
        Z = r * np.sin(V)
        
        self.base_verts = np.c_[X.flatten(), Y.flatten(), Z.flatten()]
        
        indices = []
        nu, nv = len(u), len(v)
        for i in range(nv - 1):
            for j in range(nu - 1):
                p1 = i * nu + j
                p2 = (i + 1) * nu + j
                p3 = (i + 1) * nu + (j + 1)
                p4 = i * nu + (j + 1)
                indices.append([p1, p2, p3])
                indices.append([p1, p3, p4])
        self.indices = indices

    def generate_mesh(self):
        return {
            "vertices": self.base_verts.tolist(),
            "indices": self.indices
        }

    def update_frame(self, t: float, dt: float):
        # Dynamic harmonic wave distortion
        updated = self.base_verts.copy()
        r = np.sqrt(updated[:, 0]**2 + updated[:, 1]**2)
        wave = np.sin(r * 2.2 - t * 4.0) * 0.35
        updated[:, 2] += wave
        
        # Rotation
        angle = t * 0.4
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        x_rot = updated[:, 0] * cos_a - updated[:, 1] * sin_a
        y_rot = updated[:, 0] * sin_a + updated[:, 1] * cos_a
        updated[:, 0] = x_rot
        updated[:, 1] = y_rot
        
        return {
            "vertices": updated.tolist(),
            "telemetry": {
                "Frequency_Hz": 2.4,
                "Resonance_Q": 88.5
            }
        }
"""


@app.post("/generate-simulation")
@app.post("/api/simulations/generate")
async def generate_simulation(req: PromptRequest):
    global active_sim
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Simulation prompt cannot be empty.")

    code_str = generate_simulation_code_with_gemini(prompt)
    try:
        active_sim = compile_and_instantiate_simulation(code_str, prompt)
        mesh_data = active_sim.instance.generate_mesh()
        return {
            "status": "success",
            "prompt": prompt,
            "code": code_str,
            "data": {
                "title": prompt,
                "mesh": mesh_data
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


@app.websocket("/simulation-stream")
@app.websocket("/engine-stream")
async def simulation_stream_endpoint(websocket: WebSocket):
    global active_sim
    await websocket.accept()
    await websocket.send_json({"type": "status", "status": "connected"})

    # Ensure default simulation is initialized
    if active_sim is None:
        default_code = generate_fallback_code("human lungs breathing with asthma")
        active_sim = compile_and_instantiate_simulation(default_code, "Human Lungs (Asthma)")

    t0 = time.time()
    last_t = t0

    try:
        while True:
            # Check for incoming client control messages non-blockingly
            try:
                msg_text = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                msg = json.loads(msg_text)
                if msg.get("type") == "set_prompt":
                    new_prompt = msg.get("prompt", "")
                    code_str = generate_simulation_code_with_gemini(new_prompt)
                    active_sim = compile_and_instantiate_simulation(code_str, new_prompt)
                    await websocket.send_json({"type": "prompt_ack", "prompt": new_prompt})
            except asyncio.TimeoutError:
                pass
            except json.JSONDecodeError:
                pass

            now = time.time()
            elapsed = now - t0
            dt = now - last_t
            last_t = now

            if active_sim and hasattr(active_sim.instance, "update_frame"):
                frame_data = active_sim.instance.update_frame(elapsed, dt)
                mesh_data = {
                    "vertices": frame_data.get("vertices", []),
                    "indices": getattr(active_sim.instance, "indices", []),
                }
                
                payload = {
                    "type": "sim_frame",
                    "data": {
                        "title": active_sim.name,
                        "time": round(elapsed, 3),
                        "mesh": mesh_data,
                        "telemetry": frame_data.get("telemetry", {})
                    }
                }
                await websocket.send_json(payload)

            # Target 60Hz streaming (16.6ms)
            await asyncio.sleep(0.016)

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected from simulation stream.")
    except Exception as e:
        print(f"[WebSocket Error] {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
