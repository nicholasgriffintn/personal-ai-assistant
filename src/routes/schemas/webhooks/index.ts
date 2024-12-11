import z from "zod";
import "zod-openapi/extend";

export const replicateWebhookQuerySchema = z.object({
	chatId: z
		.string()
		.min(1, "chatId is required")
		.openapi({ example: "my-awesome-chat-id" }),
	token: z
		.string()
		.min(1, "token is required")
		.openapi({ example: "my-webhook-token" }),
});

export const replicateWebhookJsonSchema = z.object({
	id: z
		.string()
		.min(1, "id is required")
		.openapi({ example: "ufawqhfynnddngldkgtslldrkq" }),
	version: z.string().optional().openapi({
		example: "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
	}),
	created_at: z
		.string()
		.optional()
		.openapi({ example: "2024-01-01T00:00:00.000Z" }),
	started_at: z.string().optional().nullable().openapi({ example: null }),
	completed_at: z.string().optional().nullable().openapi({ example: null }),
	status: z.string().optional().openapi({ example: "starting" }),
	input: z
		.object({
			text: z.string().optional().openapi({ example: "Alice" }),
		})
		.optional(),
	output: z.object({}).optional().nullable(),
	error: z.string().optional().nullable(),
	logs: z.string().optional().nullable(),
	metrics: z.object({}).optional().nullable(),
});
