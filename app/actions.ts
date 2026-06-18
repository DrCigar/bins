"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getReadyDb } from "@/lib/db/client";
import * as repo from "@/lib/db/repo";
import { MODELS, ROLES, STATUSES, Model, Role, Status } from "@/lib/domain/types";
import { isValidPasscode, COOKIE_NAME } from "@/lib/auth";

const assertEnum = <T extends readonly string[]>(set: T, v: string, name: string): T[number] => {
  if (!set.includes(v as T[number])) throw new Error(`Invalid ${name}: ${v}`);
  return v as T[number];
};

export async function unlockAction(formData: FormData) {
  const code = String(formData.get("passcode") ?? "");
  if (!isValidPasscode(code, process.env.APP_PASSCODE)) {
    return { ok: false, error: "Wrong passcode" };
  }
  (await cookies()).set(COOKIE_NAME, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return { ok: true };
}

export async function checkInAction(input: {
  serial: string;
  model: string;
  role: string;
  status: string;
  notes: string | null;
  location: string;
  slot: number | null;
}) {
  await repo.checkIn(await getReadyDb(), {
    serial: input.serial.trim(),
    model: assertEnum(MODELS, input.model, "model") as Model,
    role: assertEnum(ROLES, input.role, "role") as Role,
    status: assertEnum(STATUSES, input.status, "status") as Status,
    notes: input.notes?.trim() || null,
    location: input.location,
    slot: input.slot,
  });
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function updateMachineAction(
  id: number,
  fields: { model?: string; role?: string; status?: string; notes?: string | null },
) {
  await repo.update(await getReadyDb(), id, {
    ...(fields.model ? { model: assertEnum(MODELS, fields.model, "model") } : {}),
    ...(fields.role ? { role: assertEnum(ROLES, fields.role, "role") } : {}),
    ...(fields.status ? { status: assertEnum(STATUSES, fields.status, "status") } : {}),
    ...(fields.notes !== undefined ? { notes: fields.notes?.trim() || null } : {}),
  });
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function moveAction(id: number, location: string, slot: number | null) {
  await repo.move(await getReadyDb(), id, { location, slot });
  revalidatePath("/");
}

export async function removeAction(id: number) {
  await repo.remove(await getReadyDb(), id);
  revalidatePath("/");
  revalidatePath("/totals");
}

export async function checkOutAction(
  id: number,
  dest: { kind: "store"; name: string } | { kind: "pre" },
) {
  if (dest.kind === "store") await repo.checkOutToStore(await getReadyDb(), id, dest.name.trim());
  else await repo.checkOutToPreDeployment(await getReadyDb(), id);
  revalidatePath("/");
  revalidatePath("/totals");
}
