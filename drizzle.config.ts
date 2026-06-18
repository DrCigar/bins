import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Standalone tooling (drizzle-kit) doesn't auto-load .env.local — load it explicitly.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
