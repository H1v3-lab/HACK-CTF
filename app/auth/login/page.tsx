"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlitchText from "@/components/ui/GlitchText";
import CyberInput from "@/components/ui/CyberInput";
import CyberButton from "@/components/ui/CyberButton";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="cyber-card rounded-sm w-full max-w-sm p-8 neon-box-cyan fade-in-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <GlitchText as="h1" color="cyan" className="text-3xl font-bold tracking-widest mb-1">
            LOGIN
          </GlitchText>
          <p className="text-xs text-[var(--text-muted)] tracking-widest">
            AUTHENTICATE TO CONTINUE
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <CyberInput
            label="EMAIL"
            prefix="@"
            type="email"
            placeholder="operator@hack.ctf"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <CyberInput
            label="PASSWORD"
            prefix="🔒"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-xs text-red-400 border border-red-900 bg-red-950/20 px-3 py-2 rounded-sm">
              ✗ {error}
            </p>
          )}

          <CyberButton type="submit" variant="green" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "ACCESS SYSTEM"}
          </CyberButton>
        </form>

        <p className="text-xs text-[var(--text-muted)] text-center mt-6">
          No account?{" "}
          <Link
            href="/auth/register"
            className="text-[var(--cyber-cyan)] hover:neon-cyan"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
