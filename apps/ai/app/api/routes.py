from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.schemas.workflow import GenerateWorkflowRequest, GenerateWorkflowResponse
from app.schemas.processing import (
    SummarizeRequest, SummarizeResponse,
    ClassifyRequest, ClassifyResponse,
    ExtractRequest, ExtractResponse
)
from app.services.generator import WorkflowGeneratorService
from app.providers import get_ai_provider

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])

@router.get("/health")
async def health_check():
    provider = get_ai_provider()
    return {
        "status": "ok",
        "service": "FlowPilot AI Engine",
        "provider": provider.__class__.__name__,
        "version": "1.0.0"
    }

@router.post("/generate-workflow", response_model=GenerateWorkflowResponse)
async def generate_workflow(req: GenerateWorkflowRequest):
    try:
        service = WorkflowGeneratorService()
        result = await service.generate_workflow(prompt=req.prompt, max_nodes=req.maxNodes)
        return GenerateWorkflowResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow generation failed: {str(e)}")

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(req: SummarizeRequest):
    try:
        provider = get_ai_provider()
        return await provider.summarize(text=req.text, max_length=req.maxLength, tone=req.tone)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/classify", response_model=ClassifyResponse)
async def classify_text(req: ClassifyRequest):
    try:
        provider = get_ai_provider()
        return await provider.classify(text=req.text, categories=req.categories, instruction=req.instruction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

@router.post("/extract", response_model=ExtractResponse)
async def extract_data(req: ExtractRequest):
    try:
        provider = get_ai_provider()
        return await provider.extract(text=req.text, schema_fields=req.schemaFields)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
