from typing import Dict, Any
from app.providers import get_ai_provider
from app.schemas.workflow import WorkflowProposal, WorkflowNodeSchema, WorkflowEdgeSchema

class WorkflowGeneratorService:
    def __init__(self):
        self.provider = get_ai_provider()

    async def generate_workflow(self, prompt: str, max_nodes: int = 15) -> Dict[str, Any]:
        result = await self.provider.generate_workflow(prompt=prompt, max_nodes=max_nodes)
        proposal_dict = result["proposal"]

        # Repair and sanitize proposal if needed
        nodes = proposal_dict.get("nodes", [])
        edges = proposal_dict.get("edges", [])

        # Ensure node IDs exist and positions are valid
        for idx, node in enumerate(nodes):
            if not node.get("id"):
                node["id"] = f"node_{idx + 1}"
            if not node.get("position"):
                node["position"] = {"x": float(100 + (idx * 220)), "y": 180.0}

        # Ensure edge IDs exist
        for idx, edge in enumerate(edges):
            if not edge.get("id"):
                edge["id"] = f"e_{edge.get('source')}_{edge.get('target')}_{idx}"

        validated_proposal = WorkflowProposal(**proposal_dict)

        return {
            "success": True,
            "proposal": validated_proposal.model_dump(),
            "tokensUsed": result.get("tokensUsed", 150),
            "model": result.get("model", "mock-model"),
            "provider": result.get("provider", "mock"),
            "estimatedCost": result.get("estimatedCost", 0.0)
        }
