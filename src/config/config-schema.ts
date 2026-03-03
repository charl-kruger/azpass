import { z } from "zod";

export const configSchema = z
	.object({
		daysToExpiry: z.number().int().min(1).optional(),
		email: z.string().optional(),
		feed: z.string().optional(),
		organization: z.string().optional(),
		project: z.string().optional(),
	})
	.strict();

export type Config = z.infer<typeof configSchema>;

export const configKeys = [
	"daysToExpiry",
	"email",
	"feed",
	"organization",
	"project",
] as const;

export type ConfigKey = (typeof configKeys)[number];
