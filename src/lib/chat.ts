import { AIProviderFactory } from "../providers/factory";
import { handleFunctions } from "../services/functions";
import type {
	ChatInput,
	ChatMode,
	GetAiResponseParams,
	IBody,
	IEnv,
	IRequest,
	Message,
} from "../types";
import { formatMessages } from "../utils/messages";
import type { ChatHistory } from "./history";
import { getModelConfigByMatchingModel } from "./models";

export const gatewayId = "llm-assistant";

export function getGatewayBaseUrl(env: IEnv): string {
	return `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${gatewayId}`;
}

export function getGatewayExternalProviderUrl(
	env: IEnv,
	provider: string,
): string {
	const supportedProviders = [
		"google-ai-studio",
		"openai",
		"anthropic",
		"grok",
		"huggingface",
		"perplexity-ai",
		"replicate",
		"mistral",
		"openrouter",
	];

	if (!supportedProviders.includes(provider)) {
		throw new Error(`The provider ${provider} is not supported`);
	}

	return `${getGatewayBaseUrl(env)}/${provider}`;
}

export async function getAIResponse({
	chatId,
	appUrl,
	model,
	systemPrompt,
	messages,
	message,
	env,
	user,
	mode = "normal",
	temperature,
	max_tokens,
	top_p,
}: GetAiResponseParams) {
	if (!model) {
		throw new Error("Model is required");
	}

	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(
		modelConfig?.provider || "workers",
	);

	const filteredMessages =
		mode === "normal"
			? messages.filter((msg) => !msg.mode || msg.mode === "normal")
			: messages;

	const formattedMessages = formatMessages(
		provider.name,
		filteredMessages,
		systemPrompt,
		model,
	);

	return provider.getResponse({
		chatId,
		appUrl,
		model,
		systemPrompt,
		messages: formattedMessages,
		message,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
	});
}

export const processPromptCoachMode = async (
	request: IBody,
	chatHistory: ChatHistory,
): Promise<{
	userMessage: ChatInput;
	currentMode: ChatMode;
	additionalMessages: Message[];
}> => {
	const modeWithFallback = request.mode || "normal";

	if (modeWithFallback === "no_system") {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	if (
		modeWithFallback !== "prompt_coach" ||
		(typeof request.input === "string" &&
			request.input.toLowerCase() !== "use this prompt")
	) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const messageHistory = await chatHistory.get(request.chat_id);
	const lastAssistantMessage = messageHistory
		.reverse()
		.find((msg) => msg.role === "assistant")?.content;

	if (!lastAssistantMessage || typeof lastAssistantMessage !== "string") {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const match =
		/<revised_prompt>([\s\S]*?)(?=<\/revised_prompt>|suggestions|questions)/i.exec(
			lastAssistantMessage,
		);
	if (!match) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const userMessage = match[1].trim();
	await chatHistory.add(request.chat_id, {
		role: "user",
		content: userMessage,
		mode: "normal",
	});

	return {
		userMessage,
		currentMode: "normal",
		additionalMessages: [{ role: "assistant", content: userMessage }],
	};
};

export const handleToolCalls = async (
	chatId: string,
	modelResponse: any,
	chatHistory: ChatHistory,
	req: IRequest,
) => {
	const functionResults = [];
	const modelResponseLogId = req.env.AI.aiGatewayLogId;

	const toolMessage = await chatHistory.add(chatId, {
		role: "assistant",
		name: "External Functions",
		tool_calls: modelResponse.tool_calls,
		logId: modelResponseLogId || undefined,
		content: "",
	});
	functionResults.push(toolMessage);

	for (const toolCall of modelResponse.tool_calls || []) {
		const functionName = toolCall.name || toolCall.function?.name;
		const rawArgs = toolCall.arguments || toolCall.function?.arguments;
		const functionArgs =
			typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

		try {
			const result = await handleFunctions(
				chatId,
				req.appUrl,
				functionName,
				functionArgs,
				req,
			);
			const message = await chatHistory.add(chatId, {
				role: "assistant",
				name: functionName,
				content: result.content || "",
				status: result.status,
				data: result.data,
				logId: modelResponseLogId || undefined,
			});
			functionResults.push(message);
		} catch (e) {
			console.error(e);
			functionResults.push({
				role: "assistant",
				name: toolCall.name,
				content: "Error",
				status: "error",
				logId: modelResponseLogId || undefined,
			});
		}
	}

	return functionResults;
};
