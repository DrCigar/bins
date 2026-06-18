import { getReadyDb } from "@/lib/db/client";
import { list } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await list(await getReadyDb()));
}
