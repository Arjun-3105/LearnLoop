import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/openrouter";
import { parseAiJson } from "@/lib/json";

type Flashcard = {
  title: string;
  explanation: string;
  example: string;
  checkpoint: string;
};

function cardCountFromLength(len: number): string {
  if (len < 5_000)  return "5 to 6";
  if (len < 15_000) return "8 to 10";
  if (len < 40_000) return "10 to 14";
  return "14 to 18";
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json() as { transcript?: string };

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const cardCount = cardCountFromLength(transcript.length);
    // Pass a generous chunk – gpt-4o-mini has 128k context
    const excerpt = transcript.slice(0, 14_000);

    const prompt = `
You are an expert coding educator. Analyze this video transcript thoroughly and create comprehensive flashcards that teach EVERY major concept covered in the video.

The learner has NOT seen the video. Your cards must independently teach the material.

IMPORTANT: Return ONLY valid JSON. Ensure all keys are quoted with double quotes. Escape any internal quotes in values.
Expected Format:
{
  "topic": "exact topic name from the video (e.g. 'React Hooks', 'Node.js Streams')",
  "cards": [
    {
      "title": "Specific concept name (e.g. 'useState Hook', 'useEffect Cleanup')",
      "explanation": "Clear 2-3 sentence explanation of what this concept is and WHY it matters",
      "example": "Concrete, minimal code or real-world example directly from the video context",
      "checkpoint": "A specific question the learner should be able to answer after understanding this card"
    }
  ]
}

Rules:
- Generate EXACTLY ${cardCount} cards — one card per major concept taught in the video
- Cover ALL hooks, functions, patterns, or techniques mentioned in the transcript — do not skip any
- Order cards from foundational to advanced (dependency order)
- Examples must be practical and match the video's specific examples where possible
- Checkpoints must be specific (not vague like "do you understand it?")
- If transcript mentions specific APIs, method names, or patterns — use those exact names

Transcript (${transcript.length} chars total):
${excerpt}
`;

    const raw = await callAI(prompt, { jsonMode: true, maxTokens: 8192 });
    const data = parseAiJson<{ topic: string; cards: Flashcard[] }>(raw);

    // Safety: ensure we always have at least some cards
    if (!data.cards || data.cards.length === 0) {
      throw new Error("AI returned no flashcards");
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
