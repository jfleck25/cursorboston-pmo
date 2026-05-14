"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateTaskDetails(
  taskId: string,
  data: { title: string; description: string; assigneeUserId: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data,
    });

    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update details." };
  }
}
