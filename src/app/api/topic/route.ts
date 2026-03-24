import { NextResponse } from "next/server";
import { createTopic } from "@/lib/hedera";

export async function POST() {
  try {
    const topicId = await createTopic();
    return NextResponse.json({ topicId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
