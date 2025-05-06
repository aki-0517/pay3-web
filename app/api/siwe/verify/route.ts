import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { SiweMessage } from "siwe";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<{
    nonce?: string;
    address?: string;
  }>(req, res, sessionOptions);

  const { message, signature } = await req.json();

  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({
      signature,
      domain: req.nextUrl.host,
      nonce: session.nonce,
    });

    if (result.success) {
      session.address = siweMessage.address;
      await session.save();
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}