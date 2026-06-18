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
      notes text, location text not null, slot integer, destination text,
      checked_out_at timestamptz, created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(location, slot)
    );
  `);
});

const checkInArgs = {
  serial: "S36250423001", model: "Matsuda" as const, role: "Primary" as const,
  status: "New" as const, notes: null, location: "A", slot: 1,
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
