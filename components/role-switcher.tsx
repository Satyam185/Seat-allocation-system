"use client";

import { useRole, Role } from "./role-provider";

const ROLES: Role[] = ["ADMIN", "HR", "EMPLOYEE", "PROJECT_LEAD"];

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-select" className="text-sm text-gray-600">
        Viewing as:
      </label>
      <select
        id="role-select"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}