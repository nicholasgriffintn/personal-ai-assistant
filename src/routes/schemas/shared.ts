import { z } from "zod";

export const messageSchema = z.object({
	role: z.enum(["user", "assistant", "tool"]),
	name: z.string().optional(),
	tool_calls: z.array(z.record(z.any())).optional(),
	parts: z.array(z.object({ text: z.string() })).optional(),
	content: z.string(),
	status: z.string().optional(),
	data: z.record(z.any()).optional(),
	model: z.string().optional(),
	logId: z.string().optional(),
	citations: z.array(z.string()).optional(),
	app: z.string().optional(),
	mode: z.enum(["chat", "tool"]).optional(),
});
