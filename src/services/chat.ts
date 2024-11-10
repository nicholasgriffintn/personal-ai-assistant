import { IRequest } from '../types';
import { ChatHistory } from '../lib/history';
import { chatSystemPrompt } from '../lib/prompts';
import { getMatchingModel } from '../lib/models';

export const handleChat = async (req: IRequest): Promise<string> => {
	const { request, env } = req;

	if (!request.chat_id || !request.input) {
		throw new Error('Missing chat_id or input');
	}

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	await chatHistory.add(request.chat_id, request.input);

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
		...userMessages.map((message) => ({
			role: 'user',
			content: message,
		})),
	];

	const model = getMatchingModel(request.model);

	if (!model) {
		throw new Error('Invalid model');
	}

	const modelResponse = await env.AI.run(
		model,
		{ messages },
		{
			gateway: {
				id: 'llm-assistant',
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);

	if (!modelResponse.response) {
		throw new Error('No response from model');
	}

	return modelResponse.response;
};
