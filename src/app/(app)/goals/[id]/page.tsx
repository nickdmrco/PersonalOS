import { notFound } from "next/navigation";
import { GoalForm } from "@/components/GoalForm";
import { load } from "@/lib/data";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { goals, dreams } = await load("goals", "dreams");
  const goal = goals.find((g) => g.id === id);
  if (!goal) notFound();

  return (
    <>
      <div className="top">
        <div>
          <h2>Edit goal</h2>
          <div className="meta">{goal.quarter}</div>
        </div>
      </div>
      <section className="panel">
        <div className="body">
          <GoalForm goal={goal} dreams={dreams} />
        </div>
      </section>
    </>
  );
}
