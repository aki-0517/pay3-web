import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { generateNonce } from "siwe";

export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<{
    nonce?: string;
    address?: string;
  }>(req, res, sessionOptions);

  session.nonce = generateNonce();
  await session.save();

  return NextResponse.json({ nonce: session.nonce });
}