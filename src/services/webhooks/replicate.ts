import type { IRequest } from '../../types';
import { ChatHistory } from '../../lib/history';

export const handleReplicateWebhook = async (req: IRequest, id: string): Promise<{}[]> => {
	const { env, request } = req;

	if (!env.CHAT_HISTORY) {
		throw new Error('Missing CHAT_HISTORY binding');
	}

	if (!id) {
		throw new Error('Missing id');
	}

	if (!request) {
		throw new Error('Missing request');
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const item = await chatHistory.get(id);

	if (!item?.length) {
		throw new Error('Item not found');
	}

	const matchingMessage = item.find((message) => message?.data?.id === request?.id);

	if (!matchingMessage) {
		throw new Error('Message not found');
	}

	const updatedMessage = {
		...matchingMessage,
		data: {
			...matchingMessage.data,
			...request,
		},
	};

	const messages = item.map((message) => {
		if (message?.data?.id === request?.id) {
			return updatedMessage;
		}

		return message;
	});

	await chatHistory.update(id, messages);

	return item;
};
