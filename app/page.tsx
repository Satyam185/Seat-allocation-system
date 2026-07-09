"use client";

import { useState, useCallback } from "react";
import { SearchFilters, type Filters } from "@/components/search-filters";
import { SeatTable } from "@/components/seat-table";
import { UtilizationChart } from "@/components/utilization-chart";
import { NewJoinerForm } from "@/components/new-joiner-form";
import { useRole } from "@/components/role-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCw } from "lucide-react";

const EMPTY_FILTERS: Filters = {
  department: "",
  status: "",
  floor: "",
  zone: "",
  aiQuery: "",
};

export default function DashboardPage() {
  const { role } = useRole();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [tableKey, setTableKey] = useState(0); // bump to force SWR refetch

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const handleReleaseSeat = useCallback(
    async (employeeId: string, seatId: string) => {
      await fetch(`/api/seats/${seatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", employeeId }),
      });
      setTableKey((k) => k + 1);
    },
    []
  );

  const handleNewJoinerSuccess = useCallback(
    () => setTableKey((k) => k + 1),
    []
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-base font-semibold leading-none">
              Seat Allocation
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage seats, employees and project mapping
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {role.replace("_", " ")}
          </Badge>
          <Button
            id="refresh-btn"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTableKey((k) => k + 1)}
            title="Refresh table"
          >
            <RefreshCw className="size-3.5" />
          </Button>
          <NewJoinerForm onSuccess={handleNewJoinerSuccess} />
        </div>
      </div>

      {/* Utilization chart */}
      <section aria-label="Seat utilization">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Utilization Overview
        </h2>
        <UtilizationChart />
      </section>

      {/* Search & filters */}
      <section aria-label="Search and filter">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Search &amp; Filter
        </h2>
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </section>

      {/* Employee / seat table */}
      <section aria-label="Employees and seats">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Employees &amp; Seats
        </h2>
        <SeatTable
          key={tableKey}
          filters={filters}
          onSuccess={handleNewJoinerSuccess}
        />
      </section>
    </div>
  );
}