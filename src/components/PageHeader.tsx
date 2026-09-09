import { CaptureBar } from "@/components/CaptureBar";

export function PageHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <>
      <div className="top">
        <div>
          <h2>{title}</h2>
          <div className="meta">{meta}</div>
        </div>
      </div>
      <CaptureBar />
    </>
  );
}
