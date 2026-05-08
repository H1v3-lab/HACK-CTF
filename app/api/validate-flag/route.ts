import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

function isCsrfAllowed(req: NextRequest): boolean {
  // Basic CSRF mitigation for cookie-authenticated requests.
  // For same-origin requests, Origin should match.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // CSRF guard
  if (!isCsrfAllowed(request)) {
    return NextResponse.json({ error: "CSRF blocked." }, { status: 403 });
  }

  // 1. Parse body
  let body: { challengeId?: unknown; flag?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { challengeId, flag } = body;

  if (typeof challengeId !== "string" || !challengeId || typeof flag !== "string") {
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
  const rl = await checkRateLimit(`flag:${user.id}`);
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

  // 4. Submit via atomic RPC (no flag_hash exposure, no race)
  const { data, error } = await supabase.rpc("submit_flag", {
    challenge_id: challengeId,
    submitted_flag: flag.trim(),
  });

  if (error) {
    // Map common cases
    if (error.message.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (error.message.toLowerCase().includes("challenge not found")) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 400 });
    }

    console.error("submit_flag RPC error:", error);
    return NextResponse.json(
      { error: "Flag verification unavailable. Please try again." },
      { status: 500 }
    );
  }

  // supabase rpc returns array for set-returning functions
  const row = Array.isArray(data) ? data[0] : data;
  const correct = row?.correct === true;
  const alreadySolved = row?.already_solved === true;

  if (correct && alreadySolved) {
    return NextResponse.json({ error: "Challenge already solved." }, { status: 409 });
  }

  return NextResponse.json({ correct });
}
