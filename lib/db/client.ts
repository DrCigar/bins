import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle>;
let cached: DrizzleDb | null = null;
let schemaReady: Promise<void> | null = null;

// Lazily create the connection so the app/build can load without DATABASE_URL set.
export function getDb(): DrizzleDb {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

// Idempotent schema creation — runs once per process so deploys need no migration step.
const DDL = sql`CREATE TABLE IF NOT EXISTS machines (
  id serial PRIMARY KEY,
  serial text UNIQUE,
  model text NOT NULL,
  role text NOT NULL,
  status text NOT NULL,
  notes text,
  location text NOT NULL,
  slot integer,
  destination text,
  checked_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machines_location_slot_unique UNIQUE (location, slot)
)`;

export async function getReadyDb(): Promise<DrizzleDb> {
  const db = getDb();
  if (!schemaReady) {
    schemaReady = db
      .execute(DDL)
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null; // allow retry on next request
        throw err;
      });
  }
  await schemaReady;
  return db;
}
