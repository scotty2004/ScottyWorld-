import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/integrations/push";

// The VAPID public key is not a secret (it's baked into the browser
// subscription request), so it's safe to expose to any authenticated
// client that wants to enable push notifications.
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  return NextResponse.json({ publicKey });
}
