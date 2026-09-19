import { NextResponse } from "next/server";

// The Google OAuth client ID is public by design (it's embedded in every
// Google Identity Services sign-in button), so it's safe to serve to any
// visitor who loads the login/register page.
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || null;
  return NextResponse.json({ clientId });
}
