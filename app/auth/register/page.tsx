"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlitchText from "@/components/ui/GlitchText";
import CyberInput from "@/components/ui/CyberInput";
import CyberButton from "@/components/ui/CyberButton";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="cyber-card rounded-sm w-full max-w-sm p-8 fade-in-up">
        <div className="mb-8 text-center">
          <GlitchText as="h1" color="green" className="text-3xl font-bold tracking-widest mb-1">
            REGISTER
          </GlitchText>
          <p className="text-xs text-[var(--text-muted)] tracking-widest">
            CREATE YOUR OPERATOR PROFILE
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <p className="text-[var(--cyber-green)] text-sm mb-2">
              ✓ Registration successful!
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Check your email to confirm your account. Redirecting…
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <CyberInput
              label="USERNAME"
              prefix=">"
              type="text"
              placeholder="ghost_operator"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoFocus
            />
            <CyberInput
              label="EMAIL"
              prefix="@"
              type="email"
              placeholder="operator@hack.ctf"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CyberInput
              label="PASSWORD"
              prefix="🔒"
              type="password"
              placeholder="min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {error && (
              <p className="text-xs text-red-400 border border-red-900 bg-red-950/20 px-3 py-2 rounded-sm">
                ✗ {error}
              </p>
            )}

            <CyberButton type="submit" variant="green" disabled={loading}>
              {loading ? "CREATING PROFILE..." : "CREATE PROFILE"}
            </CyberButton>
          </form>
        )}

        <p className="text-xs text-[var(--text-muted)] text-center mt-6">
          Already registered?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--cyber-cyan)] hover:neon-cyan"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
