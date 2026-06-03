import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-full border border-white/10 bg-zinc-950/70 px-5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
