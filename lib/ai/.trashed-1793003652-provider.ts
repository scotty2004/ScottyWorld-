export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIRequest = {
  messages: AIMessage[];
  temperature?: number;
};

export type AIProvider = {
  chat(input: AIRequest): Promise<string>;
};

class ConfiguredProvider implements AIProvider {
  async chat(input: AIRequest) {
    const key = process.env.AI_PROVIDER_API_KEY;
    const baseUrl = process.env.AI_PROVIDER_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!key) {
      throw new Error("AI provider is not configured.");
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: input.messages,
        temperature: input.temperature ?? 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider returned ${response.status}.`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("AI provider returned an invalid response.");
    }

    return content;
  }
}

export const aiProvider: AIProvider = new ConfiguredProvider();
