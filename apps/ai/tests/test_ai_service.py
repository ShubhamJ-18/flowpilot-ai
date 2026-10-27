import pytest
from app.providers.mock_provider import MockAIProvider
from app.schemas.processing import ExtractFieldSpec

@pytest.mark.asyncio
async def test_mock_provider_generates_valid_workflow():
    provider = MockAIProvider()
    result = await provider.generate_workflow("Every morning classify customer tickets and summarize issues")
    assert result["proposal"]["name"] == "Customer Support Triage & Report"
    assert len(result["proposal"]["nodes"]) >= 3
    assert len(result["proposal"]["edges"]) >= 2
    assert result["proposal"]["nodes"][0]["type"] == "MANUAL_TRIGGER"

@pytest.mark.asyncio
async def test_mock_provider_summarize():
    provider = MockAIProvider()
    res = await provider.summarize("Customer is frustrated with server downtime. Critical bug needs patching.")
    assert len(res.summary) > 0
    assert res.wordCount > 0

@pytest.mark.asyncio
async def test_mock_provider_classify():
    provider = MockAIProvider()
    res = await provider.classify("Server is completely down and database is throwing 500 error!", ["urgent", "normal", "low"])
    assert res.category == "urgent"
    assert res.confidence >= 0.8

@pytest.mark.asyncio
async def test_mock_provider_extract():
    provider = MockAIProvider()
    fields = [
        ExtractFieldSpec(name="customer_name", type="string"),
        ExtractFieldSpec(name="invoice_total", type="number")
    ]
    res = await provider.extract("Invoice from Acme Corp for $1250.50 due tomorrow", fields)
    assert "customer_name" in res.extracted
    assert res.extracted["invoice_total"] == 1250.5
