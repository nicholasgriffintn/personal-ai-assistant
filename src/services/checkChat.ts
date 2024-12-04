import type { IRequest, IFunctionResponse } from '../types';
import { AppError } from '../utils/errors';
import { Guardrails } from '../lib/guardrails';
import { ChatHistory } from '../lib/history';

export const handleCheckChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env } = req;

	if (!env.AI) {
		throw new AppError('Missing AI binding', 400);
	}

	if (!env.CHAT_HISTORY) {
		throw new AppError('Missing chat history', 400);
	}

	if (!request) {
		throw new AppError('Missing request', 400);
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const messageHistory = (await chatHistory.get(request.chat_id)) || [];

	if (!messageHistory.length) {
		throw new AppError('No messages found', 400);
	}

	const messageHistoryAsString = messageHistory
		.filter((message) => message.content && message.status !== 'error')
		.map((message) => {
			return `${message.role}: ${message.content}`;
		})
		.join('\\n');

	const role = request.role || 'user';

	const guardrails = Guardrails.getInstance(env);
	const validation =
		role === 'user' ? await guardrails.validateInput(messageHistoryAsString) : await guardrails.validateOutput(messageHistoryAsString);

	return {
		content: validation.isValid
			? `${role === 'user' ? 'Input' : 'Output'} is valid`
			: `${role === 'user' ? 'Input' : 'Output'} is not valid`,
		data: validation,
	};
};
