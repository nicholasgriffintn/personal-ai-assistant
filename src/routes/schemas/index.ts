import z from "zod";

import "zod-openapi/extend";

export const statusResponseSchema = z.object({
	status: z.string().openapi({ example: "ok" }),
});

export const metricsResponseSchema = z.object({
	metrics: z.array(
		z.object({
			type: z.string(),
			name: z.string(),
			status: z.string(),
			value: z.number(),
			timestamp: z.number(),
			count: z.number(),
		}),
	),
});
