import abc
import asyncio
from typing import List, AsyncGenerator, Optional
from pydantic import BaseModel

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    context_window: int

class PricingInfo(BaseModel):
    prompt: float
    completion: float

class BaseProvider(abc.ABC):
    @abc.abstractmethod
    async def list_models(self) -> List[ModelInfo]:
        pass

    @abc.abstractmethod
    async def chat_stream(
        self, 
        messages: List[dict], 
        model: str, 
        temperature: float = 0.7, 
        max_tokens: int = 4096,
        tools: Optional[List] = None
    ) -> AsyncGenerator[str, None]:
        pass

    @abc.abstractmethod
    def count_tokens(self, text: str) -> int:
        pass

    @abc.abstractmethod
    def get_pricing(self, model: str) -> PricingInfo:
        pass

class GeminiProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # In a real implementation, we'd initialize the SDK here
        # import google.generativeai as genai
        # genai.configure(api_key=api_key)

    async def list_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(id="gemini-3-flash-preview", name="Gemini 3 Flash", provider="google", context_window=1000000),
            ModelInfo(id="gemini-3.1-pro-preview", name="Gemini 3.1 Pro", provider="google", context_window=2000000),
        ]

    async def chat_stream(self, messages, model, temperature=0.7, max_tokens=4096, tools=None) -> AsyncGenerator[str, None]:
        # Mocking the stream for the CLI code example
        response = "This is a simulated response from the Gemini provider in the Python CLI."
        for word in response.split():
            yield word + " "
            await asyncio.sleep(0.05)

    def count_tokens(self, text: str) -> int:
        return len(text) // 4 # Rough estimate

    def get_pricing(self, model: str) -> PricingInfo:
        return PricingInfo(prompt=0.0, completion=0.0)

class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def list_models(self) -> List[ModelInfo]:
        return [
            ModelInfo(id="gpt-4o", name="GPT-4o", provider="openai", context_window=128000),
            ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", provider="openai", context_window=128000),
        ]

    async def chat_stream(self, messages, model, temperature=0.7, max_tokens=4096, tools=None) -> AsyncGenerator[str, None]:
        response = "Simulated OpenAI response."
        for word in response.split():
            yield word + " "
            await asyncio.sleep(0.05)

    def count_tokens(self, text: str) -> int:
        return len(text) // 4

    def get_pricing(self, model: str) -> PricingInfo:
        return PricingInfo(prompt=0.005, completion=0.015)
