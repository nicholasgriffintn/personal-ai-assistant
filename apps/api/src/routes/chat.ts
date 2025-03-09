import { type Context, Hono, type Next } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

import type { IBody, IEnv, IFeedbackBody } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import {
	createChatCompletionsJsonSchema,
	getChatCompletionParamsSchema,
	generateChatCompletionTitleParamsSchema,
	generateChatCompletionTitleJsonSchema,
	updateChatCompletionParamsSchema,
	updateChatCompletionJsonSchema,
	deleteChatCompletionParamsSchema,
	checkChatCompletionParamsSchema,
	checkChatCompletionJsonSchema,
	submitChatCompletionFeedbackParamsSchema,
	submitChatCompletionFeedbackJsonSchema,
} from "./schemas/chat";
import { allowRestrictedPaths } from "../middleware/auth";
import { handleCreateChatCompletions } from "../services/completions/createChatCompletions";
import { handleGetChatCompletion } from "../services/completions/getChatCompletion";
import { handleListChatCompletions } from "../services/completions/listChatCompletions";
import { handleGenerateChatCompletionTitle } from "../services/completions/generateChatCompletionTitle";
import { handleUpdateChatCompletion } from "../services/completions/updateChatCompletion";
import { handleDeleteChatCompletion } from "../services/completions/deleteChatCompletion";
import { handleCheckChatCompletion } from "../services/completions/checkChatCompletion";
import { handleChatCompletionFeedbackSubmission } from "../services/completions/chatCompletionFeedbackSubmission";

import { handleTranscribe } from "../services/audio/transcribe";

const app = new Hono();

/**
 * Global middleware to check authentication and set access level
 */
app.use("/*", async (context: Context, next: Next) => {
	await allowRestrictedPaths(context, next);
});


app.post(
	"/completions",
	describeRoute({
		tags: ["chat"],
		title: "Create chat completion",
		description: "Creates a model response for the given chat conversation. Please note that parameter support can differ depending on the model used to generate the response.",
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
	zValidator("json", createChatCompletionsJsonSchema),
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

		const response = await handleCreateChatCompletions({
			env: context.env as IEnv,
			request: body,
			user,
			isRestricted: context.get('isRestricted'),
		});

		return context.json(response);
	},
);

// TODO: Completion storage needs to be changed, this should return the overall completion object, not the messages
app.get(
	"/completions/:completion_id",
	describeRoute({
		tags: ["chat"],
		title: "Get chat completion",
		description: "Get a stored chat completion. Only chat completions that have been created with the store parameter set to true will be returned.",
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
	zValidator("param", getChatCompletionParamsSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { completion_id } = context.req.valid("param" as never);

		const data = await handleGetChatCompletion(
			{
				env: context.env as IEnv,
			},
			completion_id,
		);

		return context.json(data);
	},
);

// TODO: Completion storage needs to be changed and this implemented to only return messages.
// TODO: If should have after, limit and order parameters
app.get(
	"/completions/:completion_id/messages",
	describeRoute({
		tags: ["chat"],
		title: "Get chat messages",
		description: "Get the messages in a stored chat completion. Only chat completions that have been created with the store parameter set to true will be returned.",
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
	zValidator("param", getChatCompletionParamsSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { completion_id } = context.req.valid("param" as never);

		const data = await handleGetChatCompletion(
			{
				env: context.env as IEnv,
			},
			completion_id,
		);

		return context.json(data);
	},
);

// TODO: This should have after, limit and order parameters as well as model filtering
app.get(
	"/completions",
	describeRoute({
		tags: ["chat"],
		title: "List chat completions",
		description: "List stored chat completions. Only chat completions that have been stored with the store parameter set to true will be returned.",
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

		const response = await handleListChatCompletions({
			env: context.env as IEnv,
		});

		return context.json({
			response,
		});
	},
);

app.post(
	"/completions/:completion_id/generate-title",
	describeRoute({
		tags: ["chat"],
		title: "Generate a title for a chat",
		description: "Generate a title for a chat completion and then update the metadata with the title.",
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
	zValidator("param", generateChatCompletionTitleParamsSchema),
	zValidator("json", generateChatCompletionTitleJsonSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { completion_id } = context.req.valid("param" as never);
		const { messages } = context.req.valid("json" as never);

		const response = await handleGenerateChatCompletionTitle({
			env: context.env as IEnv,
			completion_id: completion_id,
			messages,
		});

		return context.json({
			response,
		});
	},
);

app.put(
	"/completions/:completion_id",
	describeRoute({
		tags: ["chat"],
		title: "Update a chat completion",
		description: "Modify a stored chat completion. Only chat completions that have been created with the store parameter set to true can be modified.",
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
	zValidator("param", updateChatCompletionParamsSchema),
	zValidator("json", updateChatCompletionJsonSchema),
	async (context: Context) => {
		const { completion_id } = context.req.valid("param" as never);
		// TODO: Change storage of completions and then change this to pass metadata.
		const { title } = context.req.valid("json" as never);

		const response = await handleUpdateChatCompletion({
			env: context.env as IEnv,
			completion_id: completion_id,
			title,
		});

		return context.json({
			response,
		});
	},
);

app.delete(
	"/completions/:completion_id",
	describeRoute({
		tags: ["chat"],
		title: "Delete chat completion",
		description: "Delete a stored chat completion. Only chat completions that have been created with the store parameter set to true can be deleted.",
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
	zValidator("param", deleteChatCompletionParamsSchema),
	async (context: Context) => {
		if (!context.env.CHAT_HISTORY) {
			throw new AssistantError(
				"Missing CHAT_HISTORY binding",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const { completion_id } = context.req.valid("param" as never);

		const response = await handleDeleteChatCompletion({
			env: context.env as IEnv,
			completion_id,
		});

		return context.json(response);
	},
);

app.post(
	"/completions/:completion_id/check",
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
	zValidator("param", checkChatCompletionParamsSchema),
	zValidator("json", checkChatCompletionJsonSchema),
	async (context: Context) => {
		const { completion_id } = context.req.valid("param" as never);
		const { role } = context.req.valid("json" as never);

		const response = await handleCheckChatCompletion({
			env: context.env as IEnv,
			completion_id,
			role,
		});

		return context.json({
			response,
		});
	},
);

app.post(
	"/completions/:completion_id/feedback",
	describeRoute({
		tags: ["chat"],
		title: "Submit feedback about a chat completion",
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
	zValidator("param", submitChatCompletionFeedbackParamsSchema),
	zValidator("json", submitChatCompletionFeedbackJsonSchema),
	async (context: Context) => {
		const { completion_id } = context.req.valid("param" as never);
		const body = context.req.valid("json" as never) as IFeedbackBody;
		const user = context.get("user");

		const response = await handleChatCompletionFeedbackSubmission({
			env: context.env as IEnv,
			request: body,
			user,
			completion_id,
		});

		return context.json({
			response,
		});
	},
);

export default app;
