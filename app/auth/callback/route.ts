import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/actas";
  if (!next.startsWith("/")) next = "/actas";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=exchange_failed`,
    );
  }

  const email = data.user?.email;
  if (!isAllowedEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/auth/error?reason=domain_not_allowed`,
    );
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}
