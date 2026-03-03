import { z } from "zod";

export const optionsSchema = z.object({
	whatIf: z.boolean().optional(),
	force: z.boolean().optional(),

	pat: z.string().optional(),
	config: z.string().optional(),

	// registry=https://pkgs.dev.azure.com/[ORGANIZATION]/[PROJECT]/_packaging/[FEED_NAME]/npm/registry/
	organization: z.string().optional(),
	project: z.string().optional(),
	feed: z.string().optional(),
	registry: z.string().optional(),

	email: z.string().optional(),
	daysToExpiry: z
		.number()
		.int("daysToExpiry must be an integer")
		.min(1, "daysToExpiry must be at least 1")
		.optional(),
});
