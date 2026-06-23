"use client";
import {
  MODELS, ROLES, STATUSES, PRODUCT_LINES, ASSEMBLERS,
  Model, Role, Status, ProductLine,
} from "@/lib/domain/types";

export interface MachineFormValue {
  serial: string;
  productLine: ProductLine;
  role: Role;
  model: Model;
  status: Status;
  assembledBy: string;
  notes: string;
}

export const emptyMachineForm: MachineFormValue = {
  serial: "", productLine: "360 Pro", role: "Primary", model: "Matsuda",
  status: "New", assembledBy: "", notes: "",
};

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
        Serial <span className="text-neutral-600">(optional — slot blinks until added)</span>
        <input
          className={field}
          value={value.serial}
          disabled={lockSerial}
          onChange={(e) => set({ serial: e.target.value })}
          placeholder="S36250423001"
        />
      </label>
      <label className="text-xs text-neutral-400">
        Product line
        <select className={field} value={value.productLine} onChange={(e) => set({ productLine: e.target.value as ProductLine })}>
          {PRODUCT_LINES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Role
        <select className={field} value={value.role} onChange={(e) => set({ role: e.target.value as Role })}>
          {ROLES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Model <span className="text-neutral-600">(internal)</span>
        <select className={field} value={value.model} onChange={(e) => set({ model: e.target.value as Model })}>
          {MODELS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Status
        <select className={field} value={value.status} onChange={(e) => set({ status: e.target.value as Status })}>
          {STATUSES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-neutral-400">
        Assembled by
        <select
          className={field}
          value={(ASSEMBLERS as readonly string[]).includes(value.assembledBy) ? value.assembledBy : (value.assembledBy ? "Other" : "")}
          onChange={(e) => set({ assembledBy: e.target.value === "Other" ? " " : e.target.value })}
        >
          <option value="">— None —</option>
          {ASSEMBLERS.map((x) => <option key={x}>{x}</option>)}
          <option value="Other">Other…</option>
        </select>
        {value.assembledBy !== "" && !(ASSEMBLERS as readonly string[]).includes(value.assembledBy) && (
          <input
            className={field}
            value={value.assembledBy.trim()}
            placeholder="Enter name"
            onChange={(e) => set({ assembledBy: e.target.value })}
          />
        )}
      </label>
      <label className="text-xs text-neutral-400">
        Notes
        <textarea className={field} rows={2} value={value.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
    </div>
  );
}
