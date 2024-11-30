import type { IRequest, IFunctionResponse, Model } from '../types';
import { ChatHistory } from '../lib/history';
import { getSystemPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { handleFunctions } from './functions';
import { getAIResponse } from '../lib/chat';

export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { appUrl, request, env, user } = req;

	if (!request) {
		console.warn('Missing request');
		return {
			status: 'error',
			content: 'Missing request',
		};
	}

	if (!request.chat_id || !request.input) {
		console.warn('Missing chat_id or input');
		return {
			status: 'error',
			content: 'Missing chat_id or input',
		};
	}

	if (!env.CHAT_HISTORY) {
		console.error('Missing chat history');
		return {
			status: 'error',
			content: 'Missing chat history',
		};
	}

	const platform = request.platform || 'api';

	const model = getMatchingModel(request.model);

	if (!model) {
		console.warn('No matching model found');
		return {
			status: 'error',
			content: 'No matching model found',
		};
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY, model, platform);

	if (request.mode === 'local') {
		const message = await chatHistory.add(request.chat_id, {
			role: request.role,
			content: request.input,
		});
		return [message];
	}

	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: request.input,
	});

	const systemPrompt = getSystemPrompt(request, model, user);

	const messageHistory = await chatHistory.get(request.chat_id);

	if (!messageHistory.length) {
		console.warn('No messages found');
		return {
			status: 'error',
			content: 'No messages found',
		};
	}

	const modelResponse = await getAIResponse({
		chatId: request.chat_id,
		appUrl,
		model,
		systemPrompt,
		messages: messageHistory,
		message: request.input,
		env,
		user,
	});
	const modelResponseLogId = env.AI.aiGatewayLogId;

	if (modelResponse.tool_calls) {
		const functionResults = [];

		const toolMessage = await chatHistory.add(request.chat_id, {
			role: 'assistant',
			name: 'External Functions',
			tool_calls: modelResponse.tool_calls,
			logId: modelResponseLogId,
			content: '',
		});

		functionResults.push(toolMessage);

		for (const toolCall of modelResponse.tool_calls) {
			try {
				const result = await handleFunctions(request.chat_id, appUrl, toolCall.name, toolCall.arguments, req);

				const message = await chatHistory.add(request.chat_id, {
					role: 'assistant',
					name: toolCall.name,
					content: result.content,
					status: result.status,
					data: result.data,
					logId: modelResponseLogId,
				});
				functionResults.push(message);
			} catch (e) {
				console.error(e);
				functionResults.push({
					role: 'assistant',
					name: toolCall.name,
					content: 'Error',
					status: 'error',
					logId: modelResponseLogId,
				});
			}
		}

		return functionResults;
	}

	if (!modelResponse.response) {
		console.error('No response from the model', modelResponse);
		return {
			status: 'error',
			content: 'No response from the model',
		};
	}

	const message = await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		citations: modelResponse.citations || [],
		logId: modelResponseLogId,
	});

	return [message];
};
