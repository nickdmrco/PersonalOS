"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that goes dead while its own form is in flight.
 *
 * Every form here posts to a server action and then waits on the write plus a
 * revalidation — long enough to click twice without meaning to, and a second
 * click on a create form inserts the row a second time. useFormStatus reads
 * the state of the nearest enclosing form, so this must stay a *child* of the
 * form it guards; a button beside the form would always read as idle.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shown in place of the label while the form is submitting. */
  pendingLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button {...rest} type="submit" disabled={disabled || pending}>
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
