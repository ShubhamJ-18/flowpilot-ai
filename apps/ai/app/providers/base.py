from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.schemas.workflow import WorkflowProposal
from app.schemas.processing import SummarizeResponse, ClassifyResponse, ExtractResponse, ExtractFieldSpec

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_workflow(self, prompt: str, max_nodes: int = 15) -> Dict[str, Any]:
        """Proposes a structured, validated workflow proposal."""
        pass

    @abstractmethod
    async def summarize(self, text: str, max_length: str, tone: str) -> SummarizeResponse:
        """Summarizes text according to specified length and tone."""
        pass

    @abstractmethod
    async def classify(self, text: str, categories: List[str], instruction: str) -> ClassifyResponse:
        """Classifies text into one of the candidate categories."""
        pass

    @abstractmethod
    async def extract(self, text: str, schema_fields: List[ExtractFieldSpec]) -> ExtractResponse:
        """Extracts structured entities matching schema specification."""
        pass
