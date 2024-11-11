import type { IRequest, IFunctionResponse } from '../types';
import { ChatHistory } from '../lib/history';
import { chatSystemPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { availableFunctions, handleFunctions } from './functions';

export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request) {
		return {
			status: 'error',
			content: 'Missing request',
		};
	}

	if (!request.chat_id || !request.input) {
		return {
			status: 'error',
			content: 'Missing chat_id or input',
		};
	}

	if (!env.CHAT_HISTORY) {
		return {
			status: 'error',
			content: 'Missing chat history',
		};
	}

	const platform = request.platform || 'api';

	const model = getMatchingModel(request.model);

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY, model, platform);
	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: request.input,
	});

	const systemPrompt = chatSystemPrompt(request, user);

	const messageHistory = await chatHistory.get(request.chat_id);
	const cleanedMessageHistory = messageHistory.filter((message) => message.content);

	if (cleanedMessageHistory.length < 0) {
		return {
			status: 'error',
			content: 'No messages found',
		};
	}

	const messages = [
		{
			role: 'system',
			content: systemPrompt,
		},
		...cleanedMessageHistory,
	];

	if (!model) {
		return {
			status: 'error',
			content: 'No model found',
		};
	}

	const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

	const modelResponse = await env.AI.run(
		model,
		{
			messages,
			tools: supportsFunctions ? availableFunctions : undefined,
		},
		{
			gateway: {
				id: 'llm-assistant',
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);
	const modelResponseLogId = env.AI.aiGatewayLogId;

	if (modelResponse.tool_calls) {
		await chatHistory.add(request.chat_id, {
			role: 'assistant',
			name: 'External Functions',
			tool_calls: modelResponse.tool_calls,
			logId: modelResponseLogId,
		});

		const functionResults = [];

		for (const toolCall of modelResponse.tool_calls) {
			try {
				const result = await handleFunctions(toolCall.name, toolCall.arguments, req);

				const message = {
					role: 'assistant',
					name: toolCall.name,
					content: result.content,
					status: result.status,
					data: result.data,
					logId: modelResponseLogId,
				};

				functionResults.push(message);
				await chatHistory.add(request.chat_id, message);
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
		return {
			status: 'error',
			content: 'No response from the model',
		};
	}

	const message = {
		role: 'assistant',
		content: modelResponse.response,
		logId: modelResponseLogId,
	};
	await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		logId: modelResponseLogId,
	});

	return [message];
};
