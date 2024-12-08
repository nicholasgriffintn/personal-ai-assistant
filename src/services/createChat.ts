import type { IRequest, IFunctionResponse, MessageContent } from '../types';
import { ChatHistory } from '../lib/history';
import { getSystemPrompt, returnCoachingPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { getAIResponse, handleToolCalls, processPromptCoachMode } from '../lib/chat';
import { AppError } from '../utils/errors';
import { Guardrails } from '../lib/guardrails';
import { Embedding } from '../lib/embedding';

export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { appUrl, request, env, user } = req;
	const guardrails = Guardrails.getInstance(env);
	const embedding = Embedding.getInstance(env);

	if (!request?.chat_id || !request?.input || !env.CHAT_HISTORY) {
		throw new AppError('Missing chat_id or input or chat history', 400);
	}

	const messageContent: MessageContent[] = [];

	if (typeof request.input === 'string') {
		messageContent.push({
			type: 'text',
			text: request.input,
		});
	} else {
		messageContent.push({
			type: 'text',
			text: request.input.prompt,
		});
	}

	if (request.attachments?.length) {
		for (const attachment of request.attachments) {
			if (attachment.type === 'image') {
				messageContent.push({
					type: 'image_url',
					image_url: {
						url: attachment.url,
					},
				});
			} else if (attachment.type === 'audio') {
				messageContent.push({
					type: 'audio_url',
					audio_url: {
						url: attachment.url,
					},
				});
			}
		}
	}

	const platform = request.platform || 'api';
	const model = getMatchingModel(request.model);

	if (!model) {
		throw new AppError('No matching model found', 400);
	}

	const inputValidation = await guardrails.validateInput(messageContent.find((content) => content.type === 'text')?.text || '');
	if (!inputValidation.isValid) {
		return [
			{
				name: 'guardrail_validation',
				content: inputValidation.rawResponse?.blockedResponse || 'I cannot respond to that.',
				status: 'error',
				data: {
					violations: inputValidation.violations,
				},
			},
		];
	}

	const shouldSave = request.shouldSave ?? request.mode !== 'local';
	const chatHistory = ChatHistory.getInstance({ history: env.CHAT_HISTORY, model, platform, shouldSave });

	const messageInput = {
		role: request.role || 'user',
		content: messageContent,
	};
	if (request.mode === 'local') {
		const message = await chatHistory.add(request.chat_id, messageInput);
		return [message];
	}

	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: messageContent,
		mode: request.mode,
	});

	const { userMessage, currentMode, additionalMessages } = await processPromptCoachMode(request, chatHistory);

	let finalMessage =
		currentMode === 'prompt_coach' ? userMessage : typeof request.input === 'string' ? request.input : request.input.prompt;
	const formattedFinalMessage = typeof finalMessage === 'string' ? finalMessage : finalMessage.prompt;

	if (request.useRAG === true && currentMode !== 'prompt_coach') {
		finalMessage = await embedding.augmentPrompt(formattedFinalMessage, request.ragOptions);
	}

	messageContent[0] = {
		type: 'text',
		text: formattedFinalMessage,
	};

	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: messageContent,
		mode: request.mode,
	});

	const messageHistory = await chatHistory.get(request.chat_id, messageInput);
	// TODO: The RAG configuration isn't great, it's not being added and this is a bit messy
	if (!messageHistory.length) {
		throw new AppError('No messages found', 400);
	}

	let systemPrompt = '';
	if (currentMode === 'prompt_coach') {
		systemPrompt = await returnCoachingPrompt();
	} else if (currentMode !== 'no_system') {
		systemPrompt = getSystemPrompt(request, model, user);
	}

	const modelResponse = await getAIResponse({
		chatId: request.chat_id,
		appUrl,
		model,
		systemPrompt,
		messages: [...additionalMessages, ...messageHistory],
		message: formattedFinalMessage,
		env,
		user,
		mode: currentMode,
		temperature: request?.temperature,
		max_tokens: request?.max_tokens,
		top_p: request?.top_p,
		top_k: request?.top_k,
		seed: request?.seed,
		repetition_penalty: request.repetition_penalty,
		frequency_penalty: request?.frequency_penalty,
		presence_penalty: request?.presence_penalty,
	});

	if (modelResponse.tool_calls) {
		return await handleToolCalls(request.chat_id, modelResponse, chatHistory, req);
	}

	if (!modelResponse.response) {
		throw new AppError('No response from the model', 400);
	}

	const outputValidation = await guardrails.validateOutput(modelResponse.response);
	if (!outputValidation.isValid) {
		return [
			{
				name: 'guardrail_validation',
				content: outputValidation.rawResponse?.blockedResponse || 'Sorry, the AI response was blocked.',
				status: 'error',
				data: {
					violations: inputValidation.violations,
				},
			},
		];
	}

	const message = await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		citations: modelResponse.citations || null,
		logId: env.AI.aiGatewayLogId || modelResponse.logId,
		mode: currentMode || 'normal',
	});

	return [message];
};
