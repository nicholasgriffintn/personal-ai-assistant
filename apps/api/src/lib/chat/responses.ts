import { AIProviderFactory } from "~/providers/factory";
import type { ChatCompletionParameters, Message } from "~/types";
import { formatMessages } from "~/utils/messages";
import { getModelConfigByMatchingModel } from "../models";
import { mergeParametersWithDefaults } from "./parameters";

export async function getAIResponse({
	app_url,
	system_prompt,
	env,
	user,
	mode,
	model,
	messages,
	message,
	enabled_tools,
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

	let shouldStream = false;
	// TODO: To make life easier, we are only enabling streaming for mistral and text models, we should expand this over time
	if (
		params.stream &&
		provider.name === "mistral" &&
		modelConfig.type.length === 1 &&
		modelConfig.type[0] === "text"
	) {
		shouldStream = true;
	}

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
		stream: shouldStream,
		enabled_tools,
	});

	const response = await provider.getResponse(parameters);

	return response;
}
