import { prisma } from "@/prisma/prisma";

/** Minimal shape of a Supabase auth user we rely on. */
type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown> | null;
};

/**
 * Pull a display name from Supabase auth metadata. Email sign-up stores it under
 * `name` (we set it explicitly); Google OAuth provides `full_name` / `name`.
 */
export function nameFromUser(user: SupabaseAuthUser): string | null {
  const meta = user.user_metadata ?? {};
  const name = meta.name ?? meta.full_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

/**
 * Ensure a Prisma User row exists for this Supabase user, saving the name when
 * available and backfilling it for existing rows that don't have one yet.
 */
export async function ensureUserRecord(user: SupabaseAuthUser): Promise<void> {
  const name = nameFromUser(user);
  const existing = await prisma.user.findUnique({ where: { id: user.id } });

  if (!existing) {
    await prisma.user.create({
      data: { id: user.id, email: user.email ?? "", name },
    });
    return;
  }

  // Backfill the name if we now have one and the stored value differs.
  if (name && existing.name !== name) {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
  }
}
