import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

const createProfileRequestSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  full_name: z.string().trim().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

type CreateProfileRequest = z.infer<typeof createProfileRequestSchema>;

interface CreateProfileResponse {
  ok?: boolean;
  error?: string;
}

function isMissingAppTableError(message: string) {
  return message.includes("Could not find the table") || message.includes("schema cache");
}

export async function POST(req: Request): Promise<Response> {
  try {
    let parsedBody: unknown;
    try {
      parsedBody = await req.json();
    } catch (parseError: unknown) {
      console.error("create-profile JSON parse error:", getErrorMessage(parseError));
      return NextResponse.json<CreateProfileResponse>(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const body = createProfileRequestSchema.safeParse(parsedBody);
    if (!body.success) {
      return NextResponse.json<CreateProfileResponse>(
        { error: "Missing required fields: id, email" },
        { status: 400 }
      );
    }

    const { id, email, avatar_url }: CreateProfileRequest = body.data;
    const full_name = body.data.full_name || email.split("@")[0] || "Moodify user";
    const supabase = createSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json<CreateProfileResponse>(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    try {
      const { error: userError } = await supabase.from("users").upsert(
        { id, auth_user_id: id, email, display_name: full_name, avatar_url },
        { onConflict: "id" }
      );

      if (userError) {
        throw userError;
      }

      const { error: profileError } = await supabase.from("profiles").upsert(
        { id, email, full_name, avatar_url },
        { onConflict: "id" }
      );

      if (profileError) {
        throw profileError;
      }

      return NextResponse.json<CreateProfileResponse>({ ok: true });
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      if (isMissingAppTableError(msg)) {
        console.warn("create-profile skipped because app tables are missing:", msg);
        return NextResponse.json<CreateProfileResponse>({ ok: true });
      }
      console.error("create-profile supabase error:", msg);
      return NextResponse.json<CreateProfileResponse>(
        { error: msg },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json<CreateProfileResponse>(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
