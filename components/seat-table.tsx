"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/components/role-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  UserX,
  Users,
  Building2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import useSWR from "swr";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: "ACTIVE" | "INACTIVE";
  project: { name: string; code: string } | null;
  seat: {
    id: string;
    seatCode: string;
    floor: number;
    zone: string;
    status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  } | null;
}

interface SeatTableProps {
  filters?: {
    department?: string;
    status?: string;
    floor?: string;
    zone?: string;
    aiQuery?: string;
  };
  onSuccess?: () => void;
}

const PAGE_SIZE = 20;

const fetcher = async (url: string) => {
  if (url.includes("/api/ai")) {
    const { searchParams } = new URL(url, window.location.origin);
    const query = searchParams.get("query") || "";
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "AI query failed");
    }
    const json = await res.json();
    return json.data; // { filter, data, total }
  }
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch employees");
  }
  return res.json();
};

function buildUrl(page: number, filters: SeatTableProps["filters"]) {
  if (filters?.aiQuery) {
    const params = new URLSearchParams({
      query: filters.aiQuery,
    });
    return `/api/ai?${params}`;
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (filters?.department) params.set("department", filters.department);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.floor) params.set("floor", filters.floor);
  if (filters?.zone) params.set("zone", filters.zone);
  return `/api/employees?${params}`;
}

function SeatStatusBadge({ status }: { status: string }) {
  if (status === "OCCUPIED")
    return (
      <Badge variant="secondary" className="text-xs">
        Occupied
      </Badge>
    );
  if (status === "AVAILABLE")
    return (
      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50/50">
        Available
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50/50">
      Reserved
    </Badge>
  );
}

