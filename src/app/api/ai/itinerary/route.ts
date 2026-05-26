import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI itinerary generation is not configured (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  let body: { title?: string; location?: string; days?: number; tags?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title = "", location = "", days = 5, tags = "" } = body;

  if (!title && !location) {
    return NextResponse.json(
      { error: "Provide at least a title or location to generate an itinerary." },
      { status: 422 },
    );
  }

  const prompt = `You are a travel itinerary assistant for an Indian travel platform called Packuptrip. Create a realistic, exciting day-by-day itinerary for a group trip.

Trip details:
- Title: ${title || "(untitled)"}
- Location/destination: ${location || "(unspecified)"}
- Duration: ${days} days
- Tags/vibe: ${tags || "(none)"}

Return ONLY a valid JSON array — no markdown, no commentary, no code fences. Each element must have exactly these keys:
{
  "day": <number starting at 1>,
  "title": "<short action title, e.g. 'Arrive in Coorg, coffee estate walk'>",
  "description": "<2–3 sentences: activities, meals, where you sleep, what makes this day special>"
}

The array must have exactly ${days} elements. Keep it authentic to Indian travel culture — mention local food, transport realities, off-beat spots where relevant.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();

    let itinerary: unknown;
    try {
      itinerary = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: "AI returned malformed JSON. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ itinerary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
