import { z } from "zod";

export const slotIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        oneLiner: z.string().min(1).max(400),
        suggestedScope: z.string().min(1).max(400),
      }),
    )
    .length(3),
});

export type SlotIdeasOutput = z.infer<typeof slotIdeasSchema>;
export type SlotIdea = SlotIdeasOutput["ideas"][number];
