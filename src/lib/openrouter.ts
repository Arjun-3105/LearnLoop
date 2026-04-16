const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callAI(
  prompt: string, 
  options?: string | { systemPrompt?: string; jsonMode?: boolean; maxTokens?: number }
): Promise<string> {
  const optionsObj = typeof options === "string" ? { systemPrompt: options } : options || {};
  const { systemPrompt, jsonMode, maxTokens = 4096 } = optionsObj;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const models = [
    process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-haiku",
  ];

  let lastError = "Unknown OpenRouter error";

  for (const model of models) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LearnLoop",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      lastError = `OpenRouter request failed for model '${model}' (${response.status}): ${errorBody}`;
      if (response.status === 404) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string" && content.trim()) {
      return content;
    }
    lastError = `OpenRouter returned empty content for model '${model}'`;
  }

  throw new Error(lastError);
}
