import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingAppTableError(message: string) {
  return message.includes("Could not find the table") || message.includes("schema cache");
}

/** Maps Supabase auth user id → public.users.id (creates app user row if needed). */
export async function resolveAppUserId(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<{ appUserId: string | null; missingTables: boolean; error?: string }> {
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle<{ id: string }>();

  if (existingUserError) {
    const msg = existingUserError.message ?? "";
    if (isMissingAppTableError(msg)) {
      return { appUserId: null, missingTables: true };
    }
    return { appUserId: null, missingTables: false, error: msg };
  }

  if (existingUser?.id) {
    return { appUserId: existingUser.id, missingTables: false };
  }

  const { data: authUserResult, error: authLookupError } = await supabase.auth.admin.getUserById(authUserId);
  if (authLookupError) {
    return { appUserId: null, missingTables: false, error: authLookupError.message };
  }

  const authUser = authUserResult?.user;
  const { data: createdUser, error: createUserError } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUserId,
      email: authUser?.email ?? null,
      display_name: authUser?.user_metadata?.full_name ?? authUser?.email?.split("@")[0] ?? null,
      avatar_url: authUser?.user_metadata?.avatar_url ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (createUserError) {
    const msg = createUserError.message ?? "";
    if (isMissingAppTableError(msg)) {
      return { appUserId: null, missingTables: true };
    }
    return { appUserId: null, missingTables: false, error: msg };
  }

  return { appUserId: createdUser.id, missingTables: false };
}
