"use client";

import { useRef } from "react";
import { capture } from "@/app/actions";

/**
 * Capture is meant to cost nothing, so the box empties on submit rather than
 * a page render later. The FormData is already built by the time reset runs,
 * so clearing early loses nothing — and waiting for the round trip is what
 * made the cheapest action in the app feel like the slowest.
 */
export function CaptureBar() {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      className="capture"
      action={async (formData: FormData) => {
        form.current?.reset();
        await capture(formData);
      }}
    >
      <input
        name="text"
        type="text"
        autoComplete="off"
        placeholder="Capture anything — it lands in the inbox, unsorted, no decisions required"
      />
      <button className="btn pri" type="submit">
        Capture
      </button>
    </form>
  );
}
