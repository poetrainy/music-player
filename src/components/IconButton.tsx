import { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/library";

interface Props extends ComponentPropsWithoutRef<"button"> {
  children: ReactNode;
}

export function IconButton({ children, className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/10 active:bg-white/15",
        className,
      )}
    >
      {children}
    </button>
  );
}
