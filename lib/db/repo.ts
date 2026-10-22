import { eq, sql } from "drizzle-orm";
import { machines, serializationEvents, manualCounts, MachineRow, SerializationEventRow, ManualCountRow } from "./schema";
import { Machine, Model, Role, Status, ProductLine, SerializationEvent, ActivityKind, OUT, isOpenArea } from "@/lib/domain/types";
import { prefixFor, buildSerial, incrementSerial } from "@/lib/domain/serial";
import { rackCapacity, areaCapacity } from "@/lib/layout/warehouse";

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

// Delete a machine. Its build-activity event is intentionally KEPT — the Activity log is a
// permanent, append-only record of everything ever serialized, even units later removed.
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

// Empty an area: delete every machine in `location`. Build-activity events are KEPT — the
// Activity log stays a permanent record of what was serialized, even after an area is cleared.
export async function clearLocation(db: AnyDb, location: string): Promise<number> {
  const here = (await list(db)).filter((m) => m.location === location);
  if (here.length === 0) return 0;
  await db.delete(machines).where(eq(machines.location, location));
  return here.length;
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
  // Where the batch lands — a rack label (A, HH, …) or an open area (Inbound/Pre-Deployment/Outbound).
  destination: string;
  // Pre-printed labels: use this literal starting serial and increment its trailing
  // number per unit, instead of the prefix+date+counter scheme.
  customStart?: string;
}

// Generate `quantity` sequential serials and place the units into the chosen destination,
// filling its open slots in order. Caps at the destination's available room.
export async function serializeBatch(db: AnyDb, args: SerializeArgs, quantity: number): Promise<Machine[]> {
  const existing = await list(db);
  const dest = args.destination;
  const open: Array<{ location: string; slot: number | null }> = [];
  if (isOpenArea(dest)) {
    const cap = areaCapacity(dest); // null = unlimited
    const current = existing.filter((m) => m.location === dest).length;
    const room = cap === null ? quantity : Math.max(0, cap - current);
    for (let i = 0; i < room; i++) open.push({ location: dest, slot: null });
  } else {
    const taken = new Set(existing.filter((m) => m.location === dest).map((m) => m.slot));
    for (let s = 1; s <= rackCapacity(dest); s++) if (!taken.has(s)) open.push({ location: dest, slot: s });
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
      kind: "serialized" as const,
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
  kind: (r.kind as ActivityKind) ?? "serialized",
  productLine: (r.productLine as ProductLine) ?? null,
  role: r.role as Role,
  model: r.model as Model,
});

// Append one activity event (permanent, append-only). Used for check-ins (kind "added").
export async function logActivity(
  db: AnyDb,
  e: { kind: ActivityKind; serial: string | null; productLine: ProductLine | null; role: Role; model: Model; assembledBy: string | null },
): Promise<void> {
  await db.insert(serializationEvents).values({
    kind: e.kind, serial: e.serial, productLine: e.productLine,
    role: e.role, model: e.model, assembledBy: e.assembledBy,
  });
}

export async function listSerializationEvents(db: AnyDb): Promise<SerializationEvent[]> {
  const rows = await db.select().from(serializationEvents);
  return rows.map(toEvent);
}

export async function listManualCounts(db: AnyDb): Promise<ManualCountRow[]> {
  return db.select().from(manualCounts);
}

// Upsert a manual off-site count for a (location, model).
export async function setManualCount(
  db: AnyDb,
  location: string,
  model: string,
  primaryCount: number,
  secondaryCount: number,
): Promise<void> {
  await db
    .insert(manualCounts)
    .values({ location, model, primaryCount, secondaryCount })
    .onConflictDoUpdate({
      target: [manualCounts.location, manualCounts.model],
      set: { primaryCount, secondaryCount },
    });
}
