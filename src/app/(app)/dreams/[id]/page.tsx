import { notFound } from "next/navigation";
import { DreamForm } from "@/components/DreamForm";
import { loadAll } from "@/lib/data";

export default async function EditDreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dreams } = await loadAll();
  const dream = dreams.find((d) => d.id === id);
  if (!dream) notFound();

  return (
    <>
      <div className="top">
        <div>
          <h2>Edit dream</h2>
          <div className="meta">Yearly cadence</div>
        </div>
      </div>
      <section className="panel">
        <div className="body">
          <DreamForm dream={dream} />
        </div>
      </section>
    </>
  );
}
