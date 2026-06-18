import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  serial: text("serial").unique(),
  model: text("model").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  location: text("location").notNull(),
  slot: integer("slot"),
  destination: text("destination"),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // one machine per rack slot (NULL slots are exempt in Postgres unique semantics)
  slotUnique: unique("machines_location_slot_unique").on(t.location, t.slot),
}));

export type MachineRow = typeof machines.$inferSelect;
export type NewMachineRow = typeof machines.$inferInsert;
