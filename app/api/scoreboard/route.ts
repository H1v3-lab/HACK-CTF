import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scoreboard_public")
    .select("id, username, avatar_url, score, solves, last_solve, position")
    .order("position", { ascending: true })
    .limit(100);

  if (error) {
    console.error("scoreboard_public error", error);
    return NextResponse.json({ error: "Failed to fetch scoreboard" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
