import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  serial: text("serial").unique(),
  model: text("model").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  productLine: text("product_line"),
  assembledBy: text("assembled_by"),
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

export const serialCounters = pgTable("serial_counters", {
  key: text("key").primaryKey(),
  n: integer("n").notNull(),
});

export type MachineRow = typeof machines.$inferSelect;
export type NewMachineRow = typeof machines.$inferInsert;
export type SerialCounterRow = typeof serialCounters.$inferSelect;
