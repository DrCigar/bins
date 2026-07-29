import { getReadyDb } from "@/lib/db/client";
import { listManualCounts } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listManualCounts(await getReadyDb()));
}
