import { describe, it, expect } from "vitest";
import { groupSerializationByDay } from "@/lib/domain/activity";
import type { SerializationEvent } from "@/lib/domain/types";

const ev = (over: Partial<SerializationEvent>): SerializationEvent => ({
  id: 1, serial: "SMKP250423001", productLine: "360 Smoke", role: "Primary",
  model: "Matsuda", assembledBy: "Thang", serializedAt: new Date(Date.UTC(2025, 3, 23, 10)), ...over,
});

describe("groupSerializationByDay", () => {
  it("groups by day, newest day first", () => {
    const groups = groupSerializationByDay([
      ev({ id: 1, serializedAt: new Date(Date.UTC(2025, 3, 23, 9)) }),
      ev({ id: 2, serializedAt: new Date(Date.UTC(2025, 3, 24, 9)) }),
      ev({ id: 3, serializedAt: new Date(Date.UTC(2025, 3, 23, 15)) }),
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2025-04-24", "2025-04-23"]);
    expect(groups[1].events).toHaveLength(2);
    // newest event first within the day
    expect(groups[1].events[0].id).toBe(3);
  });
  it("returns empty for no events", () => {
    expect(groupSerializationByDay([])).toEqual([]);
  });
});
