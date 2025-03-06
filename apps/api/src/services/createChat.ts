import { processPromptCoachMode } from "../lib/chat";
import { returnCoachingPrompt } from "../lib/prompts";
import type { IFunctionResponse, IRequest, MessageContent } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { processChatRequest } from "./chat/core";
import { ChatHistory } from "../lib/history";

export const handleCreateChat = async (
	req: IRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { env, request, user, appUrl } = req;

	if (!request?.chat_id || !request?.input) {
		throw new AssistantError(
			"Invalid request: Missing required parameters",
			ErrorType.PARAMS_ERROR,
		);
	}

	const prompt =
		typeof request.input === "object" ? request.input.prompt : request.input;
	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		platform: request.platform || "api",
		shouldSave: request.shouldSave ?? request.mode !== "local",
	});
	const { userMessage, currentMode, additionalMessages } =
		await processPromptCoachMode(request, chatHistory);
	const finalMessage =
		typeof userMessage === "string"
			? userMessage
			: currentMode === "prompt_coach"
				? userMessage
				: prompt;

	const messageContent: MessageContent[] = [
		{
			type: "text",
			text:
				typeof finalMessage === "string" ? finalMessage : finalMessage.prompt,
		},
	];

	if (request.attachments?.length) {
		messageContent.push(
			...request.attachments.map((attachment) => ({
				type: "image_url" as const,
				image_url: { url: attachment.url },
			})),
		);
	}

	const systemPrompt =
		currentMode === "prompt_coach" ? await returnCoachingPrompt() : undefined;

	const result = await processChatRequest({
		env,
		messages: [
			...additionalMessages,
			{
				role: request.role || "user",
				content: messageContent,
			},
		],
		chatId: request.chat_id,
		model: request.model,
		systemPrompt,
		responseMode: request.responseMode,
		useRAG: request.useRAG,
		ragOptions: request.ragOptions,
		shouldSave: request.shouldSave ?? request.mode !== "local",
		platform: request.platform,
		budgetConstraint: request.budgetConstraint,
		temperature: request.temperature,
		max_tokens: request.max_tokens,
		top_p: request.top_p,
		user,
		appUrl,
		mode: currentMode || request.mode,
	});

	if ("validation" in result) {
		return [
			{
				name: `guardrail_${result.validation}_validation`,
				content: result.error,
				status: "error",
				data: {
					violations: result.violations,
					rawViolations: result.rawViolations,
				},
			},
		];
	}

	if (request.mode === "local") {
		return [
			{
				name: "local_message",
				content:
					typeof finalMessage === "string" ? finalMessage : finalMessage.prompt,
				status: "success",
			},
		];
	}

	return [
		{
			role: "assistant",
			content: result.response.response,
			citations: result.response.citations || null,
			logId: env.AI.aiGatewayLogId || result.response.logId,
			mode: currentMode || "normal",
			id: Math.random().toString(36).substring(2, 7),
			timestamp: Date.now(),
			model: request.model,
			platform: request.platform || "api",
		},
	];
};
