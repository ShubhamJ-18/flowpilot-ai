from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class ApprovedNodeType(str, Enum):
    MANUAL_TRIGGER = "MANUAL_TRIGGER"
    TEXT_INPUT = "TEXT_INPUT"
    TEXT_TEMPLATE = "TEXT_TEMPLATE"
    CONDITION = "CONDITION"
    AI_SUMMARIZE = "AI_SUMMARIZE"
    AI_CLASSIFY = "AI_CLASSIFY"
    AI_EXTRACT = "AI_EXTRACT"
    JSON_TRANSFORM = "JSON_TRANSFORM"
    DELAY = "DELAY"
    APPROVAL_GATE = "APPROVAL_GATE"
    REPORT_OUTPUT = "REPORT_OUTPUT"
    WEBHOOK_ACTION = "WEBHOOK_ACTION"

class WorkflowNodeSchema(BaseModel):
    id: str = Field(..., description="Unique node identifier, e.g. trigger_1, classify_1")
    type: ApprovedNodeType = Field(..., description="Approved node type from registry")
    config: Dict[str, Any] = Field(default_factory=dict, description="Node-specific configuration parameters")
    label: Optional[str] = Field(None, description="Human readable display label")
    position: Optional[Dict[str, float]] = Field(default_factory=lambda: {"x": 100.0, "y": 100.0})

class WorkflowEdgeSchema(BaseModel):
    id: Optional[str] = Field(None, description="Unique edge identifier")
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    sourceHandle: Optional[str] = Field(None, description="Optional port handle: 'true' or 'false' for condition")
    targetHandle: Optional[str] = Field(None, description="Optional target port handle")

class WorkflowProposal(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str = Field(..., max_length=500)
    nodes: List[WorkflowNodeSchema]
    edges: List[WorkflowEdgeSchema]
    explanation: str = Field(..., description="Clear explanation of the workflow architecture")

class GenerateWorkflowRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=2000, description="Natural language description of the workflow")
    maxNodes: int = Field(default=15, ge=2, le=30)

class GenerateWorkflowResponse(BaseModel):
    success: bool = True
    proposal: WorkflowProposal
    tokensUsed: int = 0
    model: str = "mock-model"
    provider: str = "mock"
    estimatedCost: float = 0.0
