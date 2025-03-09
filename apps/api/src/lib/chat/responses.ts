import { AIProviderFactory } from "../../providers/factory";
import type { GetAiResponseParams } from "../../types";
import { formatMessages } from "../../utils/messages";
import { getModelConfigByMatchingModel } from "../models";

export async function getAIResponse({
	completion_id,
	appUrl,
	model,
	systemPrompt,
	messages,
	message,
	env,
	user,
	mode = "normal",
	temperature,
	max_tokens,
	top_p,
}: GetAiResponseParams) {
	if (!model) {
		throw new Error("Model is required");
	}

	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(
		modelConfig?.provider || "workers-ai",
	);

	const filteredMessages =
		mode === "normal"
			? messages.filter((msg) => !msg.mode || msg.mode === "normal")
			: messages;

	const formattedMessages = formatMessages(
		provider.name,
		filteredMessages,
		systemPrompt,
		model,
	);

	const response = await provider.getResponse({
		completion_id,
		appUrl,
		model,
		systemPrompt,
		messages: formattedMessages,
		message,
		env,
		user,
		temperature,
		max_tokens,
		top_p,
	});

	return response;
}
