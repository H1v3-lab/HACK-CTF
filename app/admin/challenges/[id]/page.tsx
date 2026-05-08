import { notFound, redirect } from "next/navigation";
import GlitchText from "@/components/ui/GlitchText";
import { createClient } from "@/lib/supabase/server";

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select(
      "id, title, description, points, difficulty, is_active, solves, deleted_at, flag_hash"
    )
    .eq("id", id)
    .single();

  if (!challenge) return notFound();

  async function save(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const points = Number(formData.get("points") ?? 100);
    const difficulty = String(formData.get("difficulty") ?? "medium");
    const isActive = formData.get("is_active") === "on";

    const { error } = await supabase
      .from("challenges")
      .update({ title, description, points, difficulty: difficulty as any, is_active: isActive })
      .eq("id", id);

    if (error) throw new Error(error.message);

    redirect(`/admin/challenges/${id}`);
  }

  async function softDelete() {
    "use server";
    const supabase = await createClient();

    const { error } = await supabase
      .from("challenges")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);
    if (error) throw new Error(error.message);

    redirect("/admin/challenges");
  }

  async function restore() {
    "use server";
    const supabase = await createClient();

    const { error } = await supabase
      .from("challenges")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) throw new Error(error.message);

    redirect(`/admin/challenges/${id}`);
  }

  return (
    <div className="cyber-card rounded-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <GlitchText
            as="h1"
            color="cyan"
            className="text-2xl font-bold tracking-widest"
            animate
          >
            EDIT CHALLENGE
          </GlitchText>
          <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">{id}</p>
        </div>

        {challenge.deleted_at ? (
          <form action={restore}>
            <button className="border border-[var(--cyber-green)] text-[var(--cyber-green)] px-3 py-2 text-xs tracking-widest hover:bg-[rgba(0,255,65,0.08)]">
              RESTORE
            </button>
          </form>
        ) : (
          <form action={softDelete}>
            <button className="border border-red-500 text-red-400 px-3 py-2 text-xs tracking-widest hover:bg-[rgba(255,0,0,0.08)]">
              SOFT DELETE
            </button>
          </form>
        )}
      </div>

      <form action={save} className="mt-6 flex flex-col gap-4">
        <label className="text-xs tracking-widest text-[var(--text-muted)]">
          TITLE
          <input
            name="title"
            defaultValue={challenge.title}
            className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
            required
          />
        </label>

        <label className="text-xs tracking-widest text-[var(--text-muted)]">
          DESCRIPTION
          <textarea
            name="description"
            defaultValue={challenge.description}
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
              defaultValue={challenge.points}
              className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
              required
            />
          </label>

          <label className="text-xs tracking-widest text-[var(--text-muted)]">
            DIFFICULTY
            <select
              name="difficulty"
              defaultValue={challenge.difficulty}
              className="mt-1 w-full bg-transparent border border-[var(--border-color)] px-3 py-2"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
              <option value="insane">insane</option>
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-xs tracking-widest text-[var(--text-muted)]">
          <input name="is_active" type="checkbox" defaultChecked={challenge.is_active} />
          ACTIVE
        </label>

        <button className="border border-[var(--cyber-green)] text-[var(--cyber-green)] px-3 py-2 text-xs tracking-widest hover:bg-[rgba(0,255,65,0.08)]">
          SAVE
        </button>
      </form>

      <div className="mt-6 text-[10px] text-[var(--text-muted)]">
        Flag hash is stored but not editable here yet.
      </div>
    </div>
  );
}
