import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ConvMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { reply: "AI concierge is not configured yet. Browse trips at /trips or /packages." },
      { status: 200 },
    );
  }

  let body: { messages?: ConvMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const messages: ConvMessage[] = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages." }, { status: 422 });
  }

  // Fetch a condensed snapshot of available inventory (server-side, bypasses RLS)
  const supabase = await createClient();

  const [{ data: packages }, { data: trips }] = await Promise.all([
    supabase
      .from("packages")
      .select("id, title, location, days, price, start_date, tags")
      .eq("status", "live")
      .order("start_date", { ascending: true })
      .limit(15),
    supabase
      .from("trips")
      .select("id, title, location, days, price_per_share, start_date, tags, spots_left")
      .eq("status", "live")
      .order("start_date", { ascending: true })
      .limit(15),
  ]);

  const inventoryLines: string[] = [];
  for (const p of packages ?? []) {
    inventoryLines.push(
      `[Original] "${p.title}" – ${p.location} · ${p.days}d · ₹${p.price} · starts ${p.start_date} · tags: ${(p.tags ?? []).join(", ")} · link: /packages/${p.id}`,
    );
  }
  for (const t of trips ?? []) {
    inventoryLines.push(
      `[Community] "${t.title}" – ${t.location} · ${t.days}d · ₹${t.price_per_share}/share · starts ${t.start_date} · ${t.spots_left} spots left · tags: ${(t.tags ?? []).join(", ")} · link: /trips/${t.id}`,
    );
  }

  const inventoryBlock =
    inventoryLines.length > 0
      ? inventoryLines.join("\n")
      : "No trips currently listed.";

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are Packy, the friendly AI travel concierge for Packuptrip — an Indian group travel platform. Today is ${today}.

Packuptrip offers two kinds of trips:
- **Packuptrip Originals** ("Original"): premium, hand-crafted packages with fixed prices.
- **Community Trips** ("Community"): trips posted by real travellers — join, split costs, make friends.

Here is the LIVE inventory of available trips (refresh every request):
${inventoryBlock}

Your job:
1. Help users find a trip that fits their vibe (destination, dates, budget, travel style).
2. When recommending trips, always include the exact link (e.g., "/trips/uuid" or "/packages/uuid").
3. Be warm, concise, and conversational. Bullet lists are fine; keep responses under 150 words.
4. If no trip matches, suggest they check back or host their own trip at /host.
5. Never make up trips. Only recommend from the inventory above.
6. If the user has follow-up questions (price, what's included, host info), tell them to click the link for full details.`;

  // Keep only the last 8 messages to avoid bloating context
  const history = messages.slice(-8);

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: systemPrompt,
      messages: history,
    });

    const reply = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
