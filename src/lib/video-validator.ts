import { callAI } from "./openrouter";

/**
 * Checks if a video's metadata and transcript suggest it is educational.
 * Returns true if educational, false otherwise.
 */
export async function checkIsEducational(meta: {
  title: string;
  description: string;
  channelName: string;
  categoryId?: string;
  transcript: string;
}): Promise<{ isEducational: boolean; reason?: string }> {
  // 1. Heuristic check: Category IDs
  // 27: Education
  // 28: Science & Technology
  // 26: How-to & Style
  const educationalCategories = ["27", "28", "26"];
  
  // If explicitly in a non-educational category like Comedy (23) or Entertainment (24) or Music (10)
  // we still check with AI because some educational creators use those categories.
  
  // 2. AI Check for higher accuracy
  const prompt = `
Analyze the following YouTube video information and determine if it is "EDUCATIONAL" content meant for learning (e.g., tutorials, lectures, deep dives, explanations, how-to guides).

Video Information:
Title: ${meta.title}
Channel: ${meta.channelName}
Category ID: ${meta.categoryId || "Unknown"}
Description Excerpt: ${meta.description.slice(0, 1000)}
Transcript Excerpt: ${meta.transcript.slice(0, 2000)}

Return ONLY a JSON object:
{
  "isEducational": boolean,
  "reason": "Brief 1-sentence explanation of why it is or isn't educational"
}

Note: If it's a coding tutorial, academic lecture, product guide, or conceptual explanation, mark it as true. If it's pure entertainment, music, vlog, comedy, or gaming (without educational purpose), mark it as false.
`;

  try {
    const raw = await callAI(prompt, { jsonMode: true, maxTokens: 200 });
    const data = JSON.parse(raw) as { isEducational: boolean; reason?: string };
    
    // If category is Education or Science & Tech, we lean towards true unless AI is very sure it's false
    if (meta.categoryId && ["27", "28"].includes(meta.categoryId) && !data.isEducational) {
      // If AI thinks it's not educational but YT says it is, let's trust YT unless the reason is very strong.
      // For now, we'll follow AI's decision but maybe log this.
    }

    return data;
  } catch (error) {
    console.error("Educational check failed:", error);
    // Fallback: Default to true to not block users if AI service is down
    return { isEducational: true };
  }
}
