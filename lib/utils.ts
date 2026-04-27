export const ALLOWED_DOMAIN = "alzakfoundation.org";
export const ADMIN_EMAIL = "asistenteti@alzakfoundation.org";

export const hasEnvVars =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
