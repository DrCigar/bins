import { describe, it, expect } from "vitest";
import { parseSerialDate, compareByAge } from "@/lib/domain/serial";

describe("parseSerialDate", () => {
  it("parses YYMMDD after the S36 prefix", () => {
    expect(parseSerialDate("S36250423001")).toEqual(new Date(Date.UTC(2025, 3, 23)));
  });
  it("parses a different date and sequence", () => {
    expect(parseSerialDate("S36240101099")).toEqual(new Date(Date.UTC(2024, 0, 1)));
  });
  it("returns null when too short", () => {
    expect(parseSerialDate("S3625")).toBeNull();
  });
  it("returns null for an impossible month", () => {
    expect(parseSerialDate("S36251523001")).toBeNull();
  });
  it("returns null for an impossible day", () => {
    expect(parseSerialDate("S36250432001")).toBeNull();
  });
});

describe("compareByAge", () => {
  it("orders older (earlier date) first", () => {
    const older = "S36240101001";
    const newer = "S36250423001";
    expect(compareByAge(older, newer)).toBeLessThan(0);
    expect(compareByAge(newer, older)).toBeGreaterThan(0);
  });
  it("sorts unparseable serials last", () => {
    expect(compareByAge("BADSERIAL", "S36250423001")).toBeGreaterThan(0);
    expect(compareByAge("S36250423001", "BADSERIAL")).toBeLessThan(0);
  });
});
