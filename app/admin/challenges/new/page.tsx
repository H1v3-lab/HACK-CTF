import { redirect } from "next/navigation";
import GlitchText from "@/components/ui/GlitchText";
import { createClient } from "@/lib/supabase/server";

export default async function NewChallengePage() {
  async function create(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const points = Number(formData.get("points") ?? 100);
    const difficulty = String(formData.get("difficulty") ?? "medium");
    const flagHash = String(formData.get("flag_hash") ?? "").trim();

    if (!title || !description || !flagHash) return;

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        title,
        description,
        points,
        difficulty: difficulty as any,
        flag_hash: flagHash,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create");
    }

    redirect(`/admin/challenges/${data.id}`);
  }

  return (
    <div className="cyber-card rounded-sm p-6">
      <GlitchText
        as="h1"
        color="cyan"
        className="text-2xl font-bold tracking-widest"
        animate
      >
        NEW CHALLENGE
      </GlitchText>

      <form action={create} className="mt-6 flex flex-col gap-4">
        <label className="text-xs tracking-widest text-[var(--text-muted)]">
          TITLE
          <input
            name="title"
            className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
            required
          />
        </label>

        <label className="text-xs tracking-widest text-[var(--text-muted)]">
          DESCRIPTION
          <textarea
            name="description"
            className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2 min-h-32"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs tracking-widest text-[var(--text-muted)]">
            POINTS
            <input
              name="points"
              type="number"
              min={1}
              defaultValue={100}
              className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
              required
            />
          </label>

          <label className="text-xs tracking-widest text-[var(--text-muted)]">
            DIFFICULTY
            <select
              name="difficulty"
              defaultValue="medium"
              className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
              <option value="insane">insane</option>
            </select>
          </label>
        </div>

        <label className="text-xs tracking-widest text-[var(--text-muted)]">
          FLAG_HASH (bcrypt)
          <input
            name="flag_hash"
            className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2 font-mono"
            required
          />
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Provide bcrypt hash. (Next step: we can hash server-side.)
          </div>
        </label>

        <button className="border border-[var(--cyber-green)] text-[var(--cyber-green)] px-3 py-2 text-xs tracking-widest hover:bg-[rgba(0,255,65,0.08)]">
          CREATE
        </button>
      </form>
    </div>
  );
}
