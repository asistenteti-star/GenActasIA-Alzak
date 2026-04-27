import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/utils";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;

  if (!claims || !isAllowedEmail(email)) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const file = path.join(process.cwd(), "data", "actas-legacy.html");
  const html = await readFile(file, "utf-8");

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
