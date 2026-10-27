from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as ai_router
from app.core.config import settings

app = FastAPI(
    title="FlowPilot AI — Intelligent Workflow Generation Service",
    description="Microservice providing structured workflow generation, summarization, classification, and entity extraction.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Allow local frontend and Express API origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "service": "FlowPilot AI Service",
        "status": "online",
        "docs": "/docs",
        "provider": settings.AI_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.AI_SERVICE_PORT, reload=True)
