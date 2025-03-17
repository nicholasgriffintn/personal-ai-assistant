import { getAIResponse, handleToolCalls } from "../../lib/chat";
import { ConversationManager } from "../../lib/conversationManager";
import { Embedding } from "../../lib/embedding";
import { Guardrails } from "../../lib/guardrails";
import { ModelRouter } from "../../lib/modelRouter";
import { getModelConfig } from "../../lib/models";
import { getSystemPrompt } from "../../lib/prompts";
import type {
	Attachment,
	ChatMode,
	ChatRole,
	IEnv,
	IUser,
	Message,
	MessageContent,
	RagOptions,
	ResponseMode,
} from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

interface CoreChatOptions {
	env: IEnv;
	messages: Array<{
		role: ChatRole;
		content: string | MessageContent[];
	}>;
	completion_id?: string;
	model?: string;
	system_prompt?: string;
	response_mode?: ResponseMode;
	use_rag?: boolean;
	rag_options?: RagOptions;
	store?: boolean;
	platform?: "web" | "mobile" | "api";
	budget_constraint?: number;
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	user?: IUser;
	app_url?: string;
	mode?: ChatMode;
	isRestricted?: boolean;
	location?: { latitude: number; longitude: number };
	reasoning_effort?: "low" | "medium" | "high";
	should_think?: boolean;
	response_format?: Record<string, any>;
}

export async function processChatRequest(options: CoreChatOptions) {
	const {
		env,
		messages,
		completion_id = `chat_${Date.now()}`,
		model: requestedModel,
		response_mode,
		use_rag,
		rag_options,
		store = true,
		platform = "api",
		budget_constraint,
		temperature,
		max_tokens,
		top_p,
		user,
		app_url,
		mode,
		isRestricted,
		location,
		reasoning_effort,
		should_think,
		response_format,
	} = options;

	if (!env.DB) {
		throw new AssistantError(
			"Missing DB binding",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	const lastMessage = messages[messages.length - 1];
	const messageContent = Array.isArray(lastMessage.content)
		? lastMessage.content
		: [{ type: "text" as const, text: lastMessage.content as string }];

	const textContent = messageContent.find((c) => c.type === "text")?.text || "";
	const imageAttachments: Attachment[] = messageContent
		.filter(
			(
				c,
			): c is {
				type: "image_url";
				image_url: { url: string; detail?: "auto" | "low" | "high" };
			} => c.type === "image_url" && "image_url" in c && !!c.image_url,
		)
		.map((c) => ({
			type: "image",
			url: c.image_url.url,
			detail: c.image_url.detail === "auto" ? undefined : c.image_url.detail,
		}));

	const selectedModel =
		requestedModel ||
		(await ModelRouter.selectModel(
			env,
			textContent,
			imageAttachments,
			budget_constraint,
		));

	const modelConfig = getModelConfig(selectedModel);
	if (!modelConfig) {
		throw new AssistantError(
			`No matching model found for: ${selectedModel}`,
			ErrorType.PARAMS_ERROR,
		);
	}
	const matchedModel = modelConfig.matchingModel;

	const guardrails = Guardrails.getInstance(env);
	const embedding = Embedding.getInstance(env);
	const conversationManager = ConversationManager.getInstance({
		database: env.DB,
		userId: user?.id,
		model: matchedModel,
		platform,
		store,
	});

	const inputValidation = await guardrails.validateInput(textContent);
	if (!inputValidation.isValid) {
		return {
			validation: "input",
			error:
				inputValidation.rawResponse?.blockedResponse ||
				"Input did not pass safety checks",
			violations: inputValidation.violations,
			rawViolations: inputValidation.rawResponse,
		};
	}

	const finalMessage =
		use_rag === true
			? await embedding.augmentPrompt(textContent, rag_options)
			: textContent;

	const messageToStore: Message = {
		role: lastMessage.role,
		content: use_rag === true ? finalMessage : textContent,
		id: Math.random().toString(36).substring(2, 7),
		timestamp: Date.now(),
		model: matchedModel,
		platform: platform || "api",
	};
	await conversationManager.add(completion_id, messageToStore);

	if (imageAttachments.length > 0) {
		const attachmentMessage: Message = {
			role: lastMessage.role,
			content: "Attached images",
			data: { attachments: imageAttachments },
			id: Math.random().toString(36).substring(2, 7),
			timestamp: Date.now(),
			model: matchedModel,
			platform: platform || "api",
		};
		await conversationManager.add(completion_id, attachmentMessage);
	}

	const systemPromptFromMessages = messages.find(
		(message) => message.role === ("system" as ChatRole),
	);

	const systemMessage =
		systemPromptFromMessages?.content &&
		typeof systemPromptFromMessages.content === "string"
			? systemPromptFromMessages.content
			: getSystemPrompt(
					{
						completion_id: completion_id,
						input: textContent,
						model: matchedModel,
						date: new Date().toISOString().split("T")[0],
						response_mode: response_mode,
						location,
					},
					matchedModel,
					user?.id ? user : undefined,
				);

	const chatMessages = messages.map((msg, index) =>
		index === messages.length - 1 && use_rag
			? { ...msg, content: [{ type: "text" as const, text: finalMessage }] }
			: msg,
	);

	const response = await getAIResponse({
		env,
		completion_id,
		app_url,
		model: matchedModel,
		system_prompt: mode === "no_system" ? "" : systemMessage,
		messages: chatMessages.filter((msg) => msg.role !== ("system" as ChatRole)),
		message: finalMessage,
		temperature,
		max_tokens,
		top_p,
		user: user?.id ? user : undefined,
		reasoning_effort,
		should_think,
		response_format,
	});

	if (!response.response && !response.tool_calls) {
		throw new AssistantError(
			"No response generated by the model",
			ErrorType.PARAMS_ERROR,
		);
	}

	if (response.response) {
		const outputValidation = await guardrails.validateOutput(response.response);
		if (!outputValidation.isValid) {
			return {
				validation: "output",
				error:
					outputValidation.rawResponse?.blockedResponse ||
					"Response did not pass safety checks",
				violations: outputValidation.violations,
				rawViolations: outputValidation.rawResponse,
			};
		}
	}

	const toolResponses: Message[] = [];
	if (response.tool_calls?.length > 0) {
		if (isRestricted) {
			throw new AssistantError(
				"Tool usage requires authentication. Please provide a valid access token.",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const toolResults = await handleToolCalls(
			completion_id,
			response,
			conversationManager,
			{
				env,
				request: {
					completion_id: completion_id,
					input: finalMessage,
					model: matchedModel,
					date: new Date().toISOString().split("T")[0],
				},
				app_url,
				user: user?.id ? user : undefined,
			},
		);

		for (const result of toolResults) {
			toolResponses.push(result);
		}
	}

	await conversationManager.add(completion_id, {
		role: "assistant",
		content: response.response,
		citations: response.citations || null,
		log_id: env.AI.aiGatewayLogId || response.logId,
		mode,
		id: Math.random().toString(36).substring(2, 7),
		timestamp: Date.now(),
		model: matchedModel,
		platform: platform || "api",
	});

	return {
		response,
		toolResponses,
		selectedModel: matchedModel,
		completion_id,
	};
}
