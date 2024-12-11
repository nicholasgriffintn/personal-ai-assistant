import { type Context, Hono, type Next } from "hono";

import { handleTranscribe } from "../services/apps/transcribe";
import { handleCheckChat } from "../services/checkChat";
import { handleCreateChat } from "../services/createChat";
import { handleGetChat } from "../services/getChat";
import { handleListChats } from "../services/listChats";
import { handleFeedbackSubmission } from "../services/submitFeedback";
import type { IBody, IEnv, IFeedbackBody } from "../types";
import { AppError, handleApiError } from "../utils/errors";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";

const app = new Hono();

/**
 * Global middleware to check the ACCESS_TOKEN
 */
app.use("/*", async (context: Context, next: Next) => {
	if (!context.env.ACCESS_TOKEN) {
		throw new AppError("Missing ACCESS_TOKEN binding", 400);
	}

	const authFromQuery = context.req.query("token");
	const authFromHeaders = context.req.header("Authorization");
	const authToken = authFromQuery || authFromHeaders?.split("Bearer ")[1];

	if (authToken !== context.env.ACCESS_TOKEN) {
		throw new AppError("Unauthorized", 403);
	}

	await next();
});

app.get(
	"/",
	describeRoute({
		tags: ["chat"],
		description: "List chats",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			if (!context.env.CHAT_HISTORY) {
				throw new AppError("Missing CHAT_HISTORY binding", 400);
			}

			const response = await handleListChats({
				env: context.env as IEnv,
			});

			return context.json({
				response,
			});
		} catch (error) {
			return handleApiError(error);
		}
	},
);

app.get(
	"/:id",
	describeRoute({
		tags: ["chat"],
		description: "Get a chat",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			if (!context.env.CHAT_HISTORY) {
				throw new AppError("Missing CHAT_HISTORY binding", 400);
			}

			const id = context.req.param("id");

			if (!id) {
				throw new AppError("Missing ID", 400);
			}

			const data = await handleGetChat(
				{
					env: context.env as IEnv,
				},
				id,
			);

			return context.json(data);
		} catch (error) {
			return handleApiError(error);
		}
	},
);

app.post(
	"/",
	describeRoute({
		tags: ["chat"],
		description: "Create a chat",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			const body = (await context.req.json()) as IBody;

			const userEmail: string = context.req.header("x-user-email") || "";

			const user = {
				// @ts-ignore
				longitude: context.req.cf?.longitude,
				// @ts-ignore
				latitude: context.req.cf?.latitude,
				email: userEmail,
			};

			const newUrl = new URL(context.req.url);
			const appUrl = `${newUrl.protocol}//${newUrl.hostname}`;

			const data = await handleCreateChat({
				appUrl,
				env: context.env as IEnv,
				request: body,
				user,
			});

			return context.json(data);
		} catch (error) {
			return handleApiError(error);
		}
	},
);

app.post(
	"/transcribe",
	describeRoute({
		tags: ["chat"],
		description: "Transcribe an audio file",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			const body = await context.req.parseBody();

			const userEmail: string = context.req.header("x-user-email") || "";

			const user = {
				email: userEmail,
			};

			const response = await handleTranscribe({
				env: context.env as IEnv,
				audio: body.audio as Blob,
				user,
			});

			return context.json({
				response,
			});
		} catch (error) {
			return handleApiError(error);
		}
	},
);

app.post(
	"/check",
	describeRoute({
		tags: ["chat"],
		description: "Check a chat against guardrails",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			const body = (await context.req.json()) as IBody;

			const response = await handleCheckChat({
				env: context.env as IEnv,
				request: body,
			});

			return context.json({
				response,
			});
		} catch (error) {
			return handleApiError(error);
		}
	},
);

app.post(
	"/feedback",
	describeRoute({
		tags: ["chat"],
		description: "Submit feedback about a chat",
		responses: {
			200: {
				description: "Response",
				content: {
					"application/json": {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		try {
			const body = (await context.req.json()) as IFeedbackBody;

			const response = await handleFeedbackSubmission({
				env: context.env as IEnv,
				request: body,
			});

			return context.json({
				response,
			});
		} catch (error) {
			return handleApiError(error);
		}
	},
);

export default app;
