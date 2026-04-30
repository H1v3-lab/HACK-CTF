"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/scoreboard", label: "SCOREBOARD" },
  { href: "/profile", label: "PROFILE" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[var(--cyber-cyan)] font-bold text-xl tracking-widest neon-cyan">
              H4CK
            </span>
            <span className="text-[var(--cyber-green)] font-bold text-xl tracking-widest neon-green">
              CTF
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs tracking-widest transition-colors duration-200 glitch ${
                  pathname === link.href
                    ? "text-[var(--cyber-cyan)] neon-cyan"
                    : "text-[var(--text-muted)] hover:text-[var(--cyber-cyan)]"
                }`}
                data-text={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs tracking-widest text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                [DISCONNECT]
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--cyber-cyan)] transition-colors"
                >
                  LOGIN
                </Link>
                <Link
                  href="/auth/register"
                  className="cyber-btn cyber-btn text-xs px-3 py-1"
                >
                  <span>REGISTER</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[var(--cyber-cyan)] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-px bg-current mb-1" />
            <span className="block w-5 h-px bg-current mb-1" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--cyber-cyan)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleSignOut}
                className="text-xs text-left tracking-widest text-red-400"
              >
                [DISCONNECT]
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-xs tracking-widest text-[var(--text-muted)]"
                  onClick={() => setMenuOpen(false)}
                >
                  LOGIN
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs tracking-widest text-[var(--cyber-cyan)]"
                  onClick={() => setMenuOpen(false)}
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scanning line */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--cyber-cyan), transparent)",
        }}
      />
    </nav>
  );
}
