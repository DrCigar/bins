import { describe, it, expect, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as repo from "@/lib/db/repo";

let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  const pg = new PGlite();
  db = drizzle(pg);
  await pg.exec(`
    CREATE TABLE machines (
      id serial primary key,
      serial text unique,
      model text not null, role text not null, status text not null,
      product_line text, assembled_by text,
      notes text, location text not null, slot integer, destination text,
      checked_out_at timestamptz, created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(location, slot)
    );
    CREATE TABLE serial_counters (key text primary key, n integer not null);
    CREATE TABLE serialization_events (
      id serial primary key, serial text not null, product_line text,
      role text not null, model text not null, assembled_by text,
      serialized_at timestamptz not null default now()
    );
  `);
});

const checkInArgs = {
  serial: "S36250423001", model: "Matsuda" as const, role: "Primary" as const,
  status: "New" as const, productLine: "360 Pro" as const, assembledBy: null,
  notes: null, location: "A", slot: 1,
};

describe("repo.checkIn", () => {
  it("inserts a machine", async () => {
    const m = await repo.checkIn(db, checkInArgs);
    expect(m.serial).toBe("S36250423001");
    expect(m.location).toBe("A");
  });
  it("rejects a duplicate serial", async () => {
    await repo.checkIn(db, checkInArgs);
    await expect(repo.checkIn(db, { ...checkInArgs, slot: 2 })).rejects.toThrow();
  });
  it("rejects two machines in the same slot", async () => {
    await repo.checkIn(db, checkInArgs);
    await expect(repo.checkIn(db, { ...checkInArgs, serial: "S36250423002" })).rejects.toThrow();
  });
  it("allows multiple machines with no serial", async () => {
    await repo.checkIn(db, { ...checkInArgs, serial: null, slot: 1 });
    const second = await repo.checkIn(db, { ...checkInArgs, serial: null, slot: 2 });
    expect(second.serial).toBeNull();
  });
});

describe("repo.stageInArea", () => {
  it("moves a machine into an open area and clears slot/checkout", async () => {
    const m = await repo.checkIn(db, checkInArgs);
    await repo.checkOutToStore(db, m.id, "Store #9");
    const staged = await repo.stageInArea(db, m.id, "Outbound");
    expect(staged.location).toBe("Outbound");
    expect(staged.slot).toBeNull();
    expect(staged.destination).toBeNull();
    expect(staged.checkedOutAt).toBeNull();
  });
});

describe("repo.move", () => {
  it("moves a machine and keeps its notes", async () => {
    const m = await repo.checkIn(db, { ...checkInArgs, notes: "keep me" });
    const moved = await repo.move(db, m.id, { location: "B", slot: 5 });
    expect(moved.location).toBe("B");
    expect(moved.slot).toBe(5);
    expect(moved.notes).toBe("keep me");
  });
});

describe("repo.checkOutToStore", () => {
  it("marks the machine Out with a destination and timestamp", async () => {
    const m = await repo.checkIn(db, checkInArgs);
    const out = await repo.checkOutToStore(db, m.id, "Store #12");
    expect(out.location).toBe("Out");
    expect(out.slot).toBeNull();
    expect(out.destination).toBe("Store #12");
    expect(out.checkedOutAt).not.toBeNull();
  });
});

describe("repo.findBySerial / list", () => {
  it("finds by serial and lists all", async () => {
    await repo.checkIn(db, checkInArgs);
    expect((await repo.findBySerial(db, "S36250423001"))?.location).toBe("A");
    expect(await repo.list(db)).toHaveLength(1);
  });
});

describe("repo.allocateSequence", () => {
  it("increments per key and returns the new high-water mark", async () => {
    expect(await repo.allocateSequence(db, "S36P250423", 1)).toBe(1);
    expect(await repo.allocateSequence(db, "S36P250423", 3)).toBe(4); // 2,3,4
    expect(await repo.allocateSequence(db, "SMKP250423", 1)).toBe(1); // separate key
  });
});

describe("repo.serializeBatch", () => {
  const args = {
    productLine: "360 Smoke" as const, role: "Primary" as const,
    model: "Matsuda" as const, status: "New" as const,
    assembledBy: "Thang", notes: null, date: new Date(Date.UTC(2025, 3, 23)),
    destination: "HH",
  };
  it("creates N units with sequential serials in the chosen destination rack", async () => {
    const created = await repo.serializeBatch(db, args, 3);
    expect(created.map((m) => m.serial)).toEqual(["SMKP250423001", "SMKP250423002", "SMKP250423003"]);
    expect(created.every((m) => m.location === "HH")).toBe(true);
    expect(created[0].slot).toBe(1);
  });
  it("places into any chosen rack, filling its slots", async () => {
    const created = await repo.serializeBatch(db, { ...args, destination: "M" }, 2);
    expect(created.every((m) => m.location === "M")).toBe(true);
    expect(created.map((m) => m.slot)).toEqual([1, 2]);
  });
  it("caps a rack batch at its capacity (HH = 16)", async () => {
    const res = await repo.serializeBatch(db, args, 999);
    expect(res.length).toBe(16);
  });
  it("places into an open area with null slots, capped by area capacity", async () => {
    const res = await repo.serializeBatch(db, { ...args, destination: "Pre-Deployment" }, 999);
    expect(res.length).toBe(30); // Pre-Deployment cap
    expect(res.every((m) => m.location === "Pre-Deployment" && m.slot === null)).toBe(true);
  });
  it("logs an event per serialized unit", async () => {
    await repo.serializeBatch(db, args, 3);
    const events = await repo.listSerializationEvents(db);
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ productLine: "360 Smoke", role: "Primary", model: "Matsuda" });
    expect(events[0].serial).toMatch(/^SMKP/);
  });

  it("uses the custom starting number for pre-printed labels", async () => {
    const created = await repo.serializeBatch(db, { ...args, customStart: "7777" }, 5);
    expect(created.map((m) => m.serial)).toEqual(["7777", "7778", "7779", "7780", "7781"]);
    expect(created[0].location).toBe("HH"); // still lands in staging
    const events = await repo.listSerializationEvents(db);
    expect(events).toHaveLength(5); // still logged to activity
  });

  it("rejects a custom range that collides with existing serials", async () => {
    await repo.checkIn(db, { ...checkInArgs, serial: "7778", slot: 9 });
    await expect(repo.serializeBatch(db, { ...args, customStart: "7777" }, 3)).rejects.toThrow(/7778/);
  });

  it("clearLocation empties an area and drops its activity events", async () => {
    await repo.serializeBatch(db, { ...args, destination: "Pre-Deployment" }, 4);
    await repo.checkIn(db, { ...checkInArgs, location: "A", slot: 1 }); // keep an unrelated unit
    const cleared = await repo.clearLocation(db, "Pre-Deployment");
    expect(cleared).toBe(4);
    expect((await repo.list(db)).every((m) => m.location !== "Pre-Deployment")).toBe(true);
    expect(await repo.listSerializationEvents(db)).toHaveLength(0);
    expect(await repo.list(db)).toHaveLength(1); // the unrelated unit survives
  });

  it("removing a serialized unit also clears its activity event", async () => {
    const created = await repo.serializeBatch(db, args, 3);
    await repo.remove(db, created[0].id);
    expect(await repo.list(db)).toHaveLength(2);
    const events = await repo.listSerializationEvents(db);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.serial)).not.toContain(created[0].serial);
  });
});
