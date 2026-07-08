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

interface AnalyticsData {
  summary: {
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    reservedSeats: number;
    utilizationPct: number;
    totalEmployees: number;
    seatedEmployees: number;
    unseatedEmployees: number;
  };
  byFloor: Array<{
    floor: number;
    occupied: number;
    available: number;
    reserved: number;
    total: number;
  }>;
  byDepartment: Array<{
    department: string;
    employees: number;
    seated: number;
  }>;
}

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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
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
};

export function UtilizationChart() {
  const { data: raw, isLoading, error } = useSWR<{ data: AnalyticsData }>(
    "/api/analytics",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const analytics = raw?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonStats />
        <div className="rounded-lg border p-4">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Analytics unavailable — API not yet connected.
      </div>
    );
  }

  const { summary, byFloor } = analytics;

  // Show top 10 floors by total
  const floorData = byFloor
    .sort((a, b) => a.floor - b.floor)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Utilization"
          value={`${summary.utilizationPct.toFixed(1)}%`}
          sub={`${summary.occupiedSeats.toLocaleString()} / ${summary.totalSeats.toLocaleString()} seats`}
          accent
        />
        <StatCard
          label="Available"
          value={summary.availableSeats.toLocaleString()}
          sub="seats open"
        />
        <StatCard
          label="Employees"
          value={summary.totalEmployees.toLocaleString()}
          sub={`${summary.unseatedEmployees} unseated`}
        />
        <StatCard
          label="Reserved"
          value={summary.reservedSeats.toLocaleString()}
          sub="seats reserved"
        />
      </div>

      {/* Floor utilization chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Seat Status by Floor
            </CardTitle>
            <div className="flex items-center gap-3">
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={floorData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
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
              <Bar dataKey="occupied" stackId="a" fill={FLOOR_COLORS.occupied} radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" stackId="a" fill={FLOOR_COLORS.available} radius={[0, 0, 0, 0]} />
              <Bar dataKey="reserved" stackId="a" fill={FLOOR_COLORS.reserved} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
