import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * POST /api/validate-flag
 *
 * Body: { challengeId: string, flag: string }
 *
 * Validates a flag submission server-side.
 * - Hashes the submitted flag using the same algorithm as stored in the DB
 *   (bcrypt via Supabase's pgcrypto extension: crypt()).
 * - Records the submission (correct or not) without storing the raw flag.
 * - On success, increments the challenge solve count and the user's score.
 *
 * Returns:
 *   200 { correct: true }          – flag is valid
 *   200 { correct: false }         – flag is invalid
 *   400 { error: string }          – bad request
 *   401 { error: "Unauthorized" }  – not authenticated
 *   409 { error: string }          – already solved
 *   429 { error: string }          – rate limit exceeded
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

  // 3. Rate limiting (per user, 10 submissions per minute)
  const rl = checkRateLimit(user.id);
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many submissions. Retry after ${retryAfterSec}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  // 4. Prevent duplicate solves
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

  // 5. Fetch challenge (only active ones)
  const { data: challengeData, error: challengeError } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("is_active", true)
    .single();

  if (challengeError || !challengeData) {
    return NextResponse.json(
      { error: "Challenge not found." },
      { status: 400 }
    );
  }

  // 6. Verify flag using pgcrypto (bcrypt) via a Postgres RPC.
  //    The flag_hash is stored as: crypt(flag, gen_salt('bf'))
  //    We compare with: crypt(submitted_flag, stored_hash) = stored_hash
  const { data: verifyResult, error: verifyError } = await supabase.rpc(
    "verify_flag",
    {
      submitted_flag: flag.trim(),
      stored_hash: challengeData.flag_hash,
    }
  );

  if (verifyError) {
    // Fail closed: never fall back to plaintext comparison
    console.error("verify_flag RPC error:", verifyError.message);
    return NextResponse.json(
      { error: "Flag verification unavailable. Please try again." },
      { status: 500 }
    );
  }

  const isCorrect = verifyResult === true;

  // 7. Record submission (flag value is NOT stored to avoid plaintext exposure)
  const { error: insertError } = await supabase.from("submissions").insert({
    user_id: user.id,
    challenge_id: challengeId,
    is_correct: isCorrect,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to record submission." },
      { status: 500 }
    );
  }

  // 8. On correct flag: update score & solve count via security-definer RPCs
  if (isCorrect) {
    await Promise.all([
      supabase.rpc("increment_solves", { challenge_id: challengeId }),
      supabase.rpc("increment_score", {
        user_id: user.id,
        points: challengeData.points,
      }),
    ]);
  }

  return NextResponse.json({ correct: isCorrect });
}
