import { AIProviderFactory } from "../../providers/factory";
import type { ChatCompletionParameters, Message } from "../../types";
import { formatMessages } from "../../utils/messages";
import { getModelConfigByMatchingModel } from "../models";
import { mergeParametersWithDefaults } from "./parameters";

export async function getAIResponse({
	app_url,
	system_prompt,
	env,
	user,
	mode = "normal",
	model,
	messages,
	message,
	...params
}: ChatCompletionParameters) {
	if (!model) {
		throw new Error("Model is required");
	}

	const modelConfig = getModelConfigByMatchingModel(model);
	const provider = AIProviderFactory.getProvider(
		modelConfig?.provider || "workers-ai",
	);

	const filteredMessages =
		mode === "normal"
			? messages.filter((msg: Message) => !msg.mode || msg.mode === "normal")
			: messages;

	const formattedMessages = formatMessages(
		provider.name,
		filteredMessages,
		system_prompt,
		model,
	);

	const parameters = mergeParametersWithDefaults({
		...params,
		model,
		messages: formattedMessages,
		message,
		mode,
		app_url,
		system_prompt,
		env,
		user,
	});

	const response = await provider.getResponse(parameters);

	return response;
}
