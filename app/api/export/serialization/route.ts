import { getReadyDb } from "@/lib/db/client";
import { listSerializationEvents } from "@/lib/db/repo";
import { toSerializationCsv } from "@/lib/domain/csv";
import { groupSerializationByDay } from "@/lib/domain/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await listSerializationEvents(await getReadyDb());
  // newest-first by day, then within day (flatten the grouped order)
  const ordered = groupSerializationByDay(events).flatMap((g) => g.events);
  const csv = toSerializationCsv(ordered);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="serialization-activity.csv"`,
    },
  });
}
