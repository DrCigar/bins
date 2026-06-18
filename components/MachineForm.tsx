"use client";
import { MODELS, ROLES, STATUSES, Model, Role, Status } from "@/lib/domain/types";

export interface MachineFormValue {
  serial: string;
  model: Model;
  role: Role;
  status: Status;
  notes: string;
}

const field =
  "bg-pos-surface2 border border-pos-line rounded-md px-3 py-2 text-sm w-full mt-1 text-white";

export function MachineForm({
  value, onChange, lockSerial = false,
}: {
  value: MachineFormValue;
  onChange: (v: MachineFormValue) => void;
  lockSerial?: boolean;
}) {
  const set = (patch: Partial<MachineFormValue>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs text-neutral-400">
        Serial
        <input
          className={field}
          value={value.serial}
          disabled={lockSerial}
          onChange={(e) => set({ serial: e.target.value })}
          placeholder="S36250423001"
        />
      </label>
      <label className="text-xs text-neutral-400">
        Model
        <select className={field} value={value.model} onChange={(e) => set({ model: e.target.value as Model })}>
          {MODELS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Role
        <select className={field} value={value.role} onChange={(e) => set({ role: e.target.value as Role })}>
          {ROLES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Status
        <select className={field} value={value.status} onChange={(e) => set({ status: e.target.value as Status })}>
          {STATUSES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Notes
        <textarea className={field} rows={2} value={value.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
    </div>
  );
}
