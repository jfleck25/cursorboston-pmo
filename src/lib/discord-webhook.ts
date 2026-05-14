import "server-only";

import { logServerEvent } from "@/lib/action-log";

type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
};

export async function postDiscordJson(
  webhookUrl: string | undefined,
  body: Record<string, unknown>,
  label: string,
): Promise<void> {
  const url = webhookUrl?.trim();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429 || res.status === 400) {
      logServerEvent("discord_webhook", {
        label,
        status: String(res.status),
        ok: "false",
      });
      return;
    }
    if (!res.ok) {
      logServerEvent("discord_webhook", {
        label,
        status: String(res.status),
        ok: "false",
      });
    }
  } catch (e) {
    logServerEvent("discord_webhook", {
      label,
      ok: "false",
      error: e instanceof Error ? e.message : "fetch_error",
    });
  }
}

export async function notifyDiscordRoll(input: {
  webhookUrl: string | undefined;
  userHandle: string;
  taskTitle: string;
  taskUrl: string;
  source: "github" | "ai";
}): Promise<void> {
  const color = input.source === "github" ? 0xa371f7 : 0x7df4ff;
  const embed: DiscordEmbed = {
    title: "New roll — task accepted",
    description: `**${input.userHandle}** locked a deal onto the assembly line.`,
    color,
    fields: [
      { name: "Task", value: input.taskTitle.slice(0, 250) },
      { name: "Open", value: `[Momentum](${input.taskUrl})`, inline: true },
    ],
  };
  await postDiscordJson(
    input.webhookUrl,
    {
      embeds: [embed],
    },
    "roll",
  );
}

export async function notifyDiscordShip(input: {
  webhookUrl: string | undefined;
  userHandle: string;
  taskTitle: string;
  taskUrl: string | null;
  shippedAtIso: string;
}): Promise<void> {
  const embed: DiscordEmbed = {
    title: "Shipped",
    description: `**${input.userHandle}** shipped **${input.taskTitle.slice(0, 220)}**.`,
    color: 0x00ff66,
    fields: [
      { name: "When", value: input.shippedAtIso },
      ...(input.taskUrl
        ? [{ name: "Link", value: input.taskUrl, inline: true as const }]
        : []),
    ],
  };
  await postDiscordJson(
    input.webhookUrl,
    {
      embeds: [embed],
    },
    "ship",
  );
}
