import z from "zod";

export const getChatParamsSchema = z.object({
	id: z.string(),
});

export const createChatJsonSchema = z.object({
	chat_id: z.string().min(1, "chat_id is required"),
	input: z.union([
		z.string().min(1, "input is required"),
		z.object({ prompt: z.string().min(1, "prompt is required") }),
	]),
	attachments: z
		.array(
			z.object({
				type: z.literal("image"),
				url: z.string().min(1, "url is required"),
				detail: z.enum(["low", "high"]).optional(),
			}),
		)
		.optional(),
	date: z.string().optional(),
	location: z
		.object({
			latitude: z.number().optional(),
			longitude: z.number().optional(),
		})
		.optional(),
	model: z.string().optional(),
	platform: z.enum(["web", "mobile", "api"]).optional(),
	mode: z
		.enum(["normal", "local", "remote", "prompt_coach", "no_system"])
		.optional(),
	role: z.enum(["user", "assistant", "tool"]).optional(),
	useRAG: z.boolean().optional(),
	ragOptions: z.object({
		topK: z.number().optional(),
		scoreThreshold: z.number().optional(),
		includeMetadata: z.boolean().optional(),
		type: z.string().optional(),
		namespace: z.string().optional(),
	}).optional(),
	shouldSave: z.boolean().optional(),
	budgetConstraint: z.number().optional(),
	temperature: z.number().optional(),
	max_tokens: z.number().optional(),
	top_p: z.number().optional(),
	top_k: z.number().optional(),
	seed: z.number().optional(),
	repetition_penalty: z.number().optional(),
	frequency_penalty: z.number().optional(),
	presence_penalty: z.number().optional(),
});

export const transcribeFormSchema = z.object({
	audio: z.instanceof(Blob),
});

export const checkChatJsonSchema = z.object({
	chat_id: z.string().min(1, "chat_id is required"),
	role: z.enum(["user", "assistant", "tool"]).optional(),
});

export const feedbackJsonSchema = z.object({
	logId: z.string().min(1, "logId is required"),
	feedback: z.number(),
});

export const chatCompletionsJsonSchema = z.object({
	model: z.string().optional(),
	messages: z.array(
		z.object({
			role: z.enum(["system", "user", "assistant", "tool"]),
			content: z.union([
				z.string(),
				z.array(
					z.object({
						type: z.enum(["text", "image_url"]),
						text: z.string().optional(),
						image_url: z.object({
							url: z.string().url(),
							detail: z.enum(["auto", "low", "high"]).optional().default("auto"),
						}).optional(),
					})
				),
			]),
			name: z.string().optional(),
			tool_call_id: z.string().optional(),
			tool_calls: z.array(
				z.object({
					id: z.string(),
					type: z.literal("function"),
					function: z.object({
						name: z.string(),
						arguments: z.string(),
					}),
				})
			).optional(),
		})
	).min(1, "messages array must not be empty"),
	temperature: z.number().min(0).max(2).optional(),
	top_p: z.number().min(0).max(1).optional(),
	n: z.number().min(1).max(4).optional(),
	stream: z.boolean().optional(),
	stop: z.union([z.string(), z.array(z.string())]).optional(),
	max_tokens: z.number().optional(),
	presence_penalty: z.number().min(-2).max(2).optional(),
	frequency_penalty: z.number().min(-2).max(2).optional(),
	logit_bias: z.record(z.number()).optional(),
	user: z.string().optional(),
	tools: z.array(
		z.object({
			type: z.literal("function"),
			function: z.object({
				name: z.string(),
				description: z.string().optional(),
				parameters: z.record(z.any()),
			}),
		})
	).optional(),
	tool_choice: z.union([
		z.literal("none"),
		z.literal("auto"),
		z.object({
			type: z.literal("function"),
			function: z.object({ name: z.string() }),
		}),
	]).optional(),
	chat_id: z.string().optional(),
	useRAG: z.boolean().optional(),
	ragOptions: z.object({
		topK: z.number().optional(),
		scoreThreshold: z.number().optional(),
		includeMetadata: z.boolean().optional(),
		type: z.string().optional(),
		namespace: z.string().optional(),
	}).optional(),
	shouldSave: z.boolean().optional(),
	platform: z.enum(["web", "mobile", "api"]).optional(),
	budgetConstraint: z.number().optional(),
});
