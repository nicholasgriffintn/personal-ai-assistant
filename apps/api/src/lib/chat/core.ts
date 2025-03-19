import { getAIResponse, handleToolCalls } from ".";
import type {
	Attachment,
	ChatCompletionParameters,
	ChatRole,
	Message,
} from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { ConversationManager } from "../conversationManager";
import { Embedding } from "../embedding";
import { Guardrails } from "../guardrails";
import { ModelRouter } from "../modelRouter";
import { getModelConfig } from "../models";
import { getSystemPrompt } from "../prompts";
import { createStreamWithPostProcessing } from "./streaming";

type CoreChatOptions = ChatCompletionParameters & {
	isRestricted?: boolean;
};

export async function processChatRequest(options: CoreChatOptions) {
	const {
		platform = "api",
		app_url,
		system_prompt,
		env,
		user,
		disable_functions,
		completion_id = `chat_${Date.now()}`,
		messages,
		model: requestedModel,
		mode = "normal",
		should_think,
		response_format,
		use_rag,
		rag_options,
		response_mode,
		budget_constraint,
		location,
		lang,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
		n,
		stream = false,
		stop,
		logit_bias,
		metadata,
		reasoning_effort,
		store = true,
		isRestricted,
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
		system_prompt ||
		(systemPromptFromMessages?.content &&
			typeof systemPromptFromMessages.content === "string")
			? (systemPromptFromMessages.content as string)
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
		app_url,
		system_prompt: mode === "no_system" ? "" : systemMessage,
		env,
		user: user?.id ? user : undefined,
		disable_functions,
		completion_id,
		messages: chatMessages.filter((msg) => msg.role !== ("system" as ChatRole)),
		message: finalMessage,
		model: matchedModel,
		mode,
		should_think,
		response_format,
		lang,
		temperature,
		max_tokens,
		top_p,
		top_k,
		seed,
		repetition_penalty,
		frequency_penalty,
		presence_penalty,
		n,
		stream,
		stop,
		logit_bias,
		metadata,
		reasoning_effort,
		store,
	});

	if (stream && response instanceof ReadableStream) {
		// TODO: This definitely isn't fully implemented yet / not everything is being passed through / we should try to reuse
		const transformedStream = createStreamWithPostProcessing(
			response,
			{
				env,
				completion_id,
				model: matchedModel,
				platform,
				user,
				app_url,
				mode,
				isRestricted,
			},
			conversationManager,
		);

		return {
			stream: transformedStream,
			selectedModel: matchedModel,
			completion_id,
		};
	}

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
