import { describe, it, expect } from "vitest";
import { rankOldestFirst } from "@/lib/domain/ranking";
import type { Machine } from "@/lib/domain/types";

const m = (over: Partial<Machine>): Machine => ({
  id: 1, serial: "S36250423001", model: "Matsuda", role: "Primary",
  status: "New", notes: null, location: "A", slot: 1, destination: null,
  checkedOutAt: null, createdAt: new Date(), updatedAt: new Date(), ...over,
});

describe("rankOldestFirst", () => {
  it("filters by model and orders oldest-first", () => {
    const list = [
      m({ id: 1, serial: "S36250423001", model: "Matsuda" }),
      m({ id: 2, serial: "S36240101001", model: "Matsuda" }),
      m({ id: 3, serial: "S36250101001", model: "Hanasis" }),
    ];
    const result = rankOldestFirst(list, "Matsuda");
    expect(result.map((x) => x.id)).toEqual([2, 1]);
  });

  it("excludes machines already checked out", () => {
    const list = [
      m({ id: 1, serial: "S36240101001", model: "Matsuda", location: "Out" }),
      m({ id: 2, serial: "S36250423001", model: "Matsuda", location: "A" }),
    ];
    const result = rankOldestFirst(list, "Matsuda");
    expect(result.map((x) => x.id)).toEqual([2]);
  });
});
