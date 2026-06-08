import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

interface GetProfileResponse {
  id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  error?: string;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json<GetProfileResponse>(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json<GetProfileResponse>(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      const msg = error.message ?? "";
      if (msg.includes("Could not find the table")) {
        // schema not present — return empty profile
        return NextResponse.json<GetProfileResponse>({});
      }
      return NextResponse.json<GetProfileResponse>(
        { error: msg },
        { status: 500 }
      );
    }

    return NextResponse.json<GetProfileResponse>(data ?? {});
  } catch (error: unknown) {
    return NextResponse.json<GetProfileResponse>(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
