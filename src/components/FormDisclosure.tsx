"use client";

import { useState, type ReactNode } from "react";

/**
 * A disclosure whose form closes it once the write lands.
 *
 * `<details>` keeps `open` in the DOM, and a server action only re-renders the
 * tree — it never unmounts the element — so every editor in the app stayed
 * open after saving, with stale-looking fields still on screen. Owning the
 * open state here is what lets the submit close it.
 *
 * The close runs in a `finally` because actions that `redirect()` unwind
 * through this function rather than returning; without it, exactly the forms
 * that navigate would be the ones left hanging open.
 */
export function FormDisclosure({
  label,
  action,
  children,
  defaultOpen = false,
  className,
  style,
  summaryAriaLabel,
  summaryClassName = "btn sm gh",
  formClassName,
  formStyle,
}: {
  label: ReactNode;
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Distinguishes one of many identically-labelled disclosures for a reader. */
  summaryAriaLabel?: string;
  summaryClassName?: string;
  formClassName?: string;
  formStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={className}
      style={style}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className={summaryClassName} aria-label={summaryAriaLabel}>
        {label}
      </summary>
      <form
        className={formClassName}
        style={formStyle}
        action={async (formData: FormData) => {
          try {
            await action(formData);
          } finally {
            setOpen(false);
          }
        }}
      >
        {children}
      </form>
    </details>
  );
}
