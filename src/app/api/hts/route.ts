import { NextRequest, NextResponse } from "next/server";
import { mintNFT, createNFTToken } from "@/lib/hedera";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "createToken") {
      const tokenId = await createNFTToken();
      return NextResponse.json({ tokenId });
    }

    if (action === "mint") {
      const { tokenId, metadata } = body;
      if (!tokenId || !metadata) {
        return NextResponse.json({ error: "tokenId and metadata required" }, { status: 400 });
      }
      const serialNumber = await mintNFT(tokenId, metadata);
      return NextResponse.json({ serialNumber });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
