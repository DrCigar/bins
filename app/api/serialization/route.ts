import { getReadyDb } from "@/lib/db/client";
import { listSerializationEvents } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listSerializationEvents(await getReadyDb()));
}
