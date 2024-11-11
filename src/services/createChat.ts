import type { IRequest } from '../types';
import { ChatHistory } from '../lib/history';
import { chatSystemPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';
import { availableFunctions, handleFunctions } from './functions';

export const handleCreateChat = async (req: IRequest): Promise<string> => {
	const { request, env } = req;

	if (!request) {
		throw new Error('Missing request');
	}

	if (!request.chat_id || !request.input) {
		throw new Error('Missing chat_id or input');
	}

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
	}

	const model = getMatchingModel(request.model);

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY, model);
	await chatHistory.add(request.chat_id, {
		role: 'user',
		content: request.input,
	});

	const systemPrompt = chatSystemPrompt(request);

	const userMessages = await chatHistory.get(request.chat_id);

	if (userMessages.length < 0) {
		throw new Error('No messages found');
	}

	const messages = [
		{
			role: 'system',
			content: systemPrompt,
		},
		...userMessages,
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

	if (modelResponse.tool_calls) {
		await chatHistory.add(request.chat_id, {
			role: 'assistant',
			name: 'External Functions',
			tool_calls: modelResponse.tool_calls,
		});

		const functionResults = [];

		for (const toolCall of modelResponse.tool_calls) {
			try {
				const result = await handleFunctions(toolCall.name, toolCall.arguments, req);

				functionResults.push(result);

				await chatHistory.add(request.chat_id, {
					role: 'assistant',
					name: toolCall.name,
					content: result,
				});
			} catch (e) {
				console.error(e);
				throw new Error('Error handling function');
			}
		}

		return functionResults.join('\n');
	}

	if (!modelResponse.response) {
		throw new Error('No response from model');
	}

	await chatHistory.add(request.chat_id, {
		role: 'assistant',
		content: modelResponse.response,
	});

	return modelResponse.response;
};
