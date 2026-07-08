"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/components/role-provider";
import { UserPlus, Loader2 } from "lucide-react";

// Keep in sync with lib/validations/employee.schema.ts
interface FormState {
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  projectId: string;
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

const EMPTY_FORM: FormState = {
  employeeCode: "",
  name: "",
  email: "",
  department: "",
  designation: "",
  projectId: "",
};

interface FieldError {
  [key: string]: string[];
}

interface NewJoinerFormProps {
  onSuccess?: () => void;
}

function FieldGroup({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function NewJoinerForm({ onSuccess }: NewJoinerFormProps) {
  const { role } = useRole();
  const canCreate = role === "ADMIN" || role === "HR";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  if (!canCreate) return null;

  const set = (key: keyof FormState) => (value: string | null) =>
    setForm((prev) => ({ ...prev, [key]: value ?? "" }));

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setServerError("");
    }
    setOpen(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side required field check
    const errors: FieldError = {};
    if (!form.employeeCode) errors.employeeCode = ["Required"];
    if (!form.name) errors.name = ["Required"];
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = ["Valid email required"];
    if (!form.department) errors.department = ["Required"];
    if (!form.designation) errors.designation = ["Required"];
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setServerError("");

    startTransition(async () => {
      try {
        const body: Record<string, string> = {
          employeeCode: form.employeeCode,
          name: form.name,
          email: form.email,
          department: form.department,
          designation: form.designation,
        };
        if (form.projectId) body.projectId = form.projectId;

        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json();
          if (err?.details?.fieldErrors) {
            setFieldErrors(err.details.fieldErrors);
          } else {
            setServerError(err?.error ?? "Failed to create employee.");
          }
          return;
        }

        setOpen(false);
        setForm(EMPTY_FORM);
        onSuccess?.();
      } catch {
        setServerError("Network error. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger
        render={
          <Button id="new-joiner-trigger" variant="default" size="sm" />
        }
      >
        <UserPlus />
        New Joiner
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Joiner</DialogTitle>
          <DialogDescription>
            Create an employee record. Seat assignment can be done separately
            after creation.
          </DialogDescription>
        </DialogHeader>

        <form id="new-joiner-form" onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Row 1: Code + Name */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              id="employeeCode"
              label="Employee Code"
              error={fieldErrors.employeeCode?.[0]}
            >
              <Input
                id="employeeCode"
                placeholder="EMP-001"
                value={form.employeeCode}
                onChange={(e) => set("employeeCode")(e.target.value)}
                autoComplete="off"
              />
            </FieldGroup>
            <FieldGroup
              id="name"
              label="Full Name"
              error={fieldErrors.name?.[0]}
            >
              <Input
                id="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </FieldGroup>
          </div>

          {/* Email */}
          <FieldGroup
            id="email"
            label="Work Email"
            error={fieldErrors.email?.[0]}
          >
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              autoComplete="off"
            />
          </FieldGroup>

          {/* Row 2: Department + Designation */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              id="department"
              label="Department"
              error={fieldErrors.department?.[0]}
            >
              <Select
                value={form.department ?? ""}
                onValueChange={set("department")}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              id="designation"
              label="Designation"
              error={fieldErrors.designation?.[0]}
            >
              <Input
                id="designation"
                placeholder="Software Engineer"
                value={form.designation}
                onChange={(e) => set("designation")(e.target.value)}
              />
            </FieldGroup>
          </div>

          {/* Server error */}
          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {serverError}
            </p>
          )}
        </form>

        <DialogFooter showCloseButton>
          <Button
            id="new-joiner-submit"
            type="submit"
            form="new-joiner-form"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create Employee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
