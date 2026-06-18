import { compareByAge } from "./serial";
import { Machine, Model, OUT } from "./types";

// Machines of the given model, on hand (not checked out), oldest-first by serial date.
export function rankOldestFirst(machines: Machine[], model: Model): Machine[] {
  return machines
    .filter((x) => x.model === model && x.location !== OUT)
    .sort((a, b) => compareByAge(a.serial, b.serial));
}
