import { Guardrails } from "../lib/guardrails";
import { ChatHistory } from "../lib/history";
import type { IFunctionResponse, IRequest } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export const handleCheckChat = async (
	req: IRequest,
): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env } = req;

	if (!env.AI) {
		throw new AssistantError("Missing AI binding", ErrorType.PARAMS_ERROR);
	}

	if (!env.CHAT_HISTORY) {
		throw new AssistantError("Missing chat history", ErrorType.PARAMS_ERROR);
	}

	if (!request) {
		throw new AssistantError("Missing request", ErrorType.PARAMS_ERROR);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		shouldSave: true,
	});
	const messageHistory = (await chatHistory.get(request.chat_id)) || [];

	if (!messageHistory.length) {
		throw new AssistantError("No messages found", ErrorType.PARAMS_ERROR);
	}

	const messageHistoryAsString = messageHistory
		.filter((message) => message.content && message.status !== "error")
		.map((message) => {
			return `${message.role}: ${message.content}`;
		})
		.join("\\n");

	const role = request.role || "user";

	const guardrails = Guardrails.getInstance(env);
	const validation =
		role === "user"
			? await guardrails.validateInput(messageHistoryAsString)
			: await guardrails.validateOutput(messageHistoryAsString);

	return {
		content: validation.isValid
			? `${role === "user" ? "Input" : "Output"} is valid`
			: `${role === "user" ? "Input" : "Output"} is not valid`,
		data: validation,
	};
};
