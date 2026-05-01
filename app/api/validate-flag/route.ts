import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/validate-flag
 *
 * Body: { challengeId: string, flag: string }
 *
 * Validates a flag submission server-side.
 * - Hashes the submitted flag using the same algorithm as stored in the DB
 *   (bcrypt via Supabase's pgcrypto extension: crypt()).
 * - Records the submission (correct or not).
 * - On success, increments the challenge solve count and the user's score.
 *
 * Returns:
 *   200 { correct: true }          – flag is valid
 *   200 { correct: false }         – flag is invalid
 *   400 { error: string }          – bad request
 *   401 { error: "Unauthorized" }  – not authenticated
 *   409 { error: string }          – already solved
 *   500 { error: string }          – server error
 */
export async function POST(request: NextRequest) {
  // 1. Parse body
  let body: { challengeId?: unknown; flag?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { challengeId, flag } = body;

  if (
    typeof challengeId !== "string" ||
    !challengeId ||
    typeof flag !== "string" ||
    !flag
  ) {
    return NextResponse.json(
      { error: "challengeId and flag are required strings." },
      { status: 400 }
    );
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 3. Prevent duplicate solves
  const { data: existingSolve } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("is_correct", true)
    .maybeSingle();

  if (existingSolve) {
    return NextResponse.json(
      { error: "Challenge already solved." },
      { status: 409 }
    );
  }

  // 4. Fetch challenge (only active ones)
  const { data: challengeData, error: challengeError } = await supabase
    .from("challenges")
    .select("id, flag_hash, points, is_active")
    .eq("id", challengeId)
    .eq("is_active", true)
    .single();

  if (challengeError || !challengeData) {
    return NextResponse.json(
      { error: "Challenge not found." },
      { status: 400 }
    );
  }

  const challenge = challengeData as {
    id: string;
    flag_hash: string;
    points: number;
    is_active: boolean;
  };

  // 5. Verify flag using pgcrypto (bcrypt) via a Postgres RPC
  //    The flag_hash is stored as: crypt(flag, gen_salt('bf'))
  //    We compare with: crypt(submitted_flag, stored_hash) = stored_hash
  let isCorrect = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: verifyResult, error: verifyError } = await (supabase as any).rpc(
      "verify_flag",
      { submitted_flag: flag.trim(), stored_hash: challenge.flag_hash }
    );
    if (verifyError) throw verifyError;
    isCorrect = verifyResult === true;
  } catch {
    // Fallback: plain-text comparison (only when pgcrypto RPC is unavailable)
    // In production, always use the bcrypt RPC.
    isCorrect = flag.trim() === challenge.flag_hash;
  }

  // 6. Record submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any).from("submissions").insert({
    user_id: user.id,
    challenge_id: challengeId,
    flag: flag.trim(),
    is_correct: isCorrect,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to record submission." },
      { status: 500 }
    );
  }

  // 7. On correct flag: update score & solve count
  if (isCorrect) {
    await Promise.all([
      // Increment challenge solve count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("increment_solves", { challenge_id: challengeId }),
      // Increment user score
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("increment_score", {
        user_id: user.id,
        points: challenge.points,
      }),
    ]);
  }

  return NextResponse.json({ correct: isCorrect });
}
