import { SerializationEvent } from "./types";

export interface DayGroup {
  day: string; // YYYY-MM-DD
  events: SerializationEvent[];
}

const dayOf = (d: Date): string => new Date(d).toISOString().slice(0, 10);

// Group serialization events by calendar day (UTC), newest day first, newest event first within a day.
export function groupSerializationByDay(events: SerializationEvent[]): DayGroup[] {
  const map = new Map<string, SerializationEvent[]>();
  for (const e of events) {
    const day = dayOf(e.serializedAt);
    const bucket = map.get(day);
    if (bucket) bucket.push(e);
    else map.set(day, [e]);
  }
  return [...map.entries()]
    .map(([day, evs]) => ({
      day,
      events: [...evs].sort(
        (a, b) => new Date(b.serializedAt).getTime() - new Date(a.serializedAt).getTime(),
      ),
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}
