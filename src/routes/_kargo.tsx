import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { MasterBar } from "@/components/kargo/MasterBar";
import { useKargo } from "@/lib/kargo/store";

export const Route = createFileRoute("/_kargo")({
  component: KargoLayout,
});

function KargoLayout() {
  const startTick = useKargo((s) => s.startTick);
  useEffect(() => {
    startTick();
  }, [startTick]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <MasterBar />
      {/* Each route page handles its own sidebar + content layout */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}