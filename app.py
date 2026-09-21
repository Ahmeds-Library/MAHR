"""
Companion FastAPI Application Entry Point for Universal AI Simulation Engine.
Runs alongside engine.py for flexible container deployment.
"""

from engine import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("engine:app", host="0.0.0.0", port=8000, reload=True)
