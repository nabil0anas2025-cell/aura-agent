import { GoogleGenAI } from "@google/genai";
import { Message, ModelInfo, Provider } from "@/src/types";

class AIService {
  private gemini: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.gemini = new GoogleGenAI({ apiKey });
    }
  }

  async chatStream(
    messages: Message[],
    model: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // For now, we only implement Gemini as it's the environment's native AI
    if (!this.gemini) {
      throw new Error("Gemini API key not found");
    }

    try {
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const lastMessage = messages[messages.length - 1].content;

      const chat = this.gemini.chats.create({
        model: model || "gemini-3-flash-preview",
        history: history as any,
      });

      const result = await chat.sendMessageStream({ message: lastMessage });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  getModels(): ModelInfo[] {
    return [
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', contextWindow: 1000000 },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', contextWindow: 2000000 },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000 },
      { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'nvidia', contextWindow: 8000 },
    ];
  }

  async generateImage(prompt: string): Promise<string> {
    if (!this.gemini) {
      throw new Error("Gemini API key not found");
    }

    try {
      const response = await this.gemini.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from model");
    } catch (error) {
      console.error("Image Generation Error:", error);
      throw error;
    }
  }

  async generateSpeech(text: string): Promise<string> {
    if (!this.gemini) {
      throw new Error("Gemini API key not found");
    }

    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO' as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      throw new Error("No audio data returned");
    } catch (error) {
      console.error("Speech Generation Error:", error);
      throw error;
    }
  }

  async vibeCode(
    prompt: string,
    models: string[],
    onProgress: (step: string, content: string) => void
  ): Promise<string> {
    if (!this.gemini) {
      throw new Error("Gemini API key not found");
    }

    let currentCode = "";
    
    // Step 1: Architect (Model 1)
    onProgress("Architecting", "Planning the structure...");
    const architectResponse = await this.gemini.models.generateContent({
      model: models[0] || "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `You are a Lead Architect. Plan the code for this request: "${prompt}". Provide only the implementation plan in markdown.` }] }],
    });
    onProgress("Architecting", architectResponse.text || "Plan generated.");

    // Step 2: Developer (Model 2)
    onProgress("Developing", "Writing the code...");
    const devResponse = await this.gemini.models.generateContent({
      model: models[1] || models[0] || "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `You are a Senior Developer. Implement the code based on this plan: ${architectResponse.text}. Provide ONLY the raw code without markdown blocks.` }] }],
    });
    currentCode = devResponse.text || "";
    onProgress("Developing", currentCode);

    // Step 3: Reviewer (Model 3 or fallback)
    onProgress("Reviewing", "Optimizing and fixing...");
    const reviewResponse = await this.gemini.models.generateContent({
      model: models[2] || models[0] || "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `You are a Security & Performance Reviewer. Review and optimize this code: ${currentCode}. Provide ONLY the final optimized raw code without markdown blocks.` }] }],
    });
    
    const finalCode = reviewResponse.text || currentCode;
    onProgress("Completed", finalCode);
    return finalCode;
  }
}

export const aiService = new AIService();
