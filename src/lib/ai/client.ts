import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!cachedClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return cachedClient;
}
