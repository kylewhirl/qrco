import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ ok: true });
    
  }

  export async function PUT() {
    return NextResponse.json({"data":"https://google.com","background":{"type":"solid","colors":["#ffffff"]},"dots":{"type":"solid","colors":["#4285f4"]},"style":"rounded","logo":"link"})
  }

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.MISTRAL_API_KEY;
    const agentId = process.env.MISTRAL_AGENT_ID;
    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "Missing Mistral API credentials" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.mistral.ai/v1/agents/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          agent_id: agentId
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    console.log("AI raw content:", result);
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch (e) {
      console.error("Failed to JSON.parse AI content:", e);
      return NextResponse.json({ error: "Invalid JSON in AI response" }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("QR AI route error:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}