function EmployeeStatusBadge({ status }: { status: string }) {
  return status === "ACTIVE" ? (
    <Badge variant="outline" className="text-xs bg-gray-50/50">
      Active
    </Badge>
  ) : (
    <Badge variant="destructive" className="text-xs">
      Inactive
    </Badge>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function EmptyState({ title = "No employees found", desc = "Try adjusting your filters" }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="size-8 opacity-30" />
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs">{desc}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SeatTable({ filters, onSuccess }: SeatTableProps) {
  const { role } = useRole();
  const canEdit = role === "ADMIN" || role === "HR";

  const [page, setPage] = useState(1);

  // Assignment Modal State
  const [assigningEmp, setAssigningEmp] = useState<Employee | null>(null);
  const [suggestedSeat, setSuggestedSeat] = useState<any | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [isSubmitPending, setIsSubmitPending] = useState(false);
  const [modalError, setModalError] = useState("");

  // Available seats for selection
  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const url = buildUrl(page, filters);

  const { data, isLoading, error, mutate } = useSWR<any>(url, fetcher, {
    keepPreviousData: true,
  });

  // Fetch available seats for custom selection
  const fetchAvailableSeats = async () => {
    setLoadingSeats(true);
    try {
      const res = await fetch("/api/seats?status=AVAILABLE&limit=100");
      if (res.ok) {
        const json = await res.ok ? await res.json() : { data: [] };
        setAvailableSeats(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load available seats", err);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleStartAssign = async (emp: Employee) => {
    setAssigningEmp(emp);
    setModalError("");
    setSuggestedSeat(null);
    setSelectedSeatId("");
    setSuggestLoading(true);

    // Trigger available seats fetch
    fetchAvailableSeats();

    // Query suggestion endpoint
    try {
      const res = await fetch(`/api/seats/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest", employeeId: emp.id }),
      });
      if (res.ok) {
        const json = await res.json();
        setSuggestedSeat(json.data);
        if (json.data?.id) {
          setSelectedSeatId(json.data.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch seat recommendation", err);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningEmp || !selectedSeatId) return;

    setIsSubmitPending(true);
    setModalError("");

    try {
      const res = await fetch("/api/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: selectedSeatId,
          employeeId: assigningEmp.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to assign seat");
      }

      setAssigningEmp(null);
      mutate(); // Trigger list reload
      onSuccess?.(); // Trigger aggregation refresh
    } catch (err: any) {
      setModalError(err.message || "An error occurred during assignment.");
    } finally {
      setIsSubmitPending(false);
    }
  };

  const handleRelease = useCallback(
    async (emp: any) => {
      if (!emp.seat) return;
      if (!confirm(`Release seat ${emp.seat.seatCode} assigned to ${emp.name}?`)) return;

      try {
        const res = await fetch(`/api/seats/${emp.seat.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "release" }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to release seat");
        }

        mutate(); // Trigger list reload
        onSuccess?.(); // Trigger aggregation refresh
      } catch (err: any) {
        alert(err.message);
      }
    },
    [mutate, onSuccess]
  );

  const isAiQuery = !!filters?.aiQuery;

  // Normalize pagination and employee list
  let employees: any[] = [];
  let total = 0;
  let totalPages = 1;
  let aiEntity = "";

  if (isAiQuery) {
    const aiResult = data; // { filter, data, total }
    const rawData = aiResult?.data ?? [];
    total = aiResult?.total ?? 0;
    totalPages = Math.ceil(total / PAGE_SIZE);
    aiEntity = aiResult?.filter?.entity ?? "";

    if (aiEntity === "seat") {
      // Map seats to employee row structure
      employees = rawData.map((seat: any) => {
        if (seat.employee) {
          return {
            ...seat.employee,
            seat: {
              id: seat.id,
              seatCode: seat.seatCode,
              floor: seat.floor,
              zone: seat.zone,
              status: seat.status,
            },
          };
        } else {
          // Unoccupied seat
          return {
            id: seat.id,
            employeeCode: "—",
            name: "Available Seat",
            email: seat.seatCode,
            department: "—",
            designation: "—",
            status: "ACTIVE",
            project: null,
            seat: {
              id: seat.id,
              seatCode: seat.seatCode,
              floor: seat.floor,
              zone: seat.zone,
              status: seat.status,
            },
          };
        }
      });
    } else {
      employees = rawData;
    }
  } else {
    employees = data?.data ?? [];
    total = data?.pagination?.total ?? 0;
    totalPages = data?.pagination?.totalPages ?? 1;
  }

  return (
    <div className="space-y-3">
      {isAiQuery && data?.filter && (
        <div className="flex items-center gap-2 rounded-md border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-primary">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            AI applied filter: Primary <strong>{aiEntity}</strong> query for{" "}
            {Object.entries(data.filter.filters)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "all records"}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Employee / Description</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden md:table-cell">Seat Location</TableHead>
              <TableHead>Seat Status</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 8 : 7}
                  className="h-32 text-center text-sm text-destructive"
                >
                  Error processing query: {error.message}
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <EmptyState
                title={isAiQuery ? "No matches found by AI" : "No employees found"}
                desc={isAiQuery ? "Try rephrasing your search query" : "Try adjusting your filters"}
              />
            ) : (
              employees.map((emp) => {
                const isRealEmployee = emp.employeeCode !== "—";
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium leading-none">{emp.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {emp.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {emp.department}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {emp.project ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 className="size-3 text-muted-foreground" />
                          {emp.project.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {emp.seat ? (
                        <span>
                          {emp.seat.seatCode}
                          <span className="ml-1 text-muted-foreground">
                            F{emp.seat.floor}/{emp.seat.zone}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <UserX className="size-3" />
                          Unseated
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SeatStatusBadge status={emp.seat?.status ?? "AVAILABLE"} />
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        {isRealEmployee && (
                          emp.seat ? (
                            <Button
                              id={`release-seat-${emp.id}`}
                              variant="ghost"
                              size="xs"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRelease(emp)}
                            >
                              Release
                            </Button>
                          ) : (
                            <Button
                              id={`assign-seat-btn-${emp.id}`}
                              variant="outline"
                              size="xs"
                              className="text-primary border-primary/20 hover:bg-primary/5"
                              onClick={() => handleStartAssign(emp)}
                            >
                              Assign Seat
                            </Button>
                          )
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isAiQuery && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()} employees
          </span>
          <div className="flex items-center gap-1">
            <Button
              id="prev-page-btn"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft />
            </Button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              id="next-page-btn"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* Assign Seat Dialog */}
      <Dialog open={assigningEmp !== null} onOpenChange={(o) => !o && setAssigningEmp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Seat</DialogTitle>
            <DialogDescription>
              Choose a seat for <strong>{assigningEmp?.name}</strong> ({assigningEmp?.department}).
            </DialogDescription>
          </DialogHeader>

          {assigningEmp && (
            <div className="grid gap-4 py-2 text-sm">
              {/* Suggestion section */}
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <Sparkles className="size-4" />
                  AI Smart Suggestion
                </div>
                {suggestLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 className="size-3 animate-spin" />
                    Finding nearest seat to teammates...
                  </div>
                ) : suggestedSeat ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      Based on project team location, we recommend:
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-gray-800">
                        {suggestedSeat.seatCode} (Floor {suggestedSeat.floor}, Zone {suggestedSeat.zone})
                      </span>
                      <Button
                        id="use-suggestion-btn"
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedSeatId(suggestedSeat.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-1">
                    No teammate-clustering seat could be recommended.
                  </p>
                )}
              </div>

              {/* Select Seat field */}
              {/* Select Seat field */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seat-select">Select Seat manually</Label>
                {(() => {
                  const displaySeats = [...availableSeats];
                  if (suggestedSeat && !displaySeats.find((s) => s.id === suggestedSeat.id)) {
                    displaySeats.unshift(suggestedSeat);
                  }

                  return (
                    <Select
                      value={selectedSeatId || ""}
                      onValueChange={(val) => setSelectedSeatId(val ?? "")}
                    >
                      <SelectTrigger id="seat-select" className="w-full">
                        <SelectValue placeholder={loadingSeats ? "Loading seats..." : "Choose a seat…"}>
                          {(value: string) => {
                            const seat = displaySeats.find((s) => s.id === value);
                            return seat
                              ? `${seat.seatCode} (Floor ${seat.floor}, Zone ${seat.zone})`
                              : undefined;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {displaySeats.map((seat) => (
                          <SelectItem key={seat.id} value={seat.id}>
                            {seat.seatCode} (Floor {seat.floor}, Zone {seat.zone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              {modalError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {modalError}
                </p>
              )}
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button
              id="confirm-assign-btn"
              onClick={handleConfirmAssign}
              disabled={isSubmitPending || !selectedSeatId}
            >
              {isSubmitPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Assigning…
                </>
              ) : (
                "Assign Seat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
