import { z } from "zod";

export const sendTestSchema = z.object({
  destinationId: z.uuid(),
});
