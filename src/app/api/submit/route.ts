import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL is not configured on the server." },
      { status: 500 }
    );
  }

  const formData = await request.formData();

  const n8nResponse = await fetch(webhookUrl, {
    method: "POST",
    body: formData,
  });

  if (!n8nResponse.ok) {
    const text = await n8nResponse.text();
    return NextResponse.json(
      { error: `Workflow request failed (${n8nResponse.status}): ${text}` },
      { status: 502 }
    );
  }

  const data = await n8nResponse.json();
  return NextResponse.json(data);
}
