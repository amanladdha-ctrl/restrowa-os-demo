"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  className?: string;
  label: string;
  pendingLabel?: string;
};

export function PendingSubmitButton({
  className,
  label,
  pendingLabel
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel ?? "Please wait..." : label}
    </button>
  );
}
