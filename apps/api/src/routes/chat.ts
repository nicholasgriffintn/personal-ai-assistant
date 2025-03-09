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
import { handleGenerateTitle } from "../services/generateTitle";
import { handleUpdateTitle } from "../services/updateTitle";
import type { IBody, IEnv, IFeedbackBody } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import {
	createChatJsonSchema,
	getChatParamsSchema,
	transcribeFormSchema,
	checkChatJsonSchema,
	feedbackJsonSchema,
	chatCompletionsJsonSchema,
	generateTitleJsonSchema,
	updateTitleJsonSchema
} from "./schemas/chat";
import { allowRestrictedPaths } from "../middleware/auth";
import { availableCapabilities, availableModelTypes, getModelConfig, getModels, getModelsByCapability, getModelsByType } from "../lib/models";

const app = new Hono();

/**
 * Global middleware to check authentication and set access level
 */
app.use("/*", async (context: Context, next: Next) => {
	const publicPaths = [
		'/chat',
		'/chat/*',
		'/chat/create',
		'/chat/completions',
		'/chat/generate-title',
		'/chat/update-title',
		'/auth/github',
		'/auth/github/callback',
	];
	
	await allowRestrictedPaths(publicPaths, context, next);
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

app.post(
	"/create",
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
	async (context: Context) => {
		const body = context.req.valid("json" as never) as IBody;

		const user = {
			// @ts-ignore
			longitude: context.req.cf?.longitude,
			// @ts-ignore
			latitude: context.req.cf?.latitude,
			email: context.get("user")?.email,
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
	async (context: Context) => {
		const body = context.req.valid("form" as never) as {
			audio: Blob;
		};
		const user = context.get("user");

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
	async (context: Context) => {
		const body = context.req.valid("json" as never) as IFeedbackBody;
		const user = context.get("user");

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
	async (context: Context) => {
		const body = context.req.valid("json" as never);

		const userContext = context.get("user");

		const user = {
			// @ts-ignore
			longitude: context.req.cf?.longitude,
			// @ts-ignore
			latitude: context.req.cf?.latitude,
			email: userContext?.email,
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

app.post(
	"/generate-title",
	describeRoute({
		tags: ["chat"],
		description: "Generate a title for a chat",
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
	zValidator("json", generateTitleJsonSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { chat_id, messages } = context.req.valid("json" as never);

		const response = await handleGenerateTitle({
			env: context.env as IEnv,
			chatId: chat_id,
			messages,
		});

		return context.json({
			response,
		});
	},
);

app.put(
	"/update-title",
	describeRoute({
		tags: ["chat"],
		description: "Update the title of a chat",
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
	zValidator("json", updateTitleJsonSchema),
	async (context: Context) => {
		const { chat_id, title } = context.req.valid("json" as never);

		const response = await handleUpdateTitle({
			env: context.env as IEnv,
			chatId: chat_id,
			title,
		});

		return context.json({
			response,
		});
	},
);

app.delete(
	"/:id",
	describeRoute({
		tags: ["chat"],
		description: "Delete a chat",
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

		await context.env.CHAT_HISTORY.delete(id);

		return context.json({
			success: true,
			message: "Chat deleted successfully",
		});
	},
);

app.get(
	"/models",
	describeRoute({
		tags: ["chat"],
		description: "Get all models",
	}),
	async (context: Context) => {
		const models = getModels();

		return context.json({
			success: true,
			message: "Models fetched successfully",
			data: models,
		});
	},
);

app.get(
	"/models/capabilities",
	describeRoute({
		tags: ["chat"],
		description: "Get all capabilities",
	}),
	async (context: Context) => {
		return context.json({
			success: true,
			message: "Capabilities fetched successfully",
			data: availableCapabilities,
		});
	}
);

app.get(
	"/models/capabilities/:capability",
	describeRoute({
		tags: ["chat"],
		description: "Get models by capability",
	}),
	zValidator("param", z.object({
		capability: z.string(),
	})),
	async (context: Context) => {
		const { capability } = context.req.valid("param" as never);

		const models = getModelsByCapability(capability);

		return context.json({
			success: true,
			message: "Models fetched successfully",
			data: models,
		});
	}
);

app.get(
	"/models/types",
	describeRoute({
		tags: ["chat"],
		description: "Get all model types",
	}),
	async (context: Context) => {
		return context.json({
			success: true,
			message: "Model types fetched successfully",
			data: availableModelTypes,
		});
	}
);

app.get(
	"/models/types/:type",
	describeRoute({
		tags: ["chat"],
		description: "Get models by type",
	}),
	zValidator("param", z.object({
		type: z.string(),
	})),
	async (context: Context) => {
		const { type } = context.req.valid("param" as never);
		
		const models = getModelsByType(type);

		return context.json({
			success: true,
			message: "Models fetched successfully",
			data: models,
		});
	}
);

app.get(
	"/models/:id",
	describeRoute({
		tags: ["chat"],
		description: "Get a model",
	}),
	zValidator("param", z.object({
		id: z.string(),
	})),
	async (context: Context) => {
		const { id } = context.req.valid("param" as never);

		const model = getModelConfig(id);

		return context.json({
			success: true,
			message: "Model fetched successfully",
			data: model,
		});
	}
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

export default app;
