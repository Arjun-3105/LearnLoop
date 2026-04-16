import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/openrouter";
import { parseAiJson } from "@/lib/json";

export async function POST(req: NextRequest) {
  try {
    const { title, description, userExplanation } = await req.json();

    if (!title || !description || !userExplanation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
You are a supportive, knowledgeable technical mentor with broad expertise across software, technology, and computer science. You are helping a student learn using the Feynman technique.

Current Learning Topic: "${title}"
Topic Context: "${description}"
Student's Contribution: "${userExplanation}"

Your Task:
1. If the student asked a general factual question unrelated to the topic (e.g. "when was Next.js invented?", "who made React?") — answer it directly and accurately in the "good" section. Set "passed" to false so the dialogue continues and they can try explaining the actual topic. Never leave a genuine question unanswered.
2. If the student gave an explanation of the concept, evaluate it fairly against the topic context.
3. If the explanation is correct and demonstrates understanding, set "passed" to true.
4. Provide "good" items for strengths or correct facts/answers, and "weak" items for gaps or refinements needed.
5. Be encouraging and conversational — treat every message as a valid learning interaction.

IMPORTANT: Return ONLY valid JSON.
Expected Format:
{
  "passed": boolean,
  "good": [
    { "title": "Strength or Answer", "details": "What they understood well, or a direct answer to their question" }
  ],
  "weak": [
    { "title": "Area for Refinement", "details": "Something they missed or a concept that needs calibration" }
  ]
}
`;

    const raw = await callAI(prompt, { jsonMode: true });
    const data = parseAiJson(raw);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to evaluate" },
      { status: 500 }
    );
  }
}
