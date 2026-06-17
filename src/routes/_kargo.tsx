import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MasterBar } from "@/components/kargo/MasterBar";

export const Route = createFileRoute("/_kargo")({
  component: KargoLayout,
});

function KargoLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MasterBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
