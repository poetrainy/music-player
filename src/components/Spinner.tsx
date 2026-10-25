import { LoaderCircle } from "lucide-react";

export function Spinner() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex w-full items-center justify-center py-12"
    >
      <LoaderCircle className="text-muted size-8 animate-spin" />
    </div>
  );
}
