import { eq, sql } from "drizzle-orm";
import { machines, serializationEvents, MachineRow, SerializationEventRow } from "./schema";
import { Machine, Model, Role, Status, ProductLine, SerializationEvent, OUT, isOpenArea } from "@/lib/domain/types";
import { prefixFor, buildSerial, incrementSerial } from "@/lib/domain/serial";
import { STAGING_RACKS, rackCapacity } from "@/lib/layout/warehouse";

// Accepts either the Neon-backed or PGlite-backed Drizzle instance.
type AnyDb = any;

const toMachine = (r: MachineRow): Machine => ({
  ...r,
  model: r.model as Model,
  role: r.role as Role,
  status: r.status as Status,
  productLine: (r.productLine as ProductLine) ?? null,
});

export interface CheckInArgs {
  serial: string | null;
  model: Model;
  role: Role;
  status: Status;
  productLine: ProductLine | null;
  assembledBy: string | null;
  notes: string | null;
  location: string;
  slot: number | null;
}

export async function checkIn(db: AnyDb, args: CheckInArgs): Promise<Machine> {
  const [row] = await db.insert(machines).values(args).returning();
  return toMachine(row);
}

export async function list(db: AnyDb): Promise<Machine[]> {
  const rows = await db.select().from(machines);
  return rows.map(toMachine);
}

export async function findBySerial(db: AnyDb, serial: string): Promise<Machine | null> {
  const rows = await db.select().from(machines).where(eq(machines.serial, serial));
  return rows[0] ? toMachine(rows[0]) : null;
}

async function patch(db: AnyDb, id: number, values: Partial<MachineRow>): Promise<Machine> {
  const [row] = await db
    .update(machines)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(machines.id, id))
    .returning();
  return toMachine(row);
}

export const move = (db: AnyDb, id: number, to: { location: string; slot: number | null }) =>
  patch(db, id, { location: to.location, slot: to.slot });

export const update = (
  db: AnyDb,
  id: number,
  fields: Partial<Pick<MachineRow, "serial" | "model" | "role" | "status" | "productLine" | "assembledBy" | "notes">>,
) => patch(db, id, fields);

export const remove = async (db: AnyDb, id: number): Promise<void> => {
  await db.delete(machines).where(eq(machines.id, id));
};

export const checkOutToStore = (db: AnyDb, id: number, destination: string) =>
  patch(db, id, { location: OUT, slot: null, destination, checkedOutAt: new Date() });

// Stage into an open area (Inbound / Pre-Deployment / Outbound); clears any prior store checkout.
export const stageInArea = (db: AnyDb, id: number, area: string) =>
  patch(db, id, { location: area, slot: null, destination: null, checkedOutAt: null });

// Move several machines to a destination. Racks get the first open slots in order;
// open areas take all (slot null). Returns the ids actually moved (capped by rack space).
export async function moveMany(db: AnyDb, ids: number[], location: string): Promise<number[]> {
  if (ids.length === 0) return [];
  const all = await list(db);
  const moving = all.filter((m) => ids.includes(m.id));
  const isArea = isOpenArea(location);

  let targets: Array<{ id: number; slot: number | null }>;
  if (isArea) {
    targets = moving.map((m) => ({ id: m.id, slot: null }));
  } else {
    const taken = new Set(
      all.filter((m) => m.location === location && !ids.includes(m.id)).map((m) => m.slot),
    );
    const openSlots: number[] = [];
    for (let s = 1; s <= rackCapacity(location); s++) if (!taken.has(s)) openSlots.push(s);
    targets = moving.slice(0, openSlots.length).map((m, i) => ({ id: m.id, slot: openSlots[i] }));
  }

  for (const t of targets) {
    await patch(db, t.id, { location, slot: t.slot, destination: null, checkedOutAt: null });
  }
  return targets.map((t) => t.id);
}

// Atomic per-key counter; returns the new high-water mark after adding `count`.
export async function allocateSequence(db: AnyDb, key: string, count: number): Promise<number> {
  const res = await db.execute(sql`
    INSERT INTO serial_counters (key, n) VALUES (${key}, ${count})
    ON CONFLICT (key) DO UPDATE SET n = serial_counters.n + ${count}
    RETURNING n
  `);
  const rows = (res as { rows?: Array<{ n: number }> }).rows ?? (res as Array<{ n: number }>);
  return Number(rows[0].n);
}

export interface SerializeArgs {
  productLine: ProductLine;
  role: Role;
  model: Model;
  status: Status;
  assembledBy: string | null;
  notes: string | null;
  date: Date;
  // Pre-printed labels: use this literal starting serial and increment its trailing
  // number per unit, instead of the prefix+date+counter scheme.
  customStart?: string;
}

// Generate `quantity` sequential serials and place the units into staging racks (in order).
// Caps at the number of open staging slots.
export async function serializeBatch(db: AnyDb, args: SerializeArgs, quantity: number): Promise<Machine[]> {
  const existing = await list(db);
  const open: Array<{ location: string; slot: number }> = [];
  for (const rack of STAGING_RACKS) {
    const taken = new Set(existing.filter((m) => m.location === rack).map((m) => m.slot));
    for (let s = 1; s <= rackCapacity(rack); s++) if (!taken.has(s)) open.push({ location: rack, slot: s });
  }
  const n = Math.min(quantity, open.length);
  if (n === 0) return [];

  let serialFor: (i: number) => string;
  if (args.customStart) {
    const serials = Array.from({ length: n }, (_, i) => incrementSerial(args.customStart!, i));
    if (serials.some((x) => x === null)) throw new Error("Starting serial must end in a number.");
    const wanted = serials as string[];
    // Fail up front (naming conflicts) rather than half-inserting into the unique column.
    const taken = new Set(existing.map((m) => m.serial).filter(Boolean) as string[]);
    const conflicts = wanted.filter((x) => taken.has(x));
    if (conflicts.length > 0) throw new Error(`Already in the system: ${conflicts.join(", ")}`);
    serialFor = (i) => wanted[i];
  } else {
    const prefix = prefixFor(args.productLine, args.role);
    const dateKey = buildSerial(prefix, args.date, 0).slice(prefix.length, prefix.length + 6); // YYMMDD
    const high = await allocateSequence(db, `${prefix}${dateKey}`, n);
    const startSeq = high - n + 1;
    serialFor = (i) => buildSerial(prefix, args.date, startSeq + i);
  }

  const values = Array.from({ length: n }, (_, i) => ({
    serial: serialFor(i),
    model: args.model,
    role: args.role,
    status: args.status,
    productLine: args.productLine,
    assembledBy: args.assembledBy,
    notes: args.notes,
    location: open[i].location,
    slot: open[i].slot,
  }));
  const inserted = await db.insert(machines).values(values).returning();

  // Append-only build-activity log (one event per serialized unit).
  await db.insert(serializationEvents).values(
    inserted.map((r: MachineRow) => ({
      serial: r.serial as string,
      productLine: args.productLine,
      role: args.role,
      model: args.model,
      assembledBy: args.assembledBy,
    })),
  );

  return inserted.map(toMachine);
}

const toEvent = (r: SerializationEventRow): SerializationEvent => ({
  ...r,
  productLine: (r.productLine as ProductLine) ?? null,
  role: r.role as Role,
  model: r.model as Model,
});

export async function listSerializationEvents(db: AnyDb): Promise<SerializationEvent[]> {
  const rows = await db.select().from(serializationEvents);
  return rows.map(toEvent);
}
