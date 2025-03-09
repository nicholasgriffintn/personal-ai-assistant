import { Guardrails } from "../../lib/guardrails";
import { ChatHistory } from "../../lib/history";
import type { IFunctionResponse, IEnv } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";

export const handleCheckChatCompletion = async ({
	env,
	completion_id,
	role,
}: {
	env: IEnv;
	completion_id: string;
	role: string;
}): Promise<IFunctionResponse | IFunctionResponse[]> => {
	if (!env.AI) {
		throw new AssistantError("Missing AI binding", ErrorType.PARAMS_ERROR);
	}

	if (!env.CHAT_HISTORY) {
		throw new AssistantError("Missing chat history", ErrorType.PARAMS_ERROR);
	}

	if (!completion_id || !role) {
		throw new AssistantError("Missing completion_id or role", ErrorType.PARAMS_ERROR);
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		store: true,
	});

	const messageHistory = (await chatHistory.get(completion_id)) || [];

	if (!messageHistory.length) {
		throw new AssistantError("No messages found", ErrorType.PARAMS_ERROR);
	}

	const messageHistoryAsString = messageHistory
		.filter((message) => message.content && message.status !== "error")
		.map((message) => {
			return `${message.role}: ${message.content}`;
		})
		.join("\\n");

	const roleToCheck = role || "user";

	const guardrails = Guardrails.getInstance(env);
	const validation =
		roleToCheck === "user"
			? await guardrails.validateInput(messageHistoryAsString)
			: await guardrails.validateOutput(messageHistoryAsString);

	return {
		content: validation.isValid
			? `${roleToCheck === "user" ? "Input" : "Output"} is valid`
			: `${roleToCheck === "user" ? "Input" : "Output"} is not valid`,
		data: validation,
	};
};
