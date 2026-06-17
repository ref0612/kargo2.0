import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/** Stylized animated route map. Live = pulsing dot moves along path. */
export function GpsMap({
  origen,
  destino,
  progreso,
  velocidad,
  className,
}: {
  origen: string;
  destino: string;
  progreso: number;
  velocidad?: number;
  className?: string;
}) {
  // smooth client-side interpolation between progreso updates
  const [shown, setShown] = useState(progreso);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(progreso));
    return () => cancelAnimationFrame(id);
  }, [progreso]);

  const x = 40 + (shown / 100) * 320;

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-gradient-to-br from-info/5 via-surface to-primary/5", className)}>
      {/* grid */}
      <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <svg viewBox="0 0 400 180" className="relative h-full w-full">
        {/* highway path */}
        <path
          d="M 40 130 Q 140 60, 220 110 T 380 80"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray="4 6"
          className="text-muted-foreground/50"
        />
        {/* completed path */}
        <path
          d="M 40 130 Q 140 60, 220 110 T 380 80"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${(shown / 100) * 600} 600`}
          className="text-primary transition-[stroke-dasharray] duration-700 ease-out"
        />
        {/* origin */}
        <g transform="translate(40,130)">
          <circle r="6" className="fill-success" />
          <circle r="11" className="fill-success/20" />
        </g>
        {/* destination */}
        <g transform="translate(380,80)">
          <circle r="6" className="fill-destructive" />
          <circle r="11" className="fill-destructive/20" />
        </g>
        {/* moving bus dot */}
        <g style={{ transform: `translate(${x}px, ${130 - (shown / 100) * 60}px)`, transition: "transform 700ms ease-out" }}>
          <circle r="14" className="fill-primary/30 animate-ping" />
          <circle r="8" className="fill-primary" />
          <Navigation size={10} className="text-primary-foreground" x={-5} y={-5} />
        </g>
      </svg>

      {/* labels */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-xs">
        <div className="flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 shadow-sm backdrop-blur">
          <MapPin size={12} className="text-success" />
          <span className="font-medium">{origen}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 shadow-sm backdrop-blur">
          <span className="font-medium">{destino}</span>
          <MapPin size={12} className="text-destructive" />
        </div>
      </div>

      {/* live chip */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        EN VIVO {velocidad ? `· ${velocidad} km/h` : ""}
      </div>
    </div>
  );
}
