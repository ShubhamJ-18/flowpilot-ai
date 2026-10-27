from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.mock_provider import MockAIProvider
from app.providers.openai_provider import OpenAIProvider

def get_ai_provider() -> BaseAIProvider:
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "openai":
        return OpenAIProvider(
            api_key=settings.AI_API_KEY,
            model_name=settings.AI_MODEL,
            base_url=settings.OPENAI_API_BASE
        )

    # Default to deterministic mock provider for local development & testing
    return MockAIProvider(model_name=settings.AI_MODEL)
