import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneFrame({ children, title, className }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <div className={cn("mx-auto flex h-full max-h-[820px] w-full max-w-[400px] flex-col overflow-hidden rounded-[2.2rem] border-8 border-ink bg-surface shadow-2xl", className)}>
      <div className="flex items-center justify-between bg-ink px-5 py-2 text-[10px] font-medium text-white/80">
        <span>9:41</span>
        <span className="font-semibold tracking-wide">{title ?? "KARGO"}</span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-white/80" />
          <span className="inline-block size-1.5 rounded-full bg-white/80" />
          <span className="inline-block size-1.5 rounded-full bg-white/80" />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
