import { type Context, Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { handleReplicateWebhook } from "../services/webhooks/replicate";
import type { IBody, IEnv } from "../types";
import {
	replicateWebhookQuerySchema,
	replicateWebhookJsonSchema,
} from "./schemas/webhooks";
import { messageSchema } from "./schemas/shared";
import { webhookAuth } from "../middleware/auth";

const app = new Hono();

/**
 * Global middleware to check the WEBHOOK_SECRET
 */
app.use("/*", webhookAuth);

app.post(
	"/replicate",
	describeRoute({
		tags: ["webhooks"],
		description: "Respond to a replicate webhook request",
		responses: {
			200: {
				description: "Response containing the status of the webhook request",
				content: {
					"application/json": {
						schema: resolver(messageSchema),
					},
				},
			},
		},
	}),
	zValidator("query", replicateWebhookQuerySchema),
	zValidator("json", replicateWebhookJsonSchema),
	async (context: Context) => {
		const { chatId } = context.req.valid("query" as never);

		const body = context.req.valid("json" as never) as IBody;

		const data = await handleReplicateWebhook(
			{
				env: context.env as IEnv,
				request: body,
			},
			chatId,
		);

		return context.json(data);
	},
);

export default app;
