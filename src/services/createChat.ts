import type { IRequest, IFunctionResponse } from '../types';
import { ChatHistory } from '../lib/history';
import { chatSystemPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { availableFunctions, handleFunctions } from './functions';

export const handleCreateChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!request) {
		throw new Error('Missing request');
	}

	if (!request.chat_id || !request.input) {
		throw new Error('Missing chat_id or input');
	}

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
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
		throw new Error('No messages found');
	}

	const messages = [
		{
			role: 'system',
			content: systemPrompt,
		},
		...cleanedMessageHistory,
	];

	if (!model) {
		throw new Error('Invalid model');
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

				functionResults.push(result);

				await chatHistory.add(request.chat_id, {
					role: 'assistant',
					name: toolCall.name,
					content: result.response,
					status: result.status,
					data: result.data,
					logId: modelResponseLogId,
				});
			} catch (e) {
				console.error(e);
				throw new Error('Error handling function');
			}
		}

		return functionResults;
	}

	if (!modelResponse.response) {
		throw new Error('No response from model');
	}

	await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
		logId: modelResponseLogId,
	});

	return modelResponse;
};
