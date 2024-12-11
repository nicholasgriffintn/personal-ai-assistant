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
	mode: z.enum(["normal", "local", "prompt_coach", "no_system"]).optional(),
	role: z.enum(["user", "assistant", "tool"]).optional(),
	useRAG: z.boolean().optional(),
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
	input: z.union([
		z.string().min(1, "input is required"),
		z.object({ prompt: z.string().min(1, "prompt is required") }),
	]),
	role: z.enum(["user", "assistant", "tool"]).optional(),
});

export const feedbackJsonSchema = z.object({
	logId: z.string().min(1, "logId is required"),
	feedback: z.string().min(1, "feedback is required"),
});
