import { z } from "zod";

// Zod's schema for a successful answer from the external endpoint
export const randomNumberSuccessResponseSchema = z.array(
  z.object({
    status: z.literal("success"),
    min: z.number(),
    max: z.number(),
    random: z.number(),
  })
);

// Zod's schema for a non-successful answer from the external endpoint
export const randomNumberErrorResponseSchema = z.array(
  z.object({
    status: z.literal("error"),
    code: z.string(),
    reason: z.string(),
  })
);

// Zod's schema for all possible responses.
export const combinedResponseSchema = z.union([randomNumberSuccessResponseSchema, randomNumberErrorResponseSchema]);
