"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getRequiredSession } from "@/lib/session";

type AccountActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

export async function deleteConnectedAccount(
  accountId: string,
): Promise<AccountActionResult> {
  const session = await getRequiredSession();
  const cleanAccountId = accountId.trim();

  if (!cleanAccountId) {
    return { ok: false, error: "Account was not found." };
  }

  await db
    .delete(schema.connectedAccount)
    .where(
      and(
        eq(schema.connectedAccount.id, cleanAccountId),
        eq(schema.connectedAccount.userId, session.user.id),
      ),
    );

  revalidatePath("/dashboard/accounts");

  return { ok: true };
}
