"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        accent ? "border-primary/20 bg-primary/5" : "bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

const FLOOR_COLORS = {
  occupied: "hsl(220 13% 25%)",
  available: "hsl(220 13% 78%)",
  reserved: "hsl(38 92% 60%)",
  maintenance: "hsl(0 84% 60%)",
};

export function UtilizationChart() {
  const { data: summaryRes, isLoading: summaryLoading } = useSWR(
    "/api/dashboard/summary",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const { data: floorRes, isLoading: floorLoading } = useSWR(
    "/api/dashboard/floor-utilization",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const { data: projectRes, isLoading: projectLoading } = useSWR(
    "/api/dashboard/project-utilization",
    fetcher,
    { refreshInterval: 60_000 }
  );

  if (summaryLoading || floorLoading || projectLoading) {
    return (
      <div className="space-y-4">
        <SkeletonStats />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-52 w-full" />
          </div>
          <div className="rounded-lg border p-4">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-52 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const summary = summaryRes?.data;
  const floorData = floorRes?.data ? [...floorRes.data].sort((a: any, b: any) => a.floor - b.floor) : [];
  const projectData = projectRes?.data || [];

  if (!summary) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Analytics unavailable — API not yet connected.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats - exactly matching spec */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Employees" value={summary.totalEmployees?.toLocaleString() || 0} />
        <StatCard label="Total Seats" value={summary.totalSeats?.toLocaleString() || 0} />
        <StatCard label="Occupied Seats" value={summary.occupiedSeats?.toLocaleString() || 0} accent />
        <StatCard label="Available Seats" value={summary.availableSeats?.toLocaleString() || 0} />
        <StatCard label="Reserved Seats" value={summary.reservedSeats?.toLocaleString() || 0} />
        <StatCard
          label="Pending Allocation"
          value={summary.pendingAllocation?.toLocaleString() || 0}
          sub="New joiners"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Floor utilization chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-sm font-medium">
                Floor-wise Occupancy
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: FLOOR_COLORS.occupied }}
                  />
                  Occupied
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: FLOOR_COLORS.available }}
                  />
                  Available
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: FLOOR_COLORS.reserved }}
                  />
                  Reserved
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: FLOOR_COLORS.maintenance }}
                  />
                  Maintenance
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={floorData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(0 0% 90%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="floor"
                  tickFormatter={(v) => `F${v}`}
                  tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(0 0% 90%)",
                    fontSize: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                  }}
                  formatter={(value: any, name: any) => [
                    Number(value).toLocaleString(),
                    String(name).charAt(0).toUpperCase() + String(name).slice(1),
                  ]}
                  labelFormatter={(label) => `Floor ${label}`}
                />
                <Bar dataKey="occupied" stackId="a" fill={FLOOR_COLORS.occupied} />
                <Bar dataKey="available" stackId="a" fill={FLOOR_COLORS.available} />
                <Bar dataKey="reserved" stackId="a" fill={FLOOR_COLORS.reserved} />
                <Bar dataKey="maintenance" stackId="a" fill={FLOOR_COLORS.maintenance} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project utilization table */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Project-wise Seat Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pt-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Project</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Employees</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Seats Allocated</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {projectData.map((p: any) => (
                    <tr key={p.projectId} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-2 align-middle font-medium">{p.projectName}</td>
                      <td className="p-2 align-middle text-right">{p.employeeCount}</td>
                      <td className="p-2 align-middle text-right">{p.seatCount}</td>
                    </tr>
                  ))}
                  {projectData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="h-24 text-center align-middle text-muted-foreground">
                        No projects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
