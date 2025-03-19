import type { ChatRole, IEnv, IUser } from "../../types";
import type { ChatCompletionParameters } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { processChatRequest } from "../chat/core";

export interface CreateChatCompletionsResponse {
	id: string;
	object: string;
	created: number;
	model?: string;
	choices: Array<{
		index: number;
		message: {
			role: ChatRole;
			content: string;
			tool_calls?: any[];
			citations?: any[] | null;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export const handleCreateChatCompletions = async (req: {
	env: IEnv;
	request: ChatCompletionParameters;
	user?: IUser;
	app_url?: string;
	isRestricted?: boolean;
}): Promise<CreateChatCompletionsResponse> => {
	const { env, request, user, app_url, isRestricted } = req;
	const isStreaming = !!request.stream;

	if (!request.messages?.length) {
		throw new AssistantError(
			"Missing required parameter: messages",
			ErrorType.PARAMS_ERROR,
		);
	}

	const result = await processChatRequest({
		env,
		messages: request.messages,
		response_mode: request.response_mode,
		completion_id: request.completion_id,
		model: request.model,
		use_rag: request.use_rag,
		rag_options: request.rag_options,
		store: request.store,
		platform: request.platform,
		budget_constraint: request.budget_constraint,
		temperature: request.temperature,
		max_tokens: request.max_tokens,
		top_p: request.top_p,
		user,
		app_url,
		isRestricted,
		location: request.location || undefined,
		reasoning_effort: request.reasoning_effort,
		should_think: request.should_think,
		response_format: request.response_format,
		stream: isStreaming,
	});

	if ("validation" in result) {
		return {
			id: env.AI.aiGatewayLogId || result.completion_id || `chat_${Date.now()}`,
			object: "chat.completion",
			created: Date.now(),
			model: result.selectedModel,
			choices: [
				{
					index: 0,
					message: {
						role: "assistant",
						content: result.error,
					},
					finish_reason: "content_filter",
				},
			],
			usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
		};
	}

	if (isStreaming && "stream" in result) {
		return new Response(result.stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	}

	return {
		id: env.AI.aiGatewayLogId || result.completion_id || `chat_${Date.now()}`,
		object: "chat.completion",
		created: Date.now(),
		model: result.selectedModel,
		choices: [
			{
				index: 0,
				message: {
					role: "assistant",
					content: result.response.response,
					tool_calls: result.response.tool_calls,
					citations: result.response.citations || null,
				},
				finish_reason: result.response.tool_calls?.length
					? "tool_calls"
					: "stop",
			},
			...(result.toolResponses?.map((toolResponse, index) => ({
				index: index + 1,
				message: {
					id: toolResponse.id,
					role: toolResponse.role,
					name: toolResponse.name,
					content: Array.isArray(toolResponse.content)
						? toolResponse.content.map((c) => c.text || "").join("\n")
						: toolResponse.content,
					citations: toolResponse.citations || null,
					data: toolResponse.data || null,
					status: toolResponse.status || "unknown",
					timestamp: toolResponse.timestamp,
				},
				finish_reason: "tool_result",
			})) || []),
		],
		usage: result.response.usage || {
			prompt_tokens: 0,
			completion_tokens: 0,
			total_tokens: 0,
		},
	};
};
