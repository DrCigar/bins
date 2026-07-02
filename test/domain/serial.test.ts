import { describe, it, expect } from "vitest";
import { parseSerialDate, compareByAge, prefixFor, buildSerial, incrementSerial } from "@/lib/domain/serial";

describe("incrementSerial", () => {
  it("increments plain numbers", () => {
    expect(incrementSerial("7777", 0)).toBe("7777");
    expect(incrementSerial("7777", 4)).toBe("7781");
  });
  it("preserves zero-padding and prefixes", () => {
    expect(incrementSerial("ABC-0100", 1)).toBe("ABC-0101");
    expect(incrementSerial("0999", 1)).toBe("1000");
    expect(incrementSerial("SMKP250423001", 2)).toBe("SMKP250423003");
  });
  it("returns null when the value doesn't end in digits", () => {
    expect(incrementSerial("SERIAL-", 1)).toBeNull();
    expect(incrementSerial("", 1)).toBeNull();
  });
});

describe("prefixFor", () => {
  it("maps line + role to prefix", () => {
    expect(prefixFor("360 Pro", "Primary")).toBe("S36P");
    expect(prefixFor("360 Pro", "Secondary")).toBe("S36S");
    expect(prefixFor("360 Smoke", "Primary")).toBe("SMKP");
    expect(prefixFor("360 Smoke", "Secondary")).toBe("SMKS");
  });
});

describe("buildSerial", () => {
  it("composes prefix + YYMMDD + zero-padded sequence", () => {
    expect(buildSerial("SMKP", new Date(Date.UTC(2025, 3, 23)), 1)).toBe("SMKP250423001");
    expect(buildSerial("S36P", new Date(Date.UTC(2024, 0, 5)), 42)).toBe("S36P240105042");
  });
});

describe("parseSerialDate with 4-char prefixes", () => {
  it("parses dates regardless of prefix length", () => {
    expect(parseSerialDate("SMKP250423001")).toEqual(new Date(Date.UTC(2025, 3, 23)));
    expect(parseSerialDate("S36P250423001")).toEqual(new Date(Date.UTC(2025, 3, 23)));
    expect(parseSerialDate("S36250423001")).toEqual(new Date(Date.UTC(2025, 3, 23)));
  });
});

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
