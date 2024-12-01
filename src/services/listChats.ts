import type { IRequest } from '../types';
import { ChatHistory } from '../lib/history';
import { AppError } from '../utils/errors';

export const handleListChats = async (req: IRequest): Promise<KVNamespaceListResult<unknown, string>> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new AppError('Missing CHAT_HISTORY binding', 400);
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const list = await chatHistory.list();

	return list;
};
