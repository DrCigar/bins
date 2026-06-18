import { eq } from "drizzle-orm";
import { machines, MachineRow } from "./schema";
import { Machine, Model, Role, Status, OUT, PRE_DEPLOYMENT } from "@/lib/domain/types";

// Accepts either the Neon-backed or PGlite-backed Drizzle instance.
type AnyDb = any;

const toMachine = (r: MachineRow): Machine => ({
  ...r,
  model: r.model as Model,
  role: r.role as Role,
  status: r.status as Status,
});

export interface CheckInArgs {
  serial: string;
  model: Model;
  role: Role;
  status: Status;
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
  fields: Partial<Pick<MachineRow, "model" | "role" | "status" | "notes">>,
) => patch(db, id, fields);

export const remove = async (db: AnyDb, id: number): Promise<void> => {
  await db.delete(machines).where(eq(machines.id, id));
};

export const checkOutToStore = (db: AnyDb, id: number, destination: string) =>
  patch(db, id, { location: OUT, slot: null, destination, checkedOutAt: new Date() });

export const checkOutToPreDeployment = (db: AnyDb, id: number) =>
  patch(db, id, { location: PRE_DEPLOYMENT, slot: null });
