import {
	getAIResponse,
	handleToolCalls,
	processPromptCoachMode,
} from "../lib/chat";
import { Embedding } from "../lib/embedding";
import { Guardrails } from "../lib/guardrails";
import { ChatHistory } from "../lib/history";
import { getMatchingModel } from "../lib/models";
import { getSystemPrompt, returnCoachingPrompt } from "../lib/prompts";
import type { IFunctionResponse, IRequest, MessageContent } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { ModelRouter } from "../lib/modelRouter";

export const handleCreateChat = async (
	req: IRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	if (!req.request?.chat_id || !req.request?.input || !req.env.CHAT_HISTORY) {
		throw new AssistantError(
			"Invalid request: Missing required parameters",
			ErrorType.PARAMS_ERROR,
		);
	}

	const { appUrl, request, env, user } = req;
	const guardrails = Guardrails.getInstance(env);
	const embedding = Embedding.getInstance(env);

	if (!request?.chat_id || !request?.input || !env.CHAT_HISTORY) {
		throw new AssistantError(
			"Missing chat_id or input or chat history",
			ErrorType.PARAMS_ERROR,
		);
	}

	const prompt =
		typeof request.input === "object" ? request.input.prompt : request.input;

	const messageContent: MessageContent[] = [
		{
			type: "text",
			text:
				request.useRAG === true
					? await embedding.augmentPrompt(prompt, request.ragOptions)
					: prompt,
		},
	];

	if (request.attachments?.length) {
		const attachmentProcessors = {
			image: (url: string): MessageContent => ({
				type: "image_url" as const,
				image_url: { url },
			}),
			audio: (url: string): MessageContent => ({
				type: "audio_url" as const,
				audio_url: { url },
			}),
		};

		messageContent.push(
			...request.attachments
				.filter((attachment) => attachmentProcessors[attachment.type])
				.map((attachment) =>
					attachmentProcessors[attachment.type](attachment.url),
				),
		);
	}

	const selectedModel =
		request.model ||
		(await ModelRouter.selectModel(
			env,
			prompt,
			request.attachments,
			request.budgetConstraint,
		));

	const model = getMatchingModel(selectedModel);
	if (!model) {
		throw new AssistantError(
			`No matching model found for: ${selectedModel}`,
			ErrorType.PARAMS_ERROR,
		);
	}

	const inputValidation = await guardrails.validateInput(
		messageContent.find((content) => content.type === "text")?.text || "",
	);

	if (!inputValidation.isValid) {
		return [
			{
				name: "guardrail_validation",
				content:
					inputValidation.rawResponse?.blockedResponse ||
					"Input did not pass safety checks",
				status: "error",
				data: {
					violations: inputValidation.violations,
					rawViolations: inputValidation.rawResponse,
				},
			},
		];
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		model,
		platform: request.platform || "api",
		shouldSave: request.shouldSave ?? request.mode !== "local",
	});

	const messageInput = {
		role: request.role || "user",
		content: messageContent,
	};

	if (request.mode === "local") {
		const message = await chatHistory.add(request.chat_id, {
			role: request.role || "user",
			content: messageContent,
		});
		return [message];
	}

	await chatHistory.add(request.chat_id, {
		role: "user",
		content: messageContent,
		mode: request.mode,
	});

	const { userMessage, currentMode, additionalMessages } =
		await processPromptCoachMode(request, chatHistory);

	let finalMessage = currentMode === "prompt_coach" ? userMessage : prompt;
	if (typeof finalMessage === "object") {
		finalMessage = finalMessage.prompt;
	}

	messageContent[0] = {
		type: "text",
		text: finalMessage,
	};

	await chatHistory.add(request.chat_id, {
		role: "user",
		content: messageContent,
		mode: request.mode,
	});

	const messageHistory = await chatHistory.get(request.chat_id, messageInput);
	// TODO: The RAG configuration isn't great, it's not being added and this is a bit messy
	if (!messageHistory.length) {
		throw new AssistantError("No messages found", ErrorType.PARAMS_ERROR);
	}

	let systemPrompt = "";
	if (currentMode === "prompt_coach") {
		systemPrompt = await returnCoachingPrompt();
	} else if (currentMode !== "no_system") {
		systemPrompt = getSystemPrompt(request, model, user);
	}

	const modelResponse = await getAIResponse({
		...req,
		chatId: request.chat_id,
		model,
		systemPrompt:
			currentMode === "prompt_coach"
				? await returnCoachingPrompt()
				: currentMode !== "no_system"
					? getSystemPrompt(request, model, user)
					: "",
		messages: [...additionalMessages, ...messageHistory],
		message: finalMessage,
		mode: currentMode,
	});

	if (modelResponse.tool_calls?.length > 0) {
		return await handleToolCalls(
			request.chat_id,
			modelResponse,
			chatHistory,
			req,
		);
	}

	if (!modelResponse.response) {
		throw new AssistantError(
			"No response from the model",
			ErrorType.PARAMS_ERROR,
		);
	}

	if (!modelResponse.response) {
		throw new AssistantError(
			"No response generated by the model",
			ErrorType.PARAMS_ERROR,
		);
	}

	const outputValidation = await guardrails.validateOutput(
		modelResponse.response,
	);
	if (!outputValidation.isValid) {
		return [
			{
				name: "guardrail_output_validation",
				content:
					outputValidation.rawResponse?.blockedResponse ||
					"Response did not pass safety checks",
				status: "error",
				data: {
					violations: outputValidation.violations,
					rawViolations: outputValidation.rawResponse,
				},
			},
		];
	}

	const message = await chatHistory.add(request.chat_id, {
		role: "assistant",
		content: modelResponse.response,
		citations: modelResponse.citations || null,
		logId: env.AI.aiGatewayLogId || modelResponse.logId,
		mode: currentMode || "normal",
	});

	return [message];
};
