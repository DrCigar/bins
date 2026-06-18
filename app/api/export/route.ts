import { getDb } from "@/lib/db/client";
import { list } from "@/lib/db/repo";
import { toCsv } from "@/lib/domain/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const machines = await list(getDb());
  const csv = toCsv(machines);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="register-locator-export.csv"`,
    },
  });
}
