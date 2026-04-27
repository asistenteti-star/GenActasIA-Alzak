import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars, isAllowedEmail } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and supabase.auth.getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;

  const path = request.nextUrl.pathname;
  const isPublicRoute =
    path === "/login" ||
    path.startsWith("/auth/") ||
    path === "/alzak-logo.png" ||
    path === "/favicon.ico";

  // Not authenticated → redirect to login (except public routes)
  if (!claims && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated but email not in allowed domain → sign out + error page
  if (claims && email && !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/error";
    url.searchParams.set("reason", "domain_not_allowed");
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting /login → redirect to /actas
  if (claims && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/actas";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
