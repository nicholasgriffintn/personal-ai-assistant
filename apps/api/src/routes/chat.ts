import { type Context, Hono, type Next } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

import { handleTranscribe } from "../services/apps/transcribe";
import { handleCheckChat } from "../services/checkChat";
import { handleCreateChat } from "../services/createChat";
import { handleGetChat } from "../services/getChat";
import { handleListChats } from "../services/listChats";
import { handleFeedbackSubmission } from "../services/submitFeedback";
import { handleChatCompletions } from "../services/chatCompletions";
import type { IBody, IEnv, IFeedbackBody } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import {
	createChatJsonSchema,
	getChatParamsSchema,
	transcribeFormSchema,
	checkChatJsonSchema,
	feedbackJsonSchema,
	chatCompletionsJsonSchema,
} from "./schemas/chat";
import { userHeaderSchema } from "./schemas/shared";
import { getModelConfigByModel } from "../lib/models";

const app = new Hono();

/**
 * Global middleware to check the ACCESS_TOKEN and set access level
 */
app.use("/*", async (context: Context, next: Next) => {
	if (!context.env.ACCESS_TOKEN) {
		throw new AssistantError(
			"Missing ACCESS_TOKEN binding",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	const authFromQuery = context.req.query("token");
	const authFromHeaders = context.req.header("Authorization");
	const authToken = authFromQuery || authFromHeaders?.split("Bearer ")[1];

	const isRestricted = authToken !== context.env.ACCESS_TOKEN;
	
	if (isRestricted) {
		const path = context.req.path;

		const allowedPaths = ['/chat', '/chat/completions'];
		if (!allowedPaths.includes(path)) {
			throw new AssistantError(
				"This endpoint requires authentication. Please provide a valid access token.",
				ErrorType.AUTHENTICATION_ERROR
			);
		}

		const body = await context.req.json();
		const modelInfo = getModelConfigByModel(body?.model);

		if (body?.useRAG) {
			throw new AssistantError(
				"RAG features require authentication. Please provide a valid access token.",
				ErrorType.AUTHENTICATION_ERROR
			);
		}

		if (body?.tools?.length > 0 || body?.tool_choice) {
			throw new AssistantError(
				"Tool usage requires authentication. Please provide a valid access token.",
				ErrorType.AUTHENTICATION_ERROR
			);
		}

		if (!modelInfo || !modelInfo.isFree) {
			throw new AssistantError(
				"In restricted mode, you must specify one of the free models (these mostly include Mistral and Workers AI provided models).",
				ErrorType.AUTHENTICATION_ERROR
			);
		}
	}

	context.set('isRestricted', isRestricted);

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
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const response = await handleListChats({
			env: context.env as IEnv,
		});

		return context.json({
			response,
		});
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
	zValidator("param", getChatParamsSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { id } = context.req.valid("param" as never);

		const data = await handleGetChat(
			{
				env: context.env as IEnv,
			},
			id,
		);

		return context.json(data);
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
	zValidator("json", createChatJsonSchema),
	zValidator("header", userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid("json" as never) as IBody;

		const headers = context.req.valid("header" as never);
		const user = {
			// @ts-ignore
			longitude: context.req.cf?.longitude,
			// @ts-ignore
			latitude: context.req.cf?.latitude,
			email: headers["x-user-email"],
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
	zValidator("form", transcribeFormSchema),
	zValidator("header", userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid("form" as never) as {
			audio: Blob;
		};

		const headers = context.req.valid("header" as never);
		const user = {
			email: headers["x-user-email"],
		};

		const response = await handleTranscribe({
			env: context.env as IEnv,
			audio: body.audio as Blob,
			user,
		});

		return context.json({
			response,
		});
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
	zValidator("json", checkChatJsonSchema),
	async (context: Context) => {
		const body = context.req.valid("json" as never) as IBody;

		const response = await handleCheckChat({
			env: context.env as IEnv,
			request: body,
		});

		return context.json({
			response,
		});
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
	zValidator("json", feedbackJsonSchema),
	zValidator("header", userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid("json" as never) as IFeedbackBody;
		const headers = context.req.valid("header" as never);

		const user = {
			email: headers["x-user-email"],
		};

		const response = await handleFeedbackSubmission({
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json({
			response,
		});
	},
);

app.post(
	"/completions",
	describeRoute({
		tags: ["chat"],
		description: "Create a chat completion",
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
	zValidator("json", chatCompletionsJsonSchema),
	zValidator("header", userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid("json" as never);
		const headers = context.req.valid("header" as never);
		const user = {
			email: headers["x-user-email"],
		};

		const response = await handleChatCompletions({
			env: context.env as IEnv,
			request: body,
			user,
			isRestricted: context.get('isRestricted'),
		});

		return context.json(response);
	},
);

export default app;
