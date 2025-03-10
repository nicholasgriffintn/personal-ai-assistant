import type { ChatRole, IEnv, RagOptions, ResponseMode } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { processChatRequest } from "../chat/core";

export interface CreateChatCompletionsRequest {
	model?: string;
	messages: Array<{
		role: ChatRole;
		content:
			| string
			| Array<{
					type: "text" | "image_url";
					text?: string;
					image_url?: {
						url: string;
						detail?: "auto" | "low" | "high";
					};
			  }>;
		name?: string;
	}>;
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	stream?: boolean;
	tools?: {
		type: "function";
		function: {
			name: string;
			description: string;
			parameters: Record<string, any>;
		};
	}[];
	tool_choice?:
		| "none"
		| "auto"
		| { type: "function"; function: { name: string } };
	completion_id?: string;
	use_rag?: boolean;
	rag_options?: RagOptions;
	store?: boolean;
	platform?: "web" | "mobile" | "api";
	budget_constraint?: number;
	response_mode?: ResponseMode;
	location?: { latitude: number; longitude: number };
}

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
	request: CreateChatCompletionsRequest;
	user?: { email: string; longitude?: number; latitude?: number };
	appUrl?: string;
	isRestricted?: boolean;
}): Promise<CreateChatCompletionsResponse> => {
	const { env, request, user, appUrl, isRestricted } = req;

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
		appUrl,
		isRestricted,
		location: request.location || undefined,
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
					role: toolResponse.role,
					content: Array.isArray(toolResponse.content)
						? toolResponse.content.map((c) => c.text || "").join("\n")
						: toolResponse.content,
					citations: toolResponse.citations || null,
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
