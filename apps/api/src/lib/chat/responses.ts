import { AIProviderFactory } from "../../providers/factory";
import type { GetAiResponseParams } from "../../types";
import { formatMessages } from "../../utils/messages";
import { getModelConfigByMatchingModel } from "../models";

export async function getAIResponse({
	appUrl,
	systemPrompt,
	env,
	user,
	mode = "normal",
	completion_id,
	model,
	messages,
	message,
	temperature,
	top_p,
	n,
	stream,
	stop,
	max_tokens,
	presence_penalty,
	frequency_penalty,
	repetition_penalty,
	logit_bias,
	metadata,
	reasoning_effort,
	store,
	should_think,
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
		appUrl,
		systemPrompt,
		env,
		user,
		completion_id,
		model,
		messages: formattedMessages,
		message,
		temperature,
		top_p,
		n,
		stream,
		stop,
		max_tokens,
		presence_penalty,
		frequency_penalty,
		repetition_penalty,
		logit_bias,
		metadata,
		reasoning_effort,
		store,
		should_think,
	});

	return response;
}
