import { ChatHistory } from "../../lib/history";
import type { IRequest, Message } from "../../types";
import { AppError } from "../../utils/errors";

export const handleReplicateWebhook = async (
	req: IRequest,
	id: string,
): Promise<Message[]> => {
	const { env, request } = req;

	if (!env.CHAT_HISTORY) {
		throw new AppError("Missing CHAT_HISTORY binding", 400);
	}

	if (!request) {
		throw new AppError("Missing request", 400);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		shouldSave: true,
	});
	const item = await chatHistory.get(id);

	if (!item?.length) {
		throw new AppError("Item not found", 400);
	}

	const matchingMessage = item.find(
		(message) => message?.data?.id === request?.id,
	);

	if (!matchingMessage) {
		throw new AppError(
			`Message from ${id} with item id ${request?.id} not found`,
			400,
		);
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
