"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Filters {
  department: string;
  status: string;
  floor: string;
  zone: string;
  aiQuery: string;
}

interface SearchFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  isAiLoading?: boolean;
}

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Legal",
  "Data Science",
];

const FLOORS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const ZONES = ["A", "B", "C", "D", "E", "F"];

const hasActiveFilters = (f: Filters) =>
  f.department !== "" ||
  f.status !== "" ||
  f.floor !== "" ||
  f.zone !== "" ||
  f.aiQuery !== "";

export function SearchFilters({
  filters,
  onFilterChange,
  onClear,
  isAiLoading = false,
}: SearchFiltersProps) {
  return (
    <div className="space-y-3">
      {/* AI / text search row */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ai-search-input"
            type="text"
            placeholder='Try "Engineers on floor 3" or "Unassigned seats in zone B"…'
            value={filters.aiQuery}
            onChange={(e) => onFilterChange("aiQuery", e.target.value)}
            className="pl-8 pr-4"
          />
          {isAiLoading && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
              Searching…
            </span>
          )}
        </div>
        {hasActiveFilters(filters) && (
          <Button
            id="clear-filters-btn"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="shrink-0"
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Structured filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Department */}
        <Select
          value={filters.department ?? ""}
          onValueChange={(v) => onFilterChange("department", v ?? "")}
        >
          <SelectTrigger
            id="filter-department"
            className="w-[160px]"
            size="sm"
          >
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status ?? ""}
          onValueChange={(v) => onFilterChange("status", v ?? "")}
        >
          <SelectTrigger id="filter-status" className="w-[130px]" size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="AVAILABLE">Available seat</SelectItem>
            <SelectItem value="OCCUPIED">Occupied seat</SelectItem>
            <SelectItem value="RESERVED">Reserved seat</SelectItem>
          </SelectContent>
        </Select>

        {/* Floor */}
        <Select
          value={filters.floor ?? ""}
          onValueChange={(v) => onFilterChange("floor", v ?? "")}
        >
          <SelectTrigger id="filter-floor" className="w-[110px]" size="sm">
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            {FLOORS.map((f) => (
              <SelectItem key={f} value={f}>
                Floor {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Zone */}
        <Select
          value={filters.zone ?? ""}
          onValueChange={(v) => onFilterChange("zone", v ?? "")}
        >
          <SelectTrigger id="filter-zone" className="w-[110px]" size="sm">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            {ZONES.map((z) => (
              <SelectItem key={z} value={z}>
                Zone {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
