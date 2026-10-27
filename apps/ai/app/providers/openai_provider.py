import json
import httpx
from typing import Dict, Any, List
from app.providers.base import BaseAIProvider
from app.schemas.workflow import WorkflowProposal, WorkflowNodeSchema, WorkflowEdgeSchema
from app.schemas.processing import SummarizeResponse, ClassifyResponse, ExtractResponse, ExtractFieldSpec

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")

    async def _post_chat(self, messages: List[Dict[str, str]], json_mode: bool = True) -> Dict[str, Any]:
        if not self.api_key or self.api_key.startswith("mock"):
            raise ValueError("OpenAI API key not configured or set to mock. Please configure AI_API_KEY.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def generate_workflow(self, prompt: str, max_nodes: int = 15) -> Dict[str, Any]:
        system_instruction = (
            "You are FlowPilot AI workflow generator. Convert the user prompt into a structured DAG workflow JSON.\n"
            "Rules:\n"
            "1. ONLY use registered node types: MANUAL_TRIGGER, TEXT_INPUT, TEXT_TEMPLATE, CONDITION, "
            "AI_SUMMARIZE, AI_CLASSIFY, AI_EXTRACT, JSON_TRANSFORM, DELAY, APPROVAL_GATE, REPORT_OUTPUT, WEBHOOK_ACTION.\n"
            "2. Graph must have exactly one MANUAL_TRIGGER node with 0 incoming edges.\n"
            "3. No cycles or self-loops.\n"
            "4. Return strict JSON format with fields: name, description, nodes, edges, explanation."
        )

        res = await self._post_chat([
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Create workflow for: {prompt}"}
        ])

        content = res["choices"][0]["message"]["content"]
        data = json.loads(content)
        usage = res.get("usage", {})
        proposal = WorkflowProposal(**data)

        return {
            "proposal": proposal.model_dump(),
            "tokensUsed": usage.get("total_tokens", 0),
            "model": self.model_name,
            "provider": "openai",
            "estimatedCost": (usage.get("total_tokens", 0) / 1000) * 0.0005
        }

    async def summarize(self, text: str, max_length: str = "concise", tone: str = "professional") -> SummarizeResponse:
        system = f"Summarize the provided text ({max_length} length, {tone} tone). Return JSON: {{'summary': str, 'keyPoints': list[str]}}"
        res = await self._post_chat([
            {"role": "system", "content": system},
            {"role": "user", "content": text}
        ])
        data = json.loads(res["choices"][0]["message"]["content"])
        usage = res.get("usage", {})
        return SummarizeResponse(
            summary=data.get("summary", ""),
            keyPoints=data.get("keyPoints", []),
            wordCount=len(data.get("summary", "").split()),
            tokensUsed=usage.get("total_tokens", 0),
            model=self.model_name
        )

    async def classify(self, text: str, categories: List[str], instruction: str = "") -> ClassifyResponse:
        system = f"Classify the text into one of these categories: {json.dumps(categories)}. Instruction: {instruction}. Return JSON: {{'category': str, 'confidence': float, 'reasoning': str}}"
        res = await self._post_chat([
            {"role": "system", "content": system},
            {"role": "user", "content": text}
        ])
        data = json.loads(res["choices"][0]["message"]["content"])
        usage = res.get("usage", {})
        return ClassifyResponse(
            category=data.get("category", categories[0]),
            confidence=float(data.get("confidence", 0.9)),
            reasoning=data.get("reasoning", "Classified by LLM"),
            tokensUsed=usage.get("total_tokens", 0),
            model=self.model_name
        )

    async def extract(self, text: str, schema_fields: List[ExtractFieldSpec]) -> ExtractResponse:
        fields_repr = {f.name: f.type for f in schema_fields}
        system = f"Extract structured data matching fields: {json.dumps(fields_repr)}. Return JSON: {{'extracted': dict}}"
        res = await self._post_chat([
            {"role": "system", "content": system},
            {"role": "user", "content": text}
        ])
        data = json.loads(res["choices"][0]["message"]["content"])
        usage = res.get("usage", {})
        return ExtractResponse(
            extracted=data.get("extracted", {}),
            tokensUsed=usage.get("total_tokens", 0),
            model=self.model_name
        )
