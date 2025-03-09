import type { Message, IBody, ChatInput, ChatMode } from "../../types";
import type { ChatHistory } from "../history";

export const processPromptCoachMode = async (
	request: IBody,
	chatHistory: ChatHistory,
): Promise<{
	userMessage: ChatInput;
	currentMode: ChatMode;
	additionalMessages: Message[];
}> => {
	if (!request || !chatHistory) {
		throw new Error("Invalid input: request and chatHistory are required");
	}

	const modeWithFallback = request.mode || "normal";

	const isNoSystemMode = modeWithFallback === "no_system";
	const isNotPromptCoachMode =
		modeWithFallback !== "prompt_coach" ||
		(typeof request.input === "string" &&
			request.input.toLowerCase() !== "use this prompt");

	if (isNoSystemMode || isNotPromptCoachMode) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const messageHistory = await chatHistory.get(request.completion_id);
	const lastAssistantMessage = messageHistory
		.slice()
		.reverse()
		.find((msg) => msg.role === "assistant")?.content;

	if (!lastAssistantMessage || typeof lastAssistantMessage !== "string") {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const promptRegex =
		/<revised_prompt>([\s\S]*?)(?=<\/revised_prompt>|suggestions|questions)/i;
	const match = promptRegex.exec(lastAssistantMessage);

	if (!match) {
		return {
			userMessage: request.input,
			currentMode: modeWithFallback,
			additionalMessages: [],
		};
	}

	const userMessage = match[1].trim();
	await chatHistory.add(request.completion_id, {
		role: "user",
		content: userMessage,
		mode: "normal",
	});

	return {
		userMessage,
		currentMode: "normal",
		additionalMessages: [{ role: "assistant", content: userMessage }],
	};
};
