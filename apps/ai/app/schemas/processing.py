from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    maxLength: str = Field(default="concise", description="concise, medium, or detailed")
    tone: str = Field(default="professional", description="neutral, professional, bullet_points")

class SummarizeResponse(BaseModel):
    summary: str
    keyPoints: List[str] = Field(default_factory=list)
    wordCount: int
    tokensUsed: int
    model: str

class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    categories: List[str] = Field(..., min_length=2, description="Target classification categories")
    instruction: Optional[str] = Field(default="Classify input text accurately")

class ClassifyResponse(BaseModel):
    category: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    tokensUsed: int
    model: str

class ExtractFieldSpec(BaseModel):
    name: str
    type: str  # string, number, boolean, list
    description: Optional[str] = None

class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000)
    schemaFields: List[ExtractFieldSpec] = Field(..., min_length=1)

class ExtractResponse(BaseModel):
    extracted: Dict[str, Any]
    tokensUsed: int
    model: str
