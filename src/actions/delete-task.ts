"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  // We should verify the user is in the same cohort as the task.
  // The simplest is just checking if the task exists for this user's cohort.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });

  if (!user?.cohortId) {
    return { ok: false, error: "No cohort" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { cohortId: true },
  });

  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  if (task.cohortId !== user.cohortId) {
    return { ok: false, error: "Task doesn't belong to your cohort" };
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    
    revalidatePath("/");
    revalidatePath("/assembly");
    revalidatePath("/friday");
    
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message ?? "Failed to delete task" };
  }
}
