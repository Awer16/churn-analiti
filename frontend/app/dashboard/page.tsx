import { DashboardClient } from "@/components/dashboard-client";
import { Nav } from "@/components/nav";

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main className="page-shell dashboard-layout">
        <div className="dashboard-grid">
          <DashboardClient />
        </div>
      </main>
    </>
  );
}
