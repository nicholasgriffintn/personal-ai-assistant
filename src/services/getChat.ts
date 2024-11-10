import type { IRequest } from '../types';
import { ChatHistory } from '../lib/history';

export const handleGetChat = async (req: IRequest, id: string): Promise<{}[]> => {
	const { env } = req;

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const item = await chatHistory.get(id);

	return item;
};
