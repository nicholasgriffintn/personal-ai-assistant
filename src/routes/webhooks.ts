import { type Context, Hono, type Next } from "hono";

import { handleReplicateWebhook } from "../services/webhooks/replicate";
import type { IBody, IEnv } from "../types";
import { AppError, handleApiError } from "../utils/errors";

const app = new Hono();

/**
 * Global middleware to check the WEBHOOK_SECRET
 */
app.use("/*", async (context: Context, next: Next) => {
	if (!context.env.WEBHOOK_SECRET) {
		throw new AppError("Missing WEBHOOK_SECRET binding", 400);
	}

	const tokenFromQuery = context.req.query("token");

	if (tokenFromQuery !== context.env.WEBHOOK_SECRET) {
		throw new AppError("Unauthorized", 403);
	}

	await next();
});

/**
 * Replicate webhook route
 * @route POST /replicate
 */
app.post("/replicate", async (context: Context) => {
	try {
		const body = (await context.req.json()) as IBody;

		const id = context.req.query("chatId");

		const data = await handleReplicateWebhook(
			{
				env: context.env as IEnv,
				request: body,
			},
			id,
		);

		return context.json(data);
	} catch (error) {
		return handleApiError(error);
	}
});

export default app;
