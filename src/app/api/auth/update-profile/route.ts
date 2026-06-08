import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

const bodySchema = z.object({
  id: z.string(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  email: z.string().optional(),
});

type UpdateProfileRequest = z.infer<typeof bodySchema>;

interface UpdateProfileResponse {
  id?: string;
  full_name?: string | undefined;
  avatar_url?: string | undefined;
  email?: string | undefined;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch (parseError: unknown) {
    console.error("update-profile JSON parse error:", getErrorMessage(parseError));
    return NextResponse.json<UpdateProfileResponse>(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const body = bodySchema.safeParse(parsedBody);
  if (!body.success) {
    return NextResponse.json<UpdateProfileResponse>(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json<UpdateProfileResponse>(
      { error: "Supabase admin not configured" },
      { status: 500 }
    );
  }

  const { id, full_name, avatar_url, email }: UpdateProfileRequest = body.data;

  try {
    await supabase.from("users").upsert(
      {
        id,
        display_name: full_name ?? undefined,
        avatar_url: avatar_url ?? undefined,
      },
      { onConflict: "id" }
    );

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id, full_name, avatar_url, email }, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to upsert profile:", error.message);
      const msg = error.message ?? "";
      if (msg.includes("Could not find the table")) {
        return NextResponse.json<UpdateProfileResponse>({
          id,
          full_name,
          avatar_url,
          email,
        });
      }
      return NextResponse.json<UpdateProfileResponse>(
        { error: msg },
        { status: 500 }
      );
    }
    return NextResponse.json<UpdateProfileResponse>(data);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("update-profile error:", msg);
    if (msg.includes("Could not find the table")) {
      return NextResponse.json<UpdateProfileResponse>({
        id,
        full_name,
        avatar_url,
        email,
      });
    }
    return NextResponse.json<UpdateProfileResponse>(
      { error: msg },
      { status: 500 }
    );
  }
}
