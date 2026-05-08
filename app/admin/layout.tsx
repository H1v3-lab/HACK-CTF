import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  return { supabase, user };
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="cyber-card rounded-sm p-4 lg:w-64 h-fit">
            <div className="text-xs tracking-widest text-[var(--text-muted)] mb-3">
              ADMIN PANEL
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              <Link className="hover:neon-cyan" href="/admin">
                Dashboard
              </Link>
              <Link className="hover:neon-cyan" href="/admin/challenges">
                Challenges
              </Link>
              <Link className="hover:neon-cyan" href="/admin/users">
                Users
              </Link>
              <Link className="hover:neon-cyan" href="/admin/teams">
                Teams
              </Link>
              <Link className="hover:neon-cyan" href="/admin/submissions">
                Submissions
              </Link>
              <Link className="hover:neon-cyan" href="/admin/audit">
                Audit logs
              </Link>
            </nav>
          </aside>

          <section className="flex-1">{children}</section>
        </div>
      </div>
    </div>
  );
}
