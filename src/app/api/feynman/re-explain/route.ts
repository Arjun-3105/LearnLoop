import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { title, description, userExplanation, weaknesses } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
You are a knowledgeable, friendly technical mentor. A student is learning about "${title}" and has just sent a message or question.

Learning Topic: "${title}"
Topic Context (background only): "${description}"
Student's exact message: "${userExplanation}"
Identified gaps/questions: ${JSON.stringify(weaknesses)}

HOW TO RESPOND:
- If the student asked a direct factual question (e.g. "when was Next.js created?", "who made Python?", "what year did React launch?") — answer it precisely and correctly using your full knowledge. Do NOT restrict your answer to the topic context above; use everything you know.
- If the student is confused about the concept, explain it with a simple real-world analogy.
- If both apply, answer the question first, then connect it to the concept.
- Keep your response concise (3-4 sentences max), warm, and conversational.
- Never say you don't know something you actually know. Never guess — state facts confidently.

Return raw text only. No markdown, no bullet points.
`;

    const explanation = await callAI(prompt);

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate re-explanation" },
      { status: 500 }
    );
  }
}
