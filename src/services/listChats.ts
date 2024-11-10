import type { IRequest } from '../types';
import { ChatHistory } from '../lib/history';

export const handleListChats = async (req: IRequest): Promise<KVNamespaceListResult<unknown, string>> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const list = await chatHistory.list();

	return list;
};
