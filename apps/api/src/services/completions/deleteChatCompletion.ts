import { ChatHistory } from "../../lib/history";
import type { IEnv } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

export const handleDeleteChatCompletion = async ({
	env,
	completion_id,
}: {
	env: IEnv;
	completion_id: string;
}): Promise<{ success: boolean; message: string; completion_id: string }> => {
	if (!env.CHAT_HISTORY) {
		throw new AssistantError(
			"Missing CHAT_HISTORY binding",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	if (!completion_id) {
		throw new AssistantError(
			"Completion ID is required",
			ErrorType.PARAMS_ERROR,
		);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		store: true,
	});
	const item = await chatHistory.get(completion_id);

	if (!item) {
		throw new AssistantError("Completion not found", ErrorType.NOT_FOUND);
	}

	await env.CHAT_HISTORY.delete(completion_id);

	return {
		success: true,
		message: "Chat deleted successfully",
		completion_id,
	};
};
