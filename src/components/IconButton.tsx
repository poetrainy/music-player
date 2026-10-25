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
        "hover:bg-contrast/10 active:bg-contrast/15 flex size-9 shrink-0 items-center justify-center rounded transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}
