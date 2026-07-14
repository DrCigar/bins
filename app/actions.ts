"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getReadyDb } from "@/lib/db/client";
import * as repo from "@/lib/db/repo";
import { MODELS, ROLES, STATUSES, PRODUCT_LINES, Model, Role, Status, ProductLine } from "@/lib/domain/types";
import { areaCapacity } from "@/lib/layout/warehouse";
import { isValidPasscode, COOKIE_NAME } from "@/lib/auth";

const assertEnum = <T extends readonly string[]>(set: T, v: string, name: string): T[number] => {
  if (!set.includes(v as T[number])) throw new Error(`Invalid ${name}: ${v}`);
  return v as T[number];
};

// Throws if `location` is a capped open area that is already full.
async function assertAreaHasRoom(db: Awaited<ReturnType<typeof getReadyDb>>, location: string): Promise<void> {
  const cap = areaCapacity(location);
  if (cap === null) return; // racks (slot-unique) and unlimited areas
  const here = (await repo.list(db)).filter((m) => m.location === location).length;
  if (here >= cap) throw new Error(`${location} is full (max ${cap}).`);
}

export async function unlockAction(formData: FormData) {
  const code = String(formData.get("passcode") ?? "");
  if (!isValidPasscode(code, process.env.APP_PASSCODE)) {
    return { ok: false, error: "Wrong passcode" };
  }
  (await cookies()).set(COOKIE_NAME, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return { ok: true };
}

export async function checkInAction(input: {
  serial: string | null;
  model: string;
  role: string;
  status: string;
  productLine?: string | null;
  assembledBy?: string | null;
  notes: string | null;
  location: string;
  slot: number | null;
}) {
  const db = await getReadyDb();
  await assertAreaHasRoom(db, input.location);
  await repo.checkIn(db, {
    serial: input.serial?.trim() || null,
    model: assertEnum(MODELS, input.model, "model") as Model,
    role: assertEnum(ROLES, input.role, "role") as Role,
    status: assertEnum(STATUSES, input.status, "status") as Status,
    productLine: input.productLine ? (assertEnum(PRODUCT_LINES, input.productLine, "product line") as ProductLine) : null,
    assembledBy: input.assembledBy?.trim() || null,
    notes: input.notes?.trim() || null,
    location: input.location,
    slot: input.slot,
  });
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function serializeAction(input: {
  productLine: string;
  role: string;
  model: string;
  status: string;
  assembledBy: string | null;
  notes: string | null;
  date: string; // YYYY-MM-DD
  quantity: number;
  customStart?: string | null; // pre-printed labels: literal starting serial
}): Promise<
  | { created: Array<{ serial: string; location: string; slot: number | null }> }
  | { error: string }
> {
  try {
    const customStart = input.customStart?.trim() || undefined;
    if (customStart && !/\d$/.test(customStart)) {
      return { error: "Starting serial must end in a number." };
    }
    const created = await repo.serializeBatch(await getReadyDb(), {
      productLine: assertEnum(PRODUCT_LINES, input.productLine, "product line") as ProductLine,
      role: assertEnum(ROLES, input.role, "role") as Role,
      model: assertEnum(MODELS, input.model, "model") as Model,
      status: assertEnum(STATUSES, input.status, "status") as Status,
      assembledBy: input.assembledBy?.trim() || null,
      notes: input.notes?.trim() || null,
      date: new Date(input.date + "T00:00:00Z"),
      customStart,
    }, Math.max(1, Math.floor(input.quantity)));
    revalidatePath("/");
    revalidatePath("/totals");
    return {
      created: created
        .filter((m): m is typeof m & { serial: string } => Boolean(m.serial))
        .map((m) => ({ serial: m.serial, location: m.location, slot: m.slot })),
    };
  } catch (e) {
    // Surface the real reason to the client (prod otherwise masks it behind a digest).
    console.error("serializeAction failed:", e);
    return { error: e instanceof Error ? e.message : "Serialize failed" };
  }
}

export async function updateMachineAction(
  id: number,
  fields: { serial?: string | null; model?: string; role?: string; status?: string; productLine?: string; assembledBy?: string | null; notes?: string | null },
) {
  await repo.update(await getReadyDb(), id, {
    ...(fields.serial !== undefined ? { serial: fields.serial?.trim() || null } : {}),
    ...(fields.model ? { model: assertEnum(MODELS, fields.model, "model") } : {}),
    ...(fields.role ? { role: assertEnum(ROLES, fields.role, "role") } : {}),
    ...(fields.status ? { status: assertEnum(STATUSES, fields.status, "status") } : {}),
    ...(fields.productLine ? { productLine: assertEnum(PRODUCT_LINES, fields.productLine, "product line") } : {}),
    ...(fields.assembledBy !== undefined ? { assembledBy: fields.assembledBy?.trim() || null } : {}),
    ...(fields.notes !== undefined ? { notes: fields.notes?.trim() || null } : {}),
  });
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function moveAction(id: number, location: string, slot: number | null) {
  const db = await getReadyDb();
  await assertAreaHasRoom(db, location);
  await repo.move(db, id, { location, slot });
  revalidatePath("/");
}

export async function moveManyAction(ids: number[], location: string): Promise<{ moved: number }> {
  const db = await getReadyDb();
  const cap = areaCapacity(location);
  if (cap !== null) {
    const here = (await repo.list(db)).filter((m) => m.location === location && !ids.includes(m.id)).length;
    if (here + ids.length > cap) throw new Error(`${location} can't fit ${ids.length} more (max ${cap}).`);
  }
  const movedIds = await repo.moveMany(db, ids, location);
  revalidatePath("/");
  revalidatePath("/totals");
  return { moved: movedIds.length };
}

export async function removeAction(id: number) {
  await repo.remove(await getReadyDb(), id);
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function checkOutAction(
  id: number,
  dest: { kind: "store"; name: string } | { kind: "area"; area: string },
) {
  const db = await getReadyDb();
  if (dest.kind === "store") {
    await repo.checkOutToStore(db, id, dest.name.trim());
  } else {
    await assertAreaHasRoom(db, dest.area);
    await repo.stageInArea(db, id, dest.area);
  }
  revalidatePath("/");
  revalidatePath("/totals");
}
