import { notFound } from "next/navigation";
import { saveDream } from "@/app/actions";
import { DreamFields } from "@/components/DreamFields";
import { load } from "@/lib/data";

export default async function EditDreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { dreams } = await load("dreams");
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
          <form action={saveDream}>
            <DreamFields dream={dream} />
          </form>
        </div>
      </section>
    </>
  );
}
