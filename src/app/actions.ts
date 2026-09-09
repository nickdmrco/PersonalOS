"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function addTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const { supabase, user } = await requireUser();
  await supabase.from("tasks").insert({ title, user_id: user.id });
  revalidatePath("/");
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!id) return;
  const { supabase } = await requireUser();
  // RLS restricts this to the caller's own rows; no user_id filter needed.
  await supabase
    .from("tasks")
    .update(
      done
        ? { status: "open", completed_at: null }
        : { status: "done", completed_at: new Date().toISOString(), focus: false },
    )
    .eq("id", id);
  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await requireUser();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
