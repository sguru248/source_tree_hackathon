import { NextRequest, NextResponse } from "next/server";
import { submitCheckpointMessage } from "@/lib/hedera";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, message } = body;

    if (!topicId || !message) {
      return NextResponse.json({ error: "topicId and message are required" }, { status: 400 });
    }

    const result = await submitCheckpointMessage(topicId, message);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
