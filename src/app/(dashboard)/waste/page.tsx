import Link from "next/link";
import { getWasteLogs } from "@/actions/waste";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/empty-state";
import WasteTable from "@/components/waste/waste-table";

export default async function WastePage() {
  const logs = await getWasteLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Log"
        description="Track and analyze food waste"
      >
        <Button asChild>
          <Link href="/waste/new">
            <Plus className="mr-2 h-4 w-4" />
            Log Waste
          </Link>
        </Button>
      </PageHeader>

      {logs.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-12 w-12" />}
          title="No waste logged"
          description="Start logging waste to track and reduce food loss."
        >
          <Button asChild>
            <Link href="/waste/new">Log Waste</Link>
          </Button>
        </EmptyState>
      ) : (
        <WasteTable logs={logs} />
      )}
    </div>
  );
}
