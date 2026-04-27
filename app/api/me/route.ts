import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth-server";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
  });
}
