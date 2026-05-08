import GlitchText from "@/components/ui/GlitchText";

export default function AdminPage() {
  return (
    <div className="cyber-card rounded-sm p-6">
      <GlitchText
        as="h1"
        color="cyan"
        className="text-2xl font-bold tracking-widest"
        animate
      >
        ADMIN
      </GlitchText>
      <p className="text-sm text-[var(--text-muted)] mt-2">
        Full control panel (challenges, users, teams, logs).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="border border-[var(--border-color)] bg-[rgba(0,243,255,0.03)] p-4">
          <div className="text-xs tracking-widest text-[var(--text-muted)]">
            Status
          </div>
          <div className="text-sm mt-1">OK</div>
        </div>
        <div className="border border-[var(--border-color)] bg-[rgba(0,243,255,0.03)] p-4">
          <div className="text-xs tracking-widest text-[var(--text-muted)]">
            Next
          </div>
          <div className="text-sm mt-1">Challenges CRUD</div>
        </div>
        <div className="border border-[var(--border-color)] bg-[rgba(0,243,255,0.03)] p-4">
          <div className="text-xs tracking-widest text-[var(--text-muted)]">
            Logs
          </div>
          <div className="text-sm mt-1">(coming)</div>
        </div>
      </div>
    </div>
  );
}
